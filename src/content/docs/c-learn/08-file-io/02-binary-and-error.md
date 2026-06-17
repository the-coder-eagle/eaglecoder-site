---
category: "C语言教程"
title: "二进制文件与错误处理"
description: "C语言学习教程"
slug: "binary-and-error"
level: 8
order: 2
tags: ["文件", "二进制", "fread", "fwrite", "ferror", "errno"]
---

# 二进制文件与错误处理

上一课我们学了文本文件的读写。但有些数据（图片、音频、视频，或者你的结构体数组）用文本格式又慢又占地方。这时就需要**二进制模式**。

## 文本模式 vs 二进制模式

### 本质区别

| | 文本模式 | 二进制模式 |
|------|---------|-----------|
| 存储内容 | 可读的字符（ASCII / UTF-8） | 原始字节，和内存中一模一样 |
| 换行处理（Windows） | `\n` 写入时变成 `\r\n`；读回时 `\r\n` 变回 `\n` | 不做任何转换，原样读写 |
| 适用场景 | 配置文件、日志、CSV、源代码 | 图片、音频、视频、结构体数据 |
| 人类可读？ | 是，用记事本打开能看懂 | 否，记事本打开是乱码 |
| 文件大小（存数字） | `int x = 1234567890;` → 10 字节文本 | `int x = 1234567890;` → 4 字节二进制 |
| 读写速度 | 需要格式化/解析，较慢 | 原样搬字节，快 |

### 直观对比

```c
// 假设我们有一个 Student 结构体
typedef struct {
    char  name[32];   // 32 字节
    int   id;         // 4 字节
    int   age;        // 4 字节
    float score;      // 4 字节
} Student;
// sizeof(Student) ≈ 44 字节

// --- 文本模式存储 ---
// 写入文件的内容（人类可读）：
// "张三 2024001 18 92.5\n"
// 共约 23 个字符 = 23 字节（对于这一个学生的信息）
// 读回时需要解析字符串，"张三"→name, "2024001"→int, ...

// --- 二进制模式存储 ---
// 把内存中的 44 字节原样写入文件
// 读取时，原样 44 字节塞回内存，结构体直接可用！
```

## fopen 的二进制模式

模式字符串后面加 `b` 即可：

```c
FILE *fp = fopen("data.bin", "wb");   // 二进制只写
FILE *fp = fopen("data.bin", "rb");   // 二进制只读
FILE *fp = fopen("data.bin", "ab");   // 二进制追加
FILE *fp = fopen("data.bin", "r+b");  // 二进制读写
```

### 为什么需要二进制模式？

在 Windows 上，文本模式下如果写一个 `\n`（0x0A），系统会自动写入 `\r\n`（0x0D 0x0A）两个字节。如果你写的是图片数据，多出来的 0x0D 会破坏图片文件。二进制模式禁止这种"好心办坏事"的转换。

在 Linux/Mac 上没有这个区别——`"r"` 和 `"rb"` 表现完全一样。但为了代码跨平台可移植，**处理非文本文件一律用 `b`**。

## fwrite — 把内存数据原样写入文件

```c
size_t fwrite(const void *ptr, size_t size, size_t count, FILE *stream);
```

参数解读（重要）：

- `ptr`：指向要写入的数据的首地址（`void *` 表示什么类型都行）
- `size`：**每个元素**的字节数
- `count`：元素个数
- `stream`：文件指针
- 返回值：实际写入的元素个数（通常等于 `count`，失败时小于 `count`）

### 写入基本类型

```c
#include <stdio.h>

int main() {
    FILE *fp = fopen("numbers.bin", "wb");
    if (fp == NULL) return 1;

    int   a = 42;
    float b = 3.14f;
    char  c = 'X';

    fwrite(&a, sizeof(int),   1, fp);  // 写入 1 个 int（4 字节）
    fwrite(&b, sizeof(float), 1, fp);  // 写入 1 个 float（4 字节）
    fwrite(&c, sizeof(char),  1, fp);  // 写入 1 个 char（1 字节）

    fclose(fp);
    printf("写入完成，共 %zu 字节\n", sizeof(int) + sizeof(float) + sizeof(char));
    return 0;
}
```

用记事本打开 `numbers.bin` 会看到乱码——因为 42 被存成了 4 个字节的二进制形式，不是字符 '4' 和 '2'。

### 写入结构体数组

这才是二进制文件最实用的场景：

```c
#include <stdio.h>
#include <string.h>

typedef struct {
    char  name[32];
    int   id;
    int   age;
    float score;
} Student;

int main() {
    // 准备数据
    Student students[4] = {
        {"张三", 2024001, 18, 92.5},
        {"李四", 2024002, 19, 78.0},
        {"王五", 2024003, 18, 85.0},
        {"赵六", 2024004, 20, 91.0},
    };

    // 二进制写入
    FILE *fp = fopen("students.bin", "wb");
    if (fp == NULL) {
        printf("无法创建文件！\n");
        return 1;
    }

    size_t written = fwrite(students,    // 数组首地址
                            sizeof(Student),  // 每个学生的大小
                            4,                // 共 4 个学生
                            fp);
    fclose(fp);

    printf("写入了 %zu 条学生记录\n", written);
    printf("文件大小约：%zu 字节\n", 4 * sizeof(Student));
    return 0;
}
```

`fwrite` 拿到 `students` 首地址后，把 `4 × sizeof(Student)` 共约 176 字节原封不动地塞进了文件。不像文本模式要格式化，速度快得多。

## fread — 把磁盘数据原样读回内存

```c
size_t fread(void *ptr, size_t size, size_t count, FILE *stream);
```

参数和 `fwrite` 完全对称。**返回值是实际读取到的元素个数**——这是判断是否读完的关键。

### 读取基本类型

```c
#include <stdio.h>

int main() {
    FILE *fp = fopen("numbers.bin", "rb");
    if (fp == NULL) return 1;

    int   a;
    float b;
    char  c;

    fread(&a, sizeof(int),   1, fp);
    fread(&b, sizeof(float), 1, fp);
    fread(&c, sizeof(char),  1, fp);

    printf("读到：a = %d, b = %.2f, c = %c\n", a, b, c);
    fclose(fp);
    return 0;
}
```

**注意**：`fread` 和 `fwrite` 的顺序必须一致。先写入 `int`、再 `float`、再 `char`，读取时也必须按这个顺序读。顺序错了数据就全乱了。

### 读取结构体数组

**方式一：已知记录数**

```c
Student students[4];
FILE *fp = fopen("students.bin", "rb");
if (fp == NULL) return 1;

size_t n = fread(students, sizeof(Student), 4, fp);
printf("读取了 %zu 条记录\n", n);

for (int i = 0; i < n; i++) {
    printf("%s (ID:%d, %d岁, %.1f分)\n",
           students[i].name, students[i].id,
           students[i].age, students[i].score);
}
fclose(fp);
```

**方式二：不知道记录数——循环读到读不动**

```c
#include <stdio.h>

typedef struct {
    char  name[32];
    int   id;
    int   age;
    float score;
} Student;

int main() {
    FILE *fp = fopen("students.bin", "rb");
    if (fp == NULL) {
        printf("文件不存在！\n");
        return 1;
    }

    Student s;
    int count = 0;

    printf("===== 读取学生数据 =====\n");
    // 每次读一个 Student，读不到就停
    while (fread(&s, sizeof(Student), 1, fp) == 1) {
        count++;
        printf("%d. %s | ID:%d | %d岁 | %.1f分\n",
               count, s.name, s.id, s.age, s.score);
    }
    printf("共读到 %d 条记录\n", count);

    fclose(fp);
    return 0;
}
```

**关键判断**：`fread(&s, sizeof(Student), 1, fp) == 1` —— 期望读 1 个元素，返回值小于 1 说明读不出来了（文件结束或出错）。

## 随机访问 — 在文件里"跳来跳去"

文本模式下通常只能"从前往后读"。二进制模式配合结构体，可以直接定位到第 N 条记录。

### fseek — 移动文件读写位置

```c
int fseek(FILE *stream, long offset, int whence);
```

| `whence` 值 | 含义 | 示例 |
|------------|------|------|
| `SEEK_SET` | 从文件**开头**算 | `fseek(fp, 0, SEEK_SET)` → 跳到开头 |
| `SEEK_CUR` | 从**当前位置**算 | `fseek(fp, 10, SEEK_CUR)` → 往后跳 10 字节 |
| `SEEK_END` | 从文件**末尾**算 | `fseek(fp, 0, SEEK_END)` → 跳到末尾 |
|  |  | `fseek(fp, -100, SEEK_END)` → 从末尾往前 100 字节 |

### 实战：定位读取第 N 条记录

```c
#include <stdio.h>

typedef struct {
    char  name[32];
    int   id;
    int   age;
    float score;
} Student;

// 读取第 index 条记录（index 从 0 开始）
int read_student_at(FILE *fp, int index, Student *out) {
    // 计算偏移量：第 index 条 = 跳过 index 个 Student 的大小
    long offset = index * sizeof(Student);
    if (fseek(fp, offset, SEEK_SET) != 0) {
        return 0;  // fseek 失败
    }
    return fread(out, sizeof(Student), 1, fp) == 1;
}

int main() {
    FILE *fp = fopen("students.bin", "rb");
    if (fp == NULL) return 1;

    int index;
    printf("文件中有 4 条记录（索引 0~3），你想看第几条？");
    scanf("%d", &index);

    Student s;
    if (read_student_at(fp, index, &s)) {
        printf("第 %d 条：%s | ID:%d | %d岁 | %.1f分\n",
               index + 1, s.name, s.id, s.age, s.score);
    } else {
        printf("读取失败！索引可能超出范围。\n");
    }

    fclose(fp);
    return 0;
}
```

### ftell — 获取当前读写位置

```c
long pos = ftell(fp);
printf("当前位置：%ld 字节\n", pos);
```

### rewind — 回到文件开头

```c
rewind(fp);
// 等价于 fseek(fp, 0, SEEK_SET);
```

### 三个定位函数的总结

| 函数 | 作用 | 返回值 |
|------|------|--------|
| `fseek(fp, offset, whence)` | 移动位置 | 成功返回 0，失败返回非 0 |
| `ftell(fp)` | 获取当前位置 | 返回字节偏移量，失败返回 -1L |
| `rewind(fp)` | 回到开头 | 无返回值 |

## 错误处理 — 重要但经常被忽略

文件操作可能在任何一步失败：磁盘满了、文件被删了、权限不够、U 盘被拔了……不检查返回值等于闭着眼睛开车。

### fopen 的错误处理

```c
FILE *fp = fopen("data.txt", "r");
if (fp == NULL) {
    // 进阶：打印具体原因
    printf("打开失败！\n");
    perror("详情");  // perror 自动追加系统错误信息
    return 1;
}
```

`perror("前缀")` 会打印：`前缀: 系统错误描述`。例如文件不存在时：

```
详情: No such file or directory
```

### ferror — 检查流是否发生错误

```c
int ferror(FILE *stream);
```

返回非 0 表示**之前某次操作出错了**。注意：`ferror` 只检测，不修复。错误标志一旦设置，就一直保持，直到你调用 `clearerr`。

```c
char buf[256];
while (fgets(buf, sizeof(buf), fp) != NULL) {
    printf("%s", buf);
}

// 循环结束后，是正常结束了还是出错了？
if (ferror(fp)) {
    printf("读取过程中发生错误！\n");
} else {
    printf("文件正常读完。\n");
}
```

### feof — 检查是否到达文件末尾

```c
int feof(FILE *stream);
```

返回非 0 表示已读到文件尾。

**常见误区**：很多人以为 `feof` 能"预测"下一次读取是否会遇到文件尾。实际上 `feof` 只在"已经读到文件尾之后"才返回真。

```c
// 错误用法（经典的 bug！）：
while (!feof(fp)) {              // 还没到文件尾，就读
    fgets(buf, sizeof(buf), fp);  // 这一行可能读失败！
    printf("%s", buf);            // 打印了垃圾数据
}

// 正确用法：
while (fgets(buf, sizeof(buf), fp) != NULL) {  // 用读函数的返回值判断
    printf("%s", buf);
}
// 循环结束，再用 feof/ferror 区分原因
if (feof(fp)) {
    printf("正常到达文件尾。\n");
} else if (ferror(fp)) {
    printf("发生错误！\n");
}
```

**为什么第一种是错的？** 想象文件只有 10 字节。最后一步 `fgets` 读了最后一点内容，但还没"越过"文件尾——`feof` 仍是 false。下一次循环 `fgets` 才真正碰到文件尾返回 NULL——但此时错误分支已打印了上一次的旧内容两次。

**记住黄金规则**：**用读函数的返回值判断是否成功，别用 `feof` 控制循环。**

### clearerr — 清除错误和 EOF 标志

```c
void clearerr(FILE *stream);
```

错误标志和 EOF 标志一旦设置，就"粘"在流上。如果你想重试，需要先清除：

```c
if (ferror(fp)) {
    printf("发生错误，尝试重试...\n");
    clearerr(fp);  // 清除错误标志
    // 现在可以重新读写了
}
```

### errno 和 strerror — 获取详细错误原因

```c
#include <stdio.h>
#include <errno.h>   // errno 全局变量
#include <string.h>  // strerror 函数

int main() {
    FILE *fp = fopen("/root/secret.bin", "r");
    if (fp == NULL) {
        printf("错误码：%d\n", errno);
        printf("错误描述：%s\n", strerror(errno));
        perror("fopen");  // 更简洁的写法：自动打印冒号+描述
        return 1;
    }
    fclose(fp);
    return 0;
}
```

输出（在 Linux 上）：

```
错误码：13
错误描述：Permission denied
fopen: Permission denied
```

`errno` 是线程安全的（每个线程有自己的 errno），但只在函数明确失败时才有意义——成功调用后 `errno` 的值不做任何保证。

### 错误处理完整流程图

```
fopen → 返回 NULL 了吗？
 ├─ 是 → 打印错误，结束（或重试）
 └─ 否 → 开始读/写
           │
           fread/fwrite/fgets/fprintf → 返回值正常吗？
            ├─ 否 → ferror(fp) 检查错误
            │        ├─ 有错误 → clearerr + 处理错误
            │        └─ 无错误 → feof(fp) 确认是文件尾（正常结束）
            └─ 是 → 继续处理，直到读完
                      │
                      fclose(fp) → 不要忘记！
```

## 综合实战：学生成绩数据库

把结构体、文件 I/O、二进制读写、错误处理全串起来：

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

#define FILENAME "students.db"
#define MAX_STUDENTS 100

typedef struct {
    char  name[32];
    int   id;
    int   age;
    float chinese;
    float math;
    float english;
} Student;

// 保存所有数据到文件（二进制）
int save_database(const Student *arr, int count) {
    FILE *fp = fopen(FILENAME, "wb");
    if (fp == NULL) {
        fprintf(stderr, "保存失败：");
        perror(FILENAME);
        return 0;
    }

    // 先写入记录数，再写入数据
    fwrite(&count, sizeof(int), 1, fp);
    size_t written = fwrite(arr, sizeof(Student), count, fp);
    fclose(fp);

    if (written != (size_t)count) {
        fprintf(stderr, "写入不完整！期望 %d 条，实际 %zu 条\n", count, written);
        return 0;
    }

    printf("成功保存 %d 条记录到 %s\n", count, FILENAME);
    return 1;
}

// 从文件加载所有数据
int load_database(Student *arr, int *count) {
    FILE *fp = fopen(FILENAME, "rb");
    if (fp == NULL) {
        // 文件不存在不是错误，是首次使用
        printf("数据库文件 %s 不存在，已创建空数据库。\n", FILENAME);
        *count = 0;
        return 1;  // 空数据库也算加载成功
    }

    int saved_count;
    if (fread(&saved_count, sizeof(int), 1, fp) != 1) {
        fprintf(stderr, "读取记录数失败！\n");
        fclose(fp);
        return 0;
    }

    if (saved_count > MAX_STUDENTS) {
        fprintf(stderr, "数据太多：%d 条，最大支持 %d 条\n", saved_count, MAX_STUDENTS);
        fclose(fp);
        return 0;
    }

    size_t n = fread(arr, sizeof(Student), saved_count, fp);

    if (ferror(fp)) {
        fprintf(stderr, "读取数据时发生错误！\n");
        clearerr(fp);
        fclose(fp);
        return 0;
    }

    fclose(fp);
    *count = (int)n;
    printf("从 %s 加载了 %d 条记录\n", FILENAME, *count);
    return 1;
}

// 打印所有学生
void print_all(const Student *arr, int count) {
    if (count == 0) {
        printf("（数据库为空）\n");
        return;
    }
    printf("\n===== 学生成绩表 (%d人) =====\n", count);
    printf("%-4s %-10s %-8s %-4s %-6s %-6s %-6s %-6s\n",
           "序号", "姓名", "学号", "年龄", "语文", "数学", "英语", "平均");
    printf("--------------------------------------------------------------\n");
    for (int i = 0; i < count; i++) {
        float avg = (arr[i].chinese + arr[i].math + arr[i].english) / 3.0f;
        printf("%-4d %-10s %-8d %-4d %-6.1f %-6.1f %-6.1f %-6.1f\n",
               i + 1, arr[i].name, arr[i].id, arr[i].age,
               arr[i].chinese, arr[i].math, arr[i].english, avg);
    }
}

// 添加一个学生
void add_student(Student *arr, int *count) {
    if (*count >= MAX_STUDENTS) {
        printf("数据库已满！最多 %d 条记录。\n", MAX_STUDENTS);
        return;
    }

    Student s;
    printf("姓名：");
    scanf("%s", s.name);
    printf("学号：");
    scanf("%d", &s.id);
    printf("年龄：");
    scanf("%d", &s.age);
    printf("语文成绩：");
    scanf("%f", &s.chinese);
    printf("数学成绩：");
    scanf("%f", &s.math);
    printf("英语成绩：");
    scanf("%f", &s.english);

    arr[*count] = s;
    (*count)++;
    printf("已添加 %s\n", s.name);
}

int main() {
    Student database[MAX_STUDENTS];
    int count = 0;

    // 启动时加载
    if (!load_database(database, &count)) {
        printf("加载数据库失败，程序退出。\n");
        return 1;
    }

    int choice;
    while (1) {
        printf("\n===== 学生成绩数据库 =====\n");
        printf("1. 查看所有学生\n");
        printf("2. 添加学生\n");
        printf("3. 保存并退出\n");
        printf("4. 不保存退出\n");
        printf("请选择：");
        scanf("%d", &choice);
        getchar();  // 吃掉换行符

        switch (choice) {
            case 1:
                print_all(database, count);
                break;
            case 2:
                add_student(database, &count);
                break;
            case 3:
                if (save_database(database, count)) {
                    printf("数据已保存，再见！\n");
                    return 0;
                }
                break;
            case 4:
                printf("未保存修改，再见！\n");
                return 0;
            default:
                printf("无效选项，请重试。\n");
        }
    }
}
```

### 程序运行演示

```
数据库文件 students.db 不存在，已创建空数据库。

===== 学生成绩数据库 =====
1. 查看所有学生
2. 添加学生
3. 保存并退出
4. 不保存退出
请选择：2
姓名：张三
学号：2024001
年龄：18
语文成绩：92.5
数学成绩：88.0
英语成绩：95.5
已添加 张三

请选择：2
姓名：李四
学号：2024002
年龄：19
语文成绩：78.0
数学成绩：85.5
英语成绩：80.0
已添加 李四

请选择：3
成功保存 2 条记录到 students.db
数据已保存，再见！
```

再次启动程序：

```
从 students.db 加载了 2 条记录

===== 学生成绩数据库 =====
1. 查看所有学生
2. 添加学生
3. 保存并退出
请选择：1

===== 学生成绩表 (2人) =====
序号 姓名       学号     年龄 语文   数学   英语   平均
--------------------------------------------------------------
1    张三       2024001  18   92.5   88.0   95.5   92.0
2    李四       2024002  19   78.0   85.5   80.0   81.2
```

现在你有了一个真正"有记忆"的程序——学生数据在两次运行之间保留了下来。

## 二进制 vs 文本 — 什么时候用什么？

| 场景 | 推荐模式 | 原因 |
|------|---------|------|
| 程序配置文件 | 文本 | 方便用户手动编辑 |
| 日志文件 | 文本 | 需要人类阅读和分析 |
| CSV 数据导出 | 文本 | Excel 能打开 |
| 游戏存档 | 二进制 | 速度快，防止玩家手动篡改 |
| 图片/音频/视频 | 二进制 | 本身就是二进制格式 |
| 大量同构数据 | 二进制 | 体积小，读写快，随机定位方便 |
| 需要在平台间传输 | 文本（或定义好字节序的二进制） | 不同平台的 int 大小等可能不同 |

## 常见错误速查

| 问题 | 原因 | 解决 |
|------|------|------|
| `fread` 读了但结构体全是 0 | 文件不存在或为空，且没检查返回值 | 检查 `fread` 返回值 |
| `fwrite` 后文件比预期大 | Windows 文本模式下 `\n` 被转 `\r\n` | 用 `"wb"` 而不是 `"w"` |
| `fread` 读到乱码/崩溃 | 读写顺序不一致，或跨平台字节序问题 | 确保 `fwrite` 和 `fread` 的类型顺序一致 |
| 读循环死循环 | 用 `feof` 控制循环 | 用读函数返回值控制循环 |
| `fclose` 崩溃 | 对同一个 `FILE *` 关闭了两次 | `fclose` 后把指针设为 `NULL` |

## 要点速查

| 概念 | 说明 |
|------|------|
| `"rb"` / `"wb"` / `"ab"` | 二进制读/写（清空）/追加 |
| `fwrite(ptr, size, count, fp)` | 把内存数据原样写入文件 |
| `fread(ptr, size, count, fp)` | 把文件数据原样读回内存，返回成功读取的元素数 |
| `fseek(fp, offset, whence)` | 移动读写位置：`SEEK_SET`/`SEEK_CUR`/`SEEK_END` |
| `ftell(fp)` | 获取当前读写位置（字节偏移） |
| `rewind(fp)` | 回到文件开头 |
| `ferror(fp)` | 检查流是否发生错误（返回非 0 = 有错） |
| `feof(fp)` | 检查是否到达文件尾 |
| `clearerr(fp)` | 清除流的错误和 EOF 标志 |
| `errno` / `strerror` / `perror` | 获取和打印系统错误信息 |

文件操作学到这里，你的 C 程序已经可以读写文本、处理二进制数据、随机定位、优雅地处理错误。结合之前学的结构体，你现在能把内存中的复杂数据结构完整持久化到磁盘——这是每一个实用程序的基础能力。
