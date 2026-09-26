import { describe, expect, it } from "vitest";
import { parseRefuelQuery, refuelInputSchema, refuelUpdateSchema } from "../validations";

const valid = {
  refuelDate: "2026-07-09",
  stationId: "st1",
  province: "กาญจนบุรี",
  pricePerLiter: 37.5,
  amount: 1500,
  odometer: 211050,
};

describe("refuelInputSchema", () => {
  it("รับข้อมูลที่ถูกต้อง และแปลงตัวเลขจาก string ได้", () => {
    expect(refuelInputSchema.parse(valid)).toMatchObject(valid);
    expect(refuelInputSchema.parse({ ...valid, amount: "1500" }).amount).toBe(1500);
  });

  it("odometer และ note ไม่บังคับ", () => {
    const rest: Partial<typeof valid> = { ...valid };
    delete rest.odometer;
    expect(refuelInputSchema.safeParse(rest).success).toBe(true);
    expect(refuelInputSchema.safeParse({ ...valid, odometer: null, note: null }).success).toBe(true);
  });

  it.each([
    ["วันที่ผิดรูปแบบ", { refuelDate: "09/07/2026" }],
    ["จังหวัดไม่มีจริง", { province: "Bangkok" }],
    ["ราคาเป็น 0", { pricePerLiter: 0 }],
    ["จำนวนเงินติดลบ", { amount: -1 }],
    ["เลขไมล์ติดลบ", { odometer: -5 }],
    ["หมายเหตุเกิน 500 ตัว", { note: "ก".repeat(501) }],
    ["ไม่เลือกสถานี", { stationId: "" }],
  ])("ปฏิเสธ: %s", (_name, patch) => {
    expect(refuelInputSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });

  it("strict: ปฏิเสธฟิลด์แปลกปลอม (เช่นส่ง userId หรือ liters มาเอง)", () => {
    expect(refuelInputSchema.safeParse({ ...valid, userId: "x" }).success).toBe(false);
    expect(refuelInputSchema.safeParse({ ...valid, liters: 99 }).success).toBe(false);
  });

  it("update schema: ส่งบางฟิลด์ได้", () => {
    expect(refuelUpdateSchema.safeParse({ amount: 100 }).success).toBe(true);
  });
});

describe("parseRefuelQuery", () => {
  it("ใส่ค่า default", () => {
    expect(parseRefuelQuery(new URLSearchParams())).toEqual({
      range: "all",
      page: 1,
      pageSize: 50,
      sort: "date-desc",
    });
  });

  it("แปลงตัวเลขและตรวจขอบเขต", () => {
    const q = parseRefuelQuery(new URLSearchParams("range=custom&from=2026-07-01&page=2&pageSize=100"));
    expect(q).toMatchObject({ range: "custom", from: "2026-07-01", page: 2, pageSize: 100 });
    expect(() => parseRefuelQuery(new URLSearchParams("pageSize=501"))).toThrow();
    expect(() => parseRefuelQuery(new URLSearchParams("range=forever"))).toThrow();
  });
});
