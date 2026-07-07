import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const robots = `User-agent: *
Disallow: /lover
Allow: /
Sitemap: ${new URL('sitemap-index.xml', site).href}
`;
  return new Response(robots, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
