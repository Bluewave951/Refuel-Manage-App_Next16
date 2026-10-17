import { createClient } from "./supabase/server";

export const RECEIPT_BUCKET = "receipts";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** อัปโหลดภาพไปไว้ใต้โฟลเดอร์ของผู้ใช้ คืน path ใน bucket */
export async function uploadReceipt(userId: string, file: File): Promise<string> {
  const supabase = await createClient();
  const path = `${userId}/${crypto.randomUUID()}.${EXT[file.type] ?? "jpg"}`;
  const { error } = await supabase.storage.from(RECEIPT_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`อัปโหลดภาพไม่สำเร็จ: ${error.message}`);
  return path;
}

/** ลิงก์ชั่วคราว (10 นาที) สำหรับเปิดดูภาพ */
export async function signedReceiptUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage.from(RECEIPT_BUCKET).createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

export async function removeReceipt(path: string) {
  const supabase = await createClient();
  await supabase.storage.from(RECEIPT_BUCKET).remove([path]);
}

/** path ต้องอยู่ในโฟลเดอร์ของผู้ใช้เท่านั้น */
export function ownsReceiptPath(userId: string, path: string) {
  return path.startsWith(`${userId}/`) && !path.includes("..");
}
