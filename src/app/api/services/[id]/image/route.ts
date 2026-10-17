import { NextResponse, type NextRequest } from "next/server";
import { handleError, notFound } from "@/lib/api";
import { requireUserId } from "@/lib/auth";
import { getService } from "@/lib/service-service";
import { signedReceiptUrl } from "@/lib/receipt-storage";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/services/:id/image — redirect ไปยังลิงก์ชั่วคราวของภาพใบเสร็จ */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const item = await getService(userId, id);
    if (!item?.receiptImagePath) return notFound("ไม่มีภาพใบเสร็จ");
    const url = await signedReceiptUrl(item.receiptImagePath);
    return url ? NextResponse.redirect(url) : notFound("ไม่พบไฟล์ภาพ");
  } catch (e) {
    return handleError(e);
  }
}
