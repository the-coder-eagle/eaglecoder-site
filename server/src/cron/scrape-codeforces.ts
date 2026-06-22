/**
 * Codeforces 题目爬虫
 * 用法：npx tsx src/cron/scrape-codeforces.ts [rating_min] [rating_max]
 * 默认抓取 rating 800-1500 的题目
 *
 * API 文档：https://codeforces.com/apiHelp/methods#problemset.problems
 * 公开 API，无需认证，友好频率限制
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface CFProblem {
  contestId: number;
  index: string;
  name: string;
  type: string;
  rating?: number;
  tags: string[];
}

interface CFStatistic {
  contestId: number;
  index: string;
  solvedCount: number;
}

interface CFResponse {
  status: string;
  result: {
    problems: CFProblem[];
    problemStatistics: CFStatistic[];
  };
}

// 已知难度对应的 rating 范围
const DIFFICULTY_MAP: Record<string, number[]> = {
  easy: [800, 1100],
  medium: [1200, 1600],
  hard: [1700, 2200],
};

function getDifficulty(rating: number): 'easy' | 'medium' | 'hard' {
  if (rating <= 1100) return 'easy';
  if (rating <= 1600) return 'medium';
  return 'hard';
}

// 标签翻译
const TAG_ZH: Record<string, string> = {
  'implementation': '模拟',
  'math': '数学',
  'greedy': '贪心',
  'dp': '动态规划',
  'data structures': '数据结构',
  'brute force': '暴力',
  'constructive algorithms': '构造',
  'binary search': '二分查找',
  'sortings': '排序',
  'strings': '字符串',
  'number theory': '数论',
  'graphs': '图论',
  'two pointers': '双指针',
  'combinatorics': '组合数学',
  'geometry': '几何',
  'bitmasks': '位运算',
  'dfs and similar': 'DFS',
  'trees': '树',
  'probabilities': '概率',
  'divide and conquer': '分治',
  'hashing': '哈希',
  'games': '博弈',
  'flows': '网络流',
  'matrices': '矩阵',
};

function translateTag(tag: string): string {
  return TAG_ZH[tag] || tag;
}

async function main() {
  const args = process.argv.slice(2);
  const minRating = parseInt(args[0]) || 800;
  const maxRating = parseInt(args[1]) || 1500;

  console.log(`🔍 抓取 Codeforces 题目 (rating ${minRating}-${maxRating})...`);

  // 1. 获取题目列表
  const res = await fetch('https://codeforces.com/api/problemset.problems');
  if (!res.ok) {
    console.error(`❌ API 请求失败: ${res.status}`);
    process.exit(1);
  }

  const data: CFResponse = await res.json();
  if (data.status !== 'OK') {
    console.error('❌ API 返回异常');
    process.exit(1);
  }

  // 2. 过滤：有 rating、在范围内、有样例测试
  const problems = data.result.problems.filter((p) => {
    return p.rating && p.rating >= minRating && p.rating <= maxRating && p.type === 'PROGRAMMING';
  });

  console.log(`   找到 ${problems.length} 道符合条件的题目`);

  if (problems.length === 0) {
    console.log('⚠️ 无符合条件的题目，调整 rating 范围试试');
    process.exit(0);
  }

  // 3. 按日期哈希选一道（确保同一天选同一题）
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  const pick = problems[Math.abs(hash) % problems.length];

  // 4. 找统计信息（解决数）
  const stats = data.result.problemStatistics.find(
    (s) => s.contestId === pick.contestId && s.index === pick.index
  );

  console.log(`   今日题目: [${pick.rating}] ${pick.name} (${pick.contestId}${pick.index})`);
  console.log(`   标签: ${pick.tags.map(translateTag).join(', ')}`);
  console.log(`   解决人数: ${stats?.solvedCount || '?'}`);

  // 5. 抓取题目页面的样例测试用例
  const problemUrl = `https://codeforces.com/problemset/problem/${pick.contestId}/${pick.index}`;

  console.log(`   抓取样例数据...`);
  let examples: { input: string; output: string; explanation?: string }[] = [];
  let testCases: { input: string; expected: string; description?: string }[] = [];

  try {
    const htmlRes = await fetch(problemUrl, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'EagleCoder-OJ/1.0 (educational)' },
    });
    const html = await htmlRes.text();

    // 提取 <pre> 标签内容（CF 的样例格式）
    const preContent = html.match(/<pre>(.*?)<\/pre>/gs) || [];
    const inputs: string[] = [];
    const outputs: string[] = [];

    // CF 页面：class="input" 里的 pre 是输入，class="output" 里的 pre 是输出
    const inputBlocks = html.match(/class="input"[^>]*>[\s\S]*?<pre>([\s\S]*?)<\/pre>/gi) || [];
    const outputBlocks = html.match(/class="output"[^>]*>[\s\S]*?<pre>([\s\S]*?)<\/pre>/gi) || [];

    for (const block of inputBlocks) {
      const m = block.match(/<pre>([\s\S]*?)<\/pre>/i);
      if (m) inputs.push(m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim());
    }
    for (const block of outputBlocks) {
      const m = block.match(/<pre>([\s\S]*?)<\/pre>/i);
      if (m) outputs.push(m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim());
    }

    const count = Math.min(inputs.length, outputs.length);
    for (let i = 0; i < count; i++) {
      examples.push({
        input: inputs[i],
        output: outputs[i],
        explanation: `样例 ${i + 1}`,
      });
      testCases.push({
        input: inputs[i],
        expected: outputs[i],
        description: `样例 ${i + 1}`,
      });
    }

    console.log(`   抓到 ${count} 个样例测试用例`);
  } catch (err: any) {
    console.log(`   ⚠️ 抓取样例失败: ${err.message}，使用空模板`);
  }

  // 6. 生成输出

  const output = {
    id: 'cf-' + pick.contestId + pick.index,
    title: pick.name,
    slug: `cf-${pick.contestId}-${pick.index.toLowerCase()}`,
    difficulty: getDifficulty(pick.rating),
    tags: pick.tags.map(translateTag),
    rating: pick.rating,
    description: `[${pick.contestId}${pick.index}. ${pick.name}](${problemUrl}) — Rating ${pick.rating}

${pick.tags.map(translateTag).join(' / ')} · 已有 ${stats?.solvedCount || '?'} 人通过

> 📝 输入输出格式请参考原题。以下为抓取的样例。

此题为爬虫自动抓取。`,
    examples: examples.length > 0 ? examples : [
      { input: '(访问原站查看)', output: '', explanation: `[打开原题](${problemUrl})` },
    ],
    testCases: testCases.length > 0 ? testCases : [
      { input: '0', expected: '0', description: '占位用例，请手动配置' },
    ],
    template: {
      c: '#include <stdio.h>\n\nint main() {\n    // TODO: 解决 ' + pick.name + '\n    // ' + problemUrl + '\n    return 0;\n}',
      javascript: '// ' + pick.name + '\n// ' + problemUrl + '\n\nconst input = require("fs").readFileSync("/dev/stdin", "utf8").trim();\n\n// TODO: 解题',
      python: '# ' + pick.name + '\n# ' + problemUrl + '\n\n# TODO: 解题',
    },
    source: {
      name: 'Codeforces',
      url: problemUrl,
    },
  };

  // 6. 保存（保存到 server 目录，不受 cwd 影响）
  const serverDir = __dirname.replace(/cron$/, '');
  const outPath = join(serverDir, 'cf-scraped.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ 已保存到 ${outPath}`);
  console.log('');
  console.log('💡 下一步：手动配置 testCases 和 examples 字段');
  console.log('   然后添加到 src/data/challenges.ts 中');
}

main();
