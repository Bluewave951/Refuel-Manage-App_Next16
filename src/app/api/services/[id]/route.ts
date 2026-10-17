import type { NextRequest } from "next/server";
import { badRequest, handleError, notFound, ok } from "@/lib/api";
import { ownsReceiptPath } from "@/lib/receipt-storage";
import { deleteService, getService, updateService } from "@/lib/service-service";
import { serviceInputSchema } from "@/lib/validations";
import { requireUserId } from "@/lib/auth";
import { limitMutations } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/services/:id */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const item = await getService(userId, id);
    return item ? ok(item) : notFound();
  } catch (e) {
    return handleError(e);
  }
}

/** PUT /api/services/:id — แก้ไขทั้งใบ (รวมรายการ) */
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    limitMutations(userId);
    const { id } = await params;
    const input = serviceInputSchema.parse(await req.json());
    if (input.receiptImagePath && !ownsReceiptPath(userId, input.receiptImagePath)) {
      return badRequest("ภาพใบเสร็จไม่ถูกต้อง");
    }
    const item = await updateService(userId, id, input);
    return item ? ok(item) : notFound();
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/services/:id — ลบ */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    limitMutations(userId);
    const { id } = await params;
    const deleted = await deleteService(userId, id);
    return deleted ? ok({ id, deleted: true }) : notFound();
  } catch (e) {
    return handleError(e);
  }
}
