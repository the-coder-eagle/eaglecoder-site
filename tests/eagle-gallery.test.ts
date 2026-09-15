import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { eagleGallery } from '../src/data/eagle-gallery';

describe('娘化白头海雕画廊', () => {
  it('至少包含 20 个唯一场景', () => {
    expect(eagleGallery.length).toBeGreaterThanOrEqual(20);
    expect(new Set(eagleGallery.map((item) => item.src)).size).toBe(eagleGallery.length);
    expect(new Set(eagleGallery.map((item) => item.title)).size).toBe(eagleGallery.length);
  });

  it('每张图片都有替代文本并对应 public 中的文件', () => {
    eagleGallery.forEach((item) => {
      expect(item.alt.length).toBeGreaterThan(8);
      expect(item.src.startsWith('/eagle-gallery/')).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), 'public', item.src.slice(1)))).toBe(true);
    });
  });
});
