import type { Offer, Partner } from "@trip-itinerary/core";

// Richer seed catalog so targeting + matching are demoable out of the box.
export const seedPartners: Partner[] = [
  { id: "viator", name: "Viator", category: "tours", status: "active" },
  { id: "getyourguide", name: "GetYourGuide", category: "tours", status: "active" },
  { id: "safetywing", name: "SafetyWing", category: "insurance", status: "active" },
  { id: "airalo", name: "Airalo", category: "esim", status: "active" },
  { id: "booking", name: "Booking.com", category: "accommodation", status: "active" },
];

export const seedOffers: Offer[] = [
  {
    id: "viator-tours-generic", partnerId: "viator",
    title: "Book top-rated tours & activities", subtitle: "Powered by Viator",
    body: "Skip-the-line tickets and guided experiences matched to your trip.",
    ctaLabel: "See experiences", destinationUrl: "https://www.viator.com/",
    category: "tours", tags: ["culture", "adventure", "food", "history", "nature"],
    targeting: [{ dimension: "interests", op: "contains_any", value: ["culture", "adventure", "food", "history", "nature"] }],
    priority: 100, surfaces: ["inline_day", "post_generation"], status: "live",
  },
  {
    id: "gyg-culture", partnerId: "getyourguide",
    title: "Museum passes & guided culture tours", subtitle: "GetYourGuide",
    body: "Curated culture and history experiences.",
    ctaLabel: "Browse tours", destinationUrl: "https://www.getyourguide.com/",
    category: "tours", tags: ["culture", "history"],
    targeting: [{ dimension: "interests", op: "contains_any", value: ["culture", "history"] }],
    priority: 80, surfaces: ["inline_day"], status: "live",
  },
  {
    id: "safetywing-insurance", partnerId: "safetywing",
    title: "Travel insurance before you go", subtitle: "SafetyWing",
    body: "Flexible coverage for your trip dates.",
    ctaLabel: "Get covered", destinationUrl: "https://safetywing.com/",
    category: "insurance", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 1 }],
    priority: 60, surfaces: ["post_generation", "pre_departure"], status: "live",
  },
  {
    id: "airalo-esim", partnerId: "airalo",
    title: "Stay connected with an eSIM", subtitle: "Airalo",
    body: "Data plans for 200+ destinations — install before departure.",
    ctaLabel: "Get an eSIM", destinationUrl: "https://www.airalo.com/",
    category: "esim", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 3 }],
    priority: 50, surfaces: ["pre_departure"], status: "live",
  },
  {
    id: "booking-stay", partnerId: "booking",
    title: "Find a place to stay", subtitle: "Booking.com",
    body: "Hotels and apartments for your dates.",
    ctaLabel: "Search stays", destinationUrl: "https://www.booking.com/",
    category: "accommodation", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 2 }],
    priority: 40, surfaces: ["stay_gap"], status: "live",
  },
  {
    id: "gyg-luxury-draft", partnerId: "getyourguide",
    title: "Private luxury experiences", subtitle: "GetYourGuide",
    body: "Premium private tours (draft — not yet live).",
    ctaLabel: "Explore", destinationUrl: "https://www.getyourguide.com/",
    category: "tours", tags: ["luxury"],
    targeting: [{ dimension: "budget", op: "in", value: ["luxury"] }],
    priority: 90, surfaces: ["post_generation"], status: "draft",
  },
];
