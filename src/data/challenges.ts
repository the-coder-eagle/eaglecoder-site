/**
 * 每日一题题目池
 *
 * 覆盖题型：数组、字符串、链表、栈、哈希表、双指针、模拟
 * 难度分级：easy / medium / hard
 * 每道题包含测试用例和多语言代码模板
 */

export interface TestCase {
  input: string;
  expected: string;
  description?: string; // 这个测试用例在测什么
}

export interface Challenge {
  id: number;
  title: string;
  slug: string;
  description: string; // Markdown 格式的题目描述
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  /** 示例输入输出（给人看的） */
  examples: { input: string; output: string; explanation?: string }[];
  /** 判题用测试用例 */
  testCases: TestCase[];
  /** 每种语言的代码模板 */
  template: Record<SupportedLanguage, string>;
  /** 提示（可选，折叠显示） */
  hints?: string[];
  source?: { name: string; url: string };
}

export type SupportedLanguage = 'c' | 'javascript' | 'python';

export const LANGUAGES: { value: SupportedLanguage; label: string; piston: string }[] = [
  { value: 'c', label: 'C', piston: 'c' },
  { value: 'javascript', label: 'JavaScript', piston: 'javascript' },
  { value: 'python', label: 'Python', piston: 'python' },
];

export const challenges: Challenge[] = [
  // ========== Day 1: Easy ==========
  {
    id: 1,
    title: '两数之和',
    slug: 'two-sum',
    difficulty: 'easy',
    tags: ['数组', '哈希表'],
    description: `给定一个整数数组 \`nums\` 和一个整数目标值 \`target\`，请你在该数组中找出**和为目标值**的那**两个**整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案，并且你不能使用两次相同的元素。

**输入格式：**
第一行：\`nums\` 数组，空格分隔
第二行：\`target\`

**输出格式：**
两个下标，空格分隔（顺序任意）`,
    examples: [
      { input: '2 7 11 15\n9', output: '0 1', explanation: '2 + 7 = 9，下标 0 和 1' },
      { input: '3 2 4\n6', output: '1 2', explanation: '2 + 4 = 6，下标 1 和 2' },
    ],
    testCases: [
      { input: '2 7 11 15\n9', expected: '0 1', description: '基本用例' },
      { input: '3 2 4\n6', expected: '1 2', description: '中间位置' },
      { input: '3 3\n6', expected: '0 1', description: '相同元素' },
      { input: '1 5 8 3 9 2\n5', expected: '0 3', description: '跨多个元素' },
    ],
    template: {
      c: `#include <stdio.h>

int main() {
    int nums[100], n = 0, target;
    // 读取数组
    while (scanf("%d", &nums[n]) == 1) {
        n++;
        if (getchar() == '\\n') break;
    }
    scanf("%d", &target);

    // TODO: 找出两个和为 target 的数，输出它们的下标

    return 0;
}`,
      javascript: `// 读取输入：第一行数组，第二行 target
const input = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const nums = input[0].split(' ').map(Number);
const target = Number(input[1]);

// TODO: 找出两个和为 target 的数，输出它们的下标
`,
      python: `# 读取输入
nums = list(map(int, input().split()))
target = int(input())

# TODO: 找出两个和为 target 的数，输出它们的下标
`,
    },
    hints: ['你可以用双重循环暴力解，但用哈希表可以把时间复杂度从 O(n²) 降到 O(n)'],
    source: { name: 'LeetCode', url: 'https://leetcode.cn/problems/two-sum/' },
  },

  // ========== Day 2: Easy ==========
  {
    id: 2,
    title: '回文数判断',
    slug: 'palindrome-number',
    difficulty: 'easy',
    tags: ['数学', '字符串'],
    description: `给你一个整数 \`x\`，如果 \`x\` 是一个回文整数，输出 \`true\`，否则输出 \`false\`。

回文数是指正序和倒序读都是一样的整数。例如 121 是回文，而 123 不是。

**输入格式：** 一个整数
**输出格式：** \`true\` 或 \`false\``,
    examples: [
      { input: '121', output: 'true', explanation: '从左到右和从右到左都是 121' },
      { input: '-121', output: 'false', explanation: '从左到右为 -121，从右到左为 121-' },
      { input: '10', output: 'false', explanation: '从右到左为 01 ≠ 10' },
    ],
    testCases: [
      { input: '121', expected: 'true' },
      { input: '-121', expected: 'false' },
      { input: '10', expected: 'false' },
      { input: '0', expected: 'true' },
      { input: '12321', expected: 'true' },
    ],
    template: {
      c: `#include <stdio.h>

int main() {
    int x;
    scanf("%d", &x);

    // TODO: 判断 x 是否是回文数

    return 0;
}`,
      javascript: `const x = parseInt(require('fs').readFileSync('/dev/stdin', 'utf8').trim());

// TODO: 判断 x 是否是回文数
`,
      python: `x = int(input().strip())

# TODO: 判断 x 是否是回文数
`,
    },
    hints: ['负数一定不是回文数', '可以把数字转成字符串判断，也可以直接用数学方法反转数字'],
  },

  // ========== Day 3: Easy ==========
  {
    id: 3,
    title: '斐波那契数列',
    slug: 'fibonacci',
    difficulty: 'easy',
    tags: ['动态规划', '递归'],
    description: `斐波那契数列由 \`0\` 和 \`1\` 开始，后面的每一项都是前两项的和：
\`0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...\`

给定 \`n\`，请输出第 \`n\` 项的值（\`F(0) = 0, F(1) = 1\`）。

**输入格式：** 一个非负整数 n（0 ≤ n ≤ 30）
**输出格式：** 第 n 项的值`,
    examples: [
      { input: '2', output: '1', explanation: 'F(2) = F(1) + F(0) = 1 + 0 = 1' },
      { input: '5', output: '5', explanation: '0,1,1,2,3,5 → 第 5 项 = 5' },
    ],
    testCases: [
      { input: '0', expected: '0' },
      { input: '1', expected: '1' },
      { input: '5', expected: '5' },
      { input: '10', expected: '55' },
      { input: '20', expected: '6765' },
    ],
    template: {
      c: `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    // TODO: 输出第 n 项斐波那契数

    return 0;
}`,
      javascript: `const n = parseInt(require('fs').readFileSync('/dev/stdin', 'utf8').trim());

// TODO: 输出第 n 项斐波那契数
`,
      python: `n = int(input().strip())

# TODO: 输出第 n 项斐波那契数
`,
    },
    hints: [
      '用递归最简单，但 n=30 时递归会重复计算很多次',
      '迭代法（循环）只要 O(n) 时间，常数空间',
    ],
  },

  // ========== Day 4: Medium ==========
  {
    id: 4,
    title: '有效的括号',
    slug: 'valid-parentheses',
    difficulty: 'medium',
    tags: ['栈', '字符串'],
    description: `给定一个只包含 \`(\`、\`)\`、\`{\`、\`}\`、\`[\`、\`]\` 的字符串 \`s\`，判断字符串是否有效。

有效字符串需满足：
1. 左括号必须用相同类型的右括号闭合
2. 左括号必须以正确的顺序闭合

**输入格式：** 一行字符串
**输出格式：** \`true\` 或 \`false\``,
    examples: [
      { input: '()', output: 'true' },
      { input: '()[]{}', output: 'true' },
      { input: '(]', output: 'false', explanation: '类型不匹配' },
      { input: '([)]', output: 'false', explanation: '顺序错误' },
    ],
    testCases: [
      { input: '()', expected: 'true', description: '简单一对' },
      { input: '()[]{}', expected: 'true', description: '三种括号混合' },
      { input: '(]', expected: 'false', description: '类型不匹配' },
      { input: '([)]', expected: 'false', description: '交错不合法' },
      { input: '{[]}', expected: 'true', description: '嵌套合法' },
      { input: '(', expected: 'false', description: '单括号不闭合' },
    ],
    template: {
      c: `#include <stdio.h>
#include <string.h>

int main() {
    char s[1000];
    scanf("%s", s);

    // TODO: 判断括号是否有效

    return 0;
}`,
      javascript: `const s = require('fs').readFileSync('/dev/stdin', 'utf8').trim();

// TODO: 判断括号是否有效
`,
      python: `s = input().strip()

# TODO: 判断括号是否有效
`,
    },
    hints: [
      '用栈（Stack）：遇到左括号入栈，遇到右括号检查栈顶是否匹配',
      'Python 可以用 list 模拟栈（append + pop）',
    ],
  },

  // ========== Day 5: Medium ==========
  {
    id: 5,
    title: '最长公共前缀',
    slug: 'longest-common-prefix',
    difficulty: 'medium',
    tags: ['字符串', '字典树'],
    description: `编写一个函数来查找字符串数组中的最长公共前缀。如果不存在公共前缀，返回空字符串。

**输入格式：**
第一行：n，表示字符串数量
接下来的 n 行：每行一个字符串（只包含小写英文字母）

**输出格式：** 最长公共前缀字符串（如果没有则输出空行）`,
    examples: [
      { input: '3\nflower\nflow\nflight', output: 'fl' },
      { input: '3\ndog\nracecar\ncar', output: '', explanation: '这三个字符串没有公共前缀' },
    ],
    testCases: [
      { input: '3\nflower\nflow\nflight', expected: 'fl' },
      { input: '3\ndog\nracecar\ncar', expected: '' },
      { input: '2\nab\nab', expected: 'ab', description: '完全相同' },
      { input: '4\na\nab\nabc\nabcd', expected: 'a' },
      { input: '1\nhello', expected: 'hello', description: '只有一个字符串' },
    ],
    template: {
      c: `#include <stdio.h>
#include <string.h>

int main() {
    int n;
    scanf("%d\\n", &n);
    char strs[200][200];
    for (int i = 0; i < n; i++) {
        scanf("%s", strs[i]);
    }

    // TODO: 输出最长公共前缀

    return 0;
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const n = parseInt(lines[0]);
const strs = lines.slice(1, 1 + n);

// TODO: 输出最长公共前缀
`,
      python: `n = int(input())
strs = [input().strip() for _ in range(n)]

# TODO: 输出最长公共前缀
`,
    },
    hints: [
      '横向扫描：先取第一个字符串做基准，逐个和后面的比对，不断缩短前缀',
      '或者纵向扫描：逐列比较所有字符串同一位置的字符',
    ],
  },

  // ========== Day 6: Medium ==========
  {
    id: 6,
    title: '反转链表',
    slug: 'reverse-linked-list',
    difficulty: 'medium',
    tags: ['链表', '递归', '迭代'],
    description: `给你单链表的头节点，请你反转链表，并输出反转后的链表。

**输入格式：**
第一行：n，链表节点数
第二行：n 个整数，表示链表各节点的值

**输出格式：**
反转后的链表各节点的值，空格分隔`,
    examples: [
      { input: '5\n1 2 3 4 5', output: '5 4 3 2 1' },
      { input: '2\n1 2', output: '2 1' },
      { input: '0\n', output: '', explanation: '空链表' },
    ],
    testCases: [
      { input: '5\n1 2 3 4 5', expected: '5 4 3 2 1' },
      { input: '2\n1 2', expected: '2 1' },
      { input: '0\n', expected: '' },
      { input: '1\n42', expected: '42', description: '单节点' },
      { input: '3\n10 -5 0', expected: '0 -5 10', description: '包含负数' },
    ],
    template: {
      c: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int val;
    struct Node* next;
} Node;

int main() {
    int n, x;
    scanf("%d", &n);

    // 构建链表
    Node* head = NULL;
    Node* tail = NULL;
    for (int i = 0; i < n; i++) {
        scanf("%d", &x);
        Node* nd = (Node*)malloc(sizeof(Node));
        nd->val = x;
        nd->next = NULL;
        if (!head) head = tail = nd;
        else { tail->next = nd; tail = nd; }
    }

    // TODO: 反转链表并输出

    return 0;
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const n = parseInt(lines[0]);
const vals = n > 0 ? lines[1].split(' ').map(Number) : [];

// 构造链表
class Node {
  constructor(val) { this.val = val; this.next = null; }
}
let head = null, tail = null;
for (const v of vals) {
  const nd = new Node(v);
  if (!head) head = tail = nd;
  else { tail.next = nd; tail = nd; }
}

// TODO: 反转链表并输出
`,
      python: `n = int(input())
vals = list(map(int, input().split())) if n > 0 else []

class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

# 构造链表
head = None
tail = None
for v in vals:
    nd = Node(v)
    if not head:
        head = tail = nd
    else:
        tail.next = nd
        tail = nd

# TODO: 反转链表并输出
`,
    },
    hints: [
      '迭代法：三个指针 prev、curr、next，一步步翻转指向',
      '递归法：先递归到最后一个节点，再逐层翻转',
    ],
  },

  // ========== Day 7: Hard ==========
  {
    id: 7,
    title: '接雨水',
    slug: 'trapping-rain-water',
    difficulty: 'hard',
    tags: ['数组', '双指针', '动态规划', '单调栈'],
    description: `给定 \`n\` 个非负整数表示每个宽度为 1 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。

**输入格式：**
第一行：n（柱子个数）
第二行：n 个非负整数，表示每个柱子的高度

**输出格式：** 能接的雨水总量`,
    examples: [
      {
        input: '12\n0 1 0 2 1 0 1 3 2 1 2 1',
        output: '6',
        explanation: '由左到右柱高 [0,1,0,2,1,0,1,3,2,1,2,1]，可接 6 个单位雨水',
      },
      { input: '6\n4 2 0 3 2 5', output: '9' },
    ],
    testCases: [
      { input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expected: '6', description: '经典用例' },
      { input: '6\n4 2 0 3 2 5', expected: '9', description: '中等用例' },
      { input: '3\n1 2 3', expected: '0', description: '递增，接不到水' },
      { input: '3\n3 2 1', expected: '0', description: '递减，接不到水' },
      { input: '5\n5 0 5 0 5', expected: '10', description: '山谷形' },
    ],
    template: {
      c: `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int height[1000];
    for (int i = 0; i < n; i++) {
        scanf("%d", &height[i]);
    }

    // TODO: 计算能接多少雨水

    return 0;
}`,
      javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
const n = parseInt(lines[0]);
const height = lines[1].split(' ').map(Number);

// TODO: 计算能接多少雨水
`,
      python: `n = int(input())
height = list(map(int, input().split()))

# TODO: 计算能接多少雨水
`,
    },
    hints: [
      '双指针法：左右各一个指针，维护左右最大高度，移动较短的那边',
      '每个位置能接的水 = min(左边最大高度, 右边最大高度) - 当前高度',
      '也可以预处理 leftMax 和 rightMax 数组',
    ],
    source: { name: 'LeetCode', url: 'https://leetcode.cn/problems/trapping-rain-water/' },
  },
];

/**
 * 根据日期获取今天的题目
 * 用 dateString 计算，确保同一天返回同一题
 */
export function getTodaysChallenge(): Challenge {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 用日期字符串的 hashCode 选一道题
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
    hash |= 0; // 转 32 位整数
  }
  const idx = Math.abs(hash) % challenges.length;
  return challenges[idx];
}

/**
 * 根据 id 获取题目
 */
export function getChallengeById(id: number): Challenge | undefined {
  return challenges.find((c) => c.id === id);
}
