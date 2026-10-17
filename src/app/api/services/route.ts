import type { NextRequest } from "next/server";
import { badRequest, handleError, ok } from "@/lib/api";
import { ownsReceiptPath } from "@/lib/receipt-storage";
import { createService, listServices } from "@/lib/service-service";
import { parseServiceQuery, serviceInputSchema } from "@/lib/validations";
import { requireUserId } from "@/lib/auth";
import { limitMutations } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GET /api/services — รายการใบเสร็จซ่อม + สรุปยอด */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const query = parseServiceQuery(req.nextUrl.searchParams);
    return ok(await listServices(userId, query));
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/services — เพิ่มใบเสร็จซ่อม */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    limitMutations(userId);
    const input = serviceInputSchema.parse(await req.json());
    if (input.receiptImagePath && !ownsReceiptPath(userId, input.receiptImagePath)) {
      return badRequest("ภาพใบเสร็จไม่ถูกต้อง");
    }
    return ok(await createService(userId, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
