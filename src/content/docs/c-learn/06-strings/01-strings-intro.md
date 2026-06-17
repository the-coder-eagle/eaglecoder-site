---
category: "C语言教程"
title: "字符串基础 — 文字处理入门"
description: "C语言学习教程"
slug: "strings-intro"
level: 6
order: 1
tags: ["字符串", "char数组", "strlen", "strcpy", "strcmp"]
---

# 字符串基础 — 文字处理入门

C 语言没有专门的"字符串类型"。字符串就是**以 `\0` 结尾的字符数组**。

这一章是整个字符串主题的基石。学完后，你会理解 C 语言处理文本的全部底层原理。

## 字符串到底是什么？

很多语言把字符串当成一个独立的数据类型——Python 的 `str`，Java 的 `String`。C 语言不一样：字符串只是**存储在内存中的一连串字符**。编译器不帮你管理，内存不帮你检查——一切都交给你自己来。

```c
char str[] = "Hello";

// 编译后，内存中实际存储的内容：
//
//   地址     内容     下标
//   ─────────────────────
//   0x1000 │ 'H'  │  [0]
//   0x1001 │ 'e'  │  [1]
//   0x1002 │ 'l'  │  [2]
//   0x1003 │ 'l'  │  [3]
//   0x1004 │ 'o'  │  [4]
//   0x1005 │ '\0' │  [5]
//
//   一共 6 个字节，不是 5 个！
```

计算机怎么知道字符串在哪里结束？答案就是**空字符 `\0`**（也叫 NUL 字符，ASCII 码为 0）。C 语言里所有处理字符串的函数——`printf`、`strlen`、`strcpy`——它们从第一个字符开始扫描，一直走到 `\0` 就停下来。没有 `\0`，它们就会越界继续读，直到在内存的某个地方偶然碰到一个值为 0 的字节为止。

### 为什么是 `\0` 而不是别的？

- `\0` 的值是 0，ASCII 中没有任何可显示字符的编码是 0
- 硬件层面判断一个字节是否为 0 是极快的（一条 CPU 指令）
- C 语言的设计者 Ken Thompson 和 Dennis Ritchie 在 B 语言中就这么干了

### 初学者最容易踩的坑

```c
// 误区一：把字符数组和字符串画等号
char arr[5] = {'H', 'e', 'l', 'l', 'o'};
// 这不是字符串！没有 \0，strlen(arr) 的结果是未定义的

// 误区二：认为 strlen 是数组长度
char buf[100] = "Hi";
// strlen(buf) 是 2，sizeof(buf) 是 100。两个概念完全不同

// 误区三：用 == 比较字符串
char *a = "hello";
char *b = "hello";
if (a == b)       // 比较的是地址，不是内容！
    printf("相等");
// 大多数情况下 a 和 b 的地址不同，条件为假
```

## 声明字符串的三种方式

三种声明方式的区别，是字符串入门最重要的一课。每一种在内存中的存放位置、是否可以修改、大小如何决定，都不一样。

### 方式一：字符数组（栈上，可修改）

```c
char s1[20] = "Hello";
// 在栈上分配 20 个字节
// 前 6 个字节依次是 H e l l o \0
// 剩余的 14 个字节未初始化（垃圾值）

s1[0] = 'h';   // ✅ 可以修改——这是普通数组
s1[5] = '!';   // ✅ 覆盖了 \0，但记得补上新的 \0！
s1[6] = '\0';  // ⚠️ 覆盖后必须手动加 \0，否则不再是合法字符串
```

```c
char s2[] = "World";
// sizeof(s2) = 6，编译器自动计算大小（5 个字母 + 1 个 \0）
// 数组大小固定——以后不能再往 s2 后面塞更多字符
```

### 方式二：字符指针（指向常量区，不可修改）

```c
char *s3 = "Hello";
// 指针 s3 指向只读数据段（.rodata）中的字符串字面量
// 这个字符串是编译时就确定好的常量

// s3[0] = 'h';  // ❌ 未定义行为！可能导致段错误 (Segmentation Fault)
// 常量区的内存是只读的，写操作会触发操作系统保护机制
```

一张图看懂三者的内存布局：

```
方式一：char s1[20] = "Hello";
┌─────────────────────────── 栈内存 ───────────────────────────┐
│  H │ e │ l │ l │ o │\0 │ ? │ ? │ ? │ ? │ ? │ ? │ ? │ ...   │
│  0   1   2   3   4   5   6   7   8   9  10  11  12   ...  19 │
└──────────────────────────────────────────────────────────────┘
     ↑ 一共 20 字节，前 6 个已初始化，后面是垃圾值


方式二：char s2[] = "World";
┌──────── 栈内存 ────────┐
│  W │ o │ r │ l │ d │\0 │
│  0   1   2   3   4   5  │
└────────────────────────┘
     ↑ 恰好 6 字节，不能再多


方式三：char *s3 = "Hello";
栈上                       只读数据段 (.rodata)
┌──────────┐              ┌───────────────────┐
│ 指针 s3  │────指向────→ │ H e l l o \0      │
│ (8字节)  │              │ (6 字节，只读！)   │
└──────────┘              └───────────────────┘
```

### 什么时候用哪种？

| 方式 | 可修改？ | 什么时候用 |
|------|---------|-----------|
| `char arr[N] = "..."` | ✅ 可以 | 需要修改字符串内容、拼接、替换 |
| `char arr[] = "..."` | ✅ 可以 | 确定不再增长的小字符串 |
| `char *p = "..."` | ❌ 不可以 | 只读使用、函数参数、避免拷贝 |

一个常见的困惑：下面两行有什么区别？

```c
char *p = "abc";    // p 指向字符串常量，p 本身可以改（重新指向别的）
// p = "xyz";       // ✅ 可以的，只是修改指针的指向
// p[0] = 'A';     // ❌ 不能修改指向的内容

char arr[] = "abc"; // arr 是数组，arr 本身不能改
// arr = "xyz";     // ❌ 编译错误！数组名是常量指针
// arr[0] = 'A';    // ✅ 可以修改数组内容
```

## 深入 `<string.h>`：常用字符串函数

`<string.h>` 是 C 标准库中最常用的头文件之一。下面逐一剖析每个函数的工作原理、使用方法和陷阱。

### strlen — 测量字符串长度

```c
size_t strlen(const char *s);
```

**工作原理：** 从 `s` 开始，逐字节往下走，每走一步计数器加一，直到遇到 `\0` 为止。**返回的长度不包括 `\0`**。

```c
#include <string.h>
#include <stdio.h>

int main() {
    char str[] = "Hello";
    printf("strlen = %zu\n", strlen(str));  // 5
    printf("sizeof = %zu\n", sizeof(str));  // 6
    // strlen 返回的是逻辑长度，sizeof 返回的是物理大小
    return 0;
}
```

**陷阱：** 如果字符串末尾意外丢失了 `\0`，`strlen` 会一直读到内存中的某个零值才停，结果完全不可预测。这就是为什么遍历刚分配的字符数组前必须先确保它合法。

### strcpy — 复制字符串

```c
char *strcpy(char *dest, const char *src);
```

**工作原理：** 把 `src` 的内容（包括 `\0`）逐字节拷贝到 `dest`。**不检查 `dest` 是否够大！**

这是 C 语言最危险的函数之一。如果 `src` 比 `dest` 长，多余的字节会覆盖 `dest` 后面的内存——这就是经典的**缓冲区溢出**。

```c
char dest[5];
strcpy(dest, "Hello, world!");
// "Hello, world!" 需要 14 个字节
// dest 只有 5 个字节
// 结果：dest 后面 9 个字节的内存被破坏了
// 如果那 9 个字节碰巧是别的变量——程序崩溃或出现诡异的 bug
```

**安全替代：`strncpy`**

```c
char dest[5];
strncpy(dest, "Hello, world!", sizeof(dest) - 1);
dest[sizeof(dest) - 1] = '\0';  // 手动保证 \0 存在！
// strncpy 只复制前 4 个字符，留下一个位置放 \0
```

`strncpy` 的一个奇怪之处：如果 `src` 比 `n` 短，它会把 `dest` 剩余的位置全填成 `\0`——有时这不是你想要的。更现代的做法是用 `snprintf`。

### strcat — 拼接字符串

```c
char *strcat(char *dest, const char *src);
```

**工作原理：** 先找到 `dest` 末尾的 `\0`，然后从那里开始把 `src` 的内容（包括 `\0`）拷贝过去。

```c
#include <string.h>
#include <stdio.h>

int main() {
    char buf[50] = "Hello ";
    strcat(buf, "World");
    printf("%s\n", buf);  // "Hello World"
    return 0;
}
```

**内存示意图：**

```
初始状态：
buf: ┌─H─┬─e─┬─l─┬─l─┬─o─┬─ ─┬─\0┬───┬───┬───┬ .... ───┐
      0   1   2   3   4   5   6   7   8   9   ...        49

strcat(buf, "World"):
     先找到 buf[6] 的 \0
     从 buf[6] 开始写入 "World\0"

结果：
buf: ┌─H─┬─e─┬─l─┬─l─┬─o─┬─ ─┬─W─┬─o─┬─r─┬─l─┬─d─┬─\0┬ ... ─┐
      0   1   2   3   4   5   6   7   8   9  10  11  12 ...  49
```

和 `strcpy` 一样，`strcat` 也不检查 `dest` 是否够大。安全替代：`strncat(dest, src, sizeof(dest) - strlen(dest) - 1)`。

### strcmp — 比较字符串

```c
int strcmp(const char *s1, const char *s2);
```

**工作原理：** 从两个字符串的第一个字符开始，逐字符比对它们的 ASCII 值。遇到不同的字符（或任一字符串的 `\0`）就停止，返回差值。

**返回值：**
- `0` — 两字符串完全相等
- `< 0` — s1 在字典序中小于 s2
- `> 0` — s1 在字典序中大于 s2

```c
strcmp("abc", "abc")   // 0
strcmp("abc", "abd")   // 负数（'c' - 'd' = -1 或类似的负值）
strcmp("xyz", "abc")   // 正数（'x' - 'a' > 0）
strcmp("abc", "ab")    // 正数（'c' - '\0' = 99）
strcmp("ab", "abc")    // 负数（'\0' - 'c' = -99）
```

**⚠️ 新手第一陷阱：**

```c
if (strcmp(a, b) == 0)   // ✅ a 等于 b（记住：相等返回 0）
    printf("相等");

if (strcmp(a, b))        // ❌ 错误！非零意味着"不相等"
    printf("不相等");    // 逻辑和你直觉相反

if (!strcmp(a, b))       // ✅ 也行（!0 = 真），但不如 == 0 清晰
    printf("相等");
```

"相等返回 0"这个设计初看反直觉，但如果你把它理解为"差异度"——返回 0 意味着没有任何差异——其实很合理。

### strchr 和 strstr — 查找字符和子串

```c
char *strchr(const char *s, int c);     // 从左往右找字符 c
char *strrchr(const char *s, int c);    // 从右往左找字符 c
char *strstr(const char *haystack, const char *needle);  // 找子串
```

```c
#include <string.h>
#include <stdio.h>

int main() {
    char str[] = "hello world, hello universe";

    // 找第一个 'o'
    char *p = strchr(str, 'o');
    printf("第一个 'o' 在位置: %ld\n", p - str);  // 4

    // 找最后一个 'o'
    char *q = strrchr(str, 'o');
    printf("最后一个 'o' 在位置: %ld\n", q - str);  // 19

    // 找子串 "world"
    char *r = strstr(str, "world");
    if (r != NULL) {
        printf("找到了: %s\n", r);  // "world, hello universe"
    }

    return 0;
}
```

返回值是**指针**——指向在原字符串中找到的位置。如果没找到，返回 `NULL`。可以用指针算术算出位置索引（`p - str`）。

## 字符分类函数 (`<ctype.h>`)

这些函数接受一个字符（以 `int` 形式），返回一个布尔值（非零为真，零为假）。

```c
#include <ctype.h>

// 判断类
isalpha('A')    // 是字母 (A-Z, a-z) 吗？    → 非零（真）
isdigit('5')    // 是数字 (0-9) 吗？          → 非零（真）
isalnum('x')    // 是字母或数字吗？            → 非零（真）
isspace(' ')    // 是空白字符 (空格, \t, \n) 吗？ → 非零（真）
islower('a')    // 是小写字母吗？             → 非零（真）
isupper('Z')    // 是大写字母吗？             → 非零（真）
ispunct('!')    // 是标点符号吗？             → 非零（真）
isprint('\n')   // 是可打印字符吗？           → 0（假。\n 不可打印）
iscntrl('\n')   // 是控制字符吗？             → 非零（真）

// 转换类
toupper('a')    // 转大写 → 'A'
tolower('Z')    // 转小写 → 'z'
```

### 为什么参数是 int 而不是 char？

因为 `char` 在 C 中可能是有符号的（-128 ~ 127），而 `EOF`（文件结束标记）的值是 -1。用 `int` 可以同时容纳 `char` 的所有合法值（包括 unsigned char 转来的 0~255）和 `EOF`。这是一个容易被忽略但很重要的设计细节。

## 综合练习一：大小写转换器

```c
#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main() {
    char str[200];
    printf("请输入一行英文: ");
    fgets(str, sizeof(str), stdin);
    str[strcspn(str, "\n")] = '\0';  // 去掉末尾换行

    int len = strlen(str);

    // 转全大写
    for (int i = 0; i < len; i++) {
        str[i] = toupper((unsigned char)str[i]);
    }
    printf("全大写: %s\n", str);

    // 转全小写（需要还原一下——从 stdin 重新读取或操作副本）
    for (int i = 0; i < len; i++) {
        str[i] = tolower((unsigned char)str[i]);
    }
    printf("全小写: %s\n", str);

    return 0;
}
```

注意 `(unsigned char)` 的类型转换——这是一道安全防线。如果 `char` 刚好是负数（比如中文编码的高位字节），直接传给 `toupper` 会触发未定义行为。

## 综合练习二：回文检测器

```c
#include <stdio.h>
#include <string.h>
#include <ctype.h>

// 判断字符串是否是回文（忽略大小写和非字母数字字符）
int is_palindrome(const char *s) {
    int left = 0;
    int right = strlen(s) - 1;

    while (left < right) {
        // 跳过左侧的非字母数字字符
        while (left < right && !isalnum((unsigned char)s[left]))
            left++;
        // 跳过右侧的非字母数字字符
        while (left < right && !isalnum((unsigned char)s[right]))
            right--;

        if (tolower((unsigned char)s[left]) !=
            tolower((unsigned char)s[right]))
            return 0;  // 不是回文

        left++;
        right--;
    }
    return 1;  // 是回文
}

int main() {
    char str[200];
    printf("请输入一个字符串: ");
    fgets(str, sizeof(str), stdin);
    str[strcspn(str, "\n")] = '\0';

    if (is_palindrome(str))
        printf("\"%s\" 是回文！\n", str);
    else
        printf("\"%s\" 不是回文。\n", str);

    return 0;
}

// 试试这些输入：
// "A man a plan a canal Panama" → 是回文！
// "racecar"                     → 是回文！
// "hello"                       → 不是回文
```

## 要点速查

| 概念 | 说明 |
|------|------|
| 字符串本质 | 以 `\0` 结尾的字符数组 |
| `strlen(s)` | 返回长度，**不包括** `\0` |
| `strcmp(a, b)` | **返回 0 表示相等**——记牢这一点 |
| `strcpy(dst, src)` | 拷贝，**不检查缓冲区大小** |
| `strcat(dst, src)` | 拼接，**同样不检查大小** |
| `==` 比较字符串 | 错误的——比较的是地址 |
| `\0` 丢失 | 所有字符串函数都会越界——灾难级 bug |
| `char *p = "..."` | 指向只读常量，**不能修改内容** |
| `char arr[] = "..."` | 栈上数组，**可以修改内容** |
| `fgets` 保留 `\n` | 用 `strcspn` 或逐字符处理去掉换行 |
