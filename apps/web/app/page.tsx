"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";

// Public smart-search landing (Vibrant Voyager "global landing" design). Auth is
// required to actually run anything, so the two CTAs carry the entered trip into
// /login via a `next` URL; after signing in the user lands in the finder/planner
// with the form prefilled.
export default function Home() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [party, setParty] = useState("Solo");
  const [style, setStyle] = useState("Adventure");

  function go(intent: "offers" | "planner") {
    const trip = new URLSearchParams();
    trip.set("intent", intent);
    if (destination.trim()) trip.set("dest", destination.trim());
    trip.set("party", party.toLowerCase());
    trip.set("style", style.toLowerCase());
    const next = `/plan?${trip.toString()}`;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }

  const labelCaps: React.CSSProperties = {
    fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em",
    textTransform: "uppercase", color: tokens.color.muted, marginBottom: 4, display: "block",
  };
  const field: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "12px 14px",
    border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md,
    fontSize: tokens.font.body, background: tokens.color.bg, color: tokens.color.ink,
  };

  return (
    <div style={{ fontFamily: tokens.font.family, color: tokens.color.ink }}>
      {/* Top nav */}
      <header style={{ borderBottom: `1px solid ${tokens.color.border}`, background: tokens.color.bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px clamp(16px, 4vw, 32px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: tokens.font.heading, fontWeight: 800, fontSize: tokens.font.h2, color: tokens.color.primaryDark }}>
            Trip Itinerary <span style={{ color: tokens.color.primary }}>Planner</span>
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
          <div style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em", textTransform: "uppercase", color: tokens.color.primary, textAlign: "center", marginBottom: tokens.space.sm }}>
            AI Travel Offer Finder
          </div>
          <h1 style={{ textAlign: "center", color: tokens.color.primaryDark, fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", margin: `0 0 ${tokens.space.lg}px` }}>
            Tell us about your next trip
          </h1>

          {/* Smart-search card */}
          <div style={{
            maxWidth: 860, margin: "0 auto", background: "rgba(255,255,255,0.92)",
            border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg,
            padding: "clamp(20px, 3vw, 28px)", boxShadow: "0 8px 24px rgba(31,31,31,0.10)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: tokens.space.md }}>
              <div>
                <label style={labelCaps}>Destination</label>
                <input style={field} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g., Paris, Tokyo, London" />
              </div>
              <div>
                <label style={labelCaps}>Dates</label>
                <input style={field} value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Select dates" />
              </div>
              <div>
                <label style={labelCaps}>Who's going</label>
                <select style={field} value={party} onChange={(e) => setParty(e.target.value)}>
                  <option>Solo</option><option>Couple</option><option>Family</option><option>Friends</option>
                </select>
              </div>
              <div>
                <label style={labelCaps}>Travel style</label>
                <select style={field} value={style} onChange={(e) => setStyle(e.target.value)}>
                  <option>Adventure</option><option>Relaxing</option><option>Budget</option><option>Luxury</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: tokens.space.md, marginTop: tokens.space.lg }}>
              <button onClick={() => go("offers")} style={{
                flex: "1 1 220px", background: tokens.color.bg, color: tokens.color.primary,
                border: `2px solid ${tokens.color.primary}`, borderRadius: tokens.radius.lg,
                padding: "12px 20px", fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.body, cursor: "pointer",
              }}>See Partner Offers</button>
              <button onClick={() => go("planner")} style={{
                flex: "1 1 220px", background: tokens.color.accent, color: tokens.color.primaryDark,
                border: "none", borderRadius: tokens.radius.lg,
                padding: "12px 20px", fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.body, cursor: "pointer",
              }}>✦ Plan Trip Itinerary</button>
            </div>
            <p style={{ color: tokens.color.muted, fontSize: tokens.font.small, marginTop: tokens.space.md, marginBottom: 0, textAlign: "center" }}>
              You'll sign in to continue — your trip details carry over.
            </p>
          </div>
        </div>
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
