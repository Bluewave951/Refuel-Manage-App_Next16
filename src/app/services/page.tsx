import { AppHeader } from "@/components/app-header";
import { ServiceDashboard } from "@/components/service-dashboard";

export default function ServicesPage() {
  return (
    <div className="min-h-dvh">
      <AppHeader />
      {/* เว้นด้านล่างให้แถบเมนูบนมือถือ */}
      <main className="relative mx-auto -mt-12 max-w-6xl px-3 pb-28 sm:-mt-14 sm:px-4 md:pb-10">
        <ServiceDashboard />
      </main>
    </div>
  );
}
