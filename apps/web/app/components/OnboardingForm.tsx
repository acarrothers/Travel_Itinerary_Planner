"use client";
import { useState } from "react";
import { tokens } from "@trip-itinerary/ui";
import type { TripPreferences, BudgetBand, PartyType, Pace } from "@trip-itinerary/core";

const INTERESTS = ["food", "culture", "adventure", "nature", "history", "nightlife", "relaxation"];

export function OnboardingForm({ onGenerate, loading }: { onGenerate: (p: TripPreferences) => void; loading: boolean }) {
  const [destination, setDestination] = useState("Lisbon");
  const [nights, setNights] = useState(4);
  const [party, setParty] = useState<PartyType>("couple");
  const [budget, setBudget] = useState<BudgetBand>("mid");
  const [pace, setPace] = useState<Pace>("balanced");
  const [interests, setInterests] = useState<string[]>(["food", "culture"]);

  const toggle = (i: string) =>
    setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({ destinations: [destination], nights, party, adults: 2, children: 0, budget, interests, pace });
  }

  const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, color: tokens.color.mid };
  const input: React.CSSProperties = { padding: "8px 10px", border: "1px solid #D5DEEC", borderRadius: tokens.radius.sm, fontSize: 15 };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: tokens.space.md, gridTemplateColumns: "1fr 1fr", maxWidth: 560 }}>
      <label style={{ ...field, gridColumn: "1 / 3" }}>Destination
        <input style={input} value={destination} onChange={(e) => setDestination(e.target.value)} />
      </label>
      <label style={field}>Nights
        <input style={input} type="number" min={1} max={21} value={nights} onChange={(e) => setNights(Number(e.target.value))} />
      </label>
      <label style={field}>Party
        <select style={input} value={party} onChange={(e) => setParty(e.target.value as PartyType)}>
          <option value="solo">Solo</option><option value="couple">Couple</option>
          <option value="family">Family</option><option value="friends">Friends</option>
        </select>
      </label>
      <label style={field}>Budget
        <select style={input} value={budget} onChange={(e) => setBudget(e.target.value as BudgetBand)}>
          <option value="budget">Budget</option><option value="mid">Mid-range</option><option value="luxury">Luxury</option>
        </select>
      </label>
      <label style={field}>Pace
        <select style={input} value={pace} onChange={(e) => setPace(e.target.value as Pace)}>
          <option value="relaxed">Relaxed</option><option value="balanced">Balanced</option><option value="packed">Packed</option>
        </select>
      </label>
      <div style={{ ...field, gridColumn: "1 / 3" }}>Interests
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
          {INTERESTS.map((i) => {
            const on = interests.includes(i);
            return (
              <button type="button" key={i} onClick={() => toggle(i)}
                style={{ padding: "6px 12px", borderRadius: 999, fontSize: 14, cursor: "pointer",
                  border: `1px solid ${on ? tokens.color.blue : "#D5DEEC"}`,
                  background: on ? tokens.color.light : "#fff", color: on ? tokens.color.navy : tokens.color.mid }}>
                {i}
              </button>
            );
          })}
        </div>
      </div>
      <button type="submit" disabled={loading}
        style={{ gridColumn: "1 / 3", background: tokens.color.blue, color: "#fff", border: "none",
          padding: "12px 20px", borderRadius: tokens.radius.md, fontWeight: 600, fontSize: 15, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
        {loading ? "Generating…" : "Generate itinerary"}
      </button>
    </form>
  );
}
