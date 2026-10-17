import type { RefuelDto, RefuelListResponse, StationDto } from "@/types/refuel";
import type { ReceiptUploadResponse, ServiceRecordDto } from "@/types/service";
import type { RefuelInput, ServiceInput } from "./validations";

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
  createService: (data: ServiceInput) =>
    request<ServiceRecordDto>("/api/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: string, data: ServiceInput) =>
    request<ServiceRecordDto>(`/api/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id: string) => request<{ id: string }>(`/api/services/${id}`, { method: "DELETE" }),
  /** multipart: ห้ามตั้ง Content-Type เอง ให้ browser ใส่ boundary ให้ */
  uploadReceipt: async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/services/upload", { method: "POST", body });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "อัปโหลดภาพไม่สำเร็จ");
    }
    return res.json() as Promise<ReceiptUploadResponse>;
  },
};
