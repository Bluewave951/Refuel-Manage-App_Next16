import { z } from "zod";
import { THAI_PROVINCES } from "./constants";

const provinceSet = new Set<string>(THAI_PROVINCES);

export const refuelInputSchema = z
  .object({
    refuelDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD")
      .refine((v) => !Number.isNaN(new Date(v).getTime()), "วันที่ไม่ถูกต้อง"),
    stationId: z.string().min(1, "กรุณาเลือกสถานีบริการ"),
    province: z.string().refine((v) => provinceSet.has(v), "กรุณาเลือกจังหวัด"),
    pricePerLiter: z.coerce
      .number()
      .positive("ราคาต่อลิตรต้องมากกว่า 0")
      .max(999.99, "ราคาต่อลิตรสูงเกินไป"),
    amount: z.coerce
      .number()
      .positive("จำนวนเงินต้องมากกว่า 0")
      .max(999999.99, "จำนวนเงินสูงเกินไป"),
    odometer: z.coerce
      .number()
      .min(0, "เลขไมล์ต้องไม่ติดลบ")
      .max(9999999.99, "เลขไมล์สูงเกินไป")
      .nullish(),
    note: z.string().max(500, "หมายเหตุยาวเกิน 500 ตัวอักษร").nullish(),
  })
  .strict();

export type RefuelInput = z.infer<typeof refuelInputSchema>;

export const refuelUpdateSchema = refuelInputSchema.partial();
export type RefuelUpdate = z.infer<typeof refuelUpdateSchema>;

export const refuelQuerySchema = z.object({
  range: z
    .enum(["all", "7d", "30d", "this-month", "last-month", "this-year", "custom"])
    .default("all"),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  stationId: z.string().optional(),
  province: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
  sort: z.enum(["date-desc", "date-asc", "amount-desc", "amount-asc"]).default("date-desc"),
});

export type RefuelQuery = z.infer<typeof refuelQuerySchema>;

/** แปลง searchParams เป็น query object ที่ผ่านการตรวจแล้ว */
export function parseRefuelQuery(searchParams: URLSearchParams): RefuelQuery {
  const raw = Object.fromEntries(searchParams.entries());
  return refuelQuerySchema.parse(raw);
}

/* ---------- ใบเสร็จซ่อม/บำรุงรักษา ---------- */

const optionalText = (max: number) =>
  z.string().trim().max(max, `ยาวเกิน ${max} ตัวอักษร`).nullish();

export const serviceItemSchema = z.object({
  itemCode: optionalText(50),
  description: z.string().trim().min(1, "กรุณาระบุรายการ").max(300, "รายการยาวเกิน 300 ตัวอักษร"),
  quantity: z.coerce.number().positive("จำนวนต้องมากกว่า 0").max(99999999.99, "จำนวนสูงเกินไป"),
  unit: optionalText(30),
  unitPrice: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ").max(9999999999.99, "ราคาสูงเกินไป"),
  discount: z.coerce.number().min(0, "ส่วนลดต้องไม่ติดลบ").default(0),
});

export type ServiceItemInput = z.infer<typeof serviceItemSchema>;

export const serviceInputSchema = z
  .object({
    serviceDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD")
      .refine((v) => !Number.isNaN(new Date(v).getTime()), "วันที่ไม่ถูกต้อง"),
    shopName: z.string().trim().min(1, "กรุณาระบุชื่อร้าน/อู่").max(200, "ชื่อร้านยาวเกิน 200 ตัวอักษร"),
    receiptNo: optionalText(100),
    plateNo: optionalText(50),
    vehicleModel: optionalText(100),
    odometer: z.coerce
      .number()
      .min(0, "เลขไมล์ต้องไม่ติดลบ")
      .max(9999999.99, "เลขไมล์สูงเกินไป")
      .nullish(),
    paymentMethod: optionalText(100),
    discount: z.coerce.number().min(0, "ส่วนลดต้องไม่ติดลบ").default(0),
    note: z.string().max(500, "หมายเหตุยาวเกิน 500 ตัวอักษร").nullish(),
    receiptImagePath: z.string().max(300).nullish(),
    items: z.array(serviceItemSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ").max(100, "รายการมากเกินไป"),
  })
  .strict();

export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const serviceQuerySchema = refuelQuerySchema.pick({ range: true, from: true, to: true });
export type ServiceQuery = z.infer<typeof serviceQuerySchema>;

export function parseServiceQuery(searchParams: URLSearchParams): ServiceQuery {
  return serviceQuerySchema.parse(Object.fromEntries(searchParams.entries()));
}
