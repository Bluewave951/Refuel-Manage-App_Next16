import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { resolveDateRange } from "./date-range";
import type { RefuelQuery, RefuelInput, RefuelUpdate } from "./validations";
import type { MonthlyPoint, RefuelDto, RefuelListResponse, RefuelSummary } from "@/types/refuel";

const refuelWithStation = Prisma.validator<Prisma.RefuelDefaultArgs>()({
  include: { station: true },
});
type RefuelRow = Prisma.RefuelGetPayload<typeof refuelWithStation>;

const dec = (v: Prisma.Decimal | null) => (v === null ? null : Number(v));

export function toRefuelDto(row: RefuelRow): RefuelDto {
  return {
    id: row.id,
    refuelDate: row.refuelDate.toISOString().slice(0, 10),
    province: row.province,
    pricePerLiter: Number(row.pricePerLiter),
    amount: Number(row.amount),
    liters: Number(row.liters),
    odometer: dec(row.odometer),
    note: row.note,
    station: {
      id: row.station.id,
      code: row.station.code,
      nameTh: row.station.nameTh,
      nameEn: row.station.nameEn,
    },
  };
}

export function buildWhere(userId: string, query: RefuelQuery): Prisma.RefuelWhereInput {
  const range = resolveDateRange(query);
  const where: Prisma.RefuelWhereInput = { userId };

  if (range.gte || range.lte) {
    where.refuelDate = {
      ...(range.gte ? { gte: range.gte } : {}),
      ...(range.lte ? { lte: range.lte } : {}),
    };
  }
  if (query.stationId) where.stationId = query.stationId;
  if (query.province) where.province = query.province;

  return where;
}

function buildOrderBy(sort: RefuelQuery["sort"]): Prisma.RefuelOrderByWithRelationInput[] {
  switch (sort) {
    case "date-asc":
      return [{ refuelDate: "asc" }, { createdAt: "asc" }];
    case "amount-desc":
      return [{ amount: "desc" }];
    case "amount-asc":
      return [{ amount: "asc" }];
    default:
      return [{ refuelDate: "desc" }, { createdAt: "desc" }];
  }
}

/**
 * คำนวณอัตราสิ้นเปลืองแบบมาตรฐาน (full-tank method)
 *
 *   ระยะทาง       = เลขไมล์ครั้งล่าสุด - เลขไมล์ครั้งแรก
 *   น้ำมันที่ใช้ไป  = ผลรวมลิตรของทุกครั้ง ยกเว้นครั้งแรก
 *                    (น้ำมันที่เติมครั้งแรกคือน้ำมันที่ "เริ่มต้น" ยังไม่ถูกใช้)
 *   อัตราสิ้นเปลือง = ระยะทาง / น้ำมันที่ใช้ไป
 */
export function calculateSummary(rows: RefuelDto[], rangeLabel: string): RefuelSummary {
  const count = rows.length;
  const totalLiters = round(rows.reduce((s, r) => s + r.liters, 0), 3);
  const totalAmount = round(rows.reduce((s, r) => s + r.amount, 0), 2);

  const withOdo = rows
    .filter((r): r is RefuelDto & { odometer: number } => r.odometer !== null)
    .sort((a, b) => a.odometer - b.odometer);

  let totalDistance = 0;
  let avgKmPerLiter: number | null = null;

  if (withOdo.length >= 2) {
    totalDistance = round(withOdo[withOdo.length - 1].odometer - withOdo[0].odometer, 2);
    const litersConsumed = withOdo.slice(1).reduce((s, r) => s + r.liters, 0);
    if (litersConsumed > 0 && totalDistance > 0) {
      avgKmPerLiter = round(totalDistance / litersConsumed, 2);
    }
  }

  const avgPricePerLiter = totalLiters > 0 ? round(totalAmount / totalLiters, 2) : null;
  const costPerKm = totalDistance > 0 ? round(totalAmount / totalDistance, 2) : null;

  return {
    count,
    totalLiters,
    totalAmount,
    totalDistance,
    avgKmPerLiter,
    avgPricePerLiter,
    costPerKm,
    rangeLabel,
  };
}

/** รวมยอดรายเดือน เรียงจากเก่าไปใหม่ และเติมเดือนที่ไม่มีรายการเป็น 0 ให้แกนเวลาต่อเนื่อง */
export function monthlyTrend(rows: RefuelDto[]): MonthlyPoint[] {
  if (rows.length === 0) return [];

  const byMonth = new Map<string, { count: number; amount: number; liters: number }>();
  for (const r of rows) {
    const key = r.refuelDate.slice(0, 7);
    const m = byMonth.get(key) ?? { count: 0, amount: 0, liters: 0 };
    m.count += 1;
    m.amount += r.amount;
    m.liters += r.liters;
    byMonth.set(key, m);
  }

  const keys = [...byMonth.keys()].sort();
  const [fy, fm] = keys[0].split("-").map(Number);
  const [ly, lm] = keys[keys.length - 1].split("-").map(Number);

  const out: MonthlyPoint[] = [];
  for (let y = fy, mo = fm; y < ly || (y === ly && mo <= lm); mo === 12 ? (y++, (mo = 1)) : mo++) {
    const month = `${y}-${String(mo).padStart(2, "0")}`;
    const m = byMonth.get(month);
    out.push({
      month,
      count: m?.count ?? 0,
      totalAmount: round(m?.amount ?? 0, 2),
      totalLiters: round(m?.liters ?? 0, 3),
      avgPricePerLiter: m && m.liters > 0 ? round(m.amount / m.liters, 2) : null,
    });
  }
  return out;
}

function round(n: number, digits: number) {
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/** ดึงรายการ + สรุปยอด (สรุปคิดจาก "ทุกรายการในช่วง" ไม่ใช่เฉพาะหน้าปัจจุบัน) */
export async function listRefuels(userId: string, query: RefuelQuery): Promise<RefuelListResponse> {
  const where = buildWhere(userId, query);
  const rangeLabel = resolveDateRange(query).label;

  const [total, pageRows, allRows] = await Promise.all([
    prisma.refuel.count({ where }),
    prisma.refuel.findMany({
      where,
      include: { station: true },
      orderBy: buildOrderBy(query.sort),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.refuel.findMany({
      where,
      include: { station: true },
      orderBy: [{ refuelDate: "asc" }],
    }),
  ]);

  const items = pageRows.map(toRefuelDto);
  const all = allRows.map(toRefuelDto);

  return {
    items,
    summary: calculateSummary(all, rangeLabel),
    monthly: monthlyTrend(all),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

/** ดึงทุกแถวในช่วง (ใช้กับ export / print) */
export async function listAllRefuels(userId: string, query: RefuelQuery) {
  const where = buildWhere(userId, query);
  const rows = await prisma.refuel.findMany({
    where,
    include: { station: true },
    orderBy: buildOrderBy(query.sort),
  });
  const items = rows.map(toRefuelDto);
  return { items, summary: calculateSummary(items, resolveDateRange(query).label) };
}

function litersOf(amount: number, pricePerLiter: number) {
  return new Prisma.Decimal((amount / pricePerLiter).toFixed(3));
}

export async function createRefuel(userId: string, input: RefuelInput) {
  const row = await prisma.refuel.create({
    data: {
      userId,
      refuelDate: new Date(`${input.refuelDate}T00:00:00.000Z`),
      stationId: input.stationId,
      province: input.province,
      pricePerLiter: new Prisma.Decimal(input.pricePerLiter),
      amount: new Prisma.Decimal(input.amount),
      liters: litersOf(input.amount, input.pricePerLiter),
      odometer: input.odometer == null ? null : new Prisma.Decimal(input.odometer),
      note: input.note ?? null,
    },
    include: { station: true },
  });
  return toRefuelDto(row);
}

export async function updateRefuel(userId: string, id: string, input: RefuelUpdate) {
  const current = await prisma.refuel.findFirst({ where: { id, userId } });
  if (!current) return null;

  const amount = input.amount ?? Number(current.amount);
  const price = input.pricePerLiter ?? Number(current.pricePerLiter);

  const row = await prisma.refuel.update({
    where: { id },
    data: {
      ...(input.refuelDate ? { refuelDate: new Date(`${input.refuelDate}T00:00:00.000Z`) } : {}),
      ...(input.stationId ? { stationId: input.stationId } : {}),
      ...(input.province ? { province: input.province } : {}),
      pricePerLiter: new Prisma.Decimal(price),
      amount: new Prisma.Decimal(amount),
      liters: litersOf(amount, price),
      ...(input.odometer !== undefined
        ? { odometer: input.odometer == null ? null : new Prisma.Decimal(input.odometer) }
        : {}),
      ...(input.note !== undefined ? { note: input.note ?? null } : {}),
    },
    include: { station: true },
  });
  return toRefuelDto(row);
}

export async function deleteRefuel(userId: string, id: string) {
  const { count } = await prisma.refuel.deleteMany({ where: { id, userId } });
  return count > 0;
}

export async function getRefuel(userId: string, id: string) {
  const row = await prisma.refuel.findFirst({ where: { id, userId }, include: { station: true } });
  return row ? toRefuelDto(row) : null;
}

/**
 * เลขไมล์ต้องไม่ลดลงตามวันที่:
 *   - ต้อง >= เลขไมล์สูงสุดของรายการที่ "ก่อน" วันนี้
 *   - ต้อง <= เลขไมล์ต่ำสุดของรายการที่ "หลัง" วันนี้
 * รายการวันเดียวกันไม่นำมาเทียบ (ลำดับในวันเดียวกันไม่แน่นอน)
 * คืนข้อความ error หรือ null ถ้าผ่าน
 */
export function checkOdometerOrder(
  odometer: number,
  maxBefore: number | null,
  minAfter: number | null
): string | null {
  if (maxBefore !== null && odometer < maxBefore) {
    return `เลขไมล์ต้องไม่น้อยกว่าครั้งก่อนหน้า (${maxBefore.toLocaleString("th-TH")} กม.)`;
  }
  if (minAfter !== null && odometer > minAfter) {
    return `เลขไมล์ต้องไม่มากกว่าครั้งถัดไป (${minAfter.toLocaleString("th-TH")} กม.)`;
  }
  return null;
}

/** ตรวจเลขไมล์กับรายการอื่นของผู้ใช้คนเดียวกัน (excludeId = รายการที่กำลังแก้ไข) */
export async function validateOdometer(
  userId: string,
  refuelDate: string,
  odometer: number | null | undefined,
  excludeId?: string
): Promise<string | null> {
  if (odometer == null) return null;
  const date = new Date(`${refuelDate}T00:00:00.000Z`);
  const base: Prisma.RefuelWhereInput = {
    userId,
    odometer: { not: null },
    ...(excludeId ? { id: { not: excludeId } } : {}),
  };

  const [before, after] = await Promise.all([
    prisma.refuel.aggregate({ where: { ...base, refuelDate: { lt: date } }, _max: { odometer: true } }),
    prisma.refuel.aggregate({ where: { ...base, refuelDate: { gt: date } }, _min: { odometer: true } }),
  ]);

  return checkOdometerOrder(odometer, dec(before._max.odometer), dec(after._min.odometer));
}
