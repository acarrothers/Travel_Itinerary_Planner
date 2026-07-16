"use client";
import { useEffect, useRef } from "react";
import { tripMapPoints, type Trip } from "@trip-itinerary/core";
import { tokens } from "@trip-itinerary/ui";

declare const process: { env: Record<string, string | undefined> };
const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

declare global {
  interface Window { google?: any; __tripGMaps?: Promise<void> }
}

// Load the Google Maps JS SDK once (script tag). Cached on window so repeated
// mounts reuse the same load.
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

// Plots itinerary items (those with coordinates) on a Google map. Shows a notice
// until a key + coordinates are available.
export function MapView({ trip }: { trip: Trip }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const points = tripMapPoints(trip);

  useEffect(() => {
    if (!KEY || !ref.current || points.length === 0) return;
    let map: any;
    loadGoogleMaps(KEY)
      .then(() => {
        const g = window.google;
        map = new g.maps.Map(ref.current!, { center: { lat: points[0].lat, lng: points[0].lng }, zoom: 12, mapTypeControl: false, streetViewControl: false });
        const bounds = new g.maps.LatLngBounds();
        points.forEach((p) => {
          const marker = new g.maps.Marker({ position: { lat: p.lat, lng: p.lng }, map, label: String(p.day), title: p.title });
          const info = new g.maps.InfoWindow({ content: `Day ${p.day}: ${p.title}` });
          marker.addListener("click", () => info.open({ anchor: marker, map }));
          bounds.extend({ lat: p.lat, lng: p.lng });
        });
        if (points.length > 1) map.fitBounds(bounds);
      })
      .catch(() => {});
  }, [trip.id]);

  const notice = (text: string) => (
    <div style={{ marginTop: tokens.space.lg, padding: tokens.space.md, border: "1px dashed #D5DEEC", borderRadius: tokens.radius.md, color: tokens.color.mid, fontSize: 14 }}>{text}</div>
  );
  if (points.length === 0) return notice("Map appears once itinerary items have coordinates (Foursquare grounding).");
  if (!KEY) return notice(`Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to render the map (${points.length} stops ready).`);
  return <div ref={ref} style={{ marginTop: tokens.space.lg, height: 360, borderRadius: tokens.radius.md, overflow: "hidden" }} />;
}
