---
category: "C语言教程"
title: "数组基础 — 批量管理数据"
description: "C语言学习教程"
slug: "arrays-intro"
level: 4
order: 1
tags: ["数组", "索引", "遍历", "初始化"]
---

# 数组基础 — 批量管理数据

## 热身比喻：宿舍储物柜

想象你来到学生宿舍，走廊里有一整排储物柜。每个柜子大小相同、紧紧相邻、并且从 0 开始编号。你想存东西，只需要告诉管理员"我要用 3 号柜子"，马上就能打开。

```text
┌─────┬─────┬─────┬─────┬─────┐
│ 柜0 │ 柜1 │ 柜2 │ 柜3 │ 柜4 │
└─────┴─────┴─────┴─────┴─────┘
```

C 语言的数组就是这样一个**连续编号的储物柜系统**：所有元素类型一致、肩并肩存放在内存里、通过编号（索引）立即定位。数组是你在 C 语言中遇到的第一个真正"结构化"的数据容器。

---

## 内存中的数组长什么样？

数组在内存中**连续存储**，元素之间没有间隙。以下面这个数组为例：

```c
int arr[5] = {10, 20, 30, 40, 50};
```

假设 `int` 占 4 字节，`arr[0]` 的地址是 `0x1000`：

```text
地址      内容
0x1000   ┌──────────┐
         │    10    │  ← arr[0]
0x1004   ├──────────┤
         │    20    │  ← arr[1]
0x1008   ├──────────┤
         │    30    │  ← arr[2]
0x100C   ├──────────┤
         │    40    │  ← arr[3]
0x1010   ├──────────┤
         │    50    │  ← arr[4]
         └──────────┘
```

每个元素紧挨着前一个，`arr[i]` 的地址 = 起始地址 + i × sizeof(元素类型)。正因为这个特性，数组才能做到 **O(1) 随机访问**。

---

## 代码示例 1：声明与初始化的四种姿势

```c
#include <stdio.h>

int main() {
    // 姿势一：先声明，后逐个赋值
    int score[5];
    score[0] = 85;
    score[1] = 92;
    score[2] = 78;
    score[3] = 95;
    score[4] = 88;

    // 姿势二：声明的同时全部初始化
    int nums[5] = {10, 20, 30, 40, 50};

    // 姿势三：只给一部分，剩下的自动填 0
    int partial[5] = {1, 2};   // → {1, 2, 0, 0, 0}

    // 姿势四：让编译器帮你数大小
    int arr[] = {1, 2, 3, 4, 5, 6};  // 自动推断大小为 6
    int len = sizeof(arr) / sizeof(arr[0]);  // len = 6

    printf("arr 有 %d 个元素\n", len);
    return 0;
}
```

**关键点**：`partial[5] = {1, 2}` 这种写法只有在声明时才能用。一旦数组已经存在，就不能用 `arr = {1,2,3}` 这种语法了。

---

## 代码示例 2：遍历——用循环把数组跑一遍

```c
#include <stdio.h>

int main() {
    int scores[] = {85, 92, 78, 95, 88};
    int n = sizeof(scores) / sizeof(scores[0]);  // 通用求长度公式

    // 打印所有成绩
    printf("全部成绩：\n");
    for (int i = 0; i < n; i++) {
        printf("  第 %d 位同学：%d 分\n", i + 1, scores[i]);
    }

    // 倒序打印
    printf("倒序查看：\n");
    for (int i = n - 1; i >= 0; i--) {
        printf("  scores[%d] = %d\n", i, scores[i]);
    }

    return 0;
}
```

**请记住**：`sizeof(arr) / sizeof(arr[0])` 是求数组元素个数的标准写法。注意这只在数组声明所在的函数里有效——一旦数组退化为指针（传给函数），这个公式就失效了。

---

## 代码示例 3：求和、求最大、查找——统计三连

```c
#include <stdio.h>

int main() {
    int data[] = {45, 72, 33, 89, 16, 58, 91, 24};
    int n = sizeof(data) / sizeof(data[0]);

    // ---- 求和 ----
    int sum = 0;
    for (int i = 0; i < n; i++)
        sum += data[i];
    printf("总和：%d，平均值：%.2f\n", sum, (float)sum / n);

    // ---- 找最大值 ----
    int max_val = data[0];        // 先假设第一个最大
    int max_pos = 0;
    for (int i = 1; i < n; i++) {
        if (data[i] > max_val) {
            max_val = data[i];
            max_pos = i;
        }
    }
    printf("最大值：%d，位于索引 %d\n", max_val, max_pos);

    // ---- 查找目标 ----
    int target = 58;
    int found = -1;               // -1 表示"没找到"
    for (int i = 0; i < n; i++) {
        if (data[i] == target) {
            found = i;
            break;                // 找到了就停
        }
    }
    if (found != -1)
        printf("找到 %d，位置在 data[%d]\n", target, found);
    else
        printf("%d 不在数组中\n", target);

    return 0;
}
```

> 思考：把 `found` 初始化为 `-1` 是一个常用技巧——如果遍历后仍为 `-1`，说明没找到。

---

## 代码示例 4：反转数组——原地交换

```c
#include <stdio.h>

void reverse(int arr[], int n) {
    // 首尾对称交换，只需要做 n/2 次
    for (int i = 0; i < n / 2; i++) {
        int temp = arr[i];
        arr[i] = arr[n - 1 - i];
        arr[n - 1 - i] = temp;
    }
}

void print_array(int arr[], int n) {
    for (int i = 0; i < n; i++)
        printf("%d ", arr[i]);
    printf("\n");
}

int main() {
    int a[] = {1, 2, 3, 4, 5};
    int n = sizeof(a) / sizeof(a[0]);

    printf("反转前：");  print_array(a, n);
    reverse(a, n);
    printf("反转后：");  print_array(a, n);

    return 0;
}
```

```text
反转前：1 2 3 4 5
反转后：5 4 3 2 1
```

交换过程可视化（`n=5`）：

```text
i=0: swap(arr[0]↔arr[4])  1↔5  → {5, 2, 3, 4, 1}
i=1: swap(arr[1]↔arr[3])  2↔4  → {5, 4, 3, 1, 5}? 不对——
      等等，arr[3] 在上一轮没被改过，所以 4↔1 → {5, 4, 3, 2, 1}
i=2: i < 5/2=2 不成立，停止 ✓
最终：{5, 4, 3, 2, 1}
```

---

## 代码示例 5：冒泡排序——数组排序入门

```c
#include <stdio.h>

void bubble_sort(int arr[], int n) {
    // 外层：控制轮次，n 个元素最多需要 n-1 轮
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;  // 优化：如果一轮都没交换，说明已经排好

        // 内层：相邻两两比较，"冒泡"把大的往后推
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                // 交换 arr[j] 和 arr[j+1]
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
                swapped = 1;
            }
        }

        if (!swapped) break;  // 提前结束
    }
}

int main() {
    int nums[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(nums) / sizeof(nums[0]);

    bubble_sort(nums, n);

    for (int i = 0; i < n; i++)
        printf("%d ", nums[i]);
    printf("\n");  // 11 12 22 25 34 64 90

    return 0;
}
```

**为什么内层是 `n-1-i`？** 每一轮结束后，最大的元素已经"沉底"到最后，所以下一轮就不用再检查它。

---

## 代码示例 6：把数组传给函数——数组退化为指针

```c
#include <stdio.h>

// 函数参数 int arr[] 实际上等价于 int *arr
// 所以必须额外传一个 n 告诉函数数组有多长
void double_elements(int arr[], int n) {
    for (int i = 0; i < n; i++)
        arr[i] *= 2;  // 直接修改原数组！
}

int main() {
    int nums[] = {1, 2, 3, 4, 5};
    int n = sizeof(nums) / sizeof(nums[0]);

    double_elements(nums, n);  // 传入数组名即可

    for (int i = 0; i < n; i++)
        printf("%d ", nums[i]);  // 2 4 6 8 10 ← 原数组被改了！
    printf("\n");

    return 0;
}
```

**重要发现**：把数组传给函数时，函数内部对数组的修改会影响外面的原数组。因为传的是数组的地址（指针），不是拷贝。这和 `int`、`float` 等普通变量完全不同。

---

## 常见错误

### 错误 1：越界访问

```text
❌ 错误写法                              ✅ 正确写法
int arr[5] = {1,2,3,4,5};               int arr[5] = {1,2,3,4,5};
printf("%d", arr[5]);                   printf("%d", arr[4]);
// arr[5] 是第 6 个元素，不存在！          // 合法索引范围：0 ~ 4
// 但 C 不会报错，会读到垃圾值或崩溃
```

### 错误 2：用 sizeof 在函数里求数组长度

```text
❌ 错误写法                              ✅ 正确写法
void func(int arr[]) {                  void func(int arr[], int n) {
    int n = sizeof(arr)/sizeof(arr[0]);     for (int i = 0; i < n; i++)
    // arr 已退化为指针，sizeof(arr)            // 用传入的 n
    // 只有 8 字节（指针大小），算出来是错的！       printf("%d ", arr[i]);
}                                       }
```

### 错误 3：整体赋值

```text
❌ 错误写法                              ✅ 正确写法
int a[5] = {1,2,3,4,5};                int a[5] = {1,2,3,4,5};
int b[5];                              int b[5];
b = a;  // 编译错误！数组不能整体赋值     for (int i = 0; i < 5; i++)
                                           b[i] = a[i];  // 逐个拷贝
```

### 错误 4：用 == 比较两个数组

```text
❌ 错误写法                              ✅ 正确写法
if (arr1 == arr2)  // 比较的是地址！     int same = 1;
    printf("相同");                      for (int i = 0; i < n; i++)
                                        if (arr1[i] != arr2[i]) {
                                            same = 0; break;
                                        }
```

### 错误 5：从 1 开始编号

```text
❌ 错误写法                              ✅ 正确写法
int arr[5];
for (int i = 1; i <= 5; i++)           for (int i = 0; i < 5; i++)
    arr[i] = i;  // arr[5] 越界！          arr[i] = i;
```

---

## 练习建议

1. **起步练习**：创建一个长度为 10 的数组，从键盘读入 10 个整数，计算平均值并找出大于平均值的元素。

2. **提高练习**：实现一个函数 `int remove_duplicates(int arr[], int n)`，移除排序后数组中的重复元素，返回新长度（在原数组上操作）。

3. **思考题**：如果数组长度是 100 万，为什么 `sizeof(arr)/sizeof(arr[0])` 依然能正确计算？这个公式的计算发生在什么时候（编译期还是运行期）？

4. **调试技巧**：当你发现数组某个位置的值不对劲时，在循环里加上 `printf("arr[%d] = %d\n", i, arr[i]);` 打印每一步的值。

---

## 要点速查

| 知识点 | 描述 |
|--------|------|
| 声明语法 | `类型 名字[大小]` |
| 索引规则 | 从 0 开始，到 `大小-1` 结束 |
| 求长度 | `sizeof(arr) / sizeof(arr[0])`（仅在同一函数内有效） |
| 遍历 | `for (int i = 0; i < n; i++)` |
| 传参 | 数组名即指针，须同时传长度 |
| 越界 | C 不检查，需程序员自己保证 |
| 初始化 | `{0}` 可全置零，未指定的自动补零 |
| 内存布局 | 连续存储，支持 O(1) 随机访问 |
