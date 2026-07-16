declare const process: { env: Record<string, string | undefined> };

// Sends via Resend if RESEND_API_KEY is set; otherwise logs the message (dev),
// so verification/reset links are visible in the API console without a provider.
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Trip Itinerary Planner <onboarding@resend.dev>";
  if (!key) {
    console.log(`\n[email:dev] to=${to}\n[email:dev] subject=${subject}\n[email:dev] ${text}\n`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) console.warn(`[email] send failed: ${res.status}`);
  } catch (e) {
    console.warn("[email] send error:", (e as Error).message);
  }
}
