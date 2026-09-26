"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";
import type { MonthlyPoint } from "@/types/refuel";

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** "2026-07" → "ก.ค. 69" */
function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${THAI_MONTHS[m - 1]} ${String((y + 543) % 100).padStart(2, "0")}`;
}

/** ขอบบนของแกน y ที่เป็นเลขกลม ๆ และแบ่งได้ 4 ช่อง */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const step = 10 ** Math.floor(Math.log10(v / 4));
  const n = Math.ceil(v / 4 / step);
  const nice = [1, 2, 2.5, 5, 10].find((f) => f >= n) ?? 10;
  return nice * step * 4;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

const H = 180;
const PAD = { top: 12, right: 8, bottom: 24, left: 52 };

type ChartProps = {
  title: string;
  unit: string;
  data: MonthlyPoint[];
  value: (p: MonthlyPoint) => number | null;
  kind: "bar" | "line";
  digits: number;
  /** แกน y เริ่มที่ 0 (บังคับสำหรับกราฟแท่ง) */
  zeroBased: boolean;
};

function TrendChart({ title, unit, data, value, kind, digits, zeroBased }: ChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const values = data.map(value);
  const present = values.filter((v): v is number => v !== null);
  const rawMax = present.length ? Math.max(...present) : 0;
  const rawMin = present.length ? Math.min(...present) : 0;

  let yMin = 0;
  let yMax = niceMax(rawMax);
  if (!zeroBased && present.length) {
    const span = Math.max(rawMax - rawMin, rawMax * 0.05, 1);
    yMin = Math.max(0, Math.floor((rawMin - span * 0.25) / 1) * 1);
    yMax = Math.ceil(rawMax + span * 0.25);
  }

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const band = data.length ? plotW / data.length : 0;
  const x = (i: number) => PAD.left + band * i + band / 2;
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const ticks = [0, 1, 2, 3, 4].map((i) => yMin + ((yMax - yMin) * i) / 4);
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(plotW / 56))));

  const barW = Math.max(2, Math.min(28, band - 2)); // ช่องว่าง 2px ระหว่างแท่ง
  const linePath = values
    .map((v, i) => (v === null ? null : `${x(i)},${y(v)}`))
    .reduce<string[]>((segs, pt, i) => {
      if (pt === null) return segs;
      const prevNull = i === 0 || values[i - 1] === null;
      segs.push(`${prevNull ? "M" : "L"}${pt}`);
      return segs;
    }, [])
    .join(" ");

  const h = hover !== null ? data[hover] : null;
  const hv = hover !== null ? values[hover] : null;

  return (
    <figure className="min-w-0 space-y-2">
      <figcaption className="text-sm font-medium text-foreground">
        {title} <span className="font-normal text-muted-foreground">({unit})</span>
      </figcaption>
      <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
        {width > 0 && (
          <svg width={width} height={H} role="img" aria-label={`${title} รายเดือน`} className="block">
            {/* grid + แกน y */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(t)}
                  y2={y(t)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 6}
                  y={y(t)}
                  dy="0.32em"
                  textAnchor="end"
                  className="tabular fill-muted-foreground text-[10px]"
                >
                  {formatNumber(t, t < 100 && !zeroBased ? 2 : 0)}
                </text>
              </g>
            ))}

            {/* แกน x */}
            {data.map((p, i) =>
              i % labelEvery === 0 ? (
                <text
                  key={p.month}
                  x={x(i)}
                  y={H - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {monthLabel(p.month)}
                </text>
              ) : null
            )}

            {/* crosshair */}
            {hover !== null && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.4}
                strokeWidth={1}
              />
            )}

            {kind === "bar" &&
              values.map((v, i) => {
                if (!v) return null;
                const top = y(v);
                const bh = PAD.top + plotH - top;
                const r = Math.min(4, bh, barW / 2);
                const x0 = x(i) - barW / 2;
                const base = PAD.top + plotH;
                // มุมโค้งเฉพาะด้านบน ฐานติดแกนเป็นเส้นตรง
                const d = `M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${base} Z`;
                return (
                  <path
                    key={data[i].month}
                    d={d}
                    fill="var(--primary)"
                    fillOpacity={hover === null || hover === i ? 1 : 0.55}
                  />
                );
              })}

            {kind === "line" && (
              <>
                <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" />
                {values.map((v, i) =>
                  v === null ? null : (
                    <circle
                      key={data[i].month}
                      cx={x(i)}
                      cy={y(v)}
                      r={hover === i ? 5 : data.length <= 24 ? 4 : 0}
                      fill="var(--primary)"
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  )
                )}
              </>
            )}

            {/* hit target เต็มความสูงของแต่ละเดือน */}
            {data.map((p, i) => (
              <rect
                key={p.month}
                x={PAD.left + band * i}
                y={PAD.top}
                width={band}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onTouchStart={() => setHover(i)}
              />
            ))}
          </svg>
        )}

        {h && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: Math.min(Math.max(x(hover!), 70), width - 70) }}
          >
            <p className="font-medium text-foreground">{monthLabel(h.month)}</p>
            <p className="tabular text-foreground">
              {hv === null ? "ไม่มีรายการ" : `${formatNumber(hv, digits)} ${unit}`}
            </p>
            <p className="text-muted-foreground">{formatNumber(h.count, 0)} ครั้ง</p>
          </div>
        )}
      </div>
    </figure>
  );
}

export function MonthlyTrend({ data }: { data: MonthlyPoint[] }) {
  if (data.length < 2) return null; // เดือนเดียวดูจากการ์ดสรุปได้อยู่แล้ว

  return (
    <section className="space-y-3">
      <div className="grid gap-6 md:grid-cols-2">
        <TrendChart
          title="ค่าใช้จ่ายรายเดือน"
          unit="บาท"
          data={data}
          value={(p) => p.totalAmount}
          kind="bar"
          digits={2}
          zeroBased
        />
        <TrendChart
          title="ราคาเฉลี่ยต่อลิตร"
          unit="บาท/ลิตร"
          data={data}
          value={(p) => p.avgPricePerLiter}
          kind="line"
          digits={2}
          zeroBased={false}
        />
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">ดูเป็นตาราง</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-2 py-1.5 font-medium">เดือน</th>
                <th className="px-2 py-1.5 text-right font-medium">ครั้ง</th>
                <th className="px-2 py-1.5 text-right font-medium">ค่าใช้จ่าย (บาท)</th>
                <th className="px-2 py-1.5 text-right font-medium">ปริมาณ (ลิตร)</th>
                <th className="px-2 py-1.5 text-right font-medium">ราคาเฉลี่ย (บาท/ลิตร)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.month} className="border-b border-border/60">
                  <td className="px-2 py-1.5">{monthLabel(p.month)}</td>
                  <td className="tabular px-2 py-1.5 text-right">{formatNumber(p.count, 0)}</td>
                  <td className="tabular px-2 py-1.5 text-right">{formatNumber(p.totalAmount, 2)}</td>
                  <td className="tabular px-2 py-1.5 text-right">{formatNumber(p.totalLiters, 2)}</td>
                  <td className="tabular px-2 py-1.5 text-right">
                    {p.avgPricePerLiter === null ? "—" : formatNumber(p.avgPricePerLiter, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
