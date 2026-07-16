import Link from "next/link";
import { tokens } from "@trip-itinerary/ui";

export default function Home() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: tokens.space.xl }}>
      <h1 style={{ color: tokens.color.navy, fontSize: tokens.font.h1, marginBottom: 8 }}>
        Trip Itinerary <span style={{ color: tokens.color.blue }}>Planner</span>
      </h1>
      <p style={{ color: tokens.color.mid, fontSize: tokens.font.body }}>
        AI itineraries with itinerary-aware offers — built for web and mobile from one shared core.
      </p>
      <Link href="/login"
        style={{ display: "inline-block", marginTop: tokens.space.lg, background: tokens.color.blue,
          color: "#fff", padding: "12px 20px", borderRadius: tokens.radius.md, textDecoration: "none", fontWeight: 600 }}>
        Log in to plan a trip →
      </Link>
    </main>
  );
}
