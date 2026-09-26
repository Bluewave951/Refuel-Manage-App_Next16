import { describe, expect, it } from "vitest";
import { checkOdometerOrder } from "../refuel-service";

describe("checkOdometerOrder", () => {
  it("ผ่านเมื่อไม่มีรายการอื่นให้เทียบ", () => {
    expect(checkOdometerOrder(1000, null, null)).toBeNull();
  });

  it("ผ่านเมื่ออยู่ระหว่างครั้งก่อนและครั้งถัดไป (เท่ากันได้)", () => {
    expect(checkOdometerOrder(1500, 1000, 2000)).toBeNull();
    expect(checkOdometerOrder(1000, 1000, 1000)).toBeNull();
  });

  it("ไม่ผ่านเมื่อน้อยกว่าครั้งก่อนหน้า", () => {
    expect(checkOdometerOrder(999, 1000, null)).toMatch(/ไม่น้อยกว่าครั้งก่อนหน้า/);
  });

  it("ไม่ผ่านเมื่อมากกว่าครั้งถัดไป (กรณีบันทึกย้อนหลัง)", () => {
    expect(checkOdometerOrder(2001, null, 2000)).toMatch(/ไม่มากกว่าครั้งถัดไป/);
  });
});
