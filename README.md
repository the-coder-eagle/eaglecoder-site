# EagleCoder

EagleCoder 是一个基于 Astro 的个人技术花园，收纳文章、项目记录、C 语言学习文档和每日一题。

## 项目结构

```text
/
├── public/                 静态资源
├── src/content/            文章、项目和学习文档
├── src/components/         页面组件
├── src/pages/              页面路由
├── src/styles/             全局样式
├── server/                 每日一题后端服务
├── scripts/                本地发布脚本
├── tests/                  Vitest 测试
└── RELEASE_WORKFLOW.md     开发、合并与部署流程
```

## 常用命令

所有命令都在项目根目录执行：

| 命令 | 作用 |
| :--- | :--- |
| `npm install` | 安装依赖 |
| `npm run dev` | 启动本地开发服务器 |
| `npm run check` | 检查 Astro / TypeScript 类型 |
| `npm test` | 执行 Vitest 测试 |
| `npm run build` | 构建生产站点和 Pagefind 索引 |
| `npm run verify` | 完整检查、测试和构建 |
| `npm run preview` | 预览生产构建 |
| `npm run deploy:check` | 检查发布条件，不上传 |
| `npm run deploy` | 验证并发布到服务器 |

## 发布流程

完整流程见 [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md)。核心原则是：功能分支开发、Pull Request 合并到 `master`、CI 通过后再发布。
