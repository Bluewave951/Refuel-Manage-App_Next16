"use client";

import { FileDown, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** query string ปัจจุบัน (ตัวกรองเดียวกับที่แสดงบนหน้าจอ) */
  queryString: string;
  disabled?: boolean;
}

export function ExportActions({ queryString, disabled }: Props) {
  const openPrint = (auto: boolean) => {
    const params = new URLSearchParams(queryString);
    if (auto) params.set("autoprint", "1");
    window.open(`/print?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button variant="destructive" disabled={disabled} onClick={() => openPrint(true)}>
        <FileText />
        บันทึกเป็น PDF
      </Button>

      <Button variant="success" asChild aria-disabled={disabled}>
        <a href={`/api/export/csv?${queryString}`}>
          <FileDown />
          ดาวน์โหลด CSV
        </a>
      </Button>

      <Button variant="outline" disabled={disabled} onClick={() => openPrint(false)}>
        <Printer />
        ดูตัวอย่างก่อนพิมพ์
      </Button>
    </div>
  );
}
