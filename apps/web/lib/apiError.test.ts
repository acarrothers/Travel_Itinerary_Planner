import { describe, it, expect } from "vitest";
import { describeApiError } from "./apiError";

const BASE = "https://api.example.com";

describe("describeApiError()", () => {
  it("names the locked-CMS case so the fix is obvious", () => {
    const msg = describeApiError({ status: 503, body: { error: "admin_not_configured" } }, BASE);
    expect(msg).toContain("APP_API_KEYS");
  });

  it("distinguishes auth failures", () => {
    expect(describeApiError({ status: 401 }, BASE)).toContain("Unauthorized");
    expect(describeApiError({ status: 403, body: { role: "analyst" } }, BASE)).toContain("analyst");
  });

  it("points a 404 at the base-URL misconfiguration that causes it", () => {
    const msg = describeApiError({ status: 404 }, BASE);
    expect(msg).toContain(BASE);
    expect(msg).toContain("NEXT_PUBLIC_API_BASE_URL");
  });

  it("surfaces the base URL when the request never completed", () => {
    // The old handler said "run the API locally" here, which is wrong in prod.
    const msg = describeApiError({ message: "Failed to fetch" }, BASE);
    expect(msg).toContain(BASE);
    expect(msg).toContain("Failed to fetch");
    expect(msg).not.toContain("pnpm");
  });

  it("falls back to the status code for unexpected errors", () => {
    expect(describeApiError({ status: 500, message: "boom" }, BASE)).toContain("500");
  });
});
