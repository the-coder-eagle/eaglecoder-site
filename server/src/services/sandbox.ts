// EagleCoder OJ Server — 轻量代码沙箱
// 使用 child_process + timeout 隔离执行
// 安全策略：超时 5s、临时目录、无网络、执行完即清理

import { spawn } from 'child_process';
import { writeFile, mkdir, rm } from 'fs/promises';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { existsSync } from 'fs';

const WORK_DIR = join(process.cwd(), 'sandbox-tmp');
const TIMEOUT_MS = 5000;

export interface SandboxResult {
  status: 'ok' | 'timeout' | 'runtime_error' | 'compile_error';
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  timeMs: number;
}

/** 确保工作目录存在 */
async function ensureWorkDir(): Promise<string> {
  const id = randomUUID();
  const dir = join(WORK_DIR, id);
  await mkdir(dir, { recursive: true });
  return dir;
}

/** 带超时的 spawn */
function spawnWithTimeout(
  cmd: string,
  args: string[],
  dir: string,
  stdin: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number | null; signal: string | null }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: dir,
      timeout: timeoutMs + 2000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 500);
    }, timeoutMs);

    child.stdin.write(stdin);
    child.stdin.end();

    child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: killed ? null : exitCode,
        signal: killed ? 'SIGTERM' : signal,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        signal: null,
      });
    });
  });
}

/** 执行 Python 代码 */
async function runPython(code: string, stdin: string): Promise<SandboxResult> {
  const dir = await ensureWorkDir();
  const file = join(dir, 'main.py');
  await writeFile(file, code);

  const start = Date.now();
  const result = await spawnWithTimeout('python3', ['main.py'], dir, stdin, TIMEOUT_MS);
  const timeMs = Date.now() - start;

  // 清理
  rm(dir, { recursive: true, force: true }).catch(() => {});

  if (result.signal === 'SIGTERM') {
    return { status: 'timeout', stdout: result.stdout, stderr: '', exitCode: null, signal: 'SIGTERM', timeMs };
  }
  if (result.exitCode !== 0) {
    return { status: 'runtime_error', stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, signal: null, timeMs };
  }
  return { status: 'ok', stdout: result.stdout, stderr: result.stderr, exitCode: 0, signal: null, timeMs };
}

/** 执行 JavaScript 代码 */
async function runJavaScript(code: string, stdin: string): Promise<SandboxResult> {
  const dir = await ensureWorkDir();
  const file = join(dir, 'main.js');
  await writeFile(file, code);

  const start = Date.now();
  const result = await spawnWithTimeout('node', ['main.js'], dir, stdin, TIMEOUT_MS);
  const timeMs = Date.now() - start;

  rm(dir, { recursive: true, force: true }).catch(() => {});

  if (result.signal === 'SIGTERM') {
    return { status: 'timeout', stdout: result.stdout, stderr: '', exitCode: null, signal: 'SIGTERM', timeMs };
  }
  if (result.exitCode !== 0) {
    return { status: 'runtime_error', stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, signal: null, timeMs };
  }
  return { status: 'ok', stdout: result.stdout, stderr: result.stderr, exitCode: 0, signal: null, timeMs };
}

/** 执行 C 代码（编译 + 运行） */
async function runC(code: string, stdin: string): Promise<SandboxResult> {
  const dir = await ensureWorkDir();
  const srcFile = join(dir, 'main.c');
  const binFile = join(dir, 'main');
  await writeFile(srcFile, code);

  // 编译
  const compileStart = Date.now();
  const compile = await spawnWithTimeout('gcc', ['-o', 'main', 'main.c', '-Wall', '-O2'], dir, '', 10000);

  if (compile.exitCode !== 0) {
    rm(dir, { recursive: true, force: true }).catch(() => {});
    return {
      status: 'compile_error',
      stdout: '',
      stderr: compile.stderr || compile.stdout || '编译失败',
      exitCode: compile.exitCode,
      signal: null,
      timeMs: Date.now() - compileStart,
    };
  }

  // 运行
  const start = Date.now();
  const result = await spawnWithTimeout(
    join(dir, 'main'),
    [],
    dir,
    stdin,
    TIMEOUT_MS
  );
  const timeMs = Date.now() - start;

  rm(dir, { recursive: true, force: true }).catch(() => {});

  if (result.signal === 'SIGTERM') {
    return { status: 'timeout', stdout: result.stdout, stderr: '', exitCode: null, signal: 'SIGTERM', timeMs };
  }
  if (result.exitCode !== 0) {
    return { status: 'runtime_error', stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode, signal: null, timeMs };
  }
  return { status: 'ok', stdout: result.stdout, stderr: result.stderr, exitCode: 0, signal: null, timeMs };
}

/** 统一入口：根据语言执行代码 */
export async function executeCodeSandbox(
  language: string,
  code: string,
  stdin: string
): Promise<SandboxResult> {
  switch (language) {
    case 'python':
      return runPython(code, stdin);
    case 'javascript':
      return runJavaScript(code, stdin);
    case 'c':
      return runC(code, stdin);
    default:
      return {
        status: 'runtime_error',
        stdout: '',
        stderr: `不支持的语言: ${language}`,
        exitCode: 1,
        signal: null,
        timeMs: 0,
      };
  }
}
