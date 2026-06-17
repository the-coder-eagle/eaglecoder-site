---
category: "C语言教程"
title: "命令行参数 — argc 与 argv"
description: "C语言学习教程"
slug: "command-line-args"
level: 11
order: 1
tags: ["argc", "argv", "命令行", "getopt"]
---

# 命令行参数 — argc 与 argv

你已经学会了写 C 程序，但到目前为止，程序一启动就开始运行，无法在启动时接收外部信息。本章教你如何让程序"听到"用户在命令行上说的话。

## 为什么要学命令行参数？

想一想你常用的命令：

```bash
ls -l /home/user
gcc -Wall -o myprog main.c
git commit -m "fix bug"
```

每个命令后面都跟着一串参数。这些参数改变了程序的行为。学会接收命令行参数，你的程序就像一个合格的"社会成员"——能够与外界对话了。

---

## 1. main 函数的真面目

你一直这样写：

```c
int main() {
    // ...
}
```

但 `main` 的完整签名其实是：

```c
int main(int argc, char *argv[])
```

两个参数名字可以自己取，但约定俗成叫 `argc` 和 `argv`，让我们一起看看它们的含义。

### 直观图解

假设你在终端输入：

```bash
./myprog hello world 2026
```

程序在运行之前，操作系统会帮我们把这行命令拆成一个表格：

```
索引        argv[i] 的内容      类型
──────     ────────────       ────
argv[0] →  "./myprog"         字符串
argv[1] →  "hello"            字符串
argv[2] →  "world"            字符串
argv[3] →  "2026"             字符串  ⚠️ 不是整数！

argc = 4   （一共 4 个元素）
```

关键理解：
- **argv 是一个字符串数组**，所有参数都是字符串，即便你输入数字
- **argv[0] 永远是程序自己的名字**（包括路径）
- **argc = 数组长度**，包括程序名

### 动手试一试

```c
#include <stdio.h>

int main(int argc, char *argv[]) {
    printf("参数总数: %d\n\n", argc);

    for (int i = 0; i < argc; i++) {
        printf("argv[%d] 地址: %p\n", i, (void*)argv[i]);
        printf("argv[%d] 内容: \"%s\"\n", i, argv[i]);
        printf("argv[%d] 第1个字符: '%c'\n\n", i, argv[i][0]);
    }
    return 0;
}
```

编译运行：

```bash
$ gcc -o demo args.c
$ ./demo 你好 世界
参数总数: 3

argv[0] 地址: 0x7ffe1234
argv[0] 内容: "./demo"
argv[0] 第1个字符: '.'

argv[1] 地址: 0x7ffe1250
argv[1] 内容: "你好"
argv[1] 第1个字符: '你'

argv[2] 地址: 0x7ffe1258
argv[2] 内容: "世界"
argv[2] 第1个字符: '世'
```

> **小技巧**：`%p` 打印指针地址。每次运行地址都会不一样，这很正常——操作系统会为程序分配不同的内存区域（这就是 ASLR，地址空间布局随机化）。

---

## 2. 简单的手工解析

### 场景：根据参数执行不同操作

```c
#include <stdio.h>
#include <string.h>

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("用法: %s <命令> [参数...]\n", argv[0]);
        printf("可用命令:\n");
        printf("  greet <名字>  - 打招呼\n");
        printf("  add <a> <b>   - 计算 a+b\n");
        printf("  version       - 显示版本\n");
        return 1;
    }

    if (strcmp(argv[1], "greet") == 0) {
        if (argc < 3) {
            printf("请提供名字! 例如: %s greet 小明\n", argv[0]);
            return 1;
        }
        printf("你好, %s! 欢迎来到 C 语言世界! 🎉\n", argv[2]);

    } else if (strcmp(argv[1], "add") == 0) {
        if (argc < 4) {
            printf("请提供两个数字! 例如: %s add 3 5\n", argv[0]);
            return 1;
        }
        double a = atof(argv[2]);   // 字符串转浮点数
        double b = atof(argv[3]);
        printf("%g + %g = %g\n", a, b, a + b);

    } else if (strcmp(argv[1], "version") == 0) {
        printf("超级程序 v1.0.0\n");
        printf("编译时间: %s %s\n", __DATE__, __TIME__);

    } else {
        printf("未知命令: %s\n", argv[1]);
        printf("试试 '%s' 看帮助\n", argv[0]);
    }

    return 0;
}
```

运行效果：

```bash
$ ./super greet 小明
你好, 小明! 欢迎来到 C 语言世界! 🎉

$ ./super add 3.14 2.86
3.14 + 2.86 = 6

$ ./super version
超级程序 v1.0.0
编译时间: Jun 11 2026 14:30:22

$ ./super
用法: ./super <命令> [参数...]
可用命令:
  greet <名字>  - 打招呼
  add <a> <b>   - 计算 a+b
  version       - 显示版本
```

### 字符串转数字全家桶

| 函数      | 转成    | 例子                          |
|-----------|---------|-------------------------------|
| `atoi()`  | int     | `atoi("42")` → 42             |
| `atol()`  | long    | `atol("999999999")`           |
| `atoll()` | long long | `atoll("999999999999")`     |
| `atof()`  | double  | `atof("3.14")` → 3.14         |

> **重要提醒**：`atoi("hello")` 返回 0，不会报错！如果你需要严格的错误检测，请使用 `strtol()` / `strtod()` 系列函数。

---

## 3. getopt — 专业的选项解析

手动比较 `argv[i]` 虽然能工作，但遇到复杂的命令行界面就力不从心了。Linux 提供了 `getopt` 函数，可以一站式处理 `-a -b -c value` 这种 Unix 标准格式。

### getopt 基本用法

```c
#include <stdio.h>
#include <unistd.h>   // getopt 在这里

int main(int argc, char *argv[]) {
    int opt;  // 存放当前选项字符

    // "ab:c:" — 每个字母一个选项
    //      冒号表示该选项需要参数
    //      两个冒号表示参数可选 (GNU扩展)
    while ((opt = getopt(argc, argv, "ab:c:")) != -1) {
        switch (opt) {
            case 'a':
                printf("选项 -a 被激活 (无需参数)\n");
                break;
            case 'b':
                printf("选项 -b 被设置, 参数 = \"%s\"\n", optarg);
                break;
            case 'c':
                printf("选项 -c 被设置, 参数 = \"%s\"\n", optarg);
                break;
            case '?':   // 遇到未定义的选项
                printf("未知选项或缺少参数\n");
                return 1;
        }
    }

    // optind 指向第一个非选项参数
    printf("\n剩余的非选项参数:\n");
    for (int i = optind; i < argc; i++) {
        printf("  argv[%d] = \"%s\"\n", i, argv[i]);
    }

    return 0;
}
```

运行示例：

```bash
$ ./demo -a -b hello file1.txt file2.txt
选项 -a 被激活 (无需参数)
选项 -b 被设置, 参数 = "hello"

剩余的非选项参数:
  argv[4] = "file1.txt"
  argv[5] = "file2.txt"

$ ./demo -c
未知选项或缺少参数       # -c 需要参数但没给
```

### 关键变量速查

| 全局变量  | 含义                                     |
|-----------|------------------------------------------|
| `optarg`  | 当前选项的参数（如果该选项要参数的话）   |
| `optind`  | 下一个要处理的 `argv` 索引               |
| `opterr`  | 设为 0 可禁止自动错误消息                |
| `optopt`  | 触发错误的选项字符                       |

### 实战：一个文件查看器

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>

void show_help(const char *prog) {
    printf("用法: %s [选项] <文件>\n", prog);
    printf("选项:\n");
    printf("  -h        显示本帮助\n");
    printf("  -n <N>    只显示前 N 行\n");
    printf("  -s <关键字> 只显示含关键字的行\n");
    printf("  -v        显示版本信息\n");
}

int main(int argc, char *argv[]) {
    int opt;
    int max_lines = -1;     // -1 表示不限制
    char *keyword = NULL;

    while ((opt = getopt(argc, argv, "hn:s:v")) != -1) {
        switch (opt) {
            case 'h':
                show_help(argv[0]);
                return 0;
            case 'n':
                max_lines = atoi(optarg);
                if (max_lines <= 0) {
                    fprintf(stderr, "错误: -n 需要正整数\n");
                    return 1;
                }
                break;
            case 's':
                keyword = optarg;
                break;
            case 'v':
                printf("fview v1.0\n");
                return 0;
            case '?':
                show_help(argv[0]);
                return 1;
        }
    }

    // 必须有一个文件参数
    if (optind >= argc) {
        fprintf(stderr, "错误: 请提供文件名\n");
        show_help(argv[0]);
        return 1;
    }

    const char *filename = argv[optind];
    FILE *fp = fopen(filename, "r");
    if (!fp) {
        perror("fopen");
        return 1;
    }

    printf("=== %s ===\n", filename);
    char line[2048];
    int line_no = 0;

    while (fgets(line, sizeof(line), fp)) {
        if (max_lines > 0 && line_no >= max_lines) break;

        if (keyword && !strstr(line, keyword)) continue;

        line_no++;
        printf("%4d | %s", line_no, line);  // fgets已含换行
    }

    fclose(fp);
    printf("=== 共显示 %d 行 ===\n", line_no);
    return 0;
}
```

运行效果：

```bash
$ ./fview -n 5 data.txt
=== data.txt ===
   1 | 第一行数据
   2 | 第二行数据
   ...
   5 | 第五行数据
=== 共显示 5 行 ===

$ ./fview -s "error" log.txt
=== log.txt ===
   3 | error: connection failed
  12 | error: timeout
=== 共显示 2 行 ===
```

---

## 4. 环境变量

命令行参数只在这一次运行时有效。环境变量则不同——它们由"父进程"（通常是你的 shell）设置，可以被**所有子进程**继承。

### 读取环境变量

```c
#include <stdio.h>
#include <stdlib.h>   // getenv, setenv

int main() {
    // 常见环境变量
    char *vars[] = {"HOME", "USER", "PATH", "SHELL", "LANG", NULL};

    for (int i = 0; vars[i] != NULL; i++) {
        char *val = getenv(vars[i]);
        if (val) {
            printf("%-8s = %s\n", vars[i], val);
        } else {
            printf("%-8s = (未设置)\n", vars[i]);
        }
    }
    return 0;
}
```

可能的输出（Windows 上变量名不同，这里以 Linux 为例）：

```
HOME     = /home/xiaoming
USER     = xiaoming
PATH     = /usr/local/bin:/usr/bin:/bin
SHELL    = /bin/bash
LANG     = zh_CN.UTF-8
```

### 设置和修改环境变量

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // 设置一个新的环境变量
    // setenv(变量名, 值, 是否覆盖)
    setenv("MY_APP_NAME", "超级学习器", 1);

    // 再次读取
    printf("MY_APP_NAME = %s\n", getenv("MY_APP_NAME"));

    // 修改已有变量
    setenv("MY_APP_NAME", "终极学习器 Pro Max", 1);
    printf("MY_APP_NAME = %s\n", getenv("MY_APP_NAME"));

    // 取消一个环境变量
    unsetenv("MY_APP_NAME");

    if (getenv("MY_APP_NAME") == NULL) {
        printf("MY_APP_NAME 已被删除\n");
    }

    return 0;
}
```

### 环境变量的第三个参数（overwrite）

```c
// 第3个参数为 0: 变量已存在时不覆盖
setenv("PATH", "/my/bin", 0);

// 第3个参数为 1: 变量已存在时强制覆盖
setenv("PATH", "/my/bin", 1);
```

### 访问完整环境列表

每个进程还有一个全局变量 `environ`，包含所有环境变量：

```c
#include <stdio.h>

// 声明外部变量
extern char **environ;

int main() {
    // 遍历所有环境变量
    for (char **env = environ; *env != NULL; env++) {
        printf("%s\n", *env);
    }
    return 0;
}
```

### 实战：根据环境变量切换行为

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    char *level = getenv("LOG_LEVEL");

    if (level == NULL) {
        printf("[INFO] 日志级别未设置，使用默认级别\n");
        level = "INFO";
    }

    if (strcmp(level, "DEBUG") == 0) {
        printf("[DEBUG] 这是调试信息: x=42, y=99\n");
    }

    if (strcmp(level, "DEBUG") == 0 || strcmp(level, "INFO") == 0) {
        printf("[INFO]  程序开始运行\n");
    }

    printf("[WARN]  这是一条警告\n");
    printf("[ERROR] 这是一条错误\n");

    return 0;
}
```

```bash
$ ./app
[INFO] 日志级别未设置，使用默认级别
[INFO]  程序开始运行
[WARN]  这是一条警告
[ERROR] 这是一条错误

$ LOG_LEVEL=DEBUG ./app
[DEBUG] 这是调试信息: x=42, y=99
[INFO]  程序开始运行
[WARN]  这是一条警告
[ERROR] 这是一条错误
```

---

## 5. 第三个参数：envp（了解即可）

main 还有一个很少用的第三形态：

```c
int main(int argc, char *argv[], char *envp[])
```

`envp` 就等于 `environ`，直接给你一个字符串数组。大多数情况下 `getenv()`/`setenv()` 更方便。

---

## 6. 常见陷阱与最佳实践

### 陷阱 1：argv 不检查就访问

```c
// ❌ 危险：可能段错误
printf("%s\n", argv[1]);

// ✅ 安全：先检查 argc
if (argc < 2) {
    fprintf(stderr, "用法: %s <参数>\n", argv[0]);
    return 1;
}
printf("%s\n", argv[1]);
```

### 陷阱 2：混淆字符串和数字

```c
// ❌ 错误："42" 的内存地址和 42 没有任何关系
int num = (int)argv[1];   // 这得到的是指针地址！

// ✅ 正确
int num = atoi(argv[1]);
```

### 陷阱 3：忘记 argv[0] 也可能为 NULL

```c
// 极罕见情况（直接 exec 且没传程序名），但健壮代码应该：
const char *prog_name = (argc > 0 && argv[0]) ? argv[0] : "unknown";
```

### 最佳实践总结

1. **永远先检查 arg 个数**再访问数组元素
2. **提供一个帮助选项** `-h` 或 `--help`
3. **参数校验**：数字参数要检查范围，文件参数要检查是否存在
4. **错误信息写到 stderr**：`fprintf(stderr, ...)`
5. **返回值有意义**：0 表示成功，非 0 表示各种错误

---

## 本章掌握清单

- [ ] 能写出接收命令行参数的完整程序
- [ ] 理解 argc/argv 的内存布局（为什么 argv[i] 是字符串）
- [ ] 会用 `strcmp` 手工解析子命令
- [ ] 会用 `getopt` 解析 `-a -b value` 格式的选项
- [ ] 能读写环境变量（`getenv` / `setenv` / `unsetenv`）
- [ ] 知道 `optarg`、`optind` 的作用
- [ ] 养成了先检查 argc 再使用 argv 的习惯

---

## 下一站

掌握了命令行参数和环境变量，你已经能让程序与外界自由对话了。这只是"系统编程"的第一课。下一章我们将深入文件系统——不只会"读文件"，还能查看文件的出生日期、权限、遍历整个目录树。这就像从"会开门"进化到"能在整栋楼里自由行动"！
