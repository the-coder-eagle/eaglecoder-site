---
category: "C语言教程"
title: "结构体与指针"
description: "C语言学习教程"
slug: "structs-and-pointers"
level: 7
order: 2
tags: ["结构体", "指针", "箭头运算符", "链表节点", "malloc"]
---

# 结构体与指针 — 动态数据结构的基础

结构体和指针的结合是 C 语言最强大的特性之一。上一课我们用结构体数组管理了 4 个学生，但如果学生人数不确定——可能 30 人，也可能 300 人——数组就显得笨拙了。指针让数据结构可以**动态增长、自由链接**，这正是链表、树、图等高级数据结构的基石。

## 温习：指向结构体的指针

```c
#include <stdio.h>

typedef struct {
    int x;
    int y;
} Point;

int main() {
    Point p  = {10, 20};   // 普通结构体变量
    Point *ptr = &p;       // 指向结构体的指针

    // 三种等价写法
    printf("x = %d\n", (*ptr).x);  // 解引用 + 点号：比较啰嗦
    printf("x = %d\n", ptr->x);    // 箭头运算符：推荐！
    // 永远不要写 *ptr.x，因为 . 优先级比 * 高，实际是 *(ptr.x)
    return 0;
}
```

### `->` 的本质

`ptr->member` 就是 `(*ptr).member` 的"语法糖"（写起来更甜的等价写法）。

```
ptr->name   ≡   (*ptr).name
ptr->age    ≡   (*ptr).age
ptr->score  ≡   (*ptr).score
```

为什么 `*ptr.x` 是错的？
- `.` 的优先级高于 `*`
- 所以 `*ptr.x` 被解析为 `*(ptr.x)`——把 `x` 当成指针解引用，完全牛头不对马嘴
- 必须写成 `(*ptr).x` 或用 `->`

**记忆口诀**：指针用箭头 `->`，变量用点号 `.`。永远不会错。

## 传值 vs 传指针 —— 深入对比

上一课我们提过，这里完整展开。

```c
#include <stdio.h>
#include <string.h>

typedef struct {
    char name[32];
    int  age;
    float score;
} Student;

// 方式 A：传值 —— 复制整个结构体
void print_student_value(Student s) {
    printf("  [传值] %s, %d岁, %.1f分\n", s.name, s.age, s.score);
}

// 方式 B：传指针 —— 只传 8 字节地址
void print_student_ptr(const Student *s) {
    printf("  [传指针] %s, %d岁, %.1f分\n", s->name, s->age, s->score);
}

// 方式 C：传值并修改 —— 不会影响原件！
void grow_up_wrong(Student s) {
    s.age += 1;  // 只改了副本
}

// 方式 D：传指针并修改 —— 真正修改原件
void grow_up_right(Student *s) {
    s->age += 1;  // 通过指针直接修改原件
}

int main() {
    Student s1 = {"张三", 18, 92.5};

    // 打印：两种方式都能正确打印
    print_student_value(s1);
    print_student_ptr(&s1);

    // 修改测试
    grow_up_wrong(s1);
    printf("错误方式后：%d岁 (没变)\n", s1.age);   // 仍是 18

    grow_up_right(&s1);
    printf("正确方式后：%d岁 (变了)\n", s1.age);    // 变为 19

    return 0;
}
```

### 什么时候传值、什么时候传指针？

| 情况 | 建议 | 原因 |
|------|------|------|
| 结构体很小（≤ 16 字节） | 传值也可以 | 开销不大 |
| 结构体较大（> 16 字节） | 传指针 `const` | 只传 8 字节地址，快得多 |
| 需要修改原结构体 | 必须传指针 | 传值改的是副本 |
| 只读取、不修改 | 传 `const` 指针 | 安全 + 高效 |
| 函数需要返回修改后的结构体 | 传指针直接改 | 避免返回大结构体的开销 |

**`const Student *s` 的含义**：`s` 是一个指针，指向的 `Student` 不能被修改。即"只读视角"。这样既能享受指针的轻量，又不会被意外修改数据。

## 动态分配结构体 —— `malloc`

数组的最大问题是"大小写死了"。`malloc` 让你在程序运行时按需创建结构体。

### 创建一个动态结构体

```c
#include <stdio.h>
#include <stdlib.h>   // malloc, free
#include <string.h>

typedef struct {
    char name[32];
    int  age;
    float score;
} Student;

int main() {
    // 在堆上分配一个 Student 大小的内存
    Student *s = (Student *)malloc(sizeof(Student));

    // 永远检查 malloc 是否成功！
    if (s == NULL) {
        printf("内存分配失败！\n");
        return 1;
    }

    // 像普通结构体指针一样使用
    strcpy(s->name, "动态学生");
    s->age   = 20;
    s->score = 88.5;

    printf("姓名：%s, 年龄：%d, 分数：%.1f\n",
           s->name, s->age, s->score);

    // 用完了必须归还！
    free(s);      // 释放内存
    s = NULL;     // 好习惯：把悬空指针置为 NULL

    return 0;
}
```

### 创建动态结构体数组

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char name[32];
    int  age;
    float score;
} Student;

int main() {
    int n;
    printf("请输入学生人数：");
    scanf("%d", &n);

    // 一次性分配 n 个 Student
    Student *class = (Student *)malloc(n * sizeof(Student));
    if (class == NULL) {
        printf("内存分配失败！可能是人数太多了。\n");
        return 1;
    }

    // 填充数据
    for (int i = 0; i < n; i++) {
        printf("第%d个学生 姓名：", i + 1);
        scanf("%s", class[i].name);   // class[i] 等价于 *(class + i)
        printf("        年龄：");
        scanf("%d", &class[i].age);
        printf("        分数：");
        scanf("%f", &class[i].score);
    }

    // 打印并计算平均
    printf("\n===== 全班学生 =====\n");
    float total = 0.0;
    for (int i = 0; i < n; i++) {
        printf("  %d. %s, %d岁, %.1f分\n",
               i + 1, class[i].name, class[i].age, class[i].score);
        total += class[i].score;
    }
    printf("全班平均分：%.1f\n", total / n);

    free(class);
    class = NULL;
    return 0;
}
```

**关键点**：`class[i]` 是对 `class + i` 的解引用——底层是指针运算，但对使用者来说和普通数组一模一样。

### 动态结构体指针数组

有时你需要单独创建每个学生：

```c
Student *roster[3];   // 3 个指针，每个可以指向一个学生

for (int i = 0; i < 3; i++) {
    roster[i] = (Student *)malloc(sizeof(Student));
    sprintf(roster[i]->name, "学生%d", i + 1);
    roster[i]->age   = 18 + i;
    roster[i]->score = 80.0 + i * 5.0;
}

// 使用时
for (int i = 0; i < 3; i++) {
    printf("%s\n", roster[i]->name);
}

// 释放时必须逐个释放
for (int i = 0; i < 3; i++) {
    free(roster[i]);
}
```

## 自引用结构体 —— 链表的起点

结构体里能不能包含一个"和自己同类型"的成员？不能——那会无限递归：

```c
struct Node {
    int data;
    struct Node next;  // 编译错误！！Node 里面又有一个 Node，里面又有一个……
};
```

但可以包含一个**指向同类型的指针**：

```c
typedef struct Node {
    int data;              // 数据域：存放"值"
    struct Node *next;     // 指针域：指向下一个节点
} Node;
```

这就是链表的"原子单位"——**节点（Node）**。

```
想象一串火车车厢：
┌──────┬────┐    ┌──────┬────┐    ┌──────┬────┐
│ 数据 │ 钩子│───>│ 数据 │ 钩子│───>│ 数据 │ NULL│
└──────┴────┘    └──────┴────┘    └──────┴────┘
  节点1             节点2             节点3
  head
```

每个车厢（节点）有两个部分：
- **数据域**（车斗里装的货）：存什么都可以——`int`、`char[]`、甚至另一个结构体
- **指针域**（车厢尾部的挂钩）：指向下一节车厢。最后一节挂空钩（`NULL`）

## 动手写一个单链表

### 创建链表

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct StudentNode {
    char  name[32];
    int   age;
    float score;
    struct StudentNode *next;   // 指向下一个学生节点
} StudentNode;

// 创建一个新学生节点
StudentNode *create_student(const char *name, int age, float score) {
    StudentNode *new_node = (StudentNode *)malloc(sizeof(StudentNode));
    if (new_node == NULL) {
        printf("内存分配失败！\n");
        return NULL;
    }
    strcpy(new_node->name, name);
    new_node->age   = age;
    new_node->score = score;
    new_node->next  = NULL;   // 新节点暂时没有后继
    return new_node;
}

int main() {
    // 创建三个学生节点
    StudentNode *head = create_student("张三", 18, 92.5);
    head->next        = create_student("李四", 19, 78.0);
    head->next->next  = create_student("王五", 18, 85.0);

    // 此时链表结构：
    // head ──> "张三" ──> "李四" ──> "王五" ──> NULL

    return 0;
}
```

### 遍历链表

```c
// 打印整个链表
void print_all(StudentNode *head) {
    StudentNode *current = head;   // 从头节点开始
    int index = 1;

    printf("===== 学生名单 =====\n");
    while (current != NULL) {
        printf("%d. %s, %d岁, %.1f分\n",
               index, current->name, current->age, current->score);
        current = current->next;   // 移动到下一个节点
        index++;
    }
    printf("===== 共 %d 人 =====\n", index - 1);
}

// 遍历示意图：
// 第1轮：current → ["张三", next→]  打印张三，current = next
// 第2轮：current → ["李四", next→]  打印李四，current = next
// 第3轮：current → ["王五", NULL ]  打印王五，current = NULL
// 第4轮：current == NULL，退出循环
```

### 在链表末尾添加节点

```c
// 在链表末尾追加一个新学生
void append_student(StudentNode *head, const char *name, int age, float score) {
    // 1. 先走到最后一个节点
    StudentNode *current = head;
    while (current->next != NULL) {
        current = current->next;
    }
    // 2. 创建新节点并挂在最后
    current->next = create_student(name, age, score);
}

// 使用：
// append_student(head, "赵六", 20, 91.0);
// 链表变成：张三 → 李四 → 王五 → 赵六 → NULL
```

### 删除节点

```c
// 删除第一个匹配名字的节点，返回新的头指针
StudentNode *delete_student(StudentNode *head, const char *name) {
    if (head == NULL) return NULL;

    // 特殊情况：要删除的是头节点
    if (strcmp(head->name, name) == 0) {
        StudentNode *new_head = head->next;  // 把头指针后移
        free(head);                          // 释放旧头节点
        return new_head;
    }

    // 一般情况：找到目标节点的前一个节点
    StudentNode *current = head;
    while (current->next != NULL) {
        if (strcmp(current->next->name, name) == 0) {
            StudentNode *to_delete = current->next;
            current->next = current->next->next;  // 跳过目标节点
            free(to_delete);
            return head;
        }
        current = current->next;
    }

    printf("没有找到 %s\n", name);
    return head;
}
```

### 释放整个链表

```c
void free_all(StudentNode *head) {
    StudentNode *current = head;
    while (current != NULL) {
        StudentNode *next = current->next;  // 先记下下一个
        free(current);                      // 释放当前
        current = next;                     // 移到下一个
    }
}

// 为什么不能直接 free(head) 然后没事了？
// free(head) 只释放头节点本身，后面的节点全变成"孤儿内存"——没人管但还占着空间，这就是内存泄漏。
```

### 完整的链表程序

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct StudentNode {
    char  name[32];
    int   age;
    float score;
    struct StudentNode *next;
} StudentNode;

StudentNode *create_student(const char *name, int age, float score) {
    StudentNode *node = (StudentNode *)malloc(sizeof(StudentNode));
    if (node == NULL) return NULL;
    strcpy(node->name, name);
    node->age   = age;
    node->score = score;
    node->next  = NULL;
    return node;
}

void append_student(StudentNode *head, const char *name, int age, float score) {
    StudentNode *current = head;
    while (current->next != NULL) {
        current = current->next;
    }
    current->next = create_student(name, age, score);
}

void print_all(StudentNode *head) {
    StudentNode *current = head;
    int index = 1;
    printf("\n===== 学生名单 =====\n");
    while (current != NULL) {
        printf("%d. %s | %d岁 | %.1f分\n",
               index++, current->name, current->age, current->score);
        current = current->next;
    }
    printf("=====================\n");
}

StudentNode *delete_student(StudentNode *head, const char *name) {
    if (head == NULL) return NULL;
    if (strcmp(head->name, name) == 0) {
        StudentNode *new_head = head->next;
        free(head);
        return new_head;
    }
    StudentNode *current = head;
    while (current->next != NULL) {
        if (strcmp(current->next->name, name) == 0) {
            StudentNode *to_delete = current->next;
            current->next = current->next->next;
            free(to_delete);
            return head;
        }
        current = current->next;
    }
    printf("未找到学生：%s\n", name);
    return head;
}

void free_all(StudentNode *head) {
    StudentNode *current = head;
    while (current != NULL) {
        StudentNode *next = current->next;
        free(current);
        current = next;
    }
}

int main() {
    // 构建初始链表
    StudentNode *head = create_student("张三", 18, 92.5);
    head->next = create_student("李四", 19, 78.0);
    head->next->next = create_student("王五", 18, 85.0);

    print_all(head);

    // 追加一个
    append_student(head, "赵六", 20, 91.0);
    printf("追加赵六后：\n");
    print_all(head);

    // 删除一个
    head = delete_student(head, "李四");
    printf("删除李四后：\n");
    print_all(head);

    // 删除头节点
    head = delete_student(head, "张三");
    printf("删除张三（头节点）后：\n");
    print_all(head);

    // 清理
    free_all(head);
    head = NULL;
    return 0;
}
```

输出：

```
===== 学生名单 =====
1. 张三 | 18岁 | 92.5分
2. 李四 | 19岁 | 78.0分
3. 王五 | 18岁 | 85.0分
=====================
追加赵六后：

===== 学生名单 =====
1. 张三 | 18岁 | 92.5分
2. 李四 | 19岁 | 78.0分
3. 王五 | 18岁 | 85.0分
4. 赵六 | 20岁 | 91.0分
=====================
删除李四后：

===== 学生名单 =====
1. 张三 | 18岁 | 92.5分
2. 王五 | 18岁 | 85.0分
3. 赵六 | 20岁 | 91.0分
=====================
删除张三（头节点）后：

===== 学生名单 =====
1. 王五 | 18岁 | 85.0分
2. 赵六 | 20岁 | 91.0分
=====================
```

## 链表 vs 数组

| 特性 | 数组 | 链表 |
|------|------|------|
| 大小 | 固定（静态）或一次分配（动态） | 动态增长，随时加节点 |
| 访问第 i 个元素 | `O(1)` 直接跳 | `O(n)` 从头数 |
| 在中间插入/删除 | `O(n)` 需要移动元素 | `O(1)` 改一下指针就行 |
| 内存 | 连续的一块，可能浪费或不够 | 分散的，用多少占多少 |
| 缓存友好度 | 高（连续存储，CPU 预读） | 低（分散存储，缓存未命中多） |

**什么时候用链表？**
- 数据量不确定，频繁增减
- 需要在中间插入/删除（比如排队时有人插队）
- 不需要按索引随机访问

**什么时候用数组？**
- 数据量基本固定
- 需要频繁按索引访问（第 3 个、第 100 个）
- 追求访问速度

## 常见错误与调试

### 1. 忘记 `free` —— 内存泄漏

```c
void bad_function() {
    StudentNode *node = create_student("小明", 10, 100);
    // 函数结束，node 指针消失，但 malloc 的内存还在堆里！
    // 没有人再能找到这块内存并释放它 → 内存泄漏
}
```

**规则**：每个 `malloc` 都要有一个对应的 `free`。

### 2. 释放后继续使用（悬空指针）

```c
free(head);
head->next = xxx;  // 未定义行为！head 指向的内存已经不属于你了
```

**原则**：`free` 之后，把指针设为 `NULL`。这样再使用时会立刻崩溃（比你悄悄读/写野内存容易排查）。

### 3. 遍历时忘了移动指针 —— 死循环

```c
while (current != NULL) {
    printf("%s\n", current->name);
    // 忘了写 current = current->next;
    // → 永远停在第一个节点，死循环！
}
```

### 4. 删除节点时丢失链表尾部

```c
// 错误示范：
StudentNode *to_delete = current->next;
free(to_delete);
// 没把 current->next 指向 to_delete->next！
// 链表断了。
```

## 要点速查

| 概念 | 说明 |
|------|------|
| `struct 指针` | 声明：`Student *ptr = &s;` |
| `->` 运算符 | 通过指针访问成员：`ptr->name` 等价于 `(*ptr).name` |
| `const 指针` | `const Student *s` — 只读，防止意外修改 |
| `malloc` + 结构体 | `Student *s = malloc(sizeof(Student));` |
| `free` | 释放 `malloc` 分配的内存，每个 `malloc` 对应一个 `free` |
| 自引用结构体 | 包含指向同类型的指针：`struct Node *next;` |
| 链表 | 一系列通过指针串联的节点，可动态增减 |
| 头节点 `head` | 链表的入口指针，丢失了就找不到整个链表了 |

结构体和指针结合之后，你就拥有了构建"动态数据结构"的能力。链表只是第一个——后续还会学到栈、队列、二叉树、哈希表，它们的底层都一样：**一个结构体，里面有一根/两根指向同类型的指针，把无数个这样的结构体串起来。**

下一步我们转向另一个重要的应用场景：把数据存到磁盘上，让它断电也不丢——文件操作。
