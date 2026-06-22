// 简易内存频率限制中间件
// 每个 IP 每分钟最多 maxRequests 次请求

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

// 每 15 分钟清理一次过期桶
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > 15 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}, 15 * 60 * 1000);

export function rateLimit(maxRequests: number, windowMs: number) {
  return async (c: any, next: any) => {
    const ip =
      c.req.header('x-forwarded-for') ||
      c.req.header('x-real-ip') ||
      'unknown';

    let bucket = buckets.get(ip);

    if (!bucket) {
      bucket = { tokens: maxRequests, lastRefill: Date.now() };
      buckets.set(ip, bucket);
    }

    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    // 按时间比例恢复令牌
    if (elapsed > windowMs) {
      bucket.tokens = maxRequests;
      bucket.lastRefill = now;
    } else if (elapsed > 0) {
      const refill = Math.floor((elapsed / windowMs) * maxRequests);
      if (refill > 0) {
        bucket.tokens = Math.min(maxRequests, bucket.tokens + refill);
        bucket.lastRefill = now;
      }
    }

    if (bucket.tokens <= 0) {
      return new Response(JSON.stringify({ error: '请求太频繁，请稍后再试' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 先扣令牌，但保留到请求结束后（失败可退）
    bucket.tokens--;
    try {
      await next();
    } catch {
      bucket.tokens++; // 请求失败，退还令牌
      throw new Error('Rate limit middleware: downstream error');
    }
  };
}
