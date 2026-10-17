import type { MonthlyPoint } from "./refuel";

export interface ServiceItemDto {
  id: string;
  itemCode: string | null;
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface ServiceRecordDto {
  id: string;
  serviceDate: string; // YYYY-MM-DD
  shopName: string;
  receiptNo: string | null;
  plateNo: string | null;
  vehicleModel: string | null;
  odometer: number | null;
  paymentMethod: string | null;
  subtotal: number;
  discount: number;
  totalAmount: number;
  note: string | null;
  /** path ภาพใบเสร็จใน Supabase Storage (เปิดดูผ่าน /api/services/:id/image) */
  receiptImagePath: string | null;
  items: ServiceItemDto[];
}

/** ผลการอัปโหลดภาพใบเสร็จ (ยังไม่บันทึก) */
export interface ReceiptUploadResponse {
  imagePath: string;
  /** เปิดการอ่านภาพด้วย AI ไว้หรือไม่ (มี GEMINI_API_KEY) */
  scanEnabled: boolean;
  /** ข้อมูลที่ AI อ่านได้; null = ปิดไว้ หรืออ่านไม่สำเร็จ */
  data: {
    serviceDate: string | null;
    shopName: string | null;
    receiptNo: string | null;
    plateNo: string | null;
    vehicleModel: string | null;
    odometer: number | null;
    paymentMethod: string | null;
    discount: number;
    totalAmount: number | null;
    items: {
      itemCode: string | null;
      description: string;
      quantity: number;
      unit: string | null;
      unitPrice: number;
      discount: number;
    }[];
  } | null;
}

export interface ServiceSummary {
  /** จำนวนใบเสร็จ */
  count: number;
  /** ค่าใช้จ่ายรวม (บาท) */
  totalAmount: number;
  /** ค่าใช้จ่ายเฉลี่ยต่อครั้ง (บาท) */
  avgAmount: number | null;
  /** วันที่เข้าซ่อมล่าสุด */
  lastServiceDate: string | null;
  /** เลขไมล์สูงสุดที่บันทึก */
  lastOdometer: number | null;
  rangeLabel: string;
}

export interface ServiceListResponse {
  items: ServiceRecordDto[];
  summary: ServiceSummary;
  /** ยอดรายเดือน (ใช้กับกราฟ) */
  monthly: MonthlyPoint[];
  total: number;
}
