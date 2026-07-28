import type { Trip, Offer, TripPreferences } from "./types";
import { isLocalizedOffer } from "./offers";

// How partner offers are distributed across itinerary days. Pure + deterministic:
// same inputs -> same layout. Two gates decide what a day shows:
//   1. relevance — offers passed in are already targeting-matched to the trip;
//   2. cadence — each category has a placement phase, a per-trip cap, and an
//      eligibility rule; a per-day cap keeps days from piling up. Days with no
//      eligible offer stay empty by design.

export type OfferClass =
  | "experiences" | "accommodation" | "insurance" | "connectivity"
  | "transfer" | "getting_around" | "lounge" | "dining";

export interface CadenceOptions {
  maxPerDay?: number; // default 2
}

// Map a free-form offer category to a cadence class.
export function offerClass(category: string): OfferClass {
  const k = (category || "").toLowerCase();
  if (/insur/.test(k)) return "insurance";
  if (/esim|connect|\bsim\b/.test(k)) return "connectivity";
  if (/transfer|ride|taxi|pickup|shuttle/.test(k)) return "transfer";
  if (/car|rental|hire|rail|train|bus/.test(k)) return "getting_around";
  if (/lounge/.test(k)) return "lounge";
  if (/hotel|accommod|stay|lodg/.test(k)) return "accommodation";
  if (/dining|food|restaurant|culinar/.test(k)) return "dining";
  return "experiences";
}

// Whether a category is relevant to this trip at all (beyond the offer's own
// targeting) — e.g. eSIM only matters on trips of 3+ nights.
export function classEligible(cls: OfferClass, p: TripPreferences): boolean {
  const nights = Math.max(0, p.nights ?? 0);
  const travellers = (p.adults ?? 0) + (p.children ?? 0);
  switch (cls) {
    case "connectivity": return nights >= 3;
    case "getting_around": return nights >= 6;
    case "transfer": return nights >= 2;
    case "lounge": return p.budget === "mid" || p.budget === "luxury" || travellers >= 4;
    case "dining": return (p.interests ?? []).some((i) => /food|culinar/i.test(i));
    default: return nights >= 1; // experiences, accommodation, insurance
  }
}

// Localized first, then higher priority, then stable by id.
function rank(offers: Offer[]): Offer[] {
  return offers.slice().sort((a, b) =>
    Number(isLocalizedOffer(b)) - Number(isLocalizedOffer(a)) ||
    (b.priority ?? 0) - (a.priority ?? 0) ||
    a.id.localeCompare(b.id));
}

/**
 * Assign offers to itinerary days per the cadence rules. Returns a map of
 * day.order -> Offer[] (0, 1, or maxPerDay offers). Offers not placed are simply
 * omitted (a day with nothing eligible shows nothing).
 */
export function assignOffersToDays(trip: Trip, offers: Offer[], opts: CadenceOptions = {}): Map<number, Offer[]> {
  const cap = opts.maxPerDay ?? 2;
  const p = trip.preferences;
  const days = trip.days.map((d) => d.order).sort((a, b) => a - b);
  const result = new Map<number, Offer[]>(days.map((o) => [o, []]));
  if (days.length === 0) return result;

  const D = days.length;
  const arrival = days[0];
  const departure = days[D - 1];
  const early = days.slice(0, Math.min(2, D));
  const core = D > 2 ? days.slice(1, D - 1) : days; // middle days, else all

  const used = new Set<string>();
  const partnersByDay = new Map<number, Set<string>>(days.map((o) => [o, new Set<string>()]));
  const partnersOn = (order: number) => partnersByDay.get(order);

  const canPlace = (order: number, o: Offer): boolean => {
    const list = result.get(order);
    if (!list || list.length >= cap || used.has(o.id)) return false;
    // No same partner on the same or an adjacent day.
    for (const adj of [order - 1, order, order + 1]) {
      const s = partnersOn(adj);
      if (s && s.has(o.partnerId)) return false;
    }
    return true;
  };
  const place = (order: number, o: Offer) => {
    result.get(order)!.push(o);
    used.add(o.id);
    partnersOn(order)!.add(o.partnerId);
  };
  const tryDays = (candidates: number[], o: Offer): boolean => {
    for (const d of candidates) if (canPlace(d, o)) { place(d, o); return true; }
    return false;
  };

  // Group eligible offers by class, ranked.
  const byClass = new Map<OfferClass, Offer[]>();
  for (const o of rank(offers)) {
    const cls = offerClass(o.category);
    if (!classEligible(cls, p)) continue;
    const arr = byClass.get(cls) ?? [];
    arr.push(o);
    byClass.set(cls, arr);
  }
  const take = (cls: OfferClass, n: number) => (byClass.get(cls) ?? []).slice(0, n);
  const rev = days.slice().reverse();

  // --- Phase A: anchored categories ---
  const t = take("transfer", 2);
  if (t[0]) tryDays([arrival, ...early, ...days], t[0]);           // arrival transfer
  if (t[1]) tryDays([departure, ...rev], t[1]);                    // departure transfer
  for (const o of take("insurance", 1)) tryDays([arrival, ...early, ...days], o);
  for (const o of take("accommodation", 1)) tryDays([arrival, ...early, ...days], o);
  for (const o of take("connectivity", 1)) tryDays([arrival, ...early, ...days], o);
  for (const o of take("getting_around", 1)) tryDays([...early, ...days], o);
  const loungeMax = p.budget === "luxury" ? 2 : 1;
  for (const o of take("lounge", loungeMax)) tryDays([departure, arrival, ...rev], o);
  // Dining: spread roughly every 3rd day.
  const dining = byClass.get("dining") ?? [];
  for (const d of days) {
    if ((d - arrival) % 3 !== 0) continue;
    const cand = dining.find((o) => !used.has(o.id) && canPlace(d, o));
    if (cand) place(d, cand);
  }

  // --- Phase B: experiences fill core days (one each), then spill anywhere ---
  const exp = byClass.get("experiences") ?? [];
  for (const d of core) {
    const cand = exp.find((o) => !used.has(o.id) && canPlace(d, o));
    if (cand) place(d, cand);
  }
  for (const o of exp) if (!used.has(o.id)) tryDays([...days], o);

  return result;
}
