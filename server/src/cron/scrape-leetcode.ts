/**
 * LeetCode.cn 题目爬虫
 * 用法：npx tsx src/cron/scrape-leetcode.ts
 *
 * LeetCode.cn GraphQL API，无需认证，返回完整题目 + 样例测试用例
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createPool } from 'mysql2/promise';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 加载 .env（无论从哪里运行都能找到）
dotenv.config({ path: '/www/wwwroot/eaglecoder-repo/server/.env' });
dotenv.config({ path: new URL('../../../.env', import.meta.url).pathname });

// 数据库连接
const pool = createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'oj',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'eaglecoder_oj',
  charset: 'utf8mb4',
});

interface LCQuestion {
  title: string;
  titleSlug: string;
  difficulty: string;
  translatedTitle?: string;
  translatedContent?: string;
  content?: string;          // leetcode.com 用这个
  sampleTestCase: string;
  codeSnippets: { lang: string; langSlug: string; code: string }[];
  topicTags: { name: string; translatedName?: string }[];
  questionFrontendId: string;
}

interface LCRandomResponse {
  data: {
    randomQuestion: LCQuestion;
  };
}

interface LCDailyResponse {
  data: {
    todayRecord: {
      question: LCQuestion;
    }[];
  };
}

// 难度映射
function mapDifficulty(lcDifficulty: string): 'easy' | 'medium' | 'hard' {
  if (lcDifficulty === 'Easy') return 'easy';
  if (lcDifficulty === 'Medium') return 'medium';
  return 'hard';
}

// 语言映射：LeetCode langSlug → 我们的语言
const LANG_MAP: Record<string, string> = {
  c: 'c',
  cpp: 'c',
  javascript: 'javascript',
  typescript: 'javascript',
  python: 'python',
  python3: 'python',
};

// HTML 标签清洗
function stripHtml(html: string): string {
  return html
    .replace(/<sup>/g, '^')
    .replace(/<\/sup>/g, '')
    .replace(/<sub>/g, '_')
    .replace(/<\/sub>/g, '')
    .replace(/<code>/g, '`')
    .replace(/<\/code>/g, '`')
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<em>/g, '_')
    .replace(/<\/em>/g, '_')
    .replace(/<pre>/g, '```\n')
    .replace(/<\/pre>/g, '\n```')
    .replace(/<li>/g, '- ')
    .replace(/<\/li>/g, '')
    .replace(/<ul>/g, '')
    .replace(/<\/ul>/g, '')
    .replace(/<ol>/g, '')
    .replace(/<\/ol>/g, '')
    .replace(/<p>/g, '\n\n')
    .replace(/<\/p>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
}

// GraphQL 查询：随机题目
const RANDOM_QUERY = `
query randomQuestion($categorySlug: String, $filters: QuestionListFilterInput) {
  randomQuestion(categorySlug: $categorySlug, filters: $filters) {
    title
    titleSlug
    difficulty
    translatedTitle
    translatedContent
    sampleTestCase
    codeSnippets {
      lang
      langSlug
      code
    }
    topicTags {
      name
      translatedName
    }
    questionFrontendId
    stats
  }
}`;

// GraphQL 查询：今日题目
const DAILY_QUERY = `
query questionOfToday {
  todayRecord {
    question {
      title
      titleSlug
      difficulty
      translatedTitle
      translatedContent
      sampleTestCase
      codeSnippets {
        lang
        langSlug
        code
      }
      topicTags {
        name
        translatedName
      }
      questionFrontendId
      stats
    }
  }
}`;

// 全局 Cookie 存储（先访问首页拿 csrf）
let csrfToken = '';
let cookies = '';

async function initSession() {
  const res = await fetch('https://leetcode.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0',
    },
    signal: AbortSignal.timeout(10000),
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const m = setCookie.match(/csrftoken=([^;]+)/);
  if (m) csrfToken = m[1];
  cookies = setCookie;
  console.log(`   CSRF: ${csrfToken ? 'ok' : 'none'}`);
}

async function leetcodeRequest(query: string, variables: Record<string, any>) {
  const res = await fetch('https://leetcode.com/graphql/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0',
      'Accept': 'application/json',
      'Origin': 'https://leetcode.com',
      'Referer': 'https://leetcode.com/problemset/',
      ...(csrfToken ? { 'x-csrftoken': csrfToken } : {}),
      ...(cookies ? { 'Cookie': cookies } : {}),
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** 解析样例用例为 input/expected 对 */
function parseSampleTestCase(sample: string, question: LCQuestion) {
  const testCases: { input: string; expected: string; description: string }[] = [];
  const examples: { input: string; output: string; explanation?: string }[] = [];

  if (!sample) return { testCases, examples };

  // LeetCode 的 sampleTestCase 是输入参数，不是完整的 stdin
  // 对于简单类型（字符串、数组）可以直接用
  const lines = sample.split('\n').filter((l) => l.trim());
  if (lines.length >= 2) {
    // 尝试成对解析
    for (let i = 0; i < lines.length - 1; i += 2) {
      testCases.push({
        input: lines[i].trim(),
        expected: lines[i + 1].trim(),
        description: `样例 ${Math.floor(i / 2) + 1}`,
      });
      examples.push({
        input: lines[i].trim(),
        output: lines[i + 1].trim(),
      });
    }
  } else if (lines.length === 1) {
    testCases.push({
      input: lines[0].trim(),
      expected: '',
      description: '样例输入（输出需手动配置）',
    });
  }

  return { testCases, examples };
}

async function fetchRandomProblem(): Promise<LCQuestion> {
  const data = await leetcodeRequest(RANDOM_QUERY, {
    categorySlug: 'algorithms',
    filters: {},
  });
  return (data as LCRandomResponse).data.randomQuestion;
}

async function fetchDailyProblem(): Promise<LCQuestion> {
  const data = await leetcodeRequest(DAILY_QUERY, {});
  const records = (data as LCDailyResponse).data.todayRecord;
  if (!records || records.length === 0) throw new Error('今日题目不可用');
  return records[0].question;
}

async function main() {
  const mode = process.argv[2] || 'random';

  console.log('🔍 爬取 LeetCode.cn 题目...');

  // 先获取 CSRF token
  await initSession();

  let question: LCQuestion;
  try {
    if (mode === 'daily') {
      console.log('   模式: 今日题目');
      question = await fetchDailyProblem();
    } else {
      console.log('   模式: 随机题目');
      question = await fetchRandomProblem();
    }
  } catch (err: any) {
    console.error(`❌ 获取题目失败: ${err.message}`);
    process.exit(1);
  }

  const title = question.translatedTitle || question.title;
  const difficulty = mapDifficulty(question.difficulty);
  const tags = (question.topicTags || []).map((t) => t.translatedName || t.name);
  const url = `https://leetcode.com/problems/${question.titleSlug}/`;
  const rawContent = question.translatedContent || question.content || '';
  const description = rawContent ? stripHtml(rawContent) : `${title}\n\n> LeetCode #${question.questionFrontendId} | ${difficulty}\n> 查看原题: ${url}`;
  const id = `lc-${question.questionFrontendId}`;

  console.log(`   题目: [${difficulty}] ${title} (#${question.questionFrontendId})`);
  console.log(`   标签: ${tags.join(', ')}`);

  // 解析样例
  const { testCases, examples } = parseSampleTestCase(question.sampleTestCase, question);

  // 提取代码模板
  const template: Record<string, string> = { c: '', javascript: '', python: '' };

  for (const snippet of (question.codeSnippets || [])) {
    const lang = LANG_MAP[snippet.langSlug];
    if (lang && !template[lang]) {
      // 用注释包装一下
      template[lang] = `// ${title}\n// ${url}\n\n${snippet.code}`;
    }
  }

  // 如果没有 C 模板，给个基础版
  if (!template.c.trim()) {
    template.c = `#include <stdio.h>\n\n// ${title}\n// ${url}\n\nint main() {\n    // TODO\n    return 0;\n}`;
  }

  console.log(`   样例数: ${testCases.length}`);

  const today = new Date().toISOString().slice(0, 10);

  // 写入 MySQL challenges 表（替换今天的题目）
  const tagJson = JSON.stringify(tags);
  const templateJson = JSON.stringify(template);
  const testCasesJson = JSON.stringify(testCases);
  const examplesJson = JSON.stringify(examples);

  await pool.execute(
    `INSERT INTO challenges (title, slug, difficulty, tags, test_case_count, scheduled_date, created_at)
     VALUES (?, ?, ?, CAST(? AS JSON), ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       title = VALUES(title), difficulty = VALUES(difficulty),
       tags = VALUES(tags), test_case_count = VALUES(test_case_count)`,
    [title, question.titleSlug, difficulty, tagJson, testCases.length, today]
  );

  // 存到单独的表以存储完整数据
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS challenge_data (
       slug VARCHAR(200) PRIMARY KEY,
       description TEXT,
       template JSON,
       test_cases JSON,
       examples JSON,
       source_name VARCHAR(100),
       source_url VARCHAR(500),
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );

  await pool.execute(
    `INSERT INTO challenge_data (slug, description, template, test_cases, examples, source_name, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       description = VALUES(description), template = VALUES(template),
       test_cases = VALUES(test_cases), examples = VALUES(examples),
       source_name = VALUES(source_name), source_url = VALUES(source_url)`,
    [question.titleSlug, description, templateJson, testCasesJson, examplesJson, 'LeetCode', url]
  );

  console.log(`✅ 已写入数据库: challenges + challenge_data`);
  console.log(`   日期: ${today}`);
  console.log(`   链接: ${url}`);

  // 自动部署
  const { execSync } = await import('child_process');
  try {
    console.log('');
    console.log('🚀 自动部署网站...');
    execSync('sudo bash /www/wwwroot/deploy.sh', { stdio: 'pipe', timeout: 120000 });
    console.log('✅ 部署完成！新题已上线');
  } catch (err: any) {
    console.log(`⚠️ 自动部署失败: ${err.message}`);
    console.log(`   请手动运行: sudo bash /www/wwwroot/deploy.sh`);
  }

  await pool.end();
}

main();
