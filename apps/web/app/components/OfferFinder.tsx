"use client";
import { useState } from "react";
import { tokens } from "@trip-itinerary/ui";
import type { TripPreferences } from "@trip-itinerary/core";
import type { OfferFinderResult } from "@trip-itinerary/api-client";
import { api } from "../../lib/api";
import { describeApiError } from "../../lib/apiError";
import { OnboardingForm } from "./OnboardingForm";

/**
 * The AI offer finder — the product's primary flow. The traveller describes their
 * trip, AI works out what they'll need to arrange, and we surface partner offers
 * against each need.
 *
 * Every offer shown is a paid partner placement, so each card is labelled
 * "Sponsored" and the results carry a standing disclosure. Users should always be
 * able to tell recommendation from advertising.
 */
export function OfferFinder({ onPlanTrip }: { onPlanTrip?: (p: TripPreferences) => void }) {
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

      <OnboardingForm onGenerate={find} loading={loading} submitLabel="Find offers" loadingLabel="Finding offers…" />

      {error && <p style={{ color: tokens.color.danger, marginTop: tokens.space.md }}>{error}</p>}

      {result && (
        <section style={{ marginTop: tokens.space.lg }}>
          {result.summary && (
            <p style={{ fontSize: tokens.font.body, color: tokens.color.ink, marginBottom: tokens.space.sm }}>
              {result.summary}
            </p>
          )}

          {/* Standing disclosure — these are paid placements, not neutral rankings. */}
          <p style={{ fontSize: 12, color: tokens.color.mid, background: tokens.color.surface,
            border: `1px solid ${tokens.color.borderSoft}`, borderRadius: tokens.radius.sm, padding: "8px 10px" }}>
            All listings are from paid partners and we may earn a commission if you book.
            {result.aiUsed
              ? " Suggestions are AI-generated from the trip details you entered — check details with the provider before booking."
              : " Suggestions are based on your trip details — check details with the provider before booking."}
          </p>

          {result.groups.length === 0 && (
            <p style={{ color: tokens.color.mid }}>
              No partner offers match this trip yet. Try different preferences, or browse the full directory.
            </p>
          )}

          {result.groups.map(({ need, offers }) => (
            <div key={need.id} style={{ marginTop: tokens.space.lg }}>
              <h2 style={{ fontSize: tokens.font.h2, color: tokens.color.navy, marginBottom: 2 }}>{need.label}</h2>
              <p style={{ color: tokens.color.mid, fontSize: 14, marginTop: 0, marginBottom: tokens.space.sm }}>
                {need.rationale}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: tokens.space.md }}>
                {offers.map((o) => (
                  <article key={o.id} style={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md,
                    padding: tokens.space.md, display: "flex", flexDirection: "column", background: "#fff" }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: tokens.color.mid }}>
                      Sponsored{o.subtitle ? ` · ${o.subtitle}` : ""}
                    </div>
                    <div style={{ fontWeight: 700, color: tokens.color.navy, marginTop: 4 }}>{o.title}</div>
                    {o.body && <div style={{ color: tokens.color.mid, fontSize: 14, marginTop: 4, flex: 1 }}>{o.body}</div>}
                    <a href={api.directoryClickUrl(o.id)} target="_blank" rel="noopener noreferrer sponsored"
                      style={{ alignSelf: "flex-start", marginTop: tokens.space.md, background: tokens.color.accent,
                        color: tokens.color.ink, padding: "8px 16px", borderRadius: tokens.radius.sm,
                        textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                      {o.ctaLabel} →
                    </a>
                  </article>
                ))}
              </div>
            </div>
          ))}

          {onPlanTrip && prefs && (
            <div style={{ marginTop: tokens.space.xl, paddingTop: tokens.space.md, borderTop: `1px solid ${tokens.color.border}` }}>
              <p style={{ color: tokens.color.mid, marginBottom: tokens.space.sm }}>
                Want a day-by-day plan for this trip as well?
              </p>
              <button onClick={() => onPlanTrip(prefs)}
                style={{ background: tokens.color.navy, color: "#fff", border: "none", padding: "10px 18px",
                  borderRadius: tokens.radius.sm, fontWeight: 600, cursor: "pointer", fontSize: 15 }}>
                Build an itinerary →
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
