import {
  ModelRouter, StubProvider, AnthropicProvider, OpenAIProvider, GeminiProvider, GrokProvider,
  type ProviderAdapter, type RoutingPolicy, type AiTask, type RouteTarget,
} from "@trip-itinerary/ai-orchestration";

declare const process: { env: Record<string, string | undefined> };

// Build the router from whatever keys are present (PRD §6.9). StubProvider is always
// added last so generation works offline.
export function getRouter(): ModelRouter {
  const providers: ProviderAdapter[] = [];
  if (process.env.ANTHROPIC_API_KEY)
    providers.push(new AnthropicProvider(process.env.ANTHROPIC_API_KEY, {
      frontier: "claude-3-7-sonnet-latest", mid: "claude-3-5-haiku-latest", small: "claude-3-5-haiku-latest" }));
  if (process.env.OPENAI_API_KEY)
    providers.push(new OpenAIProvider(process.env.OPENAI_API_KEY, {
      frontier: "gpt-4o", mid: "gpt-4o-mini", small: "gpt-4o-mini" }));
  if (process.env.GEMINI_API_KEY)
    providers.push(new GeminiProvider(process.env.GEMINI_API_KEY, {
      frontier: "gemini-2.5-pro", mid: "gemini-2.5-flash", small: "gemini-2.5-flash" }));
  if (process.env.XAI_API_KEY)
    providers.push(new GrokProvider(process.env.XAI_API_KEY, {
      frontier: "grok-2-latest", mid: "grok-2-latest", small: "grok-2-latest" }));

  const available = new Set(providers.map((p) => p.name));
  const firstReal = providers[0]?.name; // undefined when no keys -> stub handles it
  providers.push(new StubProvider());

  // Preferred routing (config). Tasks whose provider has no key fall back to the
  // first available real provider, so a single-provider setup just works.
  const preferred: RoutingPolicy = {
    itinerary_generate: { provider: "anthropic", model: "frontier" },
    day_regenerate:     { provider: "anthropic", model: "mid" },
    nl_edit:            { provider: "openai", model: "mid" },
    item_tagging:       { provider: "gemini", model: "small" },
    summarize:          { provider: "gemini", model: "small" },
    offer_copy:         { provider: "grok", model: "small" },
  };
  const resolve = (t: RouteTarget): RouteTarget =>
    available.has(t.provider) || !firstReal ? t : { provider: firstReal, model: t.model };
  const policy = Object.fromEntries(
    (Object.keys(preferred) as AiTask[]).map((task) => [task, resolve(preferred[task])]),
  ) as RoutingPolicy;

  return new ModelRouter(providers, policy);
}

// Provider names that have a key configured (for /health diagnostics; no secrets).
export function availableProviders(): string[] {
  const names: string[] = [];
  if (process.env.ANTHROPIC_API_KEY) names.push("anthropic");
  if (process.env.OPENAI_API_KEY) names.push("openai");
  if (process.env.GEMINI_API_KEY) names.push("gemini");
  if (process.env.XAI_API_KEY) names.push("grok");
  names.push("stub");
  return names;
}
