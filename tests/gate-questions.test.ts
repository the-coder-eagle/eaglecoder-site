import { describe, expect, it } from 'vitest';
import { easyQuestions, hardQuestions } from '../src/assets/gate-questions';

describe('进站题库', () => {
  const allQuestions = [...easyQuestions, ...hardQuestions];

  it('两个难度都至少保留一道题', () => {
    expect(easyQuestions.length).toBeGreaterThan(0);
    expect(hardQuestions.length).toBeGreaterThan(0);
  });

  it('每道题都有题目和答案', () => {
    for (const question of allQuestions) {
      expect(question.q.trim()).not.toBe('');
      expect(question.a.trim()).not.toBe('');
    }
  });

  it('不会出现重复题目', () => {
    const questionTexts = allQuestions.map((question) => question.q);

    expect(new Set(questionTexts).size).toBe(questionTexts.length);
  });
});
