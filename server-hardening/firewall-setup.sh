#!/bin/bash
# ============================================================
# UFW 防火墙配置 — eaglecoder.cn
# 功能：最小化开放端口，阻断一切不必要的入站连接
# ⚠️  务必确认 SSH 端口 (22222) 在放行列表中，否则会锁自己
# ============================================================

set -e

echo "🧱 UFW 防火墙配置开始..."
echo "================================"

# ---- 步骤 0：审计当前状态 ----
echo ""
echo "[0/5] 当前服务器监听端口审计"
echo "----------------------------"
echo ""
echo "所有监听的 TCP 端口："
ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null
echo ""

# ---- 步骤 1：检查 UFW 是否已安装 ----
echo "[1/5] 检查 UFW 状态..."
if ! command -v ufw &>/dev/null; then
  echo "   安装 UFW..."
  apt update -qq
  apt install -y ufw
  echo "✅ UFW 安装完成"
else
  echo "✅ UFW 已安装"
fi

# 查看当前状态
ufw status verbose || true

# ---- 步骤 2：配置规则 ----
echo ""
echo "[2/5] 配置防火墙规则..."

# 先重置（清除旧规则）
ufw --force reset

# 默认策略：拒绝所有入站，允许所有出站
ufw default deny incoming
ufw default allow outgoing
echo "   ✓ 默认策略：拒绝入站 / 允许出站"

# === 开放必要端口 ===

# SSH — 你的自定义端口
ufw allow 22222/tcp comment 'SSH'
echo "   ✓ 允许 22222/tcp (SSH)"

# HTTP / HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
echo "   ✓ 允许 80/tcp (HTTP)"
echo "   ✓ 允许 443/tcp (HTTPS)"

# 宝塔面板
ufw allow 22844/tcp comment 'BT-Panel'
echo "   ✓ 允许 22844/tcp (宝塔面板)"

# 宝塔面板可能还需要这些端口（按需开启）
# ufw allow 8888/tcp comment 'BT-phpMyAdmin'
# ufw allow 20/tcp comment 'FTP-data'
# ufw allow 21/tcp comment 'FTP'

# === 可选：限制 SSH 频率（防暴力破解） ===
# 60 秒内最多 6 个新连接，超过则拒绝
ufw limit 22222/tcp comment 'SSH rate limit'
echo "   ✓ SSH 频率限制已应用 (60秒内最多6个新连接)"

# === 可选：只允许中国 IP 访问宝塔面板（更安全） ===
# 如果你只在固定 IP 登录，可以改为：
# ufw delete allow 22844/tcp
# ufw allow from YOUR_HOME_IP to any port 22844 proto tcp comment 'BT-Panel restricted'
# echo "   ⚠️  宝塔面板建议只对你家的 IP 开放，目前是全放"

echo ""
echo "[3/5] 预览即将生效的规则："
echo "----------------------------"
ufw show added

# ---- 步骤 4：启用防火墙 ----
echo ""
echo "[4/5] 启用 UFW..."
echo ""
echo "⚠️  确认 SSH 端口 22222 在允许列表中？(上面应能看到 22222)"
echo "    如果看不到，按 Ctrl+C 取消！"
echo ""
read -p "    按 Enter 继续启用防火墙..." DUMMY

ufw --force enable

# ---- 步骤 5：验证 ----
echo ""
echo "[5/5] 验证防火墙状态"
echo "================================"
ufw status numbered
echo ""

# 快速验证：测试 80 端口应该能通
echo "验证 HTTP 端口可达性..."
if curl -sI --connect-timeout 5 http://localhost:80 >/dev/null 2>&1; then
  echo "✅ HTTP (80) 可达"
else
  echo "⚠️  HTTP (80) 测试失败（可能 Nginx 没监听 80）"
fi

echo ""
echo "🧱 防火墙配置完成！"
echo ""
echo "📋 当前开放端口："
echo "   22222/tcp — SSH (限速)"
echo "   80/tcp   — HTTP"
echo "   443/tcp  — HTTPS"
echo "   22844/tcp — 宝塔面板"
echo ""
echo "💡 后续可以用以下命令管理防火墙："
echo "   ufw status numbered    — 查看规则"
echo "   ufw allow <port>       — 开放端口"
echo "   ufw delete <number>    — 删除规则"
echo "   ufw disable            — 临时关闭防火墙"
