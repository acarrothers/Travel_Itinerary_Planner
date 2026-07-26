import Link from "next/link";
import { tokens } from "@trip-itinerary/ui";
import { pageContainer } from "../lib/layout";

export default function Home() {
  return (
    <main style={{ ...pageContainer, paddingTop: "12vh" }}>
      <div style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em",
        textTransform: "uppercase", color: tokens.color.primary, marginBottom: tokens.space.sm }}>
        AI Travel Offer Finder
      </div>
      <h1 style={{ color: tokens.color.primaryDark, fontSize: tokens.font.display, fontWeight: 800,
        lineHeight: 1.1, letterSpacing: "-0.02em", margin: 0 }}>
        Find the right travel deals,<br /><span style={{ color: tokens.color.primary }}>powered by AI.</span>
      </h1>
      <p style={{ color: tokens.color.muted, fontSize: tokens.font.body, maxWidth: 560, marginTop: tokens.space.md }}>
        Tell us where you're headed and we'll surface the partner offers that fit your trip — plus a
        day-by-day itinerary when you want one.
      </p>
      <Link href="/login"
        style={{ display: "inline-block", marginTop: tokens.space.lg, background: tokens.color.accent,
          color: tokens.color.primaryDark, padding: "14px 24px", borderRadius: tokens.radius.lg,
          textDecoration: "none", fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.body }}>
        Log in to get started →
      </Link>
    </main>
  );
}
