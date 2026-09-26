import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const STATIONS = [
  { code: "PTT", nameTh: "ปตท.", nameEn: "PTT Station", sortOrder: 1 },
  { code: "PT", nameTh: "พีที", nameEn: "PT", sortOrder: 2 },
  { code: "SHELL", nameTh: "เชลล์", nameEn: "Shell", sortOrder: 3 },
  { code: "BCP", nameTh: "บางจาก", nameEn: "Bangchak", sortOrder: 4 },
  { code: "ESSO", nameTh: "เอสโซ่", nameEn: "Esso", sortOrder: 5 },
  { code: "CALTEX", nameTh: "คาลเท็กซ์", nameEn: "Caltex", sortOrder: 6 },
  { code: "SUSCO", nameTh: "ซัสโก้", nameEn: "Susco", sortOrder: 7 },
  { code: "IRPC", nameTh: "ไออาร์พีซี", nameEn: "IRPC", sortOrder: 8 },
  { code: "OTHER", nameTh: "อื่น ๆ", nameEn: "Other", sortOrder: 99 },
];

async function main() {
  for (const s of STATIONS) {
    await prisma.station.upsert({
      where: { code: s.code },
      update: { nameTh: s.nameTh, nameEn: s.nameEn, sortOrder: s.sortOrder },
      create: s,
    });
  }

  const shell = await prisma.station.findUniqueOrThrow({ where: { code: "SHELL" } });
  const pt = await prisma.station.findUniqueOrThrow({ where: { code: "PT" } });

  // รายการตัวอย่างต้องมีเจ้าของ — ตั้ง SEED_USER_ID (auth.users.id ของ Supabase) ถ้าต้องการ
  const userId = process.env.SEED_USER_ID;
  const count = userId ? await prisma.refuel.count({ where: { userId } }) : -1;
  if (!userId) {
    console.log("ข้ามรายการตัวอย่าง (ไม่ได้ตั้ง SEED_USER_ID)");
  } else if (count === 0) {
    const rows = [
      { date: "2026-07-07", stationId: shell.id, province: "กรุงเทพมหานคร", price: 49.89, amount: 2000, odo: 210350 },
      { date: "2026-07-08", stationId: shell.id, province: "กรุงเทพมหานคร", price: 49.89, amount: 1000, odo: 210630 },
      { date: "2026-07-09", stationId: pt.id, province: "กาญจนบุรี", price: 37.5, amount: 1500, odo: 211050 },
    ];

    for (const r of rows) {
      await prisma.refuel.create({
        data: {
          userId,
          refuelDate: new Date(`${r.date}T00:00:00.000Z`),
          stationId: r.stationId,
          province: r.province,
          pricePerLiter: new Prisma.Decimal(r.price),
          amount: new Prisma.Decimal(r.amount),
          liters: new Prisma.Decimal((r.amount / r.price).toFixed(3)),
          odometer: new Prisma.Decimal(r.odo),
        },
      });
    }
  }

  console.log("Seed สำเร็จ");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
