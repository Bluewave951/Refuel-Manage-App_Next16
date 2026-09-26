import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveDateRange } from "../date-range";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("resolveDateRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00.000Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("all: ไม่มีขอบเขต", () => {
    expect(resolveDateRange({ range: "all" })).toEqual({ label: "ทั้งหมด" });
  });

  it("7d / 30d: รวมวันนี้", () => {
    expect(resolveDateRange({ range: "7d" })).toMatchObject({ gte: d("2026-03-09"), lte: d("2026-03-15") });
    expect(resolveDateRange({ range: "30d" })).toMatchObject({ gte: d("2026-02-14"), lte: d("2026-03-15") });
  });

  it("this-month / last-month: วันแรกถึงวันสุดท้ายของเดือน", () => {
    expect(resolveDateRange({ range: "this-month" })).toMatchObject({ gte: d("2026-03-01"), lte: d("2026-03-31") });
    expect(resolveDateRange({ range: "last-month" })).toMatchObject({ gte: d("2026-02-01"), lte: d("2026-02-28") });
  });

  it("last-month ข้ามปีได้ถูกต้อง", () => {
    vi.setSystemTime(new Date("2026-01-10T00:00:00.000Z"));
    expect(resolveDateRange({ range: "last-month" })).toMatchObject({ gte: d("2025-12-01"), lte: d("2025-12-31") });
  });

  it("this-year", () => {
    expect(resolveDateRange({ range: "this-year" })).toMatchObject({ gte: d("2026-01-01"), lte: d("2026-12-31") });
  });

  it("custom: ใช้ from/to และสร้าง label", () => {
    expect(resolveDateRange({ range: "custom", from: "2026-07-01", to: "2026-07-31" })).toEqual({
      gte: d("2026-07-01"),
      lte: d("2026-07-31"),
      label: "2026-07-01 ถึง 2026-07-31",
    });
    expect(resolveDateRange({ range: "custom", from: "2026-07-01" })).toEqual({
      gte: d("2026-07-01"),
      lte: undefined,
      label: "2026-07-01 ถึง ปัจจุบัน",
    });
  });
});
