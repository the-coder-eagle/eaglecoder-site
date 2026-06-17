---
category: "C语言教程"
title: "栈与堆 — C 程序的内存布局"
description: "C语言学习教程"
slug: "stack-vs-heap"
level: 3
order: 4
tags: ["栈", "堆", "内存布局", "作用域", "指针"]
---

# 栈与堆 — C 程序的内存布局

## 热身类比：书桌上的便签 vs 仓库里的货架

想象你是图书馆的管理员。你的工作台上有两种存储空间：

**书桌上的便签纸（栈 Stack）**：
- 随手拿来就用，用完随手扔掉——方便快捷
- 但便签纸就那么一小沓——容量有限
- 便签纸按顺序叠放，先放的在下面，后放的在上面——后进先出（LIFO）
- 清理桌面时，从上往下收，收完就没了

**仓库里的货架（堆 Heap）**：
- 空间大得多，能存放大量书籍
- 但你要登记、贴标签、找空位——手续繁琐，速度慢
- 书放多久都行，但到期你必须**自己**去搬走——不会有人帮你自动清理
- 如果忘了搬走，仓库越堆越满，最终仓库爆满（内存泄漏）

```
书桌 (Stack)                         仓库 (Heap)
┌─────────────────┐              ┌─────────────────┐
│ 便签 5  (最后放)  │              │                  │
│ 便签 4           │              │  ┌──────┐       │
│ 便签 3           │  ← 后进先出  │  │ 大箱子 │       │
│ 便签 2           │              │  └──────┘       │
│ 便签 1  (最先放)  │              │  └────┘└─┐      │
│                 │              │  小箱  已腾空     │
│  又快又小又自动   │              │  (碎片问题)      │
└─────────────────┘              └─────────────────┘
```

C 程序运行时的内存也像这样分成不同的"功能区"——理解这些区域，你就能写出更安全、更高效的代码。

---

## C 程序内存全景图

一个正在运行的 C 程序，内存布局如下（从高地址到低地址）：

```
高地址
  ↑
  │  ┌──────────────────────────┐  ← 栈顶 (stack pointer)
  │  │                          │
  │  │    栈 (Stack Segment)     │  局部变量、函数参数、返回地址
  │  │    自动分配 / 自动释放    │  大小：通常 1-8 MB
  │  │    ↓↓↓ 向下增长           │  后进先出 (LIFO)
  │  │                          │
  │  ├──────────────────────────┤
  │  │                          │
  │  │                          │
  │  │    空闲空间               │  栈向下长，堆向上长
  │  │    (Free Space)          │  它们在空闲空间"碰头"时 = 内存耗尽
  │  │                          │
  │  │                          │
  │  ├──────────────────────────┤
  │  │                          │
  │  │    堆 (Heap Segment)     │  malloc() 分配的内存
  │  │    手动分配 / 手动释放    │  大小：受物理内存+虚拟内存限制
  │  │    ↑↑↑ 向上增长           │  free() 归还，可能产生碎片
  │  │                          │
  │  ├──────────────────────────┤
  │  │    BSS 段                 │  未初始化的全局变量 & static 变量
  │  │    (Block Started by      │  程序启动时自动初始化为 0
  │  │     Symbol)               │  例如：static int count;
  │  ├──────────────────────────┤
  │  │    Data 段                │  已初始化的全局变量 & static 变量
  │  │    (Initialized Data)     │  例如：int global = 100;
  │  ├──────────────────────────┤
  │  │    Text 段 (代码段)        │  编译后的机器指令（只读）
  │  │    (Code / Text)          │  程序代码就在这里
  │  │                          │
  ↓  └──────────────────────────┘
低地址
```

**各段的职责速览：**

| 内存区域 | 存放什么 | 谁来管理 | 大小限制 | 何时释放 |
|----------|---------|---------|---------|---------|
| **Text（代码段）** | 程序的机器指令 | 编译器/OS | 程序大小 | 程序结束 |
| **Data（数据段）** | 已初始化的全局/static变量 | 编译器 | 编译期确定 | 程序结束 |
| **BSS** | 未初始化的全局/static变量 | 编译器 | 编译期确定 | 程序结束 |
| **Heap（堆）** | malloc/calloc/realloc 分配 | 程序员手动 | 系统内存总量 | 调用 free() 时 |
| **Stack（栈）** | 局部变量、函数调用信息 | 编译器自动 | 1-8 MB（OS 决定） | 离开作用域时 |

---

## 栈 (Stack) 深度解析

### 栈的工作原理 —— 盘子叠放模型

栈像一摞盘子：只能在顶部添加（push）或移除（pop）。每次函数调用时，一组新的局部变量被"压入"栈顶；函数返回时，这些变量被"弹出"并销毁。

```
程序执行：main() 调用 funcA() → funcA() 调用 funcB()

时间 ↓

  main() 运行         进入 funcA()          进入 funcB()        funcB() 返回      funcA() 返回
  ┌──────────┐      ┌──────────┐        ┌──────────┐       ┌──────────┐      ┌──────────┐
  │          │      │ funcB 栈帧│        │          │       │          │      │          │
  │          │      ├──────────┤        │ funcB 栈帧│       │ funcB 栈帧│      │          │
  │          │      │ funcA 栈帧│        ├──────────┤       ├──────────┤      │          │
  │ main 栈帧 │      ├──────────┤        │ funcA 栈帧│       │ funcA 栈帧│      │          │
  │          │      │ main 栈帧 │        ├──────────┤       ├──────────┤      │ main 栈帧 │
  │          │      │          │        │ main 栈帧 │       │ main 栈帧 │      │          │
  └──────────┘      └──────────┘        └──────────┘       └──────────┘      └──────────┘
    栈只有             栈长高了             栈更高了          funcB 栈帧弹出    funcA 栈帧弹出
    一层              (push)              (push)            (pop)            (pop)
```

### 示例 1：观察栈变量地址

```c
#include <stdio.h>

void funcB(int param) {
    int local_b = 200;
    // 打印 funcB 中变量的地址
    printf("  funcB: param   = %p\n", (void*)&param);
    printf("  funcB: local_b = %p\n", (void*)&local_b);
    // 注意：地址值越小 = 越靠近栈底（低地址）
}

void funcA(int param) {
    int local_a = 100;
    printf("funcA: param   = %p\n", (void*)&param);
    printf("funcA: local_a = %p\n", (void*)&local_a);
    funcB(200);
}

int main() {
    int main_var = 42;
    printf("main: main_var = %p\n", (void*)&main_var);
    funcA(100);
    return 0;
}

/* 某次运行输出（地址值每台机器不同）：
main: main_var = 0000008C5A5FFB04
funcA: param   = 0000008C5A5FFAE0
funcA: local_a = 0000008C5A5FFB00
  funcB: param   = 0000008C5A5FFAC0
  funcB: local_b = 0000008C5A5FFAE0

注意观察：
  - main 的地址最小（栈底附近）
  - funcA 的地址比 main 小（栈向下增长，地址变小）
  - funcB 的地址比 funcA 小（继续向下增长）
*/
```

---

## 堆 (Heap) 深度解析

### 示例 2：对比栈和堆的变量地址

```c
#include <stdio.h>
#include <stdlib.h>

// 全局变量 —— Data 段
int global_initialized = 100;

// 未初始化的 static 全局变量 —— BSS 段
static int global_static_zero;

void demonstrate() {
    // 局部变量 —— 栈
    int stack_var = 42;

    // static 局部变量 —— Data 段（有初始化值）
    static int static_local = 999;

    // 动态分配 —— 堆
    int *heap_var = (int*)malloc(sizeof(int));
    if (heap_var == NULL) {
        printf("malloc 失败！\n");
        return;
    }
    *heap_var = 888;

    printf("========== 各内存区域的地址 ==========\n");
    printf("Text  段 (代码)    : %p\n", (void*)demonstrate);
    printf("Data  段 (全局已初始化): %p\n", (void*)&global_initialized);
    printf("Data  段 (局部static)  : %p\n", (void*)&static_local);
    printf("BSS   段 (全局未初始化): %p\n", (void*)&global_static_zero);
    printf("Heap  段 (malloc)  : %p  ← 地址在栈和 data 之间\n", (void*)heap_var);
    printf("Stack 段 (局部变量) : %p  ← 高地址\n", (void*)&stack_var);
    printf("======================================\n");

    free(heap_var);
    heap_var = NULL;
}

int main() {
    demonstrate();
    return 0;
}

/* 某次运行输出（观察地址的大小关系）：
========== 各内存区域的地址 ==========
Text  段 (代码)    : 00007FF6A2131C40  ← 最低（代码段在低地址）
Data  段 (全局已初始化): 00007FF6A213C030
Data  段 (局部static)  : 00007FF6A213C034
BSS   段 (全局未初始化): 00007FF6A213D148
Heap  段 (malloc)  : 000001E5F5E85A90  ← 中间位置
Stack 段 (局部变量) : 0000008C5A5FFB24  ← 最高（栈从高地址往低地址长）
======================================
*/
```

---

## 栈 vs 堆：全面对比

### 示例 3：同功能，两种实现 —— 直观感受差异

**用栈：函数返回后不能再用**

```c
#include <stdio.h>

// ❌ 错误示范：返回栈上变量的地址（悬空指针）
int* create_on_stack() {
    int x = 42;
    return &x;  // 危险！x 在函数返回后就消失了
}

// 用栈的数组必须在编译期知道大小
void stack_array_demo() {
    int size = 10;
    int arr[10];  // 编译期常量可以
    // int arr[size];  // 在 C89 中不允许，C99+ 支持 VLA
                       // 但 VLA 仍在栈上，大小有限制
}
```

**用堆：函数返回后仍然有效**

```c
#include <stdio.h>
#include <stdlib.h>

// ✅ 正确：返回堆上变量的地址（调用者负责 free）
int* create_on_heap() {
    int *p = (int*)malloc(sizeof(int));
    if (p == NULL) return NULL;
    *p = 42;
    return p;  // 安全！堆上的内存不会在函数返回时自动释放
}

int main() {
    int *value = create_on_heap();
    if (value != NULL) {
        printf("value = %d\n", *value);  // 42 —— 正常使用！
        free(value);                      // 用完了别忘了释放
    }
    return 0;
}
```

---

## 经典错误：返回局部变量的地址

这个错误太经典了，值得单列一节。

### 错误演示（一定会出问题！）

```c
#include <stdio.h>

// ❌❌❌ 永远不要这样做！❌❌❌
int* dangerous_function() {
    int local = 12345;
    // local 在栈上，函数返回后这片内存就"归还"了
    return &local;
    // 返回的地址指向一块"已被回收"的内存
    // 就像你退了酒店房间还留着房卡，偷偷溜回去——
    // 房间里可能住着别人，也可能空着，但肯定不是你的了
}

int main() {
    int *ptr = dangerous_function();

    // 可能输出 12345（运气好，那块内存还没被别人用）
    // 可能输出随机值（别人已经写入了新数据）
    // 可能崩溃（操作系统检测到非法访问）
    printf("危险读取: %d\n", *ptr);  // 未定义行为！

    return 0;
}
```

**内存视角解释：**

```
dangerous_function() 运行时：
  栈上：
  ┌──────────────────┐
  │ local = 12345    │ ← ptr 指向这里
  │ (其他数据)        │
  │ main 的栈帧       │
  └──────────────────┘

dangerous_function() 返回后（local 的栈帧被弹出）：
  栈上：
  ┌──────────────────┐
  │ ??? (已回收)      │ ← ptr 还指向这里，但内存已经不属于 local 了
  │ main 的栈帧       │
  │ printf 的栈帧     │  ← printf 调用可能会覆盖这块内存！
  └──────────────────┘
```

### 正确做法对比

```c
#include <stdio.h>
#include <stdlib.h>

// ✅ 方案 1：返回值（对于简单的值）
int safe_return_value() {
    int local = 12345;
    return local;  // 返回的是值（副本），安全！
}

// ✅ 方案 2：用堆分配（对于大型数据、数组、结构体）
int* safe_return_pointer() {
    int *p = (int*)malloc(sizeof(int));
    if (p == NULL) return NULL;
    *p = 12345;
    return p;  // 安全：堆上的内存在 free 前一直有效
    // 调用者负责：用完要 free(p)
}

// ✅ 方案 3：让调用者提供缓冲区
void safe_fill_buffer(int *buffer, int size) {
    for (int i = 0; i < size; i++) {
        buffer[i] = i * 10;  // 写入调用者提供的内存
    }
    // 不返回指针，不分配内存，安全！
}

int main() {
    // 方案 1
    int v = safe_return_value();     // 值传递，安全
    printf("方案1: %d\n", v);

    // 方案 2
    int *p = safe_return_pointer();
    if (p != NULL) {
        printf("方案2: %d\n", *p);
        free(p);
    }

    // 方案 3
    int arr[5];
    safe_fill_buffer(arr, 5);       // 调用者提供内存，安全
    for (int i = 0; i < 5; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    return 0;
}
```

---

## 常见错误诊所

### 错误 1：返回局部变量指针（再次强调！）

```c
// ❌ 经典错误 —— 返回栈上变量的地址
int* bad_factory() {
    int product = 99;
    return &product;         // 危险！
}

// ✅ 改正
int* good_factory() {
    int *product = (int*)malloc(sizeof(int));
    if (product) *product = 99;
    return product;          // 安全（调用者负责 free）
}
```

### 错误 2：栈溢出（Stack Overflow）

```c
// ❌ 局部数组太大，撑爆栈（通常超过 1-8 MB 就会崩）
int main() {
    int huge_array[10000000];  // 约 40 MB → 栈溢出！程序崩溃
    return 0;
}

// ✅ 大数组放堆上
int main() {
    int *huge_array = (int*)malloc(10000000 * sizeof(int));
    if (huge_array == NULL) {
        printf("内存不足！\n");
        return 1;
    }
    // ... 使用 huge_array ...
    free(huge_array);
    return 0;
}
```

### 错误 3：深层递归导致栈溢出

```c
// ❌ 递归太深，每次调用都占一层栈帧
int deep_recursion(int n) {
    if (n == 0) return 0;
    return 1 + deep_recursion(n - 1);  // 如果 n=1000000，栈必爆
}

// ✅ 解法 1：用循环代替递归
int loop_version(int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) sum++;
    return sum;                // 只占一层栈帧
}

// ✅ 解法 2：如果数据多，把数据放堆上处理
void process_large_data() {
    int *data = (int*)malloc(1000000 * sizeof(int));
    // 在堆上处理大量数据...
    free(data);
}
```

### 错误 4：混淆栈变量和堆变量的生命周期

```c
#include <stdio.h>
#include <stdlib.h>

int *global_ptr;  // 全局指针

void setup() {
    int local = 42;
    global_ptr = &local;  // ❌ 指向栈上变量！
}  // local 在此销毁，global_ptr 变成悬空指针

void setup_correct() {
    int *p = (int*)malloc(sizeof(int));
    *p = 42;
    global_ptr = p;       // ✅ 指向堆上变量，不会自动销毁
    // 注意：不能在这里 free(p)，否则 global_ptr 又悬空了
}  // 全局变量 global_ptr 在程序结束时才销毁，它的生命周期 > p 的生命周期

int main() {
    setup();
    // printf("%d\n", *global_ptr);  // ❌ 未定义行为（如果调用了 setup()

    setup_correct();
    printf("%d\n", *global_ptr);     // ✅ 安全
    free(global_ptr);                // 在程序结束前释放
    global_ptr = NULL;
    return 0;
}
```

---

## 决策指南：何时用栈？何时用堆？

```
需要一个变量？问自己三个问题：

Q1: 大小固定吗？
    ├── 是 (小) → 用栈！
    └── 否 (大/未知) → 用堆！

Q2: 需要在函数返回后继续使用吗？
    ├── 否 → 用栈！
    └── 是 → 用堆！

Q3: 大小超过 1MB 吗？
    ├── 否 → 可以继续用栈
    └── 是 → 必须用堆！

总结：
┌──────────────────────────────────────────┐
│  默认选择：栈（简单、快、自动管理）        │
│  特殊场景：堆（大、长生命周期、动态大小）   │
│  黄金法则：能栈则栈，不得已才用堆          │
└──────────────────────────────────────────┘
```

---

## 实践建议

1. **默认用局部变量（栈）**：简单、安全、自动清理
2. **需要大内存时用 malloc**：超过几 KB 就考虑堆
3. **需要跨函数共享数据时用堆**：或者用参数传递，或者返回值
4. **永远不要返回局部变量的地址**：编译器可能不报错，但这是定时炸弹
5. **用地址对比法验证理解**：写一个测试程序，打印栈变量、堆变量、全局变量的地址，亲眼看看它们在内存中的位置

---

## 小测试

不看上面的内容，试着回答：

1. 一个局部 `int` 数组 `int arr[5]` 在哪个内存区域？函数返回后它还在吗？
2. `malloc(100)` 返回的内存在哪个区域？什么时候消失？
3. `static int count = 0` 在哪个区域？
4. 为什么不能返回局部变量的地址？如果硬要返回，应该怎么做？
5. 什么情况下会导致栈溢出？怎么避免？

（答案见文末）

---

## 要点速查

| 知识点 | 一句话 |
|--------|--------|
| 内存五区 | Text（代码）、Data（已初始化全局）、BSS（未初始化全局）、Heap（堆）、Stack（栈） |
| 栈 | 局部变量，自动管理，后进先出，速度快但空间小（~1-8MB） |
| 堆 | malloc 分配，手动管理，空间大但速度慢，可能碎片化 |
| 栈溢出 | 局部变量过大或递归过深；解决方案：用堆或循环 |
| 悬空指针 | 指向已释放内存的指针；永远不要返回栈变量地址 |
| 选择原则 | 能栈则栈；大、动态、跨函数用堆 |

> **核心心法**：栈是 C 语言的"自动驾驶"——你不用操心，但它能力有限。堆是"手动挡"——更强大，但你必须自己负责挂挡、刹车。一个好的 C 程序员知道什么时候让编译器代劳，什么时候亲自上阵。

（小测试答案：
1. 栈上；函数返回后不复存在。
2. 堆上；调用 `free()` 后才消失。
3. Data 段（有初始值的 static 变量）。
4. 因为栈变量在函数返回时就销毁了。替代方案：(a) 返回值（而不是地址），(b) 用 `malloc` 在堆上分配，(c) 让调用者提供缓冲区。
5. 分配超大的局部数组或无限递归。用 `malloc` 分配大数组，用循环代替递归。）
