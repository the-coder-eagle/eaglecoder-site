// EagleCoder OJ Server — Hono 后端入口
import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { challengeRoute } from './routes/challenge';
import { judgeRoute } from './routes/judge';
import { statsRoute } from './routes/stats';
import { rateLimit } from './middleware/rate-limit';

const app = new Hono();

// CORS — 仅允许 eaglecoder.cn 和本地开发
app.use(
  '*',
  cors({
    origin: ['https://eaglecoder.cn', 'http://localhost:4321'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-User-Token'],
  })
);

// 全局错误处理
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: '服务器内部错误' }, 500);
});

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', time: new Date().toISOString() });
});

// 题目路由
app.route('/api/challenge', challengeRoute);

// 判题路由 — 加频率限制：每分钟 10 次
app.use('/api/judge/*', rateLimit(10, 60_000));
app.route('/api/judge', judgeRoute);
app.route('/api/stats', statsRoute);

// 启动服务器
const port = parseInt(process.env.PORT || '3000', 10);
console.log(`🦅 EagleCoder OJ Server starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);
