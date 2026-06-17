---
category: "C语言教程"
title: "函数练习 — 把代码变成积木"
description: "C语言学习教程"
slug: "function-practice"
level: 3
order: 3
tags: ["函数", "练习", "模块化", "实战", "递归"]
---

# 函数练习 — 把代码变成积木

## 热身类比：从"一整块黏土"到"乐高积木"

你有没有见过小孩捏橡皮泥？一开始他们会把整块黏土捏成一个大概的形状——就像新手程序员把所有代码都塞在 `main()` 里。这样做出来的东西粗糙、难调整、一碰就碎。

而真正的工匠用**乐高积木**——每个积木都是一个独立的小零件，可以随意组合、替换。函数就是程序员的"乐高积木"：

```
差劲的程序（黏土式）：                  优秀的程序（乐高式）：
┌─────────────────────┐          ┌────┐ ┌────┐ ┌────┐ ┌────┐
│                     │          │判断│ │计算│ │显示│ │转换│
│  main() 一大坨代码   │   vs    │素数│ │BMI │ │菜单│ │加密│
│  什么都做，乱成一团   │          └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘
│                     │             └──────┼──────┼──────┘
└─────────────────────┘                   │
                                    ┌─────┴─────┐
                                    │  main()   │
                                    │  组装积木  │
                                    └───────────┘
```

本章通过 6 个由浅入深的练习，帮你从"捏黏土"过渡到"搭积木"。每个练习都配有详细注解，看懂之后一定要自己动手写一遍！

---

## 练习 1：判断回文数（难度：★☆☆☆☆）

**任务**：写一个函数判断一个整数是否是回文数——正着读和反着读一样的数。

**思路拆解**：把原数字翻转过来，如果翻转后等于原数字，就是回文数。

```
以 121 为例：
  原数字：121
  翻转后：121
  比较：121 == 121  ✅ 是回文数

以 123 为例：
  原数字：123
  翻转后：321
  比较：123 != 321  ❌ 不是回文数
```

### 代码实现（逐行注解）

```c
#include <stdio.h>

/**
 * 判断一个正整数是否是回文数
 * @param n  待判断的整数
 * @return   是回文数返回 1，不是返回 0
 */
int is_palindrome(int n) {
    // 负数不是回文数（约定）
    if (n < 0) return 0;

    int original = n;           // 保存原始值（后面翻转时 n 会变）
    int reversed = 0;           // 存储翻转后的数字

    // 核心算法：逐位取出，构建翻转数
    while (n > 0) {
        int digit = n % 10;             // 取出最后一位
        reversed = reversed * 10 + digit; // 拼接到翻转数的末尾
        n = n / 10;                     // 去掉最后一位
    }
    // 举个具体例子跟踪：
    // n=121: digit=1 → reversed=1, n=12
    // n=12:  digit=2 → reversed=12, n=1
    // n=1:   digit=1 → reversed=121, n=0
    // n=0:   循环结束，reversed=121

    return original == reversed;  // 比较，相等则返回 1
}

int main() {
    // 测试几组数据
    int test_cases[] = {121, 12321, 123, 1001, 9999, 12345};
    int num_tests = 6;

    for (int i = 0; i < num_tests; i++) {
        int n = test_cases[i];
        if (is_palindrome(n)) {
            printf("%d ✅ 是回文数\n", n);
        } else {
            printf("%d ❌ 不是回文数\n", n);
        }
    }

    return 0;
}

/* 输出：
121 ✅ 是回文数
12321 ✅ 是回文数
123 ❌ 不是回文数
1001 ✅ 是回文数
9999 ✅ 是回文数
12345 ❌ 不是回文数
*/
```

**关键知识点**：函数接收了一个 `int`，返回一个 `int`（1=是，0=否）。这种"判断型"函数的命名习惯是 `is_xxx`。

---

## 练习 2：计算 BMI 与健康分类（难度：★☆☆☆☆）

**任务**：写两个函数——一个计算 BMI（Body Mass Index，身体质量指数），一个根据 BMI 值判断体重类别。

**公式**：`BMI = 体重(kg) / 身高(m)²`

### 代码实现

```c
#include <stdio.h>

/**
 * 计算 BMI
 * @param weight_kg  体重，单位：千克
 * @param height_m   身高，单位：米
 * @return           BMI 值
 */
float calc_bmi(float weight_kg, float height_m) {
    // 输入合法性检查：身高不能为 0 或负数
    if (height_m <= 0) {
        printf("错误：身高必须大于 0！\n");
        return -1.0f;                   // 用 -1 表示计算出错
    }
    return weight_kg / (height_m * height_m);
}

/**
 * 根据 BMI 返回体重类别描述
 * @param bmi  BMI 值
 * @return     类别描述字符串
 *
 * 世界卫生组织 (WHO) 标准：
 *   < 18.5   偏瘦
 *   18.5-24.9 正常
 *   25.0-29.9 超重
 *   >= 30    肥胖
 */
const char* bmi_category(float bmi) {
    if (bmi < 0) {
        return "数据无效";
    } else if (bmi < 18.5f) {
        return "偏瘦 — 需要加强营养";
    } else if (bmi < 25.0f) {
        return "正常 — 继续保持";
    } else if (bmi < 30.0f) {
        return "超重 — 建议多运动";
    } else {
        return "肥胖 — 建议咨询医生";
    }
}

int main() {
    // 测试三个不同体格的人
    printf("=== BMI 计算器 ===\n\n");

    // 案例 1：偏瘦
    float weight1 = 45.0f, height1 = 1.65f;
    float bmi1 = calc_bmi(weight1, height1);
    printf("体重 %.1f kg, 身高 %.2f m\n", weight1, height1);
    printf("BMI = %.1f → %s\n\n", bmi1, bmi_category(bmi1));

    // 案例 2：正常
    float weight2 = 65.0f, height2 = 1.75f;
    float bmi2 = calc_bmi(weight2, height2);
    printf("体重 %.1f kg, 身高 %.2f m\n", weight2, height2);
    printf("BMI = %.1f → %s\n\n", bmi2, bmi_category(bmi2));

    // 案例 3：超重
    float weight3 = 85.0f, height3 = 1.70f;
    float bmi3 = calc_bmi(weight3, height3);
    printf("体重 %.1f kg, 身高 %.2f m\n", weight3, height3);
    printf("BMI = %.1f → %s\n\n", bmi3, bmi_category(bmi3));

    return 0;
}
```

**关键知识点**：一个函数做"计算"，另一个函数做"分类"。各司其职，互不干扰。如果以后 BMI 标准改了，只需要改 `bmi_category` 一个函数。

---

## 练习 3：凯撒密码加密（难度：★★☆☆☆）

**任务**：写一个凯撒密码（Caesar Cipher）的加密函数。每个字母向后移动固定位数——如果超出 `z`，就绕回到 `a`。

**原理图解：**

```
原始字母:  A  B  C  D  E  F  G  H  ...  X  Y  Z
移位 +3:   D  E  F  G  H  I  J  K  ...  A  B  C
              ↑                             ↑
           往后移 3 位                  超出 Z 绕回 A

以 "abc" shift=3 为例：
  a → a+3 → d
  b → b+3 → e
  c → c+3 → f
  结果："def"

以 "xyz" shift=3 为例：
  x → (x+3 超出 z) → 绕回 → a
  y → (y+3 超出 z) → 绕回 → b
  z → (z+3 超出 z) → 绕回 → c
  结果："abc"
```

### 代码实现（逐行注解）

```c
#include <stdio.h>

/**
 * 对单个字符进行凯撒加密
 * @param ch     待加密的字符
 * @param shift  位移量（正数向右移，负数向左移）
 * @return       加密后的字符
 *
 * 注意：只处理英文字母，非字母字符原样返回
 */
char caesar_encrypt(char ch, int shift) {
    // 处理大写字母 A-Z (ASCII: 65-90)
    if (ch >= 'A' && ch <= 'Z') {
        // 关键公式分解：
        // 1. ch - 'A'     → 将字母转为 0-25 的数字
        // 2. + shift       → 加上位移量
        // 3. % 26          → 取模运算，实现循环（29%26=3，回到 D）
        // 4. + 'A'         → 转回 ASCII 字母
        return 'A' + (ch - 'A' + shift) % 26;
    }

    // 处理小写字母 a-z (ASCII: 97-122)
    if (ch >= 'a' && ch <= 'z') {
        return 'a' + (ch - 'a' + shift) % 26;
    }

    // 非字母字符（数字、空格、标点）原样返回
    return ch;
}

/**
 * 加密一个完整的字符串
 * @param input   输入字符串（只读）
 * @param output  输出字符串（由调用者提供缓冲区）
 * @param shift   位移量
 *
 * 注意：output 必须有足够空间容纳 input 的所有字符 + '⧵0'
 */
void encrypt_string(const char* input, char* output, int shift) {
    int i = 0;
    while (input[i] != '\0') {           // 遍历到字符串结尾
        output[i] = caesar_encrypt(input[i], shift);
        i++;
    }
    output[i] = '\0';                    // 不要忘了结尾的 '\0'！
}

int main() {
    // 准备测试
    char encrypted[100];                 // 预分配输出缓冲区

    printf("=== 凯撒密码加密器 ===\n\n");

    // 测试 1：基本加密
    encrypt_string("Hello World", encrypted, 3);
    printf("'Hello World' shift=3  → '%s'\n", encrypted);

    // 测试 2：末尾字母绕回
    encrypt_string("xyz", encrypted, 3);
    printf("'xyz' shift=3          → '%s'\n", encrypted);

    // 测试 3：保留非字母
    encrypt_string("C-2024!", encrypted, 5);
    printf("'C-2024!' shift=5      → '%s'\n", encrypted);

    // 测试 4：负位移（向左移 = 解密）
    encrypt_string("Khoor", encrypted, -3);
    printf("'Khoor' shift=-3       → '%s' (解密后)\n", encrypted);

    return 0;
}

/* 输出：
=== 凯撒密码加密器 ===

'Hello World' shift=3  → 'Khoor Zruog'
'xyz' shift=3          → 'abc'
'C-2024!' shift=5      → 'H-2024!'
'Khoor' shift=-3       → 'Hello' (解密后)
*/
```

**关键知识点**：
- 用 `% 26` 模运算实现"环状"字母表
- `encrypt_string` 调用 `caesar_encrypt` —— 函数调用函数的例子
- 负位移等于解密：`caesar_encrypt(ch, -shift)` 可以把密文变回明文

---

## 练习 4：函数指针版计算器（难度：★★☆☆☆）

**任务**：用函数指针数组实现一个计算器，根据用户选择调用不同的运算函数。

**什么是函数指针？** 普通指针存数据的地址，函数指针存函数的地址。有了函数指针，你可以像传递数据一样传递函数。

```
普通变量：  int x = 5;          → x 装了数值 5
普通指针：  int *p = &x;        → p 装了 x 的地址
函数指针：  int (*op)(int,int)  → op 装了函数的地址
```

### 代码实现

```c
#include <stdio.h>

// ===== 四个运算函数 =====
// 每个都有相同的签名：返回 double，接受两个 double
double add(double a, double b)      { return a + b; }
double subtract(double a, double b)  { return a - b; }
double multiply(double a, double b)  { return a * b; }
double divide(double a, double b)    {
    if (b == 0.0) {
        printf("警告：除数为 0，返回 0\n");
        return 0.0;
    }
    return a / b;
}

int main() {
    // ===== 函数指针数组 =====
    // 数组里装的是四个函数的地址
    // 语法：double (*ops[4])(double, double)
    //        ↑返回类型 ↑数组名[大小]↑参数类型
    double (*ops[4])(double, double) = {
        add,       // ops[0] 指向 add
        subtract,  // ops[1] 指向 subtract
        multiply,  // ops[2] 指向 multiply
        divide     // ops[3] 指向 divide
    };

    // 对应的操作符字符
    char symbols[] = {'+', '-', '*', '/'};

    printf("=== 函数指针计算器 ===\n\n");

    double a, b;
    int choice;

    printf("请输入第一个数: ");
    scanf("%lf", &a);

    printf("请输入第二个数: ");
    scanf("%lf", &b);

    printf("\n选择运算:\n");
    printf("  0: 加法 (+)\n");
    printf("  1: 减法 (-)\n");
    printf("  2: 乘法 (*)\n");
    printf("  3: 除法 (/)\n");
    printf("请输入选择 (0-3): ");
    scanf("%d", &choice);

    if (choice >= 0 && choice <= 3) {
        // 关键：通过数组下标调用函数！
        // ops[choice] 是函数指针，ops[choice](a, b) 就是调用它指向的函数
        double result = ops[choice](a, b);
        printf("\n%.2f %c %.2f = %.2f\n", a, symbols[choice], b, result);
    } else {
        printf("无效选择！\n");
    }

    return 0;
}

/* 运行示例：
请输入第一个数: 10
请输入第二个数: 3

选择运算:
  0: 加法 (+)
  1: 减法 (-)
  2: 乘法 (*)
  3: 除法 (/)
请输入选择 (0-3): 2

10.00 * 3.00 = 30.00
*/
```

**关键知识点**：
- 函数指针语法：`返回类型 (*指针名)(参数类型列表)`
- 四个函数的签名必须一致才能放进同一个数组
- `ops[choice](a, b)` —— 看起来奇怪，但这就是调用函数指针指向的函数

---

## 练习 5：递归 —— 理解函数调用自身（难度：★★★☆☆）

**任务**：用递归实现阶乘计算，理解"函数自己调用自己"的工作原理。

**生活类比**：想象你站在一面镜子前，身后又是一面镜子——你在镜子里看到镜子里的镜子里的镜子……无限嵌套。递归就是这样的"镜中镜"，但它有一个终止条件——就像走到某层镜子里说"好了，就到这里"。

### 代码实现一：阶乘（经典递归入门）

```c
#include <stdio.h>

/**
 * 递归计算阶乘 n! = n × (n-1) × (n-2) × ... × 1
 * 终止条件：0! = 1, 1! = 1
 */
int factorial(int n) {
    // 终止条件（最重要！没有它就会无限递归）
    if (n <= 1) {
        return 1;              // 0! = 1, 1! = 1
    }
    // 递归公式：n! = n × (n-1)!
    return n * factorial(n - 1);
}
/*
  调用追踪（以 factorial(4) 为例）：
  factorial(4)
    → 4 × factorial(3)
         → 3 × factorial(2)
              → 2 × factorial(1)
                   → return 1       ← 终止！开始回传
              → 2 × 1 = 2           ← 回传
         → 3 × 2 = 6                ← 回传
    → 4 × 6 = 24                    ← 最终结果
*/

int main() {
    printf("=== 递归阶乘 ===\n\n");
    for (int i = 0; i <= 6; i++) {
        printf("%d! = %d\n", i, factorial(i));
    }
    return 0;
}
```

**递归的两个必要条件：**
1. **终止条件**（base case）：让递归停下来（`n <= 1`）
2. **递推公式**（recursive step）：将大问题分解成更小的同类问题（`n × factorial(n-1)`）

### 代码实现二：汉诺塔（经典递归进阶）

传说印度寺庙里，僧侣们日夜移动 64 个金盘，当全部移完时，世界就会毁灭。读完这个程序你就理解为什么——即使每秒移动 1 个盘子，也需要 2^64 - 1 ≈ 5800 亿年！

```
汉诺塔规则：
  - 有三根柱子 A、B、C
  - A 柱上有 n 个大小不一的盘子（小的在上，大的在下）
  - 目标：把所有盘子从 A 移到 C
  - 规则 1：每次只能移动一个盘子
  - 规则 2：大盘子不能放在小盘子上面
  - 规则 3：可以用 B 作为中转站
```

```c
#include <stdio.h>

/**
 * 递归解决汉诺塔问题
 * @param n     盘子数量
 * @param from  起始柱子
 * @param to    目标柱子
 * @param aux   辅助柱子（中转站）
 *
 * 递推思路：
 *   要把 n 个盘子从 from 移到 to：
 *     第 1 步：把上面 n-1 个盘子从 from 移到 aux（用 to 做中转）
 *     第 2 步：把最底下第 n 个盘子从 from 移到 to
 *     第 3 步：把 n-1 个盘子从 aux 移到 to（用 from 做中转）
 */
void hanoi(int n, char from, char to, char aux) {
    if (n == 1) {
        // 终止条件：只有一个盘子，直接移过去
        printf("盘子 1: %c → %c\n", from, to);
        return;
    }
    // 第 1 步：上面 n-1 个：from → aux（to 中转）
    hanoi(n - 1, from, aux, to);
    // 第 2 步：最底下那个：from → to
    printf("盘子 %d: %c → %c\n", n, from, to);
    // 第 3 步：n-1 个：aux → to（from 中转）
    hanoi(n - 1, aux, to, from);
}

int main() {
    int n = 3;
    printf("=== 汉诺塔 (%d 层) ===\n\n", n);
    printf("开始移动：\n");
    hanoi(n, 'A', 'C', 'B');
    printf("\n全部移动完成！共 %d 步\n", (1 << n) - 1);  // 2^n - 1
    return 0;
}

/* 输出 (n=3)：
=== 汉诺塔 (3 层) ===

开始移动：
盘子 1: A → C
盘子 2: A → B
盘子 1: C → B
盘子 3: A → C
盘子 1: B → A
盘子 2: B → C
盘子 1: A → C

全部移动完成！共 7 步
*/
```

**递归思维的核心**：
- 不要试图在脑子里展开所有调用层（你会疯的）
- 相信递归会正确解决规模更小的子问题
- 你只需要定义：终止条件 + 如何把大问题变成小问题

---

## 练习 6：综合 —— 猜数字游戏（难度：★★☆☆☆）

**任务**：综合运用循环、函数、随机数，做一个完整的猜数字游戏。

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// 游戏配置
#define MIN_NUMBER 1
#define MAX_NUMBER 100
#define MAX_ATTEMPTS 10

// 生成 1-100 的随机数
int generate_secret() {
    return rand() % (MAX_NUMBER - MIN_NUMBER + 1) + MIN_NUMBER;
}

// 显示欢迎界面
void show_welcome() {
    printf("╔══════════════════════╗\n");
    printf("║   猜数字游戏 (1-100)  ║\n");
    printf("║   你有 %d 次机会       ║\n", MAX_ATTEMPTS);
    printf("╚══════════════════════╝\n\n");
}

// 获取用户的猜测
int get_guess() {
    int guess;
    printf("请输入你猜的数字: ");
    scanf("%d", &guess);
    return guess;
}

// 判断猜测结果
// 返回：1=猜对了，0=小了，2=大了
int check_guess(int guess, int secret) {
    if (guess == secret) return 1;       // 猜对了！
    if (guess < secret)  return 0;       // 太小了
    return 2;                            // 太大了
}

// 显示帮助提示
void show_hint(int result, int guess) {
    if (result == 0) {
        printf("📉 太小了！往上猜。\n");
    } else if (result == 2) {
        printf("📈 太大了！往下猜。\n");
    }
}

// 显示胜利信息
void show_win(int attempts) {
    printf("\n🎉 恭喜！你猜对了！\n");
    printf("你用了 %d 次机会。\n", attempts);
    if (attempts <= 3) {
        printf("评价：神级直觉！\n");
    } else if (attempts <= 6) {
        printf("评价：很不错！\n");
    } else {
        printf("评价：险胜，下次加油！\n");
    }
}

// 显示失败信息
void show_lose(int secret) {
    printf("\n😢 机会用完了！\n");
    printf("正确答案是：%d\n", secret);
}

int main() {
    srand((unsigned int)time(NULL));  // 初始化随机种子

    int play_again = 1;
    while (play_again) {
        int secret = generate_secret();
        show_welcome();

        int attempts = 0;
        int guessed = 0;              // 0=没猜到, 1=猜到了

        while (attempts < MAX_ATTEMPTS && !guessed) {
            printf("\n剩余机会: %d\n", MAX_ATTEMPTS - attempts);
            int guess = get_guess();
            attempts++;

            int result = check_guess(guess, secret);
            if (result == 1) {
                guessed = 1;
                show_win(attempts);
            } else {
                show_hint(result, guess);
            }
        }

        if (!guessed) {
            show_lose(secret);
        }

        printf("\n再玩一局？(1=再来, 0=退出): ");
        scanf("%d", &play_again);
    }

    printf("谢谢游玩，再见！\n");
    return 0;
}
```

**这个综合练习展示了什么**：每个函数只做一件事（生成数字、显示界面、获取输入、判断结果……），`main()` 只负责把这些积木搭起来。

---

## 设计好函数的四个原则

```
原则 1: 单一职责             原则 2: 见名知义
┌──────────────────┐       ┌──────────────────┐
│ 一个函数只做一件事  │       │ 名字描述它做什么   │
│ calc_bmi() 只计算  │       │ count_words() ✅ │
│ 不负责显示和输入   │       │ f1()         ❌ │
└──────────────────┘       └──────────────────┘

原则 3: 短小精悍             原则 4: 输入输出清晰
┌──────────────────┐       ┌──────────────────┐
│ 超过 30 行考虑拆分 │       │ 参数尽量少（≤4个） │
│ 理想：10-20 行    │       │ 返回值明确       │
│                  │       │ 避免"副作用"     │
└──────────────────┘       └──────────────────┘
```

---

## 常见错误诊所

### 错误 1：把所有代码塞在 main 里

```c
// ❌ "黏土式"写法
int main() {
    // 200 行代码揉在一起……
    // 判断素数、算面积、打印菜单、处理输入……
    // 改一个地方，整个程序都可能崩
}

// ✅ "乐高式"写法
int is_prime(int n) { ... }
double calc_area(double r) { ... }
void show_menu() { ... }

int main() {
    // 只做组装，10 行以内
}
```

### 错误 2：函数做了太多事

```c
// ❌ 一个函数又计算又打印又输入
int process() {
    int x;
    scanf("%d", &x);         // 做了输入
    int result = x * x;      // 做了计算
    printf("%d\n", result);  // 做了输出
    return result;           // 又返回 —— 到底想干嘛？
}

// ✅ 分开：各司其职
int get_input() { int x; scanf("%d", &x); return x; }
int square(int x) { return x * x; }
void show_result(int r) { printf("%d\n", r); }
```

### 错误 3：递归忘记终止条件

```c
// ❌ 危险：没有终止条件，无限递归 → 栈溢出 → 程序崩溃
int bad_factorial(int n) {
    return n * bad_factorial(n - 1);  // 永远不会停！
}

// ✅ 必须有终止条件
int good_factorial(int n) {
    if (n <= 1) return 1;             // ← 终止条件
    return n * good_factorial(n - 1);
}
```

---

## 动手实践建议

1. **从模仿开始**：先把书上的例子照着敲一遍，理解每一行
2. **修改小细节**：改改参数、改改返回值，看看效果
3. **自问自答**："如果我把 `return` 删掉会怎样？"——然后试试
4. **渐进式挑战**：会写判断素数了？试试判断完全数。会凯撒密码了？试试维吉尼亚密码。
5. **先画流程图再写代码**：用纸笔画出函数调用的先后顺序

---

## 要点速查

| 知识点 | 一句话 |
|--------|--------|
| 单一职责原则 | 一个函数只做一件事，把它做好 |
| 函数签名 | 返回类型 + 函数名 + 参数列表，是函数的"身份证" |
| 函数指针 | `返回类型 (*名)(参数)`，可以像数据一样传递函数 |
| 递归 | 函数调用自身；必须有终止条件 |
| 模块化思维 | 把大问题拆成小函数，main() 只做组装 |

> **最重要的练习**：关掉这篇文章，打开你的编译器，从头写 3 个函数。不用完美，写出来就行。编程是**练**会的，不是看会的。
