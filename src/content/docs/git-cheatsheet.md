---
title: "Git 速查"
description: "常用 Git 命令速查表"
order: 1
category: "开发工具"
---

## 基础命令

```bash
git init          # 初始化仓库
git clone <url>   # 克隆仓库
git status        # 查看状态
git add .         # 暂存所有改动
git commit -m ""  # 提交
git push          # 推送到远程
git pull          # 拉取并合并
```

## 分支

```bash
git branch           # 查看本地分支
git branch -a        # 查看所有分支（含远程）
git checkout -b xxx  # 创建并切换分支
git merge xxx        # 合并分支
git branch -d xxx    # 删除分支
```

## 回退

```bash
git reset --soft HEAD~1   # 撤销 commit，保留改动
git reset --hard HEAD~1   # 撤销 commit，丢弃改动
git revert <commit>       # 安全回退（保留历史）
git stash                  # 暂存当前改动
git stash pop              # 恢复暂存
```
