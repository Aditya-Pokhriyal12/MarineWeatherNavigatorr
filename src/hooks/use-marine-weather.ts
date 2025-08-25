import { useQuery } from "@tanstack/react-query";
import { marineWeatherAPI } from "@/api/marine-weather";
import type { Coordinates } from "@/api/types";

export function useMarineWeatherQuery(coordinates: Coordinates | null) {
  return useQuery({
    queryKey: ["marine-weather", coordinates],
    queryFn: () => 
      coordinates ? marineWeatherAPI.getMarineWeather(coordinates) : null,
    enabled: !!coordinates,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
}


export function useMaritimeAlertsQuery(coordinates: Coordinates | null) {
  return useQuery({
    queryKey: ["maritime-alerts", coordinates],
    queryFn: () =>
      coordinates ? marineWeatherAPI.getMaritimeAlerts(coordinates) : null,
    enabled: !!coordinates,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

export function useNearbyShipsQuery(coordinates: Coordinates | null) {
  return useQuery({
    queryKey: ["nearby-ships", coordinates],
    queryFn: () =>
      coordinates ? marineWeatherAPI.getNearbyShips(coordinates) : null,
    enabled: !!coordinates,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOptimalRoutesQuery(
  from: Coordinates | null,
  to: Coordinates | null,
  shipType: string = "cargo"
) {
  return useQuery({
    queryKey: ["optimal-routes", from, to, shipType],
    queryFn: () =>
      from && to ? marineWeatherAPI.getOptimalRoutes(from, to, shipType) : null,
    enabled: !!(from && to),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
