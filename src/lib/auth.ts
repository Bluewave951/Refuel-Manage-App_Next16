import { createClient } from "./supabase/server";

export class UnauthorizedError extends Error {
  constructor() {
    super("กรุณาเข้าสู่ระบบ");
  }
}

/** คืน id ของผู้ใช้ที่ล็อกอินอยู่ หรือ throw UnauthorizedError */
export async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  return user.id;
}

/** อีเมลของผู้ใช้ที่ล็อกอินอยู่ (ใช้แสดงผล) */
export async function getUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}
