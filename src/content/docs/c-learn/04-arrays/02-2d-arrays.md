---
category: "C语言教程"
title: "二维数组与矩阵"
description: "C语言学习教程"
slug: "2d-arrays"
level: 4
order: 2
tags: ["二维数组", "矩阵", "多维数组"]
---

# 二维数组与矩阵

## 热身比喻：电影院座位

一维数组像一列储物柜，而二维数组像**电影院的座位排布**。每排有若干个座位，你买票时看到"5 排 3 号"——"排"是行，"号"是列。要找某个座位，得同时知道它在第几排、第几号。

```text
舞台方向 →
          第1列  第2列  第3列  第4列
第0排 ┌───┬───┬───┬───┐
      │ A │ B │ C │ D │
第1排 ├───┼───┼───┼───┤
      │ E │ F │ G │ H │
第2排 ├───┼───┼───┼───┤
      │ I │ J │ K │ L │
      └───┴───┴───┴───┘
```

想要找到座位 "G"？`第1排[行] + 第2列[列]` → `matrix[1][2]`。

---

## 内存中的二维数组：按行排列的长条

虽然我们把它画成表格，但在真实的内存里，二维数组的所有元素仍然是**一维线性排列**的。C 语言采用**行优先（Row-major）**存储方式——先完整存完第 0 行，再存第 1 行，以此类推。

```c
int matrix[3][4] = {
    {1, 2, 3, 4},
    {5, 6, 7, 8},
    {9,10,11,12}
};
```

在内存中的真实布局：

```text
低地址──→──→──→──→──→──→──→──→──→──→──高地址
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │11 │12 │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
 第0行 (4个元素)   第1行 (4个元素)   第2行 (4个元素)
```

计算 `matrix[i][j]` 的位置：**起始地址 + (i × 列数 + j) × sizeof(元素类型)**

比如 `matrix[1][2]`：`起始 + (1×4 + 2) × 4 = 起始 + 24 字节` → 值 7。

**这就是为什么遍历时要外层走行、内层走列**——这样访问顺序和内存排列顺序一致，可以充分利用 CPU 缓存。

---

## 代码示例 1：声明、初始化、访问

```c
#include <stdio.h>

int main() {
    // 方式一：完整初始化（推荐，最清晰）
    int grid[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9,10,11,12}
    };

    // 方式二：平铺初始化（和上面等价，但不直观）
    int grid2[3][4] = {1,2,3,4, 5,6,7,8, 9,10,11,12};

    // 方式三：部分初始化——没给的值自动补 0
    int sparse[3][4] = {
        {1, 2},      // → {1, 2, 0, 0}
        {5},         // → {5, 0, 0, 0}
        {}           // → {0, 0, 0, 0}
    };

    // 单独访问某个元素
    printf("grid[0][2] = %d\n", grid[0][2]);  // 3
    printf("grid[2][3] = %d\n", grid[2][3]);  // 12

    // 修改某个元素
    grid[1][1] = 99;
    printf("修改后 grid[1][1] = %d\n", grid[1][1]);  // 99

    return 0;
}
```

---

## 代码示例 2：双重循环遍历——打印矩阵

```c
#include <stdio.h>

#define ROWS 3
#define COLS 4

int main() {
    int matrix[ROWS][COLS] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9,10,11,12}
    };

    // 逐行逐列打印
    printf("矩阵内容：\n");
    for (int i = 0; i < ROWS; i++) {      // 外层控制行
        for (int j = 0; j < COLS; j++) {  // 内层控制列
            printf("%3d ", matrix[i][j]);  // %3d 对齐输出
        }
        printf("\n");                      // 每行结束换行
    }

    return 0;
}
```

输出：
```text
矩阵内容：
  1   2   3   4
  5   6   7   8
  9  10  11  12
```

> **思考**：如果把内外循环交换（外层 `j`，内层 `i`），程序还能正确运行吗？虽然能运行，但因为访问顺序和内存布局不一致，**性能会差很多**。

---

## 代码示例 3：矩阵加法——两个矩阵对应位置相加

```c
#include <stdio.h>

#define N 3  // 方阵的边长

void matrix_add(int a[N][N], int b[N][N], int result[N][N]) {
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            result[i][j] = a[i][j] + b[i][j];
        }
    }
}

void print_matrix(int mat[N][N]) {
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            printf("%3d ", mat[i][j]);
        }
        printf("\n");
    }
}

int main() {
    int A[N][N] = {{1,2,3}, {4,5,6}, {7,8,9}};
    int B[N][N] = {{9,8,7}, {6,5,4}, {3,2,1}};
    int C[N][N] = {0};  // 全初始化为 0

    matrix_add(A, B, C);

    printf("A + B =\n");
    print_matrix(C);

    return 0;
}
```

输出：
```text
A + B =
 10  10  10
 10  10  10
 10  10  10
```

---

## 代码示例 4：求每行总和与每列总和

```c
#include <stdio.h>

#define ROWS 3
#define COLS 4

int main() {
    int scores[ROWS][COLS] = {
        {85, 92, 78, 90},  // 学生0 的各科成绩
        {88, 76, 95, 82},  // 学生1 的各科成绩
        {70, 89, 91, 88}   // 学生2 的各科成绩
    };

    // -- 求每个学生的总分（行求和）--
    printf("每个学生的总分：\n");
    for (int i = 0; i < ROWS; i++) {
        int row_sum = 0;
        for (int j = 0; j < COLS; j++) {
            row_sum += scores[i][j];
        }
        printf("  学生 %d：%d 分\n", i + 1, row_sum);
    }

    // -- 求每门课的平均分（列求和）--
    printf("每门课的平均分：\n");
    for (int j = 0; j < COLS; j++) {
        int col_sum = 0;
        for (int i = 0; i < ROWS; i++) {
            col_sum += scores[i][j];
        }
        printf("  科目 %d：%.1f 分\n", j + 1, (float)col_sum / ROWS);
    }

    return 0;
}
```

输出：
```text
每个学生的总分：
  学生 1：345 分
  学生 2：341 分
  学生 3：338 分
每门课的平均分：
  科目 1：81.0 分
  科目 2：85.7 分
  科目 3：88.0 分
  科目 4：86.7 分
```

---

## 代码示例 5：方阵对角线操作

```c
#include <stdio.h>

#define N 4

int main() {
    int mat[N][N] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9,10,11,12},
        {13,14,15,16}
    };

    // -- 主对角线（左上→右下）--
    printf("主对角线：");
    int sum_main = 0;
    for (int i = 0; i < N; i++) {
        printf("%d ", mat[i][i]);
        sum_main += mat[i][i];
    }
    printf("  和 = %d\n", sum_main);

    // -- 副对角线（右上→左下）--
    printf("副对角线：");
    int sum_anti = 0;
    for (int i = 0; i < N; i++) {
        printf("%d ", mat[i][N - 1 - i]);
        sum_anti += mat[i][N - 1 - i];
    }
    printf("  和 = %d\n", sum_anti);

    return 0;
}
```

输出：
```text
主对角线：1 6 11 16   和 = 34
副对角线：4 7 10 13   和 = 34
```

图解：
```text
主对角线 mat[i][i]        副对角线 mat[i][N-1-i]
┌───────────────┐         ┌───────────────┐
│[1] 2   3   4  │         │ 1   2   3  [4]│
│ 5  [6]  7   8  │         │ 5   6  [7]  8 │
│ 9  10 [11] 12  │         │ 9 [10] 11  12 │
│13  14  15 [16] │         │[13] 14  15  16│
└───────────────┘         └───────────────┘
```

---

## 代码示例 6：转置矩阵——行列互换

```c
#include <stdio.h>

#define ROWS 2
#define COLS 3

void transpose(int original[ROWS][COLS], int result[COLS][ROWS]) {
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            result[j][i] = original[i][j];
        }
    }
}

void print_matrix_2x3(int mat[ROWS][COLS]) {
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++)
            printf("%3d ", mat[i][j]);
        printf("\n");
    }
}

void print_matrix_3x2(int mat[COLS][ROWS]) {
    for (int i = 0; i < COLS; i++) {
        for (int j = 0; j < ROWS; j++)
            printf("%3d ", mat[i][j]);
        printf("\n");
    }
}

int main() {
    int original[ROWS][COLS] = {
        {1, 2, 3},
        {4, 5, 6}
    };
    int transposed[COLS][ROWS] = {0};  // 注意行列数互换！

    transpose(original, transposed);

    printf("原矩阵 (2×3)：\n");
    print_matrix_2x3(original);
    printf("转置后 (3×2)：\n");
    print_matrix_3x2(transposed);

    return 0;
}
```

输出：
```text
原矩阵 (2×3)：
  1   2   3
  4   5   6
转置后 (3×2)：
  1   4
  2   5
  3   6
```

---

## 常见错误

### 错误 1：大小声明不完整

```text
❌ 错误写法                                      ✅ 正确写法
int matrix[][] = {{1,2},{3,4}};                 int matrix[2][2] = {{1,2},{3,4}};
// C 只允许省略第一维（行），                       // 必须指定列数，编译器才能
// 列数必须明确声明                                 计算每行有多少个元素
```

### 错误 2：遍历时内外层搞反导致低效访问

```text
❌ 错误写法（跳跃访问，缓存不友好）              ✅ 正确写法（顺序访问，缓存友好）
for (int j = 0; j < COLS; j++)                 for (int i = 0; i < ROWS; i++)
    for (int i = 0; i < ROWS; i++)                 for (int j = 0; j < COLS; j++)
        printf("%d ", mat[i][j]);                      printf("%d ", mat[i][j]);
// 按列访问，每次跳跃一整行                         // 按行访问，和内存布局顺序一致
```

### 错误 3：把二维数组当作指针的指针

```text
❌ 错误想法                                    ✅ 正确理解
int **p = matrix;  // 二维数组名不是二级指针！  // 二维数组名是"一维数组的指针"
// 编译警告或错误                                // int (*p)[COLS] = matrix;
// 堆上的二维数组(动态分配)才用 int**
```

### 错误 4：传参时没有指定列数

```text
❌ 错误写法                                      ✅ 正确写法
void func(int mat[][]) { }                      void func(int mat[][4]) { }
// 编译错误：列数必须指定                         // 或 void func(int mat[3][4])
// 或 void func(int (*mat)[4], int rows)
```

---

## 练习建议

1. **热身**：创建一个 3×3 的幻方矩阵，验证每行、每列、每条对角线的和是否都相等。

2. **进阶**：实现矩阵乘法 `C = A × B`。`A` 是 `m×n`，`B` 是 `n×p`，结果 `C` 是 `m×p`，且 `C[i][j] = sum(A[i][k] × B[k][j]) for k in 0..n-1`。

3. **趣味**：用 `*` 和空格打印一个 5×5 的"X"形图案（对角线为 `*`，其余为空格）。

4. **实用**：做一个简单的井字棋棋盘，用二维数组表示，两个玩家轮流在空位置落子，每次落子后打印当前棋盘状态。

5. **思考题**：三维数组在内存中的排列顺序是怎样的？如果 `int cube[2][3][4]`，`cube[0][1][2]` 和 `cube[1][0][2]` 谁在更低的地址？

---

## 要点速查

| 知识点 | 描述 |
|--------|------|
| 声明语法 | `类型 名字[行数][列数]` |
| 访问元素 | `array[i][j]` |
| 列数必须指定 | 声明和传参时列数都不能省略 |
| 内存布局 | 行优先存储，一整行存完再存下一行 |
| 遍历顺序 | 外层 `i` 行、内层 `j` 列，匹配内存顺序 |
| 初始化 | 可以分行 `{{1,2},{3,4}}` 也可以平铺 `{1,2,3,4}` |
| 未指定值 | 自动补零 |
| 数组名 | 不是二级指针！是指向一维数组的指针 `int (*)[N]` |
