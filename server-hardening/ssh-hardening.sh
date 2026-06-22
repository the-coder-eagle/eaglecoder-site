#!/bin/bash
# ============================================================
# SSH 加固脚本 — eaglecoder.cn
# 功能：增强 SSH 安全性，防止暴力破解
# ⚠️  执行前请确保：
#     1. 你已经配置好 SSH 密钥并能用密钥登录
#     2. 保持一个 SSH 会话开着，用另一个会话测试配置
#     3. 如果被锁，可以通过宝塔终端恢复
# ============================================================

set -e

SSHD_CONFIG="/etc/ssh/sshd_config"
BACKUP="${SSHD_CONFIG}.bak.$(date +%Y%m%d_%H%M%S)"

echo "🔐 SSH 安全加固开始..."
echo "================================"

# ---- 步骤 0：备份原配置 ----
echo ""
echo "[0/6] 备份当前配置 → $BACKUP"
cp "$SSHD_CONFIG" "$BACKUP"
echo "✅ 备份完成"

# ---- 步骤 1：检查密钥认证是否可用 ----
echo ""
echo "[1/6] 检查密钥认证状态..."
if [ -f /root/.ssh/authorized_keys ]; then
  KEY_COUNT=$(grep -c 'ssh-' /root/.ssh/authorized_keys 2>/dev/null || echo 0)
  echo "✅ 发现 $KEY_COUNT 个已授权的 SSH 公钥"
  cat /root/.ssh/authorized_keys | head -3
else
  echo "❌ /root/.ssh/authorized_keys 不存在！"
  echo "   在禁用密码登录前，请先添加你的公钥："
  echo "   mkdir -p /root/.ssh && chmod 700 /root/.ssh"
  echo "   然后把公钥追加到 /root/.ssh/authorized_keys"
  echo "   chmod 600 /root/.ssh/authorized_keys"
  echo ""
  echo "   ⚠️  脚本继续，但不会禁用密码登录"
fi

# ---- 步骤 2：修改 SSH 配置 ----
echo ""
echo "[2/6] 应用安全配置..."

# 读取当前端口号（保留你自定义的 22222）
CURRENT_PORT=$(grep -E '^Port ' "$SSHD_CONFIG" | awk '{print $2}')
if [ -z "$CURRENT_PORT" ]; then
  CURRENT_PORT=22222
  echo "未找到 Port 配置，默认使用 22222"
fi
echo "   当前 SSH 端口: $CURRENT_PORT"

# 用 sed 修改配置
update_sshd() {
  local key="$1"
  local value="$2"
  if grep -qE "^#?\s*${key}\s" "$SSHD_CONFIG"; then
    sed -i "s|^#\?\s*${key}\s.*|${key} ${value}|" "$SSHD_CONFIG"
  else
    echo "${key} ${value}" >> "$SSHD_CONFIG"
  fi
  echo "   ✓ ${key} = ${value}"
}

# 端口保持不变
update_sshd "Port" "$CURRENT_PORT"

# 禁止 root 用密码登录（密钥仍然可以用）
# 这是最关键的一条：有密钥的人能进，没密钥的猜密码也不行
update_sshd "PermitRootLogin" "prohibit-password"

# 禁止密码认证（仅密钥登录）
if [ -f /root/.ssh/authorized_keys ] && [ $(grep -c 'ssh-' /root/.ssh/authorized_keys 2>/dev/null || echo 0) -gt 0 ]; then
  update_sshd "PasswordAuthentication" "no"
  update_sshd "ChallengeResponseAuthentication" "no"
  update_sshd "UsePAM" "yes"  # PAM 还可以用（不影响密钥登录）
else
  echo "   ⚠️  跳过禁用密码登录（没有找到密钥）"
fi

# 禁止空密码登录
update_sshd "PermitEmptyPasswords" "no"

# 最大认证尝试次数（输错 3 次就断开）
update_sshd "MaxAuthTries" "3"

# 减少登录等待时间（默认 120 秒太长）
update_sshd "LoginGraceTime" "30"

# 客户端空闲超时（10 分钟无操作自动断开）
update_sshd "ClientAliveInterval" "300"
update_sshd "ClientAliveCountMax" "2"

# 最大并发会话数
update_sshd "MaxSessions" "5"

# 最大启动连接数（未认证状态）
update_sshd "MaxStartups" "3:50:10"

# 禁用不必要的功能
update_sshd "X11Forwarding" "no"
update_sshd "AllowAgentForwarding" "no"
update_sshd "AllowTcpForwarding" "yes"  # 保留端口转发（有时需要）

# 只允许 IPv4（如果你的服务器支持 IPv6 且你要用，改成 inet）
# update_sshd "AddressFamily" "inet"

# 强加密算法（防止弱加密被利用）
update_sshd "Ciphers" "chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com"
update_sshd "MACs" "hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com"
update_sshd "KexAlgorithms" "curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group16-sha512"

# 禁用不安全的转发
update_sshd "GatewayPorts" "no"
update_sshd "PermitTunnel" "no"

echo ""
echo "[3/6] 检查配置语法..."
if sshd -t; then
  echo "✅ 配置语法正确"
else
  echo "❌ 配置有错误！正在恢复备份..."
  cp "$BACKUP" "$SSHD_CONFIG"
  echo "⚠️  已恢复原配置，请检查问题"
  exit 1
fi

echo ""
echo "[4/6] 重启 SSH 服务..."
systemctl restart sshd
echo "✅ SSH 服务已重启"

echo ""
echo "[5/6] 验证 SSH 服务状态..."
if systemctl is-active --quiet sshd; then
  echo "✅ SSH 服务运行正常"
else
  echo "❌ SSH 服务启动失败！"
  echo "   如果当前连接断开，请通过宝塔终端恢复："
  echo "   cp $BACKUP $SSHD_CONFIG && systemctl restart sshd"
  exit 1
fi

echo ""
echo "[6/6] 配置总结"
echo "================================"
echo "  SSH 端口:         $CURRENT_PORT"
echo "  Root 登录方式:    仅密钥 (prohibit-password)"
echo "  密码登录:         $(grep '^PasswordAuthentication' $SSHD_CONFIG | awk '{print $2}')"
echo "  空密码:           禁止"
echo "  最大尝试:         3 次"
echo "  登录宽限期:        30 秒"
echo "  空闲超时:          10 分钟"
echo "  备份文件:         $BACKUP"
echo "================================"
echo ""
echo "🔒 SSH 加固完成！"
echo ""
echo "⚠️  重要：打开一个新的终端窗口测试 SSH 连接，确认能连上再关闭当前会话！"
echo "   ssh -p $CURRENT_PORT root@$(hostname -I | awk '{print $1}')"
