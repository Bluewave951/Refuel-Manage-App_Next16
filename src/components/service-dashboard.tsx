"use client";

import { useEffect, useState } from "react";
import { BarChart3, List, PlusCircle, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceForm } from "@/components/service-form";
import { ServiceList } from "@/components/service-list";
import { ExportActions } from "@/components/export-actions";
import { MonthlyCostTrend } from "@/components/monthly-trend";
import { useServices } from "@/hooks/use-services";
import { ServiceSummaryCards } from "@/components/summary-cards";
import { cn } from "@/lib/utils";
import type { ServiceRecordDto, ServiceSummary } from "@/types/service";

type Tab = "summary" | "list" | "add";

const TABS: { id: Tab; label: string; short: string; icon: LucideIcon }[] = [
  { id: "summary", label: "สรุปข้อมูล", short: "สรุป", icon: BarChart3 },
  { id: "list", label: "รายการที่บันทึก", short: "รายการ", icon: List },
  { id: "add", label: "เพิ่มรายการ", short: "เพิ่ม", icon: PlusCircle },
];

const TAB_KEY = "service:tab";

const emptySummary: ServiceSummary = {
  count: 0,
  totalAmount: 0,
  avgAmount: null,
  lastServiceDate: null,
  lastOdometer: null,
  rangeLabel: "ทั้งหมด",
};

const RANGES = [
  { value: "all", label: "ทั้งหมด" },
  { value: "this-month", label: "เดือนนี้" },
  { value: "last-month", label: "เดือนที่แล้ว" },
  { value: "this-year", label: "ปีนี้" },
] as const;

export function ServiceDashboard() {
  const [tab, setTab] = useState<Tab>("summary");
  const [range, setRange] = useState<string>("all");
  const [editing, setEditing] = useState<ServiceRecordDto | null>(null);
  const { data, isLoading, error, mutate } = useServices({ range });

  // จำ tab ล่าสุดไว้ (เฉพาะเครื่องนี้) — อ่านหลัง mount เพื่อไม่ให้ HTML จาก server ไม่ตรงกับ client
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY) as Tab | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && TABS.some((t) => t.id === saved)) setTab(saved);
    } catch {}
  }, []);

  const go = (next: Tab) => {
    setTab(next);
    try {
      localStorage.setItem(TAB_KEY, next);
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const queryString = new URLSearchParams({ range }).toString();

  const handleEdit = (item: ServiceRecordDto) => {
    setEditing(item);
    go("add");
  };

  const handleSaved = () => {
    setEditing(null);
    void mutate();
    go("list");
  };

  const rangeSelect = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">ช่วงเวลา</p>
      <Select value={range} onValueChange={setRange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RANGES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const loadError = error && (
    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      โหลดข้อมูลไม่สำเร็จ — ตรวจสอบการเชื่อมต่อ แล้วลองรีเฟรชหน้านี้
    </p>
  );

  return (
    <div className="space-y-4">
      {/* tab บนจอใหญ่ */}
      <nav
        role="tablist"
        aria-label="เมนูซ่อมบำรุง"
        className="no-print hidden gap-1 rounded-2xl border border-white/40 bg-card/80 p-1.5 shadow-lg shadow-primary/5 backdrop-blur md:flex"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => go(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
              tab === t.id
                ? "hero-gradient shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <t.icon className="size-4" />
            {t.id === "add" && editing ? "แก้ไขรายการ" : t.label}
            {t.id === "list" && data && (
              <span
                className={cn(
                  "tabular rounded-full px-2 py-0.5 text-xs",
                  tab === t.id ? "bg-white/20" : "bg-muted text-foreground"
                )}
              >
                {data.total}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === "summary" && (
        <section role="tabpanel" aria-label="สรุปข้อมูล" className="space-y-4">
          <Card className="bg-card/90 backdrop-blur">
            <CardContent className="space-y-4 pt-5">
              {rangeSelect}
              {loadError}
              <ServiceSummaryCards summary={data?.summary ?? emptySummary} />
            </CardContent>
          </Card>

          {data && data.monthly.length > 0 && (
            <Card className="bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle>แนวโน้มรายเดือน</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyCostTrend data={data.monthly} />
              </CardContent>
            </Card>
          )}

          <Card className="bg-card/90 backdrop-blur">
            <CardHeader>
              <CardTitle>ส่งออกรายงาน</CardTitle>
            </CardHeader>
            <CardContent>
              <ExportActions
                queryString={queryString}
                disabled={!data || data.total === 0}
                printPath="/services/print"
                csvPath="/api/export/services-csv"
              />
            </CardContent>
          </Card>
        </section>
      )}

      {tab === "list" && (
        <section role="tabpanel" aria-label="รายการที่บันทึก">
          <Card className="bg-card/90 backdrop-blur">
            <CardContent className="space-y-4 pt-5">
              {rangeSelect}
              {loadError}
              <ServiceList
                items={data?.items ?? []}
                isLoading={isLoading}
                onEdit={handleEdit}
                onChanged={() => void mutate()}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {tab === "add" && (
        <section role="tabpanel" aria-label="เพิ่มรายการ">
          {/* key: เปลี่ยนใบที่แก้ไข → เริ่ม state ของฟอร์มใหม่ */}
          <ServiceForm
            key={editing?.id ?? "new"}
            editing={editing}
            onSaved={handleSaved}
            onCancelEdit={() => {
              setEditing(null);
              go("list");
            }}
          />
        </section>
      )}

      {/* แถบเมนูล่างบนมือถือ */}
      <nav
        aria-label="เมนูซ่อมบำรุง"
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.25)] backdrop-blur-lg md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {TABS.map((t) =>
            t.id === "add" ? (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-2 text-xs font-medium"
              >
                <span
                  className={cn(
                    "hero-gradient -mt-6 grid size-12 place-items-center rounded-full shadow-lg ring-4 ring-card transition",
                    tab === t.id ? "scale-105" : "opacity-95"
                  )}
                >
                  <t.icon className="size-6" />
                </span>
                <span className={tab === t.id ? "text-primary" : "text-muted-foreground"}>
                  {editing ? "แก้ไข" : t.short}
                </span>
              </button>
            ) : (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition",
                  tab === t.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                <span className={cn("rounded-full px-4 py-1 transition", tab === t.id && "bg-primary/12")}>
                  <t.icon className="size-5" />
                </span>
                {t.short}
              </button>
            )
          )}
        </div>
      </nav>
    </div>
  );
}
