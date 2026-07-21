import type { CSSProperties } from "react";
import { tokens } from "@trip-itinerary/ui";

// One content width for every main page so the layout doesn't jump when moving
// between Planner, Directory, Admin, etc. Padding scales with the viewport
// (16px on phones → 32px on desktop) so content never touches the screen edge.
export const CONTENT_MAX = 960;
const RESPONSIVE_PADDING = "clamp(16px, 4vw, 32px)";

export const pageContainer: CSSProperties = {
  maxWidth: CONTENT_MAX,
  width: "100%",
  margin: "0 auto",
  padding: RESPONSIVE_PADDING,
  fontFamily: tokens.font.family,
};

// Narrow centered card used by the auth pages (login / verify / reset).
export const cardContainer: CSSProperties = {
  maxWidth: 400,
  width: "100%",
  margin: "0 auto",
  padding: RESPONSIVE_PADDING,
  fontFamily: tokens.font.family,
};
