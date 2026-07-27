"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
}

export function RefuelTable({ items, summary, isLoading, onEdit, onChanged }: Props) {
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
      <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <p className="font-medium">ยังไม่มีรายการในช่วงเวลานี้</p>
        <p className="mt-1 text-sm text-muted-foreground">
          เพิ่มรายการเติมน้ำมันด้านบน แล้วสรุปยอดจะคำนวณให้อัตโนมัติ
        </p>
      </div>
    );
  }

  return (
    <>
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
