export interface NavigationItem {
  href: string;
  label: string;
  index: string;
  accent?: boolean;
}

export const primaryNavigation: NavigationItem[] = [
  { href: '/posts', label: '文章', index: '01' },
  { href: '/projects', label: '项目', index: '02' },
  { href: '/docs', label: '文档', index: '03' },
  { href: '/challenge', label: '每日一题', index: '04', accent: true },
  { href: '/chat', label: 'AI 助手', index: '05' },
  { href: '/about', label: '关于', index: '06' },
];

/**
 * 只让真正属于该栏目的路径高亮。
 * 例如 /posts 和 /posts/hello 都属于“文章”，但 /postscript 不属于。
 */
export function isNavigationItemActive(pathname: string, href: string): boolean {
  const normalizedPath = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname;
  const normalizedHref = href !== '/' ? href.replace(/\/+$/, '') : href;

  if (normalizedHref === '/') return normalizedPath === '/';

  return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
}
