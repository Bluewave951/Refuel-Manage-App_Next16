import { Banknote, Droplets, Gauge, ListChecks, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type { RefuelSummary } from "@/types/refuel";

interface Props {
  summary: RefuelSummary;
  className?: string;
}

export function SummaryCards({ summary, className }: Props) {
  const cards = [
    {
      icon: ListChecks,
      label: "จำนวนครั้งการเติม",
      value: formatNumber(summary.count, 0),
      unit: "ครั้ง",
    },
    {
      icon: Droplets,
      label: "ปริมาณรวมทั้งหมด",
      value: formatNumber(summary.totalLiters, 2),
      unit: "ลิตร",
    },
    {
      icon: Banknote,
      label: "ค่าใช้จ่ายรวม",
      value: formatNumber(summary.totalAmount, 2),
      unit: "บาท",
      accent: true,
    },
    {
      icon: Route,
      label: "ระยะทางที่วิ่งได้",
      value: formatNumber(summary.totalDistance, 2),
      unit: "กม.",
    },
    {
      icon: Gauge,
      label: "อัตราสิ้นเปลืองเฉลี่ย",
      value: summary.avgKmPerLiter === null ? "—" : formatNumber(summary.avgKmPerLiter, 2),
      unit: "กม./ลิตร",
    },
  ];

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-5", className)}>
      {cards.map((c) => (
        <div
          key={c.label}
          className={cn(
            "rounded-lg border border-border bg-card p-4",
            c.accent && "border-primary/25 bg-accent/60"
          )}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <c.icon className="size-4" />
            <span className="text-xs font-medium">{c.label}</span>
          </div>
          <p className="tabular mt-2 text-2xl font-semibold leading-none text-primary">{c.value}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">{c.unit}</p>
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
