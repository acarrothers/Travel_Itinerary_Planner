import type { Trip } from "./types";

export interface ReorderInput { fromDay: number; fromIndex: number; toDay: number; toIndex: number; }

// Move an item within or across days. Pure: returns a new Trip; no-ops on bad input
// so the UI can call it optimistically (PRD §6.3 editing).
export function reorderItem(trip: Trip, mv: ReorderInput): Trip {
  const days = trip.days.map((d) => ({ ...d, items: [...d.items] }));
  const from = days.find((d) => d.order === mv.fromDay);
  const to = days.find((d) => d.order === mv.toDay);
  if (!from || !to) return trip;
  if (mv.fromIndex < 0 || mv.fromIndex >= from.items.length) return trip;
  const [item] = from.items.splice(mv.fromIndex, 1);
  const idx = Math.max(0, Math.min(mv.toIndex, to.items.length));
  to.items.splice(idx, 0, item);
  return { ...trip, days, updatedAt: new Date().toISOString() };
}
