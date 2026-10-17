import Link from "next/link";
import { Car, Fuel, LogOut, Wrench } from "lucide-react";
import { getUserEmail } from "@/lib/auth";

export async function AppHeader() {
  const email = await getUserEmail();

  return (
    <header className="no-print hero-gradient relative overflow-hidden">
      {/* ลวดลายวงกลมตกแต่ง */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-10 size-56 rounded-full bg-yellow-200/40 blur-2xl" />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-16 pt-5 sm:pb-20 sm:pt-7">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur sm:size-12">
            <Car className="size-5 sm:size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-2xl">Car_management_System</h1>
            <p className="truncate text-xs text-(--hero-ink)/80 sm:text-sm">ระบบการจัดการรถยนต์</p>
          </div>
        </div>

        {/* สลับโมดูล เติมน้ำมัน / ซ่อมบำรุง */}
        <nav aria-label="โมดูล" className="flex shrink-0 gap-1 text-xs font-medium">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/25 hover:bg-white/25">
            <Fuel className="size-3.5" />
            <span className="hidden sm:inline">เติมน้ำมัน</span>
          </Link>
          <Link href="/services" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/25 hover:bg-white/25">
            <Wrench className="size-3.5" />
            <span className="hidden sm:inline">ซ่อมบำรุง</span>
          </Link>
        </nav>

        {email && (
          <form action="/auth/signout" method="post" className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-48 truncate text-xs text-(--hero-ink)/85 md:inline">{email}</span>
            <button
              type="submit"
              title="ออกจากระบบ"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
