---
category: "C语言教程"
title: "链表 — 动态数据结构基础"
description: "C语言学习教程"
slug: "linked-list"
level: 4
order: 3
tags: ["链表", "struct", "指针", "数据结构"]
---

# 链表 — 动态数据结构基础

## 热身比喻：地下党的单线联系

想象你是地下情报员，组织规定：每个人只知道自己的代号和**下一个接头人的地址**。你不需要知道整条线有多少人，也不需要知道前面有谁——你只负责把情报交给下一个人。这种"只认识下一个"的组织方式，就是链表。

```text
[人A] ——→ [人B] ——→ [人C] ——→ [人D] ——→ NULL
 数据:2      数据:7      数据:1      数据:9
 next→      next→      next→      next→NULL
```

和数组对比：
- **数组**像宿舍——所有人住在一起，按房号就能找到任何人（O(1) 随机访问），但房间数建好就不能改。
- **链表**像情报网——每个人散落在城市各处，找人要一个接一个地问（O(n) 查找），但随时可以加新人、踢叛徒（O(1) 插入/删除）。

---

## 内存中的链表：散落的节点

数组中所有元素挤在一起；链表中的每个节点则是独立申请的内存块（`malloc`），它们**散落在堆的不同位置**，通过指针串联。

```text
堆内存（示意）
┌─────────────────────────────────────────────┐
│                      ┌──────────────────┐   │
│  head = 0x200                   0x400    │   │
│      │     ┌────────┐   ┌────────┐       │   │ 0x600
│      └────→│ data:10│   │ data:20│       │   │ ┌────────┐
│   0x200    │next:───┼──→│next:───┼───────┼───┼→│ data:30│
│            └────────┘   └────────┘       │   │ │next:   │
│            0x200        0x400            │   │ │  NULL  │
│                                          │   │ └────────┘
│  每个节点独立分配，物理地址不连续           │   │  0x600
└─────────────────────────────────────────────┘
```

> **关键记忆**：因为节点地址不连续，你无法像数组那样一次性 `arr + i` 跳转到第 i 个元素——必须从头开始，顺着 `next` 指针一个接一个走。

---

## 定义节点：`struct` + 自引用指针

```c
struct Node {
    int data;              // 数据域：存放实际数据
    struct Node *next;     // 指针域：指向下一个同类型节点
};
```

这个结构体"自己指向自己"——听起来奇怪，但在 C 中完全合法。`next` 是一个**指针**，指针的大小在编译时就是确定的（8 字节或 4 字节），所以编译器能计算 `struct Node` 的总大小。

```text
struct Node 在内存中的样子（假设 int=4字节, 指针=8字节）：
┌──────────────┬──────────────┐
│  data (4B)   │  next (8B)   │
├──────────────┴──────────────┤
│      总计 12 字节 + 填充     │
└─────────────────────────────┘
```

---

## 代码示例 1：创建三个节点并手动串联

```c
#include <stdio.h>
#include <stdlib.h>   // malloc, free

struct Node {
    int data;
    struct Node *next;
};

int main() {
    // --- 第一步：创建三个独立的节点 ---
    struct Node *node1 = malloc(sizeof(struct Node));
    struct Node *node2 = malloc(sizeof(struct Node));
    struct Node *node3 = malloc(sizeof(struct Node));

    // --- 第二步：填入数据 ---
    node1->data = 10;
    node2->data = 20;
    node3->data = 30;

    // --- 第三步：串起来 ---
    node1->next = node2;   // 10 → 20
    node2->next = node3;   // 20 → 30
    node3->next = NULL;    // 30 → (终点)

    // --- 第四步：遍历并打印 ---
    struct Node *head = node1;   // head 指向链表起点
    struct Node *current = head;
    while (current != NULL) {
        printf("%d -> ", current->data);
        current = current->next;
    }
    printf("NULL\n");
    // 输出：10 -> 20 -> 30 -> NULL

    // --- 第五步：释放所有节点 ---
    current = head;
    while (current != NULL) {
        struct Node *temp = current;   // 保存当前节点
        current = current->next;       // 先移动到下一个
        free(temp);                    // 再释放当前
    }

    return 0;
}
```

> **释放顺序很有讲究**：先移动到下一个再释放当前——如果先 `free` 当前结点，`current->next` 就丢失了。

---

## 代码示例 2：封装创建函数 + 遍历函数

```c
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

// 创建一个新节点，data 赋值，next 置空
struct Node* create_node(int value) {
    struct Node *new_node = malloc(sizeof(struct Node));
    if (new_node == NULL) {
        printf("内存分配失败！\n");
        exit(1);
    }
    new_node->data = value;
    new_node->next = NULL;
    return new_node;
}

// 遍历打印整个链表
void print_list(struct Node *head) {
    if (head == NULL) {
        printf("链表为空\n");
        return;
    }
    struct Node *cur = head;
    while (cur != NULL) {
        printf("[%d]", cur->data);
        if (cur->next != NULL)
            printf(" -> ");
        cur = cur->next;
    }
    printf("\n");
}

int main() {
    struct Node *head = create_node(100);
    head->next = create_node(200);
    head->next->next = create_node(300);

    print_list(head);  // [100] -> [200] -> [300]

    return 0;
}
```

---

## 代码示例 3：头部插入（最快，O(1)）

在头部插入只需要三步：新建节点，让它的 `next` 指向原来的 `head`，然后更新 `head`。

```c
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* create_node(int value) {
    struct Node *new_node = malloc(sizeof(struct Node));
    new_node->data = value;
    new_node->next = NULL;
    return new_node;
}

// 在头部插入：返回新的 head
struct Node* insert_at_head(struct Node *head, int value) {
    struct Node *new_node = create_node(value);
    new_node->next = head;   // 新节点的 next 指向旧头
    return new_node;          // 新节点成为新的头
}

void print_list(struct Node *head) {
    struct Node *cur = head;
    while (cur != NULL) {
        printf("%d ", cur->data);
        cur = cur->next;
    }
    printf("\n");
}

int main() {
    struct Node *head = NULL;  // 初始：空链表

    head = insert_at_head(head, 30);   // 链表：30
    head = insert_at_head(head, 20);   // 链表：20 → 30
    head = insert_at_head(head, 10);   // 链表：10 → 20 → 30

    print_list(head);  // 10 20 30

    return 0;
}
```

图解头部插入过程（插 10 到 20→30 之前）：

```text
插之前：  head → [20|next] → [30|NULL]

Step 1：  新建节点  [10|NULL]
Step 2：  new_node->next = head
          [10|next] → [20|next] → [30|NULL]
Step 3：  head = new_node
          head → [10|next] → [20|next] → [30|NULL]
```

---

## 代码示例 4：尾部插入 + 按值查找

```c
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* create_node(int value) {
    struct Node *new_node = malloc(sizeof(struct Node));
    new_node->data = value;
    new_node->next = NULL;
    return new_node;
}

// 在尾部插入——需要遍历到最后一个节点
struct Node* insert_at_tail(struct Node *head, int value) {
    struct Node *new_node = create_node(value);

    if (head == NULL)           // 空链表：新节点就是 head
        return new_node;

    struct Node *cur = head;
    while (cur->next != NULL)   // 走到最后一个节点
        cur = cur->next;
    cur->next = new_node;       // 挂在最后
    return head;                // head 没变
}

// 按值查找——返回第一个匹配节点，找不到返回 NULL
struct Node* find(struct Node *head, int target) {
    struct Node *cur = head;
    while (cur != NULL) {
        if (cur->data == target)
            return cur;        // 找到，返回节点指针
        cur = cur->next;
    }
    return NULL;               // 没找到
}

void print_list(struct Node *head) {
    struct Node *cur = head;
    while (cur != NULL) {
        printf("%d ", cur->data);
        cur = cur->next;
    }
    printf("\n");
}

int main() {
    struct Node *head = NULL;
    head = insert_at_tail(head, 5);
    head = insert_at_tail(head, 15);
    head = insert_at_tail(head, 25);

    print_list(head);  // 5 15 25

    // 查找 15
    struct Node *found = find(head, 15);
    if (found != NULL)
        printf("找到 %d，它的 next 指向 %d\n",
               found->data,
               found->next ? found->next->data : -1);

    return 0;
}
```

---

## 代码示例 5：删除指定节点

删除一个节点需要找到它的**前一个节点**，然后把前节点的 `next` 跨过要删除的节点，直接指向下一个。

```c
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

struct Node* create_node(int value) {
    struct Node *new_node = malloc(sizeof(struct Node));
    new_node->data = value;
    new_node->next = NULL;
    return new_node;
}

// 删除第一个值为 target 的节点，返回新的 head
struct Node* delete_by_value(struct Node *head, int target) {
    if (head == NULL) return NULL;  // 空链表，没得删

    // 情况1：要删的恰好是头节点
    if (head->data == target) {
        struct Node *new_head = head->next;
        free(head);
        return new_head;
    }

    // 情况2：要删的在中间或末尾
    struct Node *cur = head;
    // 找目标节点的前一个节点
    while (cur->next != NULL && cur->next->data != target) {
        cur = cur->next;
    }

    if (cur->next != NULL) {        // 找到了
        struct Node *to_delete = cur->next;
        cur->next = to_delete->next; // 跳过要删的节点
        free(to_delete);             // 释放内存
    }
    // 如果 cur->next == NULL，说明链表里没有 target

    return head;
}

void print_list(struct Node *head) {
    struct Node *cur = head;
    while (cur != NULL) {
        printf("%d ", cur->data);
        cur = cur->next;
    }
    printf("\n");
}

int main() {
    struct Node *head = create_node(10);
    head->next = create_node(20);
    head->next->next = create_node(30);

    printf("原链表：");  print_list(head);  // 10 20 30

    head = delete_by_value(head, 20);
    printf("删除20后："); print_list(head);  // 10 30

    head = delete_by_value(head, 10);
    printf("删除10后："); print_list(head);  // 30

    head = delete_by_value(head, 99);       // 99 不存在
    printf("删除99后："); print_list(head);  // 30

    return 0;
}
```

删除过程的图解：

```text
删除 20 之前： head → [10|next] → [20|next] → [30|NULL]
                             cur       cur->next

Step 1：cur->next = to_delete->next
        head → [10|next] ───→ [30|NULL]
                       ↘
                      [20|next] (断开连接)
Step 2：free(to_delete) → [20] 被回收

删除后：  head → [10|next] → [30|NULL]
```

---

## 代码示例 6：释放整个链表

```c
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node *next;
};

void free_list(struct Node *head) {
    struct Node *cur = head;
    while (cur != NULL) {
        struct Node *temp = cur;   // 记住当前
        cur = cur->next;           // 前进
        free(temp);                // 释放
    }
    // 此时 head 指针本身还在，但指向的内存已经释放
    // 调用者应该把 head 设为 NULL
}

int main() {
    // 创建链表：1 → 2 → 3
    struct Node *head = malloc(sizeof(struct Node));
    head->data = 1;
    head->next = malloc(sizeof(struct Node));
    head->next->data = 2;
    head->next->next = malloc(sizeof(struct Node));
    head->next->next->data = 3;
    head->next->next->next = NULL;

    free_list(head);
    head = NULL;   // 好习惯：释放后把指针置空

    printf("链表已安全释放\n");
    return 0;
}
```

---

## 常见错误

### 错误 1：释放后继续访问（悬垂指针）

```text
❌ 错误写法                              ✅ 正确写法
free(node);                             struct Node *next = node->next;
printf("%d", node->data);               free(node);
// node 指向的内存已被回收，                 node = next;
// 再次访问是未定义行为！                  // 应该先保存 next，再去 free
```

### 错误 2：忘记处理空链表

```text
❌ 错误写法                              ✅ 正确写法
struct Node* delete_head(               struct Node* delete_head(
    struct Node *head) {                    struct Node *head) {
    struct Node *new = head->next;          if (head == NULL)
    free(head);                                 return NULL;  // 什么也不做
    return new;                             struct Node *new = head->next;
}                                           free(head);
// head == NULL 时崩溃！                     return new;
                                        }
```

### 错误 3：`malloc` 之后忘记检查是否成功

```text
❌ 错误写法                              ✅ 正确写法
struct Node *n = malloc(sizeof(...));   struct Node *n = malloc(sizeof(...));
n->data = 42;  // malloc 可能返回 NULL  if (n == NULL) {
//    如果分配失败，程序崩溃                           printf("内存不足！\n");
                                                    exit(1);
                                                }
                                                n->data = 42;
```

### 错误 4：删除节点时只 `free` 而不调整 `next`

```text
❌ 错误写法                              ✅ 正确写法
// 想删除第二个节点                      cur->next = to_delete->next;
free(cur->next);                        free(to_delete);
// cur->next 还是指向已被释放的内存！     // 先调整指针，再释放
// 下次遍历到这个位置就炸了
```

### 错误 5：用 `sizeof(struct Node)` 而非 `sizeof(struct Node)` 的变体

```text
❌ 错误写法                              ✅ 正确写法
struct Node *n = malloc(sizeof(n));     struct Node *n = malloc(sizeof(*n));
// n 是指针，sizeof(n) = 8（指针大小）   // *n 是 Node，sizeof(*n) = 实际大小
// 分配空间不够，数据写越界！              // 推荐用 sizeof(*n)，更不容易写错
```

---

## 练习建议

1. **起步**：创建一个单向链表，存入 1 到 10，打印所有元素，再倒序打印（想想怎么做？提示：递归或先存数组）。

2. **进阶**：实现一个函数 `int count_nodes(struct Node *head)` 统计链表的节点数量。

3. **应用**：实现一个函数 `struct Node* reverse_list(struct Node *head)` 原地反转链表。这是面试高频题。

4. **综合**：用链表实现一个简单的通讯录：每个节点存姓名和电话，支持添加联系人、搜索、删除、打印全部联系人。

5. **思考题**：为什么链表的插入删除是 O(1) 而数组是 O(n)？链表 O(1) 的前提是什么？如果你不知道要插入的位置，只给一个值，复杂度会变成多少？

---

## 要点速查

| 知识点 | 描述 |
|--------|------|
| 节点定义 | `struct Node { int data; struct Node *next; };` |
| 创建节点 | `malloc(sizeof(struct Node))` + 赋值 |
| 遍历 | `while (cur != NULL) { cur = cur->next; }` |
| 头插 | `new->next = head; return new;` — O(1) |
| 尾插 | 遍历到最后，`last->next = new;` — O(n) |
| 删除 | 找到前一节点，`prev->next = prev->next->next; free(target);` |
| 释放 | 逐个 `free`，先保存 `next` 再释放当前 |
| 空链表 | `head == NULL` |
| 尾部标记 | 最后一个节点的 `next` 必须是 `NULL` |
| 与数组对比 | 数组：O(1) 随机访问，O(n) 插入删除；链表：O(n) 查找，O(1) 插入删除（已知位置） |
