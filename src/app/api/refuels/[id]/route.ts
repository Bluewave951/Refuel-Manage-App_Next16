import type { NextRequest } from "next/server";
import { badRequest, handleError, notFound, ok } from "@/lib/api";
import { deleteRefuel, getRefuel, updateRefuel, validateOdometer } from "@/lib/refuel-service";
import { refuelUpdateSchema } from "@/lib/validations";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { limitMutations } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/refuels/:id */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const item = await getRefuel(userId, id);
    return item ? ok(item) : notFound();
  } catch (e) {
    return handleError(e);
  }
}

/** PATCH /api/refuels/:id — แก้ไข */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    limitMutations(userId);
    const { id } = await params;
    const input = refuelUpdateSchema.parse(await req.json());
    if (input.stationId) {
      const station = await prisma.station.findUnique({ where: { id: input.stationId } });
      if (!station) return badRequest("ไม่พบสถานีบริการที่เลือก");
    }
    if (input.refuelDate !== undefined || input.odometer !== undefined) {
      const current = await getRefuel(userId, id);
      if (!current) return notFound();
      const odoError = await validateOdometer(
        userId,
        input.refuelDate ?? current.refuelDate,
        input.odometer !== undefined ? input.odometer : current.odometer,
        id
      );
      if (odoError) return badRequest(odoError, { odometer: [odoError] });
    }
    const item = await updateRefuel(userId, id, input);
    return item ? ok(item) : notFound();
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/refuels/:id — ลบ */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    limitMutations(userId);
    const { id } = await params;
    const deleted = await deleteRefuel(userId, id);
    return deleted ? ok({ id, deleted: true }) : notFound();
  } catch (e) {
    return handleError(e);
  }
}
