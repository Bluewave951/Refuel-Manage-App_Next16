import type { RefuelDto, RefuelListResponse, StationDto } from "@/types/refuel";
import type { RefuelInput } from "./validations";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ");
  }
  return res.json() as Promise<T>;
}

export const fetcher = <T>(url: string) => request<T>(url);

export const api = {
  listRefuels: (qs: string) => request<RefuelListResponse>(`/api/refuels?${qs}`),
  listStations: () => request<StationDto[]>("/api/stations"),
  createRefuel: (data: RefuelInput) =>
    request<RefuelDto>("/api/refuels", { method: "POST", body: JSON.stringify(data) }),
  updateRefuel: (id: string, data: Partial<RefuelInput>) =>
    request<RefuelDto>(`/api/refuels/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRefuel: (id: string) => request<{ id: string }>(`/api/refuels/${id}`, { method: "DELETE" }),
};
