# Design — Refuel Manage App

เอกสารออกแบบระบบบันทึกค่าใช้จ่ายการเติมน้ำมัน (สถานะปัจจุบัน ณ 2026-09-26)

## 1. เป้าหมาย

- บันทึกการเติมน้ำมันแต่ละครั้ง (วันที่ สถานี จังหวัด ราคาต่อลิตร จำนวนเงิน เลขไมล์ หมายเหตุ)
- สรุปยอดตามช่วงเวลา / สถานี / จังหวัด: ค่าใช้จ่ายรวม ลิตรรวม ระยะทาง อัตราสิ้นเปลือง ค่าใช้จ่ายต่อกม.
- ส่งออกรายงานเป็น PDF (ผ่านหน้าพิมพ์ของเบราว์เซอร์) และ CSV (รองรับภาษาไทยใน Excel)

**นอกขอบเขต (ปัจจุบัน):** ระบบผู้ใช้/ล็อกอิน, หลายคันรถ, แอปมือถือ

## 2. สถาปัตยกรรม

```
Browser (React 19, SWR)
   │  fetch /api/*
   ▼
Next.js 16 App Router
   ├─ Server Components (page.tsx, print/page.tsx) ──┐
   └─ Route Handlers (src/app/api/*) ────────────────┤
                                                     ▼
                                  src/lib/refuel-service.ts  (business logic)
                                                     │  Prisma Client
                                                     ▼
                                  PostgreSQL (local Docker / Supabase)
```

- Frontend และ backend อยู่ใน repo เดียว
- Business logic รวมอยู่ที่ `refuel-service.ts` ใช้ร่วมกันทั้ง API และ Server Component
- Validation ด้วย zod (`validations.ts`) ใช้ schema เดียวกันทั้งฟอร์มและ API

## 3. Data model

| ตาราง | ฟิลด์หลัก | หมายเหตุ |
|---|---|---|
| `stations` | id, code (unique), nameTh, nameEn, sortOrder, isActive | ข้อมูลตั้งต้นจาก seed |
| `refuels` | id, refuelDate (Date), stationId → stations, province, pricePerLiter Decimal(8,2), amount Decimal(12,2), liters Decimal(10,3), odometer Decimal(12,2)?, note varchar(500)? | index: refuelDate, stationId, province, odometer |

- เงินและปริมาณใช้ `Decimal` ไม่ใช้ float
- `liters` คำนวณฝั่ง server เสมอ = `amount / pricePerLiter`
- ลบสถานีที่มีรายการอ้างอิงไม่ได้ (`onDelete: Restrict`)

## 4. API

| Method | Path | หน้าที่ |
|---|---|---|
| GET | `/api/refuels` | รายการ (paging/sort) + summary |
| POST | `/api/refuels` | เพิ่มรายการ |
| GET / PATCH / DELETE | `/api/refuels/:id` | ดู / แก้ไข / ลบ |
| GET | `/api/refuels/summary` | สรุปยอดอย่างเดียว |
| GET | `/api/stations` | รายชื่อสถานี |
| GET | `/api/export/csv` | ดาวน์โหลด CSV |

Query ร่วม: `range, from, to, stationId, province, page, pageSize (≤500), sort`
Error format: `{ error: string, details?: Record<string, string[]> }`

## 5. สูตรคำนวณ

| ค่า | สูตร |
|---|---|
| ลิตร | amount ÷ pricePerLiter |
| ระยะทาง | max(odometer) − min(odometer) ในช่วงที่กรอง |
| กม./ลิตร | ระยะทาง ÷ ลิตรรวม **ไม่นับครั้งแรก** (full-tank method, ต้องมีเลขไมล์ ≥ 2 ครั้ง) |
| บาท/กม. | ค่าใช้จ่ายรวม ÷ ระยะทาง |

สรุปยอดคำนวณจากทุกรายการในช่วงที่กรอง ไม่ใช่เฉพาะหน้าปัจจุบัน

## 6. UI

- หน้าหลัก `/`: `AppHeader` → `FilterBar` → `SummaryCards` (5 ใบ) → `ExportActions` → `RefuelTable` + `RefuelForm` (Dialog)
- หน้าพิมพ์ `/print`: เลย์เอาต์ A4, `autoprint=1` เรียกกล่องพิมพ์อัตโนมัติ, `<thead>` ซ้ำทุกหน้า
- ตัวเลขใช้ tabular figures (`.tabular`) ให้หลักตรงกัน
- ตัวกรองบนหน้าจอถูกส่งต่อไป export/print เสมอ
- Toast แจ้งผลด้วย sonner

## 7. ความปลอดภัยและคุณภาพข้อมูล

- zod `.strict()` ปฏิเสธฟิลด์แปลกปลอม, จังหวัดต้องอยู่ใน 77 จังหวัด
- CSV ใส่ BOM และ escape ค่าที่ขึ้นต้นด้วย `= + - @` (กัน formula injection)
- ตรวจว่า stationId มีอยู่จริงก่อนบันทึก
- **ยังไม่มี authentication** — ห้ามเปิดสู่สาธารณะจนกว่าจะเพิ่ม (ดู Tasks.md)

## 8. การ deploy

- Dev: Docker PostgreSQL 16 (`docker-compose.yml`) + `pnpm db:push` + `pnpm db:seed`
- Production: ตัวเลือกคือ Supabase Postgres — ใช้ `DATABASE_URL` (pooler) และ `DIRECT_URL` (สำหรับ migrate) และใช้ `prisma migrate` แทน `db push`

## 9. ข้อสังเกต / การตัดสินใจที่ค้างอยู่

- **ตัดสินใจแล้ว (2026-09-26):** ใช้ **TypeScript (strict)** ทั้งโปรเจกต์ ตรงตามกฎใน AGENTS.md — ไฟล์ config `eslint.config.mjs`, `postcss.config.mjs` คงไว้ตามมาตรฐานของเครื่องมือ
- `schema.prisma` ยังไม่ได้ผูก `directUrl = env("DIRECT_URL")` แม้ `.env.example` มีตัวแปรนี้
- ยังไม่มีชุดทดสอบอัตโนมัติ
