import { PILLARS } from "./pillars";
import { PROVIDERS, LAYERS } from "./cloudCatalog";

// ─── CSA Item Type Schema ────────────────────────────────────────────
//
// Single source of truth for every item type: labels, statuses, and the
// type-specific fields. FormModal, DetailPanel, ItemList and the serializer
// are all driven from this, so adding a field is a one-line change here.
//
// Field kinds: text | textarea | select | number | date | check | list
// `options` may be an array or a function (config) => array.

const PILLAR_KEYS = PILLARS.map((p) => p.key);
const LEVELS = ["low", "medium", "high"];

// Imported notes land in "pending_review" regardless of type; it is listed
// last so new items default to the first (real) status.
const TRIAGE = "pending_review";

export const ITEM_TYPES = {
  requirement: {
    label: "Requirement",
    plural: "Requirements",
    prefix: "REQ",
    color: "bg-blue-50 text-blue-700",
    statuses: ["proposed", "confirmed", "in_design", "addressed", "deferred", "rejected", TRIAGE],
    doneStatuses: ["addressed", "deferred", "rejected"],
    fields: [
      { key: "description", label: "Business need / user story", kind: "textarea" },
      { key: "category", label: "Category", kind: "select", options: ["functional", "business", "compliance", "migration", "integration"] },
      { key: "priority", label: "Priority (MoSCoW)", kind: "select", options: ["must", "should", "could", "wont"] },
      { key: "acceptanceCriteria", label: "Acceptance criteria", kind: "textarea" },
      { key: "stakeholder", label: "Stakeholder", kind: "text" },
    ],
  },
  nfr: {
    label: "NFR",
    plural: "Non-functional Reqs",
    prefix: "NFR",
    color: "bg-cyan-50 text-cyan-700",
    statuses: ["draft", "agreed", "validated", "at_risk", TRIAGE],
    doneStatuses: ["validated"],
    fields: [
      { key: "pillar", label: "WAF pillar", kind: "select", options: PILLAR_KEYS },
      { key: "metric", label: "Metric", kind: "text", placeholder: "e.g. RTO, p95 latency, monthly budget" },
      { key: "target", label: "Target", kind: "text", placeholder: "e.g. ≤ 4 hours" },
      { key: "measurement", label: "How it is measured", kind: "textarea" },
      { key: "priority", label: "Priority (MoSCoW)", kind: "select", options: ["must", "should", "could", "wont"] },
    ],
  },
  decision: {
    label: "ADR",
    plural: "Architecture Decisions",
    prefix: "ADR",
    color: "bg-green-50 text-green-700",
    statuses: ["proposed", "accepted", "superseded", "deprecated", TRIAGE],
    doneStatuses: ["accepted", "superseded", "deprecated"],
    fields: [
      { key: "context", label: "Context & problem", kind: "textarea" },
      { key: "alternatives", label: "Options considered (one per line)", kind: "textarea" },
      { key: "statement", label: "Decision", kind: "textarea" },
      { key: "consequences", label: "Consequences & trade-offs", kind: "textarea" },
      { key: "pillars", label: "Pillars affected", kind: "list", options: PILLAR_KEYS },
      { key: "decidedBy", label: "Decided by", kind: "text" },
      { key: "decidedAt", label: "Decided at", kind: "date" },
    ],
  },
  risk: {
    label: "RAID",
    plural: "RAID Log",
    prefix: "RAID",
    color: "bg-red-50 text-red-700",
    statuses: ["open", "mitigating", "accepted", "closed", TRIAGE],
    doneStatuses: ["accepted", "closed"],
    fields: [
      { key: "raidType", label: "Type", kind: "select", options: ["risk", "assumption", "issue", "dependency"] },
      { key: "pillar", label: "WAF pillar", kind: "select", options: PILLAR_KEYS },
      { key: "likelihood", label: "Likelihood", kind: "select", options: LEVELS },
      { key: "impact", label: "Impact", kind: "select", options: LEVELS },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "mitigation", label: "Mitigation / response", kind: "textarea" },
      { key: "dueDate", label: "Due", kind: "date" },
    ],
  },
  component: {
    label: "Component",
    plural: "Architecture",
    prefix: "CMP",
    color: "bg-indigo-50 text-indigo-700",
    statuses: ["proposed", "designed", "deployed", "retired", TRIAGE],
    doneStatuses: ["deployed", "retired"],
    fields: [
      { key: "provider", label: "Provider", kind: "select", options: (config) => config.meta?.clouds?.length ? [...config.meta.clouds, ...PROVIDERS.filter((p) => !config.meta.clouds.includes(p))] : PROVIDERS },
      { key: "layer", label: "Layer", kind: "select", options: LAYERS },
      { key: "service", label: "Managed service", kind: "text", suggest: "service" },
      { key: "sku", label: "SKU / tier", kind: "text" },
      { key: "region", label: "Region(s)", kind: "text" },
      { key: "haPattern", label: "HA / DR pattern", kind: "select", options: ["", "single-zone", "zone-redundant", "active-passive multi-region", "active-active multi-region"] },
      { key: "monthlyCost", label: "Est. monthly cost (USD)", kind: "number" },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
  },
};

export const TYPE_KEYS = Object.keys(ITEM_TYPES);

export const typeMeta = (type) => ITEM_TYPES[type] || { label: type, plural: type, prefix: "ITM", color: "bg-gray-100 text-gray-600", statuses: [], doneStatuses: [], fields: [] };

export const DEFAULT_STATUSES = Object.fromEntries(TYPE_KEYS.map((t) => [t, ITEM_TYPES[t].statuses]));

export const DEFAULT_DONE_STATUSES = [...new Set(TYPE_KEYS.flatMap((t) => ITEM_TYPES[t].doneStatuses))];

export const resolveOptions = (field, config) =>
  typeof field.options === "function" ? field.options(config) : field.options || [];

// Blank values for a new item of `type`; select fields default to their
// first option so the form never starts in an invalid state.
export function blankFields(type, config) {
  const out = {};
  for (const f of typeMeta(type).fields) {
    if (f.kind === "check") out[f.key] = false;
    else if (f.kind === "list") out[f.key] = [];
    else if (f.kind === "number") out[f.key] = "";
    else if (f.kind === "select") out[f.key] = resolveOptions(f, config)[0] ?? "";
    else out[f.key] = "";
  }
  return out;
}

// Friendly, stable-per-session reference like "ADR-003". Numbering follows
// creation order within each type.
export function buildRefMap(items) {
  const byType = {};
  const sorted = [...items].sort((a, b) =>
    (a.createdAt || "").localeCompare(b.createdAt || "") || String(a.id).localeCompare(String(b.id))
  );
  const refs = {};
  for (const i of sorted) {
    byType[i.type] = (byType[i.type] || 0) + 1;
    refs[i.id] = `${typeMeta(i.type).prefix}-${String(byType[i.type]).padStart(3, "0")}`;
  }
  return refs;
}

export const itemTitle = (i) => i.title || i.metric || i.service || i.statement || "(untitled)";
