import { Banknote, Droplets, Gauge, ListChecks, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type { RefuelSummary } from "@/types/refuel";

interface Props {
  summary: RefuelSummary;
  className?: string;
}

/** สีของแต่ละการ์ด — ใช้ token --tone-* ที่มีค่าแยกโหมดสว่าง/มืด */
const TONES = {
  blue: "var(--tone-blue)",
  cyan: "var(--tone-cyan)",
  green: "var(--tone-green)",
  amber: "var(--tone-amber)",
  violet: "var(--tone-violet)",
} as const;

export function SummaryCards({ summary, className }: Props) {
  const hero = {
    icon: Banknote,
    label: "ค่าใช้จ่ายรวม",
    value: formatNumber(summary.totalAmount, 2),
    unit: "บาท",
  };

  const cards = [
    { icon: ListChecks, label: "จำนวนครั้ง", value: formatNumber(summary.count, 0), unit: "ครั้ง", tone: TONES.blue },
    { icon: Droplets, label: "ปริมาณรวม", value: formatNumber(summary.totalLiters, 2), unit: "ลิตร", tone: TONES.cyan },
    { icon: Route, label: "ระยะทาง", value: formatNumber(summary.totalDistance, 0), unit: "กม.", tone: TONES.amber },
    {
      icon: Gauge,
      label: "อัตราสิ้นเปลือง",
      value: summary.avgKmPerLiter === null ? "—" : formatNumber(summary.avgKmPerLiter, 2),
      unit: "กม./ลิตร",
      tone: TONES.violet,
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-6", className)}>
      {/* การ์ดเด่น: ค่าใช้จ่ายรวม */}
      <div className="hero-gradient relative col-span-2 overflow-hidden rounded-2xl p-4 text-white shadow-lg shadow-primary/20 sm:p-5">
        <div aria-hidden className="absolute -right-6 -top-6 size-28 rounded-full bg-white/15 blur-xl" />
        <div className="relative flex items-center gap-2 text-white/85">
          <span className="grid size-8 place-items-center rounded-lg bg-white/20">
            <hero.icon className="size-4" />
          </span>
          <span className="text-sm font-medium">{hero.label}</span>
        </div>
        <p className="tabular relative mt-3 text-3xl font-bold leading-none sm:text-4xl">{hero.value}</p>
        <p className="relative mt-1.5 text-xs text-white/80">
          {hero.unit} · {summary.rangeLabel}
        </p>
      </div>

      {cards.map((c) => (
        <div
          key={c.label}
          className="relative overflow-hidden rounded-2xl border p-3.5 sm:p-4"
          style={{
            borderColor: `color-mix(in oklch, ${c.tone} 25%, transparent)`,
            background: `linear-gradient(160deg, color-mix(in oklch, ${c.tone} 14%, var(--card)), var(--card) 70%)`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg"
              style={{ background: c.tone, color: "var(--card)" }}
            >
              <c.icon className="size-3.5" />
            </span>
            <span className="truncate text-xs font-medium text-muted-foreground">{c.label}</span>
          </div>
          <p className="tabular mt-2.5 truncate text-xl font-semibold leading-none text-foreground sm:text-2xl">
            {c.value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{c.unit}</p>
        </div>
      ))}
    </div>
  );
}

/** แถวตัวเลขรอง ใช้ใต้การ์ดสรุปและในหน้าพิมพ์ */
export function SummaryFootnotes({ summary }: { summary: RefuelSummary }) {
  return (
    <p className="text-xs text-muted-foreground">
      ราคาเฉลี่ย{" "}
      <span className="tabular font-medium text-foreground">
        {summary.avgPricePerLiter === null ? "—" : formatNumber(summary.avgPricePerLiter, 2)}
      </span>{" "}
      บาท/ลิตร · ค่าใช้จ่ายเฉลี่ย{" "}
      <span className="tabular font-medium text-foreground">
        {summary.costPerKm === null ? "—" : formatNumber(summary.costPerKm, 2)}
      </span>{" "}
      บาท/กม. · อัตราสิ้นเปลืองคำนวณแบบเติมเต็มถัง (ไม่นับน้ำมันของการเติมครั้งแรกในช่วง)
    </p>
  );
}
