// 题目 API — 从数据库读取（爬虫自动更新），fallback 静态数据
import { Hono } from 'hono';
import { challenges, getTodaysChallenge } from '../data/challenges';
import pool from '../db/connection';

export const challengeRoute = new Hono();

// 安全 JSON 解析：mysql2 可能返回字符串或已解析对象
function safeJson(val: any) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
}

// GET /api/challenge/today — 今日题目（DB 优先）
challengeRoute.get('/today', async (c) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // 从数据库读取今日题目
    const [rows] = await pool.execute(
      `SELECT c.*, cd.description, cd.template, cd.test_cases, cd.examples, cd.source_name, cd.source_url
       FROM challenges c
       LEFT JOIN challenge_data cd ON c.slug = cd.slug
       WHERE c.scheduled_date = ?
       LIMIT 1`,
      [today]
    );

    const row = (rows as any[])[0];
    if (row) {
      return c.json({
        id: row.id,
        title: row.title,
        slug: row.slug,
        difficulty: row.difficulty,
        tags: safeJson(row.tags) || [],
        description: row.description || '',
        examples: safeJson(row.examples) || [],
        testCases: safeJson(row.test_cases) || [],
        template: safeJson(row.template) || {},
        source: row.source_name ? { name: row.source_name, url: row.source_url } : undefined,
        date: today,
      });
    }
  } catch (err: any) {
    console.error('DB challenge error:', err.message);
  }

  // Fallback：静态题目
  const challenge = getTodaysChallenge();
  return c.json({
    ...challenge,
    date: new Date().toISOString().slice(0, 10),
  });
});

// GET /api/challenge/all
challengeRoute.get('/all', async (c) => {
  try {
    const [dbRows] = await pool.execute(
      `SELECT id, title, slug, difficulty, tags, scheduled_date FROM challenges ORDER BY scheduled_date DESC`
    );
    const dbList = (dbRows as any[]).map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      difficulty: r.difficulty,
      tags: safeJson(r.tags) || [],
      date: r.scheduled_date,
    }));

    const staticList = challenges.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      difficulty: c.difficulty,
      tags: c.tags,
      date: null,
    }));

    const seen = new Set<string>();
    const merged = [...dbList, ...staticList].filter((c) => {
      const key = String(c.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return c.json(merged);
  } catch {
    const summary = challenges.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      difficulty: c.difficulty,
      tags: c.tags,
    }));
    return c.json(summary);
  }
});

// GET /api/challenge/:id
challengeRoute.get('/:id', async (c) => {
  const id = c.req.param('id');

  if (id.startsWith('lc-')) {
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, cd.description, cd.template, cd.test_cases, cd.examples, cd.source_name, cd.source_url
         FROM challenges c
         LEFT JOIN challenge_data cd ON c.slug = cd.slug
         WHERE c.slug = ? OR c.title = ?
         LIMIT 1`,
        [id, id]
      );
      const row = (rows as any[])[0];
      if (row) {
        return c.json({
          id: row.id,
          title: row.title,
          slug: row.slug,
          difficulty: row.difficulty,
          tags: safeJson(row.tags) || [],
          description: row.description || '',
          examples: safeJson(row.examples) || [],
          testCases: safeJson(row.test_cases) || [],
          template: safeJson(row.template) || {},
          source: row.source_name ? { name: row.source_name, url: row.source_url } : undefined,
        });
      }
    } catch (err: any) {
      console.error('DB challenge error:', err.message);
    }
  }

  const numId = parseInt(id);
  const challenge = isNaN(numId) ? undefined : challenges.find((c) => c.id === numId);
  if (!challenge) return c.json({ error: '题目不存在' }, 404);
  return c.json(challenge);
});
