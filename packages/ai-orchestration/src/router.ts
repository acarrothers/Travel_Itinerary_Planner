import type { AiTask, ModelRequest, ModelResponse, ProviderAdapter, RoutingPolicy } from "./types";

// Default routing policy — overridable via config (PRD §6.9 illustrative table).
export const defaultPolicy: RoutingPolicy = {
  itinerary_generate: { provider: "anthropic", model: "frontier" },
  day_regenerate:     { provider: "anthropic", model: "mid" },
  nl_edit:            { provider: "anthropic", model: "mid" },
  item_tagging:       { provider: "openai",    model: "small" },
  summarize:          { provider: "anthropic", model: "small" },
  offer_copy:         { provider: "openai",    model: "small" },
};

export class ModelRouter {
  private providers = new Map<string, ProviderAdapter>();
  constructor(adapters: ProviderAdapter[], private policy: RoutingPolicy = defaultPolicy) {
    adapters.forEach((a) => this.providers.set(a.name, a));
  }

  // Route by task -> best-value model; fall back to any other provider on failure.
  async run(req: ModelRequest): Promise<ModelResponse> {
    const target = this.policy[req.task];
    const primary = this.providers.get(target.provider);
    try {
      if (!primary) throw new Error(`No provider: ${target.provider}`);
      return await primary.complete(req, target.model);
    } catch (err) {
      for (const [name, p] of this.providers) {
        if (name === target.provider) continue;
        try { return await p.complete(req, p.models[0]); } catch { /* try next */ }
      }
      throw err;
    }
  }

  setPolicy(task: AiTask, provider: string, model: string) { this.policy[task] = { provider, model }; }
}
