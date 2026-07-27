"use client";

import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DATE_RANGES, THAI_PROVINCES } from "@/lib/constants";
import type { StationDto } from "@/types/refuel";

export interface Filters {
  range: string;
  from: string;
  to: string;
  stationId: string;
  province: string;
}

interface Props {
  filters: Filters;
  stations: StationDto[];
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
}

export function FilterBar({ filters, stations, onChange, onReset }: Props) {
  return (
    <div className="no-print grid gap-3 md:grid-cols-4 lg:grid-cols-5">
      <div>
        <Label className="mb-1.5 block">ช่วงเวลา</Label>
        <Select value={filters.range} onValueChange={(v) => onChange({ range: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.range === "custom" && (
        <>
          <div>
            <Label className="mb-1.5 block">ตั้งแต่วันที่</Label>
            <Input
              type="date"
              className="tabular"
              value={filters.from}
              onChange={(e) => onChange({ from: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">ถึงวันที่</Label>
            <Input
              type="date"
              className="tabular"
              value={filters.to}
              onChange={(e) => onChange({ to: e.target.value })}
            />
          </div>
        </>
      )}

      <div>
        <Label className="mb-1.5 block">สถานีบริการ</Label>
        <Select value={filters.stationId || "any"} onValueChange={(v) => onChange({ stationId: v === "any" ? "" : v })}>
          <SelectTrigger>
            <SelectValue placeholder="ทุกสถานี" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">ทุกสถานี</SelectItem>
            {stations.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nameTh}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 block">จังหวัด</Label>
        <Select value={filters.province || "any"} onValueChange={(v) => onChange({ province: v === "any" ? "" : v })}>
          <SelectTrigger>
            <SelectValue placeholder="ทุกจังหวัด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">ทุกจังหวัด</SelectItem>
            {THAI_PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button type="button" variant="outline" onClick={onReset} className="w-full">
          <CalendarRange />
          ล้างตัวกรอง
        </Button>
      </div>
    </div>
  );
}
