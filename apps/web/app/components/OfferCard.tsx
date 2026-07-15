import { tokens } from "@chatr/ui";
import type { Offer } from "@chatr/core";

export function OfferCard({ offer, clickUrl }: { offer: Offer; clickUrl: string }) {
  return (
    <aside style={{ marginTop: tokens.space.lg, border: `1px solid ${tokens.color.blue}`,
      background: tokens.color.light, borderRadius: tokens.radius.md, padding: tokens.space.md }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: tokens.color.mid }}>
        Sponsored · {offer.subtitle}
      </div>
      <div style={{ fontWeight: 700, color: tokens.color.navy, marginTop: 4 }}>{offer.title}</div>
      {offer.body && <div style={{ color: tokens.color.mid, fontSize: 14, marginTop: 4 }}>{offer.body}</div>}
      <a href={clickUrl} target="_blank" rel="noopener noreferrer"
        style={{ display: "inline-block", marginTop: 10, background: tokens.color.blue, color: "#fff",
          padding: "8px 16px", borderRadius: tokens.radius.sm, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
        {offer.ctaLabel} →
      </a>
    </aside>
  );
}
