/** ครอบค่าให้ปลอดภัยสำหรับ CSV + กัน formula injection ใน Excel */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) lines.push(row.map(escapeCell).join(","));
  return lines.join("\r\n");
}

/** BOM ทำให้ Excel อ่านภาษาไทยได้ถูกต้อง */
export const UTF8_BOM = "\uFEFF";
