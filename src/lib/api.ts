import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError } from "./auth";
import { RateLimitError } from "./rate-limit";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(error: string, details?: Record<string, string[]>) {
  return NextResponse.json({ error, details }, { status: 400 });
}

export function notFound(error = "ไม่พบข้อมูลที่ต้องการ") {
  return NextResponse.json({ error }, { status: 404 });
}

export function serverError(error = "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์") {
  return NextResponse.json({ error }, { status: 500 });
}

/** แปลง error ที่ไม่รู้จักให้เป็น response ที่อ่านรู้เรื่อง */
export function handleError(e: unknown) {
  if (e instanceof UnauthorizedError) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
  if (e instanceof RateLimitError) {
    return NextResponse.json(
      { error: e.message },
      { status: 429, headers: { "Retry-After": String(e.retryAfterSec) } }
    );
  }
  if (e instanceof ZodError) {
    return badRequest("ข้อมูลที่ส่งมาไม่ถูกต้อง", e.flatten().fieldErrors as Record<string, string[]>);
  }
  console.error(e);
  return serverError();
}
