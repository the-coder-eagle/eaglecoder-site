// POST /api/judge — 代码判题 + 自动存数据库
import { Hono } from 'hono';
import { executeCodeSandbox } from '../services/sandbox';
import type { Challenge } from '../../../src/data/challenges';
import pool from '../db/connection';

export const judgeRoute = new Hono();

interface JudgeRequest {
  language: string;
  code: string;
  challengeId: number;
  username?: string;
  user_token?: string;   // 用户唯一标识（localStorage UUID）
}

interface TestResult {
  caseIndex: number;
  status: 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compile_error' | 'error';
  input: string;
  expected: string;
  actual: string;
  time: string;
  error?: string;
}

// 代码最大 10KB
const MAX_CODE_SIZE = 10 * 1024;

judgeRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<JudgeRequest>();

    // 参数校验
    if (!body.language || !body.code || !body.challengeId) {
      return c.json({ error: '缺少必要参数: language, code, challengeId' }, 400);
    }

    if (!['c', 'javascript', 'python'].includes(body.language)) {
      return c.json({ error: '不支持的语言' }, 400);
    }

    if (body.code.length > MAX_CODE_SIZE) {
      return c.json({ error: '代码过长，不能超过 10KB' }, 400);
    }

    // 加载题目数据
    const { challenges } = await import('../../../src/data/challenges');
    const challenge = challenges.find((ch: Challenge) => ch.id === body.challengeId);
    if (!challenge) {
      return c.json({ error: '题目不存在' }, 404);
    }

    // 逐测试用例判题
    const results: TestResult[] = [];
    let passed = 0;

    for (let i = 0; i < challenge.testCases.length; i++) {
      const tc = challenge.testCases[i];
      try {
        const result = await executeCodeSandbox(body.language, body.code, tc.input);

        // 编译错误
        if (result.status === 'compile_error') {
          results.push({
            caseIndex: i + 1,
            status: 'compile_error',
            input: tc.input,
            expected: tc.expected,
            actual: '',
            time: `${result.timeMs}ms`,
            error: result.stderr || '编译失败',
          });
          // 编译错误后面的用例都不测了
          break;
        }

        const stdout = result.stdout.trim();
        const expected = tc.expected.trim();
        const isAccepted = stdout === expected;

        if (isAccepted) {
          passed++;
          results.push({
            caseIndex: i + 1,
            status: 'accepted',
            input: tc.input,
            expected: tc.expected,
            actual: stdout,
            time: `${result.timeMs}ms`,
          });
        } else if (result.status === 'timeout') {
          results.push({
            caseIndex: i + 1,
            status: 'time_limit_exceeded',
            input: tc.input,
            expected: tc.expected,
            actual: stdout,
            time: `${result.timeMs}ms`,
          });
        } else if (result.status === 'runtime_error') {
          results.push({
            caseIndex: i + 1,
            status: 'runtime_error',
            input: tc.input,
            expected: tc.expected,
            actual: stdout,
            time: `${result.timeMs}ms`,
            error: result.stderr || '运行错误',
          });
        } else {
          results.push({
            caseIndex: i + 1,
            status: 'wrong_answer',
            input: tc.input,
            expected: tc.expected,
            actual: stdout,
            time: '✗',
          });
        }
      } catch (err: any) {
        results.push({
          caseIndex: i + 1,
          status: 'error',
          input: tc.input,
          expected: tc.expected,
          actual: '',
          time: '✗',
          error: err.message || '判题服务异常',
        });
      }
    }

    const total = challenge.testCases.length;
    const score = total > 0 ? Math.round((passed / total) * 100) : 0;
    const judgeStatus = passed === total ? 'accepted' : 'wrong_answer';

    // 异步保存到数据库（不阻塞响应）
    if (body.username && body.user_token) {
      pool.execute(
        `INSERT INTO submissions (challenge_id, username, user_token, language, code, status, score, passed, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [body.challengeId, body.username, body.user_token, body.language, body.code.slice(0, 5000), judgeStatus, score, passed, total]
      ).catch(err => console.error('DB save error:', err.message));
    }

    return c.json({
      passed,
      total,
      score,
      status: judgeStatus,
      results,
      username: body.username || null,
    });
  } catch (err: any) {
    return c.json({ error: '请求处理失败: ' + (err.message || '未知错误') }, 500);
  }
});
