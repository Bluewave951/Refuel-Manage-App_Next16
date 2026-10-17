import type { NextRequest } from "next/server";
import { handleError } from "@/lib/api";
import { listServices } from "@/lib/service-service";
import { parseServiceQuery } from "@/lib/validations";
import { toCsv, UTF8_BOM } from "@/lib/csv";
import { formatThaiDate } from "@/lib/format";
import { requireUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/export/services-csv — ใบเสร็จซ่อมบำรุงเป็น CSV (1 แถว = 1 รายการในใบเสร็จ, เปิดใน Excel ได้เลย) */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { items, summary } = await listServices(userId, parseServiceQuery(req.nextUrl.searchParams));

    const headers = [
      "วันที่",
      "วันที่ (พ.ศ.)",
      "ร้าน/อู่",
      "เลขที่ใบเสร็จ",
      "ทะเบียน",
      "ยี่ห้อ/รุ่น",
      "เลขไมล์ (กม.)",
      "รหัส",
      "รายการ",
      "จำนวน",
      "หน่วย",
      "ราคา/หน่วย (บาท)",
      "ส่วนลด (บาท)",
      "รวม (บาท)",
      "ยอดสุทธิทั้งใบ (บาท)",
      "ชำระโดย",
      "หมายเหตุ",
    ];

    const rows = items.flatMap((r) =>
      r.items.map((it, i) => [
        r.serviceDate,
        formatThaiDate(r.serviceDate),
        r.shopName,
        r.receiptNo ?? "",
        r.plateNo ?? "",
        r.vehicleModel ?? "",
        r.odometer?.toFixed(0) ?? "",
        it.itemCode ?? "",
        it.description,
        it.quantity.toFixed(2),
        it.unit ?? "",
        it.unitPrice.toFixed(2),
        it.discount.toFixed(2),
        it.lineTotal.toFixed(2),
        // ยอดทั้งใบใส่เฉพาะแถวแรกของใบ เพื่อให้ SUM ทั้งคอลัมน์ได้ยอดถูก
        i === 0 ? r.totalAmount.toFixed(2) : "",
        i === 0 ? (r.paymentMethod ?? "") : "",
        i === 0 ? (r.note ?? "") : "",
      ])
    );

    // ต่อท้ายด้วยบรรทัดสรุป
    rows.push([]);
    rows.push(["สรุป", summary.rangeLabel]);
    rows.push(["จำนวนใบเสร็จ", String(summary.count)]);
    rows.push(["ค่าซ่อมบำรุงรวม (บาท)", summary.totalAmount.toFixed(2)]);
    rows.push(["เฉลี่ยต่อครั้ง (บาท)", summary.avgAmount?.toFixed(2) ?? "-"]);

    const csv = UTF8_BOM + toCsv(headers, rows);
    const filename = `service-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
