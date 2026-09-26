import type { NextRequest } from "next/server";
import { handleError } from "@/lib/api";
import { listAllRefuels } from "@/lib/refuel-service";
import { parseRefuelQuery } from "@/lib/validations";
import { toCsv, UTF8_BOM } from "@/lib/csv";
import { formatThaiDate } from "@/lib/format";
import { requireUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/export/csv — ดาวน์โหลดไฟล์ CSV (เปิดใน Excel ได้เลย) */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const query = parseRefuelQuery(req.nextUrl.searchParams);
    const { items, summary } = await listAllRefuels(userId, { ...query, pageSize: 500 });

    const headers = [
      "วันที่",
      "วันที่ (พ.ศ.)",
      "สถานีบริการ",
      "จังหวัด",
      "ราคา/ลิตร (บาท)",
      "จำนวนเงิน (บาท)",
      "ปริมาณเติม (ลิตร)",
      "เลขไมล์ (กม.)",
      "หมายเหตุ",
    ];

    const rows = items.map((r) => [
      r.refuelDate,
      formatThaiDate(r.refuelDate),
      `${r.station.nameTh} (${r.station.nameEn})`,
      r.province,
      r.pricePerLiter.toFixed(2),
      r.amount.toFixed(2),
      r.liters.toFixed(2),
      r.odometer?.toFixed(2) ?? "",
      r.note ?? "",
    ]);

    // ต่อท้ายด้วยบรรทัดสรุป
    rows.push([]);
    rows.push(["สรุป", summary.rangeLabel]);
    rows.push(["จำนวนครั้งการเติม", String(summary.count)]);
    rows.push(["ปริมาณรวมทั้งหมด (ลิตร)", summary.totalLiters.toFixed(2)]);
    rows.push(["ค่าใช้จ่ายรวม (บาท)", summary.totalAmount.toFixed(2)]);
    rows.push(["ระยะทางที่วิ่งได้ (กม.)", summary.totalDistance.toFixed(2)]);
    rows.push(["อัตราสิ้นเปลืองเฉลี่ย (กม./ลิตร)", summary.avgKmPerLiter?.toFixed(2) ?? "-"]);
    rows.push(["ค่าใช้จ่ายเฉลี่ย (บาท/กม.)", summary.costPerKm?.toFixed(2) ?? "-"]);

    const csv = UTF8_BOM + toCsv(headers, rows);
    const filename = `refuel-${new Date().toISOString().slice(0, 10)}.csv`;

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
