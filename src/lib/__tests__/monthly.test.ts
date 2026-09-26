import { describe, expect, it } from "vitest";
import { monthlyTrend } from "../refuel-service";
import type { RefuelDto } from "@/types/refuel";

const station = { id: "s1", code: "PT", nameTh: "พีที", nameEn: "PT" };
const row = (refuelDate: string, amount: number, liters: number): RefuelDto => ({
  id: refuelDate + amount,
  refuelDate,
  province: "กรุงเทพมหานคร",
  pricePerLiter: amount / liters,
  amount,
  liters,
  odometer: null,
  note: null,
  station,
});

describe("monthlyTrend", () => {
  it("ไม่มีรายการ → อาร์เรย์ว่าง", () => {
    expect(monthlyTrend([])).toEqual([]);
  });

  it("รวมยอดต่อเดือน และราคาเฉลี่ยถ่วงน้ำหนักด้วยลิตร", () => {
    const [m] = monthlyTrend([row("2026-07-01", 400, 10), row("2026-07-20", 1000, 20)]);
    expect(m).toEqual({ month: "2026-07", count: 2, totalAmount: 1400, totalLiters: 30, avgPricePerLiter: 46.67 });
  });

  it("เรียงเก่า→ใหม่ และเติมเดือนที่ว่างข้ามปี", () => {
    const out = monthlyTrend([row("2026-02-05", 500, 10), row("2025-11-10", 400, 10)]);
    expect(out.map((p) => p.month)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(out[1]).toEqual({ month: "2025-12", count: 0, totalAmount: 0, totalLiters: 0, avgPricePerLiter: null });
  });
});
