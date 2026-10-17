"use client";

import { FileDown, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** query string ปัจจุบัน (ตัวกรองเดียวกับที่แสดงบนหน้าจอ) */
  queryString: string;
  disabled?: boolean;
  /** หน้าตัวอย่างก่อนพิมพ์ */
  printPath?: string;
  /** endpoint ดาวน์โหลด CSV */
  csvPath?: string;
}

export function ExportActions({ queryString, disabled, printPath = "/print", csvPath = "/api/export/csv" }: Props) {
  const openPrint = (auto: boolean) => {
    const params = new URLSearchParams(queryString);
    if (auto) params.set("autoprint", "1");
    window.open(`${printPath}?${params.toString()}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="no-print grid gap-2 sm:flex sm:flex-wrap sm:items-center">
      <Button variant="destructive" disabled={disabled} onClick={() => openPrint(true)}>
        <FileText />
        บันทึกเป็น PDF
      </Button>

      <Button variant="success" asChild aria-disabled={disabled}>
        <a href={`${csvPath}?${queryString}`}>
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
