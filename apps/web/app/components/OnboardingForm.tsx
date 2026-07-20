"use client";
import { useEffect, useRef, useState } from "react";
import { tokens } from "@trip-itinerary/ui";
import type { TripPreferences, BudgetBand, PartyType, Pace } from "@trip-itinerary/core";
import { api } from "../../lib/api";

const INTERESTS = ["food", "culture", "adventure", "nature", "history", "nightlife", "relaxation"];

export function OnboardingForm({ onGenerate, loading }: { onGenerate: (p: TripPreferences) => void; loading: boolean }) {
  const [destination, setDestination] = useState("Lisbon");
  const [nights, setNights] = useState(4);
  const [party, setParty] = useState<PartyType>("couple");
  const [budget, setBudget] = useState<BudgetBand>("mid");
  const [pace, setPace] = useState<Pace>("balanced");
  const [interests, setInterests] = useState<string[]>(["food", "culture"]);

  // --- destination autocomplete ---
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const skipFetch = useRef(false); // don't re-query right after picking a suggestion

  useEffect(() => {
    if (skipFetch.current) { skipFetch.current = false; return; }
    const q = destination.trim();
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const s = await api.suggestDestinations(q);
        setSuggestions(s); setOpen(s.length > 0); setHighlight(-1);
      } catch { setSuggestions([]); setOpen(false); }
    }, 250); // debounce keystrokes
    return () => clearTimeout(t);
  }, [destination]);

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function choose(value: string) {
    skipFetch.current = true;
    setDestination(value); setOpen(false); setHighlight(-1);
  }

  function onDestKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % suggestions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h <= 0 ? suggestions.length - 1 : h - 1)); }
    else if (e.key === "Enter" && highlight >= 0) { e.preventDefault(); choose(suggestions[highlight]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  const toggle = (i: string) =>
    setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onGenerate({ destinations: [destination], nights, party, adults: 2, children: 0, budget, interests, pace });
  }

  const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, color: tokens.color.mid };
  const input: React.CSSProperties = { padding: "8px 10px", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, fontSize: 15 };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: tokens.space.md, gridTemplateColumns: "1fr 1fr", maxWidth: 560 }}>
      <div style={{ ...field, gridColumn: "1 / 3" }} ref={boxRef}>
        <label htmlFor="destination">Destination</label>
        <div style={{ position: "relative" }}>
          <input
            id="destination" style={{ ...input, width: "100%", boxSizing: "border-box" }}
            value={destination} autoComplete="off"
            role="combobox" aria-expanded={open} aria-autocomplete="list" aria-controls="destination-options"
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={onDestKeyDown}
            onFocus={() => { if (suggestions.length) setOpen(true); }}
            placeholder="Start typing a city…"
          />
          {open && (
            <ul id="destination-options" role="listbox"
              style={{ position: "absolute", zIndex: 20, top: "calc(100% + 4px)", left: 0, right: 0, margin: 0,
                padding: 4, listStyle: "none", background: tokens.color.bg, border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.sm, boxShadow: "0 8px 24px rgba(31,31,31,0.12)", maxHeight: 260, overflowY: "auto" }}>
              {suggestions.map((s, i) => (
                <li key={s} role="option" aria-selected={i === highlight}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => { e.preventDefault(); choose(s); }}
                  style={{ padding: "8px 10px", borderRadius: 4, cursor: "pointer", fontSize: 15,
                    color: tokens.color.ink, background: i === highlight ? tokens.color.light : "transparent" }}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
                  border: `1px solid ${on ? tokens.color.blue : tokens.color.border}`,
                  background: on ? tokens.color.light : tokens.color.bg, color: on ? tokens.color.navy : tokens.color.mid }}>
                {i}
              </button>
            );
          })}
        </div>
      </div>
      <button type="submit" disabled={loading}
        style={{ gridColumn: "1 / 3", background: tokens.color.accent, color: tokens.color.ink, border: "none",
          padding: "12px 20px", borderRadius: tokens.radius.md, fontWeight: 600, fontSize: 15, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
        {loading ? "Generating…" : "Generate itinerary"}
      </button>
    </form>
  );
}
