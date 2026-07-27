"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefuelForm } from "@/components/refuel-form";
import { RefuelTable } from "@/components/refuel-table";
import { SummaryCards, SummaryFootnotes } from "@/components/summary-cards";
import { FilterBar, type Filters } from "@/components/filter-bar";
import { ExportActions } from "@/components/export-actions";
import { useRefuels, useStations } from "@/hooks/use-refuels";
import type { RefuelDto } from "@/types/refuel";

const initialFilters: Filters = {
  range: "all",
  from: "",
  to: "",
  stationId: "",
  province: "",
};

export function RefuelDashboard() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [editing, setEditing] = useState<RefuelDto | null>(null);
  const { stations } = useStations();

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaved = () => {
    setEditing(null);
    void mutate();
  };

  return (
    <div className="space-y-4">
      <RefuelForm
        stations={stations}
        editing={editing}
        onSaved={handleSaved}
        onCancelEdit={() => setEditing(null)}
      />

      <Card>
        <CardHeader>
          <CardTitle>สรุปข้อมูล</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            filters={filters}
            stations={stations}
            onChange={patchFilters}
            onReset={() => setFilters(initialFilters)}
          />

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              โหลดข้อมูลไม่สำเร็จ — ตรวจสอบว่าฐานข้อมูลทำงานอยู่ แล้วลองรีเฟรชหน้านี้
            </p>
          )}

          {data && (
            <>
              <SummaryCards summary={data.summary} />
              <SummaryFootnotes summary={data.summary} />
            </>
          )}

          <ExportActions queryString={queryString} disabled={!data || data.total === 0} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการที่บันทึกไว้</CardTitle>
        </CardHeader>
        <CardContent>
          <RefuelTable
            items={data?.items ?? []}
            summary={
              data?.summary ?? {
                count: 0,
                totalLiters: 0,
                totalAmount: 0,
                totalDistance: 0,
                avgKmPerLiter: null,
                avgPricePerLiter: null,
                costPerKm: null,
                rangeLabel: "ทั้งหมด",
              }
            }
            isLoading={isLoading}
            onEdit={handleEdit}
            onChanged={() => void mutate()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
