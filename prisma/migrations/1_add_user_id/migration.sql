-- เจ้าของรายการ = auth.users.id ของ Supabase
-- nullable เพราะรายการตัวอย่างจาก seed ยังไม่มีเจ้าของ (แอปจะไม่แสดงรายการที่ไม่มีเจ้าของ)
ALTER TABLE "refuels" ADD COLUMN "userId" UUID;

-- CreateIndex
CREATE INDEX "refuels_userId_refuelDate_idx" ON "refuels"("userId", "refuelDate");
