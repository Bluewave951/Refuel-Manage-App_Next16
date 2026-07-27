import type { NextRequest } from "next/server";
import { handleError, notFound, ok } from "@/lib/api";
import { deleteRefuel, getRefuel, updateRefuel } from "@/lib/refuel-service";
import { refuelUpdateSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/refuels/:id */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const item = await getRefuel(id);
    return item ? ok(item) : notFound();
  } catch (e) {
    return handleError(e);
  }
}

/** PATCH /api/refuels/:id — แก้ไข */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const input = refuelUpdateSchema.parse(await req.json());
    const item = await updateRefuel(id, input);
    return item ? ok(item) : notFound();
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/refuels/:id — ลบ */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const deleted = await deleteRefuel(id);
    return deleted ? ok({ id, deleted: true }) : notFound();
  } catch (e) {
    return handleError(e);
  }
}
