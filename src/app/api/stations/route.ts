import { handleError, ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/stations — รายชื่อสถานีบริการที่เปิดใช้งาน */
export async function GET() {
  try {
    await requireUserId();
    const stations = await prisma.station.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameTh: "asc" }],
      select: { id: true, code: true, nameTh: true, nameEn: true },
    });
    return ok(stations);
  } catch (e) {
    return handleError(e);
  }
}
