-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refuels" (
    "id" TEXT NOT NULL,
    "refuelDate" DATE NOT NULL,
    "stationId" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "pricePerLiter" DECIMAL(8,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "liters" DECIMAL(10,3) NOT NULL,
    "odometer" DECIMAL(12,2),
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refuels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");

-- CreateIndex
CREATE INDEX "refuels_refuelDate_idx" ON "refuels"("refuelDate");

-- CreateIndex
CREATE INDEX "refuels_stationId_idx" ON "refuels"("stationId");

-- CreateIndex
CREATE INDEX "refuels_province_idx" ON "refuels"("province");

-- CreateIndex
CREATE INDEX "refuels_odometer_idx" ON "refuels"("odometer");

-- AddForeignKey
ALTER TABLE "refuels" ADD CONSTRAINT "refuels_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Supabase: เปิด RLS โดยไม่มี policy — ปิดการเข้าถึงผ่าน Data API (anon/authenticated)
-- แอปเข้าถึงผ่าน Prisma ด้วย role postgres ซึ่ง bypass RLS
ALTER TABLE "stations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refuels" ENABLE ROW LEVEL SECURITY;
