-- ทุกรายการต้องมีเจ้าของ (รายการตัวอย่างจาก seed ถูกโอนให้ผู้ใช้คนแรกแล้ว)
ALTER TABLE "refuels" ALTER COLUMN "userId" SET NOT NULL;
