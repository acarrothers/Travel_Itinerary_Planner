"use client";
import { useEffect, useRef } from "react";
import { tripMapPoints, type Trip } from "@trip-itinerary/core";
import { tokens } from "@trip-itinerary/ui";

declare const process: { env: Record<string, string | undefined> };
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

declare global {
  interface Window { google?: any; __tripGMaps?: Promise<void> }
}

function loadGoogleMaps(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (!window.__tripGMaps) {
    window.__tripGMaps = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("google maps failed to load"));
      document.head.appendChild(s);
    });
  }
  return window.__tripGMaps;
}

// Plots itinerary stops on a Google map. When stops have coordinates (via
// Foursquare grounding) it drops a pin per stop; otherwise it still shows the
// map centered on the destination by geocoding it, so the map is never blank
// just because grounding hasn't run.
export function MapView({ trip }: { trip: Trip }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const points = tripMapPoints(trip);
  const destination = trip.preferences.destinations[0] ?? "";

  useEffect(() => {
    if (!KEY || !ref.current) return;
    let cancelled = false;
    loadGoogleMaps(KEY)
      .then(() => {
        if (cancelled || !ref.current) return;
        const g = window.google;
        const map = new g.maps.Map(ref.current, { center: { lat: 20, lng: 0 }, zoom: 11, mapTypeControl: false, streetViewControl: false });
        if (points.length > 0) {
          const bounds = new g.maps.LatLngBounds();
          points.forEach((p) => {
            const marker = new g.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map, label: String(p.day), title: p.title });
            const info = new g.maps.InfoWindow({ content: `Day ${p.day}: ${p.title}` });
            marker.addListener("click", () => info.open({ anchor: marker, map }));
            bounds.extend({ lat: p.lat, lng: p.lng });
          });
          if (points.length > 1) map.fitBounds(bounds);
          else map.setCenter({ lat: points[0].lat, lng: points[0].lng });
        } else if (destination) {
          // No grounded stops yet — center on the destination city.
          new g.maps.Geocoder().geocode({ address: destination }, (res: any, status: string) => {
            if (!cancelled && status === "OK" && res?.[0]) map.setCenter(res[0].geometry.location);
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [trip.id]);

  if (!KEY) {
    return (
      <div style={{ padding: tokens.space.md, border: "1px dashed #D5DEEC", borderRadius: tokens.radius.md, color: tokens.color.muted, fontSize: 14 }}>
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map{points.length ? ` (${points.length} stops ready)` : ""}.
      </div>
    );
  }
  return <div ref={ref} style={{ height: 360, width: "100%" }} />;
}
