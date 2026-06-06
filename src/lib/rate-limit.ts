const submissions = new Map<string, { count: number; resetAt: number }>();

const MAX_SUBMISSIONS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const entry = submissions.get(ip);

  if (!entry || now > entry.resetAt) {
    submissions.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_SUBMISSIONS - 1, resetIn: WINDOW_MS };
  }

  if (entry.count >= MAX_SUBMISSIONS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_SUBMISSIONS - entry.count,
    resetIn: entry.resetAt - now,
  };
}
