"use client";
import { useState } from "react";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, Offer, Item } from "@trip-itinerary/core";
import { api } from "../../lib/api";
import { MapView } from "./MapView";

// Detailed itinerary in the "vertical layout" design: map on top, a selected-stop
// detail card, then a day-by-day timeline with localized partner offers embedded
// (one per day, drawn from partner APIs + the CMS catalog).
export function ItineraryDetail({ trip, offers }: { trip: Trip; offers: Offer[] }) {
  const days = [...trip.days].sort((a, b) => a.order - b.order);
  const [openDay, setOpenDay] = useState(days[0]?.order ?? 1);
  const firstItem = days[0]?.items[0] ?? null;
  const [selected, setSelected] = useState<Item | null>(firstItem);

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const city = (trip.preferences.destinations[0] ?? "Your trip").split(",")[0].trim();
  const interests = trip.preferences.interests.slice(0, 2).map(cap).join(" & ");
  const subtitle = `${days.length} ${days.length === 1 ? "Day" : "Days"}${interests ? ` • ${interests} mix` : ""}`;
  const directions = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${q}, ${city}`)}`;

  return (
    <div>
      {/* Map */}
      <div style={{ borderRadius: tokens.radius.lg, overflow: "hidden", border: `1px solid ${tokens.color.border}` }}>
        <MapView trip={trip} />
      </div>

      {/* Selected-stop detail card (approximates the design's POI card + AI Insight) */}
      {selected && (
        <div style={{ marginTop: tokens.space.md, background: tokens.color.bg, border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.lg, padding: tokens.space.md, maxWidth: 460, boxShadow: "0 8px 24px rgba(31,31,31,0.08)" }}>
          {selected.time && (
            <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, letterSpacing: "0.05em",
              color: tokens.color.primary, background: tokens.color.light, borderRadius: tokens.radius.sm, padding: "2px 8px" }}>
              {selected.time}
            </span>
          )}
          <div style={{ fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.h3, color: tokens.color.primaryDark, marginTop: 6 }}>
            {selected.title}
          </div>
          {selected.description && <p style={{ color: tokens.color.muted, fontSize: tokens.font.small, marginTop: 4 }}>{selected.description}</p>}
          {selected.notes && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#EAF1FB", border: "1px solid #C7DCF5",
              borderRadius: tokens.radius.md, padding: "10px 12px", marginTop: tokens.space.sm }}>
              <span aria-hidden style={{ fontSize: 16 }}>🤖</span>
              <p style={{ margin: 0, fontSize: tokens.font.small, color: tokens.color.ink }}><strong>AI Insight:</strong> {selected.notes}</p>
            </div>
          )}
          <a href={directions(selected.title)} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", textAlign: "center", marginTop: tokens.space.md, background: tokens.color.primary,
              color: "#fff", fontFamily: tokens.font.heading, fontWeight: 700, padding: "10px", borderRadius: tokens.radius.md, textDecoration: "none" }}>
            Get Directions
          </a>
        </div>
      )}

      {/* Trip header */}
      <div style={{ marginTop: tokens.space.xl }}>
        <h1 style={{ fontFamily: tokens.font.heading, fontWeight: 800, fontSize: tokens.font.h1, color: tokens.color.primaryDark, margin: 0 }}>
          {city} Trip
        </h1>
        <p style={{ color: tokens.color.muted, marginTop: 4 }}>{subtitle}</p>
      </div>

      {/* Day grid */}
      <h2 style={{ fontFamily: tokens.font.heading, fontWeight: 700, fontSize: tokens.font.h3, color: tokens.color.ink, marginTop: tokens.space.lg, marginBottom: tokens.space.sm }}>Itinerary</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: tokens.space.md }}>
        {days.map((day) => {
          const open = day.order === openDay;
          return (
            <div key={day.id} onClick={() => setOpenDay(day.order)}
              style={{ cursor: "pointer", background: open ? tokens.color.surface : tokens.color.bg,
                border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.lg, padding: tokens.space.md }}>
              <div style={{ fontFamily: tokens.font.heading, fontWeight: 700, color: open ? tokens.color.primaryDark : tokens.color.ink, marginBottom: open ? tokens.space.sm : 4 }}>
                Day {day.order}{day.items[0] ? `: ${day.items[0].title.replace(/^[^\p{L}]+/u, "").split(" ").slice(0, 2).join(" ")}` : ""}
              </div>
              {open ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {day.items.map((it) => (
                    <div key={it.id} onClick={(e) => { e.stopPropagation(); setSelected(it); }} style={{ cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: tokens.color.primary }} />
                        <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, color: tokens.color.muted }}>{it.time ?? "—"}</span>
                      </div>
                      <p style={{ margin: "2px 0 0 16px", fontWeight: 600, color: tokens.color.ink }}>{it.title}</p>
                    </div>
                  ))}
                  {/* Embedded localized partner offer for this day (design: inline PARTNER row). */}
                  {offers.length > 0 && (() => {
                    const dayOffer = offers[(day.order - 1) % offers.length];
                    return (
                      <a href={api.trackOfferClickUrl(dayOffer.id, trip.id)} target="_blank" rel="noopener noreferrer sponsored"
                        onClick={(e) => e.stopPropagation()} style={{ textDecoration: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: tokens.color.accent }} />
                          <span style={{ fontFamily: tokens.font.mono, fontSize: tokens.font.caps, color: tokens.color.muted }}>Partner{dayOffer.subtitle ? ` · ${dayOffer.subtitle}` : ""}</span>
                        </div>
                        <p style={{ margin: "2px 0 0 16px", fontWeight: 600, color: tokens.color.primaryDark, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {dayOffer.title}
                          <span style={{ background: tokens.color.accent, color: tokens.color.primaryDark, fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: tokens.radius.full }}>PARTNER</span>
                        </p>
                      </a>
                    );
                  })()}
                </div>
              ) : (
                <p style={{ color: tokens.color.muted, fontSize: tokens.font.small, margin: 0 }}>
                  {day.items.length} stop{day.items.length === 1 ? "" : "s"} — tap to view.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
