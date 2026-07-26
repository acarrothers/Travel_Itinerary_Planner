import { tokens } from "@trip-itinerary/ui";
import type { Offer } from "@trip-itinerary/core";

// Itinerary-matched offer, using the Vibrant Voyager partner-card treatment
// (cream background, yellow border + badge, yellow CTA) so sponsored placements
// look identical wherever they appear.
export function OfferCard({ offer, clickUrl }: { offer: Offer; clickUrl: string }) {
  return (
    <aside style={{ position: "relative", marginTop: tokens.space.lg,
      border: `2px solid ${tokens.color.accent}`, background: tokens.color.partnerBg,
      borderRadius: tokens.radius.md, padding: tokens.space.md }}>
      <span style={{ position: "absolute", top: 10, right: 10,
        fontFamily: tokens.font.mono, fontSize: tokens.font.caps, fontWeight: 600,
        letterSpacing: "0.05em", textTransform: "uppercase",
        color: tokens.color.primaryDark, background: tokens.color.accent,
        borderRadius: tokens.radius.full, padding: "2px 8px" }}>Partner</span>
      <div style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, textTransform: "uppercase",
        letterSpacing: "0.05em", color: tokens.color.muted, paddingRight: 72 }}>
        Sponsored · {offer.subtitle}
      </div>
      <div style={{ fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.h3,
        color: tokens.color.primaryDark, marginTop: 6 }}>{offer.title}</div>
      {offer.body && <div style={{ color: tokens.color.muted, fontSize: tokens.font.small, marginTop: 4 }}>{offer.body}</div>}
      <a href={clickUrl} target="_blank" rel="noopener noreferrer sponsored"
        style={{ display: "inline-block", marginTop: 10, background: tokens.color.accent, color: tokens.color.primaryDark,
          fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.body,
          padding: "8px 18px", borderRadius: tokens.radius.lg, textDecoration: "none" }}>
        {offer.ctaLabel} →
      </a>
    </aside>
  );
}
