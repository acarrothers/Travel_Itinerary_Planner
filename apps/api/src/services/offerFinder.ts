import {
  inferNeeds, matchOffersToNeeds, reconcileNeeds, signalsFromPreferences,
  type NeedGroup, type Offer, type TravelNeed, type TripPreferences,
} from "@trip-itinerary/core";
import { getRouter } from "../aiSetup.js";

export interface OfferFinderResult {
  groups: NeedGroup[];
  aiUsed: boolean;      // false when we fell back to deterministic inference
  summary?: string;     // optional one-line framing of the trip
}

const MAX_RATIONALE = 200;

/**
 * The AI offer finder. Two stages:
 *   1. Infer which travel needs this trip implies (AI ranks; deterministic rules
 *      define the universe of possible needs).
 *   2. Map those needs onto live catalog offers via existing CMS targeting.
 *
 * The model can reprioritise needs and reword rationales, but it cannot invent a
 * need or an offer — `reconcileNeeds` drops anything not in the deterministic set,
 * and offers only ever come from the catalog. That keeps recommendations grounded
 * in inventory that actually exists.
 *
 * Never throws: any AI failure degrades to the deterministic path.
 */
export async function findOffersForTrip(
  prefs: TripPreferences,
  offers: Offer[],
): Promise<OfferFinderResult> {
  const fallback = inferNeeds(prefs);
  const signals = signalsFromPreferences(prefs);

  let needs = fallback;
  let aiUsed = false;
  let summary: string | undefined;

  try {
    const ai = await rankNeedsWithAi(prefs, fallback);
    if (ai) {
      needs = applyRationales(reconcileNeeds(ai.needIds, fallback), ai.rationales);
      summary = ai.summary;
      aiUsed = true;
    }
  } catch {
    // Fall through to deterministic needs — the finder must always return something.
  }

  return { groups: matchOffersToNeeds(needs, offers, signals), aiUsed, summary };
}

interface AiRanking {
  needIds: string[];
  rationales: Record<string, string>;
  summary?: string;
}

async function rankNeedsWithAi(prefs: TripPreferences, candidates: TravelNeed[]): Promise<AiRanking | null> {
  const router = getRouter();
  const menu = candidates.map((n) => `- ${n.id}: ${n.label}`).join("\n");
  const trip = [
    `Destination(s): ${prefs.destinations.join(", ")}`,
    `Nights: ${prefs.nights}`,
    `Party: ${prefs.party} (${prefs.adults} adults, ${prefs.children} children)`,
    `Budget: ${prefs.budget}`,
    `Interests: ${prefs.interests.join(", ") || "none given"}`,
    `Pace: ${prefs.pace}`,
    prefs.startDate ? `Dates: ${prefs.startDate} to ${prefs.endDate ?? "?"}` : `Month: ${prefs.flexibleMonth ?? "flexible"}`,
  ].join("\n");

  const prompt = [
    "You help travellers work out what they need to arrange for an upcoming trip.",
    "",
    "TRIP:", trip,
    "",
    "CANDIDATE NEEDS (you may ONLY use these ids):", menu,
    "",
    "Return ONLY a JSON object of this shape:",
    '{"summary":"one short sentence about the trip",',
    ' "needs":[{"id":"<candidate id>","why":"<max 20 words, specific to this trip>"}]}',
    "",
    "Rules:",
    "- Order needs by how important they are for THIS trip, most important first.",
    "- Omit any candidate that genuinely does not apply.",
    "- Never invent an id that is not in the candidate list.",
    "- 'why' must be factual about the trip. Do not mention brands, prices or discounts.",
  ].join("\n");

  const res = await router.run({ task: "offer_copy", prompt, maxTokens: 600 });
  const json = JSON.parse(extractJson(res.text));
  if (!json || !Array.isArray(json.needs)) return null;

  const needIds: string[] = [];
  const rationales: Record<string, string> = {};
  for (const n of json.needs) {
    const id = typeof n?.id === "string" ? n.id : null;
    if (!id) continue;
    needIds.push(id);
    if (typeof n.why === "string" && n.why.trim()) {
      rationales[id] = n.why.trim().slice(0, MAX_RATIONALE);
    }
  }
  if (needIds.length === 0) return null;

  return {
    needIds,
    rationales,
    summary: typeof json.summary === "string" ? json.summary.slice(0, MAX_RATIONALE) : undefined,
  };
}

/** Swap in AI-written rationales, keeping the deterministic text where absent. */
function applyRationales(needs: TravelNeed[], rationales: Record<string, string>): TravelNeed[] {
  return needs.map((n) => (rationales[n.id] ? { ...n, rationale: rationales[n.id] } : n));
}

// Models sometimes wrap JSON in prose or code fences; pull out the object.
function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json object");
  return text.slice(start, end + 1);
}
