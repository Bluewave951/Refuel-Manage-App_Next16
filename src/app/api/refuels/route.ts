import type { NextRequest } from "next/server";
import { handleError, ok, badRequest } from "@/lib/api";
import { createRefuel, listRefuels, validateOdometer } from "@/lib/refuel-service";
import { parseRefuelQuery, refuelInputSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { limitMutations } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GET /api/refuels — รายการ + สรุปยอด */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const query = parseRefuelQuery(req.nextUrl.searchParams);
    return ok(await listRefuels(userId, query));
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/refuels — เพิ่มรายการเติมน้ำมัน */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    limitMutations(userId);
    const body = await req.json();
    const input = refuelInputSchema.parse(body);

    const station = await prisma.station.findUnique({ where: { id: input.stationId } });
    if (!station) return badRequest("ไม่พบสถานีบริการที่เลือก");

    const odoError = await validateOdometer(userId, input.refuelDate, input.odometer);
    if (odoError) return badRequest(odoError, { odometer: [odoError] });

    return ok(await createRefuel(userId, input), { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
