import { PILLARS } from "./pillars";
import { suggestServices } from "./cloudCatalog";

// ─── Engagement templates ────────────────────────────────────────────
//
// Each template pre-fills workloads and an optional starter pack so a new
// engagement opens with the right scaffolding instead of a blank page.

export const ENGAGEMENT_TYPES = [
  {
    key: "migration",
    label: "Migration",
    description: "Rehost / replatform existing workloads (6R assessment, waves, cutover).",
    workloads: ["Landing Zone", "Wave 1 Apps", "Wave 2 Apps", "Data Migration", "Cutover"],
    requirements: [
      "Inventory and classify every in-scope application by 6R strategy",
      "Define migration waves with business-approved cutover windows",
      "Retain existing on-prem identity integration during transition",
    ],
    raid: [
      { raidType: "assumption", title: "Application owners are available for wave testing" },
      { raidType: "dependency", title: "Network team provisions private connectivity before Wave 1" },
      { raidType: "risk", title: "Undocumented dependencies between legacy apps", impact: "high", likelihood: "medium" },
    ],
  },
  {
    key: "modernization",
    label: "App Modernization",
    description: "Refactor to containers / PaaS / serverless with CI/CD.",
    workloads: ["Platform", "Frontend", "APIs", "Data", "Integration"],
    requirements: [
      "Decompose the monolith into independently deployable services",
      "Zero-downtime deployments for customer-facing services",
      "Self-service environments for development teams",
    ],
    raid: [
      { raidType: "assumption", title: "Teams have container and IaC skills or will be upskilled" },
      { raidType: "risk", title: "Shared database blocks service decomposition", impact: "high", likelihood: "high" },
    ],
  },
  {
    key: "greenfield",
    label: "Greenfield",
    description: "New cloud-native solution designed from scratch.",
    workloads: ["Landing Zone", "Application", "Data", "Analytics"],
    requirements: [
      "MVP live for pilot users within the agreed timeline",
      "Support for multiple tenants with data isolation",
    ],
    raid: [
      { raidType: "assumption", title: "Product requirements are stable for MVP scope" },
    ],
  },
  {
    key: "landing_zone",
    label: "Landing Zone",
    description: "Foundational governance, identity, networking and security baseline.",
    workloads: ["Identity", "Networking", "Governance", "Security", "Management"],
    requirements: [
      "Hub-and-spoke network topology with centralized egress inspection",
      "Policy guardrails enforcing tagging, allowed regions and SKUs",
      "Separate subscriptions/accounts/projects for prod and non-prod",
    ],
    raid: [
      { raidType: "dependency", title: "Security team signs off on the policy baseline" },
    ],
  },
  {
    key: "data_ai",
    label: "Data & AI",
    description: "Data platform, analytics and AI/ML workloads.",
    workloads: ["Ingestion", "Lakehouse", "Analytics", "ML / AI", "Governance"],
    requirements: [
      "Single governed source of truth for reporting",
      "Lineage and access control on sensitive datasets",
    ],
    raid: [
      { raidType: "risk", title: "Source data quality unknown until profiling", impact: "high", likelihood: "medium" },
    ],
  },
  {
    key: "poc",
    label: "Proof of Concept",
    description: "Time-boxed validation of a specific technical hypothesis.",
    workloads: ["PoC"],
    requirements: ["Success criteria agreed and signed off before build starts"],
    raid: [{ raidType: "assumption", title: "PoC environment does not need production-grade controls" }],
  },
];

// Baseline landing-zone components for the primary cloud.
const BASELINE_LAYERS = ["Identity", "Security", "Edge & Network", "Observability", "DevOps"];

// Builds batch-create entries for the starter pack.
export function starterItems(template, { clouds, includeNfrs, includeComponents, includeTemplate }) {
  const primary = clouds[0] || "Azure";
  const workload = template.workloads[0];
  const entries = [];

  if (includeTemplate) {
    for (const title of template.requirements) {
      entries.push({ type: "requirement", title, module: workload, status: "proposed", type_fields: { category: "business", priority: "must" } });
    }
    for (const r of template.raid) {
      entries.push({ type: "risk", title: r.title, module: workload, status: "open", type_fields: { raidType: r.raidType, impact: r.impact || "medium", likelihood: r.likelihood || "medium" } });
    }
  }
  if (includeNfrs) {
    for (const p of PILLARS) {
      for (const km of p.keyMetrics) {
        entries.push({ type: "nfr", title: km.metric, module: workload, status: "draft", type_fields: { pillar: p.key, metric: km.metric, target: km.target, priority: "should" } });
      }
    }
  }
  if (includeComponents) {
    for (const layer of BASELINE_LAYERS) {
      const service = suggestServices(primary, layer)[0];
      if (service) entries.push({ type: "component", title: service, module: workload, status: "proposed", type_fields: { provider: primary, layer, service } });
    }
  }
  return entries;
}
