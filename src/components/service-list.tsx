"use client";

import { useState } from "react";
import { ChevronDown, Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { formatNumber, formatThaiDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ServiceRecordDto } from "@/types/service";

interface Props {
  items: ServiceRecordDto[];
  isLoading: boolean;
  onEdit: (item: ServiceRecordDto) => void;
  onChanged: () => void;
}

export function ServiceList({ items, isLoading, onEdit, onChanged }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [pending, setPending] = useState<ServiceRecordDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pending) return;
    setDeleting(true);
    try {
      await api.deleteService(pending.id);
      toast.success("ลบใบเสร็จแล้ว");
      setPending(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setDeleting(false);
    }
  };

  if (!isLoading && items.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีใบเสร็จในช่วงนี้</p>;
  }

  return (
    <>
      <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
        {items.map((r) => {
          const expanded = open === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : r.id)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.shopName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatThaiDate(r.serviceDate)}
                    {r.receiptNo && ` · เลขที่ ${r.receiptNo}`}
                    {r.odometer !== null && ` · ${formatNumber(r.odometer, 0)} กม.`}
                    {` · ${r.items.length} รายการ`}
                  </p>
                </div>
                <span className="tabular font-semibold">{formatNumber(r.totalAmount)}</span>
                <ChevronDown className={cn("size-4 shrink-0 transition", expanded && "rotate-180")} />
              </button>

              {expanded && (
                <div className="space-y-3 bg-muted/30 px-4 pb-4 pt-2 text-sm">
                  {(r.plateNo || r.vehicleModel || r.paymentMethod) && (
                    <p className="text-muted-foreground">
                      {[r.plateNo && `ทะเบียน ${r.plateNo}`, r.vehicleModel, r.paymentMethod && `ชำระโดย ${r.paymentMethod}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted-foreground">
                        <tr className="border-b border-border/60">
                          <th className="py-1.5 text-left font-medium">รายการ</th>
                          <th className="py-1.5 text-right font-medium">จำนวน</th>
                          <th className="py-1.5 text-right font-medium">ราคา/หน่วย</th>
                          <th className="py-1.5 text-right font-medium">ส่วนลด</th>
                          <th className="py-1.5 text-right font-medium">รวม</th>
                        </tr>
                      </thead>
                      <tbody className="tabular">
                        {r.items.map((it) => (
                          <tr key={it.id} className="border-b border-border/40">
                            <td className="py-1.5 pr-2">
                              {it.itemCode && <span className="mr-1 text-muted-foreground">[{it.itemCode}]</span>}
                              {it.description}
                            </td>
                            <td className="py-1.5 text-right">
                              {formatNumber(it.quantity)} {it.unit}
                            </td>
                            <td className="py-1.5 text-right">{formatNumber(it.unitPrice)}</td>
                            <td className="py-1.5 text-right">{it.discount ? formatNumber(it.discount) : "-"}</td>
                            <td className="py-1.5 text-right">{formatNumber(it.lineTotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="tabular">
                        {r.discount > 0 && (
                          <tr>
                            <td colSpan={4} className="pt-1.5 text-right text-muted-foreground">หักส่วนลด</td>
                            <td className="pt-1.5 text-right">{formatNumber(r.discount)}</td>
                          </tr>
                        )}
                        <tr className="font-semibold">
                          <td colSpan={4} className="pt-1.5 text-right">รวมทั้งสิ้น</td>
                          <td className="pt-1.5 text-right">{formatNumber(r.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {r.note && <p className="text-muted-foreground">หมายเหตุ: {r.note}</p>}
                  <div className="flex justify-end gap-2">
                    {r.receiptImagePath && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/api/services/${r.id}/image`} target="_blank" rel="noopener noreferrer">
                          <ImageIcon /> ดูภาพใบเสร็จ
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onEdit(r)}>
                      <Pencil /> แก้ไข
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPending(r)}>
                      <Trash2 /> ลบ
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ลบใบเสร็จนี้ใช่ไหม</DialogTitle>
            <DialogDescription>
              {pending && (
                <>
                  {formatThaiDate(pending.serviceDate)} · {pending.shopName} ·{" "}
                  {formatNumber(pending.totalAmount)} บาท — ลบแล้วจะกู้คืนไม่ได้
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={deleting}>
              เก็บไว้ก่อน
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "กำลังลบ…" : "ลบใบเสร็จ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
