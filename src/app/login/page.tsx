import { Fuel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "เข้าสู่ระบบ — Refuel Manage App" };

export default function LoginPage() {
  return (
    <div className="hero-gradient relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-10 size-80 rounded-full bg-yellow-200/40 blur-3xl" />
      <Card className="relative w-full max-w-sm rounded-2xl shadow-2xl">
        <CardHeader className="items-center text-center">
          <span className="hero-gradient mb-2 grid size-12 place-items-center rounded-xl shadow-lg">
            <Fuel className="size-6" />
          </span>
          <CardTitle>Refuel Manage App</CardTitle>
          <p className="text-sm text-muted-foreground">เข้าสู่ระบบเพื่อบันทึกค่าใช้จ่ายน้ำมัน</p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
