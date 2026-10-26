import { prisma } from "./prisma";
prisma.serviceRecord.count().then((n) => console.log("service_records OK, rows =", n)).catch((e) => console.error("ERROR:", e.message)).finally(() => prisma.$disconnect());
