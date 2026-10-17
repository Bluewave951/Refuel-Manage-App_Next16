import { describe, expect, it } from "vitest";
import { lineTotalOf, serviceTotals } from "../service-totals";
import { serviceInputSchema } from "../validations";

describe("service totals", () => {
  it("คิดยอดต่อรายการ = จำนวน × ราคา − ส่วนลด", () => {
    expect(lineTotalOf({ quantity: 1, unitPrice: 1790, discount: 286.5 })).toBe(1503.5);
    expect(lineTotalOf({ quantity: 2, unitPrice: 250, discount: 0 })).toBe(500);
  });

  it("ใบเสร็จ B-Quik รวม 2,412.39", () => {
    const items = [
      { quantity: 1, unitPrice: 1790, discount: 286.5 },
      { quantity: 1, unitPrice: 245, discount: 7.35 },
      { quantity: 1, unitPrice: 12, discount: 0.36 },
      { quantity: 1, unitPrice: 330, discount: 9.9 },
      { quantity: 1, unitPrice: 350, discount: 10.5 },
    ];
    expect(serviceTotals({ items, discount: 0 })).toEqual({ subtotal: 2412.39, totalAmount: 2412.39 });
  });

  it("หักส่วนลดท้ายบิล", () => {
    const items = [{ quantity: 1, unitPrice: 3800, discount: 0 }, { quantity: 1, unitPrice: 600, discount: 0 }];
    expect(serviceTotals({ items, discount: 400 })).toEqual({ subtotal: 4400, totalAmount: 4000 });
  });
});

describe("serviceInputSchema", () => {
  const base = { serviceDate: "2024-09-23", shopName: "ร้านซ่อม", items: [{ description: "ค่าแรง", quantity: 1, unitPrice: 400 }] };

  it("ผ่านเมื่อข้อมูลครบ", () => {
    expect(serviceInputSchema.safeParse(base).success).toBe(true);
  });

  it("ต้องมีอย่างน้อย 1 รายการ", () => {
    expect(serviceInputSchema.safeParse({ ...base, items: [] }).success).toBe(false);
  });

  it("ต้องระบุชื่อร้าน", () => {
    expect(serviceInputSchema.safeParse({ ...base, shopName: " " }).success).toBe(false);
  });
});
