"use client";
import { useState } from "react";
import { tokens } from "@trip-itinerary/ui";
import type { TripPreferences } from "@trip-itinerary/core";
import type { OfferFinderResult } from "@trip-itinerary/api-client";
import { api } from "../../lib/api";
import { describeApiError } from "../../lib/apiError";
import { OnboardingForm, type OnboardingInitial } from "./OnboardingForm";
import { OfferResults } from "./OfferResults";

/**
 * The AI offer finder — the product's primary flow. The traveller describes their
 * trip, AI works out what they'll need to arrange, and we surface partner offers
 * against each need.
 *
 * Every offer shown is a paid partner placement, so each card is labelled
 * "Sponsored" and the results carry a standing disclosure. Users should always be
 * able to tell recommendation from advertising.
 */
export function OfferFinder({ onPlanTrip, initial }: { onPlanTrip?: (p: TripPreferences) => void; initial?: OnboardingInitial }) {
  const [result, setResult] = useState<OfferFinderResult | null>(null);
  const [prefs, setPrefs] = useState<TripPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function find(p: TripPreferences) {
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await api.findOffers(p));
      setPrefs(p);
    } catch (e: any) {
      setError(describeApiError(e));
    } finally { setLoading(false); }
  }

  return (
    <div>
      <p style={{ color: tokens.color.mid, marginTop: 0 }}>
        Tell us about your trip and we'll work out what you need to sort out — then find partner deals for each.
      </p>

      <OnboardingForm onGenerate={find} loading={loading} submitLabel="Find offers" loadingLabel="Finding offers…" initial={initial} />

      {error && <p style={{ color: tokens.color.danger, marginTop: tokens.space.md }}>{error}</p>}

      {result && (
        <>
          <OfferResults result={result} />
          {onPlanTrip && prefs && (
            <div style={{ marginTop: tokens.space.xl, paddingTop: tokens.space.md, borderTop: `1px solid ${tokens.color.border}` }}>
              <p style={{ color: tokens.color.muted, marginBottom: tokens.space.sm }}>
                Want a day-by-day plan for this trip as well?
              </p>
              <button onClick={() => onPlanTrip(prefs)}
                style={{ background: tokens.color.navy, color: "#fff", border: "none", padding: "10px 18px",
                  borderRadius: tokens.radius.sm, fontWeight: 600, cursor: "pointer", fontSize: 15 }}>
                Build an itinerary →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
