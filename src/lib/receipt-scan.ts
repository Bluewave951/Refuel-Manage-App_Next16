import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

/** ข้อมูลที่อ่านได้จากภาพ (ค่าที่อ่านไม่ออกเป็น null) */
const scannedReceiptSchema = z.object({
  serviceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  shopName: z.string().nullable(),
  receiptNo: z.string().nullable(),
  plateNo: z.string().nullable(),
  vehicleModel: z.string().nullable(),
  odometer: z.number().nullable(),
  paymentMethod: z.string().nullable(),
  discount: z.number().min(0).catch(0),
  totalAmount: z.number().nullable(),
  items: z.array(
    z.object({
      itemCode: z.string().nullable(),
      description: z.string().min(1),
      quantity: z.number().positive().catch(1),
      unit: z.string().nullable(),
      unitPrice: z.number().min(0),
      discount: z.number().min(0).catch(0),
    })
  ),
});

export type ScannedReceipt = z.infer<typeof scannedReceiptSchema>;

const str = { type: ["string", "null"] };
const num = { type: ["number", "null"] };

/** JSON schema ที่ส่งให้ Gemini ตอบตาม */
const responseJsonSchema = {
  type: "object",
  properties: {
    serviceDate: { ...str, description: "วันที่ในใบเสร็จ YYYY-MM-DD แบบ ค.ศ." },
    shopName: str,
    receiptNo: str,
    plateNo: str,
    vehicleModel: str,
    odometer: num,
    paymentMethod: str,
    discount: { type: "number", description: "ส่วนลดท้ายบิล ไม่มีให้เป็น 0" },
    totalAmount: { ...num, description: "ยอดรวมทั้งสิ้นที่พิมพ์ในใบเสร็จ" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          itemCode: str,
          description: { type: "string" },
          quantity: { type: "number" },
          unit: str,
          unitPrice: { type: "number" },
          discount: { type: "number" },
        },
        required: ["itemCode", "description", "quantity", "unit", "unitPrice", "discount"],
      },
    },
  },
  required: [
    "serviceDate", "shopName", "receiptNo", "plateNo", "vehicleModel",
    "odometer", "paymentMethod", "discount", "totalAmount", "items",
  ],
};

const PROMPT = `อ่านใบเสร็จซ่อม/บำรุงรักษารถยนต์ภาษาไทยในภาพ แล้วดึงข้อมูลตาม schema
- วันที่ที่เป็น พ.ศ. ให้แปลงเป็น ค.ศ. (ลบ 543) ตอบเป็น YYYY-MM-DD
- shopName คือชื่อร้าน/บริษัทที่ออกใบเสร็จ (รวมสาขาถ้ามี)
- items: เฉพาะแถวที่มีรายการจริง ข้ามแถวว่าง; ราคา 0 ก็ใส่ด้วย; ส่วนลดต่อรายการไม่มีให้เป็น 0
- odometer: เลขไมล์ (กม.) เป็นตัวเลข
- ห้ามใส่ข้อมูลส่วนตัวของลูกค้า (ชื่อ ที่อยู่ เบอร์โทร เลขบัตร เลขผู้เสียภาษี) ในช่องใดเลย
- อ่านไม่ออกหรือไม่มีข้อมูลให้เป็น null อย่าเดา`;

/** เปิดใช้เมื่อมี GEMINI_API_KEY เท่านั้น */
export const isScanEnabled = () => Boolean(process.env.GEMINI_API_KEY);

/** ให้ Gemini อ่านภาพใบเสร็จ คืน null ถ้าอ่านไม่ได้ / ผลไม่ตรง schema */
export async function scanReceipt(base64: string, mimeType: string): Promise<ScannedReceipt | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    contents: [{ inlineData: { mimeType, data: base64 } }, { text: PROMPT }],
    config: { responseMimeType: "application/json", responseJsonSchema },
  });

  if (!response.text) return null;
  const parsed = scannedReceiptSchema.safeParse(JSON.parse(response.text));
  return parsed.success ? parsed.data : null;
}
