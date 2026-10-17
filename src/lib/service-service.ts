import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { resolveDateRange } from "./date-range";
import { lineTotalOf, serviceTotals } from "./service-totals";
import { removeReceipt } from "./receipt-storage";
import type { ServiceInput, ServiceQuery } from "./validations";
import type { ServiceListResponse, ServiceRecordDto, ServiceSummary } from "@/types/service";
import type { MonthlyPoint } from "@/types/refuel";

const includeItems = {
  items: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ServiceRecordInclude;

type ServiceRow = Prisma.ServiceRecordGetPayload<{ include: typeof includeItems }>;

const dec = (v: Prisma.Decimal | null) => (v === null ? null : Number(v));

export function toServiceDto(row: ServiceRow): ServiceRecordDto {
  return {
    id: row.id,
    serviceDate: row.serviceDate.toISOString().slice(0, 10),
    shopName: row.shopName,
    receiptNo: row.receiptNo,
    plateNo: row.plateNo,
    vehicleModel: row.vehicleModel,
    odometer: dec(row.odometer),
    paymentMethod: row.paymentMethod,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    totalAmount: Number(row.totalAmount),
    note: row.note,
    receiptImagePath: row.receiptImagePath,
    items: row.items.map((it) => ({
      id: it.id,
      itemCode: it.itemCode,
      description: it.description,
      quantity: Number(it.quantity),
      unit: it.unit,
      unitPrice: Number(it.unitPrice),
      discount: Number(it.discount),
      lineTotal: Number(it.lineTotal),
    })),
  };
}

export function calculateServiceSummary(rows: ServiceRecordDto[], rangeLabel: string): ServiceSummary {
  const count = rows.length;
  const totalAmount = Math.round(rows.reduce((s, r) => s + r.totalAmount, 0) * 100) / 100;
  const lastServiceDate = rows.reduce<string | null>(
    (a, r) => (a === null || r.serviceDate > a ? r.serviceDate : a),
    null
  );
  const odos = rows.map((r) => r.odometer).filter((o): o is number => o !== null);

  return {
    count,
    totalAmount,
    avgAmount: count > 0 ? Math.round((totalAmount / count) * 100) / 100 : null,
    lastServiceDate,
    lastOdometer: odos.length ? Math.max(...odos) : null,
    rangeLabel,
  };
}

/** ยอดรายเดือน เก่า → ใหม่ เติมเดือนที่ไม่มีรายการเป็น 0 ให้แกนเวลาต่อเนื่อง (รูปแบบเดียวกับกราฟหน้าเติมน้ำมัน) */
export function monthlyServiceTrend(rows: ServiceRecordDto[]): MonthlyPoint[] {
  if (rows.length === 0) return [];

  const byMonth = new Map<string, { count: number; amount: number }>();
  for (const r of rows) {
    const key = r.serviceDate.slice(0, 7);
    const m = byMonth.get(key) ?? { count: 0, amount: 0 };
    m.count += 1;
    m.amount += r.totalAmount;
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
      totalAmount: Math.round((m?.amount ?? 0) * 100) / 100,
      totalLiters: 0,
      avgPricePerLiter: null,
    });
  }
  return out;
}

export async function listServices(userId: string, query: ServiceQuery): Promise<ServiceListResponse> {
  const range = resolveDateRange(query);
  const where: Prisma.ServiceRecordWhereInput = { userId };
  if (range.gte || range.lte) {
    where.serviceDate = {
      ...(range.gte ? { gte: range.gte } : {}),
      ...(range.lte ? { lte: range.lte } : {}),
    };
  }

  const rows = await prisma.serviceRecord.findMany({
    where,
    include: includeItems,
    orderBy: [{ serviceDate: "desc" }, { createdAt: "desc" }],
  });
  const items = rows.map(toServiceDto);
  return {
    items,
    summary: calculateServiceSummary(items, range.label),
    monthly: monthlyServiceTrend(items),
    total: items.length,
  };
}

function recordData(input: ServiceInput) {
  const { subtotal, totalAmount } = serviceTotals(input);
  return {
    serviceDate: new Date(`${input.serviceDate}T00:00:00.000Z`),
    shopName: input.shopName,
    receiptNo: input.receiptNo || null,
    plateNo: input.plateNo || null,
    vehicleModel: input.vehicleModel || null,
    odometer: input.odometer == null ? null : new Prisma.Decimal(input.odometer),
    paymentMethod: input.paymentMethod || null,
    subtotal: new Prisma.Decimal(subtotal),
    discount: new Prisma.Decimal(input.discount ?? 0),
    totalAmount: new Prisma.Decimal(totalAmount),
    note: input.note || null,
    receiptImagePath: input.receiptImagePath || null,
  };
}

function itemsData(input: ServiceInput) {
  return input.items.map((it, i) => ({
    sortOrder: i,
    itemCode: it.itemCode || null,
    description: it.description,
    quantity: new Prisma.Decimal(it.quantity),
    unit: it.unit || null,
    unitPrice: new Prisma.Decimal(it.unitPrice),
    discount: new Prisma.Decimal(it.discount ?? 0),
    lineTotal: new Prisma.Decimal(lineTotalOf(it)),
  }));
}

export async function createService(userId: string, input: ServiceInput) {
  const row = await prisma.serviceRecord.create({
    data: { userId, ...recordData(input), items: { create: itemsData(input) } },
    include: includeItems,
  });
  return toServiceDto(row);
}

/** แก้ไขทั้งใบ: แทนที่รายการเดิมทั้งหมดด้วยรายการใหม่ */
export async function updateService(userId: string, id: string, input: ServiceInput) {
  const current = await prisma.serviceRecord.findFirst({
    where: { id, userId },
    select: { receiptImagePath: true },
  });
  if (!current) return null;

  const row = await prisma.serviceRecord.update({
    where: { id },
    data: { ...recordData(input), items: { deleteMany: {}, create: itemsData(input) } },
    include: includeItems,
  });
  // เปลี่ยน/เอาภาพออก → ลบไฟล์เดิมทิ้ง
  if (current.receiptImagePath && current.receiptImagePath !== row.receiptImagePath) {
    await removeReceipt(current.receiptImagePath).catch(() => {});
  }
  return toServiceDto(row);
}

export async function deleteService(userId: string, id: string) {
  const current = await prisma.serviceRecord.findFirst({
    where: { id, userId },
    select: { receiptImagePath: true },
  });
  if (!current) return false;

  await prisma.serviceRecord.delete({ where: { id } });
  if (current.receiptImagePath) await removeReceipt(current.receiptImagePath).catch(() => {});
  return true;
}

export async function getService(userId: string, id: string) {
  const row = await prisma.serviceRecord.findFirst({ where: { id, userId }, include: includeItems });
  return row ? toServiceDto(row) : null;
}
