import type { Trip, TripPreferences, Day, Item, ItemType } from "@chatr/core";

const uid = () => Math.random().toString(36).slice(2, 10);
const TYPES: ItemType[] = ["activity", "meal", "transit", "lodging", "custom"];

// Parse a model's JSON itinerary into a validated Trip. Throws on malformed output
// so the caller can fall back to the deterministic generator (PRD §6.9 guardrails).
export function parseItinerary(text: string, prefs: TripPreferences): Trip {
  const json = JSON.parse(extractJson(text));
  if (!json || !Array.isArray(json.days) || json.days.length === 0) throw new Error("no days");

  const days: Day[] = json.days.map((d: any, di: number): Day => ({
    id: uid(), order: di + 1,
    items: (Array.isArray(d.items) ? d.items : []).map((it: any): Item => ({
      id: uid(),
      type: TYPES.includes(it.type) ? it.type : "activity",
      title: String(it.title ?? "Untitled"),
      time: it.time ? String(it.time) : undefined,
      categoryTags: Array.isArray(it.categoryTags) ? it.categoryTags.map(String) : [],
      costBand: prefs.budget,
    })),
  }));

  const now = new Date().toISOString();
  return { id: uid(), preferences: prefs, days, createdAt: now, updatedAt: now };
}

// Models sometimes wrap JSON in prose/code fences; pull out the JSON object.
function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json object");
  return text.slice(start, end + 1);
}
