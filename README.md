# Refuel Manage App

ระบบบันทึกค่าใช้จ่ายในการเติมน้ำมัน — บันทึกรายการ สรุปยอด คำนวณอัตราสิ้นเปลือง และส่งออกรายงานเป็น PDF / CSV

## Tech stack

| ส่วน | เทคโนโลยี |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| ภาษา | TypeScript (strict) |
| ฐานข้อมูล | PostgreSQL + Prisma ORM |
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

ขึ้น production:

```bash
pnpm db:migrate               # สร้าง migration ไฟล์ (แนะนำสำหรับ production)
pnpm build && pnpm start
```

## โครงสร้างโปรเจกต์

```
prisma/
  schema.prisma          โมเดล Station, Refuel
  seed.ts                ข้อมูลตั้งต้น
src/
  app/
    api/
      refuels/route.ts           GET (list+summary), POST
      refuels/[id]/route.ts      GET, PATCH, DELETE
      refuels/summary/route.ts   GET เฉพาะตัวเลขสรุป
      stations/route.ts          GET รายชื่อสถานี
      export/csv/route.ts        GET ดาวน์โหลด CSV
    print/page.tsx         หน้า print preview (A4)
    page.tsx               หน้าหลัก
  components/
    refuel-dashboard.tsx   ประกอบทุกส่วนเข้าด้วยกัน
    refuel-form.tsx        ฟอร์มเพิ่ม/แก้ไข
    refuel-table.tsx       ตาราง + ลบพร้อม dialog ยืนยัน
    summary-cards.tsx      การ์ดสรุป 5 ใบ
    filter-bar.tsx         ตัวกรองช่วงเวลา/สถานี/จังหวัด
    export-actions.tsx     ปุ่ม PDF / CSV / พิมพ์
    ui/                    shadcn/ui components
  lib/
    refuel-service.ts      business logic ทั้งหมด (ใช้ร่วมกันทั้ง API และ server component)
    validations.ts         zod schema สำหรับ input และ query string
    date-range.ts          แปลงตัวเลือกช่วงเวลาเป็นช่วงวันที่จริง
    csv.ts, format.ts, api-client.ts, prisma.ts
  hooks/use-refuels.ts     SWR hooks
  types/refuel.ts          DTO ที่ frontend/backend ใช้ร่วมกัน
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

Query string ที่ทุก endpoint รับเหมือนกัน:

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

## Export และ print

- **บันทึกเป็น PDF** — เปิด `/print?...&autoprint=1` แล้วเรียกกล่องพิมพ์ของเบราว์เซอร์ให้อัตโนมัติ เลือก "Save as PDF" ได้เลย
  วิธีนี้ตั้งใจเลือกเพราะ **ได้ฟอนต์ไทยที่ถูกต้อง 100%** — ไลบรารี PDF ฝั่ง server เช่น jsPDF ต้อง embed ฟอนต์ไทยเองและมักตัดคำผิด
- **ดูตัวอย่างก่อนพิมพ์** — เปิดหน้าเดียวกันโดยไม่สั่งพิมพ์ ดูเลย์เอาต์ A4 ก่อนได้
- **ดาวน์โหลด CSV** — `/api/export/csv` ใส่ BOM มาให้ Excel อ่านภาษาไทยได้ทันที และ escape ค่าที่ขึ้นต้นด้วย `=` `+` `-` `@` เพื่อกัน formula injection

ตัวกรองที่เลือกบนหน้าจอจะถูกส่งต่อไปยังไฟล์ export และหน้าพิมพ์เสมอ — เห็นอย่างไรได้ไฟล์อย่างนั้น

> ถ้าจำเป็นต้องได้ PDF จากฝั่ง server จริง ๆ (เช่นส่งอีเมลอัตโนมัติ) ให้เพิ่ม `@react-pdf/renderer` แล้ว `Font.register` ฟอนต์ Sarabun/IBM Plex Sans Thai เป็นไฟล์ `.ttf` ใน `public/fonts` — โครงสร้าง `listAllRefuels()` ใช้ซ้ำได้เลย

## หมายเหตุการออกแบบ

- ตัวเลขทั้งหมดในตารางและการ์ดสรุปใช้ฟอนต์ monospace แบบ tabular figures (คลาส `.tabular`) เพื่อให้หลักตรงกันทุกแถว อ่านเทียบกันได้เร็ว
- ราคาและจำนวนเงินเก็บเป็น `Decimal` ใน PostgreSQL ไม่ใช้ float เพื่อไม่ให้ยอดเงินเพี้ยน
- สรุปยอดคำนวณจาก **ทุกรายการในช่วงที่กรอง** ไม่ใช่เฉพาะหน้าปัจจุบัน
- `@media print` ซ่อนทุกอย่างที่มีคลาส `no-print` และบังคับให้ `<thead>` ซ้ำทุกหน้ากระดาษ
