import Link from "next/link";
import { listAllRefuels } from "@/lib/refuel-service";
import { refuelQuerySchema } from "@/lib/validations";
import { formatNumber, formatThaiDate } from "@/lib/format";
import { AutoPrint, PrintButton } from "@/components/auto-print";

export const dynamic = "force-dynamic";

export const metadata = { title: "รายงานค่าใช้จ่ายน้ำมัน" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PrintPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );
  const query = refuelQuerySchema.parse(flat);
  const { items, summary } = await listAllRefuels(query);

  const printedAt = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date());

  return (
    <div className="min-h-dvh bg-muted/40 py-8 print:bg-white print:py-0">
      <AutoPrint enabled={flat.autoprint === "1"} />

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          ← กลับหน้าบันทึกข้อมูล
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet mx-auto max-w-[210mm] rounded-lg border border-border bg-white p-10 shadow-sm">
        <header className="mb-6 border-b-2 border-primary pb-4">
          <h1 className="text-xl font-bold text-primary">รายงานค่าใช้จ่ายในการเติมน้ำมัน</h1>
          <p className="mt-1 text-sm text-slate-600">
            ช่วงข้อมูล: {summary.rangeLabel} · จำนวน {formatNumber(summary.count, 0)} รายการ
          </p>
          <p className="text-xs text-slate-500">พิมพ์เมื่อ {printedAt} น.</p>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          <Stat label="ปริมาณรวมทั้งหมด" value={`${formatNumber(summary.totalLiters, 2)} ลิตร`} />
          <Stat label="ค่าใช้จ่ายรวม" value={`${formatNumber(summary.totalAmount, 2)} บาท`} />
          <Stat label="ระยะทางที่วิ่งได้" value={`${formatNumber(summary.totalDistance, 2)} กม.`} />
          <Stat
            label="อัตราสิ้นเปลืองเฉลี่ย"
            value={summary.avgKmPerLiter === null ? "—" : `${formatNumber(summary.avgKmPerLiter, 2)} กม./ลิตร`}
          />
          <Stat
            label="ราคาเฉลี่ยต่อลิตร"
            value={summary.avgPricePerLiter === null ? "—" : `${formatNumber(summary.avgPricePerLiter, 2)} บาท`}
          />
          <Stat
            label="ค่าใช้จ่ายเฉลี่ย"
            value={summary.costPerKm === null ? "—" : `${formatNumber(summary.costPerKm, 2)} บาท/กม.`}
          />
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-50 text-left text-xs uppercase text-slate-600">
              <th className="px-2 py-2">วันที่</th>
              <th className="px-2 py-2">สถานี</th>
              <th className="px-2 py-2">จังหวัด</th>
              <th className="px-2 py-2 text-right">ราคา/ลิตร</th>
              <th className="px-2 py-2 text-right">จำนวนเงิน</th>
              <th className="px-2 py-2 text-right">ปริมาณ (ล.)</th>
              <th className="px-2 py-2 text-right">เลขไมล์</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-slate-200">
                <td className="tabular px-2 py-1.5 whitespace-nowrap">{formatThaiDate(r.refuelDate)}</td>
                <td className="px-2 py-1.5">{r.station.nameTh}</td>
                <td className="px-2 py-1.5">{r.province}</td>
                <td className="tabular px-2 py-1.5 text-right">{formatNumber(r.pricePerLiter, 2)}</td>
                <td className="tabular px-2 py-1.5 text-right">{formatNumber(r.amount, 2)}</td>
                <td className="tabular px-2 py-1.5 text-right">{formatNumber(r.liters, 2)}</td>
                <td className="tabular px-2 py-1.5 text-right">{formatNumber(r.odometer, 2)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-2 py-8 text-center text-slate-500">
                  ไม่มีรายการในช่วงเวลาที่เลือก
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-400 font-semibold">
              <td className="px-2 py-2" colSpan={4}>
                รวมทั้งสิ้น
              </td>
              <td className="tabular px-2 py-2 text-right">{formatNumber(summary.totalAmount, 2)}</td>
              <td className="tabular px-2 py-2 text-right">{formatNumber(summary.totalLiters, 2)}</td>
              <td />
            </tr>
          </tfoot>
        </table>

        <footer className="mt-6 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500">
          อัตราสิ้นเปลืองคำนวณแบบเติมเต็มถัง: ระยะทาง (เลขไมล์สูงสุด − ต่ำสุด) หารด้วยปริมาณน้ำมันที่เติมทุกครั้ง
          ยกเว้นครั้งแรกของช่วง · ออกโดย Refuel Manage App
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="tabular font-semibold text-slate-900">{value}</p>
    </div>
  );
}
