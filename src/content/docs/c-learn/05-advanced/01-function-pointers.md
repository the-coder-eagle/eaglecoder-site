---
category: "C语言教程"
title: "函数指针 — 把函数当参数传递"
description: "C语言学习教程"
slug: "function-pointers"
level: 5
order: 3
tags: ["函数指针", "回调", "qsort", "高阶函数"]
---

# 函数指针 — 把函数当参数传递

函数指针会让你从"能用 C 写程序"升级到"能设计灵活的系统"。别怕——如果你理解了基础指针的核心思想，函数指针只是把"指向数据"换成了"指向函数"。

## 为什么要有函数指针？

你要写一个排序函数，用户有时升序、有时降序、有时按绝对值排——难道为每种逻辑写一个排序函数？那会爆炸。

更好的思路：**把"比较规则"传给排序函数。** 函数也在内存中有地址，所以——函数也有地址，也能用指针指向！

```
数据 → 有地址 → 数据指针指向数据
函数 → 也有地址 → 函数指针指向函数
          完全一样的道理！
```

## 核心比喻：菜谱与书签

```
函数       = 一本菜谱（指令序列，放在内存）
函数地址   = 菜谱在书架上的位置编号
函数指针   = 一个书签，写着菜谱的位置编号
调用函数   = 按书签找到菜谱，照着做
```

- `func()` = 直接去书架上取
- `fp = func` = 把书签夹到这本菜谱
- `fp = func2` = 书签换夹另一本——同一段代码做不同的事！

**这就是"运行时决定行为"：** 跑到那一行时才知道今天执行什么。

## 基本语法

语法看起来吓人，但规则简单：把函数声明中的函数名换成 `(*指针名)`：

```c
int add(int a, int b);       // 普通函数声明

int (*fp)(int a, int b);     // 函数指针声明
// int              → 返回类型
//     (*fp)        → fp 是指针（括号是必须的！）
//           (int,int) → 参数列表

// 没有括号是什么？
int *fp(int a, int b);       // 这是返回 int* 的普通函数！不是指针！
```

**括号决定一切：** `(*fp)` 是指针，没有括号就是函数。

## 示例一：基本函数指针——从声明到调用

```c
#include <stdio.h>

int add(int a, int b)      { return a + b; }
int subtract(int a, int b) { return a - b; }

int main() {
    int (*operation)(int, int);  // 声明函数指针

    operation = add;             // 指向 add（函数名就是地址）
    printf("%d\n", operation(10, 5));  // 15

    operation = subtract;        // 换指向 subtract
    printf("%d\n", operation(10, 5));  // 5

    return 0;
}
```

**内存图解——函数也在内存中有"房子"：**

```
代码段（只读内存）:
地址:    0x4000            0x4100
      ┌──────────────┐ ┌──────────────┐
      │ add 的指令... │ │ subtract指令  │
      └──────────────┘ └──────────────┘

数据段:
地址:    0x2000
      ┌──────────────┐
      │ operation    │  存 0x4000 (add 的地址)
      │ (函数指针)   │  如果 =subtract，就变 0x4100
      └──────────────┘

operation(10, 5) 的执行：
1. 读 operation → 0x4000
2. 跳到 0x4000 执行
3. 传参数 10, 5 → 返回 15
```

## 示例二：函数指针数组——计算器菜单

把多个函数指针放进数组，获得一个"函数菜单"：

```c
#include <stdio.h>

int add(int a, int b)      { return a + b; }
int subtract(int a, int b) { return a - b; }
int multiply(int a, int b) { return a * b; }
int divide(int a, int b)   { return b ? a / b : 0; }

int main() {
    int (*ops[])(int, int) = {add, subtract, multiply, divide};
    char *names[] = {"加法", "减法", "乘法", "除法"};

    int a = 20, b = 5;
    printf("=== 计算器 ===\n");

    for (int i = 0; i < 4; i++) {
        printf("%d. %s: %d\n", i+1, names[i], ops[i](a, b));
    }

    // 模拟用户选第 2 个
    int choice = 2;
    printf("用户选了%s，结果: %d\n", names[choice-1], ops[choice-1](a, b));

    return 0;
}
```

**"函数菜单"结构：**

```
ops 数组:
索引:    ops[0]      ops[1]      ops[2]      ops[3]
      ┌──────────┐┌──────────┐┌──────────┐┌──────────┐
      │  0x4000  ││  0x4100  ││  0x4200  ││  0x4300  │ 函数地址
      └────┬─────┘└────┬─────┘└────┬─────┘└────┬─────┘
           ▼          ▼          ▼          ▼
       ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
       │ add  │  │ sub  │  │ mul  │  │ div  │
       └──────┘  └──────┘  └──────┘  └──────┘

ops[2](20, 5) → 读 ops[2]=0x4200 → 跳 multiply → 返回 100
```

好处：加新运算只需写一个新函数并加到数组，其他代码一行不用改。

## 示例三：qsort——标准库的函数指针应用

`qsort` 第四个参数是函数指针，你告诉它"怎么比"，它帮你排：

```c
#include <stdio.h>
#include <stdlib.h>

// 比较函数必须匹配签名：int (*)(const void*, const void*)
// void* 是"通用指针"

int cmp_asc(const void *a, const void *b) {
    return *(int*)a - *(int*)b;   // void* → int* → 取值 → 比较
}

int cmp_desc(const void *a, const void *b) {
    return *(int*)b - *(int*)a;   // 颠倒就是降序
}

int cmp_abs(const void *a, const void *b) {
    int ia = *(int*)a, ib = *(int*)b;
    return (ia<0 ? -ia : ia) - (ib<0 ? -ib : ib);
}

void print_arr(int *arr, int n) {
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\n");
}

int main() {
    int nums[] = {42, -7, 99, -13, 56};
    int n = 5;

    printf("原始:     "); print_arr(nums, n);

    qsort(nums, n, sizeof(int), cmp_asc);
    printf("升序:     "); print_arr(nums, n);   // -13 -7 42 56 99

    qsort(nums, n, sizeof(int), cmp_desc);
    printf("降序:     "); print_arr(nums, n);   // 99 56 42 -7 -13

    qsort(nums, n, sizeof(int), cmp_abs);
    printf("绝对值:   "); print_arr(nums, n);   // -7 -13 42 56 99

    return 0;
}
```

**qsort 调用图解：**

```
qsort(nums, 5, sizeof(int), cmp_asc)
  │      │      │             │
  │      │      │             └── 函数指针："怎么比大小"
  │      │      └── 每个元素 4 字节
  │      └── 5 个元素
  └── 数组首地址

qsort 内部：不需要知道数据类型，只负责按比较结果交换位置
```

**关键洞见：** qsort 的作者和你从未见面，但通过函数指针协同工作——你提供比较逻辑，他提供排序框架。这就是"把做什么和怎么做分离开"。

## 示例四：回调模式——for_each

回调是把一个函数传给另一个函数，后者在遍历每个元素时"回调"你：

```c
#include <stdio.h>

// 通用遍历器——不知道做什么，只负责遍历
void for_each(int *arr, int n, void (*fn)(int *)) {
    for (int i = 0; i < n; i++) fn(&arr[i]);
}

// 各种回调函数
void double_it(int *x) { *x *= 2; }
void add_five(int *x)  { *x += 5; }
void print_it(int *x)  { printf("%d ", *x); }
void square_it(int *x) { *x = (*x) * (*x); }

int main() {
    int arr[] = {1, 2, 3, 4, 5};
    int n = 5;

    printf("原始:  "); for_each(arr, n, print_it); printf("\n");  // 1 2 3 4 5
    for_each(arr, n, double_it);
    printf("加倍:  "); for_each(arr, n, print_it); printf("\n");  // 2 4 6 8 10
    for_each(arr, n, square_it);
    printf("平方:  "); for_each(arr, n, print_it); printf("\n");  // 4 16 36 64 100

    return 0;
}
```

**代码复用度对比：**

```
不用函数指针：5 个操作 × n 行重复的 for 循环
用函数指针  ：1 个 for_each × 5 个操作（每个一行）
```

## 示例五：插件/策略系统

不修改主程序，通过注册函数指针扩展功能：

```c
#include <stdio.h>
#include <string.h>

typedef void (*FilterFunc)(int *data, int size);

void filter_grayscale(int *d, int s) { printf("  [灰度滤镜]\n"); }
void filter_sepia(int *d, int s)     { printf("  [复古滤镜]\n"); }
void filter_invert(int *d, int s)    { printf("  [反色滤镜]\n"); }

struct FilterEntry {
    char name[32];
    FilterFunc func;
};

int main() {
    struct FilterEntry filters[] = {
        {"灰度", filter_grayscale},
        {"复古", filter_sepia},
        {"反色", filter_invert}
    };
    int count = 3, image[100] = {0};

    printf("=== 选择滤镜 ===\n");
    for (int i = 0; i < count; i++)
        printf("%d. %s\n", i+1, filters[i].name);

    int choice = 3;
    printf("选择: %d\n", choice);
    if (choice >= 1 && choice <= count)
        filters[choice-1].func(image, 100);  // 通过函数指针调用

    return 0;
}
```

**架构：** 主程序遍历滤镜表 → 用户选择 → 查表 → 调用对应函数。新加滤镜只需写新函数并加入数组。

## 示例六：状态机

每个状态是一个函数，返回下一个状态：

```c
#include <stdio.h>

typedef int (*StateFunc)(void);

int state_idle(void)    { printf("[空闲] → "); return 1; }
int state_running(void) { printf("[运行] → "); return 2; }
int state_paused(void)  { printf("[暂停] → "); return 1; }
int state_stop(void)    { printf("[停止]\n"); return -1; }

int main() {
    StateFunc states[] = {state_idle, state_running, state_paused, state_stop};

    int current = 0;
    for (int s = 0; s < 6 && current != -1; s++)
        current = states[current]();

    if (current != -1) states[3]();  // 强制结束
    return 0;
}
```

**状态转换：** `idle → running → paused → running → paused → running → stop`

## 五大常见错误

### 错误一：忘记括号——声明成返回指针的函数

```c
int *fp(int, int);      // ✘ 这是返回 int* 的函数！
int (*fp)(int, int);    // ✔ 这才是函数指针
```

记忆法：`(*名字)` 是指针，没有括号就是函数。

### 错误二：返回值类型不匹配

```c
int add(int a, int b) { return a + b; }
void (*fp)(int, int);   // ✘ 要求返回 void，但 add 返回 int
int (*fp)(int, int);    // ✔ 匹配
```

### 错误三：参数个数或类型错误

```c
int (*fp)(int, int) = add;
fp(10, 20, 30);   // ✘ 三个参数
fp(10);           // ✘ 一个参数
fp(10, 20);       // ✔
```

### 错误四：忘记 NULL 检查

```c
void process(int (*fn)(int)) {
    int result = fn(42);      // ✘ fn 可能是 NULL → 崩溃
}
// ✔ 先检查：
if (fn == NULL) return;
```

### 错误五：typedef 没用好反而更乱

```c
typedef int (*MathFunc)(int, int);  // "MathFunc"看起来像函数名
typedef int (*BinOp)(int, int);     // ✔ 清晰的名字
```

## 用 typedef 简化（强烈推荐）

```c
// 不用 typedef——每次都要写又长又丑的声明
int (*funcs[10])(int, int);

// 用 typedef——起好名字
typedef int (*BinOp)(int, int);  // BinOp = 二元操作函数指针
BinOp funcs[10];    // 秒懂
BinOp p = add;      // 秒懂

// 经典例子
typedef int (*CompareFunc)(const void*, const void*);
qsort(arr, n, sizeof(int), (CompareFunc)cmp_asc);
```

## 函数指针速查

| 写法 | 含义 |
|------|------|
| `int (*fp)(int)` | 声明函数指针 |
| `fp = myFunc` | 赋值（函数名是地址） |
| `fp(42)` | 通过指针调用 |
| `void (*fp)(void)` | 无参数无返回值 |
| `int (*fp[])(int,int)` | 函数指针数组 |

## 重点回顾

1. **函数也有地址**——函数名就是函数地址（和数组名一样）
2. **`(*fp)` 是关键**——括号把 `*` 和名字绑在一起
3. **三大场景**——qsort、回调、策略/插件系统
4. **typedef 是好朋友**——让函数指针类型像普通类型
5. **类型严格匹配**——返回值、参数一个都不能差
