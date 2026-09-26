"use client";

import { useState } from "react";
import { Fuel, Gauge, MapPin, Pencil, Plus, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { formatNumber, formatThaiDate } from "@/lib/format";
import type { RefuelDto, RefuelSummary } from "@/types/refuel";

interface Props {
  items: RefuelDto[];
  summary: RefuelSummary;
  isLoading: boolean;
  onEdit: (item: RefuelDto) => void;
  onChanged: () => void;
  onAdd?: () => void;
}

export function RefuelTable({ items, summary, isLoading, onEdit, onChanged, onAdd }: Props) {
  const [pending, setPending] = useState<RefuelDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await api.deleteRefuel(pending.id);
      toast.success("ลบรายการแล้ว");
      setPending(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Fuel className="size-6" />
        </span>
        <p className="font-medium">ยังไม่มีรายการในช่วงเวลานี้</p>
        <p className="mt-1 text-sm text-muted-foreground">เพิ่มรายการเติมน้ำมัน แล้วสรุปยอดจะคำนวณให้อัตโนมัติ</p>
        {onAdd && (
          <Button className="mt-4" onClick={onAdd}>
            <Plus />
            เพิ่มรายการ
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* มือถือ: การ์ด */}
      <ul className="space-y-2.5 md:hidden">
        {items.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-card p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {r.station.nameTh} <span className="text-xs font-normal text-muted-foreground">({r.station.nameEn})</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="tabular">{formatThaiDate(r.refuelDate)}</span>
                  <span>·</span>
                  <MapPin className="size-3" />
                  <span className="truncate">{r.province}</span>
                </p>
              </div>
              <p className="tabular shrink-0 text-right text-lg font-bold text-primary">
                {formatNumber(r.amount, 2)}
                <span className="block text-[10px] font-normal text-muted-foreground">บาท</span>
              </p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/70 px-3 py-2 text-xs">
              <div>
                <p className="text-muted-foreground">ปริมาณ</p>
                <p className="tabular font-medium">{formatNumber(r.liters, 2)} ล.</p>
              </div>
              <div>
                <p className="text-muted-foreground">ราคา/ลิตร</p>
                <p className="tabular font-medium">{formatNumber(r.pricePerLiter, 2)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Gauge className="size-3" />
                  เลขไมล์
                </p>
                <p className="tabular font-medium">{r.odometer === null ? "—" : formatNumber(r.odometer, 0)}</p>
              </div>
            </div>

            {r.note && (
              <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                <StickyNote className="mt-0.5 size-3 shrink-0" />
                {r.note}
              </p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(r)}>
                <Pencil />
                แก้ไข
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setPending(r)}
              >
                <Trash2 />
                ลบ
              </Button>
            </div>
          </li>
        ))}
        <li className="flex items-center justify-between rounded-2xl bg-primary/8 px-4 py-3 text-sm font-semibold">
          <span>รวม {formatNumber(summary.count, 0)} รายการ</span>
          <span className="tabular">
            {formatNumber(summary.totalAmount, 2)} บาท · {formatNumber(summary.totalLiters, 2)} ล.
          </span>
        </li>
      </ul>

      {/* จอใหญ่: ตาราง */}
      <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>วันที่</TableHead>
            <TableHead>สถานี</TableHead>
            <TableHead>จังหวัด</TableHead>
            <TableHead className="text-right">ราคา/ลิตร</TableHead>
            <TableHead className="text-right">จำนวนเงิน (บาท)</TableHead>
            <TableHead className="text-right">ปริมาณเติม (ล.)</TableHead>
            <TableHead className="text-right">เลขไมล์ (กม.)</TableHead>
            <TableHead className="no-print text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="tabular whitespace-nowrap">{formatThaiDate(r.refuelDate)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {r.station.nameTh}{" "}
                <span className="text-xs text-muted-foreground">({r.station.nameEn})</span>
              </TableCell>
              <TableCell className="whitespace-nowrap">{r.province}</TableCell>
              <TableCell className="tabular text-right">{formatNumber(r.pricePerLiter, 2)}</TableCell>
              <TableCell className="tabular text-right font-medium">{formatNumber(r.amount, 2)}</TableCell>
              <TableCell className="tabular text-right">{formatNumber(r.liters, 2)}</TableCell>
              <TableCell className="tabular text-right">{formatNumber(r.odometer, 2)}</TableCell>
              <TableCell className="no-print text-right">
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => onEdit(r)}>
                    <Pencil />
                    แก้ไข
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setPending(r)}
                  >
                    <Trash2 />
                    ลบ
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="font-semibold">
              รวม {formatNumber(summary.count, 0)} รายการ
            </TableCell>
            <TableCell className="tabular text-right font-semibold">
              {formatNumber(summary.totalAmount, 2)}
            </TableCell>
            <TableCell className="tabular text-right font-semibold">
              {formatNumber(summary.totalLiters, 2)}
            </TableCell>
            <TableCell />
            <TableCell className="no-print" />
          </TableRow>
        </TableFooter>
      </Table>
      </div>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ลบรายการนี้ใช่ไหม</DialogTitle>
            <DialogDescription>
              {pending && (
                <>
                  {formatThaiDate(pending.refuelDate)} · {pending.station.nameTh} ·{" "}
                  {formatNumber(pending.amount, 2)} บาท — ลบแล้วจะกู้คืนไม่ได้
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={deleting}>
              เก็บไว้ก่อน
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "กำลังลบ…" : "ลบรายการ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
