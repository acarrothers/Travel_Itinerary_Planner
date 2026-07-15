import type { OfferEvent, OfferReportRow } from "./types";

const ratio = (n: number, d: number) => (d > 0 ? n / d : 0);

// Aggregate raw funnel events into per-offer reporting rows (PRD §13 / CMS §9.5).
export function summarizeOfferEvents(events: OfferEvent[]): OfferReportRow[] {
  const byOffer = new Map<string, OfferEvent[]>();
  for (const e of events) {
    const list = byOffer.get(e.offerId) ?? [];
    list.push(e);
    byOffer.set(e.offerId, list);
  }
  const rows: OfferReportRow[] = [];
  for (const [offerId, list] of byOffer) {
    const impressions = list.filter((e) => e.type === "impression").length;
    const clicks = list.filter((e) => e.type === "click").length;
    const convs = list.filter((e) => e.type === "conversion");
    const revenueUsd = convs.reduce((s, e) => s + Number(e.commissionUsd ?? 0), 0);
    rows.push({
      offerId,
      partnerId: list.find((e) => e.partnerId)?.partnerId,
      impressions, clicks, conversions: convs.length,
      ctr: ratio(clicks, impressions),
      conversionRate: ratio(convs.length, clicks),
      revenueUsd,
      epcUsd: ratio(revenueUsd, clicks),
    });
  }
  return rows.sort((a, b) => b.revenueUsd - a.revenueUsd);
}
