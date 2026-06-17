---
category: "C语言教程"
title: "高级指针 — 二级指针与指针数组"
description: "C语言学习教程"
slug: "advanced-pointers"
level: 5
order: 4
tags: ["二级指针", "指针数组", "动态二维数组", "高级指针"]
---

# 高级指针 — 二级指针与指针数组

如果你理解"指针是一张写着门牌号的纸条"，那么二级指针只有一个新概念：**纸条本身也在某个房间里，也有自己的门牌号。** 指向纸条的纸条就是二级指针。

## 核心比喻：纸条套纸条

```
变量 x       = 一栋房子，里面放着 42
一级指针 p   = 一张纸条，上面写着 x 的门牌号
二级指针 pp  = 又一张纸条，上面写着 p 的门牌号

拿到 42 要两步：
  第一步：看 pp → 得到 p 的门牌号 → 找到 p
  第二步：看 p  → 得到 x 的门牌号 → 找到 x → 拿出 42

用代码说：**pp = pp → *pp = p → **pp = x = 42**
```

## 为什么需要二级指针？

规则很简单——你要改什么类型，就传指向它的指针：

- 在函数里改 `int` → 传 `int *`
- 在函数里改 `int *` → 传 `int **`
- 在函数里改 `int **` → 传 `int ***`（很少用）

## 示例一：在函数里分配内存——修改外部指针

二级指针最常见的实际场景：

```c
#include <stdio.h>
#include <stdlib.h>

// 在函数里分配数组，通过二级指针把新指针"传出去"
void create_array(int **out_ptr, int size) {
    *out_ptr = (int*)malloc(size * sizeof(int));  // *out_ptr 就是外部的指针变量
    if (*out_ptr == NULL) return;

    for (int i = 0; i < size; i++)
        (*out_ptr)[i] = i * 10;
}

int main() {
    int *arr = NULL;
    create_array(&arr, 5);  // &arr 是 int** → 传 arr 的地址

    for (int i = 0; i < 5; i++) printf("%d ", arr[i]);  // 0 10 20 30 40
    printf("\n");

    free(arr);
    return 0;
}
```

**二级指针内存图解（每一步）：**

```
调用前 (main 中):
      ┌──────────────┐
      │  arr = NULL  │  arr 位于地址 0x2000
      └──────────────┘

调用 create_array(&arr, 5):  out_ptr = 0x2000 (arr 的门牌号)

      ┌─────────────────┐
      │ out_ptr=0x2000  │──→ arr 的房间
      └─────────────────┘

*out_ptr = malloc(...):  malloc 分配 5 个 int，首地址 0x5000
      通过 *out_ptr 写入 arr → arr = 0x5000

      ┌──────────────┐       ┌──────────────────────┐
      │ arr=0x5000   │──────→│ 0  10  20  30  40    │
      └──────────────┘       └──────────────────────┘

返回后: out_ptr 消失，但 arr 已被改，指向堆上的数组
```

**什么时候用二级指针？什么时候直接返回？**

| 场景 | 方案 |
|------|------|
| 创建全新指针 | `return malloc(...)` 简单直接 |
| 修改调用者已有的指针 | 二级指针 `int**`，必须！ |
| realloc 重新分配 | 二级指针，realloc 可能改变地址 |

## 示例二：动态二维数组——二级指针最实用的场景

需要"行列数量在运行时决定"的矩阵：

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int rows = 3, cols = 4;

    // 第一步：分配行指针数组（int* 的数组）
    int **matrix = (int**)malloc(rows * sizeof(int*));

    // 第二步：为每一行分配列数据
    for (int i = 0; i < rows; i++)
        matrix[i] = (int*)malloc(cols * sizeof(int));

    // 第三步：像普通二维数组一样用
    for (int i = 0; i < rows; i++)
        for (int j = 0; j < cols; j++)
            matrix[i][j] = i * cols + j;

    // 第四步：打印
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++)
            printf("%2d ", matrix[i][j]);
        printf("\n");
    }

    // 输出:   0  1  2  3
    //         4  5  6  7
    //         8  9 10 11

    // 第五步：逆序释放！
    for (int i = 0; i < rows; i++) free(matrix[i]);  // 先释放每一行
    free(matrix);                                     // 再释放行指针数组

    return 0;
}
```

**动态二维数组 vs 静态二维数组——内存布局对比：**

```
静态 int arr[3][4]——连续一块内存：
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│ 0│ 1│ 2│ 3│ 4│ 5│ 6│ 7│ 8│ 9│10│11│
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
  row0 (12B)  row1 (12B)  row2 (12B)

动态 int **matrix——行指针数组 + 各行独立分配：
      matrix (int**)
      ┌──────────┐
      │ 0xA000   │──→ 行指针数组 (int*[])
      └──────────┘   ┌──────┬──────┬──────┐
                     │0xB000│0xC000│0xD000│
                     └──┬───┴──┬───┴──┬───┘
                        ▼      ▼      ▼
                    [0 1 2 3] [4 5 6 7] [8 9 10 11]
                      row0      row1      row2

各行的内存不保证相邻！好处：每行可以不同长度（锯齿数组）
```

**释放为什么必须逆序？**

```c
free(matrix);       // ✘ 先释放行指针数组
free(matrix[0]);    //   为时已晚！matrix 已无效

// ✔ 先释放行，再释放行指针数组
for (int i = 0; i < rows; i++) free(matrix[i]);
free(matrix);
```

## 示例三：指针数组 vs 数组指针——90% 初学者搞混

```c
int *ptr_arr[10];    // 指针数组    ：10 个 int* 的数组
int (*arr_ptr)[10];  // 数组指针    ：指向 int[10] 的指针
```

**一句话记忆：括号里的先解析。**
- `ptr_arr[10]` → 先和 `[10]` 结合 → 是数组 → 元素是 `int*`
- `(*arr_ptr)` → 先和 `*` 结合 → 是指针 → 指向 `int[10]`

```c
#include <stdio.h>

int main() {
    // === 指针数组 ===
    int a = 10, b = 20, c = 30;
    int *ptr_arr[3] = {&a, &b, &c};  // 3 个指针排一起

    for (int i = 0; i < 3; i++)
        printf("*ptr_arr[%d] = %d\n", i, *ptr_arr[i]);

    // === 数组指针 ===
    int grid[2][3] = {{1,2,3}, {4,5,6}};
    int (*arr_ptr)[3] = grid;  // 指向一行的指针

    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 3; j++)
            printf("arr_ptr[%d][%d] = %d\n", i, j, arr_ptr[i][j]);

    return 0;
}
```

**内存布局对比：**

```
指针数组 int *ptr_arr[3]:
      ┌──────────┐┌──────────┐┌──────────┐  三个指针紧挨着
      │ &a       ││ &b       ││ &c       │  每个 8 字节，共 24 字节
      └────┬─────┘└────┬─────┘└────┬─────┘
           ▼          ▼          ▼
       ┌──────┐  ┌──────┐  ┌──────┐
       │  10  │  │  20  │  │  30  │
       └──────┘  └──────┘  └──────┘

数组指针 int (*arr_ptr)[3]:
      ┌──────────┐                arr_ptr 是一个指针（8字节）
      │ &grid[0] │──→ 指向一整行
      └──────────┘
           ▼
      ┌──┬──┬──┬──┬──┬──┐
      │ 1│ 2│ 3│ 4│ 5│ 6│    连续内存
      └──┴──┴──┴──┴──┴──┘
        row0 (12B) row1 (12B)
      arr_ptr+1 跳过整行 → 加 12 字节
```

## 示例四：命令行参数 argv——二级指针实战

`int main(int argc, char **argv)` 你一直在用二级指针：

```c
#include <stdio.h>

// argv 两种等价写法：
// int main(int argc, char *argv[])   // 指针数组风格
// int main(int argc, char **argv)    // 二级指针风格

int main(int argc, char **argv) {
    printf("参数个数: %d\n\n", argc);

    for (int i = 0; i < argc; i++)
        printf("argv[%d] = \"%s\"\n", i, argv[i]);

    // argv[argc] 保证是 NULL
    printf("\nargv[%d] = %p (NULL)\n", argc, (void*)argv[argc]);

    return 0;
}
```

**以 `./prog hello world` 运行，argv 内存结构：**

```
argv (char**) → 指向 char* 数组
      │
      ▼
      ┌──────┬──────┬──────┬──────┐
      │  ●   │  ●   │  ●   │ NULL │  char* 数组
      └──┬───┴──┬───┴──┬───┴──────┘
         │      │      │
         ▼      ▼      ▼
    ┌────────┐┌───────┐┌───────┐
    │./prog\0││hello\0││world\0│
    └────────┘└───────┘└───────┘

argv[0] → "./prog", argv[1] → "hello", argv[2] → "world"
```

## 示例五：通过二级指针操作链表

链表操作中要修改头指针本身，二级指针最优雅：

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

// 头插——需要改头指针 → 传 Node**
void push_front(Node **head, int value) {
    Node *new_node = (Node*)malloc(sizeof(Node));
    new_node->data = value;
    new_node->next = *head;  // 新节点指向旧头
    *head = new_node;         // 头指针改为新节点
}

// 删除所有指定值的节点——头可能被删 → 传 Node**
void remove_all(Node **head, int target) {
    Node *curr = *head, *prev = NULL;
    while (curr) {
        if (curr->data == target) {
            Node *d = curr;
            if (!prev) *head = curr->next;  // 删的是头！
            else       prev->next = curr->next;
            curr = curr->next;
            free(d);
        } else {
            prev = curr;
            curr = curr->next;
        }
    }
}

void print_list(Node *head) {
    while (head) { printf("%d -> ", head->data); head = head->next; }
    printf("NULL\n");
}

int main() {
    Node *list = NULL;

    push_front(&list, 30);
    push_front(&list, 20);
    push_front(&list, 10);
    print_list(list);  // 10 -> 20 -> 30 -> NULL

    remove_all(&list, 10);
    print_list(list);  // 20 -> 30 -> NULL

    // 释放
    while (list) { Node *n = list->next; free(list); list = n; }
    return 0;
}
```

**push_front 图解——为什么要二级指针：**

```
push_front 前:  list → NULL

push_front(&list, 10):  head 纸条指向 list 的房间
      ┌──────────┐         ┌──────────┐     ┌──────────┐
      │  head    │──→ list │  NULL    │     │ data:10  │ new_node
      └──────────┘         └──────────┘     │ next:?   │
                                            └──────────┘
*head = new_node:  list 指向新节点！
      ┌──────────┐     ┌──────────┐     ┌──────────┐
      │  head    │──→  │ new_addr │──→  │ data:10  │
      └──────────┘     │(=*head)  │     │ next:NULL│
                       └──────────┘     └──────────┘
```

## 示例六：函数返回指针——安全与危险

```c
#include <stdio.h>
#include <stdlib.h>

// ✔ 安全：返回静态变量地址（生命周期 = 整个程序）
char* error_msg(int code) {
    static char msg[64];
    snprintf(msg, 64, "错误 %d：操作失败", code);
    return msg;
}

// ✔ 安全：返回堆内存（调用者负责 free）
int* make_range(int start, int n) {
    int *arr = (int*)malloc(n * sizeof(int));
    for (int i = 0; arr && i < n; i++) arr[i] = start + i;
    return arr;
}

// ✘ 致命：返回局部变量地址！
int* dangerous(void) {
    int local = 42;
    return &local;  // local 函数返回后就没了！
}

int main() {
    printf("%s\n", error_msg(404));   // 安全

    int *nums = make_range(100, 5);   // 安全（用完 free）
    for (int i = 0; i < 5; i++) printf("%d ", nums[i]);
    printf("\n");
    free(nums);

    // int *bad = dangerous();        // 不要学！
    return 0;
}
```

**"悬垂指针"图解——为什么返回局部变量地址致命：**

```
进入函数     │ 返回后          │ 新函数调用后
┌──────────┐ │ ┌──────────┐   │ ┌──────────┐
│ local=42 │ │ │ ~~~42~~~ │   │ │ 新变量   │ ← 覆盖了 42！
└──────────┘ │ └──────────┘   │ └──────────┘
指针→这里    │ 指针→这里！     │ 指针→垃圾值！
             │ 栈空间标记"废弃"│
             │ 但内容可能还在   │
```

## 常见错误速查

### 错误一：二级指针只解引用一次

```c
int x = 42, *p = &x, **pp = &p;
printf("%d\n", *pp);   // ✘ 打印 p 的值（一个地址）
printf("%d\n", **pp);  // ✔ 两次解引用，拿到 42

// pp → p → x：*pp = p 的值，**pp = x 的值
```

### 错误二：malloc 未检查返回值

```c
int **m = (int**)malloc(rows * sizeof(int*));
// ✘ 直接用了！m 可能是 NULL
if (!m) return 1;  // ✔ 检查

for (int i = 0; i < rows; i++) {
    m[i] = (int*)malloc(cols * sizeof(int));
    if (!m[i]) { /* 清理已分配的行，释放 m */ return 1; }  // ✔
}
```

### 错误三：释放顺序反了

```c
free(matrix);        // ✘ 先释放行指针数组
free(matrix[0]);     // matrix 已经无效了

// ✔
for (int i = 0; i < rows; i++) free(matrix[i]);  // 先释放行
free(matrix);                                      // 再释放数组
```

### 错误四：`int *p, q;` 陷阱（再强调）

```c
int* p, q;   // ✘ 只有 p 是指针！q 是普通 int
int *p, *q;  // ✔ 两个都是指针
```

### 错误五：数组指针算术运算搞错

```c
int grid[3][4];
int (*ap)[4] = grid;  // ap 指向 int[4]（一行 16 字节）

ap + 1  // 加 sizeof(int[4]) = 16，不是加 4！
        // 因为 ap 的类型是 int(*)[4]
```

### 错误六：返回局部变量地址

```c
int* f() { int x = 5; return &x; }  // ✘ x 是局部变量！
// 返回后 x 已销毁，指针悬空
```

## 指针类型速查总结

| 声明 | 读作 | 类型 |
|------|------|------|
| `int *p` | p 是指向 int 的指针 | 一级指针 |
| `int **pp` | pp 是指向 int* 的指针 | 二级指针 |
| `int *arr[10]` | arr 是数组，元素是 int* | 指针数组 |
| `int (*arr)[10]` | arr 是指针，指向 int[10] | 数组指针 |
| `int *f()` | f 是函数，返回 int* | 返回指针的函数 |
| `int (*f)()` | f 是指针，指向函数 | 函数指针 |

**记忆法则：** `[]` 和 `()` 优先级高于 `*`。要改结合顺序用括号。

## 重点回顾

1. **二级指针 = 纸条套纸条**——两次解引用拿到最终值
2. **改什么类型就传指向它的指针**——改 `int*` 传 `int**`
3. **最常用场景**——动态二维数组、链表头节点操作、函数分配内存
4. **`int *arr[10]` vs `int (*arr)[10]`**——括号决定一切
5. **释放逆序**——先内部后外部
6. **永远不要返回局部变量的地址**——函数返回栈就没了
