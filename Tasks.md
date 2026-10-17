# Tasks — Car_management_System

สถานะ: `[x]` เสร็จแล้ว · `[ ]` ยังไม่ทำ — อ้างอิงการออกแบบใน [design.md](design.md)

## ✅ Phase 0 — ฟีเจอร์หลัก (เสร็จแล้ว)

- [x] Prisma schema: `Station`, `Refuel` + seed ข้อมูลตั้งต้น
- [x] API CRUD `/api/refuels`, `/api/refuels/:id`
- [x] API สรุปยอด `/api/refuels/summary` และ `/api/stations`
- [x] ตัวกรองช่วงเวลา / สถานี / จังหวัด + paging + sort
- [x] ฟอร์มเพิ่ม/แก้ไข (react-hook-form + zod) คำนวณลิตรอัตโนมัติ
- [x] ตารางรายการ + ลบพร้อม dialog ยืนยัน
- [x] การ์ดสรุป 5 ใบ (ค่าใช้จ่าย, ลิตร, ระยะทาง, กม./ลิตร, บาท/กม.)
- [x] Export CSV (BOM + กัน formula injection)
- [x] หน้าพิมพ์ A4 / บันทึก PDF ผ่านเบราว์เซอร์

## Phase 1 — ฐานข้อมูล Supabase

- [x] สร้าง/เลือกโปรเจกต์ Supabase และตรวจตารางที่มีอยู่ (ฐานข้อมูลว่าง)
- [x] เพิ่ม `directUrl = env("DIRECT_URL")` ใน `prisma/schema.prisma`
- [x] ตั้งค่า `DATABASE_URL` (pooler, `?pgbouncer=true`) และ `DIRECT_URL` ใน `.env` — ใส่รหัสผ่านเอง (ดูตัวอย่างใน `.env.example`)
- [x] สร้าง migration `prisma/migrations/0_init` และ apply ไปที่ Supabase แล้ว
- [x] รัน `pnpm prisma migrate resolve --applied 0_init` ครั้งเดียว เพื่อให้ Prisma รู้ว่า migration นี้ถูก apply แล้ว
- [x] seed สถานี 9 แห่ง + รายการตัวอย่าง 3 รายการบน Supabase
- [x] เปิด RLS บนตาราง `stations`, `refuels` (เข้าถึงผ่าน Prisma ฝั่ง server เท่านั้น) และตรวจ advisors
- [x] ถอนสิทธิ์ EXECUTE ของ `public.rls_auto_enable()` จาก anon/authenticated (SECURITY DEFINER ที่มีอยู่ก่อนแล้ว)

## Phase 2 — ความปลอดภัย

- [x] เพิ่มระบบล็อกอินด้วย Supabase Auth (อีเมล + รหัสผ่าน, หน้า `/login`, ปุ่มออกจากระบบ)
- [x] ป้องกันทุก route ใต้ `/api/*` และหน้า `/`, `/print` (`src/proxy.ts` + `requireUserId()`)
- [x] เพิ่ม `userId` ใน `Refuel` (migration `1_add_user_id`) และกรองข้อมูลตามผู้ใช้ทุก query
- [x] ปิด "Allow new users to sign up" ใน Supabase Dashboard > Authentication > Sign In / Providers
- [x] สร้างผู้ใช้ (ไม่เกิน 10 คน) ใน Dashboard > Authentication > Users > Add user
- [x] โอนรายการตัวอย่าง 3 รายการให้ผู้ใช้คนแรก และตั้ง `userId` เป็น NOT NULL (migration `2_user_id_required`)
- [x] รัน `pnpm prisma migrate resolve --applied 1_add_user_id`
- [x] Rate limit สำหรับ POST/PATCH/DELETE (30 ครั้ง/นาที/ผู้ใช้, in-memory — ถ้าต้องเข้มงวดข้าม instance ให้ย้ายไป Upstash Redis)

## Phase 3 — คุณภาพโค้ดและการทดสอบ

- [x] ตัดสินใจเรื่องภาษา: ใช้ TypeScript ทั้งโปรเจกต์ (โค้ดเป็น TS อยู่แล้ว)
- [x] Unit test สูตรคำนวณใน `refuel-service.ts` (โดยเฉพาะ full-tank method, กรณีเลขไมล์ < 2 ครั้ง)
- [x] Unit test `date-range.ts`, `csv.ts`, `validations.ts`
- [ ] Integration test ของ API routes
- [x] ตั้ง CI: lint + typecheck + test + build (`.github/workflows/ci.yml`, vitest, ESLint flat config)

## Phase 4 — ฟีเจอร์เพิ่มเติม (ตัวเลือก)

- [ ] รองรับหลายคันรถ (ตาราง `Vehicle`)
- [ ] ประเภทเชื้อเพลิง (ดีเซล, แก๊สโซฮอล์ 91/95, E20 ...)
- [x] กราฟแนวโน้มค่าใช้จ่ายและราคาต่อลิตรรายเดือน (`monthly-trend.tsx`, มีมุมมองตาราง)
- [x] ตรวจเลขไมล์ไม่ให้ลดลงเมื่อเทียบกับรายการก่อนหน้า (และไม่เกินรายการถัดไป กรณีบันทึกย้อนหลัง)
- [ ] หน้าจัดการสถานีบริการ (เพิ่ม/ปิดใช้งาน)
- [ ] PDF ฝั่ง server ด้วย `@react-pdf/renderer` + ฟอนต์ไทย (สำหรับส่งอีเมลอัตโนมัติ)

## Phase 5 — Deploy

- [ ] Deploy บน Vercel (ตั้ง env ให้ครบ รวม `GEMINI_API_KEY` ถ้าใช้ AI อ่านใบเสร็จ)
- [x] ตรวจ build `prisma generate && next build` ผ่านบน CI
- [ ] Backup ฐานข้อมูลอัตโนมัติ

## Phase 6 — โมดูลซ่อมบำรุง (ใบเสร็จซ่อมรถ)

- [x] ตาราง `service_records` + `service_items` (migration `3_add_service_records`) แยกตามผู้ใช้
- [x] API `/api/services` (GET, POST) และ `/api/services/:id` (GET, PUT, DELETE) — แก้ไขทั้งใบแทนที่รายการเดิม
- [x] คำนวณยอดฝั่ง server: ยอดต่อรายการ = จำนวน × ราคา − ส่วนลด, สุทธิ = Σ รายการ − ส่วนลดท้ายบิล (`service-totals.ts` + unit test)
- [x] หน้า `/services` 3 แท็บ (สรุปข้อมูล / รายการที่บันทึก / เพิ่มรายการ) + แถบเมนูล่างบนมือถือ
- [x] การ์ดสรุปแบบเดียวกับหน้าเติมน้ำมัน (ใช้ `StatCards` ร่วมกัน) + กราฟค่าใช้จ่ายรายเดือน (`MonthlyCostTrend`)
- [x] ส่งออก PDF / CSV และหน้าตัวอย่างก่อนพิมพ์ (`/services/print`, `/api/export/services-csv`)
- [x] แนบภาพใบเสร็จ เก็บใน Supabase Storage bucket `receipts` แบบ private (migration `4_service_receipt_image`, `supabase/receipts-storage.sql`)
- [x] ให้ Google Gemini (free tier) อ่านภาพใบเสร็จแล้วเติมฟอร์มอัตโนมัติ — เปิดเมื่อมี `GEMINI_API_KEY`, เตือนเมื่อยอดไม่ตรงกับใบเสร็จ
- [x] เปลี่ยนชื่อแอปเป็น Car_management_System + ปุ่มสลับโมดูลใน header
- [ ] ลบไฟล์ภาพที่อัปโหลดแล้วแต่ไม่ได้กดบันทึก (ไฟล์กำพร้าใน bucket)
- [ ] ผูกใบเสร็จซ่อมกับรถแต่ละคัน (เมื่อทำตาราง `Vehicle` ใน Phase 4)
- [ ] แจ้งเตือนรอบเปลี่ยนน้ำมันเครื่อง/บำรุงรักษาตามเลขไมล์หรือระยะเวลา
- [ ] Export เป็นไฟล์ `.xlsx` จริง (ตอนนี้เป็น CSV ที่เปิดใน Excel ได้)
