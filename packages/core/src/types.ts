// Domain model — the contract between the planner and the offers engine.
// Mirrors PRD §10 (Application data model). The `categoryTags` on Item plus the
// trip-level signals are the join key used by the offers engine (PRD §7).

export type BudgetBand = "budget" | "mid" | "luxury";
export type Pace = "relaxed" | "balanced" | "packed";
export type PartyType = "solo" | "couple" | "family" | "friends";
export type ItemType = "activity" | "meal" | "transit" | "lodging" | "custom";

export interface GeoPoint { lat: number; lng: number; }

export interface TripPreferences {
  destinations: string[];
  startDate?: string;   // ISO; optional when flexible
  endDate?: string;
  flexibleMonth?: string;
  nights: number;
  party: PartyType;
  adults: number;
  children: number;
  budget: BudgetBand;
  interests: string[];  // food, culture, adventure, nightlife, nature, ...
  pace: Pace;
  originCity?: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description?: string;
  time?: string;            // e.g. "09:30"
  location?: string;
  coords?: GeoPoint;
  categoryTags: string[];   // join key to offer targeting
  costBand?: BudgetBand;
  notes?: string;
}

export interface Day { id: string; date?: string; order: number; weather?: string; items: Item[]; }

export interface Trip {
  id: string;
  userId?: string;
  preferences: TripPreferences;
  days: Day[];
  createdAt: string;
  updatedAt: string;
}

// ---- Signals & offers (PRD §7–§9) ----
export interface TripSignals {
  destinations: string[];
  month?: string;
  nights: number;
  party: PartyType;
  budget: BudgetBand;
  interests: string[];
  itemTags: string[];
}

export type OfferSurface =
  | "post_generation" | "inline_day" | "map_context" | "stay_gap" | "pre_departure" | "email_push";

export interface TargetingRule {
  dimension: "destination" | "month" | "nights" | "party" | "budget" | "interests" | "surface";
  op: "is" | "in" | "contains_any" | "gte" | "lte" | "between";
  value: unknown;
}

export interface Offer {
  id: string;
  partnerId: string;        // e.g. "viator"
  title: string;
  subtitle?: string;
  body?: string;
  creativeUrl?: string;
  ctaLabel: string;
  destinationUrl: string;   // affiliate landing (tracking params appended at click)
  category: string;         // tours, accommodation, insurance, esim, ...
  tags: string[];
  targeting: TargetingRule[];
  priority: number;
  surfaces: OfferSurface[];
  frequencyCap?: number;
  status: "draft" | "pending" | "live" | "paused" | "expired";
}

// A point of interest used to ground generation (PRD §6.9). Sourced from Foursquare
// (decided) with curated/open data as alternatives. `tags` feed item categoryTags.
export interface Poi {
  id: string;
  name: string;
  category: string;
  tags: string[];
  coords?: GeoPoint;
  address?: string;
}

// Offer funnel events for attribution (PRD §7.5, §13). impression -> click -> conversion.
export type OfferEventType = "impression" | "click" | "conversion";

export interface OfferEvent {
  id: string;
  offerId: string;
  partnerId?: string;
  tripId?: string;
  type: OfferEventType;
  surface?: OfferSurface;
  commissionUsd?: number; // set on conversion
  timestamp: string;
}

export interface OfferReportRow {
  offerId: string;
  partnerId?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;            // clicks / impressions
  conversionRate: number; // conversions / clicks
  revenueUsd: number;
  epcUsd: number;         // revenue / clicks
}

// A managed partner in the CMS (PRD §9.2). Offers belong to a partner.
export interface Partner {
  id: string;
  name: string;
  category: string;
  status: "active" | "paused";
  logoUrl?: string;
}
