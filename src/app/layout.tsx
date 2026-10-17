import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plexThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-thai",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Car_management_System — ระบบการจัดการรถยนต์",
  description: "บันทึก สรุป และส่งออกรายงานค่าใช้จ่ายน้ำมันรถ พร้อมคำนวณอัตราสิ้นเปลืองอัตโนมัติ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${plexThai.variable} ${plexMono.variable} font-sans antialiased app-bg min-h-dvh`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
