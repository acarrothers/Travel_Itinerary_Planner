"use client";
import { useEffect, useMemo, useState } from "react";
import { tokens } from "@trip-itinerary/ui";
import type { DirectoryOffer } from "@trip-itinerary/api-client";
import { api } from "../../lib/api";
import { describeApiError } from "../../lib/apiError";
import { PartnerOfferCard } from "./PartnerOfferCard";

// Browse the live partner catalog with a filter rail (category chips + partner
// brands) and free-text search. Read-only; clicks go through the tracked
// affiliate redirect, same as an itinerary-matched card.
export function OfferDirectory() {
  const [offers, setOffers] = useState<DirectoryOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set());
  const [activeBrands, setActiveBrands] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.listOfferDirectory()
      .then(setOffers)
      .catch((e) => setError(describeApiError(e)));
  }, []);

  // Filter options are derived from the catalog so they always reflect live stock.
  const categories = useMemo(
    () => Array.from(new Set((offers ?? []).map((o) => o.category))).sort(),
    [offers],
  );
  const brands = useMemo(
    () => Array.from(new Set((offers ?? []).map((o) => o.partnerName))).sort(),
    [offers],
  );

  if (error) return <p style={{ color: tokens.color.danger }}>{error}</p>;
  if (!offers) return <p style={{ color: tokens.color.mid }}>Loading offers…</p>;
  if (offers.length === 0) return <p style={{ color: tokens.color.mid }}>No offers are live yet.</p>;

  const q = query.trim().toLowerCase();
  const matches = offers.filter((o) => {
    if (activeCats.size && !activeCats.has(o.category)) return false;
    if (activeBrands.size && !activeBrands.has(o.partnerName)) return false;
    if (!q) return true;
    return [o.title, o.subtitle, o.body, o.category, o.partnerName, ...o.tags]
      .filter(Boolean)
      .some((f) => (f as string).toLowerCase().includes(q));
  });

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    setter(next);
  };
  const clearAll = () => { setActiveCats(new Set()); setActiveBrands(new Set()); setQuery(""); };
  const anyFilter = activeCats.size || activeBrands.size || q;

  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick} style={{
      textTransform: "capitalize", cursor: "pointer", fontSize: 14,
      padding: "6px 14px", borderRadius: tokens.radius.full,
      border: `1px solid ${on ? tokens.color.primary : tokens.color.border}`,
      background: on ? tokens.color.light : tokens.color.bg,
      color: on ? tokens.color.primaryDark : tokens.color.muted,
      fontWeight: on ? 700 : 500,
    }}>{label}</button>
  );

  return (
    <div>
      <p style={{ color: tokens.color.muted, marginTop: 0 }}>
        Curated partner deals — tours, stays, insurance and more. Offers are also matched automatically to each trip you plan.
      </p>

      {/* Category chips — quick top-level filter. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: tokens.space.md }}>
        {chip("All", activeCats.size === 0, () => setActiveCats(new Set()))}
        {categories.map((c) => chip(c, activeCats.has(c), () => toggle(activeCats, setActiveCats, c)))}
      </div>

      <div className="dir-layout">
        {/* Left filter rail */}
        <aside style={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.space.md, background: tokens.color.bg }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tokens.space.sm }}>
            <span style={{ fontFamily: tokens.font.heading, fontWeight: 700, color: tokens.color.primaryDark }}>Filters</span>
            {anyFilter ? (
              <button onClick={clearAll} style={{ background: "none", border: "none", color: tokens.color.primary, cursor: "pointer", fontSize: 13, padding: 0 }}>Clear</button>
            ) : null}
          </div>
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search offers…"
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, fontSize: 14, marginBottom: tokens.space.md }}
          />
          <div style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em", textTransform: "uppercase", color: tokens.color.muted, marginBottom: 6 }}>
            Partner brand
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {brands.map((b) => (
              <label key={b} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: tokens.color.ink, cursor: "pointer" }}>
                <input type="checkbox" checked={activeBrands.has(b)} onChange={() => toggle(activeBrands, setActiveBrands, b)} />
                {b}
              </label>
            ))}
          </div>
        </aside>

        {/* Results grid */}
        <div>
          <p style={{ color: tokens.color.muted, fontSize: 13, marginTop: 0 }}>
            {matches.length} {matches.length === 1 ? "offer" : "offers"}{anyFilter ? " match your filters" : ""}
          </p>
          {matches.length === 0 ? (
            <p style={{ color: tokens.color.muted }}>No offers match your filters. <button onClick={clearAll} style={{ background: "none", border: "none", color: tokens.color.primary, cursor: "pointer", fontSize: "inherit", padding: 0 }}>Clear filters</button></p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: tokens.space.md }}>
              {matches.map((o) => (
                <PartnerOfferCard key={o.id} title={o.title} subtitle={o.subtitle} body={o.body}
                  ctaLabel={o.ctaLabel} href={api.directoryClickUrl(o.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
