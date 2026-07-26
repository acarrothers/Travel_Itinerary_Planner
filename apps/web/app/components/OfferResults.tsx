"use client";
import { tokens } from "@trip-itinerary/ui";
import { isLocalizedOffer } from "@trip-itinerary/core";
import type { OfferFinderResult } from "@trip-itinerary/api-client";
import { api } from "../../lib/api";
import { PartnerOfferCard } from "./PartnerOfferCard";

// Renders the finder's grouped, needs-based partner offers plus the standing
// sponsored disclosure. Shared by the /plan finder tab and the public landing
// page so results look identical in both places.
export function OfferResults({ result }: { result: OfferFinderResult }) {
  return (
    <section style={{ marginTop: tokens.space.lg }}>
      {result.summary && (
        <p style={{ fontSize: tokens.font.body, color: tokens.color.ink, marginBottom: tokens.space.sm }}>
          {result.summary}
        </p>
      )}

      {/* Standing disclosure — these are paid placements, not neutral rankings. */}
      <p style={{ fontSize: 12, color: tokens.color.muted, background: tokens.color.surface,
        border: `1px solid ${tokens.color.borderSoft}`, borderRadius: tokens.radius.sm, padding: "8px 10px" }}>
        All listings are from paid partners and we may earn a commission if you book.
        {result.aiUsed
          ? " Suggestions are AI-generated from the trip details you entered — check details with the provider before booking."
          : " Suggestions are based on your trip details — check details with the provider before booking."}
      </p>

      {result.groups.length === 0 && (
        <p style={{ color: tokens.color.muted }}>
          No partner offers match this trip yet. Try different preferences, or browse the full directory.
        </p>
      )}

      {result.groups.map(({ need, offers }) => (
        <div key={need.id} style={{ marginTop: tokens.space.lg }}>
          <h2 style={{ fontSize: tokens.font.h2, color: tokens.color.primaryDark, marginBottom: 2 }}>{need.label}</h2>
          <p style={{ color: tokens.color.muted, fontSize: 14, marginTop: 0, marginBottom: tokens.space.sm }}>
            {need.rationale}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: tokens.space.md }}>
            {offers.map((o) => (
              <PartnerOfferCard key={o.id} title={o.title} subtitle={o.subtitle} body={o.body}
                ctaLabel={o.ctaLabel} href={api.directoryClickUrl(o.id)} localized={isLocalizedOffer(o)} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
