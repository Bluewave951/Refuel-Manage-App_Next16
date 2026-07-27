"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api-client";
import type { RefuelListResponse, StationDto } from "@/types/refuel";

export function useRefuels(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "" && v !== "any") params.set(k, String(v));
  }
  const qs = params.toString();

  const { data, error, isLoading, mutate } = useSWR<RefuelListResponse>(
    `/api/refuels?${qs}`,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  return { data, error, isLoading, mutate, queryString: qs };
}

export function useStations() {
  const { data, isLoading } = useSWR<StationDto[]>("/api/stations", fetcher, {
    revalidateOnFocus: false,
  });
  return { stations: data ?? [], isLoading };
}
