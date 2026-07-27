import { AppHeader } from "@/components/app-header";
import { RefuelDashboard } from "@/components/refuel-dashboard";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <RefuelDashboard />
      </main>
      <footer className="no-print mx-auto max-w-7xl px-4 pb-10 pt-2 text-center text-xs text-muted-foreground">
        autodev@2026
      </footer>
    </div>
  );
}
