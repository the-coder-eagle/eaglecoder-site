#!/bin/bash
# ============================================================
# Fail2ban 配置 — eaglecoder.cn
# 功能：自动封禁暴力破解 IP，保护 SSH、Nginx
# 原理：监控日志，超过尝试次数的 IP 自动被临时拉黑
# ============================================================

set -e

echo "🛡️  Fail2ban 配置开始..."
echo "================================"

# ---- 步骤 0：安装 ----
echo ""
echo "[0/5] 安装 Fail2ban..."
apt update -qq
apt install -y fail2ban
echo "✅ 安装完成"

# ---- 步骤 1：创建本地配置覆盖文件 ----
# 不直接修改 /etc/fail2ban/jail.conf（它会在升级时被覆盖）
# 在 jail.local 里覆盖需要的设置

echo ""
echo "[1/5] 创建 SSH 防护规则..."

cat > /etc/fail2ban/jail.local << 'JAIL_EOF'
# ============================================================
# Fail2ban 本地配置 — eaglecoder.cn
# 优先级高于 jail.conf，不会被升级覆盖
# ============================================================

[DEFAULT]
# 封禁时长（秒）：1 小时
bantime = 3600
# 封禁时长增量：多次被封时间会越来越长
# 第1次 1h，第2次 2h，第3次 4h...
bantime.increment = true
bantime.multipliers = 1 2 4 8 16 32
bantime.maxtime = 86400
# 在这个时间内达到 maxretry 次失败就封禁
findtime = 600
# 最大重试次数
maxretry = 3
# 忽略本机 IP（永远不封自己）
ignoreip = 127.0.0.1/8 ::1
# 后端（读取 systemd 日志）
backend = systemd

# === SSH 防护 ===
[sshd]
enabled = true
port = 22222
logpath = %(sshd_log)s
maxretry = 3
findtime = 600
bantime = 7200
# 模式：监控失败登录、root 登录尝试
mode = aggressive

# === Nginx 防护 ===
# 注意：这些过滤器需要 Nginx 日志路径正确

# 1. 封禁反复尝试不存在路径的 IP（扫站行为）
[nginx-404]
enabled = true
port = http,https
logpath = /www/wwwlogs/eaglecoder.cn.log
maxretry = 30
findtime = 60
bantime = 3600
# 1 分钟内 30 次 404 = 疑似扫描

# 2. 封禁尝试访问敏感路径的 IP
[nginx-bad-request]
enabled = true
port = http,https
logpath = /www/wwwlogs/eaglecoder.cn.log
maxretry = 3
findtime = 300
bantime = 7200

# 3. 封禁尝试 SQL 注入 / XSS 的 IP
[nginx-botsearch]
enabled = true
port = http,https
logpath = /www/wwwlogs/eaglecoder.cn.log
maxretry = 2
findtime = 300
bantime = 7200

JAIL_EOF

echo "✅ SSH + Nginx 防护规则已配置"

# ---- 步骤 2：确认 Nginx 日志路径 ----
echo ""
echo "[2/5] 检查 Nginx 日志路径..."

# 宝塔的 Nginx 日志通常在 /www/wwwlogs/
if [ -d /www/wwwlogs ]; then
  echo "✅ 日志目录存在: /www/wwwlogs/"
  ls -la /www/wwwlogs/*.log 2>/dev/null | head -5
else
  echo "⚠️  /www/wwwlogs/ 不存在，尝试查找日志位置..."
  find /www -name "*.log" -path "*nginx*" 2>/dev/null | head -5
fi

# ---- 步骤 3：创建 Nginx 专用过滤器 ----
echo ""
echo "[3/5] 创建 Nginx 错误请求过滤器..."

cat > /etc/fail2ban/filter.d/nginx-bad-request.local << 'FILTER_EOF'
[Definition]
failregex = ^<HOST> .* "(GET|POST|HEAD).*" (400|444|403) .*$
            ^<HOST> .* client sent invalid request .*$
ignoreregex =
FILTER_EOF

echo "✅ 过滤器已创建"

# ---- 步骤 4：启动服务 ----
echo ""
echo "[4/5] 启动 Fail2ban..."

systemctl enable fail2ban
systemctl restart fail2ban

# 等待启动
sleep 2

if systemctl is-active --quiet fail2ban; then
  echo "✅ Fail2ban 服务运行正常"
else
  echo "❌ 启动失败，请检查日志：journalctl -xeu fail2ban"
  exit 1
fi

# ---- 步骤 5：验证 ----
echo ""
echo "[5/5] 验证防护状态"
echo "================================"

# 列出所有启用的监狱
echo ""
echo "已启用的防护规则："
fail2ban-client status 2>/dev/null | grep "Jail list" || echo "  加载中..."

echo ""
echo "SSH 防护状态："
fail2ban-client status sshd 2>/dev/null || echo "  （稍等片刻再查看）"

echo ""
echo "🛡️  Fail2ban 配置完成！"
echo "================================"
echo ""
echo "📋 配置总结："
echo "   SSH 防护:       3次失败 → 封禁2小时"
echo "   Nginx 404扫描:  60秒内30次 → 封禁1小时"
echo "   Nginx 恶意请求: 5分钟内3次 → 封禁2小时"
echo "   累积惩罚:       重复违规封禁时间翻倍"
echo ""
echo "🔍 常用命令："
echo "   fail2ban-client status              — 查看所有监狱状态"
echo "   fail2ban-client status sshd         — 查看 SSH 封禁统计"
echo "   fail2ban-client set sshd unbanip IP — 解封某个 IP"
echo "   fail2ban-client banned              — 列出所有被封 IP"
echo "   zgrep 'Ban' /var/log/fail2ban.log   — 查看封禁记录"
