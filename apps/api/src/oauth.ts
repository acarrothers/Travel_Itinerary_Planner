import { createRemoteJWKSet, jwtVerify } from "jose";

declare const process: { env: Record<string, string | undefined> };

export type SsoProvider = "google" | "apple";

// Issuer + JWKS per provider; audience is the app's client id (configured via env).
const CONFIG: Record<SsoProvider, { issuer: string | string[]; jwks: string; aud: () => string | undefined }> = {
  google: {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    jwks: "https://www.googleapis.com/oauth2/v3/certs",
    aud: () => process.env.GOOGLE_CLIENT_ID,
  },
  apple: {
    issuer: "https://appleid.apple.com",
    jwks: "https://appleid.apple.com/auth/keys",
    aud: () => process.env.APPLE_CLIENT_ID, // Apple Services ID
  },
};

const jwks: Partial<Record<SsoProvider, ReturnType<typeof createRemoteJWKSet>>> = {};

// Verify a provider ID token (JWT) and return the verified email + subject.
export async function verifyProviderToken(provider: SsoProvider, idToken: string): Promise<{ email: string; sub: string }> {
  const cfg = CONFIG[provider];
  if (!cfg) throw new Error("unsupported provider");
  const audience = cfg.aud();
  if (!audience) throw new Error(`${provider} SSO not configured (missing client id)`);
  jwks[provider] ??= createRemoteJWKSet(new URL(cfg.jwks));
  const { payload } = await jwtVerify(idToken, jwks[provider]!, { issuer: cfg.issuer, audience });
  const email = typeof payload.email === "string" ? payload.email : "";
  if (!email) throw new Error("no email in token");
  return { email, sub: String(payload.sub) };
}
