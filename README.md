# Car_management_System

ระบบการจัดการรถยนต์ มี 2 โมดูล:

- **เติมน้ำมัน** (`/`) — บันทึกการเติมน้ำมัน สรุปยอด คำนวณอัตราสิ้นเปลือง
- **ซ่อมบำรุง** (`/services`) — บันทึกใบเสร็จซ่อม/บำรุงรักษารถแบบหลายรายการต่อใบ แนบภาพใบเสร็จ และให้ AI อ่านภาพมากรอกฟอร์มให้ได้ (ไม่บังคับ)

ทั้งสองโมดูลมีการ์ดสรุป กราฟรายเดือน และส่งออกรายงานเป็น PDF / CSV

## Tech stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| ภาษา | TypeScript (strict) |
| ฐานข้อมูล | PostgreSQL (Supabase) + Prisma ORM |
| Auth | Supabase Auth (อีเมล + รหัสผ่าน, ข้อมูลแยกตามผู้ใช้) |
| เก็บไฟล์ | Supabase Storage (bucket `receipts` แบบ private) |
| อ่านภาพใบเสร็จ | Google Gemini API (`@google/genai`, ไม่บังคับ) |
| Test / CI | Vitest + GitHub Actions (lint, typecheck, test, build) |
| UI | Tailwind CSS v4 + shadcn/ui + lucide-react |
| ฟอร์ม | react-hook-form + zod |
| Data fetching | SWR |
| Package manager | pnpm |

Frontend และ backend อยู่ใน repo เดียวกัน — backend คือ Route Handlers ใต้ `src/app/api`

## เริ่มใช้งาน

```bash
pnpm install

cp .env.example .env          # แก้ DATABASE_URL ให้ตรงกับเครื่องคุณ
docker compose up -d          # ถ้ายังไม่มี PostgreSQL

pnpm db:push                  # สร้างตารางตาม schema
pnpm db:seed                  # ใส่รายชื่อสถานีบริการ + ข้อมูลตัวอย่าง
pnpm dev                      # http://localhost:3000
```

### ตั้งค่าโมดูลซ่อมบำรุง

1. รัน `supabase/receipts-storage.sql` ใน Supabase Dashboard > SQL Editor (รันซ้ำได้) — สร้าง bucket `receipts` แบบ private + policy ให้ผู้ใช้เข้าถึงเฉพาะโฟลเดอร์ `<user id>/` ของตัวเอง
2. (ไม่บังคับ) ให้ AI อ่านภาพใบเสร็จ: ขอ key ฟรีที่ https://aistudio.google.com/apikey แล้วใส่ใน `.env`

   ```
   GEMINI_API_KEY=...
   # GEMINI_MODEL=gemini-3.8-flash   (ค่าเริ่มต้น; เปลี่ยนได้ถ้า Google เลิกใช้รุ่นนี้)
   ```

   ไม่ใส่ key ก็ใช้งานได้ — ระบบจะเก็บภาพอย่างเดียวและให้กรอกข้อมูลเอง
   > Gemini free tier: Google อาจนำข้อมูลไปปรับปรุงบริการ ระบบสั่งไม่ให้ดึงข้อมูลส่วนตัวลูกค้าลงฟอร์ม แต่ภาพทั้งใบถูกส่งไปประมวลผล

ขึ้น production:

```bash
pnpm db:migrate               # สร้าง migration ไฟล์ (แนะนำสำหรับ production)
pnpm build && pnpm start
```

## Deploy (Vercel + Supabase)

1. **Supabase** — ฐานข้อมูลอยู่บน Supabase แล้ว (migration ใน `prisma/migrations`)
   - Authentication > Sign In / Providers: ปิด **Allow new users to sign up**
   - Authentication > URL Configuration: ตั้ง **Site URL** เป็นโดเมนของ Vercel
   - สร้างผู้ใช้ที่ Authentication > Users > Add user
2. **Vercel** — Import repo นี้จาก GitHub (Framework: Next.js, build command ใช้ของ `package.json`)
3. ใส่ Environment Variables (Production + Preview):

   | ชื่อ | ค่า |
   |---|---|
   | `DATABASE_URL` | Transaction pooler (port 6543) + `?pgbouncer=true&connection_limit=1` |
   | `DIRECT_URL` | Session pooler (port 5432) |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
   | `GEMINI_API_KEY` | (ไม่บังคับ) สำหรับอ่านภาพใบเสร็จ |

   > รหัสผ่านที่มีอักขระพิเศษ (`@ # / ? : %` ฯลฯ) ต้อง URL-encode ก่อนใส่ใน connection string และห้ามมี `[ ]` จากตัวอย่างค้างอยู่
4. Migration ใหม่ในอนาคต: รัน `pnpm prisma migrate deploy` (ใช้ `DIRECT_URL`) ก่อน deploy โค้ดที่ต้องใช้ schema ใหม่

> เครื่องที่มี pnpm เวอร์ชันเก่า: ใช้ `corepack enable` หรือ `npx pnpm@9.12.0` เพื่อไม่ให้ `pnpm-lock.yaml` เปลี่ยนรูปแบบ (CI จะล้ม)

## โครงสร้างโปรเจกต์

```
prisma/
  schema.prisma          โมเดล Station, Refuel, ServiceRecord, ServiceItem
  seed.ts                ข้อมูลตั้งต้น
supabase/
  receipts-storage.sql   bucket + policy สำหรับภาพใบเสร็จ
src/
  app/
    api/
      refuels/route.ts           GET (list+summary), POST
      refuels/[id]/route.ts      GET, PATCH, DELETE
      refuels/summary/route.ts   GET เฉพาะตัวเลขสรุป
      stations/route.ts          GET รายชื่อสถานี
      services/route.ts          GET (list+summary+monthly), POST ใบเสร็จซ่อม
      services/[id]/route.ts     GET, PUT, DELETE
      services/[id]/image/       GET redirect ไปลิงก์ชั่วคราวของภาพใบเสร็จ
      services/upload/route.ts   POST อัปโหลดภาพ (+ ให้ Gemini อ่าน ถ้าเปิดไว้)
      export/csv/route.ts        GET ดาวน์โหลด CSV เติมน้ำมัน
      export/services-csv/       GET ดาวน์โหลด CSV ซ่อมบำรุง
    print/page.tsx         หน้า print preview เติมน้ำมัน (A4)
    services/page.tsx      หน้าซ่อมบำรุง
    services/print/        หน้า print preview ซ่อมบำรุง (A4)
    page.tsx               หน้าหลัก (เติมน้ำมัน)
  components/
    app-header.tsx         header + ปุ่มสลับโมดูล
    refuel-dashboard.tsx   ประกอบทุกส่วนของหน้าเติมน้ำมัน
    refuel-form.tsx        ฟอร์มเพิ่ม/แก้ไข
    refuel-table.tsx       ตาราง + ลบพร้อม dialog ยืนยัน
    service-dashboard.tsx  ประกอบทุกส่วนของหน้าซ่อมบำรุง (3 แท็บ)
    service-form.tsx       ฟอร์มใบเสร็จ (หลายรายการ) + แนบภาพ
    service-list.tsx       รายการใบเสร็จ + ดูรายละเอียด/ภาพ/ลบ
    summary-cards.tsx      การ์ดสรุป (ใช้ร่วมกันทั้ง 2 โมดูล)
    monthly-trend.tsx      กราฟรายเดือน
    filter-bar.tsx         ตัวกรองช่วงเวลา/สถานี/จังหวัด
    export-actions.tsx     ปุ่ม PDF / CSV / พิมพ์
    ui/                    shadcn/ui components
  lib/
    refuel-service.ts      business logic เติมน้ำมัน (ใช้ร่วมกันทั้ง API และ server component)
    service-service.ts     business logic ซ่อมบำรุง
    service-totals.ts      สูตรยอดต่อรายการ/ยอดสุทธิ
    receipt-storage.ts     อัปโหลด/ลิงก์ชั่วคราว/ลบภาพใน Supabase Storage
    receipt-scan.ts        ให้ Gemini อ่านภาพใบเสร็จ
    validations.ts         zod schema สำหรับ input และ query string
    date-range.ts          แปลงตัวเลือกช่วงเวลาเป็นช่วงวันที่จริง
    csv.ts, format.ts, api-client.ts, prisma.ts
  hooks/use-refuels.ts, use-services.ts   SWR hooks
  types/refuel.ts, service.ts             DTO ที่ frontend/backend ใช้ร่วมกัน
```

## API

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/refuels` | รายการ + สรุปยอด (รองรับ paging) |
| POST | `/api/refuels` | เพิ่มรายการ |
| GET | `/api/refuels/:id` | ดูรายการเดียว |
| PATCH | `/api/refuels/:id` | แก้ไข |
| DELETE | `/api/refuels/:id` | ลบ |
| GET | `/api/refuels/summary` | เฉพาะตัวเลขสรุป |
| GET | `/api/stations` | รายชื่อสถานีบริการ |
| GET | `/api/export/csv` | ดาวน์โหลด CSV |
| GET | `/api/services` | ใบเสร็จซ่อม + สรุปยอด + ยอดรายเดือน |
| POST | `/api/services` | เพิ่มใบเสร็จ |
| GET | `/api/services/:id` | ดูใบเสร็จเดียว |
| PUT | `/api/services/:id` | แก้ไขทั้งใบ (แทนที่รายการเดิม) |
| DELETE | `/api/services/:id` | ลบ (ลบภาพใน Storage ด้วย) |
| GET | `/api/services/:id/image` | redirect ไปลิงก์ชั่วคราว (10 นาที) ของภาพใบเสร็จ |
| POST | `/api/services/upload` | อัปโหลดภาพ (multipart `file`, JPG/PNG/WEBP ≤ 10 MB) คืน `imagePath` + ข้อมูลที่ AI อ่านได้ |
| GET | `/api/export/services-csv` | ดาวน์โหลด CSV ซ่อมบำรุง |

endpoint ของ `/api/services` และ `services-csv` รับเฉพาะ `range`, `from`, `to`

Query string ที่ endpoint เติมน้ำมันรับเหมือนกัน:

```
?range=all|7d|30d|this-month|last-month|this-year|custom
&from=2026-07-01&to=2026-07-31        (ใช้กับ range=custom)
&stationId=<cuid>&province=กรุงเทพมหานคร
&page=1&pageSize=50
&sort=date-desc|date-asc|amount-desc|amount-asc
```

ตัวอย่าง:

```bash
curl -X POST http://localhost:3000/api/refuels \
  -H "Content-Type: application/json" \
  -d '{
    "refuelDate": "2026-07-09",
    "stationId": "<station id>",
    "province": "กาญจนบุรี",
    "pricePerLiter": 37.5,
    "amount": 1500,
    "odometer": 211050
  }'
```

## สูตรคำนวณ

- **ปริมาณเติม (ลิตร)** = จำนวนเงิน ÷ ราคาต่อลิตร (คำนวณให้อัตโนมัติในฟอร์ม และคำนวณซ้ำฝั่ง server ก่อนบันทึก)
- **ระยะทางที่วิ่งได้** = เลขไมล์สูงสุด − เลขไมล์ต่ำสุด ในช่วงที่เลือก
- **อัตราสิ้นเปลืองเฉลี่ย** = ระยะทาง ÷ ปริมาณน้ำมันที่เติมทุกครั้ง **ยกเว้นครั้งแรก**

  ครั้งแรกคือน้ำมันที่มีอยู่ก่อนเริ่มนับระยะทาง จึงยังไม่ถูกใช้ไป (full-tank method) — ต้องมีรายการที่กรอกเลขไมล์อย่างน้อย 2 ครั้งจึงจะคำนวณได้
- **ค่าใช้จ่ายเฉลี่ยต่อกิโลเมตร** = ค่าใช้จ่ายรวม ÷ ระยะทาง

ซ่อมบำรุง (คำนวณซ้ำฝั่ง server ก่อนบันทึกเสมอ):

- **ยอดต่อรายการ** = จำนวน × ราคาต่อหน่วย − ส่วนลด
- **ยอดสุทธิทั้งใบ** = ผลรวมยอดต่อรายการ − ส่วนลดท้ายบิล
- เมื่อ AI อ่านภาพ ระบบจะเทียบยอดที่พิมพ์ในใบเสร็จกับยอดที่คำนวณได้ และเตือนถ้าไม่ตรง

## Export และ print

- **บันทึกเป็น PDF** — เปิด `/print?...&autoprint=1` แล้วเรียกกล่องพิมพ์ของเบราว์เซอร์ให้อัตโนมัติ เลือก "Save as PDF" ได้เลย
  วิธีนี้ตั้งใจเลือกเพราะ **ได้ฟอนต์ไทยที่ถูกต้อง 100%** — ไลบรารี PDF ฝั่ง server เช่น jsPDF ต้อง embed ฟอนต์ไทยเองและมักตัดคำผิด
- **ดูตัวอย่างก่อนพิมพ์** — เปิดหน้าเดียวกันโดยไม่สั่งพิมพ์ ดูเลย์เอาต์ A4 ก่อนได้
- **ดาวน์โหลด CSV** — `/api/export/csv` ใส่ BOM มาให้ Excel อ่านภาษาไทยได้ทันที และ escape ค่าที่ขึ้นต้นด้วย `=` `+` `-` `@` เพื่อกัน formula injection

ตัวกรองที่เลือกบนหน้าจอจะถูกส่งต่อไปยังไฟล์ export และหน้าพิมพ์เสมอ — เห็นอย่างไรได้ไฟล์อย่างนั้น

โมดูลซ่อมบำรุงใช้หลักเดียวกัน: `/services/print` และ `/api/export/services-csv` (CSV 1 แถว = 1 รายการในใบเสร็จ, ยอดสุทธิทั้งใบใส่เฉพาะแถวแรกของใบ เพื่อให้ SUM ทั้งคอลัมน์ได้ยอดถูก)

> ถ้าจำเป็นต้องได้ PDF จากฝั่ง server จริง ๆ (เช่นส่งอีเมลอัตโนมัติ) ให้เพิ่ม `@react-pdf/renderer` แล้ว `Font.register` ฟอนต์ Sarabun/IBM Plex Sans Thai เป็นไฟล์ `.ttf` ใน `public/fonts` — โครงสร้าง `listAllRefuels()` ใช้ซ้ำได้เลย

## หมายเหตุการออกแบบ

- ตัวเลขทั้งหมดในตารางและการ์ดสรุปใช้ฟอนต์ monospace แบบ tabular figures (คลาส `.tabular`) เพื่อให้หลักตรงกันทุกแถว อ่านเทียบกันได้เร็ว
- ราคาและจำนวนเงินเก็บเป็น `Decimal` ใน PostgreSQL ไม่ใช้ float เพื่อไม่ให้ยอดเงินเพี้ยน
- สรุปยอดคำนวณจาก **ทุกรายการในช่วงที่กรอง** ไม่ใช่เฉพาะหน้าปัจจุบัน
- `@media print` ซ่อนทุกอย่างที่มีคลาส `no-print` และบังคับให้ `<thead>` ซ้ำทุกหน้ากระดาษ
- ภาพใบเสร็จไม่เปิดเป็นสาธารณะ — เปิดดูผ่าน `/api/services/:id/image` ซึ่งตรวจเจ้าของก่อนสร้างลิงก์ชั่วคราว และ API ปฏิเสธ `receiptImagePath` ที่ไม่ได้อยู่ในโฟลเดอร์ของผู้ใช้เอง
