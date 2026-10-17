-- ใบเสร็จซ่อม/บำรุงรักษารถ
CREATE TABLE "service_records" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "serviceDate" DATE NOT NULL,
    "shopName" VARCHAR(200) NOT NULL,
    "receiptNo" VARCHAR(100),
    "plateNo" VARCHAR(50),
    "vehicleModel" VARCHAR(100),
    "odometer" DECIMAL(12,2),
    "paymentMethod" VARCHAR(100),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "service_items" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "itemCode" VARCHAR(50),
    "description" VARCHAR(300) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" VARCHAR(30),
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "service_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_records_userId_serviceDate_idx" ON "service_records"("userId", "serviceDate");
CREATE INDEX "service_items_recordId_idx" ON "service_items"("recordId");

ALTER TABLE "service_items" ADD CONSTRAINT "service_items_recordId_fkey"
    FOREIGN KEY ("recordId") REFERENCES "service_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
