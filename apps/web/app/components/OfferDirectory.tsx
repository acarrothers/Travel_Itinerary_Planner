"use client";
import { useEffect, useState } from "react";
import { tokens } from "@trip-itinerary/ui";
import type { DirectoryOffer } from "@trip-itinerary/api-client";
import { api } from "../../lib/api";
import { describeApiError } from "../../lib/apiError";
import { PartnerOfferCard } from "./PartnerOfferCard";

// Browse the live partner catalog. Read-only; clicking an offer goes through the
// tracked affiliate redirect just like an itinerary-matched card.
export function OfferDirectory() {
  const [offers, setOffers] = useState<DirectoryOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.listOfferDirectory()
      .then(setOffers)
      .catch((e) => setError(describeApiError(e)));
  }, []);

  if (error) return <p style={{ color: tokens.color.danger }}>{error}</p>;
  if (!offers) return <p style={{ color: tokens.color.mid }}>Loading offers…</p>;
  if (offers.length === 0) return <p style={{ color: tokens.color.mid }}>No offers are live yet.</p>;

  // Free-text search across the fields a user would think to type: partner,
  // title, description, category and tags.
  const q = query.trim().toLowerCase();
  const matches = q
    ? offers.filter((o) =>
        [o.title, o.subtitle, o.body, o.category, o.partnerId, ...o.tags]
          .filter(Boolean)
          .some((f) => (f as string).toLowerCase().includes(q)))
    : offers;

  // Group by category so the directory reads as a browsable catalog.
  const byCategory = matches.reduce<Record<string, DirectoryOffer[]>>((acc, o) => {
    (acc[o.category] ??= []).push(o);
    return acc;
  }, {});

  return (
    <div>
      <p style={{ color: tokens.color.mid, marginTop: 0 }}>
        Curated partner deals — tours, stays, insurance and more. Offers are also matched automatically to each trip you plan.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search offers — e.g. tours, insurance, eSIM, Viator"
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.sm, fontSize: 15, marginBottom: tokens.space.sm }}
      />
      {q && (
        <p style={{ color: tokens.color.mid, fontSize: 13, marginTop: 0 }}>
          {matches.length} {matches.length === 1 ? "offer" : "offers"} matching “{query}”
        </p>
      )}
      {matches.length === 0 && <p style={{ color: tokens.color.mid }}>No offers match your search.</p>}
      {Object.entries(byCategory).map(([category, list]) => (
        <section key={category} style={{ marginTop: tokens.space.lg }}>
          <h2 style={{ fontSize: tokens.font.h2, color: tokens.color.navy, textTransform: "capitalize", marginBottom: tokens.space.sm }}>
            {category}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: tokens.space.md }}>
            {list.map((o) => (
              <PartnerOfferCard key={o.id} title={o.title} subtitle={o.subtitle} body={o.body}
                ctaLabel={o.ctaLabel} href={api.directoryClickUrl(o.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
