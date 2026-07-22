import type { Offer, Partner } from "@trip-itinerary/core";

// Seed catalog for the AI offer finder. Categories here line up with the need
// categories in @trip-itinerary/core `inferNeeds()` — accommodation, tours,
// activities, insurance, esim, transfer, car_hire, rail, lounge.
//
// NOTE: destinationUrl values are the partners' public homepages as placeholders.
// Replace them with your real affiliate deep links as each partner agreement is
// signed; click tracking and attribution already work regardless.
export const seedPartners: Partner[] = [
  { id: "viator", name: "Viator", category: "tours", status: "active" },
  { id: "getyourguide", name: "GetYourGuide", category: "tours", status: "active" },
  { id: "klook", name: "Klook", category: "activities", status: "active" },
  { id: "safetywing", name: "SafetyWing", category: "insurance", status: "active" },
  { id: "worldnomads", name: "World Nomads", category: "insurance", status: "active" },
  { id: "airalo", name: "Airalo", category: "esim", status: "active" },
  { id: "holafly", name: "Holafly", category: "esim", status: "active" },
  { id: "booking", name: "Booking.com", category: "accommodation", status: "active" },
  { id: "hostelworld", name: "Hostelworld", category: "accommodation", status: "active" },
  { id: "welcomepickups", name: "Welcome Pickups", category: "transfer", status: "active" },
  { id: "kiwitaxi", name: "Kiwitaxi", category: "transfer", status: "active" },
  { id: "discovercars", name: "Discover Cars", category: "car_hire", status: "active" },
  { id: "omio", name: "Omio", category: "rail", status: "active" },
  { id: "eurail", name: "Eurail", category: "rail", status: "active" },
  { id: "prioritypass", name: "Priority Pass", category: "lounge", status: "active" },
];

export const seedOffers: Offer[] = [
  // ---------------------------------------------------------------- tours
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
    body: "Curated culture and history experiences with skip-the-line entry.",
    ctaLabel: "Browse tours", destinationUrl: "https://www.getyourguide.com/",
    category: "tours", tags: ["culture", "history"],
    targeting: [{ dimension: "interests", op: "contains_any", value: ["culture", "history"] }],
    priority: 90, surfaces: ["inline_day", "post_generation"], status: "live",
  },
  {
    id: "gyg-food-tours", partnerId: "getyourguide",
    title: "Food tours & tasting experiences", subtitle: "GetYourGuide",
    body: "Local markets, street food walks and wine tastings led by local guides.",
    ctaLabel: "Find food tours", destinationUrl: "https://www.getyourguide.com/",
    category: "tours", tags: ["food"],
    targeting: [{ dimension: "interests", op: "contains_any", value: ["food"] }],
    priority: 88, surfaces: ["inline_day", "post_generation"], status: "live",
  },
  {
    id: "viator-family-tours", partnerId: "viator",
    title: "Family-friendly day trips", subtitle: "Viator",
    body: "Activities picked for travelling with children — shorter days, flexible timing.",
    ctaLabel: "See family trips", destinationUrl: "https://www.viator.com/",
    category: "tours", tags: ["family"],
    targeting: [{ dimension: "party", op: "in", value: ["family"] }],
    priority: 86, surfaces: ["post_generation"], status: "live",
  },
  {
    id: "gyg-luxury-private", partnerId: "getyourguide",
    title: "Private guided experiences", subtitle: "GetYourGuide",
    body: "Private guides and small-group premium tours.",
    ctaLabel: "Explore private tours", destinationUrl: "https://www.getyourguide.com/",
    category: "tours", tags: ["luxury"],
    targeting: [{ dimension: "budget", op: "in", value: ["luxury"] }],
    priority: 84, surfaces: ["post_generation"], status: "live",
  },

  // ----------------------------------------------------------- activities
  {
    id: "klook-attractions", partnerId: "klook",
    title: "Attraction tickets & city passes", subtitle: "Klook",
    body: "Discounted entry to major attractions, often cheaper than the gate price.",
    ctaLabel: "Browse tickets", destinationUrl: "https://www.klook.com/",
    category: "activities", tags: [],
    targeting: [], priority: 82, surfaces: ["post_generation", "inline_day"], status: "live",
  },
  {
    id: "klook-adventure", partnerId: "klook",
    title: "Outdoor & adventure activities", subtitle: "Klook",
    body: "Hiking, diving, kayaking and adrenaline experiences.",
    ctaLabel: "Find adventures", destinationUrl: "https://www.klook.com/",
    category: "activities", tags: ["adventure", "nature"],
    targeting: [{ dimension: "interests", op: "contains_any", value: ["adventure", "nature"] }],
    priority: 80, surfaces: ["post_generation"], status: "live",
  },
  {
    id: "gyg-nightlife", partnerId: "getyourguide",
    title: "Nightlife & evening experiences", subtitle: "GetYourGuide",
    body: "Bar crawls, night tours and live music experiences.",
    ctaLabel: "See nightlife", destinationUrl: "https://www.getyourguide.com/",
    category: "activities", tags: ["nightlife"],
    targeting: [{ dimension: "interests", op: "contains_any", value: ["nightlife"] }],
    priority: 74, surfaces: ["post_generation"], status: "live",
  },

  // ------------------------------------------------------------ insurance
  {
    id: "safetywing-insurance", partnerId: "safetywing",
    title: "Travel medical insurance", subtitle: "SafetyWing",
    body: "Flexible cover for your trip dates — subscribe monthly, cancel anytime.",
    ctaLabel: "Get covered", destinationUrl: "https://safetywing.com/",
    category: "insurance", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 1 }],
    priority: 78, surfaces: ["post_generation", "pre_departure"], status: "live",
  },
  {
    id: "worldnomads-adventure-cover", partnerId: "worldnomads",
    title: "Cover that includes adventure sports", subtitle: "World Nomads",
    body: "Insurance designed for active trips — hiking, diving and 200+ activities.",
    ctaLabel: "Get a quote", destinationUrl: "https://www.worldnomads.com/",
    category: "insurance", tags: ["adventure"],
    targeting: [{ dimension: "interests", op: "contains_any", value: ["adventure", "nature"] }],
    priority: 76, surfaces: ["pre_departure"], status: "live",
  },

  // ----------------------------------------------------------------- eSIM
  {
    id: "airalo-esim", partnerId: "airalo",
    title: "Stay connected with an eSIM", subtitle: "Airalo",
    body: "Data plans for 200+ destinations — install before you depart.",
    ctaLabel: "Get an eSIM", destinationUrl: "https://www.airalo.com/",
    category: "esim", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 3 }],
    priority: 72, surfaces: ["pre_departure"], status: "live",
  },
  {
    id: "holafly-unlimited", partnerId: "holafly",
    title: "Unlimited data eSIM", subtitle: "Holafly",
    body: "Unlimited data plans for longer trips, with 24/7 support.",
    ctaLabel: "See plans", destinationUrl: "https://esim.holafly.com/",
    category: "esim", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 7 }],
    priority: 70, surfaces: ["pre_departure"], status: "live",
  },

  // -------------------------------------------------------- accommodation
  {
    id: "booking-stay", partnerId: "booking",
    title: "Find a place to stay", subtitle: "Booking.com",
    body: "Hotels and apartments for your dates, with free cancellation on most rooms.",
    ctaLabel: "Search stays", destinationUrl: "https://www.booking.com/",
    category: "accommodation", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 1 }],
    priority: 96, surfaces: ["stay_gap", "post_generation"], status: "live",
  },
  {
    id: "booking-family-stays", partnerId: "booking",
    title: "Family rooms & apartments", subtitle: "Booking.com",
    body: "Places with kitchens, family rooms and space for everyone.",
    ctaLabel: "Search family stays", destinationUrl: "https://www.booking.com/",
    category: "accommodation", tags: ["family"],
    targeting: [{ dimension: "party", op: "in", value: ["family"] }],
    priority: 94, surfaces: ["stay_gap"], status: "live",
  },
  {
    id: "hostelworld-budget", partnerId: "hostelworld",
    title: "Hostels & budget stays", subtitle: "Hostelworld",
    body: "Private and dorm rooms, popular with solo travellers.",
    ctaLabel: "Find hostels", destinationUrl: "https://www.hostelworld.com/",
    category: "accommodation", tags: ["budget"],
    targeting: [{ dimension: "budget", op: "in", value: ["budget"] }],
    priority: 92, surfaces: ["stay_gap"], status: "live",
  },

  // -------------------------------------------------------------- transfer
  {
    id: "welcome-airport-pickup", partnerId: "welcomepickups",
    title: "Airport pickup with a local driver", subtitle: "Welcome Pickups",
    body: "Fixed price, meet-and-greet arrival — no queues or surge pricing.",
    ctaLabel: "Book a transfer", destinationUrl: "https://www.welcomepickups.com/",
    category: "transfer", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 2 }],
    priority: 68, surfaces: ["pre_departure"], status: "live",
  },
  {
    id: "kiwitaxi-transfers", partnerId: "kiwitaxi",
    title: "Private airport transfers", subtitle: "Kiwitaxi",
    body: "Door-to-door transfers in 100+ countries, booked in advance.",
    ctaLabel: "Check prices", destinationUrl: "https://kiwitaxi.com/",
    category: "transfer", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 2 }],
    priority: 66, surfaces: ["pre_departure"], status: "live",
  },

  // -------------------------------------------------------------- car hire
  {
    id: "discovercars-hire", partnerId: "discovercars",
    title: "Compare car hire deals", subtitle: "Discover Cars",
    body: "Compare suppliers in one search — useful for trips beyond the city.",
    ctaLabel: "Compare cars", destinationUrl: "https://www.discovercars.com/",
    category: "car_hire", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 6 }],
    priority: 62, surfaces: ["post_generation"], status: "live",
  },

  // ------------------------------------------------------------------ rail
  {
    id: "omio-trains", partnerId: "omio",
    title: "Trains, buses & ferries", subtitle: "Omio",
    body: "Compare and book intercity travel across Europe in one place.",
    ctaLabel: "Search routes", destinationUrl: "https://www.omio.com/",
    category: "rail", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 6 }],
    priority: 60, surfaces: ["post_generation"], status: "live",
  },
  {
    id: "eurail-pass", partnerId: "eurail",
    title: "Multi-country rail pass", subtitle: "Eurail",
    body: "One pass for multiple countries — good value on longer multi-city trips.",
    ctaLabel: "See passes", destinationUrl: "https://www.eurail.com/",
    category: "rail", tags: [],
    targeting: [{ dimension: "nights", op: "gte", value: 10 }],
    priority: 58, surfaces: ["post_generation"], status: "live",
  },

  // ---------------------------------------------------------------- lounge
  {
    id: "prioritypass-lounge", partnerId: "prioritypass",
    title: "Airport lounge access", subtitle: "Priority Pass",
    body: "1,700+ lounges worldwide — food, wi-fi and a quiet seat before your flight.",
    ctaLabel: "See membership", destinationUrl: "https://www.prioritypass.com/",
    category: "lounge", tags: ["luxury"],
    targeting: [{ dimension: "budget", op: "in", value: ["luxury", "mid"] }],
    priority: 56, surfaces: ["pre_departure"], status: "live",
  },

  // ------------------------------------------------------------ draft demo
  {
    id: "gyg-luxury-draft", partnerId: "getyourguide",
    title: "Private luxury experiences", subtitle: "GetYourGuide",
    body: "Premium private tours (draft — not yet live).",
    ctaLabel: "Explore", destinationUrl: "https://www.getyourguide.com/",
    category: "tours", tags: ["luxury"],
    targeting: [{ dimension: "budget", op: "in", value: ["luxury"] }],
    priority: 40, surfaces: ["post_generation"], status: "draft",
  },
];
