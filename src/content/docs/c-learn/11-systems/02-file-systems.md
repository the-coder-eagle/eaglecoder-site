---
category: "C语言教程"
title: "文件系统操作 — stat、目录遍历"
description: "C语言学习教程"
slug: "file-systems"
level: 11
order: 2
tags: ["stat", "目录", "文件系统", "seek"]
---

# 文件系统操作 — stat、目录遍历

你已经会用 `fopen`、`fprintf`、`fgets` 读写文件内容了。但文件不止有"内容"——每个文件还有大小、权限、创建时间、所有者等**元信息**。目录本身也是一种特殊的文件。本章带你深入文件系统的内部世界。

## 为什么要深入文件系统？

想象你写了一个文件管理器，或者一个简单的备份脚本。你需要知道：
- 这个文件有多大？会不会超出存储空间？
- 它是一个普通文件还是一个目录？
- 目录下面有哪些文件？子目录呢？
- 如何跳到文件的第 1000 个字节去读数据？

这些就是本章要解决的问题。

---

## 1. stat — 文件的"身份证"

在 Linux/POSIX 系统中，`stat` 系统调用能获取文件的全部元信息。

### stat 结构体总览

```c
#include <sys/stat.h>

struct stat {
    dev_t     st_dev;         // 设备 ID
    ino_t     st_ino;         // inode 编号（文件的"身份证号"）
    mode_t    st_mode;        // 文件类型 + 权限位
    nlink_t   st_nlink;       // 硬链接数
    uid_t     st_uid;         // 所有者用户 ID
    gid_t     st_gid;         // 所有者组 ID
    dev_t     st_rdev;        // 设备号（如果是设备文件）
    off_t     st_size;        // 文件大小（字节）
    blksize_t st_blksize;     // 文件系统 I/O 块大小
    blkcnt_t  st_blocks;      // 分配的 512 字节块数量
    time_t    st_atime;       // 最后访问时间
    time_t    st_mtime;       // 最后修改时间
    time_t    st_ctime;       // 最后状态改变时间
};
```

我们不需要全部记住，重点关注：

| 字段       | 含义               | 使用场景                       |
|------------|--------------------|--------------------------------|
| st_mode    | 类型 + 权限        | 判断是文件还是目录             |
| st_size    | 文件大小（字节）   | 检查文件是否为空、是否太大     |
| st_mtime   | 最后修改时间       | 增量备份（只复制有改动的文件） |

### 第一个 stat 程序

```c
#include <stdio.h>
#include <sys/stat.h>
#include <time.h>

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "用法: %s <文件路径>\n", argv[0]);
        return 1;
    }

    struct stat st;
    if (stat(argv[1], &st) != 0) {
        perror("stat 失败");
        return 1;
    }

    printf("========== 文件信息 ==========\n");
    printf("  路径:      %s\n", argv[1]);
    printf("  大小:      %lld 字节", (long long)st.st_size);

    // 人性化大小显示
    if (st.st_size > 1024 * 1024) {
        printf(" (%.2f MB)\n", st.st_size / (1024.0 * 1024.0));
    } else if (st.st_size > 1024) {
        printf(" (%.2f KB)\n", st.st_size / 1024.0);
    } else {
        printf("\n");
    }

    printf("  inode:     %llu\n", (unsigned long long)st.st_ino);
    printf("  硬链接数:  %llu\n", (unsigned long long)st.st_nlink);
    printf("  权限模式:  %o (八进制)\n", st.st_mode & 07777);

    // 最后修改时间
    char time_buf[64];
    struct tm *tm_info = localtime(&st.st_mtime);
    strftime(time_buf, sizeof(time_buf), "%Y-%m-%d %H:%M:%S", tm_info);
    printf("  修改时间:  %s\n", time_buf);

    // 判断文件类型
    printf("\n========== 类型判断 ==========\n");
    printf("  普通文件?   %s\n", S_ISREG(st.st_mode) ? "是" : "否");
    printf("  目录?       %s\n", S_ISDIR(st.st_mode) ? "是" : "否");
    printf("  符号链接?   %s\n", S_ISLNK(st.st_mode) ? "是" : "否");
    printf("  字符设备?   %s\n", S_ISCHR(st.st_mode) ? "是" : "否");
    printf("  块设备?     %s\n", S_ISBLK(st.st_mode) ? "是" : "否");
    printf("  FIFO管道?   %s\n", S_ISFIFO(st.st_mode) ? "是" : "否");
    printf("  Socket?     %s\n", S_ISSOCK(st.st_mode) ? "是" : "否");

    return 0;
}
```

运行示例：

```bash
$ gcc -o finfo stat-demo.c
$ ./finfo /etc/passwd
========== 文件信息 ==========
  路径:      /etc/passwd
  大小:      2890 字节 (2.82 KB)
  inode:     1048712
  硬链接数:  1
  权限模式:  644 (八进制)
  修改时间:  2026-06-10 08:15:42

========== 类型判断 ==========
  普通文件?   是
  目录?       否
  符号链接?   否
  字符设备?   否
  ...

$ ./finfo /tmp
========== 文件信息 ==========
  路径:      /tmp
  大小:      4096 字节 (4.00 KB)
  ...
========== 类型判断 ==========
  普通文件?   否
  目录?       是
  ...
```

### 类型判断宏全家桶

```c
S_ISREG(m)   // Regular file — 普通文件
S_ISDIR(m)   // Directory — 目录
S_ISLNK(m)   // Symbolic link — 符号链接（软链接）
S_ISCHR(m)   // Character device — 字符设备（如 /dev/tty）
S_ISBLK(m)   // Block device — 块设备（如磁盘）
S_ISFIFO(m)  // FIFO (named pipe) — 命名管道
S_ISSOCK(m)  // Socket — 套接字
```

### stat 系列函数对比

```c
#include <sys/stat.h>

// stat: 如果路径是符号链接，追随到底，返回目标文件的信息
int stat(const char *path, struct stat *buf);

// lstat: 如果路径是符号链接，返回链接自身的信息（不追随）
int lstat(const char *path, struct stat *buf);

// fstat: 通过已打开的文件描述符获取信息
int fstat(int fd, struct stat *buf);
```

图解：

```
 有一个符号链接:  link.txt → real.txt

 stat("link.txt")    → 返回 real.txt 的信息
 lstat("link.txt")   → 返回 link.txt 自身的信息（是一个链接）
```

---

## 2. fseek 与 ftell — 文件的"时光机"

读文件不只是从头到尾流水账。`fseek` 让你在文件中随意跳跃，就像视频播放器的进度条。

### 文件位置指针

每个打开的文件都有一个**当前位置指针**。当执行 `fgetc()` 时，读取当前位置的字符，然后指针自动前进一格。

```
打开文件 "ABCDEFGHIJ" 时：
位置:  0   1   2   3   4   5   6   7   8   9
内容:  A   B   C   D   E   F   G   H   I   J
       ↑
       fgetc() 读 'A'，指针移到 1

       fseek(fp, 5, SEEK_SET) 后：
       A   B   C   D   E   F   G   H   I   J
                               ↑
       fgetc() 读 'F'
```

### fseek 的三个"锚点"

```c
int fseek(FILE *stream, long offset, int whence);
```

| whence 常量   | 含义           | 通俗解释                       |
|---------------|----------------|--------------------------------|
| `SEEK_SET`    | 从文件开头算   | "跳到第 offset 个字节"         |
| `SEEK_CUR`    | 从当前位置算   | "往后（或往前）跳 offset 个"   |
| `SEEK_END`    | 从文件末尾算   | "倒数第 offset 个字节"         |

### 完整示例

```c
#include <stdio.h>
#include <string.h>

int main() {
    // 创建一个测试文件
    const char *filename = "jump_test.txt";
    FILE *fp = fopen(filename, "w+");
    if (!fp) { perror("fopen"); return 1; }

    fprintf(fp, "0123456789ABCDEFGHIJ");
    // 文件内容（20个字符）：
    // 位置:  0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19
    // 字符:  0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  G  H  I  J

    printf("===== 跳跃实验 =====\n\n");

    // 实验 1：从头跳到第 10 个字节
    fseek(fp, 10, SEEK_SET);
    printf("fseek(10, SEEK_SET):  读到 '%c' (应该是 A)\n", fgetc(fp));

    // 实验 2：从当前位置跳 -5 个（往回跳）
    fseek(fp, -5, SEEK_CUR);
    printf("fseek(-5, SEEK_CUR):  读到 '%c' (应该是 7)\n", fgetc(fp));

    // 实验 3：文件末尾倒数第 3 个字节
    fseek(fp, -3, SEEK_END);
    printf("fseek(-3, SEEK_END):  读到 '%c' (应该是 H)\n", fgetc(fp));

    // 实验 4：获取文件大小
    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    printf("\n文件大小: %ld 字节\n", size);

    // 实验 5：跳到开头
    rewind(fp);  // 等价于 fseek(fp, 0, SEEK_SET)
    printf("rewind 后第一个字符: '%c'\n", fgetc(fp));

    fclose(fp);
    remove(filename);   // 清理测试文件
    return 0;
}
```

输出：

```
===== 跳跃实验 =====

fseek(10, SEEK_SET):  读到 'A' (应该是 A)
fseek(-5, SEEK_CUR):  读到 '7' (应该是 7)
fseek(-3, SEEK_END):  读到 'H' (应该是 H)

文件大小: 20 字节
rewind 后第一个字符: '0'
```

### 实用技巧：读取文件最后几行

```c
#include <stdio.h>
#include <stdlib.h>

// 从文件末尾向前读，寻找倒数第 N 个换行
void tail(FILE *fp, int n) {
    fseek(fp, 0, SEEK_END);
    long pos = ftell(fp);
    int lines = 0;

    // 从后往前扫描
    while (pos > 0 && lines <= n) {
        pos--;
        fseek(fp, pos, SEEK_SET);
        if (fgetc(fp) == '\n') lines++;
    }
    if (pos > 0) pos += 2;  // 跳过那个换行

    // 从 pos 读到文件末尾
    fseek(fp, pos, SEEK_SET);
    char buf[4096];
    while (fgets(buf, sizeof(buf), fp)) {
        printf("%s", buf);
    }
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        fprintf(stderr, "用法: %s <文件> [行数]\n", argv[0]);
        return 1;
    }

    FILE *fp = fopen(argv[1], "r");
    if (!fp) { perror("fopen"); return 1; }

    int n = (argc >= 3) ? atoi(argv[2]) : 10;
    printf("=== 最后 %d 行 ===\n", n);
    tail(fp, n);

    fclose(fp);
    return 0;
}
```

---

## 3. 目录遍历 — 走进文件夹迷宫

### 核心 API

```c
#include <dirent.h>

DIR *opendir(const char *path);            // 打开目录
struct dirent *readdir(DIR *dir);          // 读取下一个条目
int closedir(DIR *dir);                    // 关闭目录
void rewinddir(DIR *dir);                  // 重置到开头
```

`dirent` 结构体：

```c
struct dirent {
    ino_t          d_ino;       // inode 号
    off_t          d_off;       // 目录流中的偏移
    unsigned short d_reclen;    // 本条记录的长度
    unsigned char  d_type;      // 文件类型（不是所有文件系统都支持）
    char           d_name[];    // 文件名（以 '\0' 结尾）
};
```

### 列出目录内容（基础版）

```c
#include <stdio.h>
#include <dirent.h>

int main(int argc, char *argv[]) {
    const char *path = (argc >= 2) ? argv[1] : ".";

    DIR *dir = opendir(path);
    if (dir == NULL) {
        perror("opendir 失败");
        return 1;
    }

    printf("目录 \"%s\" 的内容:\n", path);
    printf("──────────────────────────────────\n");

    struct dirent *entry;
    int count = 0;

    while ((entry = readdir(dir)) != NULL) {
        count++;

        // 文件类型图标
        const char *icon = "";
        switch (entry->d_type) {
            case DT_DIR:  icon = "📁"; break;
            case DT_REG:  icon = "📄"; break;
            case DT_LNK:  icon = "🔗"; break;
            case DT_FIFO: icon = "📡"; break;
            case DT_SOCK: icon = "🔌"; break;
            case DT_CHR:  icon = "⌨️";  break;
            case DT_BLK:  icon = "💾"; break;
            default:      icon = "❓"; break;
        }
        printf("%3d. %s %s\n", count, icon, entry->d_name);
    }

    printf("──────────────────────────────────\n");
    printf("共 %d 个条目\n", count);

    closedir(dir);
    return 0;
}
```

### 递归遍历目录树（类 tree 命令）

这是一个"上档次"的程序——自动深入所有子目录：

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/stat.h>

void walk_dir(const char *path, int depth) {
    DIR *dir = opendir(path);
    if (dir == NULL) {
        // 打不开就跳过（权限问题等）
        return;
    }

    struct dirent *entry;
    while ((entry = readdir(dir)) != NULL) {
        // 跳过 . 和 ..
        if (strcmp(entry->d_name, ".") == 0 ||
            strcmp(entry->d_name, "..") == 0) {
            continue;
        }

        // 打印缩进
        for (int i = 0; i < depth; i++) {
            printf("│   ");
        }

        // 构建完整路径
        char full_path[1024];
        snprintf(full_path, sizeof(full_path),
                 "%s/%s", path, entry->d_name);

        // 获取文件信息
        struct stat st;
        if (stat(full_path, &st) != 0) {
            printf("├── %s (无法访问)\n", entry->d_name);
            continue;
        }

        if (S_ISDIR(st.st_mode)) {
            printf("├── 📁 %s/\n", entry->d_name);
            // 递归！
            walk_dir(full_path, depth + 1);
        } else {
            printf("├── %s  (%lld 字节)\n",
                   entry->d_name, (long long)st.st_size);
        }
    }
    closedir(dir);
}

int main(int argc, char *argv[]) {
    const char *root = (argc >= 2) ? argv[1] : ".";

    struct stat st;
    if (stat(root, &st) != 0 || !S_ISDIR(st.st_mode)) {
        fprintf(stderr, "错误: \"%s\" 不是一个有效目录\n", root);
        return 1;
    }

    printf("%s/\n", root);
    walk_dir(root, 1);
    return 0;
}
```

输出效果像这样：

```
./
├── 📁 src/
│   ├── main.c  (1250 字节)
│   ├── utils.c  (843 字节)
│   └── 📁 tests/
│       ├── test1.c  (567 字节)
│       └── test2.c  (432 字节)
├── Makefile  (156 字节)
└── README  (2048 字节)
```

### 跳过 . 和 .. 的必要性

每个目录都有两个特殊的"虚拟条目"：

| 名称 | 含义                                      |
|------|-------------------------------------------|
| `.`  | 当前目录自身                              |
| `..` | 父目录                                    |

如果不跳过它们，递归遍历会进入无限循环（`.` → `.` → `.`...）或者"跑出"起始目录（`..` → `..` → ... 一直到根目录）。

## 4. 临时文件

有些数据只需要在程序运行期间存在——比如中间计算结果、下载缓冲。`tmpfile()` 和 `tmpnam()` 就是干这个的。

### tmpfile — 全自动临时文件

```c
#include <stdio.h>

int main() {
    // tmpfile() 创建一个临时文件，以 "wb+" 模式打开
    // 文件夹闭时自动删除，程序 crash 也会被系统清理
    FILE *tmp = tmpfile();
    if (tmp == NULL) {
        perror("tmpfile 失败");
        return 1;
    }

    // 写入一些数据
    fprintf(tmp, "第一行：敏感数据\n");
    fprintf(tmp, "第二行：临时计算结果=42\n");
    fprintf(tmp, "第三行：用完即弃\n");

    // 读取刚写入的内容
    rewind(tmp);
    char buf[256];
    while (fgets(buf, sizeof(buf), tmp)) {
        printf("读取: %s", buf);
    }

    // fclose 后文件自动消失
    fclose(tmp);
    printf("(临时文件已自动删除)\n");
    return 0;
}
```

### tmpnam — 自己管理生命周期

```c
#include <stdio.h>

int main() {
    char name[L_tmpnam];

    // 生成一个唯一的临时文件名
    tmpnam(name);
    printf("临时文件名: %s\n", name);

    // 自己打开、写入、关闭
    FILE *fp = fopen(name, "w");
    fprintf(fp, "手动管理的临时数据\n");
    fclose(fp);

    // 验证文件存在
    printf("检查文件是否存在...\n");
    fp = fopen(name, "r");
    if (fp) {
        printf("文件存在！内容: ");
        char buf[100];
        fgets(buf, sizeof(buf), fp);
        printf("%s", buf);
        fclose(fp);
    }

    // 手动删除
    remove(name);
    printf("已手动删除临时文件\n");

    return 0;
}
```

---

## 5. 一个综合工具：迷你 ls

把本章学的知识拼起来：

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <sys/stat.h>
#include <time.h>

void print_perms(mode_t mode) {
    printf((mode & S_IRUSR) ? "r" : "-");
    printf((mode & S_IWUSR) ? "w" : "-");
    printf((mode & S_IXUSR) ? "x" : "-");
    printf((mode & S_IRGRP) ? "r" : "-");
    printf((mode & S_IWGRP) ? "w" : "-");
    printf((mode & S_IXGRP) ? "x" : "-");
    printf((mode & S_IROTH) ? "r" : "-");
    printf((mode & S_IWOTH) ? "w" : "-");
    printf((mode & S_IXOTH) ? "x" : "-");
}

int main(int argc, char *argv[]) {
    const char *path = (argc >= 2) ? argv[1] : ".";

    DIR *dir = opendir(path);
    if (dir == NULL) {
        perror("opendir");
        return 1;
    }

    printf("%-10s %8s  %s\n", "权限", "大小", "名称");
    printf("──────────────────────────────────────────\n");

    struct dirent *entry;
    while ((entry = readdir(dir)) != NULL) {
        if (entry->d_name[0] == '.') continue;  // 跳过隐藏文件

        char full[1024];
        snprintf(full, sizeof(full), "%s/%s", path, entry->d_name);

        struct stat st;
        if (stat(full, &st) != 0) continue;

        // 类型 + 权限
        printf("%c", S_ISDIR(st.st_mode) ? 'd' : '-');
        print_perms(st.st_mode);

        // 大小
        printf(" %8lld", (long long)st.st_size);

        // 名字（目录后加 /）
        printf("  %s%s\n", entry->d_name,
               S_ISDIR(st.st_mode) ? "/" : "");
    }

    closedir(dir);
    return 0;
}
```

输出：

```
权限           大小  名称
──────────────────────────────────────────
-rw-r--r--     1250  main.c
-rw-r--r--      843  utils.c
drwxr-xr-x     4096  src/
-rw-r--r--      156  Makefile
```

---

## 本章掌握清单

- [ ] 会用 `stat()` 获取文件大小、权限、时间戳
- [ ] 能区分 `S_ISREG`、`S_ISDIR` 等宏的用法
- [ ] 理解 `stat` vs `lstat` vs `fstat` 的区别
- [ ] 会用 `fseek` + `ftell` 在文件中自由跳跃
- [ ] 知道 `SEEK_SET` / `SEEK_CUR` / `SEEK_END` 三种定位方式
- [ ] 能用 `opendir` / `readdir` / `closedir` 遍历目录
- [ ] 能写出递归遍历目录树的程序
- [ ] 知道如何跳过 `.` 和 `..` 避免无限循环
- [ ] 会用 `tmpfile()` 创建自动清理的临时文件

---

## 下一站

你已经掌握了文件系统的核心操作。接下来的两章是**项目实战**——我们会用本章和前几章的知识，从零开始构建一个迷你 Shell 和一个文本处理器。还记得你运行 `ls`、`grep` 这些命令时那种"它们到底是怎么工作的"好奇心吗？马上你就会亲手实现它们！
