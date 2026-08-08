export type ModelAccess = "API" | "Open weights" | "App + API";
export type ModelTone = "lime" | "coral" | "blue" | "violet";

export interface Proof {
  label: string;
  value: string;
  note: string;
  url: string;
  source: string;
}

export interface Model {
  id: string;
  name: string;
  maker: string;
  mark: string;
  tone: ModelTone;
  type: string;
  access: ModelAccess;
  best: string;
  limits: string;
  tags: string[];
  context: string;
  price: string;
  modalities: string;
  license: string;
  scores: Partial<Record<string, number>>;
  keywords: string[];
  link: string;
  proofs: Proof[];
}

export interface Domain {
  id: string;
  icon: string;
  name: string;
  desc: string;
  areas: string[];
  example: string;
}

export interface PriorityOption {
  id: string;
  label: string;
}

export interface Recommendation {
  model: Model;
  score: number;
  reasons: string[];
  tradeoffs: string[];
}

export type AdvisorConfidence = "high" | "medium" | "low";

export interface AdvisorResponse {
  taskSummary: string;
  inferredDomain: string;
  confidence: AdvisorConfidence;
  assumptions: string[];
  recommendations: Recommendation[];
  analysisModel: string;
}
