// Design tokens shared across web (CSS/Tailwind) and React Native (StyleSheet).
// Keeping tokens in one place is what keeps the two clients visually consistent
// (PRD §14.2 responsive + shared design system).
export const tokens = {
  color: {
    navy: "#1B2A4A",
    blue: "#2E6FE8",
    light: "#EAF1FD",
    mid: "#5B6B86",
    bg: "#FFFFFF",
    text: "#1E2A3A",
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 12, lg: 20 },
  font: { family: "Inter, system-ui, sans-serif", h1: 28, h2: 22, body: 16, small: 13 },
} as const;
export type Tokens = typeof tokens;
