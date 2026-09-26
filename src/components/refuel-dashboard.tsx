"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, List, PlusCircle, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefuelForm } from "@/components/refuel-form";
import { RefuelTable } from "@/components/refuel-table";
import { SummaryCards, SummaryFootnotes } from "@/components/summary-cards";
import { FilterBar, type Filters } from "@/components/filter-bar";
import { ExportActions } from "@/components/export-actions";
import { MonthlyTrend } from "@/components/monthly-trend";
import { useRefuels, useStations } from "@/hooks/use-refuels";
import { cn } from "@/lib/utils";
import type { RefuelDto, RefuelSummary } from "@/types/refuel";

type Tab = "summary" | "list" | "add";

const TABS: { id: Tab; label: string; short: string; icon: LucideIcon }[] = [
  { id: "summary", label: "สรุปข้อมูล", short: "สรุป", icon: BarChart3 },
  { id: "list", label: "รายการที่บันทึก", short: "รายการ", icon: List },
  { id: "add", label: "เพิ่มรายการ", short: "เพิ่ม", icon: PlusCircle },
];

const TAB_KEY = "refuel:tab";

const initialFilters: Filters = {
  range: "all",
  from: "",
  to: "",
  stationId: "",
  province: "",
};

const emptySummary: RefuelSummary = {
  count: 0,
  totalLiters: 0,
  totalAmount: 0,
  totalDistance: 0,
  avgKmPerLiter: null,
  avgPricePerLiter: null,
  costPerKm: null,
  rangeLabel: "ทั้งหมด",
};

export function RefuelDashboard() {
  const [tab, setTab] = useState<Tab>("summary");
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [editing, setEditing] = useState<RefuelDto | null>(null);
  const { stations } = useStations();

  // จำ tab ล่าสุดไว้ (เฉพาะเครื่องนี้)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY) as Tab | null;
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

  const query = useMemo(
    () => ({
      range: filters.range,
      from: filters.range === "custom" ? filters.from : undefined,
      to: filters.range === "custom" ? filters.to : undefined,
      stationId: filters.stationId || undefined,
      province: filters.province || undefined,
      pageSize: 200,
    }),
    [filters]
  );

  const { data, isLoading, error, mutate, queryString } = useRefuels(query);

  const patchFilters = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  const handleEdit = (item: RefuelDto) => {
    setEditing(item);
    go("add");
  };

  const handleSaved = () => {
    setEditing(null);
    void mutate();
    go("list");
  };

  const filterBar = (
    <FilterBar
      filters={filters}
      stations={stations}
      onChange={patchFilters}
      onReset={() => setFilters(initialFilters)}
    />
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
        aria-label="เมนูหลัก"
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
                ? "hero-gradient text-white shadow-md"
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
              {filterBar}
              {loadError}
              <SummaryCards summary={data?.summary ?? emptySummary} />
              {data && <SummaryFootnotes summary={data.summary} />}
            </CardContent>
          </Card>

          {data && data.monthly.length >= 2 && (
            <Card className="bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle>แนวโน้มรายเดือน</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyTrend data={data.monthly} />
              </CardContent>
            </Card>
          )}

          <Card className="bg-card/90 backdrop-blur">
            <CardHeader>
              <CardTitle>ส่งออกรายงาน</CardTitle>
            </CardHeader>
            <CardContent>
              <ExportActions queryString={queryString} disabled={!data || data.total === 0} />
            </CardContent>
          </Card>
        </section>
      )}

      {tab === "list" && (
        <section role="tabpanel" aria-label="รายการที่บันทึก" className="space-y-4">
          <Card className="bg-card/90 backdrop-blur">
            <CardContent className="space-y-4 pt-5">
              {filterBar}
              {loadError}
              <RefuelTable
                items={data?.items ?? []}
                summary={data?.summary ?? emptySummary}
                isLoading={isLoading}
                onEdit={handleEdit}
                onChanged={() => void mutate()}
                onAdd={() => go("add")}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {tab === "add" && (
        <section role="tabpanel" aria-label="เพิ่มรายการ">
          <RefuelForm
            stations={stations}
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
        aria-label="เมนูหลัก"
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
                    "hero-gradient -mt-6 grid size-12 place-items-center rounded-full text-white shadow-lg ring-4 ring-card transition",
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
