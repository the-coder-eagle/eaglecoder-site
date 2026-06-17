---
category: "C语言教程"
title: "栈与队列 — 基础数据结构"
description: "C语言学习教程"
slug: "stack-and-queue"
level: 4
order: 4
tags: ["栈", "队列", "数组", "链表", "数据结构"]
---

# 栈与队列 — 两种限制操作的数据结构

## 热身比喻

### 栈：一摞盘子

你去自助餐厅，服务员把洗好的盘子一个个摞起来。客人取盘子时，只能从最上面拿——**最后放上去的，最先取下来**。

```text
push(10)  push(20)  push(30)        pop()→30  pop()→20
  ↓         ↓         ↓               ↑         ↑
┌───┐     ┌───┐     ┌───┐          ┌───┐     ┌───┐
│   │     │   │     │30 │ ← 栈顶    │   │     │   │
│   │     │20 │     │20 │          │20 │     │   │
│10 │     │10 │     │10 │          │10 │     │10 │
└───┘     └───┘     └───┘          └───┘     └───┘
空栈      压入20     压入30         弹出30     弹出20
```

**后进先出 = LIFO (Last In, First Out)**

### 队列：排队买奶茶

你到奶茶店排队，先到的人先点单，点完走人。新人只能排在队尾——**先来的先服务**。

```text
enqueue(1)  enqueue(2)  enqueue(3)     dequeue()→1  dequeue()→2
队尾→ 队首    队尾→ 队首    队尾→ 队首       队尾→ 队首   队尾→ 队首
┌─┬─┬─┐     ┌─┬─┬─┐     ┌─┬─┬─┐        ┌─┬─┬─┐    ┌─┬─┬─┐
│1│ │ │     │1│2│ │     │1│2│3│        │2│3│ │    │3│ │ │
└─┴─┴─┘     └─┴─┴─┘     └─┴─┴─┘        └─┴─┴─┘    └─┴─┴─┘
```

**先进先出 = FIFO (First In, First Out)**

---

## 栈 (Stack)：后进先出

### 内存布局 — 数组实现的栈

用数组实现栈，最关键的是维护一个 `top` 变量，它永远指向栈顶元素的位置。

```text
         索引    0     1     2     3     4    ...
        ┌─────┬─────┬─────┬─────┬─────┬─────┐
数组内容 │ 10  │ 20  │ 30  │  ?  │  ?  │ ... │
        └─────┴─────┴─────┴─────┴─────┴─────┘
                       ↑
                    top = 2  (指向 30，栈顶)

压入 40：
        ┌─────┬─────┬─────┬─────┬─────┬─────┐
        │ 10  │ 20  │ 30  │ 40  │  ?  │ ... │
        └─────┴─────┴─────┴─────┴─────┴─────┘
                             ↑
                          top = 3  (指向 40)

弹出：
        ┌─────┬─────┬─────┬─────┬─────┬─────┐
        │ 10  │ 20  │ 30  │ 40  │  ?  │ ... │
        └─────┴─────┴─────┴─────┴─────┴─────┘
                       ↑
                    top = 2  (逻辑上 40 被删除了)

注意：弹出时只是移动 top，数据 40 其实还在数组里，但逻辑上已经"出栈"了。
```

---

## 代码示例 1：数组实现栈（基础版）

```c
#include <stdio.h>

#define MAX_SIZE 5

typedef struct {
    int data[MAX_SIZE];  // 存放栈元素的数组
    int top;             // 栈顶索引，-1 表示空栈
} Stack;

// 初始化：栈为空
void stack_init(Stack *s) {
    s->top = -1;
}

// 判空：top == -1
int stack_is_empty(Stack *s) {
    return s->top == -1;
}

// 判满：top 已经到了数组最后一个位置
int stack_is_full(Stack *s) {
    return s->top == MAX_SIZE - 1;
}

// 压栈：先移动 top，再放入元素
void stack_push(Stack *s, int value) {
    if (stack_is_full(s)) {
        printf("栈满了，无法压入 %d\n", value);
        return;
    }
    s->data[++s->top] = value;  // ++在前的妙用：先自增，后赋值
    printf("压入 %d，当前栈顶索引：%d\n", value, s->top);
}

// 出栈：取出栈顶元素，然后 top 下移
int stack_pop(Stack *s) {
    if (stack_is_empty(s)) {
        printf("栈空了，无法弹出\n");
        return -1;  // 错误值
    }
    return s->data[s->top--];  // 先取值，再自减
}

// 查看栈顶（不弹出）
int stack_peek(Stack *s) {
    if (stack_is_empty(s)) {
        printf("栈空\n");
        return -1;
    }
    return s->data[s->top];
}

int main() {
    Stack s;
    stack_init(&s);    // 别忘了取地址！

    stack_push(&s, 10);  // 10
    stack_push(&s, 20);  // 10, 20
    stack_push(&s, 30);  // 10, 20, 30

    printf("栈顶元素：%d\n", stack_peek(&s));  // 30

    printf("弹出：%d\n", stack_pop(&s));       // 30
    printf("弹出：%d\n", stack_pop(&s));       // 20
    printf("弹出：%d\n", stack_pop(&s));       // 10
    printf("弹出：%d\n", stack_pop(&s));       // 栈空！

    return 0;
}
```

输出：
```text
压入 10，当前栈顶索引：0
压入 20，当前栈顶索引：1
压入 30，当前栈顶索引：2
栈顶元素：30
弹出：30
弹出：20
弹出：10
栈空了，无法弹出
弹出：-1
```

---

## 代码示例 2：栈的应用 — 括号匹配

这是栈的经典应用：检查表达式中的括号是否成对匹配。

```c
#include <stdio.h>
#include <stdbool.h>   // 使用 bool 类型

#define MAX 100

typedef struct {
    char data[MAX];
    int top;
} CharStack;

void init(CharStack *s) { s->top = -1; }
bool is_empty(CharStack *s) { return s->top == -1; }
bool is_full(CharStack *s)  { return s->top == MAX - 1; }

void push(CharStack *s, char c) {
    if (!is_full(s)) s->data[++s->top] = c;
}

char pop(CharStack *s) {
    if (!is_empty(s)) return s->data[s->top--];
    return '\0';
}

// 检查括号是否匹配
bool brackets_balanced(const char *expr) {
    CharStack s;
    init(&s);

    for (int i = 0; expr[i] != '\0'; i++) {
        char ch = expr[i];

        if (ch == '(' || ch == '[' || ch == '{') {
            push(&s, ch);  // 左括号：压栈
        }
        else if (ch == ')' || ch == ']' || ch == '}') {
            if (is_empty(&s)) return false;  // 多了右括号

            char left = pop(&s);  // 弹出最近的左括号
            // 检查是否配对
            if ((ch == ')' && left != '(') ||
                (ch == ']' && left != '[') ||
                (ch == '}' && left != '{')) {
                return false;  // 类型不匹配
            }
        }
    }
    return is_empty(&s);  // 栈空说明全部匹配
}

int main() {
    printf("%s\n", brackets_balanced("()") ?       "OK" : "FAIL");  // OK
    printf("%s\n", brackets_balanced("([]){}") ?    "OK" : "FAIL");  // OK
    printf("%s\n", brackets_balanced("([)]") ?      "OK" : "FAIL");  // FAIL
    printf("%s\n", brackets_balanced("(()") ?       "OK" : "FAIL");  // FAIL
    printf("%s\n", brackets_balanced(")(") ?        "OK" : "FAIL");  // FAIL

    return 0;
}
```

匹配过程图解（以 `"([])"` 为例）：

```text
输入: (  [  ]  )
      ↓  ↓  ↓  ↓
      (  ([  (  栈空 ✓
栈:              ↑
      (  ([  pop [ 匹配
栈:   (  (   (   pop ( 匹配 → 栈空，成功！
```

---

## 代码示例 3：链表实现栈（无容量限制）

数组实现的栈有固定大小上限，用链表则不受此限制。

```c
#include <stdio.h>
#include <stdlib.h>

// 链表节点
typedef struct StackNode {
    int data;
    struct StackNode *next;
} StackNode;

// 压栈：在链表头部插入（头部就是"栈顶"）
StackNode* push(StackNode *top, int value) {
    StackNode *node = malloc(sizeof(StackNode));
    node->data = value;
    node->next = top;   // 新节点指向原来的栈顶
    return node;         // 新节点成为新的栈顶
}

// 出栈：从链表头部删除
StackNode* pop(StackNode *top, int *out_value) {
    if (top == NULL) {
        printf("栈空\n");
        *out_value = -1;
        return NULL;
    }
    StackNode *new_top = top->next;
    *out_value = top->data;
    free(top);
    return new_top;
}

// 查看栈顶
int peek(StackNode *top) {
    if (top == NULL) return -1;
    return top->data;
}

// 释放整个栈
void free_stack(StackNode *top) {
    while (top != NULL) {
        StackNode *temp = top;
        top = top->next;
        free(temp);
    }
}

int main() {
    StackNode *stack_top = NULL;  // 空栈

    stack_top = push(stack_top, 10);  // 10
    stack_top = push(stack_top, 20);  // 20 → 10
    stack_top = push(stack_top, 30);  // 30 → 20 → 10

    printf("栈顶：%d\n", peek(stack_top));  // 30

    int val;
    stack_top = pop(stack_top, &val);
    printf("弹出：%d\n", val);  // 30
    stack_top = pop(stack_top, &val);
    printf("弹出：%d\n", val);  // 20
    stack_top = pop(stack_top, &val);
    printf("弹出：%d\n", val);  // 10

    free_stack(stack_top);  // 已空，但好习惯
    return 0;
}
```

> 链表实现栈，本质上是把链表的**头部**当作栈顶。所有的 push 都在头部插入（O(1)），pop 都从头部删除（O(1)）。

---

## 队列 (Queue)：先进先出

### 内存布局 — 链表实现的队列

队列需要维护两个指针：`front` 指向队首（出队位置），`rear` 指向队尾（入队位置）。

```text
链表实现的队列：
front ──→ [1|next] → [2|next] → [3|NULL] ←── rear
            ↑                        ↑
          出队端                   入队端

enqueue(4):
front ──→ [1|next] → [2|next] → [3|next] → [4|NULL] ←── rear

dequeue() → 1:
front ──→ [2|next] → [3|next] → [4|NULL] ←── rear
```

---

## 代码示例 4：链表实现队列

```c
#include <stdio.h>
#include <stdlib.h>

// 队列节点
typedef struct QNode {
    int data;
    struct QNode *next;
} QNode;

// 队列结构：维护队首和队尾两个指针
typedef struct {
    QNode *front;  // 队首（出队端）
    QNode *rear;   // 队尾（入队端）
} Queue;

// 初始化空队列
void queue_init(Queue *q) {
    q->front = q->rear = NULL;
}

// 判空
int queue_is_empty(Queue *q) {
    return q->front == NULL;
}

// 入队：在 rear 后面添加新节点
void enqueue(Queue *q, int value) {
    QNode *node = malloc(sizeof(QNode));
    node->data = value;
    node->next = NULL;

    if (queue_is_empty(q)) {
        // 第一个节点：front 和 rear 都指向它
        q->front = q->rear = node;
    } else {
        // 挂在队尾后面，然后更新 rear
        q->rear->next = node;
        q->rear = node;
    }
    printf("入队：%d\n", value);
}

// 出队：从 front 移除节点
int dequeue(Queue *q) {
    if (queue_is_empty(q)) {
        printf("队列空，无法出队\n");
        return -1;
    }

    QNode *temp = q->front;
    int value = temp->data;

    q->front = q->front->next;  // front 后移一位

    // 如果出队后队列为空，rear 也要置空
    if (q->front == NULL)
        q->rear = NULL;

    free(temp);
    return value;
}

// 查看队首
int queue_front(Queue *q) {
    if (queue_is_empty(q)) return -1;
    return q->front->data;
}

int main() {
    Queue q;
    queue_init(&q);

    enqueue(&q, 1);  // 队列：1
    enqueue(&q, 2);  // 队列：1, 2
    enqueue(&q, 3);  // 队列：1, 2, 3

    printf("队首：%d\n", queue_front(&q));  // 1

    printf("出队：%d\n", dequeue(&q));  // 1
    printf("出队：%d\n", dequeue(&q));  // 2

    enqueue(&q, 4);  // 队列：3, 4

    printf("出队：%d\n", dequeue(&q));  // 3
    printf("出队：%d\n", dequeue(&q));  // 4
    printf("出队：%d\n", dequeue(&q));  // 队列空

    return 0;
}
```

输出：
```text
入队：1
入队：2
入队：3
队首：1
出队：1
出队：2
入队：4
出队：3
出队：4
队列空，无法出队
出队：-1
```

---

## 代码示例 5：循环队列 — 数组实现队列

用数组实现队列有一个问题：出队后前面的空间被浪费了。解决方法是**循环队列**——把数组头尾连成一个环。

```text
循环队列的队列（数组大小为 5）：
索引:    0     1     2     3     4
      ┌─────┬─────┬─────┬─────┬─────┐
      │     │  2  │  3  │  4  │     │
      └─────┴─────┴─────┴─────┴─────┘
              ↑           ↑
            front        rear
         (下次出队从这)  (下次入队放这)

队列还有 2 个空位（索引 0 和 4），rear 到 4 后下次会绕回 0。
```

```c
#include <stdio.h>
#include <stdbool.h>

#define MAX 5

typedef struct {
    int data[MAX];
    int front;   // 队首索引
    int rear;    // 队尾索引（下一个入队位置）
    int count;   // 当前元素个数（方便判断空/满）
} CircularQueue;

void cq_init(CircularQueue *q) {
    q->front = 0;
    q->rear  = 0;
    q->count = 0;
}

bool cq_is_empty(CircularQueue *q) { return q->count == 0; }
bool cq_is_full(CircularQueue *q)  { return q->count == MAX; }

bool cq_enqueue(CircularQueue *q, int value) {
    if (cq_is_full(q)) {
        printf("循环队列满\n");
        return false;
    }
    q->data[q->rear] = value;
    q->rear = (q->rear + 1) % MAX;   // 取模实现循环
    q->count++;
    return true;
}

bool cq_dequeue(CircularQueue *q, int *out) {
    if (cq_is_empty(q)) {
        printf("循环队列空\n");
        return false;
    }
    *out = q->data[q->front];
    q->front = (q->front + 1) % MAX;  // 取模实现循环
    q->count--;
    return true;
}

int main() {
    CircularQueue q;
    cq_init(&q);

    cq_enqueue(&q, 10); cq_enqueue(&q, 20);
    cq_enqueue(&q, 30); cq_enqueue(&q, 40);
    cq_enqueue(&q, 50);  // 满
    cq_enqueue(&q, 60);  // 失败：队列满

    int val;
    cq_dequeue(&q, &val); printf("出队：%d\n", val);  // 10
    cq_dequeue(&q, &val); printf("出队：%d\n", val);  // 20

    cq_enqueue(&q, 60);  // 成功：绕回索引 0
    cq_enqueue(&q, 70);  // 成功：索引 1

    // 依次出队
    while (cq_dequeue(&q, &val))
        printf("出队：%d\n", val);
    // 30 40 50 60 70

    return 0;
}
```

**取模运算 `%` 是循环队列的灵魂**：`(rear + 1) % MAX` 让索引到末尾后自动绕回开头。

---

## 代码示例 6：用两个栈模拟队列（经典面试题）

这是一个巧妙的组合：利用栈的后进先出，通过两次翻转实现先进先出。

```c
#include <stdio.h>
#include <stdbool.h>

#define MAX 20

typedef struct { int data[MAX]; int top; } Stack;

void s_init(Stack *s) { s->top = -1; }
bool s_empty(Stack *s) { return s->top == -1; }
bool s_full(Stack *s) { return s->top == MAX - 1; }
void s_push(Stack *s, int v) { if (!s_full(s)) s->data[++s->top] = v; }
int  s_pop(Stack *s) { if (!s_empty(s)) return s->data[s->top--]; return -1; }

// 两个栈模拟队列
typedef struct {
    Stack in_stack;   // 入队栈
    Stack out_stack;  // 出队栈
} TwoStackQueue;

void tsq_init(TwoStackQueue *q) {
    s_init(&q->in_stack);
    s_init(&q->out_stack);
}

// 入队：直接压入 in_stack
void tsq_enqueue(TwoStackQueue *q, int value) {
    s_push(&q->in_stack, value);
    printf("入队：%d\n", value);
}

// 出队：
// 如果 out_stack 为空，把 in_stack 的所有元素倒过去
// 然后从 out_stack 弹出
int tsq_dequeue(TwoStackQueue *q) {
    if (s_empty(&q->out_stack)) {
        // 翻转：把所有元素从 in_stack 倒入 out_stack
        while (!s_empty(&q->in_stack)) {
            s_push(&q->out_stack, s_pop(&q->in_stack));
        }
    }
    if (s_empty(&q->out_stack)) {
        printf("队列空\n");
        return -1;
    }
    return s_pop(&q->out_stack);
}

int main() {
    TwoStackQueue q;
    tsq_init(&q);

    tsq_enqueue(&q, 1);
    tsq_enqueue(&q, 2);
    tsq_enqueue(&q, 3);

    printf("出队：%d\n", tsq_dequeue(&q));  // 1
    printf("出队：%d\n", tsq_dequeue(&q));  // 2

    tsq_enqueue(&q, 4);

    printf("出队：%d\n", tsq_dequeue(&q));  // 3
    printf("出队：%d\n", tsq_dequeue(&q));  // 4

    return 0;
}
```

翻转过程图解：

```text
入队 1,2,3 后：
in_stack:        out_stack:
┌───┐            ┌───┐
│ 3 │ ← top      │   │
│ 2 │            │   │
│ 1 │            │   │
└───┘            └───┘

第一次出队——翻转:
in_stack:        out_stack:
┌───┐            ┌───┐
│   │            │ 1 │ ← top
│   │            │ 2 │
│   │            │ 3 │
└───┘            └───┘
然后 pop out_stack → 1 (FIFO 成功！)
```

---

## 常见错误

### 错误 1：数组实现的栈出队时没判空

```text
❌ 错误写法                              ✅ 正确写法
int pop(Stack *s) {                     int pop(Stack *s) {
    return s->data[s->top--];               if (s->top == -1) {
}                                               printf("栈空\n");
// 栈空时 top=-1，data[-1] 越界！              return -1;
                                            }
                                            return s->data[s->top--];
                                        }
```

### 错误 2：队列出队后忘记更新 rear

```text
❌ 错误写法                              ✅ 正确写法
q->front = q->front->next;              q->front = q->front->next;
free(temp);                             if (q->front == NULL)
// 如果队列变空，rear 还指向                     q->rear = NULL;
// 已释放的节点（悬垂指针）！                free(temp);
```

### 错误 3：循环队列取模运算写错

```text
❌ 错误写法                              ✅ 正确写法
q->rear = q->rear + 1;                  q->rear = (q->rear + 1) % MAX;
// 没有取模，rear 会超过数组边界！          // 取模让 rear 在 [0, MAX-1] 循环
```

### 错误 4：忘记传地址（`&`）

```text
❌ 错误写法                              ✅ 正确写法
Stack s;                                Stack s;
init(s);  // 传的是值，函数里动不了 s     init(&s);  // 传地址
push(s, 10);  // 同理                    push(&s, 10);
```

### 错误 5：混淆栈和队列的操作端

```text
栈：push 和 pop 在同一端（栈顶）
队列：enqueue 在一端（rear），dequeue 在另一端（front）

❌ 用栈的思维写队列：
  enqueue 在 front → 新元素放队首，完全违背 FIFO

✅ 记住：
  栈 = 一端操作      队列 = 两端操作
  (top)              (front出, rear进)
```

---

## 栈与队列对比总结

| 维度 | 栈 (Stack) | 队列 (Queue) |
|------|-----------|-------------|
| 原则 | LIFO (后进先出) | FIFO (先进先出) |
| 操作端 | 单端（栈顶） | 双端（队首出、队尾入） |
| 核心操作 | push / pop / peek | enqueue / dequeue |
| 数组实现 | top 指针，O(1) | 循环队列，front+rear，O(1) |
| 链表实现 | 头部插入/删除，O(1) | front+rear 双指针，O(1) |
| 现实类比 | 摞盘子、浏览器后退 | 排队、打印机任务 |
| 编程应用 | 函数调用栈、括号匹配、撤销操作、DFS | BFS、消息队列、缓冲区、任务调度 |

---

## 练习建议

1. **栈起步**：用数组实现一个可以存字符串（`char*`）的栈，测试推入和弹出几个单词。

2. **栈应用**：用栈实现一个简单的"撤销"功能——用户每次输入一行文字，可以输入 `undo` 撤销上一步，`show` 查看当前文本。

3. **队列入门**：用链表实现一个队列，模拟银行叫号系统：不断有人取号（enqueue），柜员叫号（dequeue）。

4. **队列进阶**：将循环队列的示例改为支持 `double` 类型，实现一个滑动平均值计算器——不断加入新数据，计算最近 N 个值的平均。

5. **综合**：实现一个简单的"回文检测器"。同时用栈和队列读入一个字符串每个字符依次入栈和入队，然后逐个比较出栈和出队的字符是否全都相同。

6. **思考题**：为什么 C 语言的函数调用要用栈（call stack）而不用队列？如果函数调用用队列会怎样？

---

## 要点速查

- **栈**：LIFO，push/pop 都在栈顶，top 指针追踪，适合"后进先出"场景
- **队列**：FIFO，enqueue 在 rear，dequeue 在 front，需要两个指针
- **数组实现栈**：`data[++top] = val` 入，`data[top--]` 出，O(1)
- **链表实现栈**：头部操作，无容量限制，O(1)
- **链表实现队列**：维护 front 和 rear 两个指针，O(1)
- **循环队列**：用 `% MAX` 取模，解决数组空间浪费
- **共同点**：都是"受限线性表"，只允许在特定端操作，这是设计约束而非缺点
- **核心区别**：栈看"最新"，队列看"最旧"——选择哪种取决于你的数据需要什么顺序处理
