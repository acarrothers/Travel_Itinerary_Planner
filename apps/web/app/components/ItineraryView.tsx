"use client";
import { useRef } from "react";
import { tokens } from "@trip-itinerary/ui";
import type { Trip, ReorderInput } from "@trip-itinerary/core";

export function ItineraryView({ trip, onReorder }: { trip: Trip; onReorder?: (mv: ReorderInput) => void }) {
  const drag = useRef<{ day: number; index: number } | null>(null);

  return (
    <section style={{ marginTop: tokens.space.lg }}>
      <h2 style={{ color: tokens.color.navy, fontSize: tokens.font.h2 }}>
        {trip.preferences.destinations.join(", ")} · {trip.days.length} days
      </h2>
      {onReorder && <p style={{ color: tokens.color.mid, fontSize: 13, margin: "2px 0 0" }}>Drag items to reorder (within or across days).</p>}
      {trip.days.map((day) => (
        <div key={day.id} style={{ marginTop: tokens.space.md }}>
          <div style={{ fontWeight: 700, color: tokens.color.blue }}>Day {day.order}</div>
          <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0" }}>
            {day.items.map((item, index) => (
              <li
                key={item.id}
                draggable={!!onReorder}
                onDragStart={() => { drag.current = { day: day.order, index }; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!onReorder || !drag.current) return;
                  onReorder({ fromDay: drag.current.day, fromIndex: drag.current.index, toDay: day.order, toIndex: index });
                  drag.current = null;
                }}
                style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #EEF2F8", cursor: onReorder ? "grab" : "default" }}
              >
                {onReorder && <span style={{ color: tokens.color.border }}>⋮⋮</span>}
                <span style={{ color: tokens.color.mid, width: 52, fontSize: 14 }}>{item.time}</span>
                <span style={{ flex: 1 }}>{item.title}</span>
                <span style={{ fontSize: 12, color: tokens.color.mid }}>{item.categoryTags.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
