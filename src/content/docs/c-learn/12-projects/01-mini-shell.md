---
category: "C语言教程"
title: "Mini Shell — 构建简易命令行解释器"
description: "C语言学习教程"
slug: "mini-shell"
level: 12
order: 1
tags: ["shell", "fork", "exec", "项目"]
---

# Mini Shell — 构建简易命令行解释器

这是你 C 语言学习之旅中第一个"完整项目"。我们将从零开始，一步一步构建一个能真正运行命令的 Shell。写完它，你会恍然大悟：原来 `bash` 和 `zsh` 的核心原理就是这些！

先剧透一下：我们最终的程序将在 100 行以内实现一个迷你 Shell。你可以在同学面前炫耀："我写了一个操作系统 Shell。"

---

## 1. 架构全景

在我们敲代码之前，先在大脑中建好蓝图。

### Shell 的生命周期

```
         ┌──────────────┐
         │  显示提示符   │  ← "mysh> "
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │  读取用户输入  │  ← fgets()
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │  解析命令      │  ← strtok() 分割
         └──────┬───────┘
                ↓
         ┌──────────────┐         ┌──────────────────┐
         │  内置命令?     │──是──→  │ 直接执行（cd等）  │
         └──────┬───────┘         └──────────────────┘
                │ 否                      │
                ↓                         │
         ┌──────────────┐                 │
         │  fork() 子进程 │                │
         └──────┬───────┘                 │
                ↓                         │
         ┌──────────────┐                 │
         │  execvp() 执行 │                │
         └──────┬───────┘                 │
                ↓                         │
         ┌──────────────┐                 │
         │  wait() 等待  │                 │
         └──────┬───────┘                 │
                ↓                         │
                └──────────←──────────────┘
                           ↓
                    ┌──────────────┐
                    │  循环回到顶部  │
                    └──────────────┘
```

### 核心系统调用关系

```
main()
  │
  ├─ fgets()      ← 读标准输入
  ├─ strtok()     ← 拆分字符串
  ├─ fork()       ← 复制进程
  │    │
  │    ├─ [父进程] wait()    ← 等子进程结束
  │    │
  │    └─ [子进程] execvp()  ← 替换成目标程序
  │              │
  │              └─ (成功后不会返回)
  │              └─ (失败后 exit(1))
  │
  └─ 循环
```

---

## 2. 分步实现

我们就按照上图的流程，一个模块一个模块地写。

### 步骤 1：最基本的骨架

先搞定"提示符 → 读输入 → 回显"这个循环。

```c
#include <stdio.h>
#include <string.h>

#define MAX_CMD 1024

int main() {
    char cmd[MAX_CMD];

    while (1) {
        // 1. 显示提示符
        printf("mysh> ");
        fflush(stdout);   // ⚠️ 必须刷新！否则提示符不显示

        // 2. 读取一行输入
        if (fgets(cmd, MAX_CMD, stdin) == NULL) {
            // Ctrl+D (EOF)
            printf("\n");
            break;
        }

        // 3. 去掉末尾的换行符
        cmd[strcspn(cmd, "\n")] = '\0';

        // 4. 忽略空行
        if (strlen(cmd) == 0) continue;

        // （目前只是回显）
        printf("你输入了: [%s]\n", cmd);
    }

    return 0;
}
```

编译并测试：

```bash
$ gcc -o mysh step1.c
$ ./mysh
mysh> hello world
你输入了: [hello world]
mysh> ls -la
你输入了: [ls -la]
mysh>
(按 Ctrl+D 退出)
```

> **关键细节**：`fflush(stdout)` 是必须的！`stdout` 默认是行缓冲，没有换行就不会自动输出。不加这行的话，你可能会看到"先输入命令，提示符才出现"的诡异现象。

### 步骤 2：解析命令

用 `strtok` 把一行字符串拆成 "程序名 + 参数1 + 参数2 + ..."。

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define MAX_CMD 1024
#define MAX_ARGS 128

void parse_command(char *cmd, char **args) {
    int i = 0;
    char *token = strtok(cmd, " \t");  // 空格和Tab都是分隔符
    while (token != NULL && i < MAX_ARGS - 1) {
        args[i++] = token;
        token = strtok(NULL, " \t");
    }
    args[i] = NULL;   // execvp 要求 args 以 NULL 结尾
}

int main() {
    char cmd[MAX_CMD];

    while (1) {
        printf("mysh> ");
        fflush(stdout);

        if (fgets(cmd, MAX_CMD, stdin) == NULL) break;
        cmd[strcspn(cmd, "\n")] = '\0';
        if (strlen(cmd) == 0) continue;

        char *args[MAX_ARGS];
        parse_command(cmd, args);

        // 打印解析结果
        printf("程序: %s\n", args[0]);
        for (int i = 1; args[i] != NULL; i++) {
            printf("  参数%d: %s\n", i, args[i]);
        }
    }

    return 0;
}
```

```bash
$ ./mysh
mysh> echo Hello    World
程序: echo
  参数1: Hello
  参数2: World

mysh> ls -la /tmp
程序: ls
  参数1: -la
  参数2: /tmp
```

### 步骤 3：fork + exec — 真正执行命令

这是 Shell 的"灵魂"部分。理解 fork 和 exec 的关系是理解操作系统进程模型的关键。

**fork 的魔法**：一个进程调用 `fork()`，瞬间变成两个一模一样的进程——父进程和子进程。唯一的区别是 `fork()` 的返回值：
- 父进程中 `fork()` 返回子进程的 PID（> 0）
- 子进程中 `fork()` 返回 0
- 出错返回 -1

**exec 的变身**：子进程调用 `execvp()`，**把自己完全替换成另一个程序**。原来的代码被覆盖，新程序从 main() 开始运行。`execvp` 成功后，它后面的代码永远、永远、永远不会执行。

```
调用 fork() 之前：
    [父进程: mysh]

调用 fork() 之后：
    [父进程: mysh]  ←── fork() 返回子进程 PID
    [子进程: mysh]  ←── fork() 返回 0

子进程调 execvp("ls", args) 之后：
    [父进程: mysh]  ←── wait() 等待
    [子进程: ls]    ←── 完全变成了 ls 程序！
```

代码实现：

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

#define MAX_CMD 1024
#define MAX_ARGS 128

void parse_command(char *cmd, char **args) {
    int i = 0;
    char *token = strtok(cmd, " \t");
    while (token != NULL && i < MAX_ARGS - 1) {
        args[i++] = token;
        token = strtok(NULL, " \t");
    }
    args[i] = NULL;
}

int main() {
    char cmd[MAX_CMD];

    while (1) {
        printf("mysh> ");
        fflush(stdout);

        if (fgets(cmd, MAX_CMD, stdin) == NULL) break;
        cmd[strcspn(cmd, "\n")] = '\0';
        if (strlen(cmd) == 0) continue;

        char *args[MAX_ARGS];
        parse_command(cmd, args);

        // ======== 核心：fork + exec ========
        pid_t pid = fork();

        if (pid < 0) {
            perror("fork 失败");
            continue;
        }

        if (pid == 0) {
            // 我是子进程
            execvp(args[0], args);

            // 如果执行到这里，说明 execvp 失败了
            fprintf(stderr, "mysh: 命令未找到: %s\n", args[0]);
            exit(1);
        } else {
            // 我是父进程
            int status;
            waitpid(pid, &status, 0);
        }
    }

    return 0;
}
```

```bash
$ ./mysh
mysh> ls
Makefile  mysh  mysh.c  README.md
mysh> echo 你好世界
你好世界
mysh> pwd
/home/user/c-projects
mysh> date
2026年 06月 11日 星期四 15:30:42 CST
mysh>
```

太棒了！它能运行真正的命令了！但它还有一个致命问题，我们马上解决。

### 步骤 4：添加 `cd` 和 `exit` 内置命令

你可能会发现：在当前版本中执行 `cd /tmp` 不会报错，但也无法真正切换目录。为什么？因为 `cd` 被执行在子进程中——子进程切换了目录然后退出，父进程（你的 Shell）的目录纹丝不动。

**内置命令**就是在 Shell 自己的进程里执行，不 fork 子进程的命令。

```c
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

#define MAX_CMD 1024
#define MAX_ARGS 128

// ... parse_command 同上 ...

int execute_builtin(char **args) {
    if (strcmp(args[0], "exit") == 0) {
        printf("再见！👋\n");
        exit(0);
    }

    if (strcmp(args[0], "cd") == 0) {
        const char *dir = args[1] ? args[1] : getenv("HOME");
        if (dir == NULL) {
            fprintf(stderr, "cd: HOME 未设置\n");
        } else if (chdir(dir) != 0) {
            perror("cd");
        }
        return 1;   // 已处理
    }

    return 0;   // 不是内置命令
}

int main() {
    char cmd[MAX_CMD];

    while (1) {
        // 显示当前目录在提示符中
        char cwd[1024];
        if (getcwd(cwd, sizeof(cwd)) != NULL) {
            printf("mysh:%s$ ", cwd);
        } else {
            printf("mysh> ");
        }
        fflush(stdout);

        if (fgets(cmd, MAX_CMD, stdin) == NULL) break;
        cmd[strcspn(cmd, "\n")] = '\0';
        if (strlen(cmd) == 0) continue;

        char *args[MAX_ARGS];
        parse_command(cmd, args);

        // 先检查内置命令
        if (execute_builtin(args)) continue;

        // 外部命令：fork + exec
        pid_t pid = fork();
        if (pid < 0) {
            perror("fork 失败");
        } else if (pid == 0) {
            execvp(args[0], args);
            fprintf(stderr, "mysh: 命令未找到: %s\n", args[0]);
            exit(1);
        } else {
            waitpid(pid, NULL, 0);
        }
    }

    return 0;
}
```

```bash
mysh:/home/user$ cd /tmp
mysh:/tmp$ ls
temp_file.txt  socket.123
mysh:/tmp$ cd
mysh:/home/user$ exit
再见！👋
```

---

## 3. 进阶功能

基础版已经完成了。下面是一些让你 Shell 变强大的扩展。每个都是一个独立的挑战。

### 扩展 A：支持管道 `|`

核心思路：用 `pipe()` 创建管道，把前一个命令的输出连接到后一个命令的输入。

```
cmd1 | cmd2 的实现步骤：
1. pipe(fd)       ← 创建管道（fd[0]读端，fd[1]写端）
2. fork() 子进程1
   ├─ dup2(fd[1], STDOUT_FILENO)  ← 把标准输出重定向到管道写端
   ├─ close(fd[0]), close(fd[1])
   └─ execvp(cmd1)
3. fork() 子进程2
   ├─ dup2(fd[0], STDIN_FILENO)   ← 把标准输入重定向到管道读端
   ├─ close(fd[0]), close(fd[1])
   └─ execvp(cmd2)
4. close(fd[0]), close(fd[1])  ← 父进程关闭管道两端
5. wait() 两个子进程
```

关键代码片段：

```c
int pipefd[2];
pipe(pipefd);

// 左边命令
pid_t pid1 = fork();
if (pid1 == 0) {
    dup2(pipefd[1], STDOUT_FILENO);
    close(pipefd[0]); close(pipefd[1]);
    execvp(cmd1[0], cmd1);
    exit(1);
}

// 右边命令
pid_t pid2 = fork();
if (pid2 == 0) {
    dup2(pipefd[0], STDIN_FILENO);
    close(pipefd[0]); close(pipefd[1]);
    execvp(cmd2[0], cmd2);
    exit(1);
}

close(pipefd[0]); close(pipefd[1]);
waitpid(pid1, NULL, 0);
waitpid(pid2, NULL, 0);
```

### 扩展 B：支持重定向 `>` 和 `<`

```c
// 输出重定向: cmd > file.txt
int fd = open(filename, O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO);
close(fd);
execvp(cmd[0], cmd);

// 输入重定向: cmd < file.txt
int fd = open(filename, O_RDONLY);
dup2(fd, STDIN_FILENO);
close(fd);
execvp(cmd[0], cmd);
```

### 扩展 C：支持后台运行 `&`

```c
int background = 0;
if (args[i-1] && strcmp(args[i-1], "&") == 0) {
    background = 1;
    args[i-1] = NULL;   // 去掉 &
}

// 在父进程中：
if (!background) {
    waitpid(pid, &status, 0);   // 前台：等待
} else {
    printf("[%d] 后台运行\n", pid);  // 后台：不等待
}
```

### 扩展 D：信号处理（Ctrl+C）

```c
#include <signal.h>

// 全局信号处理函数
void sigint_handler(int sig) {
    printf("\n");           // 换行
    // 不退出！让 Shell 继续运行
}

int main() {
    signal(SIGINT, sigint_handler);   // 注册 Ctrl+C 处理器
    // ... 其余代码 ...
}
```

---

## 4. 测试策略

### 单元测试（针对解析器）

```c
void test_parse() {
    char input[] = "echo hello world";
    char *args[10];
    parse_command(input, args);

    assert(strcmp(args[0], "echo") == 0);
    assert(strcmp(args[1], "hello") == 0);
    assert(strcmp(args[2], "world") == 0);
    assert(args[3] == NULL);
    printf("✓ parse_command 测试通过\n");
}
```

### 集成测试（自动化）

```bash
# test.sh — 自动化测试脚本
echo "=== 测试 1: 内置命令 cd ==="
./mysh << EOF
cd /tmp
pwd
EOF

echo "=== 测试 2: 外部命令 ==="
./mysh << EOF
echo "hello shell"
ls -1 | wc -l
EOF

echo "=== 测试 3: 错误处理 ==="
./mysh << EOF
this_command_does_not_exist
EOF
```

### 手动测试清单

| 测试项                 | 预期结果                               |
|------------------------|----------------------------------------|
| 空行回车               | 什么都不做，显示新提示符               |
| `ls`                   | 列出文件                               |
| `cd /tmp` 然后 `pwd`   | 显示 `/tmp`                            |
| `cd` (无参数)           | 回到 HOME 目录                         |
| `exit`                 | Shell 退出                             |
| 连续多个空格           | 正确解析（`"ls   -la"`）               |
| 不存在的命令           | 显示错误信息，Shell 不崩溃             |
| Tab 键分隔             | 能正确解析                             |
| 超长输入               | 不缓冲区溢出                           |

---

## 5. 代码走读：完整版回顾

让我们把这个项目放在一起，看看最终的结构：

```
mysh.c 文件结构：
─────────────────────────────────────────
  行 1-10:    #include 和宏定义
  行 12-20:   parse_command() — 命令解析
  行 22-40:   execute_builtin() — 内置命令（cd, exit）
  行 42-80:   main()
                42-55: 提示符循环 + 输入读取
                56-60: 调用 parse_command
                61-63: 检查内置命令
                64-78: fork + exec + wait
─────────────────────────────────────────
```

**你写了什么**：不到 100 行代码。
**你用了哪些知识**：字符串处理、结构体、指针数组、进程管理、系统调用、错误处理、命令行参数。
**你实现了什么**：一个活的、能真正运行命令的 Shell。

如果把 `bash` 比作一辆汽车，你现在造出了一个能跑的小推车——引擎、轮子、方向盘都有，理解了全部基本原理。

---

## 6. 常见 Bug 和调试技巧

### Bug 1：提示符不显示

**症状**：要先输入一行命令，提示符才出现。

**原因**：`printf("mysh> ")` 后没有 `fflush(stdout)`。

**修复**：在 `printf` 后立即加 `fflush(stdout)`。

### Bug 2：cd 不生效

**症状**：执行 `cd /tmp` 后，`pwd` 还是在原目录。

**原因**：你在子进程里 `chdir` 了。

**修复**：`cd` 必须是内置命令。

### Bug 3：僵尸进程

**症状**：用 `ps` 看到很多 `<defunct>` 进程。

**原因**：父进程没有 `wait()`。

**修复**：确保每个子进程都有对应的 `waitpid`。

### 调试技巧

```bash
# 编译时加调试信息
gcc -g -Wall -o mysh mysh.c

# 用 gdb 调试
gdb ./mysh

# 在代码中加调试输出
#ifdef DEBUG
    fprintf(stderr, "DEBUG: fork returned %d\n", pid);
#endif
```

编译调试版：

```bash
gcc -DDEBUG -o mysh-debug mysh.c
```

---

## 7. 学到的概念迁移

这个项目教会你的，远远不止写一个 Shell：

| 概念               | 你用它做了什么         | 实际应用                 |
|--------------------|------------------------|--------------------------|
| fork + exec        | 运行外部命令           | 所有守护进程、Web 服务器 |
| 内置命令           | cd, exit               | CLI 工具设计模式         |
| 管道 pipe          | `ls \| grep c`         | 微服务数据流             |
| 重定向 dup2        | `cmd > file`           | 日志系统、数据导入       |
| 信号处理 signal    | Ctrl+C 不退出          | 优雅关闭服务器           |
| waitpid            | 等子进程结束           | 任务调度器               |

你学的不是"怎么用 C 写玩具"，而是**操作系统如何管理进程**这一底层知识。

---

## 本章掌握清单

- [ ] 能画出 Shell 的 read-parse-fork-exec-wait 流程图
- [ ] 能手写 fork + execvp 的代码框架
- [ ] 理解为什么 fork 之前和之后代码都会被两个进程执行
- [ ] 知道哪些命令必须是内置命令（cd, exit, export 等）
- [ ] 能实现基本的输入/输出重定向
- [ ] 理解 pipe + dup2 实现管道的基本原理
- [ ] 能在代码中加入调试日志快速定位问题
- [ ] 成功把自己的 Shell 跑起来！

## 下一站

搞定了 Shell，你相当于理解了整个操作系统的"外壳"。下一章我们要实现 `grep` 和 `wc` ——这些你每天用的文本处理工具。你不再是一个"用户"，而是一个"造工具的人"。准备好了吗？
