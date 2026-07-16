"use client";
import { useState } from "react";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, Offer, TripPreferences, ReorderInput } from "@trip-itinerary/core";
import { api } from "../../lib/api";
import { OnboardingForm } from "../components/OnboardingForm";
import { ItineraryView } from "../components/ItineraryView";
import { MapView } from "../components/MapView";
import { OfferCard } from "../components/OfferCard";

export default function PlanPage() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refreshOffer(id: string) {
    setOffer(await api.matchOffer(id, "post_generation"));
  }

  async function generate(prefs: TripPreferences) {
    setLoading(true); setError(null); setOffer(null);
    try {
      const t = await api.createItinerary(prefs);
      setTrip(t);
      await refreshOffer(t.id);
    } catch {
      setError("Could not reach the API. Start it with `pnpm --filter @trip-itinerary/api dev`.");
    } finally { setLoading(false); }
  }

  async function applyEdit() {
    if (!trip || !instruction.trim()) return;
    setEditing(true); setError(null);
    try {
      const t = await api.editItinerary(trip.id, instruction.trim());
      setTrip(t); setInstruction(""); await refreshOffer(t.id);
    } catch {
      setError("Edit failed — is the API running?");
    } finally { setEditing(false); }
  }

  async function reorder(mv: ReorderInput) {
    if (!trip) return;
    const t = await api.reorderItem(trip.id, mv);
    setTrip(t);
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: tokens.space.xl }}>
      <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1 }}>Plan a trip</h1>
      <OnboardingForm onGenerate={generate} loading={loading} />
      {error && <p style={{ color: "#C0392B", marginTop: tokens.space.md }}>{error}</p>}

      {trip && (
        <div style={{ marginTop: tokens.space.lg, display: "flex", gap: 8 }}>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder='Refine, e.g. "make day 2 more relaxed"'
            style={{ flex: 1, padding: "10px 12px", border: "1px solid #D5DEEC", borderRadius: tokens.radius.sm, fontSize: 15 }}
            onKeyDown={(e) => { if (e.key === "Enter") applyEdit(); }}
          />
          <button onClick={applyEdit} disabled={editing}
            style={{ background: tokens.color.navy, color: "#fff", border: "none", padding: "10px 18px", borderRadius: tokens.radius.sm, fontWeight: 600, cursor: "pointer", opacity: editing ? 0.6 : 1 }}>
            {editing ? "Applying…" : "Apply"}
          </button>
        </div>
      )}

      {trip && <ItineraryView trip={trip} onReorder={reorder} />}
      {trip && <MapView trip={trip} />}
      {trip && offer && <OfferCard offer={offer} clickUrl={api.trackOfferClickUrl(offer.id, trip.id)} />}
    </main>
  );
}
