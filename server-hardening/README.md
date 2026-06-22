# 🔒 服务器安全加固指南 — eaglecoder.cn

## 背景

你的服务器目前暴露在公网上，每天都有自动化扫描器在尝试攻击它（SSH 暴力破解、漏洞扫描、敏感路径探测）。这些脚本能帮你用最小的学习成本，把防御力提升到**个人网站的良好水准**。

## 原理（先理解再操作）

服务器安全分 **5 层**，我们逐一加固：

| 层级 | 做什么 | 防什么 |
|------|--------|--------|
| 🔥 防火墙 | 只开放必要端口，其余全拒绝 | 端口扫描、未授权访问 |
| 🔑 SSH | 仅密钥登录、限制尝试次数 | 暴力猜密码 |
| 🛡️ Fail2ban | 自动封禁攻击 IP | 持续暴力破解、扫描 |
| 📦 自动更新 | 安全补丁自动装 | 已知漏洞利用 |
| 🏷️ 安全头 | 告诉浏览器怎么处理你的页面 | XSS、点击劫持、MIME嗅探 |

## 执行顺序

> ⚠️ **每步执行前请先读完本节说明，不要跳步！**

### 第 0 步：上传文件到服务器

```bash
# 在你本地（Windows）的 Git Bash 中执行：
# 把这些脚本上传到服务器
scp -P 22222 server-hardening/*.sh root@43.135.51.209:/root/
scp -P 22222 server-hardening/nginx-security-headers.conf root@43.135.51.209:/root/
```

如果 SCP 不通，可以把文件内容复制到宝塔面板的「文件」里手动创建。

---

### 第 1 步：安全审计（先看现状）

```bash
ssh -p 22222 root@43.135.51.209
bash /root/security-audit.sh
```

**这步不做任何修改**，只是看看当前哪里有问题。记下评分和红色 ❌ 项目。

---

### 第 2 步：防火墙（第一个做，防止后面配置时被打扰）

```bash
bash /root/firewall-setup.sh
```

**它做了什么：**
- 安装 UFW
- 默认拒绝所有入站连接
- 只开 80 (HTTP)、443 (HTTPS)、22222 (SSH)、22844 (宝塔面板)
- SSH 端口加了限速（60 秒最多 6 个新连接）

**为什么先做防火墙：** 防火墙是最外层防线，先把它立起来，后面配 SSH 和 Fail2ban 时更有底气。

**确认点：** 脚本执行完后，再跑一次 `ufw status numbered`，确认 22222 在列表里。

---

### 第 3 步：SSH 加固（谨慎！先准备好密钥）

> ⚠️ **做这一步之前必须确认：你已经有 SSH 密钥，并且公钥在服务器上！**

检查方法：
```bash
# 在服务器上执行：
cat /root/.ssh/authorized_keys
# 应该能看到一或多行 ssh-rsa... 或 ssh-ed25519...
```

如果文件不存在或为空，**先配密钥再执行：**
```bash
# 在你本地生成密钥（如果还没有）：
ssh-keygen -t ed25519 -C "eaglecoder"

# 把公钥传到服务器：
ssh-copy-id -p 22222 root@43.135.51.209
```

确认密钥登录没问题后（开两个终端窗口，一个保持登录，一个测试新连接），再执行：

```bash
bash /root/ssh-hardening.sh
```

**它做了什么：**
- 备份原配置
- 禁止密码登录（只用密钥）
- 限制错误尝试最多 3 次
- 空闲 10 分钟自动断开
- 强制使用强加密算法

**为什么先确认密钥：** 一旦禁用密码登录，如果你没有密钥就再也连不上了。宝塔终端可以救，但麻烦。

---

### 第 4 步：Fail2ban（自动封禁攻击者）

```bash
bash /root/fail2ban-setup.sh
```

**它做了什么：**
- 监控 SSH 日志：3 次失败 → 自动封禁 IP 2 小时
- 监控 Nginx 日志：频繁 404（扫站行为）→ 自动封禁
- 监控 Nginx 日志：恶意请求（SQL注入/XSS探测）→ 自动封禁
- 多次违规的 IP 封禁时间翻倍

**为什么需要 Fail2ban：** 防火墙只能控制谁可以连，Fail2ban 能识别"正在攻击"的行为并动态封堵。

**验证：**
```bash
fail2ban-client status sshd    # 看 SSH 防护状态
fail2ban-client status nginx-404  # 看 Nginx 防护状态
```

---

### 第 5 步：自动安全更新

```bash
bash /root/auto-updates.sh
```

**它做了什么：**
- 每天自动检查安全更新
- 只安装安全补丁（不动大版本）
- 需要重启时凌晨 3 点自动重启
- 每 7 天清理旧包

**为什么只装安全更新：** 大版本升级可能引入不兼容，安全补丁则很安全。这是个"稳妥"策略。

---

### 第 6 步：Nginx 安全头（在宝塔面板操作）

这一步不需要 SSH，在宝塔面板里操作：

1. 登录宝塔面板 → 网站 → eaglecoder.cn → 配置文件

2. 找到 `server` 块（一般在 `server_name eaglecoder.cn;` 下面）

3. 把 `/root/nginx-security-headers.conf` 的内容**复制**到 `server` 块内

   或者用这条 include 指令（更优雅）：
   ```nginx
   include /root/nginx-security-headers.conf;
   ```

4. 保存 → 重载 Nginx

5. 验证：
   ```bash
   curl -sI https://eaglecoder.cn | grep -E 'Content-Security|X-Frame|X-Content|Referrer|Strict'
   ```
   应该能看到 5-6 个安全头。

**每个头的解释：**

| 头部 | 一句话解释 |
|------|-----------|
| Content-Security-Policy | "只能加载我指定的来源" — 防 XSS |
| X-Frame-Options: DENY | "不允许别的网站把我的页面嵌在 iframe 里" — 防点击劫持 |
| X-Content-Type-Options: nosniff | "不要猜文件类型，我说是什么就是什么" |
| Referrer-Policy | "跳转时不要泄露完整 URL" |
| Permissions-Policy | "这个网站不需要摄像头/麦克风/定位" |
| HSTS | "浏览器记住：以后只能用 HTTPS 访问" — 已配置，确认 |

---

## 加固后再审计

全部做完后，再跑一次审计看分数提升：

```bash
bash /root/security-audit.sh
```

目标评分：**85+（优秀）**

---

## 日常维护

加固不是一劳永逸的，需要偶尔看一眼：

```bash
# 每月检查一次（在服务器上）：
ufw status                     # 防火墙有没有被改
fail2ban-client status sshd    # 封了多少攻击
apt list --upgradable | grep security  # 有没有积压的安全更新
tail -50 /var/log/fail2ban.log         # 最近封禁记录
```

---

## 紧急恢复

如果某步操作后出了问题（比如连不上 SSH），可以通过**宝塔面板 → 终端**登录执行：

```bash
# 恢复 SSH 配置
cp /etc/ssh/sshd_config.bak.* /etc/ssh/sshd_config && systemctl restart sshd

# 关闭防火墙
ufw disable

# 停止 Fail2ban
systemctl stop fail2ban
```

---

## 文件清单

```
server-hardening/
├── README.md                    ← 你正在读的文件
├── security-audit.sh           ← 安全审计（纯检查，不改东西）
├── firewall-setup.sh           ← UFW 防火墙
├── ssh-hardening.sh            ← SSH 加固
├── fail2ban-setup.sh           ← Fail2ban 入侵防护
├── auto-updates.sh             ← 自动安全更新
└── nginx-security-headers.conf ← Nginx 安全头
```

按顺序执行，每一步都理解它在做什么再动手。💪
