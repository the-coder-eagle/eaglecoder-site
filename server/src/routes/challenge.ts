// GET /api/challenge/today — 获取今日题目
import { Hono } from 'hono';
import { challenges, getTodaysChallenge } from '../../../src/data/challenges';

export const challengeRoute = new Hono();

challengeRoute.get('/today', (c) => {
  try {
    const challenge = getTodaysChallenge();
    // 去除模板代码里的多余空白使输出好看
    const cleaned = {
      ...challenge,
      date: new Date().toISOString().slice(0, 10),
    };
    return c.json(cleaned);
  } catch (err) {
    return c.json({ error: '获取题目失败' }, 500);
  }
});

challengeRoute.get('/all', (c) => {
  // 返回简要列表（不含完整描述和模板，减少传输量）
  const summary = challenges.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    difficulty: c.difficulty,
    tags: c.tags,
  }));
  return c.json(summary);
});

challengeRoute.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const challenge = challenges.find((c) => c.id === id);
  if (!challenge) {
    return c.json({ error: '题目不存在' }, 404);
  }
  return c.json({ ...challenge, date: new Date().toISOString().slice(0, 10) });
});
