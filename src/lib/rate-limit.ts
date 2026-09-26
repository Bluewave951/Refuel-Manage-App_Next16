/**
 * Rate limit แบบ sliding window เก็บในหน่วยความจำ (แยกตาม key เช่น userId)
 *
 * พอสำหรับแอปผู้ใช้ไม่เกิน 10 คนที่ต้องล็อกอินก่อนเสมอ — บน serverless แต่ละ instance
 * นับแยกกัน จึงเป็นการกันกดรัว/สคริปต์ผิดพลาด ไม่ใช่การป้องกันแบบเข้มงวด
 */
export class RateLimitError extends Error {
  constructor(public retryAfterSec: number) {
    super("ส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่");
  }
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return function check(key: string, now = Date.now()) {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      throw new RateLimitError(Math.ceil((recent[0] + windowMs - now) / 1000));
    }
    recent.push(now);
    hits.set(key, recent);
  };
}

/** POST / PATCH / DELETE รายการเติมน้ำมัน: 30 ครั้งต่อนาทีต่อผู้ใช้ */
export const limitMutations = createRateLimiter({ limit: 30, windowMs: 60_000 });
