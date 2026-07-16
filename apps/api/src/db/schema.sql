-- Trip Itinerary Planner trips. JSONB keeps the scaffold simple; normalize into days/items later.
CREATE TABLE IF NOT EXISTS trips (
  id          TEXT PRIMARY KEY,
  user_id     TEXT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trips_user_idx ON trips (user_id);

-- Offer funnel events for attribution (PRD 7.5 / 13).
CREATE TABLE IF NOT EXISTS offer_events (
  id             TEXT PRIMARY KEY,
  offer_id       TEXT NOT NULL,
  partner_id     TEXT,
  trip_id        TEXT,
  type           TEXT NOT NULL,
  surface        TEXT,
  commission_usd NUMERIC,
  ts             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS offer_events_offer_idx ON offer_events (offer_id);

-- CMS catalog (PRD 9.2): partners and offers, queried as JSONB.
CREATE TABLE IF NOT EXISTS partners (
  id    TEXT PRIMARY KEY,
  data  JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS offers (
  id          TEXT PRIMARY KEY,
  partner_id  TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft',
  data        JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS offers_status_idx ON offers (status);
