"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, Offer, TripPreferences, ReorderInput, User, RateLimitStatus, BudgetBand, PartyType } from "@trip-itinerary/core";
import { api } from "../../lib/api";
import { OnboardingForm, type OnboardingInitial } from "../components/OnboardingForm";
import { ItineraryView } from "../components/ItineraryView";
import { MapView } from "../components/MapView";
import { OfferCard } from "../components/OfferCard";
import { OfferDirectory } from "../components/OfferDirectory";
import { OfferFinder } from "../components/OfferFinder";
import { pageContainer } from "../../lib/layout";

// Offer discovery is the primary flow; the itinerary planner is secondary.
type Tab = "finder" | "planner" | "directory";

const PARTIES: PartyType[] = ["solo", "couple", "family", "friends"];

// Translate the landing page's "Travel style" into our preference fields.
function initialFromParams(p: URLSearchParams): OnboardingInitial | undefined {
  const dest = p.get("dest") ?? undefined;
  const partyRaw = (p.get("party") ?? "").toLowerCase();
  const party = PARTIES.includes(partyRaw as PartyType) ? (partyRaw as PartyType) : undefined;
  const style = (p.get("style") ?? "").toLowerCase();
  let budget: BudgetBand | undefined;
  let interests: string[] | undefined;
  if (style === "budget") budget = "budget";
  else if (style === "luxury") budget = "luxury";
  else if (style === "adventure") interests = ["adventure", "nature"];
  else if (style === "relaxing") interests = ["relaxation"];
  if (!dest && !party && !budget && !interests) return undefined;
  return { destination: dest, party, budget, interests };
}

function PlanPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = useMemo(() => initialFromParams(params), [params]);
  const [user, setUser] = useState<User | null>(null);
  const [rate, setRate] = useState<RateLimitStatus | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(params.get("intent") === "planner" ? "planner" : "finder");
  const [checked, setChecked] = useState(false); // finished the guest-vs-member check

  // Guests are allowed here; /auth/me just tells us whether someone is signed in.
  useEffect(() => {
    api.me().then((m) => { setUser(m.user); setRate(m.rate); })
      .catch(() => { /* not signed in — continue as guest */ })
      .finally(() => setChecked(true));
  }, []);

  async function logout() { try { await api.logout(); } catch { /* ignore */ } router.replace("/login"); }
  async function refreshOffer(id: string) { setOffer(await api.matchOffer(id, "post_generation")); }

  async function generate(prefs: TripPreferences) {
    setLoading(true); setError(null); setOffer(null);
    try {
      const t = await api.createItinerary(prefs);
      setTrip(t);
      if (t._rate) setRate(t._rate);
      await refreshOffer(t.id);
    } catch (err: any) {
      if (err?.status === 429) setError(err.message || "You've reached your daily trip limit.");
      else setError("Could not reach the API. Start it with `pnpm --filter @trip-itinerary/api dev`.");
    } finally { setLoading(false); }
  }

  async function applyEdit() {
    if (!trip || !instruction.trim()) return;
    setEditing(true); setError(null);
    try { const t = await api.editItinerary(trip.id, instruction.trim()); setTrip(t); setInstruction(""); await refreshOffer(t.id); }
    catch { setError("Edit failed — is the API running?"); }
    finally { setEditing(false); }
  }
  async function reorder(mv: ReorderInput) { if (trip) setTrip(await api.reorderItem(trip.id, mv)); }

  if (!checked) return <main style={{ ...pageContainer, color: tokens.color.mid }}>Loading…</main>;

  const remainingText = rate ? (rate.remaining < 0 ? "Unlimited" : `${rate.remaining} of ${rate.limit} left today`) : "";
  const outOfTrips = rate ? (rate.remaining === 0 && rate.limit >= 0) : false;

  const tabBtn = (id: Tab, text: string): React.CSSProperties => ({
    background: "none", border: "none", cursor: "pointer", fontSize: 15,
    fontWeight: tab === id ? 700 : 500,
    color: tab === id ? tokens.color.navy : tokens.color.mid,
    padding: `${tokens.space.sm}px 2px`, marginRight: tokens.space.lg,
    borderBottom: `3px solid ${tab === id ? tokens.color.accent : "transparent"}`,
  });

  return (
    <main style={pageContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tokens.space.md, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: tokens.color.mid }}>
          {user
            ? <>{user.email}{remainingText ? <> · <span style={{ color: outOfTrips ? tokens.color.danger : tokens.color.navy }}>{remainingText}</span></> : null}</>
            : <>Browsing as guest{remainingText ? <> · <span style={{ color: outOfTrips ? tokens.color.danger : tokens.color.navy }}>{remainingText}</span></> : null}</>}
        </div>
        {user
          ? <button onClick={logout} style={{ background: "none", border: "1px solid #D5DEEC", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>Log out</button>
          : <Link href="/login" style={{ textDecoration: "none", fontFamily: tokens.font.heading, fontWeight: 700, background: tokens.color.accent, color: tokens.color.primaryDark, borderRadius: tokens.radius.lg, padding: "8px 16px", fontSize: 14 }}>Log in / Sign up</Link>}
      </div>

      <nav style={{ display: "flex", flexWrap: "wrap", borderBottom: `1px solid ${tokens.color.border}`, marginBottom: tokens.space.lg }}>
        <button style={tabBtn("finder", "Find Offers")} onClick={() => setTab("finder")}>Find Offers</button>
        <button style={tabBtn("directory", "Browse Directory")} onClick={() => setTab("directory")}>Browse Directory</button>
        <button style={tabBtn("planner", "Trip Planner")} onClick={() => setTab("planner")}>Trip Planner</button>
      </nav>

      {tab === "finder" ? (
        <>
          <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1, marginTop: 0 }}>Find travel offers</h1>
          <OfferFinder initial={initial} onPlanTrip={(p) => { setTab("planner"); generate(p); }} />
        </>
      ) : tab === "directory" ? (
        <>
          <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1, marginTop: 0 }}>Partner Offer Directory</h1>
          <OfferDirectory />
        </>
      ) : (
      <>
      <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1, marginTop: 0 }}>Plan a trip</h1>
      {outOfTrips && !trip && (
        <p style={{ color: tokens.color.warnText, background: tokens.color.warnBg, border: "1px solid #EBD9B4", padding: 12, borderRadius: 8 }}>
          You've reached {rate?.limit} itineraries for today{user ? ` on the ${user.accountType} plan` : " (guest limit)"}. {user ? "Try again tomorrow." : <>Try again tomorrow, or <Link href="/login" style={{ color: tokens.color.primary }}>log in</Link> for your own allowance.</>}
        </p>
      )}
      <OnboardingForm onGenerate={generate} loading={loading} initial={initial} />
      {error && <p style={{ color: tokens.color.danger, marginTop: tokens.space.md }}>{error}</p>}

      {/* Guests can plan but not save — nudge toward an account once they have a trip. */}
      {trip && !user && (
        <p style={{ marginTop: tokens.space.md, background: tokens.color.light, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: 12, color: tokens.color.primaryDark }}>
          This itinerary won't be saved. <Link href="/login" style={{ color: tokens.color.primary, fontWeight: 700 }}>Log in or create an account</Link> to save it and refine it later.
        </p>
      )}

      {/* Refine + reorder require an account (they persist changes). */}
      {trip && user && (
        <div style={{ marginTop: tokens.space.lg, display: "flex", gap: 8 }}>
          <input value={instruction} onChange={(e) => setInstruction(e.target.value)}
            placeholder='Refine, e.g. "make day 2 more relaxed"'
            style={{ flex: 1, padding: "10px 12px", border: "1px solid #D5DEEC", borderRadius: tokens.radius.sm, fontSize: 15 }}
            onKeyDown={(e) => { if (e.key === "Enter") applyEdit(); }} />
          <button onClick={applyEdit} disabled={editing}
            style={{ background: tokens.color.navy, color: "#fff", border: "none", padding: "10px 18px", borderRadius: tokens.radius.sm, fontWeight: 600, cursor: "pointer", opacity: editing ? 0.6 : 1 }}>
            {editing ? "Applying…" : "Apply"}
          </button>
        </div>
      )}

      {trip && <ItineraryView trip={trip} onReorder={user ? reorder : () => {}} />}
      {trip && <MapView trip={trip} />}
      {trip && offer && <OfferCard offer={offer} clickUrl={api.trackOfferClickUrl(offer.id, trip.id)} />}
      </>
      )}
    </main>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanPageInner />
    </Suspense>
  );
}
