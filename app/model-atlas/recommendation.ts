import type { Model } from "./types";

const DOMAIN_LEADERS: Readonly<Record<string, readonly string[]>> = {
  finance: ["fable", "gpt", "claude", "grok", "sonar"],
  legal: ["fable", "claude", "sonnet", "gpt"],
  marketing: ["fable", "claude", "gemini", "sonnet"],
  manufacturing: ["gemini", "minimax", "nova", "gpt"],
  retail: ["gemini-flash", "gpt-luna", "sonnet", "command"],
  energy: ["gpt", "gemini", "fable", "glm"],
  agriculture: ["gemini", "gemini-flash", "minimax", "gemma"],
  government: ["command", "granite", "glm", "mistral"],
  operations: ["gpt", "sonnet", "fable", "gemini-flash"],
  hr: ["claude", "sonnet", "command", "mistral"],
};

const DOMAIN_SIGNALS: Readonly<Record<string, readonly string[]>> = {
  finance: ["financial", "reasoning", "document", "search"],
  legal: ["legal", "document", "citation", "long context"],
  marketing: ["creative", "vision", "video", "writing"],
  manufacturing: ["vision", "agent", "enterprise", "construction"],
  retail: ["fast", "high volume", "multilingual", "tools"],
  energy: ["research", "long context", "construction", "science"],
  agriculture: ["vision", "video", "multilingual", "research"],
  government: ["sovereign", "open weights", "enterprise", "multilingual"],
  operations: ["agents", "tools", "document", "enterprise"],
  hr: ["document", "multilingual", "balanced", "enterprise"],
};

export function scoreFor(model: Model, domainId: string): number {
  const explicitScore = model.scores[domainId];
  if (typeof explicitScore === "number") {
    return explicitScore;
  }

  const baseScore =
    model.tags.includes("Frontier") ||
    model.type.toLowerCase().includes("frontier")
      ? 89
      : model.access === "Open weights"
        ? 81
        : 85;
  const leaderRank = (DOMAIN_LEADERS[domainId] ?? []).indexOf(model.id);
  const leaderBoost = leaderRank >= 0 ? 8 - leaderRank : 0;
  const searchableText = [
    model.tags.join(" "),
    model.best,
    model.keywords.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  const signalBoost = (DOMAIN_SIGNALS[domainId] ?? []).filter((signal) =>
    searchableText.includes(signal),
  ).length;

  return Math.min(97, Math.round(baseScore + leaderBoost + signalBoost * 1.5));
}
