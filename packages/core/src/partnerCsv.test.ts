import { describe, it, expect } from "vitest";
import { parsePartnerCsv, partnerSlug } from "./partnerCsv";

const HEADER = "ID,Brand,Service_Product_Type,Category,Sub_Category,Offer_Level,Offer_API,Offer_API_Link,Affiliate_Program";

describe("partnerSlug()", () => {
  it("makes stable ids from brand names", () => {
    expect(partnerSlug("Booking.com")).toBe("booking-com");
    expect(partnerSlug("G Adventures")).toBe("g-adventures");
    expect(partnerSlug("Viator")).toBe("viator");
  });
});

describe("parsePartnerCsv()", () => {
  it("parses a row into a Partner with mapped fields", () => {
    const csv = `${HEADER}\n1,Expedia,Hotels & Property Bookings,Travel Booking,Accommodations,Global,Yes,https://x/docs,Yes`;
    const { partners, errors } = parsePartnerCsv(csv);
    expect(errors).toEqual([]);
    expect(partners[0]).toEqual({
      id: "expedia", name: "Expedia", category: "Travel Booking", status: "active",
      serviceType: "Hotels & Property Bookings", subCategory: "Accommodations",
      offerLevel: "global", affiliateProgram: true, offerApiLink: "https://x/docs",
    });
  });

  it("maps Yes/No to booleans and normalizes offer level", () => {
    const csv = `${HEADER}\n12,GetYourGuide,Tours,Local Experiences,Tours & Activities,Local,Yes,,Yes`;
    const p = parsePartnerCsv(csv).partners[0];
    expect(p.offerLevel).toBe("local");
    expect(p.affiliateProgram).toBe(true);
    expect(p.offerApiLink).toBeUndefined();
  });

  it("tolerates the 'Gobal' typo from the source sheet", () => {
    const csv = `${HEADER}\n18,Chatr,Travel eSIM,Connectivity,Travel eSIM,Gobal,No,,No`;
    const p = parsePartnerCsv(csv).partners[0];
    expect(p.offerLevel).toBe("global");
    expect(p.affiliateProgram).toBe(false);
  });

  it("handles quoted fields containing commas", () => {
    const csv = `${HEADER}\n1,"Acme, Inc.",Tours,"Local, Experiences",Sub,Local,No,,Yes`;
    const p = parsePartnerCsv(csv).partners[0];
    expect(p.name).toBe("Acme, Inc.");
    expect(p.category).toBe("Local, Experiences");
  });

  it("skips blank and duplicate brands, reporting each", () => {
    const csv = `${HEADER}\n1,Viator,Tours,Local Experiences,T,Local,Yes,,Yes\n2,,x,y,z,Global,No,,No\n3,Viator,Tours,Local Experiences,T,Local,Yes,,Yes`;
    const { partners, errors } = parsePartnerCsv(csv);
    expect(partners).toHaveLength(1);
    expect(errors).toHaveLength(2); // one blank, one duplicate
  });

  it("errors clearly when the Brand column is missing", () => {
    expect(parsePartnerCsv("ID,Name\n1,x").errors[0]).toMatch(/Brand/);
  });
});
