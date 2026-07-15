// Model orchestration layer (PRD §6.9): provider-agnostic, cost-aware routing.
export type AiTask =
  | "itinerary_generate"   // frontier / large
  | "day_regenerate"       // mid-tier
  | "nl_edit"              // mid-tier
  | "item_tagging"         // small / embeddings
  | "summarize"            // small
  | "offer_copy";          // small-mid

export interface ModelRequest { task: AiTask; prompt: string; context?: unknown; maxTokens?: number; stream?: boolean; }
export interface ModelResponse { text: string; provider: string; model: string; usage?: { inputTokens: number; outputTokens: number; costUsd?: number }; latencyMs?: number; }

export interface ProviderAdapter {
  name: string;
  models: string[];
  complete(req: ModelRequest, model: string): Promise<ModelResponse>;
}

// Routing policy is CONFIG, not code (PRD §6.9): task -> { provider, model }.
export interface RouteTarget { provider: string; model: string; }
export type RoutingPolicy = Record<AiTask, RouteTarget>;
