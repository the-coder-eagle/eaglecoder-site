#!/bin/bash
# ============================================================
# 🔍 服务器安全审计脚本 — eaglecoder.cn
# 功能：一键检查当前安全状态，生成评分和建议
# 使用：bash security-audit.sh
# ============================================================

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║     🔍 服务器安全审计 — eaglecoder.cn         ║"
echo "║     $(date '+%Y-%m-%d %H:%M:%S')                  ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

PASS=0
FAIL=0
WARN=0

check_pass() { echo "  ✅ $1"; PASS=$((PASS + 1)); }
check_fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }
check_warn() { echo "  ⚠️  $1"; WARN=$((WARN + 1)); }

# ═══════════════════════════════════════════
# 1. 系统信息
# ═══════════════════════════════════════════
echo "━━━ [1] 系统信息 ━━━"
echo "  主机名:     $(hostname)"
echo "  系统版本:   $(cat /etc/os-release | grep PRETTY | cut -d'"' -f2)"
echo "  内核版本:   $(uname -r)"
echo "  运行时间:   $(uptime -p)"
echo "  最后启动:   $(who -b | awk '{print $3, $4}')"
echo ""

# ═══════════════════════════════════════════
# 2. 用户与权限
# ═══════════════════════════════════════════
echo "━━━ [2] 用户与权限审计 ━━━"

# 检查是否有空密码用户
EMPTY_PASS=$(awk -F: '($2 == "" || $2 == "!") {next} ($2 == "*" || $2 == "x") {next} {print $1}' /etc/shadow 2>/dev/null)
if [ -z "$EMPTY_PASS" ]; then
  check_pass "无空密码用户"
else
  check_fail "存在空密码或弱密码用户: $EMPTY_PASS"
fi

# 检查非 root 且 UID=0 的用户
ROOT_USERS=$(awk -F: '($3 == 0 && $1 != "root") {print $1}' /etc/passwd 2>/dev/null)
if [ -z "$ROOT_USERS" ]; then
  check_pass "只有 root 拥有 UID 0"
else
  check_fail "存在其他 UID=0 用户: $ROOT_USERS"
fi

# 检查 sudo 组成员
SUDO_USERS=$(getent group sudo 2>/dev/null | cut -d: -f4)
echo "  ℹ️  sudo 组成员: ${SUDO_USERS:-无}"

# 检查可登录的用户
LOGIN_USERS=$(grep -v '/nologin\|/false\|/sync\|/shutdown\|/halt' /etc/passwd | cut -d: -f1)
echo "  ℹ️  可登录用户: $(echo $LOGIN_USERS | tr '\n' ' ')"

echo ""

# ═══════════════════════════════════════════
# 3. SSH 配置审计
# ═══════════════════════════════════════════
echo "━━━ [3] SSH 配置审计 ━━━"

SSHD="/etc/ssh/sshd_config"

get_sshd() {
  grep -E "^${1} " "$SSHD" 2>/dev/null | awk '{print $2}' || echo "未设置"
}

SSH_PORT=$(get_sshd "Port")
SSH_PASS=$(get_sshd "PasswordAuthentication")
SSH_ROOT=$(get_sshd "PermitRootLogin")
SSH_EMPTY=$(get_sshd "PermitEmptyPasswords")

echo "  端口:         $SSH_PORT"
[ "$SSH_PORT" != "22" ] && check_pass "SSH 使用非标准端口 ($SSH_PORT)" || check_warn "SSH 使用默认端口 22，建议修改"

echo "  密码认证:     $SSH_PASS"
[ "$SSH_PASS" = "no" ] && check_pass "SSH 密码认证已禁用" || check_warn "SSH 仍允许密码登录"

echo "  Root 登录:    $SSH_ROOT"
[ "$SSH_ROOT" = "prohibit-password" ] || [ "$SSH_ROOT" = "no" ] && check_pass "Root 登录受限" || check_warn "Root 可直接密码登录"

echo "  空密码:       $SSH_EMPTY"
[ "$SSH_EMPTY" = "no" ] && check_pass "空密码登录已禁止" || check_fail "允许空密码登录"

# 检查是否有 authorized_keys
if [ -f /root/.ssh/authorized_keys ]; then
  KEY_COUNT=$(grep -c 'ssh-' /root/.ssh/authorized_keys 2>/dev/null || echo 0)
  echo "  SSH 密钥数量: $KEY_COUNT"
  [ "$KEY_COUNT" -gt 0 ] && check_pass "已配置 SSH 密钥" || check_warn "未配置 SSH 密钥"
else
  check_warn "未找到 /root/.ssh/authorized_keys"
fi

echo ""

# ═══════════════════════════════════════════
# 4. 防火墙审计
# ═══════════════════════════════════════════
echo "━━━ [4] 防火墙审计 ━━━"

if command -v ufw &>/dev/null; then
  UFW_STATUS=$(ufw status 2>/dev/null | grep "Status" | awk '{print $2}')
  echo "  UFW 状态:     $UFW_STATUS"
  if [ "$UFW_STATUS" = "active" ]; then
    check_pass "UFW 防火墙已启用"
    echo ""
    echo "  当前开放端口："
    ufw status numbered 2>/dev/null | grep -E 'ALLOW|LIMIT' | while read line; do
      echo "    $line"
    done
  else
    check_fail "UFW 防火墙未启用"
  fi
else
  check_fail "UFW 未安装"
fi

# 检查 iptables（如果 UFW 没装）
if [ "$UFW_STATUS" != "active" ]; then
  IPT_RULES=$(iptables -L -n 2>/dev/null | grep -c 'ACCEPT\|DROP' || echo 0)
  echo "  iptables 规则数: $IPT_RULES"
  [ "$IPT_RULES" -gt 0 ] && check_pass "iptables 有规则" || check_fail "iptables 无规则（裸奔）"
fi

echo ""

# ═══════════════════════════════════════════
# 5. 开放端口审计
# ═══════════════════════════════════════════
echo "━━━ [5] 开放端口审计 ━━━"

echo "  当前监听端口："
ss -tlnp 2>/dev/null | awk 'NR>1 {printf "    %-20s %s\n", $4, $NF}' | sort -u
echo ""

# 检查是否有不应该暴露的端口
ss -tlnp 2>/dev/null | grep -q '0.0.0.0:3306' && check_fail "MySQL 暴露在公网 (3306)" || check_pass "MySQL 未暴露在公网"
ss -tlnp 2>/dev/null | grep -q '0.0.0.0:6379' && check_fail "Redis 暴露在公网 (6379)" || check_pass "Redis 未暴露在公网"
ss -tlnp 2>/dev/null | grep -q '0.0.0.0:27017' && check_fail "MongoDB 暴露在公网 (27017)" || check_pass "MongoDB 未暴露在公网"

echo ""

# ═══════════════════════════════════════════
# 6. Fail2ban 审计
# ═══════════════════════════════════════════
echo "━━━ [6] Fail2ban 审计 ━━━"

if command -v fail2ban-client &>/dev/null; then
  if systemctl is-active --quiet fail2ban 2>/dev/null; then
    check_pass "Fail2ban 正在运行"
    echo ""
    echo "  活跃的防护规则："
    fail2ban-client status 2>/dev/null | grep "Jail list" || true

    # 检查 SSH 监狱
    if fail2ban-client status sshd &>/dev/null 2>&1; then
      BANNED=$(fail2ban-client status sshd 2>/dev/null | grep "Currently banned" | awk '{print $4}')
      echo "  SSH 当前封禁 IP: ${BANNED:-0}"
    fi
  else
    check_warn "Fail2ban 已安装但未运行"
  fi
else
  check_fail "Fail2ban 未安装（建议安装）"
fi

echo ""

# ═══════════════════════════════════════════
# 7. 自动更新审计
# ═══════════════════════════════════════════
echo "━━━ [7] 自动更新审计 ━━━"

if [ -f /etc/apt/apt.conf.d/20auto-upgrades ]; then
  check_pass "自动更新已配置"
  grep -q 'Unattended-Upgrade "1"' /etc/apt/apt.conf.d/20auto-upgrades && check_pass "安全更新已启用" || check_warn "安全更新未确认启用"
else
  check_fail "自动更新未配置"
fi

# 检查待更新的安全补丁数量
SECURITY_UPDATES=$(apt list --upgradable 2>/dev/null | grep -c 'security' || echo 0)
echo "  ℹ️  待安装安全更新: $SECURITY_UPDATES 个"

# 上次更新时间
LAST_UPDATE=$(stat -c %Y /var/cache/apt/pkgcache.bin 2>/dev/null || echo 0)
NOW=$(date +%s)
DAYS_SINCE=$(( (NOW - LAST_UPDATE) / 86400 ))
if [ "$DAYS_SINCE" -le 7 ]; then
  echo "  ℹ️  上次更新源: ${DAYS_SINCE} 天前"
else
  check_warn "超过 7 天未更新软件源 ($DAYS_SINCE 天)"
fi

echo ""

# ═══════════════════════════════════════════
# 8. Web 安全头审计
# ═══════════════════════════════════════════
echo "━━━ [8] Web 安全头审计 ━━━"

# 获取本机 Nginx 响应头
SERVER_IP="127.0.0.1"
DOMAINS="eaglecoder.cn localhost"

for DOMAIN in $DOMAINS; do
  RESPONSE=$(curl -sI --connect-timeout 3 -H "Host: $DOMAIN" "http://$SERVER_IP" 2>/dev/null || true)
  if [ -n "$RESPONSE" ]; then
    echo "  [$DOMAIN]"

    echo "$RESPONSE" | grep -qi 'Content-Security-Policy' && check_pass "CSP 已设置" || check_fail "缺少 Content-Security-Policy"
    echo "$RESPONSE" | grep -qi 'X-Frame-Options' && check_pass "X-Frame-Options 已设置" || check_fail "缺少 X-Frame-Options"
    echo "$RESPONSE" | grep -qi 'X-Content-Type-Options' && check_pass "X-Content-Type-Options 已设置" || check_fail "缺少 X-Content-Type-Options"
    echo "$RESPONSE" | grep -qi 'Referrer-Policy' && check_pass "Referrer-Policy 已设置" || check_fail "缺少 Referrer-Policy"
    echo "$RESPONSE" | grep -qi 'Strict-Transport-Security' && check_pass "HSTS 已设置" || check_warn "缺少 Strict-Transport-Security"
    echo "$RESPONSE" | grep -qi '^Server: nginx$' && check_warn "Nginx 版本号暴露 (Server 头)" || check_pass "Server 头已隐藏"
    break
  fi
done

echo ""

# ═══════════════════════════════════════════
# 9. 服务审计
# ═══════════════════════════════════════════
echo "━━━ [9] 运行服务审计 ━━━"

# 列出正在运行的服务
RUNNING_SERVICES=$(systemctl list-units --type=service --state=running 2>/dev/null | grep '\.service' | awk '{print $1}' | grep -v '^●' | grep -v '^$')
SERVICE_COUNT=$(echo "$RUNNING_SERVICES" | grep -c '.' 2>/dev/null || echo 0)
echo "  ℹ️  正在运行的服务: $SERVICE_COUNT 个"

# 检查可疑的服务
echo "$RUNNING_SERVICES" | grep -qi 'telnet' && check_fail "Telnet 服务在运行（不安全）" || true
echo "$RUNNING_SERVICES" | grep -qi 'ftp' && check_warn "FTP 服务在运行（考虑用 SFTP 替代）" || true

echo ""

# ═══════════════════════════════════════════
# 10. 内核安全参数
# ═══════════════════════════════════════════
echo "━━━ [10] 内核安全参数 ━━━"

# 检查 IP 转发（服务器通常不需要）
IP_FORWARD=$(sysctl -n net.ipv4.ip_forward 2>/dev/null)
[ "$IP_FORWARD" = "0" ] && check_pass "IP 转发已关闭" || check_warn "IP 转发已开启"

# 检查 ICMP 广播回复
ICMP_BCAST=$(sysctl -n net.ipv4.icmp_echo_ignore_broadcasts 2>/dev/null)
[ "$ICMP_BCAST" = "1" ] && check_pass "ICMP 广播已忽略" || check_warn "ICMP 广播未忽略"

# 检查源路由
SRC_ROUTE=$(sysctl -n net.ipv4.conf.all.accept_source_route 2>/dev/null)
[ "$SRC_ROUTE" = "0" ] && check_pass "源路由已禁用" || check_warn "源路由未禁用"

echo ""

# ═══════════════════════════════════════════
# 最终评分
# ═══════════════════════════════════════════
echo "╔════════════════════════════════════════════════╗"
echo "║              📊 安全审计结果                   ║"
echo "╠════════════════════════════════════════════════╣"

TOTAL=$((PASS + FAIL + WARN))
SCORE=$(( PASS * 100 / TOTAL ))

printf "║  通过:  %2d  失败:  %2d  警告:  %2d           ║\n" $PASS $FAIL $WARN
printf "║  安全评分:  %d / 100                         ║\n" $SCORE

# 评级
if   [ "$SCORE" -ge 85 ]; then RATING="🟢 优秀 — 防护到位！"
elif [ "$SCORE" -ge 60 ]; then RATING="🟡 良好 — 还有改进空间"
else RATING="🔴 较差 — 建议立即加固"
fi
printf "║  评级: %-40s ║\n" "$RATING"

echo "╚════════════════════════════════════════════════╝"
echo ""
echo "💡 下一步：按照 README.md 依次执行加固脚本"
echo "   1. firewall-setup.sh    — 防火墙"
echo "   2. ssh-hardening.sh     — SSH 加固"
echo "   3. fail2ban-setup.sh    — 入侵防护"
echo "   4. auto-updates.sh      — 自动更新"
echo "   5. 部署 Nginx 安全头"
