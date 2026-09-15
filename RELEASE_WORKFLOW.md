# EagleCoder 发布工作流

以后网站改动统一按这条链路走：

```text
feature 分支 → 本地验证 → 推送远端 → Pull Request → CI → 合并 master → 发布校验 → SSH 部署 → 线上检查
```

## 1. 开始改动

从最新主分支创建功能分支：

```bash
git switch master
git pull --ff-only origin master
git switch -c feature/<改动名称>
```

提交信息使用 Conventional Commits，例如：

```text
feat(home): 调整首页首屏内容
fix(search): 修复搜索结果链接
refactor(deploy): 统一发布脚本
```

## 2. 本地验证

改动完成后，在项目根目录执行：

```bash
npm run verify
```

它会依次执行类型检查、测试和生产构建。只有全部通过后，才推送分支：

```bash
git push -u origin feature/<改动名称>
```

## 3. 合并主分支

在 GitHub 创建 Pull Request：

```text
base: master
compare: feature/<改动名称>
```

CI 会自动执行 `.github/workflows/ci.yml`。检查通过后合并 PR，不直接强推 `master`。

合并后同步本地主分支：

```bash
git switch master
git pull --ff-only origin master
```

## 4. 发布到服务器

发布脚本会强制检查当前分支是已同步的 `master`，然后自动完成：

1. 重新执行 `npm run verify`。
2. 将 `dist/` 打包上传到服务器临时目录。
3. 替换 `/www/wwwroot/eaglecoder.cn/` 静态文件。
4. 删除临时文件。
5. 请求 `https://eaglecoder.cn/` 做线上冒烟检查。

发布前只检查、不上传：

```bash
npm run deploy:check
```

确认无误后立即发布：

```bash
npm run deploy
```

默认部署参数来自现有服务器配置：

```text
主机：43.135.51.209
SSH 端口：22222
用户：root
静态目录：/www/wwwroot/eaglecoder.cn
密钥：~/.ssh/id_ed25519
```

如需更换环境，用环境变量覆盖，不要把密钥写进仓库：

```powershell
$env:EAGLECODER_DEPLOY_KEY = 'C:\path\to\your-key'
$env:EAGLECODER_DEPLOY_HOST = '43.135.51.209'
npm run deploy
```

## 5. 失败处理

- 本地检查失败：修复后重新执行 `npm run verify`。
- PR 检查失败：不要合并，先处理 CI 报错。
- 发布前检查失败：通常是当前分支不是 `master`、工作区不干净或本地未同步远端。
- 线上检查失败：先保留服务器现场，不重复覆盖；检查 SSH、Nginx 和目标目录后再重试。
- 需要回滚：通过 GitHub 对造成问题的提交创建 revert PR，再按同一流程发布。

服务器原有的定时任务仍可作为兜底，但人工发布统一使用 `npm run deploy`，不要再手工复制 `dist/`。
