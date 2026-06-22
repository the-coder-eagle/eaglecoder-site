// EagleCoder OJ Server — Piston 判题 API 客户端

const PISTON_URL = 'https://emkc.org/api/v2/piston';

export interface PistonExecuteRequest {
  language: string;
  version: string;
  files: { name?: string; content: string }[];
  stdin?: string;
  run_timeout?: number;
  compile_timeout?: number;
}

export interface PistonExecuteResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
}

/** 语言映射：前端 language → Piston language + version */
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  c: { language: 'c', version: '10.2.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  python: { language: 'python', version: '3.10.0' },
};

/** 支持的语言列表 */
export function getSupportedLanguages() {
  return Object.keys(LANGUAGE_MAP);
}

/** 执行代码 */
export async function executeCode(
  lang: string,
  code: string,
  stdin: string,
  timeoutMs = 5000
): Promise<PistonExecuteResult> {
  const langInfo = LANGUAGE_MAP[lang];
  if (!langInfo) {
    throw new Error(`不支持的语言: ${lang}`);
  }

  const res = await fetch(`${PISTON_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: langInfo.language,
      version: langInfo.version,
      files: [{ name: 'main', content: code }],
      stdin,
      run_timeout: Math.floor(timeoutMs / 1000),
      compile_timeout: 10000,
    }),
  });

  if (!res.ok) {
    throw new Error(`Piston API 错误: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<PistonExecuteResult>;
}

/** 查询 Piston 支持的运行时列表（可选，用于诊断） */
export async function getRuntimes(): Promise<unknown> {
  const res = await fetch(`${PISTON_URL}/runtimes`);
  return res.json();
}
