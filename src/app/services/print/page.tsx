import Link from "next/link";
import { listServices } from "@/lib/service-service";
import { serviceQuerySchema } from "@/lib/validations";
import { formatNumber, formatThaiDate } from "@/lib/format";
import { AutoPrint, PrintButton } from "@/components/auto-print";
import { requireUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "รายงานค่าซ่อมบำรุงรถ" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ServicePrintPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const flat = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );
  const query = serviceQuerySchema.parse(flat);
  const userId = await requireUserId();
  const { items, summary } = await listServices(userId, query);

  const printedAt = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date());

  return (
    <div className="min-h-dvh bg-muted/40 py-8 print:bg-white print:py-0">
      <AutoPrint enabled={flat.autoprint === "1"} />

      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-3 px-4">
        <Link href="/services" className="text-sm font-medium text-primary hover:underline">
          ← กลับหน้าซ่อมบำรุง
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet mx-auto max-w-[210mm] rounded-lg border border-border bg-white p-10 shadow-sm">
        <header className="mb-6 border-b-2 border-primary pb-4">
          <h1 className="text-xl font-bold text-primary">รายงานค่าซ่อมบำรุงรถ</h1>
          <p className="mt-1 text-sm text-slate-600">
            ช่วงข้อมูล: {summary.rangeLabel} · จำนวน {formatNumber(summary.count, 0)} ใบเสร็จ
          </p>
          <p className="text-xs text-slate-500">พิมพ์เมื่อ {printedAt} น.</p>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <Stat label="ค่าซ่อมบำรุงรวม" value={`${formatNumber(summary.totalAmount, 2)} บาท`} />
          <Stat label="จำนวนครั้ง" value={`${formatNumber(summary.count, 0)} ครั้ง`} />
          <Stat
            label="เฉลี่ยต่อครั้ง"
            value={summary.avgAmount === null ? "—" : `${formatNumber(summary.avgAmount, 2)} บาท`}
          />
          <Stat
            label="เข้าซ่อมล่าสุด"
            value={summary.lastServiceDate ? formatThaiDate(summary.lastServiceDate) : "—"}
          />
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-50 text-left text-xs text-slate-600">
              <th className="px-2 py-2">รายการ</th>
              <th className="px-2 py-2 text-right">จำนวน</th>
              <th className="px-2 py-2 text-right">ราคา/หน่วย</th>
              <th className="px-2 py-2 text-right">ส่วนลด</th>
              <th className="px-2 py-2 text-right">รวม</th>
            </tr>
          </thead>
          {items.map((r) => (
            <tbody key={r.id} className="break-inside-avoid">
              <tr className="border-b border-slate-300 bg-slate-50/60">
                <td colSpan={4} className="px-2 py-1.5 font-medium">
                  {formatThaiDate(r.serviceDate)} · {r.shopName}
                  <span className="font-normal text-slate-500">
                    {r.receiptNo && ` · เลขที่ ${r.receiptNo}`}
                    {r.odometer !== null && ` · ${formatNumber(r.odometer, 0)} กม.`}
                  </span>
                </td>
                <td className="tabular px-2 py-1.5 text-right font-semibold">{formatNumber(r.totalAmount, 2)}</td>
              </tr>
              {r.items.map((it) => (
                <tr key={it.id} className="border-b border-slate-100 text-slate-700">
                  <td className="py-1 pl-6 pr-2">{it.description}</td>
                  <td className="tabular px-2 py-1 text-right whitespace-nowrap">
                    {formatNumber(it.quantity, 2)} {it.unit}
                  </td>
                  <td className="tabular px-2 py-1 text-right">{formatNumber(it.unitPrice, 2)}</td>
                  <td className="tabular px-2 py-1 text-right">{it.discount ? formatNumber(it.discount, 2) : "—"}</td>
                  <td className="tabular px-2 py-1 text-right">{formatNumber(it.lineTotal, 2)}</td>
                </tr>
              ))}
              {r.discount > 0 && (
                <tr className="border-b border-slate-100 text-slate-500">
                  <td colSpan={4} className="py-1 pl-6 pr-2">หักส่วนลดท้ายบิล</td>
                  <td className="tabular px-2 py-1 text-right">−{formatNumber(r.discount, 2)}</td>
                </tr>
              )}
            </tbody>
          ))}
          {items.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={5} className="px-2 py-8 text-center text-slate-500">
                  ไม่มีรายการในช่วงเวลาที่เลือก
                </td>
              </tr>
            </tbody>
          )}
          <tfoot>
            <tr className="border-t-2 border-slate-400 font-semibold">
              <td className="px-2 py-2" colSpan={4}>
                รวมทั้งสิ้น
              </td>
              <td className="tabular px-2 py-2 text-right">{formatNumber(summary.totalAmount, 2)}</td>
            </tr>
          </tfoot>
        </table>

        <footer className="mt-6 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500">
          ออกโดย Car_management_System
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
