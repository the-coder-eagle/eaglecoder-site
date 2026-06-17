---
title: "建站日志：从零到上线，一个个人网站的诞生"
description: "记录花 5 个小时，从买域名、租服务器到搭建 Astro 博客的全过程。"
publishedAt: 2026-06-17
tags: ["建站", "Astro", "Nginx", "GitHub Actions", "宝塔"]
---

## 背景

大一快结束了，想搭个个人网站。用途三个：

- 写学习笔记
- 展示做的小项目
- 存档各种文档

买了腾讯云香港服务器（2C2G，半年 ¥168）和域名 `eaglecoder.cn`（3 年 ¥100），开干。

## 技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Astro | 静态生成，Markdown 写内容，默认零 JS |
| 样式 | Tailwind CSS 4 | 业界主流，学了不亏 |
| 服务器 | Ubuntu 24.04 + Nginx | 稳定 |
| 面板 | 宝塔 | 第一次搞服务器，图形界面省心 |
| 部署 | GitHub Actions / cron | 推送自动更新 |
| 评论 | Giscus（待配置） | 免费，基于 GitHub Discussions |

## 过程

### 1. 买域名和服务器

腾讯云双十一（？）活动，香港轻量服务器半年 ¥168，域名 3 年 ¥100。备案不需要，买了就能用。

### 2. 初始化 Astro 项目

用了 Astro 6 + Tailwind CSS 4。踩了一个坑：Astro v6 的 content collection API 变了，`config.ts` 要放 `src/content.config.ts`，且要用 loader 语法。翻文档解决了。

网站结构：

```
/src
  /content          ← Markdown 文件存这里
    /posts          ← 博客文章
    /projects       ← 项目展示
    /docs           ← 文档存档
  /pages            ← 页面路由
  /components       ← 复用组件
  /layouts          ← 页面布局
```

### 3. 服务器装宝塔

一条命令的事。装完在腾讯云防火墙放行 22844（宝塔面板）、80（HTTP）、443（HTTPS）。

### 4. 配置 Nginx + SSL

宝塔里建站，绑定域名，一键申请 Let's Encrypt 证书。把本地的 `dist/` 文件拖上去，网站就亮了。

### 5. 自动部署

折腾了两小时。GitHub Actions 的 `easingthemes/ssh-deploy` Action 有 libcrypto 兼容问题，换了三种密钥格式（OpenSSH → RSA PEM → PKCS8）才解决。

最后又发现 GitHub Actions 的海外 IP 连不到香港服务器。换了个方案：

- 服务器每 12 小时自动 `git pull` + `npm run build` + `rsync`
- 用 cron 定时跑

不是最优方案，但跑得挺好。

### 6. 安全加固

刚装完就收到腾讯云告警——美国 IP 在扫 root 登录。把 SSH 端口从 22 改到 22222，瞬间清净了。

## 踩过的坑

1. **Astro v6 content loader 语法**：旧版 `type: 'content'` 不兼容，得用 `loader: glob()`
2. **SSH 密钥格式**：`easingthemes/ssh-deploy` 认 PKCS8，不认 OpenSSH
3. **Git 远程 URL**：有个全局 `url.insteadof` 配置把 SSH 转成了 HTTPS，push 一直失败
4. **Shell 换行**：宝塔终端复制命令经常被换行截断，后来用文件管理器手动编辑更稳

## 花费

| 项目 | 费用 |
|------|------|
| 域名（3年） | ¥100 |
| 服务器（半年） | ¥168 |
| 总计 | ¥268 |

## 后续

- [ ] 配 Giscus 评论区
- [ ] 加 Pagefind 搜索
- [ ] 多写文章。立个 flag：每周一篇

---

这个网站本身就是我的第一个展示项目。以后回头看这篇日志，都是起点 🚀
