// ─── Well-Architected Pillars (common to Azure / AWS / GCP) ──────────
//
// The five pillars shared by all three providers' frameworks. Each pillar
// lists the key metrics an engagement is expected to pin down; the health
// engine flags any that no NFR covers.

export const PILLARS = [
  {
    key: "reliability",
    label: "Reliability",
    short: "REL",
    color: "bg-sky-100 text-sky-800",
    bar: "bg-sky-500",
    keyMetrics: [
      { metric: "Availability SLA", target: "≥ 99.9% monthly", match: /availab|sla|uptime/i },
      { metric: "RTO", target: "≤ 4 hours", match: /\brto\b|recovery time/i },
      { metric: "RPO", target: "≤ 15 minutes", match: /\brpo\b|recovery point|data loss/i },
    ],
  },
  {
    key: "security",
    label: "Security",
    short: "SEC",
    color: "bg-rose-100 text-rose-800",
    bar: "bg-rose-500",
    keyMetrics: [
      { metric: "Identity & access", target: "SSO + MFA for all users; least-privilege RBAC", match: /identity|mfa|sso|rbac|access/i },
      { metric: "Data encryption", target: "Encrypted at rest (CMK) and in transit (TLS 1.2+)", match: /encrypt|tls|kms|cmk/i },
      { metric: "Compliance", target: "e.g. SOC 2 / ISO 27001 / PIPEDA controls mapped", match: /complian|soc|iso|gdpr|pipeda|hipaa|pci/i },
    ],
  },
  {
    key: "cost",
    label: "Cost Optimization",
    short: "COST",
    color: "bg-emerald-100 text-emerald-800",
    bar: "bg-emerald-500",
    keyMetrics: [
      { metric: "Monthly run-rate budget", target: "≤ $X / month", match: /budget|run.?rate|monthly cost|spend/i },
      { metric: "Cost allocation", target: "100% of resources tagged by cost center", match: /tag|allocation|chargeback|showback/i },
    ],
  },
  {
    key: "operations",
    label: "Operational Excellence",
    short: "OPS",
    color: "bg-amber-100 text-amber-800",
    bar: "bg-amber-500",
    keyMetrics: [
      { metric: "Monitoring & alerting", target: "All tier-1 services have dashboards + paging alerts", match: /monitor|alert|observab|logging/i },
      { metric: "Deployment automation", target: "100% IaC; CI/CD with rollback", match: /iac|ci\/?cd|deploy|pipeline|terraform|bicep/i },
    ],
  },
  {
    key: "performance",
    label: "Performance Efficiency",
    short: "PERF",
    color: "bg-violet-100 text-violet-800",
    bar: "bg-violet-500",
    keyMetrics: [
      { metric: "Latency", target: "p95 ≤ 300 ms", match: /latency|response time|p9\d/i },
      { metric: "Throughput / scale", target: "Peak N req/s with autoscale", match: /throughput|req\/s|rps|tps|scale|concurren/i },
    ],
  },
];

// Governance is not a WAF pillar, but traceability and ADR hygiene are a
// CSA's own deliverable quality, so it is scored alongside the pillars.
export const GOVERNANCE = {
  key: "governance",
  label: "Governance & Traceability",
  short: "GOV",
  color: "bg-gray-100 text-gray-700",
  bar: "bg-gray-500",
  keyMetrics: [],
};

export const ALL_BUCKETS = [...PILLARS, GOVERNANCE];

export const pillarByKey = (key) => ALL_BUCKETS.find((p) => p.key === key);
