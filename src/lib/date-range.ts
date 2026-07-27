import type { RefuelQuery } from "./validations";

export interface ResolvedRange {
  gte?: Date;
  lte?: Date;
  label: string;
}

function utc(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d));
}

/** แปลงตัวเลือกช่วงเวลาเป็นช่วงวันที่จริง (อิง UTC เพราะคอลัมน์เป็น @db.Date) */
export function resolveDateRange(query: Pick<RefuelQuery, "range" | "from" | "to">): ResolvedRange {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const today = utc(y, m, d);

  switch (query.range) {
    case "7d":
      return { gte: utc(y, m, d - 6), lte: today, label: "7 วันล่าสุด" };
    case "30d":
      return { gte: utc(y, m, d - 29), lte: today, label: "30 วันล่าสุด" };
    case "this-month":
      return { gte: utc(y, m, 1), lte: utc(y, m + 1, 0), label: "เดือนนี้" };
    case "last-month":
      return { gte: utc(y, m - 1, 1), lte: utc(y, m, 0), label: "เดือนที่แล้ว" };
    case "this-year":
      return { gte: utc(y, 0, 1), lte: utc(y, 11, 31), label: "ปีนี้" };
    case "custom": {
      const gte = query.from ? new Date(`${query.from}T00:00:00.000Z`) : undefined;
      const lte = query.to ? new Date(`${query.to}T00:00:00.000Z`) : undefined;
      const label = [query.from ?? "เริ่มต้น", query.to ?? "ปัจจุบัน"].join(" ถึง ");
      return { gte, lte, label };
    }
    default:
      return { label: "ทั้งหมด" };
  }
}
