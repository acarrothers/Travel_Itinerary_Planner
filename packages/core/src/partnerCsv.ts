import type { Partner } from "./types";

// Parse the partner onboarding sheet into Partner records. Column headers match
// the reference file:
//   ID, Brand, Service_Product_Type, Category, Sub_Category, Offer_Level,
//   Offer_API, Offer_API_Link, Affiliate_Program
// Header matching is case-insensitive and tolerant of spaces/underscores, so a
// re-exported sheet with slightly different casing still imports.

export interface PartnerCsvResult {
  partners: Partner[];
  errors: string[]; // per-row problems; parsing never throws
}

/** Slugify a brand name into a stable partner id ("Booking.com" -> "booking-com"). */
export function partnerSlug(brand: string): string {
  return brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const norm = (h: string) => h.trim().toLowerCase().replace(/[\s_]+/g, "");
const yes = (v: string | undefined) => /^(yes|y|true|1)$/i.test((v ?? "").trim());

// A minimal RFC-4180-ish splitter: handles quoted fields and embedded commas.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parsePartnerCsv(csv: string): PartnerCsvResult {
  const errors: string[] = [];
  const lines = csv.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { partners: [], errors: ["CSV has no data rows."] };

  const header = splitCsvLine(lines[0]).map(norm);
  const col = (name: string) => header.indexOf(norm(name));
  const iBrand = col("Brand");
  if (iBrand === -1) return { partners: [], errors: ["Missing required 'Brand' column."] };

  const iService = col("Service_Product_Type");
  const iCategory = col("Category");
  const iSub = col("Sub_Category");
  const iLevel = col("Offer_Level");
  const iApiLink = col("Offer_API_Link");
  const iAffiliate = col("Affiliate_Program");

  const seen = new Set<string>();
  const partners: Partner[] = [];

  for (let r = 1; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r]);
    const brand = (cells[iBrand] ?? "").trim();
    if (!brand) { errors.push(`Row ${r + 1}: blank Brand — skipped.`); continue; }

    const id = partnerSlug(brand);
    if (seen.has(id)) { errors.push(`Row ${r + 1}: duplicate brand "${brand}" — skipped.`); continue; }
    seen.add(id);

    const levelRaw = (cells[iLevel] ?? "").trim().toLowerCase();
    // Tolerate the "Gobal" typo seen in the source sheet.
    const offerLevel = /gl?obal/.test(levelRaw) ? "global" : levelRaw.startsWith("loc") ? "local" : undefined;

    partners.push({
      id,
      name: brand,
      category: (iCategory >= 0 ? cells[iCategory] : "") || "other",
      status: "active",
      serviceType: iService >= 0 ? cells[iService] || undefined : undefined,
      subCategory: iSub >= 0 ? cells[iSub] || undefined : undefined,
      offerLevel,
      affiliateProgram: iAffiliate >= 0 ? yes(cells[iAffiliate]) : undefined,
      offerApiLink: iApiLink >= 0 ? cells[iApiLink] || undefined : undefined,
    });
  }

  return { partners, errors };
}
