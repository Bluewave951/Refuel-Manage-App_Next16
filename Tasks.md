# Tasks — Refuel Manage App

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
- [ ] ตั้งค่า `DATABASE_URL` (pooler, `?pgbouncer=true`) และ `DIRECT_URL` ใน `.env` — ใส่รหัสผ่านเอง (ดูตัวอย่างใน `.env.example`)
- [x] สร้าง migration `prisma/migrations/0_init` และ apply ไปที่ Supabase แล้ว
- [ ] รัน `pnpm prisma migrate resolve --applied 0_init` ครั้งเดียว เพื่อให้ Prisma รู้ว่า migration นี้ถูก apply แล้ว
- [x] seed สถานี 9 แห่ง + รายการตัวอย่าง 3 รายการบน Supabase
- [x] เปิด RLS บนตาราง `stations`, `refuels` (เข้าถึงผ่าน Prisma ฝั่ง server เท่านั้น) และตรวจ advisors
- [ ] จัดการฟังก์ชัน `public.rls_auto_enable()` (SECURITY DEFINER ที่ anon เรียกได้ — มีอยู่ก่อนแล้ว ไม่ได้มาจากแอปนี้)

## Phase 2 — ความปลอดภัย

- [ ] เพิ่มระบบล็อกอิน (เช่น Supabase Auth หรือ Auth.js)
- [ ] ป้องกันทุก route ใต้ `/api/*` และหน้า `/`, `/print`
- [ ] (ถ้ามีหลายผู้ใช้) เพิ่ม `userId` ใน `Refuel` และกรองข้อมูลตามผู้ใช้
- [ ] Rate limit สำหรับ POST/PATCH/DELETE

## Phase 3 — คุณภาพโค้ดและการทดสอบ

- [x] ตัดสินใจเรื่องภาษา: ใช้ TypeScript ทั้งโปรเจกต์ (โค้ดเป็น TS อยู่แล้ว)
- [ ] Unit test สูตรคำนวณใน `refuel-service.ts` (โดยเฉพาะ full-tank method, กรณีเลขไมล์ < 2 ครั้ง)
- [ ] Unit test `date-range.ts`, `csv.ts`, `validations.ts`
- [ ] Integration test ของ API routes
- [ ] ตั้ง CI: lint + typecheck + test + build

## Phase 4 — ฟีเจอร์เพิ่มเติม (ตัวเลือก)

- [ ] รองรับหลายคันรถ (ตาราง `Vehicle`)
- [ ] ประเภทเชื้อเพลิง (ดีเซล, แก๊สโซฮอล์ 91/95, E20 ...)
- [ ] กราฟแนวโน้มค่าใช้จ่ายและราคาต่อลิตรรายเดือน
- [ ] ตรวจเลขไมล์ไม่ให้ลดลงเมื่อเทียบกับรายการก่อนหน้า
- [ ] หน้าจัดการสถานีบริการ (เพิ่ม/ปิดใช้งาน)
- [ ] PDF ฝั่ง server ด้วย `@react-pdf/renderer` + ฟอนต์ไทย (สำหรับส่งอีเมลอัตโนมัติ)

## Phase 5 — Deploy

- [ ] Deploy บน Vercel (ตั้ง env ให้ครบ)
- [ ] ตรวจ build `prisma generate && next build` ผ่านบน CI
- [ ] Backup ฐานข้อมูลอัตโนมัติ
