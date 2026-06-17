---
category: "C语言教程"
title: "结构体基础 — 创建自己的数据类型"
description: "C语言学习教程"
slug: "structs-intro"
level: 7
order: 1
tags: ["struct", "结构体", "typedef", "自定义类型"]
---

# 结构体基础 — 创建自己的数据类型

## 从一个真实场景说起

假设你是班主任，需要管理全班 40 个学生的信息。每个学生有：姓名、学号、年龄、语文成绩、数学成绩、英语成绩。

**如果没有结构体**，你只能这样写：

```c
char  name1[20], name2[20], name3[20];  // 40 个名字……
int   id1, id2, id3;                     // 40 个学号……
int   age1, age2, age3;                  // 40 个年龄……
float chinese1, chinese2, chinese3;       // 40 个语文成绩……
float math1, math2, math3;                // 40 个数学成绩……
float english1, english2, english3;        // 40 个英语成绩……
// 共 6 × 40 = 240 个变量！写到崩溃！
```

更糟的是，当你想把"一个学生的全部信息"传给函数时，你得传 6 个参数——顺序还不能错。这根本没法维护。

**用结构体**，世界就清爽了：

```c
struct Student {
    char  name[20];
    int   id;
    int   age;
    float chinese;
    float math;
    float english;
};

struct Student class[40];  // 一个数组，搞定全班！
```

结构体的本质是：**把描述同一个事物的一组相关数据打包成一个整体**。就像现实世界中，一个学生的档案表（姓名、学号、年龄、成绩）是一张纸，不会被拆成六张纸条。

## 定义结构体类型

```c
struct 结构体名 {
    类型1 成员1;
    类型2 成员2;
    // ...
};  // 注意：这里必须有分号！
```

完整示例：

```c
struct Student {
    char name[20];    // 姓名：字符数组
    int  id;          // 学号：整数
    int  age;         // 年龄：整数
    float chinese;    // 语文成绩：浮点数
    float math;       // 数学成绩：浮点数
    float english;    // 英语成绩：浮点数
};
```

这行代码**并不创建任何变量**，只是告诉编译器："以后有一种新类型叫 `struct Student`，它长这样。"

## 声明结构体变量

定义完类型后，声明变量就像使用 `int`、`float` 一样：

```c
struct Student s1;           // 声明一个变量
struct Student s2, s3;       // 同时声明多个
struct Student class[40];    // 声明一个数组
```

也可以在定义类型的同时声明变量：

```c
struct Point {
    int x;
    int y;
} p1, p2;  // 同时声明 p1 和 p2
```

## 访问成员：`.` 运算符

用点号 `.` 来访问结构体的"内部小格子"：

```c
#include <stdio.h>
#include <string.h>

struct Student {
    char name[20];
    int  id;
    int  age;
    float chinese;
    float math;
    float english;
};

int main() {
    struct Student s1;

    // 字符串不能直接赋值，用 strcpy
    strcpy(s1.name, "张三");
    s1.id      = 2024001;
    s1.age     = 18;
    s1.chinese = 92.5;
    s1.math    = 88.0;
    s1.english = 95.5;

    // 计算平均分
    float avg = (s1.chinese + s1.math + s1.english) / 3.0;

    printf("姓名：%s\n", s1.name);
    printf("学号：%d\n", s1.id);
    printf("年龄：%d\n", s1.age);
    printf("语文：%.1f  数学：%.1f  英语：%.1f\n",
           s1.chinese, s1.math, s1.english);
    printf("平均分：%.1f\n", avg);

    return 0;
}
```

输出：

```
姓名：张三
学号：2024001
年龄：18
语文：92.5  数学：88.0  英语：95.5
平均分：92.0
```

### `.` 的本质：给每个小格子起个名字

可以这样理解：`s1.name` 就是 `s1` 这个大格子里，贴了 "name" 标签的那个小格子。赋值 `s1.age = 18` 就是往那个小格子里放数字 18。

## 结构体的三种初始化方式

### 方式一：按定义顺序初始化

```c
struct Student s1 = {"张三", 2024001, 18, 92.5, 88.0, 95.5};
```

花括号里的值**顺序必须和结构体定义时成员出现的顺序一致**。如果成员很多，容易写错位置。

### 方式二：指定成员名初始化（C99，推荐）

```c
struct Student s1 = {
    .name    = "张三",
    .id      = 2024001,
    .chinese = 92.5,
    .math    = 88.0,
    .english = 95.5,
    .age     = 18          // 顺序随便，想先写哪个写哪个
};
```

不指定的成员会被自动初始化为 `0`（或 `0.0`、`'\0'`）。所以：

```c
struct Student s2 = {.name = "李四"};  // 其他成员全为 0
```

### 方式三：声明后逐个赋值

```c
struct Student s3;
strcpy(s3.name, "王五");
s3.id      = 2024002;
s3.age     = 19;
s3.chinese = 78.0;
s3.math    = 85.5;
s3.english = 80.0;
```

## typedef — 告别重复的 `struct`

每次声明变量都要写 `struct Student`，两个单词很啰嗦。`typedef` 给类型起个别名：

```c
// 原来的写法
struct Student { ... };
struct Student s1;  // 每次都要写 struct

// 用 typedef
typedef struct {
    char name[20];
    int  id;
    int  age;
} Student;

Student s1, s2;  // 简洁！和 int、float 一样自然
```

### typedef 的两种惯用形式

```c
// 形式 1：匿名结构体 + typedef（最常用）
typedef struct {
    int x;
    int y;
} Point;

// 形式 2：先定义结构体，再 typedef（需要自引用时用）
typedef struct Node {
    int data;
    struct Node *next;  // 这里还不能用 Node，因为 typedef 还没完成
} Node;
```

**初学者建议**：先用形式 1，等学到链表时自然会遇到形式 2。

## 结构体数组 — 管理整个班级

有了 `typedef`，创建学生数组就很自然了：

```c
#include <stdio.h>
#include <string.h>

typedef struct {
    char name[20];
    int  id;
    int  age;
    float chinese;
    float math;
    float english;
} Student;

int main() {
    // 全班 40 人，但示例用 3 人
    Student class[3] = {
        {"张三", 2024001, 18, 92.5, 88.0, 95.5},
        {"李四", 2024002, 19, 78.0, 85.5, 80.0},
        {"王五", 2024003, 18, 65.0, 72.0, 68.5},
    };

    // 遍历：打印每个人信息
    printf("===== 全班学生信息 =====\n");
    for (int i = 0; i < 3; i++) {
        float avg = (class[i].chinese + class[i].math + class[i].english) / 3.0;
        printf("%d. %s (学号%d, %d岁)  平均分：%.1f\n",
               i + 1,
               class[i].name,
               class[i].id,
               class[i].age,
               avg);
    }

    return 0;
}
```

输出：

```
===== 全班学生信息 =====
1. 张三 (学号2024001, 18岁)  平均分：92.0
2. 李四 (学号2024002, 19岁)  平均分：81.2
3. 王五 (学号2024003, 18岁)  平均分：68.5
```

### 思考：`class[i].name` 怎么读？

从左往右：`class` 是数组 → `class[i]` 是第 i 个元素（一个 `Student` 结构体）→ `class[i].name` 是这个结构体的 `name` 成员。C 语言的点号就是一层层往里剥。

## 嵌套结构体 — 一个结构体里装着另一个

生日是一个"日期"——它本身有年、月、日三个小部分。可以先定义一个 `Date` 结构体，再把它作为 `Student` 的成员：

```c
#include <stdio.h>

// 先定义日期类型
typedef struct {
    int year;
    int month;
    int day;
} Date;

// 再把 Date 作为 Student 的成员
typedef struct {
    char    name[20];
    int     id;
    Date    birthday;     // 嵌套！一个 Date 结构体
    float   chinese;
    float   math;
    float   english;
} Student;

int main() {
    Student s1 = {
        .name     = "张三",
        .id       = 2024001,
        .birthday = {2005, 6, 15},  // 花括号嵌套
        .chinese  = 92.5,
        .math     = 88.0,
        .english  = 95.5,
    };

    // 两层点号访问
    printf("姓名：%s\n", s1.name);
    printf("生日：%d年%d月%d日\n",
           s1.birthday.year,    // s1 的 birthday 成员的 year 子成员
           s1.birthday.month,   // s1 的 birthday 成员的 month 子成员
           s1.birthday.day);    // s1 的 birthday 成员的 day 子成员

    return 0;
}
```

嵌套结构体就像是"表格里套表格"——学生档案表里有一个日期栏，日期栏本身又有三个小格子。

## 结构体与函数

### 按值传递：复制一份副本

```c
#include <stdio.h>
#include <string.h>

typedef struct {
    char name[20];
    int  age;
} Student;

// 参数是结构体本身（不是指针）
void grow_up(Student s) {
    s.age += 1;                      // 修改的是副本！
    printf("函数内部：%s %d岁\n", s.name, s.age);
}

int main() {
    Student s1 = {"张三", 18};
    grow_up(s1);                     // 张三 19岁
    printf("函数外部：%s %d岁\n", s1.name, s1.age);
    // 输出：张三 18岁   ← 根本没变！
    return 0;
}
```

`grow_up` 接收到的是 `s1` 的一个**完整复制品**。修改复制品不影响原件——就像复印了一份表格，你在复印件上涂改，原件纹丝不动。

**缺点**：如果结构体很大（几百字节），复制整个结构体开销大、速度慢。

### 按地址传递：指针指向原件

```c
void grow_up_pointer(Student *s) {
    s->age += 1;                     // 通过指针修改原件！
    printf("函数内部：%s %d岁\n", s->name, s->age);
}

int main() {
    Student s1 = {"张三", 18};
    grow_up_pointer(&s1);            // 传地址
    printf("函数外部：%s %d岁\n", s1.name, s1.age);
    // 输出：张三 19岁   ← 真的变了！
    return 0;
}
```

关于 `->` 运算符：（下一课会展开讲）

| 写法 | 含义 | 使用场景 |
|------|------|---------|
| `s.age` | 直接访问成员 | `s` 是结构体变量 |
| `(*s).age` | 先解引用再访问 | `s` 是指针（麻烦） |
| `s->age` | 等价于 `(*s).age` | `s` 是指针（推荐） |

## sizeof — 结构体在内存中占多大？

```c
#include <stdio.h>

typedef struct {
    char name[20];   // 20 字节
    int  id;         // 4 字节
    int  age;        // 4 字节
    float chinese;   // 4 字节
    float math;      // 4 字节
    float english;   // 4 字节
} Student;

int main() {
    printf("sizeof(Student) = %zu 字节\n", sizeof(Student));
    return 0;
}
```

你可能会想：20 + 4 + 4 + 4 + 4 + 4 = 40 字节，对吗？

实际输出可能是 **40**，也可能是 **44** 甚至 **48**——原因在于编译器的"内存对齐"。

### 什么是内存对齐？

CPU 读取内存时，不是逐字节读，而是每次读一块（比如 4 字节一块）。如果一个 4 字节的 `int` 横跨两块，CPU 就得读两次才能拼出一个完整的 `int`——效率降低。

因此，编译器会在结构体成员之间**插入一些"空白填充字节"**（padding），让每个成员的起始地址都是它大小（或 4 字节）的整数倍。

```
内存布局示意（假设 int 和 float 都是 4 字节对齐）：
┌──────────────────────┐
│ name[20]   20 字节   │ 偏移 0  ~ 19
├──────────────────────┤
│ (padding)  0 字节    │ 偏移 20 ~ 23  (刚好对齐到 4 的倍数)
├──────────────────────┤
│ id          4 字节   │ 偏移 24 ~ 27
├──────────────────────┤
│ age         4 字节   │ 偏移 28 ~ 31
├──────────────────────┤
│ chinese     4 字节   │ 偏移 32 ~ 35
├──────────────────────┤
│ math        4 字节   │ 偏移 36 ~ 39
├──────────────────────┤
│ english     4 字节   │ 偏移 40 ~ 43
└──────────────────────┘
总计：44 字节（含 4 字节填充）
```

**初学者不用纠结对齐细节**，知道三件事就够了：
1. `sizeof(结构体)` 可能比你手工算的大一点，这是正常的。
2. 用 `sizeof` 而不是手算，就不会出错。
3. 把大成员放在前面可以在某些平台上减少填充（后面学数据结构时会讲到）。

## 实战练习：简易学生成绩管理

综合以上知识，写一个完整可运行的程序：

```c
#include <stdio.h>
#include <string.h>

#define MAX_STUDENTS 100

// 日期类型
typedef struct {
    int year;
    int month;
    int day;
} Date;

// 学生类型：嵌套了 Date
typedef struct {
    char  name[20];
    int   id;
    Date  birthday;
    float chinese;
    float math;
    float english;
} Student;

// ===== 工具函数 =====

// 计算三科平均分
float get_average(const Student *s) {
    return (s->chinese + s->math + s->english) / 3.0;
}

// 打印单个学生
void print_student(const Student *s) {
    float avg = get_average(s);
    printf("  %s | 学号:%d | 生日:%d/%d/%d | 语文:%.1f 数学:%.1f 英语:%.1f | 平均:%.1f\n",
           s->name,
           s->id,
           s->birthday.year, s->birthday.month, s->birthday.day,
           s->chinese, s->math, s->english,
           avg);
}

// 打印全班
void print_all(const Student arr[], int count) {
    printf("\n========== 全班学生信息 (%d人) ==========\n", count);
    for (int i = 0; i < count; i++) {
        printf("[%d]", i + 1);
        print_student(&arr[i]);
    }
}

// 查找最高分的学生
int find_best(const Student arr[], int count) {
    int best_index = 0;
    float best_avg = get_average(&arr[0]);
    for (int i = 1; i < count; i++) {
        float avg = get_average(&arr[i]);
        if (avg > best_avg) {
            best_avg = avg;
            best_index = i;
        }
    }
    return best_index;
}

// 计算全班总平均
float class_average(const Student arr[], int count) {
    float total = 0.0;
    for (int i = 0; i < count; i++) {
        total += get_average(&arr[i]);
    }
    return total / count;
}

int main() {
    Student students[MAX_STUDENTS];
    int count = 0;

    // 添加几个学生（模拟从键盘输入）
    students[count++] = (Student){
        .name = "张三", .id = 2024001,
        .birthday = {2005, 6, 15},
        .chinese = 92.5, .math = 88.0, .english = 95.5
    };
    students[count++] = (Student){
        .name = "李四", .id = 2024002,
        .birthday = {2005, 3, 22},
        .chinese = 78.0, .math = 85.5, .english = 80.0
    };
    students[count++] = (Student){
        .name = "王五", .id = 2024003,
        .birthday = {2006, 11, 8},
        .chinese = 65.0, .math = 72.0, .english = 68.5
    };
    students[count++] = (Student){
        .name = "赵六", .id = 2024004,
        .birthday = {2005, 9, 30},
        .chinese = 88.0, .math = 96.0, .english = 91.0
    };

    // 打印全班
    print_all(students, count);

    // 统计信息
    int best = find_best(students, count);
    printf("\n===== 统计 =====\n");
    printf("全班总平均分：%.1f\n", class_average(students, count));
    printf("最高分同学：%s (平均 %.1f)\n",
           students[best].name, get_average(&students[best]));

    return 0;
}
```

输出：

```
========== 全班学生信息 (4人) ==========
[1]  张三 | 学号:2024001 | 生日:2005/6/15 | 语文:92.0 数学:88.0 英语:95.5 | 平均:92.0
[2]  李四 | 学号:2024002 | 生日:2005/3/22 | 语文:78.0 数学:85.5 英语:80.0 | 平均:81.2
[3]  王五 | 学号:2024003 | 生日:2006/11/8 | 语文:65.0 数学:72.0 英语:68.5 | 平均:68.5
[4]  赵六 | 学号:2024004 | 生日:2005/9/30 | 语文:88.0 数学:96.0 英语:91.0 | 平均:91.7

===== 统计 =====
全班总平均分：83.3
最高分同学：张三 (平均 92.0)
```

## 常见错误

### 1. 忘了分号

```c
struct Student {
    char name[20];
    int age;
}   // ← 编译错误！必须加分号！
```

### 2. 对字符数组直接赋值

```c
struct Student s;
s.name = "张三";  // 编译错误！数组不能这样赋值
// 必须用 strcpy
strcpy(s.name, "张三");
```

### 3. 初始化顺序搞错

```c
struct Student { char name[20]; int age; float score; };
struct Student s = {18, "张三", 92.5};  // 逻辑错误！age 收到了字符串
```

## 要点速查

| 概念 | 说明 |
|------|------|
| `struct` | 定义复合数据类型的关键字 |
| `.` | 通过变量访问成员：`s.name` |
| `->` | 通过指针访问成员：`p->name` 等价于 `(*p).name` |
| `typedef` | 给类型起别名，避免反复写 `struct` |
| 结构体数组 | `Student class[40]`，每个元素是一个结构体 |
| 嵌套结构体 | 一个结构体的成员是另一个结构体 |
| `sizeof(结构体)` | 获取结构体实际占用的字节数（含对齐填充） |
| 传值 vs 传指针 | 传值安全但慢（复制整个结构体）；传指针快且能修改原件 |

结构体是 C 语言从"简单数据"迈向"组织化数据"的关键一步。掌握了结构体，你就能用程序模拟现实世界中的各种"表格"和"档案"。下一课，我们将深入结构体与指针的配合——这是链表、树等动态数据结构的基础。
