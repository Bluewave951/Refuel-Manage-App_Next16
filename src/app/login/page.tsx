import { Fuel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "เข้าสู่ระบบ — Refuel Manage App" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <span className="mb-2 grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Fuel className="size-5" />
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
