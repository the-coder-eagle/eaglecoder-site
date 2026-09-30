import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

// 构建后执行：node --test tests/frontend-build.smoke.mjs。
// 检查真实产物，避免只验证源码字符串却漏掉失效链接和图片。
const readPage = (route) => readFileSync(path.join('dist', route, 'index.html'), 'utf8');
const docRoutes = readdirSync('dist/docs', { recursive: true }).filter(file => file.endsWith('index.html'))
  .map(file => path.join('docs', path.dirname(file)));
const routes = [...new Set(['', 'posts', 'projects', 'docs', 'about', 'chat', 'challenge',
  'challenge/history', 'challenge/leaderboard', 'posts/hello-world',
  'projects/c-learn', ...docRoutes])];

for (const route of routes) {
  test(`/${route}：正文、导航和本地图片可用`, () => {
    const html = readPage(route);
    assert.equal([...html.matchAll(/id="main-content"/g)].length, 1);
    assert.ok(html.includes('跳到正文'));
    for (const [, src] of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
      if (src.startsWith('/')) assert.ok(existsSync(path.join('dist', src.slice(1))), src);
    }
    for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"/g)) {
      const pathname = href.split(/[?#]/)[0];
      const target = pathname.endsWith('.xml') ? path.join('dist', pathname.slice(1))
        : path.join('dist', pathname.slice(1), 'index.html');
      assert.ok(existsSync(target), `无效本地链接 ${href}`);
    }
  });
}

test('首页保留内容入口，相册默认收起且完整保留二十个场景', () => {
  const html = readPage('');
  const album = html.match(/<details>([\s\S]*?)<\/details>/)?.[1];
  assert.ok(album, '使用原生 details，在无 JavaScript 时仍可打开');
  assert.equal([...album.matchAll(/<figure\b/g)].length, 20);
  assert.ok(html.indexOf('动手做的东西') < html.indexOf('代码之外的小相册'));
  assert.ok(html.includes('fetchpriority="high"'));
  assert.ok(!html.includes('og-default.png'), '分享图片必须对应真实文件');
});

test('交互页保留脚本依赖的输入和操作入口', () => {
  const chat = readPage('chat');
  for (const id of ['chat-input', 'chat-send', 'chat-messages', 'chat-clear']) {
    assert.ok(chat.includes(`id="${id}"`));
  }
  const challenge = readPage('challenge');
  for (const id of ['challenge-data', 'submit-btn', 'username-input', 'results-container']) {
    assert.ok(challenge.includes(`id="${id}"`));
  }
});

test('独立聊天页面保留访问验证，不进入搜索索引', () => {
  const html = readPage('lover');
  assert.ok(html.includes('noindex, nofollow'));
  assert.ok(html.includes('data-pagefind-ignore'));
  for (const id of ['lover-gate', 'lover-password-input', 'lover-chat', 'lover-send-btn']) {
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.ok(!html.includes('id="gate-overlay"'), '不加载公共问答，避免两个验证层冲突');
});
