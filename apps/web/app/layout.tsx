import type { ReactNode } from "react";
import { tokens } from "@trip-itinerary/ui";
import "./globals.css";

export const metadata = { title: "Trip Itinerary Planner", description: "AI travel itineraries" };

// Without this, mobile browsers render at a ~980px virtual width and shrink the
// page — the root cause of the site not adapting to screen size.
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: tokens.font.family, color: tokens.color.text, margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
