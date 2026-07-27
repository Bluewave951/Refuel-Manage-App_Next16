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
