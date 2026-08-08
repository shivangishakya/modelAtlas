import { models } from "./catalog";
import { domains } from "./domains";
import type { Model, Recommendation } from "./types";

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

const DOMAIN_PATTERNS: readonly { id: string; pattern: RegExp }[] = [
  { id: "medical", pattern: /medical|patient|clinical|disease|health|diagnos/ },
  {
    id: "construction",
    pattern: /construct|drawing|blueprint|rfi|architect|site|building/,
  },
  { id: "finance", pattern: /bank|finance|investment|fraud|portfolio|filing/ },
  { id: "legal", pattern: /legal|law|contract|clause|discovery|compliance/ },
  {
    id: "manufacturing",
    pattern: /manufactur|factory|maintenance|quality inspection|supply chain/,
  },
  { id: "retail", pattern: /retail|catalog|product record|merchand|ecommerce/ },
  { id: "energy", pattern: /energy|utility|grid|power plant|renewable/ },
  { id: "agriculture", pattern: /crop|farm|agri|soil|livestock/ },
  {
    id: "government",
    pattern: /government|public sector|policy|citizen|sovereign/,
  },
  { id: "hr", pattern: /human resources|hiring|employee|workforce|recruit/ },
  {
    id: "operations",
    pattern: /workflow|operations|process|customer service/,
  },
  {
    id: "software",
    pattern: /code|software|debug|typescript|python|api|cyber/,
  },
  { id: "marketing", pattern: /campaign|marketing|sales|brand|content/ },
  { id: "creative", pattern: /write|creative|video|story|design/ },
];

function contextWindowInThousands(context: string): number {
  const size = Number.parseFloat(context);
  return context.toUpperCase().includes("M") ? size * 1_000 : size;
}

function getCostPriorityAdjustment(model: Model): number {
  if (model.access === "Open weights") {
    return 8;
  }

  return model.id === "mistral" ? 9 : -3;
}

export function inferDomain(text: string): string {
  const query = text.toLowerCase();
  return (
    DOMAIN_PATTERNS.find(({ pattern }) => pattern.test(query))?.id ?? "research"
  );
}

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

export function getRecommendations(
  text: string,
  priorities: readonly string[],
): Recommendation[] {
  const query = text.toLowerCase();
  const inferredDomain = inferDomain(text);
  const domainName =
    domains.find((domain) => domain.id === inferredDomain)?.name ??
    inferredDomain;

  return models
    .map((model) => {
      const editorialFit = scoreFor(model, inferredDomain);
      const matchedKeywords = model.keywords.filter((keyword) =>
        query.includes(keyword),
      );
      let score = editorialFit * 0.55 + 25;

      score += Math.min(matchedKeywords.length * 5, 15);

      if (priorities.includes("privacy")) {
        score += model.access === "Open weights" ? 18 : -9;
      }
      if (priorities.includes("vision")) {
        score += /image|video/.test(model.modalities.toLowerCase()) ? 11 : -7;
      }
      if (
        priorities.includes("long") &&
        contextWindowInThousands(model.context) >= 256
      ) {
        score += 9;
      }
      if (priorities.includes("cost")) {
        score += getCostPriorityAdjustment(model);
      }
      if (priorities.includes("multilingual")) {
        score += model.tags.includes("Multilingual")
          ? 12
          : model.id === "gemini"
            ? 7
            : 0;
      }

      const reasons = [
        `${editorialFit}/100 editorial fit for ${domainName}`,
        matchedKeywords.length > 0
          ? `Matched: ${matchedKeywords.slice(0, 3).join(", ")}`
          : model.best,
      ];

      if (priorities.includes("privacy") && model.access === "Open weights") {
        reasons.push("Can be self-hosted for greater data control");
      }

      return {
        model,
        score: Math.min(99, Math.round(score)),
        reasons,
        inferredDomain,
      };
    })
    .sort((first, second) => second.score - first.score);
}
