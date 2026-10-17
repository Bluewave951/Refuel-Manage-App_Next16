"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { ServiceListResponse } from "@/types/service";

export function useServices(query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") params.set(k, v);
  }

  const { data, error, isLoading, mutate } = useSWR<ServiceListResponse>(
    `/api/services?${params.toString()}`,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  return { data, error, isLoading, mutate };
}
