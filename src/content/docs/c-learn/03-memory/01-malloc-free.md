---
category: "C语言教程"
title: "动态内存分配 — malloc 与 free"
description: "C语言学习教程"
slug: "malloc-free"
level: 3
order: 3
tags: ["malloc", "free", "堆内存", "指针", "calloc", "realloc"]
---

# 动态内存分配 — malloc 与 free

## 热身类比：租房 vs 住酒店

假设你需要一个地方住。你有两种选择：

**住酒店（栈内存）**：
- 进酒店时给你一间房，退房时自动收回——不用你操心
- 但房间大小是固定的，你不能把墙砸了扩建
- 退房后你就不能再进去了

**租房（堆内存）**：
- 你想租多大就租多大（一居、两居、三居……）
- 租多久你自己说了算——只要不退租，房子就是你的
- 但！退租手续必须**你亲自**去办，房东不会自动帮你办。如果你忘了退租还继续交租金……这就是内存泄漏

C 语言里的内存管理完全遵循这个类比：

```
     栈 (Stack)                        堆 (Heap)
   ┌────────────┐                 ┌────────────┐
   │ int x = 5  │                 │  malloc()  │
   │ 自动分配    │                 │  手动分配    │
   │ 自动释放    │                 │  手动释放    │
   │ 大小固定    │                 │  大小自由    │
   │ 速度快      │                 │  速度较慢    │
   │ 空间小      │                 │  空间大      │
   └────────────┘                 └────────────┘
     酒店式                         租房式
```

到目前为止，你用的所有变量（`int x`、`double arr[100]`、`char name[50]`）都住在"酒店"里——编译器帮你自动分配、自动释放。但当你遇到以下场景时，你就需要"租房"了：

- "我不知道程序运行时用户会输入多少个数字" → 数组大小不确定
- "我需要一个 100MB 的大数组" → 栈空间不够（通常只有 1-8 MB）
- "这个数据需要在函数返回后继续存在" → 栈变量出了函数就没了

---

## 核心函数速览

```
   内存分配三剑客              内存释放
   ┌─────────────┐          ┌──────────┐
   │  malloc()   │          │  free()  │
   │  calloc()   │          │          │
   │  realloc()  │          │  有借有还 │
   └──────┬──────┘          └────┬─────┘
          │                      │
     ┌────┴────┐           ┌─────┴─────┐
     │ 向堆申请 │           │ 把内存归还 │
     │ 一块内存 │           │ 给操作系统  │
     └─────────┘           └───────────┘

   ⚠️ 黄金法则：每一次 malloc/calloc/realloc 必须对应一次 free
      （就像每次租房必须退租，否则你的押金——内存——就永远没了）
```

| 函数 | 参数 | 作用 | 头文件 |
|------|------|------|--------|
| `malloc(size)` | 需要多少字节 | 分配 size 字节的原始内存（不初始化，内含垃圾值） | `<stdlib.h>` |
| `calloc(n, size)` | n 个元素，每个 size 字节 | 分配 n×size 字节，且**全部初始化为 0** | `<stdlib.h>` |
| `realloc(ptr, size)` | 原指针，新大小 | 把已分配的内存**调整**为新的大小 | `<stdlib.h>` |
| `free(ptr)` | 要释放的指针 | 释放之前分配的内存，归还系统 | `<stdlib.h>` |

---

## 示例 1：malloc 基本用法（逐行详解）

我们来写一个"用户决定数组大小"的程序——这种需求用普通数组做不到。

```c
#include <stdio.h>
#include <stdlib.h>   // malloc 和 free 在这里！

int main() {
    int n;

    // 步骤 1：询问用户需要多少元素
    printf("你想输入几个数字？");
    scanf("%d", &n);

    // 步骤 2：用 malloc 动态分配恰好 n 个 int 的内存
    // ┌────────── 关键语法解析 ──────────┐
    // │                                   │
    // │  int *arr =                       │  ← 指针变量，存地址
    // │    (int*)                          │  ← 强制类型转换
    // │    malloc(                         │  ← 分配内存函数
    // │      n * sizeof(int)              │  ← n 个 int 的总字节数
    // │    );                              │
    // │                                   │
    // │  sizeof(int) = 4（通常）          │
    // │  n * 4 = 需要分配的字节数          │
    // │  malloc 返回 void*，所以强制转 int*│
    // └───────────────────────────────────┘
    int *arr = (int*)malloc(n * sizeof(int));

    // 步骤 3：检查分配是否成功（非常重要！）
    if (arr == NULL) {
        printf("内存分配失败！可能请求了太多内存。\n");
        return 1;              // 返回非 0 表示程序异常退出
    }

    // 步骤 4：像普通数组一样使用
    printf("请输入 %d 个数字:\n", n);
    for (int i = 0; i < n; i++) {
        printf("arr[%d] = ", i);
        scanf("%d", &arr[i]);
    }

    // 步骤 5：打印并求和
    printf("\n你输入的数字是: ");
    int sum = 0;
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
        sum += arr[i];
    }
    printf("\n总和 = %d\n", sum);

    // 步骤 6：释放内存！忘掉这行 = 内存泄漏
    free(arr);
    // arr 现在成了"野指针"——指向已释放的内存，不要再用它
    // 好习惯：释放后把指针设为 NULL
    arr = NULL;

    return 0;
}

/* 运行示例：
你想输入几个数字？5
请输入 5 个数字:
arr[0] = 10
arr[1] = 20
arr[2] = 30
arr[3] = 40
arr[4] = 50

你输入的数字是: 10 20 30 40 50
总和 = 150
*/
```

**malloc 分配的内存长什么样？**

```
调用 malloc(n * sizeof(int)) 后，堆上出现一段连续内存：

堆 (Heap)
┌────┬────┬────┬────┬────┬──────────────┐
│ ?  │ ?  │ ?  │ ?  │ ?  │ ... 其他数据   │
└────┴────┴────┴────┴────┴──────────────┘
  ↑                        ↑
  arr 指向这里             共 n×sizeof(int) 字节
  (内容是随机值！)

调用 free(arr) 后：
系统把这段内存标记为"可用"，arr 不再拥有它
```

---

## 示例 2：calloc —— 自动清零的 malloc

`calloc` 和 `malloc` 的区别只有两点：
1. 参数格式不同：`calloc(元素个数, 每个元素的大小)`
2. **calloc 会把分配的内存全部初始化为 0**——malloc 不会

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n = 5;

    // malloc 版本：内存里有垃圾值
    int *m = (int*)malloc(n * sizeof(int));
    printf("=== malloc 分配后的内容（垃圾值！）===\n");
    for (int i = 0; i < n; i++) {
        printf("m[%d] = %d\n", i, m[i]);
    }
    free(m);

    printf("\n");

    // calloc 版本：全部初始化为 0
    int *c = (int*)calloc(n, sizeof(int));
    printf("=== calloc 分配后的内容（全是 0）===\n");
    for (int i = 0; i < n; i++) {
        printf("c[%d] = %d\n", i, c[i]);
    }
    free(c);

    return 0;
}

/* 可能的输出（malloc 的值每次运行都不同）：
=== malloc 分配后的内容（垃圾值！）===
m[0] = -842150451
m[1] = -842150451
m[2] = -33686019
m[3] = 0
m[4] = 12738361

=== calloc 分配后的内容（全是 0）===
c[0] = 0
c[1] = 0
c[2] = 0
c[3] = 0
c[4] = 0
*/
```

**什么时候用 calloc？**
- 分配数组后需要从 0 开始运算（计数器、累加器等）
- 创建结构体数组，希望所有字段默认为 0
- 防止使用到未初始化的垃圾值

---

## 示例 3：realloc —— 调整已分配的内存

想象你租的一居室不够住了。你有两个选择：
1. 重新找一套两居室，把所有家具搬过去（malloc + 复制 + free）——麻烦
2. 打电话给房东："能不能把隔壁空出来的房间也租给我？"（realloc）——方便

`realloc` 就是方案 2。它尝试在原内存块后面"伸长"，如果后面没空间了，就帮你找新地方、自动搬家、归还旧址。

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    // 初始分配：10 个 int
    int capacity = 10;
    int *arr = (int*)malloc(capacity * sizeof(int));

    if (arr == NULL) {
        printf("初始分配失败！\n");
        return 1;
    }

    // 假装我们填入了 10 个数据
    for (int i = 0; i < capacity; i++) {
        arr[i] = i * 10;      // 0, 10, 20, ..., 90
    }

    printf("初始容量: %d\n", capacity);
    for (int i = 0; i < capacity; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n\n");

    // 用户说："不够！我需要 20 个！"
    int new_capacity = 20;

    // ⚠️ 关键：realloc 可能失败返回 NULL
    // 所以不要直接 arr = realloc(arr, ...)
    // 而应该用临时变量！
    int *temp = (int*)realloc(arr, new_capacity * sizeof(int));
    if (temp == NULL) {
        printf("内存扩容失败！\n");
        free(arr);            // 释放原来的内存
        return 1;
    }
    arr = temp;               // 安全：只有在成功时才更新 arr
    capacity = new_capacity;

    // 新扩展的部分可能是垃圾值，手动初始化
    for (int i = 10; i < capacity; i++) {
        arr[i] = i * 10;      // 100, 110, ..., 190
    }

    printf("扩容后容量: %d\n", capacity);
    for (int i = 0; i < capacity; i++) {
        printf("%d ", arr[i]);
    }
    printf("\n");

    free(arr);
    return 0;
}
```

**realloc 的行为图解：**

```
情况 A：原内存后面有空间（原地扩容）
  原内存：[0][1][2][3][4] 空闲 空闲 空闲
  realloc → [0][1][2][3][4][5][6][7][8][9]
  返回的地址和原来一样！

情况 B：原内存后面没空间（搬家）
  原内存：[0][1][2][3][4] 别人在用 别人在用
  realloc → 在别处开辟新空间 [0][1][2][3][4][5][6][7][8][9]
  自动复制旧数据，释放旧地址，返回新地址
```

---

## 示例 4：动态二维数组

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int rows = 3, cols = 4;

    // 第一步：分配"行指针数组"（每一行是一个 int*）
    // matrix 是一个二级指针：int** = 指向 int* 的指针
    int **matrix = (int**)malloc(rows * sizeof(int*));
    if (matrix == NULL) {
        printf("分配行指针失败！\n");
        return 1;
    }

    // 第二步：为每一行分配"列数组"
    for (int i = 0; i < rows; i++) {
        matrix[i] = (int*)malloc(cols * sizeof(int));
        if (matrix[i] == NULL) {
            printf("第 %d 行分配失败！\n", i);
            // 释放之前已分配的行
            for (int j = 0; j < i; j++) free(matrix[j]);
            free(matrix);
            return 1;
        }
    }

    // 第三步：像普通二维数组一样使用
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            matrix[i][j] = i * cols + j + 1;
        }
    }

    // 打印
    printf("动态分配的 %d×%d 矩阵:\n", rows, cols);
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            printf("%2d ", matrix[i][j]);
        }
        printf("\n");
    }

    // 第四步：释放（顺序和分配相反！）
    // 先释放每一行……
    for (int i = 0; i < rows; i++) {
        free(matrix[i]);
    }
    // 再释放行指针数组
    free(matrix);

    return 0;
}

/* 输出：
动态分配的 3×4 矩阵:
 1  2  3  4
 5  6  7  8
 9 10 11 12
*/
```

**动态二维数组的内存结构：**

```
matrix (int**) → [ptr0][ptr1][ptr2]  ← 行指针数组
                   │     │     │
                   ▼     ▼     ▼
ptr0 (int*) →   [1][2][3][4]       ← 第 0 行
ptr1 (int*) →   [5][6][7][8]       ← 第 1 行
ptr2 (int*) →   [9][10][11][12]    ← 第 2 行

注意：每一行在内存中不一定连续！这跟静态的 matrix[3][4] 不同。
```

---

## 示例 5：动态字符串

普通字符数组长度固定，动态分配让你按需处理任意长度的字符串。

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // 方式 1：已知长度，分配恰好够用的大小
    char *greeting = (char*)malloc(20 * sizeof(char));
    if (greeting == NULL) return 1;

    strcpy(greeting, "Hello, C!");
    printf("问候语: %s (长度: %zu)\n", greeting, strlen(greeting));
    free(greeting);

    // 方式 2：为 string.h 的函数分配
    const char *source = "The quick brown fox jumps over the lazy dog";
    // 分配长度 = 源字符串长度 + 1（留给 '\0'）
    char *copy = (char*)malloc((strlen(source) + 1) * sizeof(char));
    if (copy == NULL) return 1;

    strcpy(copy, source);
    printf("原字符串: %s\n", source);
    printf("复  制  : %s\n", copy);
    printf("字符串长度: %zu 字符\n", strlen(copy));
    free(copy);

    return 0;
}
```

---

## 常见错误诊所

### 错误 1：忘记 free（内存泄漏）

```c
// ❌ 内存泄漏：每次循环分配内存但从未释放
void leaky_function() {
    for (int i = 0; i < 1000; i++) {
        int *data = (int*)malloc(1000 * sizeof(int));
        // 使用 data...
        // 忘记 free(data)！每次循环泄漏约 4KB
        // 1000 次 × 4KB = 约 4MB 内存永远丢失
    }
}

// ✅ 正确：配对使用 malloc 和 free
void correct_function() {
    for (int i = 0; i < 1000; i++) {
        int *data = (int*)malloc(1000 * sizeof(int));
        if (data == NULL) { /* 处理错误 */ return; }
        // 使用 data...
        free(data);        // 每次用完立即释放
        data = NULL;       // 好习惯：避免误用已释放的指针
    }
}
```

### 错误 2：free 后继续使用（悬空指针 / use-after-free）

```c
// ❌ 危险：free 之后还在用这个指针
int *p = (int*)malloc(sizeof(int));
*p = 42;
free(p);
printf("%d\n", *p);     // 未定义行为！p 指向的内存已经不属于你了
                         // 可能读到垃圾值，可能读到别人的数据，可能崩溃

// ✅ 正确：释放后就别再用了
int *p = (int*)malloc(sizeof(int));
*p = 42;
printf("%d\n", *p);     // 先用完
free(p);                // 再释放
p = NULL;               // 设为 NULL，防止误用
```

### 错误 3：多次 free 同一块内存

```c
// ❌ 危险：对同一块内存 free 两次
int *p = (int*)malloc(sizeof(int));
free(p);
free(p);                 // 未定义行为！第二次 free 时这块内存已经不属于你了

// ✅ 正确：free 后把指针设为 NULL，NULL 可以被安全 free
int *p = (int*)malloc(sizeof(int));
free(p);
p = NULL;
free(p);                 // free(NULL) 是安全的，什么都不做
```

### 错误 4：free 栈变量

```c
// ❌ 严重错误：试图 free 栈上的变量
int main() {
    int x = 10;
    int arr[100];
    free(&x);            // 错误！x 在栈上，不是 malloc 分配的
    free(arr);           // 错误！arr 也在栈上
    // free 只能释放 malloc/calloc/realloc 返回的指针
    return 0;
}

// ✅ 正确：free 只用于堆内存
int main() {
    int *p = (int*)malloc(sizeof(int));  // 堆上分配
    *p = 10;
    free(p);                              // 正确释放
    return 0;
}
```

### 错误 5：不检查 malloc 返回值

```c
// ❌ 危险：假设 malloc 一定成功
int *big = (int*)malloc(1000000000000);  // 请求了不可能的大内存
big[0] = 42;     // 如果 malloc 返回 NULL，这里直接崩溃！

// ✅ 正确：总是检查返回值
int *big = (int*)malloc(1000000000000);
if (big == NULL) {
    printf("内存分配失败！程序终止。\n");
    return 1;
}
big[0] = 42;
// 安全使用...
free(big);
```

---

## 内存管理黄金法则总结

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ① 每次 malloc / calloc / realloc 必须配对 free     │
│                                                     │
│   ② 分配后立即检查是否为 NULL                          │
│                                                     │
│   ③ free 后立即把指针设为 NULL                        │
│                                                     │
│   ④ realloc 用临时变量接收结果，成功再赋值             │
│                                                     │
│   ⑤ 只 free 堆上分配的内存，别 free 栈变量             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 实践建议

1. **养成"配对"思维**：写完 `malloc` 立刻就写对应的 `free`（哪怕 `free` 在很后面）
2. **小内存也要检查 NULL**：不要因为"只申请了 100 字节"就省略检查
3. **用工具检测泄漏**：学习使用 Valgrind（Linux）或 Dr. Memory（Windows）检查内存泄漏
4. **画内存图**：调试时把指针的指向关系画出来，很多问题一目了然
5. **先释放子资源，再释放父资源**：比如二维数组先 `free(matrix[i])` 再 `free(matrix)`

---

## 小测试：找出下面代码中的 3 个错误

```c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *p = malloc(100);
    *p = 42;
    printf("%d\n", *p);

    int *q = malloc(100000000000000);
    *q = 99;

    free(p);
    printf("%d\n", *p);

    free(p);
    return 0;
}
```

（答案见文末）

---

## 要点速查

| 知识点 | 一句话 |
|--------|--------|
| malloc | 向堆申请指定字节数的内存，不初始化（垃圾值） |
| calloc | 向堆申请内存并全部初始化为 0 |
| realloc | 调整已分配内存的大小，可能原地扩容也可能"搬家" |
| free | 归还之前分配的内存，必须有借有还 |
| NULL 检查 | 每次 malloc/calloc/realloc 后检查返回值 |
| 悬空指针 | free 后的指针还指向已释放的内存，设为 NULL 防止误用 |
| 内存泄漏 | 分配了但忘了释放，内存永远丢失 |

> **最重要的一句话**：记住 `malloc` 和 `free` 是情侣——看到 `malloc`，就要在代码中找它的 `free`。拆散它们是会遭报应的（内存泄漏）。

（小测试答案：
1. 第一处错误：`malloc(100)` 没做类型转换也没检查 NULL
2. 第二处错误：`malloc(100000000000000)` 极可能返回 NULL，但没有检查就解引用 `*q`
3. 第三处错误：`free(p)` 后又 `printf(*p)` —— 使用已释放内存
4. 第四处错误：最后又 `free(p)` 一次 —— 重复 free
实际上有 4 个错误，你找到了几个？）
