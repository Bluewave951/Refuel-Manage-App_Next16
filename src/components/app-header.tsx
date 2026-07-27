import { Fuel } from "lucide-react";

export function AppHeader() {
  return (
    <header className="no-print bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-1 px-4 py-8 text-center">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary-foreground/15">
            <Fuel className="size-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Refuel Manage App</h1>
        </div>
        <p className="text-sm text-primary-foreground/80">บันทึกค่าใช้จ่ายในการเติมน้ำมัน</p>
      </div>
    </header>
  );
}
