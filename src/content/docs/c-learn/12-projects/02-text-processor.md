---
category: "C语言教程"
title: "文本处理器 — 简易 grep/wc"
description: "C语言学习教程"
slug: "text-processor"
level: 12
order: 2
tags: ["grep", "wc", "文件", "字符串", "项目"]
---

# 文本处理器 — 简易 grep/wc

每天在终端里跑 `grep` 搜索代码、用 `wc` 统计行数，你有没有想过：它们内部是怎么工作的？本章我们亲手实现这两个工具的简化版。写完你会发现，这两个看起来"高级"的命令，核心逻辑超不过 30 行。

## 为什么选这两个工具？

- **wc**：教会你**状态机思维**——如何用一个变量"记住上下文"来正确计数
- **grep**：教会你**线性扫描 + 模式匹配**——逐行处理数据的基本范式
- 两个工具合在一起，覆盖了 90% 的"逐行处理文件"编程模式

---

## 1. 第一部分：实现 mywc（简易 wc）

### 1.1 需求分析

`wc` 统计文件的行数、单词数、字符数。听起来简单，但有一个陷阱：什么是"单词"？

```
"Hello  World"  → 2 个单词
"Hello,World"   → 1 个单词（逗号不是空格）
"  Hello  "     → 1 个单词（前后空格不算）
""              → 0 个单词
"a b c"         → 3 个单词
```

**关键洞察**：不能用空格个数来算单词数。需要用状态机——"我正在单词内部"还是"我在单词外部"。

### 1.2 状态机图解

```
                             遇到非空白字符
         ┌──────────────────────────────────→  ┌──────────┐
         │                                      │ 单词内部  │
         │                                      │ in_word=1 │
         │          ┌─────────────────────────→ │ words++   │
         │          │                           └─────┬─────┘
         │          │                                 │
         │          │                         遇到空白字符
         │          │                                 │
         │   ┌──────┴──────┐                          │
         └───│ 单词外部     │ ←────────────────────────┘
起始 ──────→ │ in_word=0    │
             └─────────────┘
```

用大白话说就是：
- 遇到非空白字符，且之前不在单词里 → 新单词开始，单词数 +1，进入"单词内部"
- 遇到非空白字符，且之前已经在单词里 → 继续，什么都不做
- 遇到空白字符 → 进入"单词外部"

### 1.3 基础实现

```c
#include <stdio.h>
#include <ctype.h>    // isspace()

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "用法: %s <文件> [文件2 ...]\n", argv[0]);
        return 1;
    }

    // 如果有多个文件，最后输出总计
    int total_lines = 0, total_words = 0, total_chars = 0;

    for (int f = 1; f < argc; f++) {
        FILE *fp = fopen(argv[f], "r");
        if (fp == NULL) {
            perror(argv[f]);
            continue;
        }

        int lines = 0, words = 0, chars = 0;
        int in_word = 0;  // 状态：是否在单词内部
        int ch;

        while ((ch = fgetc(fp)) != EOF) {
            chars++;

            if (ch == '\n') {
                lines++;
            }

            if (isspace(ch)) {
                in_word = 0;       // 进入"单词外部"
            } else if (in_word == 0) {
                in_word = 1;       // 新单词开始
                words++;
            }
            // else: in_word == 1 且不是空白 → 继续在单词内部
        }

        fclose(fp);

        printf(" %3d  %3d  %3d  %s\n", lines, words, chars, argv[f]);

        total_lines += lines;
        total_words += words;
        total_chars += chars;
    }

    // 多个文件时输出总计
    if (argc > 2) {
        printf(" %3d  %3d  %3d  总计\n",
               total_lines, total_words, total_chars);
    }

    return 0;
}
```

### 1.4 测试

```bash
$ gcc -o mywc mywc.c

$ echo "Hello World" > test1.txt
$ echo -n "No newline" > test2.txt  # 没有末尾换行

$ ./mywc test1.txt test2.txt
   1    2   12  test1.txt
   0    2   10  test2.txt
   1    4   22  总计

$ ./mywc mywc.c
  45   85  890  mywc.c
```

### 1.5 升级版：支持命令行选项

```c
#include <stdio.h>
#include <ctype.h>
#include <unistd.h>
#include <string.h>
#include <stdbool.h>

int main(int argc, char *argv[]) {
    bool show_lines = false;
    bool show_words = false;
    bool show_chars = false;

    // 解析选项
    int opt;
    while ((opt = getopt(argc, argv, "lwch")) != -1) {
        switch (opt) {
            case 'l': show_lines  = true; break;
            case 'w': show_words  = true; break;
            case 'c': show_chars  = true; break;
            case 'h':
                printf("用法: %s [-lwc] <文件>...\n", argv[0]);
                printf("  -l  只显示行数\n");
                printf("  -w  只显示单词数\n");
                printf("  -c  只显示字符数\n");
                printf("  (无选项时显示全部三项)\n");
                return 0;
            default:
                return 1;
        }
    }

    // 无选项 = 全部显示
    if (!show_lines && !show_words && !show_chars) {
        show_lines = show_words = show_chars = true;
    }

    if (optind >= argc) {
        fprintf(stderr, "错误: 请提供文件名\n");
        return 1;
    }

    for (int f = optind; f < argc; f++) {
        FILE *fp = fopen(argv[f], "r");
        if (!fp) { perror(argv[f]); continue; }

        int lines = 0, words = 0, chars = 0;
        int in_word = 0, ch;

        while ((ch = fgetc(fp)) != EOF) {
            chars++;
            if (ch == '\n') lines++;
            if (isspace(ch)) { in_word = 0; }
            else if (!in_word) { in_word = 1; words++; }
        }

        fclose(fp);

        if (show_lines)  printf(" %3d", lines);
        if (show_words)  printf(" %3d", words);
        if (show_chars)  printf(" %3d", chars);
        printf("  %s\n", argv[f]);
    }

    return 0;
}
```

```bash
$ ./mywc -l mywc.c
  45  mywc.c
$ ./mywc -w mywc.c
  85  mywc.c
$ ./mywc -c mywc.c
 890  mywc.c
$ ./mywc -lw mywc.c   # 只显示行数和单词数
  45   85  mywc.c
```

---

## 2. 第二部分：实现 mygrep（简易 grep）

### 2.1 需求分析

`grep` 在文件中搜索含有指定"模式"的行，并打印出来。我们的简化版：
- 支持基本字符串匹配（`strstr`）
- 显示行号
- 支持多文件
- 可选：忽略大小写
- 可选：反向匹配（显示不包含模式的行）

### 2.2 架构设计

```
主循环:
  for 每个文件:
    打开文件
    for 每一行:
      读一行 → 检查是否匹配 → 匹配则打印
    关闭文件
```

没有复杂的状态机，没有嵌套的 fork。这个程序的复杂度完全在"用户体验"——选项多、输出格式多样。

### 2.3 基础实现

```c
#include <stdio.h>
#include <string.h>

#define MAX_LINE 4096

int main(int argc, char *argv[]) {
    if (argc < 3) {
        fprintf(stderr, "用法: %s <模式> <文件> [文件2 ...]\n", argv[0]);
        fprintf(stderr, "示例: %s \"int main\" *.c\n", argv[0]);
        return 1;
    }

    char *pattern = argv[1];
    int file_count = argc - 2;

    for (int f = 2; f < argc; f++) {
        FILE *fp = fopen(argv[f], "r");
        if (fp == NULL) {
            perror(argv[f]);
            continue;
        }

        char line[MAX_LINE];
        int line_no = 0;

        while (fgets(line, MAX_LINE, fp)) {
            line_no++;

            if (strstr(line, pattern) != NULL) {
                // 多文件时显示文件名
                if (file_count > 1) {
                    printf("%s:", argv[f]);
                }
                printf("%d:%s", line_no, line);
                // 注意: fgets 保留换行符，所以 line 末尾已有 \n
            }
        }

        fclose(fp);
    }

    return 0;
}
```

```bash
$ ./mygrep "printf" mywc.c
8:    fprintf(stderr, "用法: %s <文件> [文件2 ...]\n", argv[0]);
27:        printf(" %3d  %3d  %3d  %s\n", lines, words, chars, argv[f]);
...

$ ./mygrep "include" *.c
main.c:1:#include <stdio.h>
utils.c:1:#include <stdio.h>
utils.c:2:#include <string.h>
```

### 2.4 完整版：支持选项

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <ctype.h>
#include <stdbool.h>

#define MAX_LINE 8192

// 忽略大小写的 strstr
char *stristr(const char *haystack, const char *needle) {
    size_t needle_len = strlen(needle);
    if (needle_len == 0) return (char *)haystack;

    for (; *haystack; haystack++) {
        // 逐个字符比较（忽略大小写）
        size_t i;
        for (i = 0; i < needle_len; i++) {
            if (tolower((unsigned char)haystack[i]) !=
                tolower((unsigned char)needle[i])) {
                break;
            }
        }
        if (i == needle_len) return (char *)haystack;
    }
    return NULL;
}

int main(int argc, char *argv[]) {
    bool show_number = false;   // -n: 显示行号
    bool ignore_case = false;   // -i: 忽略大小写
    bool invert = false;        // -v: 反向匹配
    bool count_only = false;    // -c: 只显示匹配行数

    int opt;
    while ((opt = getopt(argc, argv, "nivch")) != -1) {
        switch (opt) {
            case 'n': show_number = true; break;
            case 'i': ignore_case  = true; break;
            case 'v': invert       = true; break;
            case 'c': count_only   = true; break;
            case 'h':
                printf("用法: %s [选项] <模式> <文件>...\n", argv[0]);
                printf("选项:\n");
                printf("  -n  显示行号\n");
                printf("  -i  忽略大小写\n");
                printf("  -v  反向匹配（显示不匹配的行）\n");
                printf("  -c  只显示匹配行数\n");
                return 0;
            default:
                return 1;
        }
    }

    if (optind + 1 >= argc) {
        fprintf(stderr, "用法: %s [选项] <模式> <文件>...\n", argv[0]);
        return 1;
    }

    char *pattern = argv[optind];
    int file_start = optind + 1;
    int file_count = argc - file_start;

    for (int f = file_start; f < argc; f++) {
        FILE *fp = fopen(argv[f], "r");
        if (!fp) { perror(argv[f]); continue; }

        char line[MAX_LINE];
        int line_no = 0;
        int match_count = 0;

        while (fgets(line, MAX_LINE, fp)) {
            line_no++;

            // 选择匹配函数
            char *found;
            if (ignore_case) {
                found = stristr(line, pattern);
            } else {
                found = strstr(line, pattern);
            }

            bool matched = (found != NULL);
            if (invert) matched = !matched;   // -v 反转

            if (matched) {
                match_count++;

                if (!count_only) {  // -c 时不输出每行
                    if (file_count > 1) printf("%s:", argv[f]);
                    if (show_number)  printf("%d:", line_no);
                    printf("%s", line);
                }
            }
        }

        if (count_only) {
            if (file_count > 1) printf("%s:", argv[f]);
            printf("%d\n", match_count);
        }

        fclose(fp);
    }

    return 0;
}
```

### 2.5 测试各种模式

```bash
$ gcc -o mygrep mygrep.c

# 基本搜索
$ ./mygrep "printf" mygrep.c | head -3
    printf("用法: %s [选项] <模式> <文件>...\n", argv[0]);
    printf("  -n  显示行号\n");
    printf("  -i  忽略大小写\n");

# 带行号
$ ./mygrep -n "return" mygrep.c
21:    return NULL;
25:int main(int argc, char *argv[]) {
...

# 忽略大小写
$ ./mygrep -i "hello" test.txt
# 匹配 "Hello", "HELLO", "hello" 等

# 反向匹配：显示不包含 "#" 的行（实际代码行）
$ ./mygrep -v "#include" mygrep.c | ./mygrep -v "^$"
# 输出不包含 #include 的非空行

# 只计数
$ ./mygrep -c "error" log.txt
42
```

---

## 3. 架构对比：wc vs grep

```
┌─────────────────────────────────────────────┐
│                  mywc                        │
│                                              │
│  输入: 文件流                                │
│  处理: 状态机 (in_word)                      │
│        ┌─────────┐                           │
│        │ 逐字符   │──── 计数 ────→ 行/词/字  │
│        │ 扫描     │                           │
│        └─────────┘                           │
│  输出: 统计数字                              │
│                                              │
│  复杂度来源: 什么是"单词"的边界判定          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                  mygrep                      │
│                                              │
│  输入: 文件流 + 搜索模式                     │
│  处理: 逐行扫描                              │
│        ┌─────────┐                           │
│        │ 逐行     │── 匹配? ──→ 打印/跳过    │
│        │ 读取     │                           │
│        └─────────┘                           │
│  输出: 匹配的行                              │
│                                              │
│  复杂度来源: 选项组合 (n/v/i/c)              │
└─────────────────────────────────────────────┘
```

---

## 4. 测试策略

### 准备测试数据

```bash
# 创建测试文件
cat > test.txt << 'EOF'
Hello World
This is a test file.
HELLO again
hello world
  空行上面

空行下面
Line with 123 numbers
The END
EOF
```

### wc 测试矩阵

| 测试命令            | 验证点                       |
|---------------------|------------------------------|
| `./mywc test.txt`   | 基础计数正确性               |
| `./mywc -l test.txt` | 只显示行数                   |
| `./mywc -w test.txt` | 只显示单词数                 |
| `./mywc -c test.txt` | 只显示字符数                 |
| `./mywc *.c`         | 多文件 + 总计                |
| `./mywc 不存在.txt`  | 错误处理不崩溃               |

### grep 测试矩阵

| 测试命令                     | 验证点               |
|------------------------------|----------------------|
| `./mygrep "hello" test.txt`  | 大小写敏感（默认）   |
| `./mygrep -i "hello" test.txt` | 忽略大小写         |
| `./mygrep -n "hello" test.txt` | 行号正确           |
| `./mygrep -v "hello" test.txt` | 反向匹配           |
| `./mygrep -c "hello" test.txt` | 计数正确           |
| `./mygrep "xyz" test.txt`    | 无匹配时输出空       |

### 对比系统工具

```bash
# 最好的测试：和原版对比结果
$ wc test.txt > expected.txt
$ ./mywc test.txt > actual.txt
$ diff expected.txt actual.txt
# 没有输出 = 一致 = 测试通过！
```

---

## 5. 扩展方向

### 基础扩展

| 扩展           | 难度 | 说明                               |
|----------------|------|------------------------------------|
| 支持标准输入   | 容易 | 没有文件参数时从 stdin 读          |
| 行号开关 `-n`  | 容易 | 给每一行前面加上行号               |
| 多模式 `-e`    | 中等 | `grep -e "pat1" -e "pat2" file`    |
| 单词匹配 `-w`  | 中等 | 只匹配完整单词，不匹配子串         |

### 进阶扩展

| 扩展              | 难度 | 说明                                         |
|-------------------|------|----------------------------------------------|
| 高亮匹配文本       | 中等 | 用 ANSI 转义序列着色（`\033[31m匹配\033[0m`）|
| 正则表达式         | 困难 | 引入 `<regex.h>`，用 `regcomp` + `regexec`   |
| 递归搜索 `-r`     | 困难 | 自动遍历子目录（用到上一章的目录遍历知识）   |
| 上下文显示 `-C N` | 中等 | 显示匹配行的前后 N 行                         |

### 高亮实现示例

```c
void print_highlighted(const char *line, const char *pattern) {
    char *pos = (char *)line;
    size_t pat_len = strlen(pattern);

    while (*pos) {
        // 检查当前位置是否匹配
        if (strncmp(pos, pattern, pat_len) == 0) {
            // ANSI 红色开始
            printf("\033[1;31m");
            // 打印匹配部分
            for (size_t i = 0; i < pat_len; i++) {
                putchar(pos[i]);
            }
            // ANSI 颜色重置
            printf("\033[0m");
            pos += pat_len;
        } else {
            putchar(*pos);
            pos++;
        }
    }
}
```

---

## 6. 知识总结与应用

### 这两个工具教会你的核心范式

**范式 1：逐字符状态机处理**
```
while (ch = fgetc(fp), ch != EOF) {
    if (条件) 状态切换;
    if (状态 == X && 条件) 动作();
}
```
适用于：词法分析、解析器、协议解析

**范式 2：逐行过滤处理**
```
while (fgets(line, size, fp)) {
    if (匹配条件(line)) {
        输出(line);
    }
}
```
适用于：日志分析、数据清洗、ETL 管道

### 真实世界的工具远比这复杂

| 真实工具 | 为什么那么大                                       |
|----------|----------------------------------------------------|
| GNU wc   | 多字节字符、locale 感知、性能优化、POSIX 合规      |
| GNU grep | Boyer-Moore 算法、正则引擎（DFA/NFA）、颜色、二进制检测 |

但——核心逻辑完全一样！你写的 100 行代码和 GNU 的 5000 行代码，在最基本的层面上做了同一件事。

---

## 本章掌握清单

- [ ] 能手写逐字符的状态机（用于单词计数等场景）
- [ ] 理解 `isspace()` 等字符分类函数的用法
- [ ] 会用 `strstr()` 进行基本字符串匹配
- [ ] 能手写忽略大小写的字符串搜索
- [ ] 能用 `getopt` 为工具添加多种选项
- [ ] 会设计测试矩阵，用系统工具对比验证
- [ ] 对"逐行处理"和"逐字符处理"两种范式有清晰认识

---

## 项目通关！

恭喜你完成了两个完整的 C 语言项目！回顾一下这段旅程：

你在第 12 关写了两个每天都会用到的命令行工具。你学到的不仅仅是"怎么写代码"，而是：

> **"操作系统里的每一个命令，拆开来看，都是几十行 C 代码加一个聪明的算法。"**

接下来，你可以：
- 把学到的状态机思维用到下一个项目（比如写一个 JSON 解析器）
- 试着给你的 Shell 加上管道功能（连接上一章和这一章的知识）
- 把 `mygrep` 改造为支持正则表达式的版本
- 或者——自己设计一个小工具，解决一个你实际遇到的问题

编写者是你，使用者也是你。这才是学习编程最爽的地方。
