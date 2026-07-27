"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** เปิดกล่องพิมพ์อัตโนมัติเมื่อมาจากปุ่ม "บันทึกเป็น PDF" */
export function AutoPrint({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const t = window.setTimeout(() => window.print(), 400); // รอฟอนต์โหลดก่อน
    return () => window.clearTimeout(t);
  }, [enabled]);

  return null;
}

export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <Printer />
      พิมพ์ / บันทึกเป็น PDF
    </Button>
  );
}
