---
category: "C语言教程"
title: "函数基础 — 组织你的代码"
description: "C语言学习教程"
slug: "functions-intro"
level: 3
order: 1
tags: ["函数", "参数", "返回值", "void", "模块化"]
---

# 函数基础 — 组织你的代码

## 热身类比：函数就像厨房里的"万能料理机"

想象你在厨房做菜。每次要切葱花，你都重新拿刀切一遍——这没问题。但如果你的厨房里有一台"万能料理机"，你只需要把葱丢进去，按下"切葱花"按钮，它就自动帮你切好——省时省力，而且不管你放进去的是哪把葱，出来的都是标准切法的葱花。

C 语言里的函数就是这样的"万能料理机"：

- **你丢进去的东西** → 函数的参数（食材）
- **机器的处理过程** → 函数体（料理程序）
- **机器吐出来的成品** → 返回值（成品菜肴）

你用过的 `printf()` 就是别人写好的料理机——你把文字丢进去，它帮你在屏幕上打印出来。现在轮到你造自己的料理机了。

```
输入（参数）          处理（函数体）          输出（返回值）
   │                    │                    │
  (a, b)  ──────→  [ 计算 a + b ]  ──────→  sum
   │                    │                    │
   └────────────────── 函数 ─────────────────┘
```

---

## 为什么需要函数？

写程序就像写文章。没有函数的程序就像一篇没有标点、没有分段的长文——读起来费劲，改起来更费劲。

**没有函数的痛苦：**

```c
#include <stdio.h>

int main() {
    // 第一组：求两个数的最大值
    int a = 5, b = 3;
    int max1;
    if (a > b) max1 = a; else max1 = b;
    printf("max1 = %d\n", max1);

    // 第二组：又要求最大值！同样的代码再写一遍
    int c = 10, d = 7;
    int max2;
    if (c > d) max2 = c; else max2 = d;
    printf("max2 = %d\n", max2);

    // 第三组：烦不烦？又写一遍！
    int e = 100, f = 99;
    int max3;
    if (e > f) max3 = e; else max3 = f;
    printf("max3 = %d\n", max3);

    return 0;
}
```

**用函数后——一份代码，随时调用：**

```c
#include <stdio.h>

// 定义一次，终生受益
int max(int x, int y) {
    return (x > y) ? x : y;   // 三元运算符：条件 ? 真值 : 假值
}

int main() {
    printf("max1 = %d\n", max(5, 3));      // 一行搞定！
    printf("max2 = %d\n", max(10, 7));
    printf("max3 = %d\n", max(100, 99));
    return 0;
}
```

函数的三大好处：
1. **减少重复代码**：写一次，用无数次
2. **易于修改**：改一个函数，所有调用处都生效
3. **逻辑清晰**：把大问题分解成小函数，每个函数专心做一件事

---

## 函数的结构 —— 一张蓝图看懂

每个 C 函数都包含四个部分。我们把它们画成图：

```
┌────────────────────────────────────────────────┐
│                函数定义全景图                      │
│                                                  │
│   ① 返回类型    ② 函数名    ③ 参数列表             │
│   ┌──────┐    ┌──────┐   ┌──────────┐           │
│   │  int │    │ add  │ ( │ int a,    │           │
│   │      │    │      │   │ int b     │ )         │
│   └──┬───┘    └──┬───┘   └────┬─────┘           │
│      │           │            │                  │
│      │     "我叫add"      "我需要两个食材"         │
│      │                                           │
│   "我会给你"      ④ 函数体 { }                     │
│   "一个 int"    ┌─────────────────────┐          │
│      │         │  int result = a + b; │ ← 干活   │
│      │         │  return result;      │ ← 交货   │
│      └─────────┤                     │          │
│                └─────────────────────┘          │
│                                                  │
│   return 后面跟的值类型必须和①返回类型匹配！        │
└────────────────────────────────────────────────┘
```

### 示例 1：最简单的加法函数

```c
#include <stdio.h>

// ①返回类型: int（我要返回一个整数）
// ②函数名:   add（我叫"add"）
// ③参数列表: int a, int b（给我两个整数）
int add(int a, int b) {
    // ④函数体开始
    int result = a + b;    // 干活：把 a 和 b 加起来
    return result;         // 交货：把结果交出去
}

int main() {
    int sum = add(3, 5);          // 调用函数，3 和 5 是实参
    printf("3 + 5 = %d\n", sum);  // 输出：3 + 5 = 8

    // 也可以直接在 printf 里调用！
    printf("10 + 20 = %d\n", add(10, 20));  // 输出：10 + 20 = 30
    return 0;
}
```

---

## 术语辨析 —— 别搞混了！

初学者最容易混淆的两组概念：

```
        定义时                          调用时
    ┌──────────┐                  ┌──────────┐
    │ 形参      │   ← 一对对应 →  │ 实参      │
    │(parameter)│                  │(argument) │
    └──────────┘                  └──────────┘

    add(int a, int b)             add(3, 5)
         ↑     ↑                     ↑  ↑
      形参 a  形参 b              实参 3  实参 5
```

| 术语 | 英文 | 生活类比 | 示例 |
|------|------|----------|------|
| **形参** | parameter | 菜单上的"食材用量"（占位描述） | `int add(int a, int b)` 中的 `a` 和 `b` |
| **实参** | argument | 实际下锅的"具体食材" | `add(3, 5)` 中的 `3` 和 `5` |
| **返回值** | return value | 做好的菜 | `return result` 中的 `result` |
| **调用** | call | "把菜谱执行一遍" | `add(3, 5)` 这一句 |
| **声明** | declaration | "这道菜能做"（预告） | `int add(int a, int b);` |
| **定义** | definition | "这道菜怎么做"（完整菜谱） | `int add(int a, int b) { ... }` |

---

## 返回类型详解 —— 函数能"交"出什么？

### 示例 2：各种返回类型

```c
#include <stdio.h>

// 返回整数 —— 比如年龄、数量
int get_age() {
    return 25;                     // 整数常量直接返回
}

// 返回浮点数 —— 比如价格、温度
float get_pi() {
    return 3.14159f;               // f 后缀表示 float 类型
}

// 返回字符 —— 比如等级、字母
char get_grade() {
    return 'A';                    // 单引号表示字符
}

// void：不返回任何东西 —— 比如打印、发送信号
void say_hello() {
    printf("Hello, 你好!\n");
    // void 函数可以写 "return;" 提前退出
    // 也可以完全不写 return 语句
}

int main() {
    printf("年龄: %d\n", get_age());       // 25
    printf("圆周率: %.5f\n", get_pi());    // 3.14159
    printf("等级: %c\n", get_grade());     // A
    say_hello();                           // 打印问候语，不返回任何值
    return 0;
}
```

**返回类型必须和 `return` 的值匹配：**

```c
// 规则：头部的类型 = return 后面的类型
int    func1() { return 42;        }  // int    ← int     ✅
float  func2() { return 3.14f;     }  // float  ← float   ✅
char   func3() { return 'X';       }  // char   ← char    ✅
void   func4() { return;           }  // void   ← 空      ✅
// 注意：void 函数也可以不写 return
```

---

## 多参数函数 —— 函数不止接受两个参数

### 示例 3：计算平均值（三个参数）

```c
#include <stdio.h>

// 计算三门课的平均分
// 三个参数：语文、数学、英语
float average(float chinese, float math, float english) {
    float total = chinese + math + english;    // 先算总分
    return total / 3.0f;                       // 再除以 3 求平均
}

int main() {
    // 小明的成绩
    float avg1 = average(85.5f, 92.0f, 78.5f);
    printf("小明的平均分: %.1f\n", avg1);  // 85.3

    // 小红的成绩
    float avg2 = average(90.0f, 88.0f, 95.0f);
    printf("小红的平均分: %.1f\n", avg2);  // 91.0

    // 一样的函数，不同的数据 —— 这就是函数的威力！
    return 0;
}
```

**参数数量没有硬性上限**（但建议别超过 5-6 个，否则可读性变差）：

```c
// 1 个参数：打印一行分隔线
void print_line(int length) {
    for (int i = 0; i < length; i++)
        printf("-");
    printf("\n");
}

// 5 个参数：计算五门课的加权平均（不太推荐，参数太多！）
// 更好的做法是用数组（后面会学）
float weighted_avg(float a, float b, float c, float d, float e) {
    return (a + b + c + d + e) / 5.0f;
}
```

---

## 函数声明（原型）vs 定义 —— 编译器的"目录"

C 编译器从上到下读代码，就像你从上到下读一本书。如果在第 10 行调用一个函数，但函数的完整代码在第 50 行，编译器就会"一脸茫然"："这个函数是什么？我没见过！"

### 示例 4：声明与定义分离

```c
#include <stdio.h>

// 函数声明（原型）—— 提前告诉编译器："后面有这个函数！"
// 注意末尾的分号！声明是语句，需要分号
int multiply(int a, int b);     // ← 分号！这不是定义
void print_greeting(void);      // void 参数表示这个函数不接受参数

// =============================================
// main 函数可以放心调用，因为编译器已经"知道"它们了
// =============================================
int main() {
    int result = multiply(6, 7);
    printf("6 × 7 = %d\n", result);   // 42

    print_greeting();
    return 0;
}

// =============================================
// 下面是函数的真正实现（定义）
// =============================================
int multiply(int a, int b) {
    return a * b;               // 实际代码
}

void print_greeting(void) {
    printf("欢迎来到 C 语言的世界！\n");
}
```

**两种书写习惯（选一种坚持就好）：**

```c
// 风格 A：所有函数定义在调用之前（省去声明）
#include <stdio.h>

int add(int a, int b) { return a + b; }   // 定义在前
int sub(int a, int b) { return a - b; }

int main() {
    printf("%d\n", add(3, 5));            // 直接调用，无需声明
    return 0;
}

// 风格 B：main 在最上面，声明写在前面
#include <stdio.h>

int add(int a, int b);                    // 先声明
int sub(int a, int b);

int main() {
    printf("%d\n", add(3, 5));            // 调用
    return 0;
}

int add(int a, int b) { return a + b; }   // 后定义
int sub(int a, int b) { return a - b; }
```

---

## 传值调用 —— 初学者最容易踩的坑！

> **核心概念：C 语言的函数参数是"传值"的。函数拿到的是变量的副本，不是原变量本身。**

### 示例 5：传值调用演示

把这个过程想象成**复印文件**——别人给你一份文件的复印件，你在复印件上写字，原件不会有任何变化。

```c
#include <stdio.h>

// 这个函数试图修改参数 x
void try_to_change(int x) {
    x = x + 1;                       // 修改的是"复印件"！
    printf("函数内部: x = %d\n", x);  // 输出：函数内部: x = 6
}

int main() {
    int n = 5;
    printf("调用前:   n = %d\n", n);  // 输出：调用前:   n = 5

    try_to_change(n);                 // 传入"复印件"

    printf("调用后:   n = %d\n", n);  // 输出：调用后:   n = 5
    //                                   注意：n 还是 5！没变！
    return 0;
}
```

**用内存视角理解传值：**

```
调用前：main 中的 n
┌─────┐
│ n=5 │   内存地址：0x100（举例）
└─────┘

调用 try_to_change(n) 时：
        ┌─────┐
  n=5 → │ x=5 │   x 是 n 的副本，存在另一个地址 0x200
        └─────┘

x = x + 1 执行后：
┌─────┐       ┌─────┐
│ n=5 │       │ x=6 │   只改了副本，原变量不变！
└─────┘       └─────┘
 0x100         0x200
```

**好消息：后面学到指针时，你就能通过地址直接修改原变量了！** 现阶段只需记住：函数内部改参数不影响外面的变量。

---

## 常见错误诊所 —— 看看你有没有中招

### 错误 1：忘记声明或定义

```c
// ❌ 错误：编译器从上往下读，不知道 add 是什么
int main() {
    int result = add(3, 5);    // 编译错误：'add' was not declared
    return 0;
}

int add(int a, int b) {        // 定义在调用之后
    return a + b;
}

// ✅ 修正方案 A：把定义移到调用之前
int add(int a, int b) {
    return a + b;
}

int main() {
    int result = add(3, 5);    // 正确！
    return 0;
}

// ✅ 修正方案 B：在开头加声明
int add(int a, int b);         // 提前声明

int main() {
    int result = add(3, 5);    // 正确！
    return 0;
}

int add(int a, int b) {
    return a + b;
}
```

### 错误 2：返回类型不匹配

```c
// ❌ 错误：声明返回 int，实际返回了字符串
int get_value() {
    return "hello";            // 编译警告/错误：类型不匹配
}

// ❌ 错误：声明返回 double，但没有写 return 语句
double calculate() {
    double x = 3.14;
    // 忘了 return x;         // 未定义行为！返回值是垃圾数据
}

// ✅ 正确：类型必须一致
int get_value() {
    return 42;                 // int 返回 int
}

double calculate() {
    double x = 3.14;
    return x;                  // double 返回 double
}
```

### 错误 3：形参与实参数量/类型不对应

```c
int multiply(int a, int b) {
    return a * b;
}

int main() {
    // ❌ 错误：参数数量不对 —— 要两个，只给了一个
    int r1 = multiply(5);          // 编译错误

    // ❌ 错误：参数类型不对 —— 传了浮点数给 int 参数
    int r2 = multiply(3.14, 2.5);  // 可能被截断为 3 和 2

    // ✅ 正确：数量和类型都匹配
    int r3 = multiply(6, 7);       // 42
    return 0;
}
```

### 错误 4：混淆形参和局部变量

```c
// ❌ 常见错误：又重新声明了同名的局部变量
int add(int a, int b) {
    int a = 10;               // 错误！a 已经是形参了，重复声明
    return a + b;             // 编译器懵了：哪个 a？
}

// ✅ 正确：形参拿来直接用，不要再声明
int add(int a, int b) {
    return a + b;             // 直接用形参 a 和 b
}
```

### 错误 5：void 函数里写了 return 带值

```c
// ❌ 错误：void 表示"什么都不返回"，却试图返回 0
void print_message() {
    printf("Hello\n");
    return 0;                  // 编译错误：void 函数不能返回值
}

// ✅ 正确：void 函数要么不写 return，要么只写 return;
void print_message() {
    printf("Hello\n");
    // 没有 return —— 没关系，执行完自动返回
}

void maybe_exit(int x) {
    if (x < 0) {
        return;                // 提前退出，不带值 —— 这是合法的
    }
    printf("x is non-negative\n");
}
```

---

## 动手写函数的实践建议

1. **先想清楚"输入"和"输出"**：写函数之前，用一句话描述它。"给我两个整数，我还你一个较大的整数" → `int max(int a, int b)`

2. **从简单开始**：先写只做一件事的小函数。不要一开始就想写"万能函数"。

3. **命名要见名知义**：
   - `max` — 找最大值 ✅
   - `calc_area` — 计算面积 ✅
   - `is_prime` — 判断素数 ✅
   - `f1` — 不知道干嘛的 ❌

4. **用 `void` 表示无参数（可选但是好习惯）**：
   ```c
   void say_hi(void);    // 清楚地表达：不接受参数
   void say_hi();        // 也可以，但不那么明确
   ```

5. **每个函数只做一件事**：如果发现一个函数做了两件完全不同的事，拆成两个。

6. **测试你的函数**：写完之后用几组不同的值调用它，看看结果对不对。

---

## 练习挑战（动手试试看）

### 练习 1：猜输出（不要编译，用脑子想）

```c
#include <stdio.h>

void mystery(int a, int b) {
    a = a + 10;
    b = b * 2;
    printf("Inside: a=%d, b=%d\n", a, b);
}

int main() {
    int x = 3, y = 4;
    mystery(x, y);
    printf("Outside: x=%d, y=%d\n", x, y);
    return 0;
}
```

（答案在下一节的后面…）

### 练习 2：写一个判断偶数的函数

```c
// 函数名：is_even
// 参数：一个 int
// 返回：偶数返回 1，奇数返回 0
// 提示：偶数 % 2 == 0

// 你的代码：
// int is_even(int n) { ... }
```

### 练习 3：写一个计算长方形面积的函数

```c
// 输入：长(length) 和 宽(width)，都是 int
// 输出：面积（长×宽）

// 你的代码：
// int rectangle_area(int length, int width) { ... }
```

---

## 要点速查

| 知识点 | 一句话 |
|--------|--------|
| 函数 = IPO 模型 | Input（参数）→ Process（函数体）→ Output（返回值） |
| 形参 vs 实参 | 形参是定义时的占位符，实参是调用时的具体值 |
| void | 表示"空"——无返回值，或（在参数列表中）无参数 |
| 声明 vs 定义 | 声明是"预告"，定义是"实现"；声明有分号，定义有 `{}` |
| 传值调用 | 函数拿到的是变量的副本，修改副本不影响原变量 |
| 返回类型必须匹配 | `int` 函数返回整数，`void` 函数不返回任何东西 |
| 先声明/定义，后调用 | 编译器从上往下读，调用之前必须"认识"这个函数 |

> **本章最重要的思维转变**：开始用函数的视角看待代码。不要写一大坨代码在 `main()` 里，而是把每个独立任务拆成一个函数。这就是"模块化"的开端。

（练习 1 答案：输出是 `Inside: a=13, b=8` 然后 `Outside: x=3, y=4`。因为传值调用，main 里的 x 和 y 没有变！）
