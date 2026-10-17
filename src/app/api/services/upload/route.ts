import type { NextRequest } from "next/server";
import { badRequest, handleError, ok } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { limitMutations } from "@/lib/rate-limit";
import { uploadReceipt } from "@/lib/receipt-storage";
import { isScanEnabled, scanReceipt } from "@/lib/receipt-scan";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED = new Set<string>(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * POST /api/services/upload — เก็บภาพใบเสร็จ (ผูกกับใบเสร็จตอนกดบันทึก)
 * ถ้ามี GEMINI_API_KEY จะให้ AI อ่านข้อมูลมาเติมฟอร์มด้วย; อ่านไม่สำเร็จก็ยังเก็บภาพได้
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    limitMutations(userId);

    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) return badRequest("กรุณาเลือกไฟล์ภาพ");
    if (!ALLOWED.has(file.type)) return badRequest("รองรับเฉพาะไฟล์ JPG, PNG, WEBP");
    if (file.size > MAX_BYTES) return badRequest("ไฟล์ใหญ่เกิน 10 MB");

    const scan = isScanEnabled()
      ? scanReceipt(Buffer.from(await file.arrayBuffer()).toString("base64"), file.type).catch((e) => {
          console.error("scanReceipt", e);
          return null;
        })
      : Promise.resolve(null);

    const [imagePath, data] = await Promise.all([uploadReceipt(userId, file), scan]);
    return ok({ imagePath, data, scanEnabled: isScanEnabled() });
  } catch (e) {
    return handleError(e);
  }
}
