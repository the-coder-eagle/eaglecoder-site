import { describe, expect, it } from 'vitest';
import { isNavigationItemActive, primaryNavigation } from '../src/config/navigation';

describe('主导航配置', () => {
  it('每个入口都有唯一的路径和编号', () => {
    expect(new Set(primaryNavigation.map((item) => item.href)).size).toBe(primaryNavigation.length);
    expect(new Set(primaryNavigation.map((item) => item.index)).size).toBe(primaryNavigation.length);
  });

  it('栏目首页和子页面都能正确高亮', () => {
    expect(isNavigationItemActive('/posts', '/posts')).toBe(true);
    expect(isNavigationItemActive('/posts/hello-world', '/posts')).toBe(true);
    expect(isNavigationItemActive('/posts/', '/posts')).toBe(true);
  });

  it('相似前缀不会误判为当前栏目', () => {
    expect(isNavigationItemActive('/postscript', '/posts')).toBe(false);
    expect(isNavigationItemActive('/', '/posts')).toBe(false);
  });
});
