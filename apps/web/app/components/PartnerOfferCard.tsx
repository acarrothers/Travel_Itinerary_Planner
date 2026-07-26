"use client";
import { tokens } from "@trip-itinerary/ui";

/**
 * Vibrant Voyager partner-offer card. The design system gives paid placements a
 * deliberate, consistent treatment so they read as sponsored at a glance:
 * cream background, 2px yellow border, a caps "Partner" badge, and always the
 * yellow CTA. Used by the finder and the directory so every offer looks the same.
 */
export function PartnerOfferCard({
  title, subtitle, body, ctaLabel, href, localized = false, badge = "Partner",
}: {
  title: string;
  subtitle?: string;
  body?: string;
  ctaLabel: string;
  href: string;
  localized?: boolean;
  badge?: string;
}) {
  return (
    <article style={{
      position: "relative", display: "flex", flexDirection: "column",
      background: tokens.color.partnerBg,
      border: `2px solid ${tokens.color.accent}`,
      borderRadius: tokens.radius.md,
      padding: tokens.space.md,
    }}>
      {/* Caps "Partner" badge, top-right (VV partner card spec). */}
      <span style={{
        position: "absolute", top: 10, right: 10,
        fontFamily: tokens.font.mono, fontSize: tokens.font.caps, fontWeight: 600,
        letterSpacing: "0.05em", textTransform: "uppercase",
        color: tokens.color.primaryDark, background: tokens.color.accent,
        borderRadius: tokens.radius.full, padding: "2px 8px",
      }}>{badge}</span>

      {subtitle && (
        <div style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em",
          textTransform: "uppercase", color: tokens.color.muted, paddingRight: 72 }}>
          {subtitle}
        </div>
      )}

      {localized && (
        <div style={{ display: "inline-block", alignSelf: "flex-start", marginTop: 6, fontSize: 11, fontWeight: 700,
          color: tokens.color.teal, background: "#E4F1F2", border: `1px solid ${tokens.color.teal}`,
          borderRadius: tokens.radius.full, padding: "2px 8px" }}>
          ★ Local experience
        </div>
      )}

      <div style={{ fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.h3,
        color: tokens.color.primaryDark, marginTop: 6 }}>{title}</div>

      {body && <div style={{ color: tokens.color.muted, fontSize: tokens.font.small, marginTop: 4, flex: 1 }}>{body}</div>}

      <a href={href} target="_blank" rel="noopener noreferrer sponsored"
        style={{ alignSelf: "flex-start", marginTop: tokens.space.md,
          background: tokens.color.accent, color: tokens.color.primaryDark,
          fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.body,
          padding: "8px 18px", borderRadius: tokens.radius.lg, textDecoration: "none" }}>
        {ctaLabel} →
      </a>
    </article>
  );
}
