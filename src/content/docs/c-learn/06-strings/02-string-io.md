---
category: "C语言教程"
title: "字符串输入输出 — scanf, fgets 与缓冲区安全"
description: "C语言学习教程"
slug: "string-io"
level: 6
order: 2
tags: ["字符串", "scanf", "gets", "fgets", "缓冲区"]
---

# 字符串输入输出 — scanf, fgets 与缓冲区安全

用户输入是 C 程序中最容易出问题的环节。这一章把 `scanf` 和 `fgets` 掰开揉碎，让你彻底理解它们的行为差异，并学会写出真正安全的输入代码。

## 再谈 scanf 的字符串输入

`scanf("%s", ...)` 是很多教科书上第一个介绍的输入方式，但它有两大硬伤。

### 硬伤一：遇空格就停

```c
#include <stdio.h>

int main() {
    char name[50];
    printf("请输入你的全名: ");
    scanf("%s", name);
    printf("你好, %s\n", name);
    return 0;
}
```

```
运行效果：
请输入你的全名: Zhang San
你好, Zhang

// "San" 哪去了？被留在输入缓冲区里了！
```

**原因：** `%s` 的规则是——读取连续的非空白字符，遇到空格、Tab、换行就停止。你输入 `Zhang San\n`，`scanf` 读走 `Zhang`，把 ` San\n` 留在缓冲区里。

### 硬伤二：不检查长度——缓冲区溢出

```c
char buf[10];
scanf("%s", buf);
// 用户输入 "supercalifragilisticexpialidocious"（34 个字符）
// buf 只有 10 字节，溢出 24 个字节到栈上
// 后果：覆盖返回地址 → 程序崩溃
```

**为什么危险？** `scanf("%s")` 不知道 `buf` 有多大。它只管往里塞，塞到 `\0` 为止。这正是无数安全漏洞（CVE）的根源。

`scanf` 有一个"不那么糟糕"的变体：

```c
char buf[10];
scanf("%9s", buf);
// 最多读 9 个字符，留 1 位给 \0
// 但空格问题依然存在
```

`%9s` 限制了最大读取宽度，但依然在遇到空格时停止。而且你要手动计算并写死宽度，一旦修改数组大小很容易忘记同步更新格式串。

### scanf 的返回值

初学者经常忽略的一个事实：`scanf` 是有返回值的。

```c
int result = scanf("%s", buf);
// result = 成功匹配并赋值的项数
// 如果用户在输入任何内容之前按了 Ctrl+Z (Windows) 或 Ctrl+D (Unix)
// scanf 返回 EOF（通常是 -1）
```

```c
if (scanf("%s", buf) != 1) {
    printf("输入失败或遇到文件结束\n");
    return 1;
}
```

## fgets：读取整行的正确方式

```c
char *fgets(char *s, int size, FILE *stream);
```

`fgets` 的三参数设计恰好解决了 `scanf` 的两大问题：

| scanf 问题 | fgets 如何解决 |
|-----------|---------------|
| 遇空格就停 | 读到 `\n` 才停（或缓冲区满） |
| 不检查长度 | 显式传入缓冲区大小，最多读 size-1 个字符 |

### fgets 的行为详解

```c
#include <stdio.h>

int main() {
    char line[10];  // 故意设小一点，方便观察行为

    printf("请输入一行文字: ");
    fgets(line, sizeof(line), stdin);
    printf("缓冲区内容: [%s]\n", line);
    return 0;
}
```

```
运行效果（用户输入 "HelloWorld!"）：

请输入一行文字: HelloWorld!
缓冲区内容: [HelloWorl]

// line 中有 9 个字符 "HelloWorl" + \0
// 'd' 和 '!' 和 '\n' 留在输入缓冲区中！
```

`fgets` 遇到以下三种情况之一就停止：
1. 读到了换行符 `\n`（换行符会被**放进缓冲区**）
2. 已经读了 `size - 1` 个字符（留一个位置给 `\0`）
3. 遇到了文件结束 (EOF)

### 换行符的问题

`fgets` 会保留换行符，这意味着：

```c
char name[20];
fgets(name, sizeof(name), stdin);
// 用户输入 "张三\n"
// name = "张三\n\0"

printf("你好, %s!", name);
// 输出：你好, 张三
// !
// 换行符导致输出换行——可能不是你想要的
```

**去掉换行符的方法一：strcspn（推荐）**

```c
#include <string.h>

char name[20];
fgets(name, sizeof(name), stdin);
name[strcspn(name, "\n")] = '\0';
```

`strcspn` 返回字符串中第一个换行出现的位置；如果没有换行（比如输入超长），则返回字符串末尾 `\0` 的位置——此时覆盖 `\0` 什么都不影响。

**去掉换行符的方法二：手动检查**

```c
#include <string.h>

char name[20];
fgets(name, sizeof(name), stdin);
int len = strlen(name);
if (len > 0 && name[len - 1] == '\n') {
    name[len - 1] = '\0';
}
```

### 检测输入是否被截断

`fgets` 不会告诉你输入是否因为缓冲区不够而被截断。你需要自己判断：

```c
#include <stdio.h>
#include <string.h>

int main() {
    char line[10];
    printf("请输入: ");
    fgets(line, sizeof(line), stdin);

    // 检测是否截断
    int len = strlen(line);
    if (line[len - 1] != '\n') {
        // 没有读到换行 —— 要么缓冲区满了，要么输入结束
        printf("警告：输入超过 %zu 个字符，已被截断。\n",
               sizeof(line) - 1);

        // 清空输入缓冲区中的残留内容
        int c;
        while ((c = getchar()) != '\n' && c != EOF) {
            // 消耗掉多余的字符
        }
    } else {
        line[len - 1] = '\0';  // 去掉换行
    }

    printf("你输入的是: [%s]\n", line);
    return 0;
}
```

## gets：永远不要用

```c
// ❌ 绝对不要用！
char buf[100];
gets(buf);
// gets 没有 size 参数——无论用户输入多少，全塞进 buf
// 这是 C 语言历史上最臭名昭著的安全漏洞来源
```

早在 1988 年，世界上第一个大规模网络蠕虫——Morris Worm——就是利用 `gets` 的缓冲区溢出漏洞传播的。C11 标准正式把 `gets` 从标准库中移除。你的编译器可能还能编译它，但不要使用。

## scanf vs fgets：选择指南

```
                    ┌──────────────┐
                    │ 需要读取什么？ │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         单个词/数字                 整行文字
              │                         │
     ┌────────┴────────┐         ┌──────┴──────┐
     │ 输入格式可控？   │         │    用 fgets  │
     └────────┬────────┘         └──────┬──────┘
              │                         │
      ┌───────┴───────┐          ┌──────┴──────┐
      │ 是          否 │          │ 用 sscanf   │
      │               │          │ 解析内容    │
  ┌───┴───┐      ┌────┴────┐    └─────────────┘
  │scanf  │      │ fgets + │
  │(用宽度 │      │ sscanf  │
  │ 限制)  │      │  解析   │
  └───────┘      └─────────┘
```

**一句话总结：** 对字符串输入，默认用 `fgets`，然后用 `sscanf` 解析。

### fgets + sscanf：安全组合

```c
#include <stdio.h>
#include <string.h>

int main() {
    char line[200];
    char name[50];
    int age;

    printf("请输入姓名和年龄（用空格分隔）: ");
    fgets(line, sizeof(line), stdin);

    // 用 sscanf 从缓冲区中提取数据（不是从 stdin！）
    if (sscanf(line, "%49s %d", name, &age) == 2) {
        printf("姓名: %s, 年龄: %d\n", name, age);
    } else {
        printf("格式错误，请输入：姓名 年龄（如 Zhang 25）\n");
    }

    return 0;
}
```

这个模式的好处：
- `fgets` 保护缓冲区大小
- `sscanf` 在已读入的数据上解析，不会阻塞等待
- 即使解析失败，输入已经被安全地消费掉

## 缓冲区溢出：C 语言的阿克琉斯之踵

理解缓冲区溢出，是写出安全 C 代码的一半。

### 内存视角

假设你有这样的代码：

```c
#include <stdio.h>
#include <string.h>

int main() {
    int is_admin = 0;          // 栈上 4 字节
    char password[8];          // 栈上 8 字节
    int login_count = 0;       // 栈上 4 字节

    printf("请输入密码: ");
    gets(password);  // ⛔ 危险！

    if (strcmp(password, "secret") == 0) {
        is_admin = 1;
    }

    if (is_admin) {
        printf("管理员权限已激活！\n");
    }
    return 0;
}
```

栈上的内存布局可能是这样的：

```
低地址                                          高地址
┌──────────────┬──────────────┬──────────────┐
│  password    │  login_count │  is_admin    │
│  [8 字节]    │  [4 字节]    │  [4 字节]    │
│  = 0        │  = 0         │  = 0         │
└──────────────┴──────────────┴──────────────┘

gets 写入 "AAAAAAAAAAAAAAAAAAAA" 后：

┌──────────────┬──────────────┬──────────────┐
│  password    │  login_count │  is_admin    │
│  AAAAAAAAAAA │  AAAAAAAA    │  AAAA        │
│  (溢出！)    │  (被覆盖)     │  (被覆盖)    │
└──────────────┴──────────────┴──────────────┘
```

`is_admin` 被 `AAAA` 覆盖，变成了非零值——于是绕过了权限检查。

> 注：实际栈布局的方向和变量排列顺序由编译器决定，可能和上图不同。上面的图示是为了帮助理解溢出原理，不代表所有编译器都会按这个顺序排布栈帧。但无论编译器如何排列，不安全的输入函数都可能破坏相邻数据。

### 防御之道

```c
// ✅ 始终这样做：
char buf[BUFSIZ];
fgets(buf, sizeof(buf), stdin);       // 1. 限制长度
buf[strcspn(buf, "\n")] = '\0';       // 2. 清理换行

// ❌ 永远不要这样：
char buf[N];
scanf("%s", buf);                     // 无长度保护
gets(buf);                            // 已被废弃
strcpy(buf, user_input);              // 无长度检查
strcat(buf, user_input);              // 无长度检查
sprintf(buf, "%s", user_input);       // 无长度检查
```

## printf 格式化输出字符串

`printf` 不只是 `%s` 这么简单。格式化修饰符可以精确控制输出效果。

```c
#include <stdio.h>

int main() {
    char s[] = "hello";

    // 基本用法
    printf("|%s|\n", s);        // |hello|

    // 控制最小宽度
    printf("|%10s|\n", s);      // |     hello|  右对齐（默认）
    printf("|%-10s|\n", s);     // |hello     |  左对齐（加 - 号）

    // 控制最大字符数（截断）
    printf("|%.3s|\n", s);      // |hel|         最多 3 个字符

    // 宽度 + 截断 组合
    printf("|%10.3s|\n", s);    // |       hel|  宽度 10，最多 3 字符右对齐
    printf("|%-10.3s|\n", s);   // |hel       |  宽度 10，最多 3 字符左对齐

    // 动态宽度（用 * 号从参数获取）
    int width = 12;
    printf("|%*s|\n", width, s);    // |       hello|
    printf("|%.*s|\n", 4, s);       // |hell|
    printf("|%*.*s|\n", 12, 4, s);  // |        hell|

    return 0;
}
```

```
输出效果一览：
|hello|
|     hello|
|hello     |
|hel|
|       hel|
|hel       |
|       hello|
|hell|
|        hell|
```

### printf 精度控制精讲

```
%[flags][width][.precision]specifier

对于 %s：
  width   → 最少输出多少个字符（不够就补空格）
  .precision → 最多输出多少个字符（多了就截断）

对于 %d：
  width   → 同上
  .precision → 最少输出多少位数字（不够在前面补 0）
```

实用例子——做表格输出：

```c
#include <stdio.h>

int main() {
    printf("%-20s %-10s %-6s\n", "姓名", "部门", "工号");
    printf("%-20s %-10s %-6s\n",
           "--------------------", "----------", "------");
    printf("%-20s %-10s %06d\n", "张三", "研发部", 42);
    printf("%-20s %-10s %06d\n", "李四", "市场部", 7);
    printf("%-20s %-10s %06d\n", "王小明", "人事部", 100);
    return 0;
}
```

```
输出效果：
姓名                   部门         工号
-------------------- ---------- ------
张三                   研发部       000042
李四                   市场部       000007
王小明                 人事部       000100
```

## gets_s：标准化尝试

C11 标准引入了 `gets_s` 作为 `gets` 的安全替代：

```c
char buf[100];
if (gets_s(buf, sizeof(buf)) != NULL) {
    // 成功读取
}
```

**但值得注意的是：** GCC 和 Clang 对 `gets_s` 的支持不统一。`gets_s` 是 C11 标准的**可选扩展**（`__STDC_LIB_EXT1__`），不是所有编译器都实现了它。如果追求可移植性，直接用 `fgets` 最为稳妥。

## 自测练习

### 练习一：安全的行读取

编写一个 `my_getline` 函数，读取一行输入并自动去掉换行符，返回读取的字符数。如果输入超长，清空缓冲区并返回 -1。

```c
#include <stdio.h>
#include <string.h>

int my_getline(char *buf, int size) {
    if (fgets(buf, size, stdin) == NULL) {
        return -1;  // EOF 或 error
    }

    int len = strlen(buf);

    // 检测换行
    if (len > 0 && buf[len - 1] == '\n') {
        buf[len - 1] = '\0';
        return len - 1;  // 返回去掉换行后的长度
    }

    // 没有换行 —— 输入太长，清空缓冲区
    int c;
    while ((c = getchar()) != '\n' && c != EOF) {
        // 丢弃多余的字符
    }
    return -1;  // 返回 -1 表示截断
}

int main() {
    char name[10];
    printf("请输入姓名: ");
    if (my_getline(name, sizeof(name)) == -1) {
        printf("输入太长！只取了前 %zu 个字符: %s\n",
               sizeof(name) - 1, name);
    } else {
        printf("你好, %s!\n", name);
    }
    return 0;
}
```

### 练习二：安全的多字段输入

```c
#include <stdio.h>
#include <string.h>

int main() {
    char line[200];
    char name[30];
    int age;
    double score;

    printf("请输入 姓名 年龄 分数（空格分隔）: ");
    fgets(line, sizeof(line), stdin);

    // sscanf 解析已读取的缓冲区，而非 stdin
    int parsed = sscanf(line, "%29s %d %lf", name, &age, &score);

    if (parsed == 3) {
        printf("姓名: %s\n年龄: %d\n分数: %.1f\n", name, age, score);
    } else {
        printf("格式错误！只解析了 %d 个字段。\n", parsed);
        printf("期望格式: 姓名 年龄 分数 (如 Zhang 20 85.5)\n");
    }

    return 0;
}
```

## 要点速查

| 要点 | 说明 |
|------|------|
| `scanf("%s")` | 遇空格停止，不检查长度——不推荐 |
| `scanf("%Ns")` | 限制 N 个字符，但仍遇空格停止 |
| `fgets` | 推荐首选——有长度限制，读整行 |
| `fgets` 保留 `\n` | 用 `strcspn(line, "\n")` 去掉 |
| `gets` | 已被 C11 移除，**永远不要用** |
| `fgets` + 截断检测 | 检查最后字符是否为 `\n`，不是则输入超长 |
| `fgets` + `sscanf` | 安全模式：先读整行，再从缓冲区解析 |
| 缓冲区溢出 | C 语言最危险的安全漏洞，用 fgets 杜绝 |
| printf 格式化 | `%Ns` 宽度、`%.Ns` 截断、`%-Ns` 左对齐 |
