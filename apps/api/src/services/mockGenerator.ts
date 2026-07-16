import type { Trip, TripPreferences, Item, Day, Poi } from "@trip-itinerary/core";

// Deterministic placeholder generator. Pure (depends only on @trip-itinerary/core). When
// grounded POIs are supplied it builds items from real places; otherwise it falls
// back to generic placeholders. Replaced by real AI generation (PRD §6.2).
const MORNING: Record<string, string> = {
  culture: "Old town walking tour", history: "Historic landmarks visit",
  nature: "Botanical gardens stroll", adventure: "Sunrise viewpoint hike",
  food: "Local market food crawl", nightlife: "Late brunch & cafe", relaxation: "Spa morning",
};
const AFTERNOON: Record<string, string> = {
  culture: "Flagship museum", history: "Castle / heritage site",
  nature: "Coastal / park walk", adventure: "Kayak or bike excursion",
  food: "Cooking class", nightlife: "Rooftop bar preview", relaxation: "Slow afternoon by the water",
};

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
const uid = () => Math.random().toString(36).slice(2, 10);

function poiItem(poi: Poi, time: string, fallbackTag: string, budget: TripPreferences["budget"]): Item {
  return {
    id: uid(), type: "activity", title: poi.name, time,
    location: poi.address, coords: poi.coords,
    categoryTags: poi.tags.length ? poi.tags : [fallbackTag], costBand: budget,
  };
}

export function buildTrip(prefs: TripPreferences, pois: Poi[] = []): Trip {
  const dest = prefs.destinations[0] ?? "your destination";
  const interests = prefs.interests.length ? prefs.interests : ["culture", "food"];
  const days: Day[] = [];
  let pi = 0;

  for (let d = 0; d < Math.max(1, prefs.nights); d++) {
    const meals: Item[] = [
      { id: uid(), type: "meal", title: "Lunch — local favorite", time: "13:00", categoryTags: ["food"], costBand: prefs.budget },
      { id: uid(), type: "meal", title: "Dinner — recommended spot", time: "19:30", categoryTags: ["food"], costBand: prefs.budget },
    ];
    let morning: Item, afternoon: Item;
    if (pois.length) {
      morning = poiItem(pois[pi++ % pois.length], "09:30", pick(interests, d), prefs.budget);
      afternoon = poiItem(pois[pi++ % pois.length], "15:30", pick(interests, d + 1), prefs.budget);
    } else {
      const a = pick(interests, d), b = pick(interests, d + 1);
      morning = { id: uid(), type: "activity", title: `${MORNING[a] ?? "Morning activity"} in ${dest}`, time: "09:30", categoryTags: [a], costBand: prefs.budget };
      afternoon = { id: uid(), type: "activity", title: AFTERNOON[b] ?? "Afternoon activity", time: "15:30", categoryTags: [b], costBand: prefs.budget };
    }
    days.push({ id: uid(), order: d + 1, items: [morning, meals[0], afternoon, meals[1]] });
  }

  const now = new Date().toISOString();
  return { id: uid(), preferences: prefs, days, createdAt: now, updatedAt: now };
}
