const nf = (min: number, max: number) =>
  new Intl.NumberFormat("th-TH", { minimumFractionDigits: min, maximumFractionDigits: max });

/** 1,234.56 */
export function formatNumber(value: number | string | null | undefined, digits = 2) {
  const n = toNumber(value);
  if (n === null) return "-";
  return nf(digits, digits).format(n);
}

/** 1,234.567 ลิตร */
export function formatLiters(value: number | string | null | undefined) {
  return formatNumber(value, 2);
}

/** 2026-07-09 -> 09/07/2569 (พ.ศ.) */
export function formatThaiDate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear() + 543;
  return `${day}/${month}/${year}`;
}

/** 2026-07-09 (ค.ศ.) สำหรับ input[type=date] และ CSV */
export function toISODate(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
