#!/bin/bash
# ============================================================
# 自动安全更新配置 — eaglecoder.cn
# 功能：自动安装关键安全补丁，但不自动升级软件版本
# 策略：只更新 security 源，不做大版本升级，保持稳定
# ============================================================

set -e

echo "📦 自动安全更新配置开始..."
echo "================================"

# ---- 步骤 1：安装 unattended-upgrades ----
echo ""
echo "[1/4] 安装 unattended-upgrades..."
apt update -qq
apt install -y unattended-upgrades apt-listchanges
echo "✅ 安装完成"

# ---- 步骤 2：编写配置文件 ----
echo ""
echo "[2/4] 配置自动更新策略..."

cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'UPGRADE_EOF'
// ============================================================
// 自动安全更新配置
// 只更新安全补丁，不做大版本升级
// ============================================================

// 只允许安全更新的源（Ubuntu 安全公告）
Unattended-Upgrade::Allowed-Origins {
  "${distro_id}:${distro_codename}";
  "${distro_id}:${distro_codename}-security";
  // 如果需要稳定的 Bugfix 更新，取消下面注释：
  // "${distro_id}:${distro_codename}-updates";
};

// 禁止更新的包（保持不动）
// 格式: "包名:架构";
Unattended-Upgrade::Package-Blacklist {
  // 生产服务器不自动升级内核（谨慎起见，注释掉即允许）
  // "linux-image-.*";
};

// 自动删除不再需要的依赖
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-New-Unused-Dependencies "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";

// 更新完成后如果需要重启，自动重启
Unattended-Upgrade::Automatic-Reboot "true";
// 如果有用户登录则推迟重启
Unattended-Upgrade::Automatic-Reboot-WithUsers "false";
// 重启等待时间（分钟），给服务充足的关闭时间
Unattended-Upgrade::Automatic-Reboot-Time "03:00";

// 更新遇到错误时发邮件通知（可选，需要配置邮件）
// Unattended-Upgrade::Mail "your-email@example.com";
// 只报告错误
// Unattended-Upgrade::MailReport "on-change";

// 保留下载的 .deb 文件（方便回滚）
Unattended-Upgrade::Keep-Debs-After-Install "false";

// 自动修复中断的更新（dpkg --configure -a）
Unattended-Upgrade::AutoFixInterruptedDpkg "true";

// 最小升级步骤之间等待的时间（秒）
Unattended-Upgrade::MinimalSteps "true";

// 下载更新的带宽限制（KB/s），0 = 不限速
// Unattended-Upgrade::Dl-Limit "70";

// 更新日志级别
Unattended-Upgrade::SyslogLevel "info";
UPGRADE_EOF

echo "✅ 配置文件已写入 /etc/apt/apt.conf.d/50unattended-upgrades"

# ---- 步骤 3：启用自动更新 ----
echo ""
echo "[3/4] 启用自动更新定时任务..."

cat > /etc/apt/apt.conf.d/20auto-upgrades << 'AUTO_EOF'
// ============================================================
// 自动更新触发配置
// ============================================================

// 每天更新源列表
APT::Periodic::Update-Package-Lists "1";

// 每天自动下载可更新的包
APT::Periodic::Download-Upgradeable-Packages "1";

// 每天自动安装安全更新
APT::Periodic::Unattended-Upgrade "1";

// 每 7 天自动清理旧包缓存
APT::Periodic::AutocleanInterval "7";

// 详细的更新日志
APT::Periodic::Verbose "2";
AUTO_EOF

echo "✅ 定时任务已配置（每天凌晨自动检查并安装安全更新）"

# ---- 步骤 4：测试 ----
echo ""
echo "[4/4] 测试自动更新..."
echo "模拟运行（不会实际安装）："
unattended-upgrade --dry-run --verbose 2>&1 | tail -20

echo ""
echo "📦 自动安全更新配置完成！"
echo "================================"
echo ""
echo "📋 配置总结："
echo "   更新策略:  仅安全补丁"
echo "   更新频率:  每天自动检查"
echo "   自动重启:  是（凌晨 3:00）"
echo "   清理旧包:  每 7 天"
echo ""
echo "📁 配置文件："
echo "   /etc/apt/apt.conf.d/20auto-upgrades   — 触发定时"
echo "   /etc/apt/apt.conf.d/50unattended-upgrades — 更新策略"
echo ""
echo "🔍 查看日志："
echo "   cat /var/log/unattended-upgrades/unattended-upgrades.log"
echo ""
echo "💡 手动运行一次更新（安装所有安全补丁）："
echo "   unattended-upgrade -v"
