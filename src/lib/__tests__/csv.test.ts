import { describe, expect, it } from "vitest";
import { toCsv, UTF8_BOM } from "../csv";

describe("toCsv", () => {
  it("คั่นด้วย comma และขึ้นบรรทัดด้วย CRLF", () => {
    expect(toCsv(["a", "b"], [[1, "x"], [2, "y"]])).toBe("a,b\r\n1,x\r\n2,y");
  });

  it("null/undefined เป็นช่องว่าง", () => {
    expect(toCsv(["a", "b"], [[null, undefined]])).toBe("a,b\r\n,");
  });

  it("ครอบ quote เมื่อมี comma, quote หรือขึ้นบรรทัดใหม่", () => {
    expect(toCsv(["h"], [["a,b"], ['say "hi"'], ["l1\nl2"]])).toBe('h\r\n"a,b"\r\n"say ""hi"""\r\n"l1\nl2"');
  });

  it("กัน formula injection: ค่าที่ขึ้นต้นด้วย = + - @", () => {
    expect(toCsv(["h"], [["=SUM(A1)"], ["+1"], ["-1"], ["@x"]])).toBe("h\r\n'=SUM(A1)\r\n'+1\r\n'-1\r\n'@x");
  });

  it("ภาษาไทยผ่านได้ตามปกติ และมี BOM สำหรับ Excel", () => {
    expect(toCsv(["จังหวัด"], [["กรุงเทพมหานคร"]])).toBe("จังหวัด\r\nกรุงเทพมหานคร");
    expect(UTF8_BOM).toBe("﻿");
  });
});
