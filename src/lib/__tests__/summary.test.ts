import { describe, expect, it } from "vitest";
import { calculateSummary } from "../refuel-service";
import type { RefuelDto } from "@/types/refuel";

const station = { id: "s1", code: "PT", nameTh: "พีที", nameEn: "PT" };

function row(p: Partial<RefuelDto>): RefuelDto {
  return {
    id: Math.random().toString(36),
    refuelDate: "2026-07-01",
    province: "กรุงเทพมหานคร",
    pricePerLiter: 40,
    amount: 400,
    liters: 10,
    odometer: null,
    note: null,
    station,
    ...p,
  };
}

describe("calculateSummary", () => {
  it("คืนค่าศูนย์/null เมื่อไม่มีรายการ", () => {
    const s = calculateSummary([], "ทั้งหมด");
    expect(s).toEqual({
      count: 0,
      totalLiters: 0,
      totalAmount: 0,
      totalDistance: 0,
      avgKmPerLiter: null,
      avgPricePerLiter: null,
      costPerKm: null,
      rangeLabel: "ทั้งหมด",
    });
  });

  it("ไม่คำนวณระยะทาง/อัตราสิ้นเปลือง เมื่อมีเลขไมล์น้อยกว่า 2 ครั้ง", () => {
    const s = calculateSummary([row({ odometer: 1000 }), row({})], "x");
    expect(s.totalDistance).toBe(0);
    expect(s.avgKmPerLiter).toBeNull();
    expect(s.costPerKm).toBeNull();
    expect(s.totalLiters).toBe(20);
    expect(s.avgPricePerLiter).toBe(40);
  });

  it("full-tank method: ไม่นับลิตรของครั้งแรก (เรียงตามเลขไมล์)", () => {
    // ส่งมาไม่เรียง เพื่อยืนยันว่าเรียงตามเลขไมล์ก่อน
    const s = calculateSummary(
      [
        row({ odometer: 1300, liters: 20, amount: 800 }),
        row({ odometer: 1000, liters: 50, amount: 2000 }), // ครั้งแรก — ไม่นับ
        row({ odometer: 1100, liters: 10, amount: 400 }),
      ],
      "x"
    );
    expect(s.totalDistance).toBe(300);
    expect(s.avgKmPerLiter).toBe(10); // 300 / (20 + 10)
    expect(s.totalAmount).toBe(3200);
    expect(s.costPerKm).toBe(10.67); // 3200 / 300
  });

  it("ข้ามรายการที่ไม่มีเลขไมล์ในการคำนวณระยะทาง แต่ยังนับยอดเงิน", () => {
    const s = calculateSummary(
      [row({ odometer: 1000 }), row({ odometer: null, amount: 100 }), row({ odometer: 1200, liters: 20 })],
      "x"
    );
    expect(s.count).toBe(3);
    expect(s.totalDistance).toBe(200);
    expect(s.avgKmPerLiter).toBe(10);
    expect(s.totalAmount).toBe(900);
  });

  it("ปัดทศนิยมตามหน่วย (ลิตร 3 ตำแหน่ง, เงิน 2 ตำแหน่ง)", () => {
    const s = calculateSummary(
      [row({ liters: 40.0881, amount: 2000.004 }), row({ liters: 20.0441, amount: 1000.001 })],
      "x"
    );
    expect(s.totalLiters).toBe(60.132);
    expect(s.totalAmount).toBe(3000.01);
  });
});
