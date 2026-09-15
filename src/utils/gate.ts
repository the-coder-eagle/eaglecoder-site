export const MAX_GATE_ATTEMPTS = 3;
export const GATE_LOCK_MINUTES = 10;

export function normalizeGateAnswer(answer: string): string {
  return answer.trim().toLocaleLowerCase();
}

/** 支持用竖线声明多个等价答案，例如“安徽|安徽省”。 */
export function isGateAnswerCorrect(input: string, expected: string): boolean {
  const normalizedInput = normalizeGateAnswer(input);
  if (!normalizedInput) return false;

  return expected
    .split('|')
    .map(normalizeGateAnswer)
    .some((answer) => answer === normalizedInput);
}
