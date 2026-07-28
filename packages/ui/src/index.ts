// Design tokens shared across web (CSS/inline styles) and React Native (StyleSheet).
// One place to change the look of BOTH clients.
//
// Design system: "Vibrant Voyager" — high-contrast modern. Vibrant purple primary,
// Chatr yellow reserved for CTAs and partner accents, on warm near-white surfaces.
export const tokens = {
  color: {
    // --- brand ---
    primary: "#4B2882",      // vibrant purple — primary actions, links
    primaryDark: "#340A6B",  // deep purple — headings, pressed states
    accent: "#FCD400",       // Chatr yellow — CTAs & partner accents only
    accentDark: "#E9C400",   // yellow border/hover
    teal: "#003C7A",         // tertiary blue — supporting accent

    // --- neutrals ---
    ink: "#1B1C1C",          // body + heading text (on-surface)
    muted: "#4A4451",        // secondary text (on-surface-variant)
    border: "#CCC3D2",       // outline-variant — inputs, hairlines
    borderSoft: "#E4E2E2",   // subtle dividers (surface-variant)
    surface: "#F4F4F7",      // section background / zebra rows (surface-dim)
    bg: "#FBF9F8",           // app background
    light: "#ECDCFF",        // light purple tint (chips, callouts, tabs)
    danger: "#BA1A1A",       // error
    partnerBg: "#FFFBE6",    // cream — partner/offer card background
    warnBg: "#FFF6E0",       // amber tint — limit/notice callouts
    warnBorder: "#FFE1A6",
    warnText: "#8A5A12",

    // --- aliases kept so existing components keep working ---
    navy: "#340A6B",         // -> primaryDark
    blue: "#4B2882",         // -> primary
    mid: "#4A4451",          // -> muted
    text: "#1B1C1C",         // -> ink
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48 },
  radius: { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 },
  // Type scale mirrors Vibrant Voyager DESIGN.md named tokens:
  //   display-lg 48 / display-lg-mobile 32 (Hanken 800)
  //   headline-md 24 / headline-sm 20 (Hanken 700)
  //   body-lg 18 / body-md 16 / body-sm 14 (Inter 400)
  //   label-caps 12 (JetBrains Mono 600) · cta-text 16 (Hanken 700)
  font: {
    family: "Inter, system-ui, sans-serif",              // body (Inter)
    heading: "'Hanken Grotesk', Inter, system-ui, sans-serif", // headlines (Hanken Grotesk)
    mono: "'JetBrains Mono', ui-monospace, monospace",   // metadata / label-caps (JetBrains Mono)
    display: 48,        // display-lg
    displayMobile: 32,  // display-lg-mobile
    h1: 32,             // display-lg-mobile (page titles)
    h2: 24,             // headline-md
    h3: 20,             // headline-sm
    bodyLg: 18,         // body-lg
    body: 16,           // body-md
    small: 14,          // body-sm
    caps: 12,           // label-caps
    cta: 16,            // cta-text
  },
} as const;
export type Tokens = typeof tokens;
