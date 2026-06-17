---
category: "C语言教程"
title: "文件操作基础"
description: "C语言学习教程"
slug: "file-io-intro"
level: 8
order: 1
tags: ["文件", "FILE", "fopen", "fclose", "fprintf", "fscanf", "fgets", "fputs"]
---

# 文件操作基础 — 让数据"活"到程序之外

到现在为止，我们写的所有程序都有一个共同的问题：**数据存在变量里，运行完就没了**。你辛辛苦苦输入 40 个学生的成绩，程序一关，全泡汤。

**文件操作**就是解决这个问题的。把数据写到磁盘文件中，下次打开程序再读出来——就像你把作业保存为 Word 文档，关了电脑明天还能接着写。

## 核心概念：FILE 指针

C 语言用一个叫 `FILE` 的结构体（定义在 `<stdio.h>`）来代表一个"打开的文件"。你不需要知道 `FILE` 里面有什么——只需要拿着它的**指针**，传给各种文件操作函数就行。

```c
FILE *fp;  // fp 是一个"文件句柄"，通过它操作文件
```

可以把 `FILE *` 想象成一根"遥控天线"——你用这根天线（指针）对文件发出各种指令（读、写、关闭）。

## fopen — 打开文件

```c
FILE *fopen(const char *filename, const char *mode);
```

- `filename`：文件名（可以包含路径），如 `"data.txt"`、`"C:\\Users\\me\\doc.txt"`
- `mode`：打开模式（一个字符串），决定了"怎么用这个文件"
- 返回值：成功返回 `FILE *`，失败返回 `NULL`

### 打开模式完整对照表

| 模式 | 含义 | 文件不存在 | 文件已存在 | 读写位置 |
|------|------|-----------|-----------|---------|
| `"r"` | 只读 | 返回 `NULL` (失败) | 从头读 | 文件开头 |
| `"w"` | 只写 | 创建新文件 | **清空内容**再写 | 文件开头 |
| `"a"` | 追加写 | 创建新文件 | 在末尾接着写 | 文件末尾 |
| `"r+"` | 读写 | 返回 `NULL` (失败) | 可读可写 | 文件开头 |
| `"w+"` | 读写 | 创建新文件 | **清空内容**后可读可写 | 文件开头 |
| `"a+"` | 读+追加写 | 创建新文件 | 可从任意位置读，写只能在末尾 | 读位置：开头；写位置：末尾 |

### 二进制模式（后面会展开）

在模式字符串末尾加 `b`：

| 模式 | 含义 |
|------|------|
| `"rb"` | 二进制只读 |
| `"wb"` | 二进制只写 |
| `"ab"` | 二进制追加 |
| `"r+b"` / `"rb+"` | 二进制读写 |

> 在 Linux/Mac 上，`"r"` 和 `"rb"` 没有区别。但在 Windows 上：文本模式会做 `\n` ↔ `\r\n` 转换，二进制模式不会。如果你不确定，处理非文本文件一律用 `b`。

### 新手最容易踩的坑

```c
// 坑 1：不检查 fopen 的返回值
FILE *fp = fopen("nonexistent.txt", "r");
fprintf(fp, "hello");  // 文件没打开成功，fp 是 NULL，程序崩溃！

// 正确做法：
FILE *fp = fopen("data.txt", "r");
if (fp == NULL) {
    printf("文件打开失败！可能文件不存在或没有权限。\n");
    return 1;
}
```

```c
// 坑 2：用 "w" 打开已有文件
FILE *fp = fopen("我的日记.txt", "w");  // 原来的日记全没了！
fprintf(fp, "新内容\n");
fclose(fp);
// 如果你只是想添加内容，应该用 "a"
```

```c
// 坑 3：忘记 fclose
FILE *fp = fopen("data.txt", "w");
fprintf(fp, "hello");
// 程序结束前没调 fclose
// 可能导致：1. 数据没真正写入磁盘  2. 资源泄漏
```

## fclose — 关闭文件

关闭文件做了三件事：
1. 把缓冲区里没写完的数据真正写到磁盘（"刷新缓冲区"）
2. 释放与文件相关的系统资源
3. 使 `FILE *` 指针失效

```c
fclose(fp);
fp = NULL;  // 好习惯：防止"悬空指针"
```

## 写文件

### fprintf — 格式化写入（最常用）

和 `printf` 几乎一样，只是多了一个 `FILE *` 参数：

```c
fprintf(fp, 格式字符串, 参数...);
```

```c
#include <stdio.h>

int main() {
    FILE *fp = fopen("students.txt", "w");
    if (fp == NULL) {
        printf("无法创建文件！\n");
        return 1;
    }

    // 像写 printf 一样写 fprintf
    fprintf(fp, "===== 学生成绩表 =====\n");
    fprintf(fp, "姓名：%s\n", "张三");
    fprintf(fp, "学号：%d\n", 2024001);
    fprintf(fp, "语文：%.1f  数学：%.1f  英语：%.1f\n", 92.5, 88.0, 95.5);
    fprintf(fp, "平均分：%.1f\n", (92.5 + 88.0 + 95.5) / 3.0);
    fprintf(fp, "========================\n");

    fclose(fp);
    printf("文件写入完成！\n");
    return 0;
}
```

启动程序后，你会发现项目目录下多了一个 `students.txt`，打开就是：

```
===== 学生成绩表 =====
姓名：张三
学号：2024001
语文：92.5  数学：88.0  英语：95.5
平均分：92.0
========================
```

### fputs — 写一个字符串（不自动换行）

```c
fputs("这是一行文字\n", fp);   // 不自动加 \n，需要手动加
fputs("这是另一行\n", fp);
```

### fputc — 写一个字符

```c
fputc('A', fp);
fputc('\n', fp);
```

### 三种写函数的对比

| 函数 | 用途 | 自动换行？ | 格式化？ |
|------|------|-----------|---------|
| `fprintf` | 格式化输出 | 否（需 `\n`） | 是 |
| `fputs` | 写字符串 | 否 | 否 |
| `fputc` | 写单个字符 | 否 | 否 |

## 读文件

### fgets — 逐行读取（最常用）

```c
char *fgets(char *buffer, int size, FILE *stream);
```

- `buffer`：读到的内容放这里（字符数组）
- `size`：最多读多少个字符（通常用 `sizeof(buffer)`）
- 返回：成功返回 `buffer`，到达文件尾或出错返回 `NULL`

```c
#include <stdio.h>

int main() {
    FILE *fp = fopen("students.txt", "r");
    if (fp == NULL) {
        printf("文件打开失败！\n");
        return 1;
    }

    char line[256];   // 一行最多 255 个字符（余一个放 '\0'）
    int line_number = 1;

    // fgets 返回 NULL 时表示文件读完了（或出错）
    while (fgets(line, sizeof(line), fp) != NULL) {
        printf("%d: %s", line_number, line);  // line 本身已含换行符
        line_number++;
    }

    fclose(fp);
    return 0;
}
```

**注意**：`fgets` 读到换行符 `\n` 时会把它也存进 `buffer`。如果你不想要换行符，可以手动去掉：

```c
// 去掉末尾的换行符
size_t len = strlen(line);
if (len > 0 && line[len - 1] == '\n') {
    line[len - 1] = '\0';
}
```

### fscanf — 格式化读取

```c
int fscanf(FILE *stream, const char *format, ...);
```

假设有一个文件 `scores.txt` 内容如下：

```
张三 92.5
李四 78.0
王五 85.0
```

读取代码：

```c
#include <stdio.h>

int main() {
    FILE *fp = fopen("scores.txt", "r");
    if (fp == NULL) return 1;

    char name[32];
    float score;

    printf("===== 读到的成绩 =====\n");
    // fscanf 返回成功匹配并赋值的项数
    while (fscanf(fp, "%s %f", name, &score) == 2) {
        printf("姓名：%s，成绩：%.1f\n", name, score);
    }

    fclose(fp);
    return 0;
}
```

`fscanf` 的返回值非常重要：它表示成功读到了几个值。上例中，每次循环期望读到 2 个（一个字符串、一个浮点数），所以判断 `== 2`。

**fscanf 的局限**：它遇到空格、换行就会分隔，所以不适合读取带空格的文本（如 `"Zhang San"` 会被当成两个字符串）。

### fgetc — 读取一个字符

```c
int ch;
while ((ch = fgetc(fp)) != EOF) {
    putchar(ch);  // 打印到屏幕
}
```

`EOF`（End Of File）是一个特殊值（通常是 `-1`），表示文件结束。

### 三种读函数的对比

| 函数 | 用途 | 适合场景 |
|------|------|---------|
| `fgets` | 读一行（含换行符） | 逐行处理文本，读带空格的内容 |
| `fscanf` | 按格式读取 | 文件格式规整，知道每行的结构 |
| `fgetc` | 每次读一个字符 | 逐个字符处理，需要精确控制 |

## 综合示例：一个简易日记程序

```c
#include <stdio.h>
#include <string.h>
#include <time.h>

#define FILENAME "diary.txt"

// 写一篇新日记（追加模式）
void write_diary() {
    FILE *fp = fopen(FILENAME, "a");  // "a" = 追加模式
    if (fp == NULL) {
        printf("无法打开日记文件！\n");
        return;
    }

    // 获取当前时间
    time_t now = time(NULL);
    char *date_str = ctime(&now);
    // ctime 返回的字符串自带换行符，但我们想自定义格式
    date_str[strlen(date_str) - 1] = '\0';  // 去掉末尾的 \n

    fprintf(fp, "=== %s ===\n", date_str);

    printf("请输入今天的日记内容（输入 END 结束）：\n");
    char line[512];
    while (1) {
        printf("> ");
        fgets(line, sizeof(line), stdin);

        // 去掉换行符
        line[strcspn(line, "\n")] = '\0';

        // 输入 END 结束
        if (strcmp(line, "END") == 0) break;

        fprintf(fp, "%s\n", line);
    }
    fprintf(fp, "\n");  // 日记之间空一行

    fclose(fp);
    printf("日记已保存。\n");
}

// 读所有日记
void read_diary() {
    FILE *fp = fopen(FILENAME, "r");
    if (fp == NULL) {
        printf("还没有日记呢，先去写一篇吧！\n");
        return;
    }

    printf("\n========== 我的日记 ==========\n");
    char line[512];
    while (fgets(line, sizeof(line), fp) != NULL) {
        printf("%s", line);  // line 自带 \n，所以不加 \n
    }
    printf("==============================\n");

    fclose(fp);
}

int main() {
    int choice;
    while (1) {
        printf("\n===== 简易日记本 =====\n");
        printf("1. 写日记\n");
        printf("2. 看日记\n");
        printf("3. 退出\n");
        printf("请选择（1-3）：");
        scanf("%d", &choice);
        getchar();  // 吃掉 scanf 留下的换行符

        switch (choice) {
            case 1: write_diary();  break;
            case 2: read_diary();   break;
            case 3:
                printf("再见！\n");
                return 0;
            default:
                printf("无效选择，请重试。\n");
        }
    }
}
```

这个程序把之前学的循环、分支、字符串、函数、文件操作全串起来了。试着运行它，写几篇日记，关闭程序再打开——日记都在。

## 常用模式速查

### 模式 1：创建新文件并写入

```c
FILE *fp = fopen("output.txt", "w");
if (fp == NULL) { /* 错误处理 */ return 1; }
fprintf(fp, "内容\n");
fclose(fp);
```

### 模式 2：读取已有文件所有内容

```c
FILE *fp = fopen("input.txt", "r");
if (fp == NULL) { /* 错误处理 */ return 1; }
char line[256];
while (fgets(line, sizeof(line), fp) != NULL) {
    // 处理每一行
    printf("%s", line);
}
fclose(fp);
```

### 模式 3：追加内容到文件末尾

```c
FILE *fp = fopen("log.txt", "a");
if (fp == NULL) { /* 错误处理 */ return 1; }
fprintf(fp, "新的日志条目\n");
fclose(fp);
```

### 模式 4：统计文件行数

```c
FILE *fp = fopen("data.txt", "r");
if (fp == NULL) return 1;
int lines = 0;
char buf[256];
while (fgets(buf, sizeof(buf), fp) != NULL) {
    lines++;
}
printf("文件共 %d 行\n", lines);
fclose(fp);
```

### 模式 5：复制文件内容

```c
FILE *src = fopen("source.txt", "r");
FILE *dst = fopen("dest.txt", "w");
if (src == NULL || dst == NULL) {
    printf("打开文件失败！\n");
    return 1;
}
char line[1024];
while (fgets(line, sizeof(line), src) != NULL) {
    fputs(line, dst);  // 逐行复制
}
fclose(src);
fclose(dst);
printf("复制完成！\n");
```

## 常见错误速查

| 症状 | 常见原因 |
|------|---------|
| 程序崩溃（segfault） | `fopen` 失败返回 `NULL`，你用 `NULL` 指针调用了 `fprintf` |
| 文件内容总是空的 | 忘了 `fclose`，缓冲区没刷新 |
| `w` 模式下旧内容消失 | 这正是 `w` 的行为——先清空再写。用 `a` 追加 |
| 读取的内容多了奇怪字符 | `fgets` 的 buffer 不够大，一行被截断了 |
| `fscanf` 死循环 | 读到最后无法匹配格式，但也没到 EOF。用返回值判断 |
| 中文乱码 | Windows 控制台默认 GBK，检查文件编码是否为 UTF-8 |

## 要点速查

| 概念 | 说明 |
|------|------|
| `FILE *` | 文件指针（文件句柄），所有文件操作的核心 |
| `fopen(path, mode)` | 打开文件，失败返回 `NULL` |
| `fclose(fp)` | 关闭文件，刷新缓冲区，释放资源 |
| `"r"` / `"w"` / `"a"` | 读 / 写（清空）/ 追加 |
| `fprintf` | 格式化写入，用法和 `printf` 一样 |
| `fgets(buf, size, fp)` | 读一行（含换行符），文件尾返回 `NULL` |
| `fscanf` | 格式化读取，返回值 = 成功读取的项数 |
| `fputc` / `fgetc` | 写一个字符 / 读一个字符 |
| `fputs` | 写一个字符串（不自动换行） |

掌握了文件操作，你的程序就真正有了"记忆"——数据可以跨越程序的启动和关闭而持久存在。下一课我们学习二进制文件读写和错误处理，让你能高效处理更复杂的数据。
