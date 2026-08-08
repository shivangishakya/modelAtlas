import type { Domain, PriorityOption } from "./types";

export const domains: readonly Domain[] = [
  {
    id: "medical",
    icon: "✚",
    name: "Medical & Health",
    desc: "Clinical support, research, operations",
    areas: [
      "Clinical decision support",
      "Medical imaging review",
      "Patient education",
      "Literature synthesis",
    ],
    example:
      "Summarize a longitudinal record and flag missing evidence—always reviewed by a licensed clinician.",
  },
  {
    id: "software",
    icon: "⌘",
    name: "Technology",
    desc: "Engineering, data, cybersecurity",
    areas: [
      "Software engineering",
      "Data analysis",
      "Security review",
      "Product research",
    ],
    example:
      "Trace a failing integration test across a repository and propose a minimal, testable patch.",
  },
  {
    id: "construction",
    icon: "▰",
    name: "Construction",
    desc: "Planning, design, field operations",
    areas: [
      "Drawing & image review",
      "Bid document analysis",
      "Safety planning",
      "Schedule risk",
    ],
    example:
      "Compare plan sheets with a specification package and draft an RFI for inconsistencies.",
  },
  {
    id: "creative",
    icon: "✦",
    name: "Creative Work",
    desc: "Writing, design, media",
    areas: [
      "Campaign concepts",
      "Editorial writing",
      "Visual ideation",
      "Video pre-production",
    ],
    example:
      "Turn a product brief into three campaign territories with channel-ready copy.",
  },
  {
    id: "research",
    icon: "◫",
    name: "Research & Education",
    desc: "Discovery, synthesis, tutoring",
    areas: [
      "Evidence synthesis",
      "Data interpretation",
      "Adaptive tutoring",
      "Grant research",
    ],
    example:
      "Build a sourced evidence map that separates findings, uncertainty and open questions.",
  },
  {
    id: "finance",
    icon: "$",
    name: "Finance & Banking",
    desc: "Analysis, risk, operations",
    areas: [
      "Financial document analysis",
      "Fraud & anomaly review",
      "Investment research",
      "Regulatory reporting",
    ],
    example:
      "Compare quarterly filings, trace every claim to a source, and produce a risk memo for analyst review.",
  },
  {
    id: "legal",
    icon: "§",
    name: "Legal Services",
    desc: "Discovery, contracts, research",
    areas: [
      "Contract review",
      "Legal research",
      "E-discovery triage",
      "Compliance mapping",
    ],
    example:
      "Extract obligations from a contract set and create a clause-by-clause review table with citations.",
  },
  {
    id: "marketing",
    icon: "◆",
    name: "Marketing & Sales",
    desc: "Campaigns, content, intelligence",
    areas: [
      "Campaign strategy",
      "Customer research",
      "Sales enablement",
      "Content operations",
    ],
    example:
      "Synthesize interview transcripts into audience segments and draft evidence-based campaign territories.",
  },
  {
    id: "manufacturing",
    icon: "⚙",
    name: "Manufacturing",
    desc: "Quality, maintenance, supply chain",
    areas: [
      "Visual quality inspection",
      "Maintenance support",
      "Process documentation",
      "Supply-chain risk",
    ],
    example:
      "Analyze equipment manuals and inspection images to draft a technician checklist for expert approval.",
  },
  {
    id: "retail",
    icon: "◇",
    name: "Retail & Commerce",
    desc: "Catalogs, service, forecasting",
    areas: [
      "Catalog enrichment",
      "Customer support",
      "Demand analysis",
      "Merchandising",
    ],
    example:
      "Classify and enrich 50,000 product records while flagging low-confidence attributes for review.",
  },
  {
    id: "energy",
    icon: "⌁",
    name: "Energy & Utilities",
    desc: "Assets, compliance, operations",
    areas: [
      "Asset documentation",
      "Grid & demand analysis",
      "Field-service support",
      "Regulatory research",
    ],
    example:
      "Synthesize inspection records and sensor summaries into a prioritized maintenance briefing.",
  },
  {
    id: "agriculture",
    icon: "♧",
    name: "Agriculture",
    desc: "Crop, equipment, supply",
    areas: [
      "Crop image analysis",
      "Agronomy research",
      "Equipment support",
      "Supply forecasting",
    ],
    example:
      "Analyze crop images and field notes to highlight anomalies for an agronomist—not diagnose autonomously.",
  },
  {
    id: "government",
    icon: "▥",
    name: "Government & Public",
    desc: "Services, policy, sovereignty",
    areas: [
      "Policy analysis",
      "Citizen services",
      "Records processing",
      "Sovereign deployment",
    ],
    example:
      "Summarize public consultation submissions with traceable themes, dissenting views and source references.",
  },
  {
    id: "operations",
    icon: "↻",
    name: "Business Operations",
    desc: "Workflow, service, knowledge",
    areas: [
      "Process automation",
      "Knowledge management",
      "Customer operations",
      "Document processing",
    ],
    example:
      "Turn a complex operating procedure into a supervised workflow with approvals and exception handling.",
  },
  {
    id: "hr",
    icon: "◉",
    name: "People & HR",
    desc: "Learning, talent, policy",
    areas: [
      "Learning content",
      "Policy Q&A",
      "Workforce analysis",
      "Recruiting support",
    ],
    example:
      "Draft a skills-gap analysis from anonymized role data without making employment decisions.",
  },
];
export const caution: Readonly<Record<string, string>> = {
  medical:
    "Not a medical device or clinician. Use approved, privacy-safe systems; require expert review and source verification.",
  software:
    "Generated code can be insecure or subtly wrong. Run tests, scans and human review before deployment.",
  construction:
    "Never use unverified output as stamped design, code compliance or site-safety instruction.",
  creative:
    "Check originality, rights, brand voice and factual claims before publishing.",
  research:
    "Models can fabricate citations and flatten disagreement. Open every source and inspect the underlying evidence.",
  finance:
    "Not financial advice. Require qualified review, source verification, audit trails and applicable controls.",
  legal:
    "Not legal advice. Privilege, confidentiality, jurisdiction and attorney review must be handled explicitly.",
  marketing:
    "Review claims, rights, bias, brand safety and disclosure requirements before publication.",
  manufacturing:
    "Do not use model output as an unsupervised safety, maintenance or quality-control decision.",
  retail:
    "Test for product-data errors, unfair personalization and privacy issues before customer-facing use.",
  energy:
    "Do not connect unvalidated model output directly to critical infrastructure or operational controls.",
  agriculture:
    "Image patterns are not a diagnosis. An agronomist should validate recommendations against field conditions.",
  government:
    "Public-sector deployments require accessibility, records, privacy, procurement and due-process review.",
  operations:
    "Keep approvals and deterministic controls around payments, account changes and other consequential actions.",
  hr: "Never allow a model to make autonomous hiring, promotion, discipline or termination decisions.",
};
export const presets: readonly string[] = [
  "Review 300 pages of construction drawings and draft RFIs",
  "Help a clinician summarize research on a rare disease",
  "Refactor a TypeScript codebase with tests",
  "Analyze interview videos and create a research brief",
];
export const priorityDefs: readonly PriorityOption[] = [
  { id: "privacy", label: "Private / self-hosted" },
  { id: "vision", label: "Images or video" },
  { id: "long", label: "Long documents" },
  { id: "cost", label: "Lower cost" },
  { id: "multilingual", label: "Multilingual" },
];
