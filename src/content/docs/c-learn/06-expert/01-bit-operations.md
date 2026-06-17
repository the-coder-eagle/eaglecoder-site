---
category: "C语言教程"
title: "位运算 — 底层操作的艺术"
description: "C语言学习教程"
slug: "bit-operations"
level: 6
order: 1
tags: ["位运算", "位掩码", "权限", "底层"]
---

# 位运算 — 底层操作的艺术

位运算让你像 CPU 一样直接操控二进制位。它是 C 语言最底层、最快速的操作之一，也是嵌入式系统、操作系统、图形编程、加密算法的核心武器。

## 前置知识：二进制速览

在深入位运算之前，确保你对二进制有基本感觉。一个 `int` 在内存中是 32 个 bit：

```
十进制 42 的二进制表示（仅展示低 8 位）：

 二进制   0   0   1   0   1   0   1   0
 位权     128 64  32  16  8   4   2   1
 位编号    7   6   5   4   3   2   1   0  (从右往左，从 0 开始)
 值        0 + 0 +32 + 0 + 8 + 0 + 2 + 0 = 42

十进制 13 的二进制表示（低 8 位）：

 二进制   0   0   0   0   1   1   0   1
 位权     128 64  32  16  8   4   2   1
 值        0 + 0 + 0 + 0 + 8 + 4 + 0 + 1 = 13
```

**位编号约定：** 最低位（最右边）是第 0 位，往左依次是第 1 位、第 2 位……最高位是第 31 位（对 32 位 int 而言）。

## 六大位运算符

C 语言提供六个位运算符。下面是完整的参考表：

### AND（按位与）— `&`

```
规则：两个位都是 1，结果才是 1

  1 & 1 = 1        1 & 0 = 0
  0 & 1 = 0        0 & 0 = 0
```

```
示例：42 & 13

 42 = 0b00101010
 13 = 0b00001101
 ───────────────
     & 0b00001000  = 8

逐位分析：
  位7: 0 & 0 = 0
  位6: 0 & 0 = 0
  位5: 1 & 0 = 0
  位4: 0 & 0 = 0
  位3: 1 & 1 = 1 ← 只有这一位两个都是 1
  位2: 0 & 1 = 0
  位1: 1 & 0 = 0
  位0: 0 & 1 = 0

结果: 8
```

**用途：** 检测某一位是否为 1（掩码），清零指定位。

### OR（按位或）— `|`

```
规则：至少一个位是 1，结果就是 1

  1 | 1 = 1        1 | 0 = 1
  0 | 1 = 1        0 | 0 = 0
```

```
示例：42 | 13

 42 = 0b00101010
 13 = 0b00001101
 ───────────────
     | 0b00101111  = 47

逐位分析：
  位5: 1 | 0 = 1
  位4: 0 | 0 = 0
  位3: 1 | 1 = 1
  位2: 0 | 1 = 1
  位1: 1 | 0 = 1
  位0: 0 | 1 = 1

结果: 47
```

**用途：** 设置指定位为 1（打开开关），合并多个标志。

### XOR（按位异或）— `^`

```
规则：两个位不同，结果才是 1

  1 ^ 1 = 0        1 ^ 0 = 1
  0 ^ 1 = 1        0 ^ 0 = 0
```

```
示例：42 ^ 13

 42 = 0b00101010
 13 = 0b00001101
 ───────────────
     ^ 0b00100111  = 39

逐位分析：
  位5: 1 ^ 0 = 1 ← 不同
  位4: 0 ^ 0 = 0
  位3: 1 ^ 1 = 0 ← 相同
  位2: 0 ^ 1 = 1 ← 不同
  位1: 1 ^ 0 = 1 ← 不同
  位0: 0 ^ 1 = 1 ← 不同

结果: 39
```

**XOR 的魔法性质：**

```c
a ^ a = 0          // 任何数和自己 XOR 得 0
a ^ 0 = a          // 任何数和 0 XOR 得自己
a ^ b ^ b = a      // XOR 两次同一个数，还原！（结合律+自反性）
```

第三条性质意味着：

```c
// 不使用临时变量交换两个整数
int a = 5, b = 9;
a = a ^ b;   // a = 5 ^ 9
b = a ^ b;   // b = (5 ^ 9) ^ 9 = 5
a = a ^ b;   // a = (5 ^ 9) ^ 5 = 9
// a = 9, b = 5，交换完成！
```

> 提示：这种交换技巧在现代 CPU 上不一定比用临时变量快，编译器通常会优化得更好。但它展示了 XOR 的数学性质，有助于理解。

### NOT（按位取反）— `~`

```
规则：0 变 1，1 变 0（对每一位取反）

~0 = 1         ~1 = 0
```

```c
unsigned char x = 0b00000000;  // x = 0
unsigned char y = ~x;          // y = 0b11111111 = 255

// 注意：按位取反的结果取决于变量类型
// 对于 unsigned char:
//   ~0b01010101 = 0b10101010 = 170
//
// 对于 signed int (32 位):
//   ~42 = ~(0b0000...00101010) = 0b1111...11010101 = -43
//   符号位也被翻转了！
```

**用途：** 生成反转的掩码，清零指定位（配合 `&`）。

### 左移 — `<<`

```
规则：把所有位向左移动 n 位，右边补 0

1 << 0 = 0b00000001  = 1
1 << 1 = 0b00000010  = 2
1 << 2 = 0b00000100  = 4
1 << 3 = 0b00001000  = 8
1 << 4 = 0b00010000  = 16
1 << 5 = 0b00100000  = 32
1 << 6 = 0b01000000  = 64
1 << 7 = 0b10000000  = 128
```

```
左移可视化（1 字节）：

原始: 0b00000101 = 5
        ││││││││
        ▼▼▼▼▼▼▼▼
左移1: 0b00001010 = 10      (5 * 2)
左移2: 0b00010100 = 20      (5 * 4)
左移3: 0b00101000 = 40      (5 * 8)
左移4: 0b01010000 = 80      (5 * 16)
左移5: 0b10100000 = 160     (5 * 32)
```

**关键事实：左移 n 位 = 乘以 2^n**（前提是不溢出）。在嵌入式开发中，`1 << 5` 比写 `32` 更清楚地表达了"第 5 位"这个意图。

```c
1 << 0   // 0b00000001 = 1
1 << 5   // 0b00100000 = 32 — 第 5 位为 1
1 << 31  // 最高位为 1（对于 32 位 int）
```

### 右移 — `>>`

```
规则：把所有位向右移动 n 位
- 无符号数：左边补 0（逻辑右移）
- 有符号数：左边补符号位（算术右移）——具体行为由编译器决定！
```

```
无符号数右移:

unsigned char x = 0b10100000 = 160

x >> 1 = 0b01010000 = 80    (左边补 0)
x >> 2 = 0b00101000 = 40
x >> 3 = 0b00010100 = 20
x >> 4 = 0b00001010 = 10
x >> 5 = 0b00000101 = 5
```

**关键事实：右移 n 位 = 除以 2^n（整数除法，向下取整）**。

```c
100 >> 1 = 50    // 100 / 2
100 >> 2 = 25    // 100 / 4
100 >> 3 = 12    // 100 / 8 = 12.5 → 12（整数除法）
```

---

## 八大位运算技巧

### 技巧 1：判断奇偶

```c
if (x & 1) {
    // x 是奇数（最低位为 1）
} else {
    // x 是偶数（最低位为 0）
}
```

```
二进制中，只有 2^0=1 决定奇偶：

 3 = 0b0011 → 最低位 → 1 → 奇数
 4 = 0b0100 → 最低位 → 0 → 偶数
42 = 0b00101010 → 最低位 → 0 → 偶数
```

`x & 1` 为什么比 `x % 2` 快？因为取最低位只需一次 AND 指令（纳秒级），而 `% 2` 在某些硬件上需要除法指令（慢几十倍）。

### 技巧 2：检测第 k 位是否为 1

```c
int k = 3;
if ((x >> k) & 1) {
    printf("第 %d 位是 1\n", k);
} else {
    printf("第 %d 位是 0\n", k);
}
```

```
x = 42 = 0b00101010
k = 3:

x >> 3 = 0b00000101    （把第 3 位移到最低位）
& 1    = 0b00000001    （只看最低位）
       = 1

结果: 第 3 位是 1
```

验证：42 = 32 + 8 + 2 = 2^5 + 2^3 + 2^1，第 3 位确实是 1。

### 技巧 3：设置第 k 位为 1

```c
x = x | (1 << k);
// 或简写为
x |= (1 << k);
```

```
x = 42 = 0b00101010
k = 4:

1 << 4 = 0b00010000     （只让第 4 位为 1 的掩码）
x      = 0b00101010
       | 0b00010000
       = 0b00111010     （第 4 位变成了 1）
```

```
从右往左看：
x 的位:   位7 位6 位5 位4 位3 位2 位1 位0
x       :  0   0   1   0   1   0   1   0
1 << 4  :  0   0   0   1   0   0   0   0
─── | ───
结果    :  0   0   1   1   1   0   1   0
                      ↑ 第 4 位从 0 变成了 1
```

### 技巧 4：清零第 k 位

```c
x = x & ~(1 << k);
// 或简写为
x &= ~(1 << k);
```

```
x = 42 = 0b00101010
k = 3:

1 << 3  = 0b00001000
~(1<<3) = 0b11110111     （只有第 3 位是 0，其余全是 1）
x       = 0b00101010
       & 0b11110111
       = 0b00100010     （第 3 位被清零）

验证: 42 - 8 = 34 → 0b00100010 ✓
```

### 技巧 5：翻转第 k 位

```c
x = x ^ (1 << k);
// 或简写为
x ^= (1 << k);
```

```
x = 42 = 0b00101010
翻转第 1 位（当前是 1）:

1 << 1  = 0b00000010
x ^ mask = 0b00101000  = 40   （第 1 位：1 → 0）

再次翻转：
40 ^ mask = 0b00101010 = 42  （第 1 位：0 → 1）
```

### 技巧 6：判断是否为 2 的幂

```c
int is_power_of_two(int n) {
    return (n > 0) && ((n & (n - 1)) == 0);
}
```

**为什么成立？** 2 的幂在二进制中只有 1 个 1：`1(1), 2(10), 4(100), 8(1000), 16(10000)...`

```
n     = 8  = 0b00001000
n - 1 = 7  = 0b00000111
n & (n-1) = 0b00000000 = 0  ✅ 是 2 的幂

n     = 10 = 0b00001010
n - 1 = 9  = 0b00001001
n & (n-1) = 0b00001000 ≠ 0  ❌ 不是 2 的幂
```

### 技巧 7：计算二进制中 1 的个数

```c
int count_bits(int n) {
    int count = 0;
    while (n) {
        n &= (n - 1);  // 每次消除最低位的 1
        count++;
    }
    return count;
}

// count_bits(0b10110) = 3
```

```
逐步演示 count_bits(22) → 22 = 0b10110

第1轮: n = 22 = 0b10110
       n-1 = 21 = 0b10101
       n &= n-1 → n = 0b10100  count = 1

第2轮: n = 20 = 0b10100
       n-1 = 19 = 0b10011
       n &= n-1 → n = 0b10000  count = 2

第3轮: n = 16 = 0b10000
       n-1 = 15 = 0b01111
       n &= n-1 → n = 0b00000  count = 3

n = 0，退出，返回 3 ✓
```

### 技巧 8：提取最低位的 1

```c
int lowest_bit = n & (-n);

// lowest_bit 中只有一个 1，就是 n 中最低位的那个 1
```

```
n = 12 = 0b00001100
-n = 0b11110100  (二进制补码)
n & (-n) = 0b00000100 = 4

n = 42 = 0b00101010
-n = 0b11010110
n & (-n) = 0b00000010 = 2
```

---

## 实战应用一：权限系统（标志位）

位运算最经典、最实用的应用是**用一个整数存储多个布尔标志**。以文件权限为例：

```c
#include <stdio.h>

// 每个权限占一位
#define PERM_NONE   0x00    // 0b00000000  无权限
#define PERM_READ   0x01    // 0b00000001  读
#define PERM_WRITE  0x02    // 0b00000010  写
#define PERM_EXEC   0x04    // 0b00000100  执行
#define PERM_DELETE 0x08    // 0b00001000  删除
#define PERM_ADMIN  0x10    // 0b00010000  管理

// 预定义组合
#define PERM_RW     (PERM_READ | PERM_WRITE)                    // 0b00000011
#define PERM_RWX    (PERM_READ | PERM_WRITE | PERM_EXEC)        // 0b00000111
#define PERM_ALL    (PERM_READ | PERM_WRITE | PERM_EXEC |        \
                     PERM_DELETE | PERM_ADMIN)                 // 0b00011111

void show_permissions(int perm) {
    printf("━━━━━━━━━━━━━━━━━━━━━\n");
    printf("权限详情 (0x%02X = %d):\n", perm, perm);
    printf("  读  (R): %s\n", (perm & PERM_READ)   ? "✅" : "❌");
    printf("  写  (W): %s\n", (perm & PERM_WRITE)  ? "✅" : "❌");
    printf("  执行(X): %s\n", (perm & PERM_EXEC)   ? "✅" : "❌");
    printf("  删除(D): %s\n", (perm & PERM_DELETE) ? "✅" : "❌");
    printf("  管理(A): %s\n", (perm & PERM_ADMIN)  ? "✅" : "❌");
    printf("━━━━━━━━━━━━━━━━━━━━━\n\n");
}

int main() {
    int user_perm = PERM_NONE;

    printf("=== 权限管理演示 ===\n\n");

    // 1. 授予读和写
    user_perm |= (PERM_READ | PERM_WRITE);
    printf("授予读+写:\n");
    show_permissions(user_perm);  // R:Y W:Y X:N D:N A:N

    // 2. 追加执行权限
    user_perm |= PERM_EXEC;
    printf("追加执行:\n");
    show_permissions(user_perm);  // R:Y W:Y X:Y D:N A:N

    // 3. 检查是否有写权限
    if (user_perm & PERM_WRITE) {
        printf("→ 用户有写权限，准备撤销……\n\n");
    }

    // 4. 撤销写权限
    user_perm &= ~PERM_WRITE;
    printf("撤销写权限:\n");
    show_permissions(user_perm);  // R:Y W:N X:Y D:N A:N

    // 5. 一步授予全部权限
    user_perm = PERM_ALL;
    printf("授予全部权限:\n");
    show_permissions(user_perm);  // R:Y W:Y X:Y D:Y A:Y

    return 0;
}
```

### 权限模式总结

```
操作                    代码                        说明
────────────────────────────────────────────────────────
检查某权限              if (perm & PERM_READ)       掩码测试
设置某权限              perm |= PERM_READ            OR 打开
清除某权限              perm &= ~PERM_READ           AND + NOT
翻转某权限              perm ^= PERM_READ            XOR 翻转
设置多个权限            perm |= (A | B | C)          OR 合并
授权全部                perm = PERM_ALL              直接赋值
```

---

## 实战应用二：颜色编码

位运算在图形编程中无处不在。以 32 位 RGBA 颜色编码为例：

```
32 位颜色编码（每通道 8 位）:

  高 ←───────────────────────────────────→ 低
  ┌──────────┬──────────┬──────────┬──────────┐
  │   Alpha  │  Red     │  Green   │  Blue    │
  │  [31:24] │ [23:16]  │ [15:8]   │  [7:0]   │
  └──────────┴──────────┴──────────┴──────────┘

例如：0xFF3366CC
  Alpha = 0xFF = 255 (不透明)
  Red   = 0x33 = 51
  Green = 0x66 = 102
  Blue  = 0xCC = 204
```

```c
#include <stdio.h>
#include <stdint.h>

// 用 uint32_t 确保正好 32 位
typedef uint32_t Color;

#define MAKE_COLOR(r, g, b) \
    ((Color)(0xFF000000 | ((r) << 16) | ((g) << 8) | (b)))
//                     ^ Alpha=255   ^ Red       ^ Green   ^ Blue

#define GET_RED(c)   (((c) >> 16) & 0xFF)
#define GET_GREEN(c) (((c) >> 8)  & 0xFF)
#define GET_BLUE(c)  ((c)         & 0xFF)
#define GET_ALPHA(c) (((c) >> 24) & 0xFF)

int main() {
    Color sky_blue = MAKE_COLOR(135, 206, 235);

    printf("天空蓝: #%06X\n", sky_blue & 0xFFFFFF);
    printf("  R = %3d = 0x%02X\n", GET_RED(sky_blue), GET_RED(sky_blue));
    printf("  G = %3d = 0x%02X\n", GET_GREEN(sky_blue), GET_GREEN(sky_blue));
    printf("  B = %3d = 0x%02X\n", GET_BLUE(sky_blue), GET_BLUE(sky_blue));
    printf("  A = %3d = 0x%02X\n", GET_ALPHA(sky_blue), GET_ALPHA(sky_blue));

    return 0;
}
```

---

## 实战应用三：用位运算替代乘除

```c
x * 2   →  x << 1      (整数)
x * 4   →  x << 2
x * 8   →  x << 3
x * 16  →  x << 4
x * 2^n →  x << n

x / 2   →  x >> 1      (整数除法)
x / 4   →  x >> 2
x / 8   →  x >> 3
x / 2^n →  x >> n

x % 2   →  x & 1       (判断奇偶)
x % 2^n →  x & ((1 << n) - 1)   (模 2^n)
```

**一个提醒：** 现代编译器在优化模式下（`-O2`）会自动把 `x * 8` 优化成 `x << 3`。所以不需要刻意用移位来"提速"——编译器比你更擅长这个。**用位运算的真正价值在于表达意图**：当你写 `1 << 5` 时，读者知道你在操作第 5 位，而不是在算 `32`。

---

## 实战应用四：状态机与枚举

```c
#include <stdio.h>

// 用位掩码表示程序状态——可以同时处于多个状态
#define STATE_IDLE       0x00    // 空闲
#define STATE_LOADING    0x01    // 加载中
#define STATE_PLAYING    0x02    // 播放中
#define STATE_PAUSED     0x04    // 暂停
#define STATE_ERROR      0x08    // 错误
#define STATE_BUFFERING  0x10    // 缓冲中

const char *state_name(unsigned state) {
    switch (state) {
        case STATE_IDLE:     return "空闲";
        case STATE_LOADING:  return "加载中";
        case STATE_PLAYING:  return "播放中";
        case STATE_PAUSED:   return "已暂停";
        case STATE_ERROR:    return "错误";
        case STATE_PLAYING | STATE_PAUSED: return "播放中+暂停（异常）";
        default:             return "未知状态";
    }
}

int main() {
    unsigned player_state = STATE_IDLE;

    player_state = STATE_LOADING;
    printf("状态: %s\n", state_name(player_state));

    player_state = STATE_PLAYING;
    printf("状态: %s\n", state_name(player_state));

    player_state |= STATE_PAUSED;  // 同时添加暂停
    printf("状态: %s\n", state_name(player_state));

    // 检查是否处于多种状态
    if ((player_state & (STATE_PLAYING | STATE_PAUSED)) ==
        (STATE_PLAYING | STATE_PAUSED)) {
        printf("播放器处于播放+暂停的异常状态！\n");
    }

    // 清除暂停，恢复播放
    player_state &= ~STATE_PAUSED;
    printf("状态: %s\n", state_name(player_state));

    return 0;
}
```

---

## 自测练习

### 练习一：编写位运算工具函数

```c
// 请你实现以下函数：

// 1. 返回 n 的二进制表示（字符串）
//    void to_binary(char *buf, int buf_size, unsigned int n);

// 2. 翻转 n 的第 k 位，返回翻转后的值
//    unsigned int toggle_bit(unsigned int n, int k);

// 3. 判断 n 是否是 2 的幂
//    int is_power_of_two(unsigned int n);

// 4. 计算 n 的二进制中 1 的个数（用位运算，不要用循环逐位检查）
//    int pop_count(unsigned int n);
```

### 练习二：简单加密

利用 XOR 的自反性质（`a ^ k ^ k = a`），实现一个最简加密解密器：

```c
#include <stdio.h>
#include <string.h>

// 加密和解密是同一个函数！（异或两次密钥就还原）
void xor_cipher(char *data, int len, char key) {
    for (int i = 0; i < len; i++) {
        data[i] ^= key;
    }
}

int main() {
    char msg[] = "Hello, World!";
    char key = 0x55;  // 01010101

    printf("原文: %s\n", msg);

    // 加密
    xor_cipher(msg, strlen(msg), key);
    printf("加密后: ");
    for (int i = 0; i < (int)strlen(msg); i++) {
        printf("%02X ", (unsigned char)msg[i]);
    }
    printf("\n");

    // 解密（再用一次）
    xor_cipher(msg, strlen(msg), key);
    printf("解密后: %s\n", msg);

    return 0;
}
```

## 要点速查

| 概念 | 说明 |
|------|------|
| `&` (与) | 检测位、清零位——"两个都 1 才 1" |
| `\|` (或) | 设置位——"有 1 就是 1" |
| `^` (异或) | 翻转位——"不同才 1", `a ^ k ^ k = a` |
| `~` (取反) | 全部翻转——配合 `&` 清零指定位 |
| `<<` (左移) | 每位左移 n 位，右边补 0——`1 << k` 生成掩码 |
| `>>` (右移) | 每位右移 n 位——`x >> k & 1` 检测第 k 位 |
| `x & 1` | 判断奇偶（比 `% 2` 快） |
| `x & (x-1)` | 消除最低位的 1；`==0` 则 x 是 2 的幂 |
| `x & -x` | 提取最低位的 1 |
| 标志位模式 | 用 `\|` 合并标志，用 `&` 检查标志，用 `& ~` 清除标志 |
| 颜色编码 | `(R<<16) \| (G<<8) \| B` 构造颜色；移位+掩码提取 |
