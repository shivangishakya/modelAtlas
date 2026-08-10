import type { Model } from "./types";
import { domainLeaders, domainSignals } from "./domains";

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
  const leaderRank = (domainLeaders[domainId] ?? []).indexOf(model.id);
  const leaderBoost = leaderRank >= 0 ? 8 - leaderRank : 0;
  const searchableText = [
    model.tags.join(" "),
    model.best,
    model.keywords.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  const signalBoost = (domainSignals[domainId] ?? []).filter((signal) =>
    searchableText.includes(signal),
  ).length;

  return Math.min(97, Math.round(baseScore + leaderBoost + signalBoost * 1.5));
}
