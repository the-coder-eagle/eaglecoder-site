/**
 * Codeforces 题目爬虫
 * 用法：npx tsx src/cron/scrape-codeforces.ts [rating_min] [rating_max]
 * 默认抓取 rating 800-1500 的题目
 *
 * API 文档：https://codeforces.com/apiHelp/methods#problemset.problems
 * 公开 API，无需认证，友好频率限制
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

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

  // 5. 生成输出
  const problemUrl = `https://codeforces.com/problemset/problem/${pick.contestId}/${pick.index}`;

  const output = {
    id: 'cf-' + pick.contestId + pick.index,
    title: pick.name,
    slug: `cf-${pick.contestId}-${pick.index.toLowerCase()}`,
    difficulty: getDifficulty(pick.rating),
    tags: pick.tags.map(translateTag),
    rating: pick.rating,
    description: `[Codeforces ${pick.contestId}${pick.index}](${problemUrl}) — Rating ${pick.rating}

${pick.tags.map(translateTag).join(' / ')}

> ⚠️ 题目详情请访问原站查看。本页面仅提供判题框架。

**输入格式：** 按照 Codeforces 原题输入格式。

**输出格式：** 按照 Codeforces 原题输出格式。`,
    examples: [
      {
        input: '(请访问原站查看样例)',
        output: '',
        explanation: `[打开原题](${problemUrl})`,
      },
    ],
    testCases: [
      {
        input: '(请在本地测试后手动添加测试用例)',
        expected: '',
        description: '请访问原站查看样例并手动配置测试用例',
      },
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

  // 6. 保存
  const outPath = join(process.cwd(), '..', '..', 'src', 'data', 'cf-scraped.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅ 已保存到 ${outPath}`);
  console.log('');
  console.log('💡 下一步：手动配置 testCases 和 examples 字段');
  console.log('   然后添加到 src/data/challenges.ts 中');
}

main();
