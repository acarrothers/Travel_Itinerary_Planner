"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";
import type { TripPreferences, BudgetBand } from "@trip-itinerary/core";
import type { OfferFinderResult } from "@trip-itinerary/api-client";
import { api } from "../lib/api";
import { describeApiError } from "../lib/apiError";
import { OnboardingForm } from "./components/OnboardingForm";
import { useEffect } from "react";
import { OfferResults } from "./components/OfferResults";

// Rotating hero backdrops — famous international destinations (licensed Adobe
// Stock, free tier). One is picked at random each visit.
const HEROES = [
  { src: "/hero-alps.jpg", place: "Swiss Alps, Switzerland" },
  { src: "/hero-santorini.jpg", place: "Santorini, Greece" },
  { src: "/hero-paris.jpg", place: "Paris, France" },
  { src: "/hero-kyoto.jpg", place: "Kyoto, Japan" },
  { src: "/hero-venice.jpg", place: "Venice, Italy" },
  { src: "/hero-machupicchu.jpg", place: "Machu Picchu, Peru" },
];

// Public smart-search landing (Vibrant Voyager "global landing" design). Guests
// can find partner offers inline here without logging in; "Plan Trip Itinerary"
// carries the trip into the planner.
export default function Home() {
  const router = useRouter();
  const [result, setResult] = useState<OfferFinderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Randomize after mount so server and client render match (no hydration flash).
  const [hero, setHero] = useState(0);
  useEffect(() => { setHero(Math.floor(Math.random() * HEROES.length)); }, []);
  const heroImg = HEROES[hero];

  // "See Partner Offers" — run the finder right here, no login.
  async function findOffers(p: TripPreferences) {
    setLoading(true); setError(null); setResult(null);
    try { setResult(await api.findOffers(p)); }
    catch (e: any) { setError(describeApiError(e)); }
    finally { setLoading(false); }
  }

  // "Plan Trip Itinerary" — hand the trip to the planner (guests welcome there too).
  function planTrip(p: TripPreferences) {
    const style: Record<BudgetBand, string> = { budget: "budget", mid: "adventure", luxury: "luxury" };
    const q = new URLSearchParams({ intent: "planner", dest: p.destinations[0] ?? "", party: p.party, style: style[p.budget] });
    router.push(`/plan?${q.toString()}`);
  }

  return (
    <div style={{ fontFamily: tokens.font.family, color: tokens.color.ink }}>
      {/* Top nav */}
      <header style={{ borderBottom: `1px solid ${tokens.color.border}`, background: tokens.color.bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px clamp(16px, 4vw, 32px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: tokens.font.heading, fontWeight: 800, fontSize: tokens.font.h2, color: tokens.color.primaryDark }}>
            Trip Experience <span style={{ color: tokens.color.primary }}>Planner</span>
          </span>
          <nav style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 3vw, 28px)" }}>
            <Link href="/login" style={{ textDecoration: "none", fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark }}>Log in</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "clamp(24px, 6vw, 64px) clamp(16px, 4vw, 32px)" }}>
        <div style={{
          position: "relative", borderRadius: tokens.radius.xl, overflow: "hidden",
          padding: "clamp(32px, 6vw, 72px) clamp(20px, 4vw, 48px)",
          background: `linear-gradient(135deg, ${tokens.color.light} 0%, ${tokens.color.partnerBg} 55%, ${tokens.color.surface} 100%)`,
        }}>
          {/* Rotating destination photo (higher opacity) with a light scrim for legibility. */}
          <img src={heroImg.src} alt="" aria-hidden="true" style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.85, pointerEvents: "none",
          }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(251,249,248,0.28)", pointerEvents: "none" }} />
          {/* Destination credit, bottom-right. */}
          <div style={{ position: "absolute", right: 12, bottom: 10, zIndex: 1, fontFamily: tokens.font.mono,
            fontSize: 11, letterSpacing: "0.04em", color: "#fff", background: "rgba(27,28,28,0.45)",
            borderRadius: tokens.radius.full, padding: "3px 10px", pointerEvents: "none" }}>
            {heroImg.place}
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em", textTransform: "uppercase", color: tokens.color.primary, textAlign: "center", marginBottom: tokens.space.sm, textShadow: "0 1px 6px rgba(255,255,255,0.7)" }}>
            AI Travel Offer Finder
          </div>
          <h1 style={{ textAlign: "center", color: tokens.color.primaryDark, fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", margin: `0 0 ${tokens.space.lg}px`, textShadow: "0 2px 10px rgba(255,255,255,0.75)" }}>
            Tell us about your next trip
          </h1>

          {/* Smart-search card — same fields as the /plan finder. */}
          <div style={{
            maxWidth: 900, margin: "0 auto", background: "rgba(255,255,255,0.94)",
            border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg,
            padding: "clamp(20px, 3vw, 32px)", boxShadow: "0 8px 24px rgba(31,31,31,0.10)",
          }}>
            <OnboardingForm
              onGenerate={findOffers} loading={loading}
              submitLabel="See Partner Offers" loadingLabel="Finding offers…"
              secondaryLabel="✦ Plan Trip Itinerary" onSecondary={planTrip} maxWidth="100%"
            />
            <p style={{ color: tokens.color.muted, fontSize: tokens.font.small, marginTop: tokens.space.md, marginBottom: 0 }}>
              No account needed to see offers. Log in to save an itinerary.
            </p>
          </div>
          </div>
        </div>

        {/* Inline offer results (guests welcome). */}
        {error && <p style={{ color: tokens.color.danger, marginTop: tokens.space.lg }}>{error}</p>}
        {result && <OfferResults result={result} />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${tokens.color.border}`, background: tokens.color.surface }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px clamp(16px, 4vw, 32px)", display: "flex", flexWrap: "wrap", gap: tokens.space.md, justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark }}>Trip Itinerary Planner</div>
            <div style={{ color: tokens.color.muted, fontSize: tokens.font.small }}>AI travel offers, matched to your trip.</div>
          </div>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: tokens.space.md, color: tokens.color.muted, fontSize: tokens.font.small }}>
            <span>Privacy Policy</span><span>Terms of Service</span><span>Partner Program</span><span>Contact Support</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
