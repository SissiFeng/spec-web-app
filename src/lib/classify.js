import { PILLARS } from "../data/pillars";
import { CATALOG } from "../data/cloudCatalog";

// ─── Rule-based note classifier ──────────────────────────────────────
//
// Guesses the item type (and pillar / RAID type / provider) for a single
// line of workshop notes. Explicit prefixes win ("Risk:", "ADR:", "NFR:",
// "[assumption]"); otherwise keyword heuristics apply. The import preview
// lets the user correct anything before saving.

const PREFIXES = [
  [/^(?:\[)?(risk)(?:\])?\s*[:\-–]\s*/i, { type: "risk", raidType: "risk" }],
  [/^(?:\[)?(assumption|assume)(?:\])?\s*[:\-–]\s*/i, { type: "risk", raidType: "assumption" }],
  [/^(?:\[)?(issue)(?:\])?\s*[:\-–]\s*/i, { type: "risk", raidType: "issue" }],
  [/^(?:\[)?(dependency|dep)(?:\])?\s*[:\-–]\s*/i, { type: "risk", raidType: "dependency" }],
  [/^(?:\[)?(adr|decision|decided)(?:\])?\s*[:\-–]\s*/i, { type: "decision" }],
  [/^(?:\[)?(nfr)(?:\])?\s*[:\-–]\s*/i, { type: "nfr" }],
  [/^(?:\[)?(req|requirement|story)(?:\])?\s*[:\-–]\s*/i, { type: "requirement" }],
  [/^(?:\[)?(component|cmp)(?:\])?\s*[:\-–]\s*/i, { type: "component" }],
];

const PILLAR_WORDS = {
  reliability: /\b(rto|rpo|sla|availability|uptime|failover|disaster|dr\b|backup|redundan|resilien)/i,
  security: /\b(security|encrypt|mfa|sso|rbac|identity|compliance|soc ?2|iso ?27001|gdpr|pipeda|hipaa|pci|pii|firewall|zero trust|private endpoint)/i,
  cost: /\b(cost|budget|spend|\$\s?\d|savings|reserved|chargeback|finops)/i,
  operations: /\b(monitor|alert|logging|observab|ci\/?cd|pipeline|iac|terraform|bicep|runbook|on-?call|deploy)/i,
  performance: /\b(latency|throughput|p9\d|response time|req\/s|rps|tps|concurren|autoscal|peak)/i,
};

const SERVICE_NAMES = CATALOG.flatMap((row) =>
  ["Azure", "AWS", "GCP"].flatMap((p) =>
    row[p].split(/\s*[/+]\s*/).filter((n) => n.length > 2).map((name) => ({ name, provider: p, layer: row.layer }))
  )
).sort((a, b) => b.name.length - a.name.length);

const detectPillar = (text) => {
  for (const p of PILLARS) if (p.keyMetrics.some((m) => m.match.test(text))) return p.key;
  return Object.keys(PILLAR_WORDS).find((k) => PILLAR_WORDS[k].test(text)) || null;
};

const detectService = (text) => {
  const lower = text.toLowerCase();
  return SERVICE_NAMES.find((s) => new RegExp(`\\b${s.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower)) || null;
};

export function classifyLine(raw) {
  let title = raw.trim();
  let guess = null;
  for (const [re, g] of PREFIXES) {
    if (re.test(title)) { title = title.replace(re, ""); guess = { ...g }; break; }
  }

  if (!guess) {
    if (/\bassum/i.test(title)) guess = { type: "risk", raidType: "assumption" };
    else if (/\b(depends on|dependent on|waiting (on|for)|blocked by)\b/i.test(title)) guess = { type: "risk", raidType: "dependency" };
    else if (/\b(risk|concern|might not|may not|could fail|worried|exposure)\b/i.test(title)) guess = { type: "risk", raidType: "risk" };
    else if (/\b(issue|outage|incident|broken|currently failing)\b/i.test(title)) guess = { type: "risk", raidType: "issue" };
    else if (/\b(decided|agreed to|we will use|we'll use|go with|chose|selected|standardi[sz]e on)\b/i.test(title)) guess = { type: "decision" };
    else if (/\b(rto|rpo|sla|p9\d|latency|throughput|uptime|availability)\b|[≤≥]|[<>]=|\d+\s?(ms|%|hours?|mins?|minutes?|req\/s|rps)\b/i.test(title)) guess = { type: "nfr" };
    else if (detectService(title) && /\b(use|deploy|host|run on|provision|add|via)\b/i.test(title)) guess = { type: "component" };
    else guess = { type: "requirement" };
  }

  const fields = {};
  if (guess.type === "risk") {
    fields.raidType = guess.raidType;
    const p = detectPillar(title);
    if (p) fields.pillar = p;
    if (/\b(critical|severe|major|blocker|high)\b/i.test(title)) fields.impact = "high";
  }
  if (guess.type === "nfr") {
    fields.pillar = detectPillar(title) || "performance";
    const target = title.match(/(?:[≤≥<>]=?|under|below|within|at least|max(?:imum)?)\s*[^,;]+$/i);
    if (target) fields.target = target[0].trim();
  }
  if (guess.type === "decision") {
    const p = detectPillar(title);
    if (p) fields.pillars = [p];
  }
  if (guess.type === "component") {
    const svc = detectService(title);
    if (svc) Object.assign(fields, { provider: svc.provider, layer: svc.layer, service: svc.name });
  }

  return { title, type: guess.type, fields };
}
