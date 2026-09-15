import { describe, expect, it } from 'vitest';
import { isGateAnswerCorrect, normalizeGateAnswer } from '../src/utils/gate';

describe('访问门答题规则', () => {
  it('忽略答案两端空格与英文大小写', () => {
    expect(normalizeGateAnswer('  EagleCoder  ')).toBe('eaglecoder');
    expect(isGateAnswerCorrect(' EAGLE ', 'eagle')).toBe(true);
  });

  it('接受用竖线分隔的等价答案', () => {
    expect(isGateAnswerCorrect('安徽省', '安徽|安徽省')).toBe(true);
  });

  it('拒绝空答案与不匹配答案', () => {
    expect(isGateAnswerCorrect('  ', '答案')).toBe(false);
    expect(isGateAnswerCorrect('南京', '北京')).toBe(false);
  });
});
