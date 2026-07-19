// Design tokens shared across web (CSS/inline styles) and React Native (StyleSheet).
// One place to change the look of BOTH clients.
//
// Palette: purple primary with amber accent and teal support, on near-white surfaces.
export const tokens = {
  color: {
    // --- brand ---
    primary: "#542E91",      // purple — primary actions, links, highlights
    primaryDark: "#3E2168",  // deeper purple — headings, pressed states
    accent: "#FFAF14",       // amber — key CTAs, callouts
    accentDark: "#D98F00",   // amber text on light backgrounds (contrast-safe)
    teal: "#035D67",         // supporting accent

    // --- neutrals ---
    ink: "#1F1F1F",          // body + heading text
    muted: "#6B6B76",        // secondary text
    border: "#E5E1EC",       // hairlines, inputs
    borderSoft: "#F0EDF5",   // subtle dividers
    surface: "#FAFAFA",      // cards / zebra rows
    bg: "#FFFFFF",
    light: "#F3EEFA",        // light purple tint (offer cards, callouts)
    danger: "#C0392B",
    warnBg: "#FFF6E0",       // amber tint — limit/notice callouts
    warnBorder: "#FFE1A6",
    warnText: "#8A5A12",

    // --- aliases kept so existing components keep working ---
    navy: "#3E2168",         // -> primaryDark
    blue: "#542E91",         // -> primary
    mid: "#6B6B76",          // -> muted
    text: "#1F1F1F",         // -> ink
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 12, lg: 20 },
  font: { family: "Inter, system-ui, sans-serif", h1: 28, h2: 22, body: 16, small: 13 },
} as const;
export type Tokens = typeof tokens;
