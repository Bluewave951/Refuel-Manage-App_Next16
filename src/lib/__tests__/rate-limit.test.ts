import { describe, expect, it } from "vitest";
import { createRateLimiter, RateLimitError } from "../rate-limit";

describe("createRateLimiter", () => {
  it("ยอมให้ถึง limit แล้ว throw พร้อมเวลาที่ต้องรอ", () => {
    const check = createRateLimiter({ limit: 2, windowMs: 60_000 });
    check("u1", 0);
    check("u1", 1_000);
    try {
      check("u1", 2_000);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).retryAfterSec).toBe(58);
    }
  });

  it("นับแยกตามผู้ใช้", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    check("u1", 0);
    expect(() => check("u2", 0)).not.toThrow();
  });

  it("หน้าต่างเลื่อน: คำขอเก่าหมดอายุแล้วส่งได้อีก", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    check("u1", 0);
    expect(() => check("u1", 59_999)).toThrow(RateLimitError);
    expect(() => check("u1", 60_000)).not.toThrow();
  });
});
