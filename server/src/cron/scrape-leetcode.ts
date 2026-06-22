/**
 * LeetCode.cn 题目爬虫
 * 用法：npx tsx src/cron/scrape-leetcode.ts
 *
 * LeetCode.cn GraphQL API，无需认证，返回完整题目 + 样例测试用例
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface LCQuestion {
  title: string;
  titleSlug: string;
  difficulty: string;
  translatedTitle: string;
  translatedContent: string;
  sampleTestCase: string;
  codeSnippets: { lang: string; langSlug: string; code: string }[];
  topicTags: { name: string; translatedName: string }[];
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
  csharp: 'javascript',
  java: 'javascript',
  javascript: 'javascript',
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
  const tags = question.topicTags.map((t) => t.translatedName || t.name);
  const description = stripHtml(question.translatedContent || question.title);
  const url = `https://leetcode.com/problems/${question.titleSlug}/`;
  const id = `lc-${question.questionFrontendId}`;

  console.log(`   题目: [${difficulty}] ${title} (#${question.questionFrontendId})`);
  console.log(`   标签: ${tags.join(', ')}`);

  // 解析样例
  const { testCases, examples } = parseSampleTestCase(question.sampleTestCase, question);

  // 提取代码模板
  const template: Record<string, string> = { c: '', javascript: '', python: '' };

  for (const snippet of question.codeSnippets) {
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

  const output = {
    id,
    title,
    slug: question.titleSlug,
    difficulty,
    tags,
    description,
    examples,
    testCases,
    template,
    hints: [],
    source: { name: 'LeetCode', url },
  };

  const outDir = join(__dirname, '..', '..', '..', 'src', 'data');
  const outPath = join(outDir, 'lc-scraped.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ 已保存到 ${outPath}`);

  // 输出简要，方便手动加入 challenges.ts
  console.log('');
  console.log('📋 手动添加到 src/data/challenges.ts:');
  console.log(`   challenges.push(${JSON.stringify({ id: output.id, title: output.title, difficulty: output.difficulty, tags: output.tags })});`);
  console.log(`   💡 打开 ${outPath} 复制完整内容`);
}

main();
