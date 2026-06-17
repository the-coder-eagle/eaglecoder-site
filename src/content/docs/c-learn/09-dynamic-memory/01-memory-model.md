---
category: "C语言教程"
title: "C 内存模型全景"
description: "C语言学习教程"
slug: "memory-model"
level: 9
order: 1
tags: ["内存模型", "text", "data", "bss", "heap", "stack"]
---

# C 内存模型全景

理解 C 程序在内存中的布局，是从"会写 C"到"精通 C"的分水岭。本文将带你逐段解剖 C 程序的内存世界。

## 为什么必须理解内存模型？

当你写 `int x = 10;` 时，`x` 被放在哪里？当你 `malloc(100)` 时，这 100 字节从哪来？当你忘记 `free` 时，为什么程序会吃掉所有内存？——所有这些问题，答案都藏在内存模型中。

```
┌──────────────────────────────────────────────────────────┐
│                      一个 C 程序的内存全景                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│    高地址 (0x7FFFFFFF...)                                 │
│    ┌──────────────────────────────┐                      │
│    │         命令行参数与环境变量    │ ← argc, argv, envp  │
│    ├──────────────────────────────┤                      │
│    │     ★ Stack（栈）              │ ← 局部变量、函数帧   │
│    │     自动管理，LIFO            │   地址从高向低增长    │
│    │         ↓ 向下生长 ↓          │                      │
│    ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤                      │
│    │     ▲ 空闲区域 ▲              │ ← 灵活伸缩           │
│    │     (stack 和 heap 相对生长)   │                      │
│    ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤                      │
│    │         ↑ 向上生长 ↑          │                      │
│    │     ★ Heap（堆）              │ ← malloc/calloc/realloc│
│    │     手动管理，需要 free        │   地址从低向高增长    │
│    ├──────────────────────────────┤                      │
│    │     ★ BSS 段                  │ ← 未初始化全局/静态   │
│    │     (Block Started by Symbol) │   程序启动时自动清零  │
│    ├──────────────────────────────┤                      │
│    │     ★ Data 段                 │ ← 已初始化全局/静态   │
│    │     .data (读写) /.rodata (只读)│                      │
│    ├──────────────────────────────┤                      │
│    │     ★ Text 段（代码段）        │ ← 机器指令 + 字符串  │
│    │     只读，不可修改            │   常量可能在这里      │
│    └──────────────────────────────┘                      │
│    低地址 (0x00400000...)                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## 第一段：Text 段（代码段 / .text）

Text 段存放编译后的机器指令。它被操作系统标记为**只读+可执行**，这是安全的基础——你的代码不能在运行时修改自身。

```c
#include <stdio.h>

// 这个函数的所有机器指令都在 Text 段
int add(int a, int b) {
    return a + b;
}

// 字符串字面量 "Hello\n" 通常也放在 Text 段（或 .rodata）
// 注意：它是只读的！
int main() {
    printf("Hello\n");          // 字符串 "Hello\n" 在 Text/.rodata
    // char *s = "Hello";
    // s[0] = 'h';              // 未定义行为！试图修改只读内存
    printf("add 的地址: %p\n", (void*)add);  // 打印函数地址 → Text 段
    return 0;
}
```

**Text 段的特点：**
- 大小在编译时确定，运行期不变
- 多个进程运行同一程序时，Text 段可以共享（节省物理内存）
- 尝试写入 Text 段会触发段错误（Segmentation Fault）

## 第二段：Data 段（数据段 / .data）

Data 段存放**已显式初始化**的全局变量和静态变量。分为两个子区域：

| 子段 | 全称 | 存放内容 | 权限 |
|------|------|---------|------|
| `.data` | 已初始化数据段 | 初始值非零的全局/静态变量 | 读写 |
| `.rodata` | 只读数据段 | `const` 全局变量、字符串字面量 | 只读 |

```c
#include <stdio.h>

// ===== 以下变量位于 .data 段 =====
int global_score = 100;          // 初始化为非零值 → .data
static int level = 5;            // 静态变量，非零初始值 → .data
double pi = 3.14159;             // 初始化为非零 → .data

// ===== 以下变量位于 .rodata 段 =====
const int MAX_PLAYERS = 4;       // const 全局 → .rodata
// "Welcome" 这个字符串字面量也在 .rodata

// ===== 以下变量位于 BSS 段 =====
int global_uninit;               // 未初始化 → BSS
static int counter;              // 未初始化 → BSS
// BSS 变量在可执行文件中不占空间，运行时由 OS 清零

int main() {
    static int call_count = 0;   // 静态局部，初始化为0 → .data 或 BSS
    call_count++;
    printf("此函数被调用了 %d 次\n", call_count);
    return 0;
}
```

**一个容易混淆的点：**

```c
// 情况1：显式初始化为 0
int a = 0;    // 某些编译器放入 BSS（优化），某些放入 .data
static int b = 0;  // 同上

// 情况2：未初始化
int c;        // 一定在 BSS
static int d; // 一定在 BSS

// 情况3：数组初始化
char msg1[] = "hello";  // .data —— 可修改的局部副本
char *msg2 = "hello";   // msg2 在 .data，但 "hello" 在 .rodata！（注意区别）
```

## 第三段：BSS 段

BSS 代表 "Block Started by Symbol"，存放**未初始化**（或初始化为 0）的全局/静态变量。

```
┌─────────────────────────────────┐
│  BSS 段的魔法：                   │
│                                 │
│  可执行文件中：                    │
│  ┌─────────────────┐            │
│  │ 只记录"需要 N 字节" │ ← 不保存实际数据  │
│  │ 实际数据全是 0      │            │
│  └─────────────────┘            │
│                                 │
│  程序加载时：                     │
│  ┌─────────────────┐            │
│  │ OS 分配 N 字节     │            │
│  │ 全部清零（填 0）    │            │
│  └─────────────────┘            │
│                                 │
│  好处：                           │
│  int big_array[1000000] = {0};  │
│  在可执行文件中几乎不占空间！       │
│  如果写成 = {1,2,3,...} 就会膨胀  │
│  可执行文件大小。                  │
└─────────────────────────────────┘
```

```c
// 验证 BSS 的零初始化特性
#include <stdio.h>

int global_array[1000];    // BSS —— 启动时全为 0
static double values[500]; // BSS —— 启动时全为 0.0

int main() {
    // 未初始化的全局数组，每个元素保证为 0
    printf("global_array[0] = %d\n", global_array[0]);    // 0
    printf("global_array[999] = %d\n", global_array[999]); // 0
    printf("values[0] = %f\n", values[0]);                 // 0.000000

    // 局部变量不会自动初始化！
    int local_uninit;
    // printf("%d\n", local_uninit);  // 未定义行为！值是垃圾数据
    return 0;
}
```

## 第四段：Heap（堆）—— 动态内存的核心

堆是 C 语言最灵活也最危险的内存区域。你通过 `malloc`、`calloc`、`realloc` 申请，通过 `free` 归还。

```
┌────────────────────────────────────────────────────────────┐
│                      堆的内部管理示意                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  brk 指针（堆顶）                                            │
│  ↓                                                         │
│  ┌─────────────────────────────────────────────┐           │
│  │  已分配块3  │  空闲块2  │  已分配块2  │  空闲块1  │ ... │   │
│  └─────────────────────────────────────────────┘           │
│        ↑                                                    │
│  程序刚开始时的 brk                                          │
│                                                            │
│  每个内存块都有"头部"（元数据）：                               │
│  ┌──────────┬──────────────────────────────┐               │
│  │ 元数据    │  用户可用数据                  │               │
│  │ (大小+标志)│  (malloc 返回的指针指向这里)    │               │
│  └──────────┴──────────────────────────────┘               │
│  写入超出用户数据区 → 破坏下一个块的元数据 → 程序崩溃         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### malloc —— 分配未初始化内存

```c
#include <stdlib.h>

// 原型：void* malloc(size_t size);
// 参数：要分配的字节数
// 返回：指向分配内存的指针，失败返回 NULL

int *p = (int*)malloc(sizeof(int));       // 分配 1 个 int（4 或 8 字节）
int *arr = (int*)malloc(10 * sizeof(int)); // 分配 10 个 int 的数组
char *str = (char*)malloc(256);            // 分配 256 字节的字符缓冲区

// ★ 关键：malloc 不清零！内存中是垃圾数据
// ★ 关键：一定要检查返回值！
if (p == NULL) {
    printf("内存分配失败！\n");
    exit(1);
}
```

### calloc —— 分配并清零内存

```c
#include <stdlib.h>

// 原型：void* calloc(size_t nmemb, size_t size);
// 参数1：元素个数
// 参数2：每个元素的大小
// 返回：指向清零内存的指针

// malloc 方式（不推荐）：
int *arr1 = (int*)malloc(10 * sizeof(int));
memset(arr1, 0, 10 * sizeof(int));  // 需要手动清零

// calloc 方式（一步到位）：
int *arr2 = (int*)calloc(10, sizeof(int));  // 分配 + 清零

// 二者等价，但 calloc 更安全、更清晰
// ★ calloc 也会返回 NULL，必须检查！
if (arr2 == NULL) {
    printf("calloc 失败！\n");
    exit(1);
}
```

**calloc 的乘法溢出保护：**
大多数现代 calloc 实现会检查 `nmemb * size` 是否会溢出：

```c
// 危险：如果 nmemb 和 size 都很大，乘积可能溢出
// 好的 calloc 实现会检测溢出并返回 NULL
size_t n = 999999999999;
int *danger = (int*)calloc(n, sizeof(int));  // 好的实现返回 NULL
```

### realloc —— 调整已分配内存的大小

```c
#include <stdlib.h>

// 原型：void* realloc(void* ptr, size_t new_size);
// 参数1：指向原有内存的指针（可以是 NULL）
// 参数2：新的大小

int *arr = (int*)malloc(5 * sizeof(int));  // 先分配 5 个 int
// ... 使用 arr ...

// 发现不够用，扩大到 10 个 int
int *tmp = (int*)realloc(arr, 10 * sizeof(int));
if (tmp == NULL) {
    // realloc 失败！但原内存 arr 仍然有效
    printf("realloc 失败，使用原有内存\n");
} else {
    arr = tmp;  // 安全赋值
}

// realloc(NULL, size) 等价于 malloc(size)
// realloc(ptr, 0) 等价于 free(ptr)，但行为依赖实现，不推荐
```

**realloc 的内部行为：**

```
情况1：原地扩展（后面有足够空闲空间）
┌──────┬──────────┬──────────┐
│ arr  │ 空闲     │ ...      │
│ 5元素│ 空间     │          │
└──────┴──────────┴──────────┘
       ↓ realloc(arr, 10*sizeof(int))
┌──────────────┬──────────┐
│ arr          │ ...      │   ← 指针不变！
│ 10元素       │          │
└──────────────┴──────────┘

情况2：搬迁（后面空间不足）
┌──────┬──────────┬──────────┐
│ arr  │ 别的数据  │ ...      │  ← 后面被占了
│ 5元素│          │          │
└──────┴──────────┴──────────┘
       ↓ realloc(arr, 10*sizeof(int))
err     ┌──────────────┬────────────┐
 arr    │ 空闲（被free）│ 新位置      │  ← 指针变了！
        │              │ 10元素     │      旧数据被复制到新位置
        └──────────────┴────────────┘
```

### free —— 归还内存

```c
#include <stdlib.h>

int *p = (int*)malloc(sizeof(int) * 100);
// ... 使用 p ...

free(p);    // 归还内存
p = NULL;   // ★ 良好的习惯：释放后立即置空

// free 注意事项：
// 1. free(NULL) 是安全的，什么都不做
// 2. 不要 free 同一个指针两次（双重释放）
// 3. 不要 free 栈上的变量
// 4. 不要 free 非 malloc/calloc/realloc 返回的指针
```

**free 后内存的变化示意：**

```
free 前：
┌──────────────────────────────────────┐
│ p → [42][99][7][...] (属于程序的堆内存)│
└──────────────────────────────────────┘

free(p) 后：
┌──────────────────────────────────────┐
│ p → [??][??][??][...] (已归还OS/分配器)│
│     ↑                                │
│   内容可能未变，但你不能再访问了！       │
│   这是悬空指针的根本原因                │
└──────────────────────────────────────┘

free(p); p = NULL; 后：
p → NULL  (安全，任何对 *p 的访问会立即崩溃，而不是悄悄出错)
```

## 第五段：Stack（栈）

栈是自动管理的内存，每个函数调用都会在栈上创建"栈帧"（Stack Frame）。

```
┌──────────────────────────────────────────────────────────┐
│              函数调用时的栈帧变化                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  程序启动时：                                              │
│  ┌────────────┐                                          │
│  │ main 的栈帧 │ ← 局部变量、返回地址                       │
│  └────────────┘                                          │
│      ↓ 高地址 → 低地址                                     │
│                                                          │
│  main 调用 funcA()：                                      │
│  ┌────────────┐                                          │
│  │ main 的栈帧 │                                          │
│  ├────────────┤ ← 调用时压入                               │
│  │ funcA 栈帧  │   参数、返回地址、局部变量                  │
│  └────────────┘                                          │
│                                                          │
│  funcA 调用 funcB()：                                     │
│  ┌────────────┐                                          │
│  │ main 的栈帧 │                                          │
│  ├────────────┤                                          │
│  │ funcA 栈帧  │                                          │
│  ├────────────┤                                          │
│  │ funcB 栈帧  │ ← 新的栈顶                                │
│  └────────────┘                                          │
│      ↓                                                   │
│  funcB 返回 → funcB 栈帧弹出消失                           │
│  funcA 返回 → funcA 栈帧弹出消失                           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

```c
#include <stdio.h>

void funcB(int z) {              // z 进入栈（参数）
    int w = z * 2;               // w 进入栈（局部变量）
    char buf[128];               // buf 进入栈（局部数组）
    printf("funcB: z=%d, w=%d\n", z, w);
}                                // 函数返回 → z, w, buf 全部自动释放

void funcA(int x) {              // x 进入栈
    int y = x + 1;               // y 进入栈
    printf("funcA: x=%d, y=%d\n", x, y);
    funcB(y);                    // funcB 的栈帧在 funcA 之上
}                                // funcB 的栈帧已消失

int main() {
    int a = 10;                  // a 进入栈
    funcA(a);
    return 0;
}                                // 程序结束 → 所有栈帧销毁
```

**栈 vs 堆 对比：**

```
┌──────────────────┬──────────────────────┬──────────────────────┐
│      特性        │       栈 (Stack)     │      堆 (Heap)       │
├──────────────────┼──────────────────────┼──────────────────────┤
│ 管理方式         │ 自动（编译器管理）    │ 手动（程序员管理）    │
│ 分配/释放速度    │ 极快（移动栈指针）    │ 较慢（查找空闲块）    │
│ 大小限制         │ 较小（通常 1-8 MB）   │ 较大（受虚拟内存限制）│
│ 生命周期         │ 函数内                │ 由程序员控制         │
│ 碎片问题         │ 无                    │ 可能有               │
│ 溢出后果         │ Stack Overflow → 崩溃 │ 内存泄漏 → 渐进崩溃   │
│ 典型用途         │ 局部变量、小数组      │ 大数组、动态结构     │
└──────────────────┴──────────────────────┴──────────────────────┘
```

## 完整的变量存放位置总结

```c
#include <stdlib.h>

int global_init = 42;           // → Data 段 (.data)
int global_uninit;              // → BSS 段
static int file_static = 10;    // → Data 段 (.data)
const int READONLY = 100;       // → .rodata
char *str_literal = "hello";    // str_literal → Data 段
                                // "hello" → .rodata

int main() {
    int local = 5;              // → Stack
    static int local_static;    // → BSS 段
    static int ls_init = 20;    // → Data 段 (.data)

    int *p = malloc(100);       // p → Stack
                                // *p → Heap

    char arr[] = "world";       // arr → Stack
                                // "world" → .rodata（被复制到栈）

    free(p);
    return 0;
}
```

## 用地址推断变量位置

不同段的地址有明显特征：

```c
#include <stdio.h>
#include <stdlib.h>

int global_data = 100;      // Data/BSS 段
int global_bss;              // BSS 段
static int static_data = 200; // Data 段

int main() {
    int stack_var = 0;                       // Stack
    int *heap_var = malloc(sizeof(int));     // Heap
    static int local_static = 300;           // Data 段
    const char *ro_str = "constant";         // .rodata

    printf("=== 内存地址分布 ===\n");
    printf("Text 段 (main):   %p\n", (void*)main);
    printf(".rodata (字符串): %p\n", (void*)ro_str);
    printf("Data 段 (global):  %p\n", (void*)&global_data);
    printf("Data 段 (static):  %p\n", (void*)&static_data);
    printf("Data 段 (ls):      %p\n", (void*)&local_static);
    printf("BSS 段 (g_uninit): %p\n", (void*)&global_bss);
    printf("Heap (malloc):    %p\n", (void*)heap_var);
    printf("Stack (local):    %p\n", (void*)&stack_var);

    // 典型的输出（地址从小到大）：
    // Text 段 → .rodata → Data 段 → BSS 段 → Heap → ... → Stack
    //    低地址                                        → 高地址

    free(heap_var);
    return 0;
}
```

## 内存泄漏的直观理解

想象你去图书馆借书。每次 `malloc` 就是借一本书，每次 `free` 就是还书。

```c
// 正常流程：借 → 用 → 还
void good_citizen() {
    int *book = malloc(1000);  // 借一本书
    // ... 使用这本书 ...
    free(book);                 // 按时归还
    book = NULL;
}

// 内存泄漏：借了不还
void bad_citizen() {
    int *book = malloc(1000);  // 借一本书
    // ... 使用这本书 ...
    // 忘记还了！
}  // 函数结束 → 借书证（指针）销毁了 → 书（内存）永远丢失

// 循环中泄漏 → 灾难
void disaster() {
    for (int i = 0; i < 1000000; i++) {
        int *leak = malloc(1024);  // 每次循环借 1KB
        // 从不归还
    }
    // 结果：泄漏了约 1GB 内存！
    // 程序越来越慢 → 系统内存耗尽 → 程序崩溃或被 OS 杀掉
}
```

## valgrind 式自查思维

即使没有 valgrind，你也应该养成"valgrind 式思维"——写每一行 malloc 时就问自己：

```
┌─────────────────────────────────────────────────────────┐
│              Valgrind 式自查清单                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✏ 每写一个 malloc → 立即写下对应的 free                  │
│                                                         │
│  📋 对每个 malloc 的返回值，问三个问题：                    │
│     1. 这个指针有没有保存下来？（别丢了"借书证"）          │
│     2. 这个指针最后会不会被 free？（别忘记"还书"）         │
│     3. free 之后还会不会用这个指针？（悬空指针）           │
│                                                         │
│  🔍 检查要点：                                           │
│     □ 所有代码路径都 free 了吗？（包括错误返回路径）       │
│     □ realloc 有没有用临时变量接收？                      │
│     □ free 后指针有没有置 NULL？                          │
│     □ 有没有函数返回了局部变量的地址？                     │
│     □ 有没有越界写入数组？                                │
│                                                         │
│  记忆口诀：                                              │
│     "有借有还，再借不难"  —— malloc/free 配对             │
│     "人走茶凉，东西还在"  —— 指针销毁 ≠ 内存释放          │
│     "墙上钉钉，不能乱拔"  —— 别 free 栈变量/非堆指针     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 实践：实现一个安全的动态数组

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    int *data;      // 堆上的数组
    int size;       // 当前元素个数
    int capacity;   // 已分配容量
} DynArray;

// 创建动态数组
DynArray* da_create(int initial_capacity) {
    DynArray *da = malloc(sizeof(DynArray));
    if (da == NULL) return NULL;

    da->data = calloc(initial_capacity, sizeof(int));
    if (da->data == NULL) {
        free(da);  // ★ 注意：da 已经分配了，这里要释放
        return NULL;
    }

    da->size = 0;
    da->capacity = initial_capacity;
    return da;
}

// 扩容
int da_resize(DynArray *da, int new_capacity) {
    int *tmp = realloc(da->data, new_capacity * sizeof(int));
    if (tmp == NULL) return 0;  // 失败，原数据不变

    da->data = tmp;
    // 新空间初始化为0
    memset(da->data + da->capacity, 0,
           (new_capacity - da->capacity) * sizeof(int));
    da->capacity = new_capacity;
    return 1;
}

// 添加元素
int da_push(DynArray *da, int value) {
    if (da->size >= da->capacity) {
        if (!da_resize(da, da->capacity * 2)) {
            return 0;  // 扩容失败
        }
    }
    da->data[da->size++] = value;
    return 1;
}

// 销毁动态数组（完整的清理）
void da_destroy(DynArray *da) {
    if (da == NULL) return;       // 允许 free(NULL)
    free(da->data);                // 先释放内部数组
    da->data = NULL;
    free(da);                      // 再释放结构体本身
    // 调用者应该把指针置 NULL
}

int main() {
    DynArray *nums = da_create(4);
    if (nums == NULL) {
        printf("创建失败\n");
        return 1;
    }

    da_push(nums, 10);
    da_push(nums, 20);
    da_push(nums, 30);
    da_push(nums, 40);
    da_push(nums, 50);  // 触发扩容：4 → 8

    for (int i = 0; i < nums->size; i++) {
        printf("%d ", nums->data[i]);
    }
    printf("\n容量: %d\n", nums->capacity);

    da_destroy(nums);
    nums = NULL;  // 好习惯
    return 0;
}
```

## 要点总结

| 概念 | 核心思想 |
|------|---------|
| Text 段 | 代码只读，不可修改，编译时确定大小 |
| Data 段 | 已初始化全局/静态变量，可执行文件中占空间 |
| BSS 段 | 未初始化全局/静态变量，启动时自动清零，不占文件空间 |
| Heap（堆） | malloc/calloc/realloc 申请，free 释放，手动管理，灵活但危险 |
| Stack（栈） | 局部变量+函数调用，自动管理，速度快但空间小 |
| 内存泄漏 | 分配了不释放 = 丢了"借书证"，堆内存永远丢失 |
| 悬空指针 | free 后用指针 = 访问已归还的内存 = 未定义行为 |

**记住这句话：**
> "理解你的变量住在哪里、何时出生、何时死亡——你就真正理解了 C 语言。"
