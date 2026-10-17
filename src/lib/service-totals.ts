import type { ServiceInput, ServiceItemInput } from "./validations";

function round(n: number, digits = 2) {
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/** ยอดต่อรายการ = จำนวน × ราคาต่อหน่วย − ส่วนลด (ไม่ต่ำกว่า 0) */
export function lineTotalOf(item: Pick<ServiceItemInput, "quantity" | "unitPrice" | "discount">) {
  const q = Number(item.quantity) || 0;
  const p = Number(item.unitPrice) || 0;
  const d = Number(item.discount) || 0;
  return Math.max(0, round(q * p - d));
}

/** subtotal = Σ ยอดต่อรายการ, totalAmount = subtotal − ส่วนลดท้ายบิล */
export function serviceTotals(input: {
  items: Pick<ServiceItemInput, "quantity" | "unitPrice" | "discount">[];
  discount: ServiceInput["discount"];
}) {
  const subtotal = round(input.items.reduce((s, it) => s + lineTotalOf(it), 0));
  const totalAmount = Math.max(0, round(subtotal - (Number(input.discount) || 0)));
  return { subtotal, totalAmount };
}
