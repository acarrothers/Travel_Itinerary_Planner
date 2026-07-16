import type { ReactNode } from "react";
import { tokens } from "@trip-itinerary/ui";

export const metadata = { title: "Trip Itinerary Planner", description: "AI travel itineraries" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: tokens.font.family, color: tokens.color.text, margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
