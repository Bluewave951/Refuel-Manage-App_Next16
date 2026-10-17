-- path ของภาพใบเสร็จใน Supabase Storage (bucket "receipts")
ALTER TABLE "service_records" ADD COLUMN "receiptImagePath" VARCHAR(300);
