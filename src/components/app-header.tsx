import { Fuel, LogOut } from "lucide-react";
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
            <Fuel className="size-5 sm:size-6" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-2xl">Refuel Manage App</h1>
            <p className="truncate text-xs text-(--hero-ink)/80 sm:text-sm">บันทึกค่าใช้จ่ายในการเติมน้ำมัน</p>
          </div>
        </div>

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
