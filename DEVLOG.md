# 开发日志

## 2026-06-17 — UI 大改 + 门禁系统

### 配色与字体
- 主色调改为南大紫 `#5B2D8E`（亮色）/ `#A78BFA`（暗色）
- 二级背景改为天蓝 `#E0F2FE`
- 文章正文使用宋体（SimSun / STSong / 宋体），UI 元素保留系统无衬线
- 暗色模式保持深色变体

### 全局 Bug 修复
- `global.css` 从未被导入：`Layout.astro` 加 `import '../styles/global.css'`
- Astro v6 废弃 API：`.slug` → `.id`，`entry.render()` → `render(entry)`
- 标签过滤在静态模式下不生效：改用客户端 JS 过滤（`data-tags` + `window.location.search`）
- 文章详情页 `getStaticPaths` 序列化丢失 `render()`：只传 id，页面内重新查集合

### 新增文件
- `src/assets/gate-questions.ts` — 进站题目库（easy 10 题 + hard 8 题）
- `src/content/posts/test-draft.md` — 草稿边界测试
- `src/content/posts/test-minimal.md` — 极简字段边界测试
- `src/content/posts/test-many-tags.md` — 多标签边界测试
- `src/content/docs/test-no-category.md` — 无分类边界测试
- `src/content/docs/test-category-b.md` — 同分类多文档测试
- `src/content/projects/test-no-links.md` — 无链接边界测试

### 修改文件
- `src/styles/global.css` — CSS 变量、字体、`.prose` 排版
- `src/layouts/Layout.astro` — 导入 CSS、添加进站门禁遮罩 + JS
- `src/components/Nav.astro` — 手机端汉堡菜单
- `src/pages/index.astro` — Hero 渐变背景 + 文章卡片白底紫条
- `src/pages/posts/index.astro` — 客户端标签过滤
- `src/pages/posts/[...slug].astro` — Astro v6 API 修复
- `src/pages/docs/index.astro` — `.slug` → `.id`
- `src/pages/docs/[...slug].astro` — Astro v6 API 修复
- `src/pages/rss.xml.ts` — `.slug` → `.id`
- `src/content.config.ts` —（确认兼容，未改动）

### 门禁逻辑
- 双题池：easy（和我相关的个人信息题）、hard（高考压轴填空）
- 前 2 次答错从 easy 池抽，第 3 次（最后一次）切 hard 池
- 第 3 次提示文案："既然不了解，那就拿实力说话罢"
- 答对进站（sessionStorage），答错 3 次锁 10 分钟（localStorage）
- 换题不扣次数，不抽同一题
- 答案支持 `|` 分隔多值（如 `安徽|安徽省`）

### 部署
- `git push origin master` → 服务器 cron 自动 `git pull` + `npm run build` + `rsync`
