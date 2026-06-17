---
category: "C语言教程"
title: "查找算法 — 二分查找与更多"
description: "C语言学习教程"
slug: "searching-algorithms"
level: 10
order: 2
tags: ["二分查找", "线性查找", "插值查找", "哈希查找", "复杂度"]
---

# 查找算法 — 二分查找与更多

查找（搜索）是计算机程序中最频繁的操作之一。从"在通讯录里找一个名字"到"在数据库中检索一条记录"，本质上都是查找问题。

## 查找算法的两个世界

```
┌──────────────────────────────────────────────────────────┐
│                    查找算法分类                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  无序数据世界                    有序数据世界              │
│  ┌─────────────┐               ┌─────────────┐           │
│  │ 线性查找     │               │ 二分查找     │           │
│  │ O(n)        │               │ O(log n)    │           │
│  │ 不需要预处理 │               │ 需要先排序   │           │
│  └─────────────┘               ├─────────────┤           │
│                                │ 插值查找     │           │
│                                │ O(log log n)│  (均匀分布)│
│                                ├─────────────┤           │
│                                │ 指数查找     │           │
│                                │ O(log n)    │  (无界搜索)│
│                                └─────────────┘           │
│                                                          │
│  特殊结构世界                                               │
│  ┌─────────────┐                                         │
│  │ 哈希查找     │ ← 需要构建哈希表                          │
│  │ O(1) 平均   │   空间换时间                              │
│  └─────────────┘                                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 算法一：线性查找（Linear Search）

最简单的查找 —— 从头到尾，一个一个比较。

### 过程可视化

```
目标: 找到 42

数组: [15, 8, 23, 42, 7, 19, 31]

步骤:
│
├── i=0: arr[0]=15  15==42? 否 → 继续
│           ↑
├── i=1: arr[1]=8   8==42?  否 → 继续
│               ↑
├── i=2: arr[2]=23  23==42? 否 → 继续
│                    ↑
├── i=3: arr[3]=42  42==42? 是！→ 找到，返回索引 3
│                         ↑
└── 找到了！

最坏情况（目标不存在）：
目标: 99
遍历: [15, 8, 23, 42, 7, 19, 31]
       →  →  →  →  →  →  →
        比较了全部 7 个元素 → 返回 -1（未找到）
```

### 实现

```c
// 基础版：找到即返回
int linear_search(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            return i;  // 找到，返回索引
        }
    }
    return -1;  // 未找到
}

// 返回指针版：更 C 风格的写法
int* linear_search_ptr(int arr[], int n, int target) {
    for (int *p = arr; p < arr + n; p++) {
        if (*p == target) {
            return p;  // 返回指向目标元素的指针
        }
    }
    return NULL;  // 未找到
}
```

### 哨兵优化版

在数组末尾放置"哨兵"（目标值），省去每次循环中检查 `i < n` 的开销。

```c
// 哨兵优化：将数组容量设为 n+1，在末尾放入 target
// 这样保证一定会找到，然后判断找到的位置是否在有效范围内
int linear_search_sentinel(int arr[], int n, int target) {
    int last = arr[n - 1];   // 保存最后一个元素
    arr[n - 1] = target;     // 放置哨兵（前提：arr 至少有 n+1 的空间）
                               // 或者：arr 有 n 个元素，用 arr[n-1] 做哨兵但需要恢复

    int i = 0;
    while (arr[i] != target) {  // 不需要检查 i < n 了！
        i++;
    }

    arr[n - 1] = last;  // 恢复原值

    if (i < n - 1 || last == target) {
        return i;  // 找到了
    }
    return -1;  // 未找到
}

// 注意：哨兵优化在实际中收益有限，现代编译器已能很好地优化边界检查
// 这里主要展示一种算法思想
```

**适用场景：** 数据量小（n < 100）、无序数据、链表、数据频繁变化无法维护有序性。

---

## 算法二：二分查找（Binary Search）

前提条件：**数组必须已经排序**。核心思想是"每次排除一半"。

### 逐步可视化

```
有序数组: [2, 5, 8, 12, 16, 23, 38, 45, 56, 67, 78, 89]
索引:      0  1  2   3   4   5   6   7   8   9  10  11

目标: 23

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
第1步：整个范围 [0..11]，中间位置 mid = (0+11)/2 = 5
        ┌────────────────────────────────────────┐
        │ 2  5  8 12 16 [23] 38 45 56 67 78 89  │
        │ 0  1  2  3  4  ↑5   6  7  8  9 10 11  │
        └────────────────────────────────────────┘
        arr[5] = 23 = target → 找到了！返回 5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
另一个例子，目标: 8

第1步：范围 [0..11]，mid = 5，arr[5] = 23
        8 < 23 → 目标在左半区 → 更新范围：[0..4]
        ┌──────────────┐
        │ 2  5  8 12 16│ ← 保留左半区
        │ 0  1  2  3  4│   丢弃右半区 [5..11]
        └──────────────┘

第2步：范围 [0..4]，mid = (0+4)/2 = 2，arr[2] = 8
        ┌──────────────┐
        │ 2  5 [8]12 16│
        │ 0  1  ↑2  3  4│
        └──────────────┘
        arr[2] = 8 = target → 找到了！返回 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
失败的例子，目标: 10（不存在）

第1步：范围 [0..11]，mid=5，arr[5]=23
        10 < 23 → 左半区 [0..4]

第2步：范围 [0..4]，mid=2，arr[2]=8
        10 > 8 → 右半区 [3..4]
               ┌──────┐
               │12 16 │
               │ 3  4 │
               └──────┘

第3步：范围 [3..4]，mid=3，arr[3]=12
        10 < 12 → 左半区 [3..2]
        范围变成 [3..2]，left=3 > right=2
        退出循环 → 未找到，返回 -1
```

### 整数溢出的陷阱

```c
// ★ 错误写法（会溢出）：
int mid = (left + right) / 2;
// 如果 left + right > INT_MAX，结果会溢出变成负数

// ★ 正确写法：
int mid = left + (right - left) / 2;  // 防溢出

// 另一种写法（C 编译器通常会自动优化）：
int mid = left + ((right - left) >> 1);  // 右移等同于除以2
```

### 实现

```c
// 标准迭代版二分查找
int binary_search(int arr[], int n, int target) {
    int left = 0;
    int right = n - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;  // 防止溢出

        if (arr[mid] == target) {
            return mid;       // 找到了
        } else if (arr[mid] < target) {
            left = mid + 1;   // 目标在右半区
        } else {
            right = mid - 1;  // 目标在左半区
        }
    }

    return -1;  // 未找到
}

// 递归版（理解分治思想，但通常不如迭代版高效）
int binary_search_recursive(int arr[], int left, int right, int target) {
    if (left > right) {
        return -1;  // 未找到
    }

    int mid = left + (right - left) / 2;

    if (arr[mid] == target) {
        return mid;
    } else if (arr[mid] < target) {
        return binary_search_recursive(arr, mid + 1, right, target);
    } else {
        return binary_search_recursive(arr, left, mid - 1, target);
    }
}
```

### 二分查找的关键变体

实际开发中很少直接找"等于 target 的元素"，更多是找"第一个 >= target"或"第一个 > target"的位置。

```c
// 变体1：lower_bound —— 第一个 >= target 的位置
// 应用场景：在排序数组中插入元素、找区间的起点
int lower_bound(int arr[], int n, int target) {
    int left = 0;
    int right = n;  // ★ 注意：right 初始化为 n，不是 n-1

    while (left < right) {  // ★ 注意：是 < 不是 <=
        int mid = left + (right - left) / 2;

        if (arr[mid] >= target) {
            right = mid;      // 目标可能在左半区（包括 mid）
        } else {
            left = mid + 1;   // 目标一定在右半区
        }
    }

    return left;  // 返回第一个 >= target 的索引（可能等于 n）
}

// 验证 lower_bound：
// arr = [1, 3, 3, 5, 7, 9], target = 3
// lower_bound 返回 1（第一个 3 的位置）
//
// arr = [1, 3, 3, 5, 7, 9], target = 4
// lower_bound 返回 3（第一个 >= 4 的位置，即 5 的位置）

// 变体2：upper_bound —— 第一个 > target 的位置
int upper_bound(int arr[], int n, int target) {
    int left = 0;
    int right = n;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] > target) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }

    return left;
}

// 变体3：统计等于 target 的元素个数
int count_equal(int arr[], int n, int target) {
    int first = lower_bound(arr, n, target);
    if (first == n || arr[first] != target) {
        return 0;  // 不存在 target
    }
    int last = upper_bound(arr, n, target);
    return last - first;
}

// 示例：
// arr = [1, 3, 3, 3, 5, 7], target = 3
// lower_bound = 1, upper_bound = 4
// count = 4 - 1 = 3  ← arr 中有 3 个 "3"
```

### lower_bound 执行过程可视化

```
arr = [1, 3, 3, 5, 7, 9], target = 3

初始: left=0, right=6
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 3 │ 3 │ 5 │ 7 │ 9 │
└───┴───┴───┴───┴───┴───┘
  L                   R

mid=3: arr[3]=5 >= 3 → right = 3
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 3 │ 3 │ 5 │ 7 │ 9 │
└───┴───┴───┴───┴───┴───┘
  L       R

mid=1: arr[1]=3 >= 3 → right = 1
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 3 │ 3 │ 5 │ 7 │ 9 │
└───┴───┴───┴───┴───┴───┘
  L=R

mid=0: arr[0]=1 < 3 → left = 1
┌───┬───┬───┬───┬───┬───┐
│ 1 │ 3 │ 3 │ 5 │ 7 │ 9 │
└───┴───┴───┴───┴───┴───┘
      L=R

left=1, right=1 → 循环结束 → 返回 1
索引 1 是第一个 >= 3 的位置（即第一个 3 的位置）✓
```

**记住 `left < right` 和 `right = n` 这两个关键点**：这是 "左闭右开" 区间 `[left, right)` 的写法，比 "左闭右闭" 更不容易出错。

---

## 算法三：插值查找（Interpolation Search）

当数据**均匀分布**时，插值查找比二分查找更快。

### 思路

二分查找总是取中间位置：`mid = (left + right) / 2`

插值查找根据目标值的"位置比例"来估算：

```
想象一本字典：
  找 "A" 开头 → 翻到前面
  找 "M" 开头 → 翻到中间
  找 "Z" 开头 → 翻到后面

公式：mid = left + (target - arr[left]) * (right - left) / (arr[right] - arr[left])
              ↑─────────────────────────────────────────────────────────────↑
              根据值的比例，估算目标位置
```

### 可视化

```
arr = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
索引:   0   1   2   3   4   5   6   7   8    9

目标: 70

二分查找：mid = (0+9)/2 = 4 → arr[4]=50 → 不是 → 继续...

插值查找：
  pos = 0 + (70-10) * (9-0) / (100-10)
      = 0 + 60 * 9 / 90
      = 0 + 540 / 90
      = 6
  arr[6] = 70 → 一次命中！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
对比：
┌──────────┬────────────────────┬──────────┐
│          │   二分查找           │ 插值查找  │
├──────────┼────────────────────┼──────────┤
│ 均匀分布  │ O(log n)           │ O(log log n)│ 更快！
│ 极端偏差  │ O(log n)           │ O(n)     │ 更慢！
│          │                    │ (退化)    │
└──────────┴────────────────────┴──────────┘
```

### 实现

```c
int interpolation_search(int arr[], int n, int target) {
    int left = 0;
    int right = n - 1;

    while (left <= right && target >= arr[left] && target <= arr[right]) {
        // 防止除以零
        if (arr[left] == arr[right]) {
            if (arr[left] == target) return left;
            else return -1;
        }

        // 插值公式计算估算位置
        int pos = left + ((long long)(target - arr[left]) *
                          (right - left)) / (arr[right] - arr[left]);

        if (arr[pos] == target) {
            return pos;
        } else if (arr[pos] < target) {
            left = pos + 1;
        } else {
            right = pos - 1;
        }
    }

    return -1;
}
```

**适用场景：** 大规模有序数据且分布均匀（如按字母顺序排列的字典、均匀分布的 ID），不适合分布极不均匀的数据。

---

## 算法四：指数查找（Exponential Search）

用于**无界搜索**或数据量未知的场景。先快速确定范围，再利用二分查找。

### 思路

```
1. 从位置 0 开始，步长指数增长：1, 2, 4, 8, 16, ...
2. 找到第一个 > target 的位置，确定了范围 [上一步位置, 当前位置]
3. 在这个范围内二分查找

可视化：
目标: 45

arr: [2, 5, 8, 12, 16, 23, 38, 45, 56, 67, 78, 89, 99, ...]
       0  1  2   3   4   5   6   7   8   9  10  11  12

步骤1: 指数扩展
  i=0: arr[0]=2   < 45 → i = 1
  i=1: arr[1]=5   < 45 → i = 2
  i=2: arr[2]=8   < 45 → i = 4
  i=4: arr[4]=16  < 45 → i = 8
  i=8: arr[8]=56  > 45 → 停止！范围确定为 [4, 8]

步骤2: 在 arr[4..8] 内二分查找 45
  mid = (4+8)/2 = 6 → arr[6]=38 < 45 → left=7
  mid = (7+8)/2 = 7 → arr[7]=45 → 找到了！
```

### 实现

```c
int exponential_search(int arr[], int n, int target) {
    // 先检查第一个元素
    if (arr[0] == target) return 0;

    // 指数扩展，找到范围
    int bound = 1;
    while (bound < n && arr[bound] < target) {
        bound *= 2;  // 每次乘 2
    }

    // 在 [bound/2, min(bound, n-1)] 范围内二分查找
    int left = bound / 2;
    int right = (bound < n) ? bound : (n - 1);

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}
```

**适用场景：** 搜索无界数组、搜索数据流、在大数组中找开头附近的元素（比二分查找更快）。

---

## 查找算法对比总结

```
┌──────────┬───────────┬───────────┬───────────┬──────────────────────┐
│  算法    │ 时间复杂度│ 空间复杂度│ 前提条件   │ 适用场景              │
├──────────┼───────────┼───────────┼───────────┼──────────────────────┤
│ 线性查找 │ O(n)      │ O(1)      │ 无         │ 小数据、无序、链表     │
│ 二分查找 │ O(log n)  │ O(1)      │ 有序       │ 有序数组，通用首选     │
│ lower_   │ O(log n)  │ O(1)      │ 有序       │ 找第一个>=target的位置 │
│ bound    │           │           │           │                       │
│ 插值查找 │ O(loglog n)│ O(1)     │ 有序+均匀分布│ 大规模均匀分布数据    │
│          │ ~ O(n)    │           │           │                       │
│ 指数查找 │ O(log n)  │ O(1)      │ 有序       │ 无界搜索、数据流       │
│ 哈希查找 │ O(1)*     │ O(n)      │ 构建哈希表 │ 大量查询，空间换时间   │
└──────────┴───────────┴───────────┴───────────┴──────────────────────┘
*哈希查找 O(1) 是平均情况，最坏 O(n)（哈希冲突严重时）
```

## 在 C 中使用标准库的查找

```c
#include <stdlib.h>
#include <stdio.h>

// C 标准库提供了 bsearch() 用于二分查找
int compare(const void *a, const void *b) {
    int arg1 = *(const int*)a;
    int arg2 = *(const int*)b;
    return (arg1 > arg2) - (arg1 < arg2);  // 返回 -1, 0, 1
}

int main() {
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 45};
    int n = sizeof(arr) / sizeof(arr[0]);
    int key = 16;

    int *result = (int*)bsearch(
        &key,          // 要查找的值
        arr,           // 数组
        n,             // 元素个数
        sizeof(int),   // 每个元素的大小
        compare        // 比较函数
    );

    if (result != NULL) {
        printf("找到了 %d，位置：%td\n", key, result - arr);
    } else {
        printf("%d 不存在\n", key);
    }

    return 0;
}
```

## 完整演示程序：查找性能对比

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// 包含前面定义的所有查找函数：
// linear_search, binary_search, interpolation_search

int main() {
    // 创建一个大的有序数组
    #define SIZE 100000
    int *arr = malloc(SIZE * sizeof(int));
    for (int i = 0; i < SIZE; i++) {
        arr[i] = i * 2;  // 0, 2, 4, 6, ...  均匀分布
    }

    // 测试数据
    int targets[] = {0, 50000, 99998, 199998, -1};
    int num_tests = sizeof(targets) / sizeof(targets[0]);

    printf("数组大小: %d, 值范围: [%d, %d]\n\n", SIZE, arr[0], arr[SIZE-1]);
    printf("%-10s %-15s %-15s %-15s\n", "目标", "线性查找", "二分查找", "插值查找");
    printf("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    for (int t = 0; t < num_tests; t++) {
        int target = targets[t];
        clock_t start, end;
        int result;

        // 线性查找
        start = clock();
        result = linear_search(arr, SIZE, target);
        end = clock();
        double linear_time = (double)(end - start) / CLOCKS_PER_SEC * 1000;
        char linear_result[20];
        snprintf(linear_result, 20, "%s(%d)",
                 result != -1 ? "找到" : "未找到", result);

        // 二分查找
        start = clock();
        result = binary_search(arr, SIZE, target);
        end = clock();
        double binary_time = (double)(end - start) / CLOCKS_PER_SEC * 1000;
        char binary_result[20];
        snprintf(binary_result, 20, "%s(%d)",
                 result != -1 ? "找到" : "未找到", result);

        // 插值查找
        start = clock();
        result = interpolation_search(arr, SIZE, target);
        end = clock();
        double interp_time = (double)(end - start) / CLOCKS_PER_SEC * 1000;
        char interp_result[20];
        snprintf(interp_result, 20, "%s(%d)",
                 result != -1 ? "找到" : "未找到", result);

        printf("%-10d %-15s %-15s %-15s\n", target,
               linear_result, binary_result, interp_result);
        printf("           %.3fms        %.3fms        %.3fms\n",
               linear_time, binary_time, interp_time);
    }

    free(arr);
    return 0;
}
```

## 查找算法决策树

```
你需要查找数据
│
├── 数据量很小（n < 100）？
│   ├── 是 → 线性查找（简单，开销小）
│   └── 否 →
│       ├── 数据是否有序？
│       │   ├── 是 →
│       │   │   ├── 数据是否均匀分布？
│       │   │   │   ├── 是 → 插值查找（更快）
│       │   │   │   └── 否 → 二分查找
│       │   │   └── ...
│       │   └── 否 →
│       │       ├── 是否需要频繁查找？
│       │       │   ├── 是 → 先排序，再用二分查找
│       │       │   └── 否 → 线性查找
│       │       └── ...
│       └── 查找次数极多？
│           ├── 是 → 考虑构建哈希表（O(1) 查找）
│           └── 否 → 二分查找
│
└── 标准库已提供 → #include <stdlib.h>, bsearch()
```

## 要点总结

| 要点 | 说明 |
|------|------|
| 线性查找 O(n) | 最简单，不需要排序，适合小数据 |
| 二分查找 O(log n) | 前提是数据有序，比线性快得多 |
| n=100万时 | 线性 ~100万次 vs 二分 ~20次 |
| mid 防溢出 | `left + (right - left) / 2` 别用 `(left + right) / 2` |
| lower_bound | 找第一个 >= target 的位置，比直接二分更实用 |
| 插值 vs 二分 | 数据均匀分布用插值（更快），否则用二分（更稳） |
| 标准库 | `bsearch()` 提供二分查找，`lfind()`/`lsearch()` 提供线性查找 |

**最终建议：**
- 查一次 + 无序 → 线性查找
- 查多次 + 无序 → 先排序，然后二分查找（预处理成本 O(n log n)，之后每次 O(log n)）
- 查极多次 → 构建哈希表（预处理成本 O(n)，之后每次 O(1)）
- 有序数组 → 二分查找或 `bsearch()`
- 面试 → 能手写二分查找（三种变体都要会）
