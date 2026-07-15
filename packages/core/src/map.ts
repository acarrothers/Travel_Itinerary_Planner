import type { Trip } from "./types";

export interface MapPoint {
  id: string;
  title: string;
  lat: number;
  lng: number;
  day: number;
}

// Flatten a trip into plottable points (items that have coordinates). Shared by the
// web (Mapbox GL) and mobile map views so they stay in sync (PRD 6.5).
export function tripMapPoints(trip: Trip): MapPoint[] {
  const pts: MapPoint[] = [];
  for (const day of trip.days) {
    for (const item of day.items) {
      if (item.coords) {
        pts.push({ id: item.id, title: item.title, lat: item.coords.lat, lng: item.coords.lng, day: day.order });
      }
    }
  }
  return pts;
}
