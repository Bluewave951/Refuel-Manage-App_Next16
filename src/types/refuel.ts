export interface StationDto {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
}

export interface RefuelDto {
  id: string;
  refuelDate: string; // YYYY-MM-DD
  province: string;
  pricePerLiter: number;
  amount: number;
  liters: number;
  odometer: number | null;
  note: string | null;
  station: StationDto;
}

export interface RefuelSummary {
  /** จำนวนครั้งการเติม */
  count: number;
  /** ปริมาณรวมทั้งหมด (ลิตร) */
  totalLiters: number;
  /** ค่าใช้จ่ายรวม (บาท) */
  totalAmount: number;
  /** ระยะทางที่วิ่งได้ (กม.) = เลขไมล์สูงสุด - ต่ำสุด */
  totalDistance: number;
  /** อัตราสิ้นเปลืองเฉลี่ย (กม./ลิตร) */
  avgKmPerLiter: number | null;
  /** ราคาเฉลี่ยต่อลิตร (บาท) */
  avgPricePerLiter: number | null;
  /** ค่าใช้จ่ายเฉลี่ยต่อกิโลเมตร (บาท/กม.) */
  costPerKm: number | null;
  rangeLabel: string;
}

/** ยอดรวมรายเดือน (ใช้กับกราฟแนวโน้ม) */
export interface MonthlyPoint {
  /** YYYY-MM */
  month: string;
  count: number;
  totalAmount: number;
  totalLiters: number;
  /** ราคาเฉลี่ยถ่วงน้ำหนัก = เงินรวม ÷ ลิตรรวม */
  avgPricePerLiter: number | null;
}

export interface RefuelListResponse {
  items: RefuelDto[];
  summary: RefuelSummary;
  monthly: MonthlyPoint[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}
