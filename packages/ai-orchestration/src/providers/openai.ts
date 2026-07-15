import type { ProviderAdapter, ModelRequest, ModelResponse } from "../types";

// Real adapter: calls the OpenAI Chat Completions API over fetch. Kept alongside
// Anthropic to prove model-flexibility and enable failover (PRD §6.9).
export class OpenAIProvider implements ProviderAdapter {
  name = "openai";
  models: string[];
  constructor(private apiKey: string, private modelMap: Record<string, string>) {
    this.models = Object.keys(modelMap);
  }
  async complete(req: ModelRequest, model: string): Promise<ModelResponse> {
    const started = Date.now();
    const modelId = this.modelMap[model] ?? model;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: req.prompt }] }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data: any = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    return {
      text, provider: this.name, model: modelId, latencyMs: Date.now() - started,
      usage: { inputTokens: data?.usage?.prompt_tokens ?? 0, outputTokens: data?.usage?.completion_tokens ?? 0 },
    };
  }
}
