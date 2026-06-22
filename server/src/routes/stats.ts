// 统计 + 排行榜 API
import { Hono } from 'hono';
import pool from '../db/connection';

export const statsRoute = new Hono();

// 记录提交
statsRoute.post('/submit-record', async (c) => {
  try {
    const body = await c.req.json();
    const { challenge_id, username, language, code, status, score, passed, total, exec_time_ms } = body;

    if (!challenge_id || !username) {
      return c.json({ error: '缺少必要参数' }, 400);
    }

    const [result] = await pool.execute(
      `INSERT INTO submissions (challenge_id, username, language, code, status, score, passed, total, exec_time_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [challenge_id, username, language || '', (code || '').slice(0, 5000), status || 'error', score || 0, passed || 0, total || 0, exec_time_ms || 0]
    );

    // 同时记录页面访问
    await pool.execute(
      `INSERT INTO page_views (path, user_token) VALUES (?, ?)`,
      [`/challenge?id=${challenge_id}`, username || '']
    );

    return c.json({ ok: true, id: (result as any).insertId });
  } catch (err: any) {
    console.error('Submit record error:', err.message);
    return c.json({ error: '保存失败' }, 500);
  }
});

// 排行榜 - 最高分（每人每题只取最高分）
statsRoute.get('/leaderboard', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const challengeId = c.req.query('challenge_id');

    let sql: string;
    let params: any[];

    if (challengeId) {
      // 单题排行：每人只取最高分
      sql = `SELECT username, MAX(score) as best_score, SUM(passed) as total_passed,
              COUNT(*) as attempts, MAX(submitted_at) as last_submit
             FROM submissions
             WHERE challenge_id = ?
             GROUP BY username
             ORDER BY best_score DESC, total_passed DESC, attempts ASC
             LIMIT ?`;
      params = [challengeId, limit];
    } else {
      // 总分排行：每人每题最高分求和
      sql = `SELECT username, SUM(max_score) as total_score, SUM(total_passed) as total_passed,
              COUNT(*) as solutions, MAX(last_submit) as last_submit
             FROM (
               SELECT username, challenge_id, MAX(score) as max_score, MAX(passed) as total_passed,
                      MAX(submitted_at) as last_submit
               FROM submissions
               GROUP BY username, challenge_id
             ) t
             GROUP BY username
             ORDER BY total_score DESC, solutions DESC
             LIMIT ?`;
      params = [limit];
    }

    const [rows] = await pool.execute(sql, params);
    return c.json({ leaderboard: rows });
  } catch (err: any) {
    console.error('Leaderboard error:', err.message);
    return c.json({ error: '查询失败' }, 500);
  }
});

// 用户统计 - 某用户在所有题上的最高分
statsRoute.get('/user/:username', async (c) => {
  try {
    const username = c.req.param('username');

    // 每题最高分
    const [perChallenge] = await pool.execute(
      `SELECT s.challenge_id, c.title, c.difficulty,
              MAX(s.score) as best_score, MAX(s.passed) as passed, MAX(s.total) as total,
              COUNT(*) as attempts, MAX(s.submitted_at) as last_submit
       FROM submissions s
       LEFT JOIN challenges c ON s.challenge_id = c.id
       WHERE s.username = ?
       GROUP BY s.challenge_id, c.title, c.difficulty
       ORDER BY last_submit DESC`,
      [username]
    );

    // 总统计
    const [totals] = await pool.execute(
      `SELECT COUNT(DISTINCT challenge_id) as solved,
              SUM(max_score) as total_score
       FROM (
         SELECT challenge_id, MAX(score) as max_score
         FROM submissions WHERE username = ?
         GROUP BY challenge_id
       ) t`,
      [username]
    );

    return c.json({
      username,
      perChallenge,
      totals: (totals as any[])[0] || { solved: 0, total_score: 0 },
    });
  } catch (err: any) {
    console.error('User stats error:', err.message);
    return c.json({ error: '查询失败' }, 500);
  }
});

// 页面访问统计（简单：按路径统计 PV）
statsRoute.get('/pageviews', async (c) => {
  try {
    const [rows] = await pool.execute(
      `SELECT path, COUNT(*) as views
       FROM page_views
       WHERE viewed_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY path
       ORDER BY views DESC
       LIMIT 20`
    );
    return c.json({ pageviews: rows });
  } catch (err: any) {
    console.error('Pageviews error:', err.message);
    return c.json({ error: '查询失败' }, 500);
  }
});
