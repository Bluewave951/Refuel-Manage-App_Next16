import { AppHeader } from "@/components/app-header";
import { RefuelDashboard } from "@/components/refuel-dashboard";

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      {/* ดึงเนื้อหาขึ้นไปทับ header ให้ดูมีมิติ; เว้นด้านล่างให้แถบเมนูบนมือถือ */}
      <main className="relative mx-auto -mt-12 max-w-6xl px-3 pb-28 sm:-mt-14 sm:px-4 md:pb-10">
        <RefuelDashboard />
      </main>
      <footer className="no-print mx-auto hidden max-w-6xl px-4 pb-8 text-center text-xs text-muted-foreground md:block">
        autodev@2026
      </footer>
    </div>
  );
}
