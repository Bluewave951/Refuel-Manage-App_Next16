import type { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api";
import { listAllRefuels } from "@/lib/refuel-service";
import { parseRefuelQuery } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** GET /api/refuels/summary — เฉพาะตัวเลขสรุป (ใช้กับการ์ดสรุป/แดชบอร์ด) */
export async function GET(req: NextRequest) {
  try {
    const query = parseRefuelQuery(req.nextUrl.searchParams);
    const { summary } = await listAllRefuels(query);
    return ok(summary);
  } catch (e) {
    return handleError(e);
  }
}
