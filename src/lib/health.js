import { PILLARS, ALL_BUCKETS, pillarByKey } from "../data/pillars";
import { suggestServices } from "../data/cloudCatalog";
import { itemTitle } from "../data/itemTypes";

// ─── Architecture Health Engine (rule-based) ─────────────────────────
//
// Scores an engagement against the five Well-Architected pillars plus a
// governance bucket, and returns concrete findings. Every finding carries a
// `fix` the UI can execute in one click:
//   { kind: "create", type, prefill }  open a prefilled form
//   { kind: "open", itemId }           open the offending item
//   { kind: "page", page }             jump to a page
//
// Rules are plain functions (ctx) => finding[] so new checks are additive.

const PENALTY = { high: 25, medium: 10, low: 4 };
const STALE_DAYS = 14;

// Statuses that take an item out of consideration entirely.
const INACTIVE = ["rejected", "deferred", "retired", "superseded", "deprecated", "pending_review"];

const daysSince = (date) => {
  if (!date) return 0;
  const t = Date.parse(String(date).slice(0, 10));
  return Number.isNaN(t) ? 0 : Math.floor((Date.now() - t) / 86_400_000);
};

const blank = (v) => v === undefined || v === null || String(v).trim() === "";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function buildContext(config, items) {
  const live = items.filter((i) => !INACTIVE.includes(i.status));
  const of = (type) => live.filter((i) => i.type === type);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  // Links are stored one-way on either side; treat them as undirected.
  const links = {};
  const addLink = (a, b) => {
    (links[a] ||= new Set()).add(b);
    (links[b] ||= new Set()).add(a);
  };
  for (const i of items) for (const r of i.relatedItems || []) if (byId[r]) addLink(i.id, r);
  const linkedOfType = (item, type) =>
    [...(links[item.id] || [])].map((id) => byId[id]).filter((x) => x && x.type === type);

  const clouds = config.meta?.clouds?.length ? config.meta.clouds : ["Azure"];

  return {
    config, items, live, byId, linkedOfType,
    requirements: of("requirement"),
    nfrs: of("nfr"),
    decisions: of("decision"),
    risks: of("risk"),
    components: of("component"),
    triage: items.filter((i) => i.status === "pending_review"),
    primaryCloud: clouds[0],
    phase: config.meta?.phase || "discovery",
  };
}

const nfrText = (n) => `${n.metric || ""} ${n.title || ""}`;

// ─── Rules ───────────────────────────────────────────────────────────

function nfrCoverage(ctx) {
  const out = [];
  for (const p of PILLARS) {
    const nfrs = ctx.nfrs.filter((n) => n.pillar === p.key);
    const first = p.keyMetrics[0];
    if (nfrs.length === 0) {
      out.push({
        id: `nfr-none-${p.key}`, bucket: p.key, severity: "high",
        title: `No ${p.label} NFRs captured`,
        detail: `Agree measurable targets such as ${p.keyMetrics.map((m) => m.metric).join(", ")}.`,
        fix: { kind: "create", type: "nfr", label: `Add ${first.metric}`, prefill: { pillar: p.key, title: first.metric, metric: first.metric, target: first.target, priority: "must" } },
      });
      continue;
    }
    if (nfrs.every((n) => n.status === "draft")) {
      // Drafts are fine early on; past discovery they block design sign-off
      out.push({
        id: `nfr-draft-${p.key}`, bucket: p.key, severity: ctx.phase === "discovery" ? "medium" : "high",
        title: `${p.label} NFRs not yet agreed with the customer`,
        detail: `${plural(nfrs.length, "NFR")} still in draft.`,
        itemIds: nfrs.map((n) => n.id),
        fix: { kind: "open", itemId: nfrs[0].id, label: "Review" },
      });
    }
    for (const km of p.keyMetrics) {
      if (nfrs.some((n) => km.match.test(nfrText(n)))) continue;
      const critical = p.key === "reliability" || p.key === "security";
      out.push({
        id: `nfr-metric-${p.key}-${km.metric}`, bucket: p.key, severity: critical ? "medium" : "low",
        title: `Missing ${p.label} metric: ${km.metric}`,
        detail: `Suggested target: ${km.target}`,
        fix: { kind: "create", type: "nfr", label: "Add NFR", prefill: { pillar: p.key, title: km.metric, metric: km.metric, target: km.target, priority: "should" } },
      });
    }
  }
  for (const n of ctx.nfrs) {
    if (blank(n.target)) {
      out.push({
        id: `nfr-target-${n.id}`, bucket: n.pillar || "governance", severity: "medium",
        title: `NFR "${itemTitle(n)}" has no measurable target`,
        itemIds: [n.id], fix: { kind: "open", itemId: n.id, label: "Set target" },
      });
    }
  }
  return out;
}

function riskHygiene(ctx) {
  const out = [];
  for (const r of ctx.risks) {
    const open = r.status === "open" || r.status === "mitigating";
    if (!open) continue;
    const bucket = r.pillar || "governance";
    if (r.impact === "high" && blank(r.mitigation)) {
      out.push({
        id: `risk-nomit-${r.id}`, bucket, severity: "high",
        title: `High-impact ${r.raidType || "risk"} without mitigation`,
        detail: itemTitle(r), itemIds: [r.id],
        fix: { kind: "open", itemId: r.id, label: "Add mitigation" },
      });
    } else if (r.impact === "high" && r.likelihood === "high" && r.status === "open") {
      out.push({
        id: `risk-exposure-${r.id}`, bucket, severity: "medium",
        title: "High-exposure risk not yet being mitigated",
        detail: itemTitle(r), itemIds: [r.id],
        fix: { kind: "open", itemId: r.id, label: "Start mitigating" },
      });
    }
    if (blank(r.owner)) {
      out.push({
        id: `risk-owner-${r.id}`, bucket: "governance", severity: "low",
        title: `RAID item has no owner`, detail: itemTitle(r), itemIds: [r.id],
        fix: { kind: "open", itemId: r.id, label: "Assign owner" },
      });
    }
    if (r.raidType === "assumption" && r.status === "open" && daysSince(r.createdAt) > STALE_DAYS) {
      out.push({
        id: `risk-assume-${r.id}`, bucket: "governance", severity: "low",
        title: `Assumption unvalidated for ${daysSince(r.createdAt)} days`,
        detail: itemTitle(r), itemIds: [r.id],
        fix: { kind: "open", itemId: r.id, label: "Validate" },
      });
    }
  }
  return out;
}

function adrHygiene(ctx) {
  const out = [];
  for (const d of ctx.decisions) {
    if (d.status === "proposed" && daysSince(d.createdAt) > STALE_DAYS) {
      out.push({
        id: `adr-stale-${d.id}`, bucket: "governance", severity: "medium",
        title: `Decision pending for ${daysSince(d.createdAt)} days`,
        detail: itemTitle(d), itemIds: [d.id],
        fix: { kind: "open", itemId: d.id, label: "Drive decision" },
      });
    }
    const missing = [blank(d.alternatives) && "options considered", blank(d.consequences) && "consequences"].filter(Boolean);
    if (missing.length) {
      out.push({
        id: `adr-incomplete-${d.id}`, bucket: "governance", severity: "low",
        title: `ADR missing ${missing.join(" and ")}`,
        detail: itemTitle(d), itemIds: [d.id],
        fix: { kind: "open", itemId: d.id, label: "Complete ADR" },
      });
    }
  }
  return out;
}

function architectureCoverage(ctx) {
  const out = [];
  const comps = ctx.components;
  if (comps.length === 0) {
    out.push({
      id: "arch-empty", bucket: "governance", severity: ctx.phase === "discovery" ? "low" : "high",
      title: "No architecture components defined yet",
      detail: "Start the target architecture by adding the landing-zone building blocks.",
      fix: { kind: "create", type: "component", label: "Add component", prefill: { provider: ctx.primaryCloud, layer: "Edge & Network" } },
    });
    return out;
  }
  const requiredLayers = [
    { layer: "Identity", bucket: "security", severity: "high" },
    { layer: "Security", bucket: "security", severity: "medium" },
    { layer: "Observability", bucket: "operations", severity: "high" },
    { layer: "DevOps", bucket: "operations", severity: "medium" },
  ];
  for (const req of requiredLayers) {
    if (comps.some((c) => c.layer === req.layer)) continue;
    const service = suggestServices(ctx.primaryCloud, req.layer)[0] || "";
    out.push({
      id: `arch-layer-${req.layer}`, bucket: req.bucket, severity: req.severity,
      title: `No ${req.layer} layer in the architecture`,
      detail: service ? `On ${ctx.primaryCloud}, this is typically ${service}.` : undefined,
      fix: { kind: "create", type: "component", label: `Add ${req.layer}`, prefill: { provider: ctx.primaryCloud, layer: req.layer, service, title: service } },
    });
  }

  // Reliability: if the customer agreed an availability target, stateful
  // and compute tiers need an HA pattern beyond a single zone.
  const wantsHA = ctx.nfrs.some((n) => n.pillar === "reliability" && /availab|sla|uptime/i.test(nfrText(n)));
  const weak = comps.filter((c) => ["Compute", "Data"].includes(c.layer) && (blank(c.haPattern) || c.haPattern === "single-zone"));
  if (wantsHA && weak.length) {
    out.push({
      id: "arch-ha", bucket: "reliability", severity: "medium",
      title: `${plural(weak.length, "compute/data component")} without zone or region redundancy`,
      detail: "An availability NFR exists, but these tiers have no HA/DR pattern.",
      itemIds: weak.map((c) => c.id), fix: { kind: "open", itemId: weak[0].id, label: "Set HA pattern" },
    });
  }

  const uncosted = comps.filter((c) => c.provider !== "On-prem" && blank(c.monthlyCost));
  if (uncosted.length) {
    out.push({
      id: "arch-uncosted", bucket: "cost", severity: "medium",
      title: `${plural(uncosted.length, "component")} without a cost estimate`,
      detail: "Estimate with the provider pricing calculator so the run-rate is credible.",
      itemIds: uncosted.map((c) => c.id), fix: { kind: "open", itemId: uncosted[0].id, label: "Add estimate" },
    });
  }

  const budget = parseBudget(ctx.nfrs);
  const total = totalCost(comps);
  if (budget && total > budget) {
    out.push({
      id: "arch-overbudget", bucket: "cost", severity: "high",
      title: `Estimated run-rate exceeds budget`,
      detail: `$${Math.round(total).toLocaleString()} / month vs. budget $${budget.toLocaleString()}.`,
      fix: { kind: "page", page: "architecture", label: "Review costs" },
    });
  } else if (budget && total > budget * 0.9) {
    out.push({
      id: "arch-nearbudget", bucket: "cost", severity: "low",
      title: `Run-rate within 10% of budget`,
      detail: `$${Math.round(total).toLocaleString()} / month vs. budget $${budget.toLocaleString()}.`,
      fix: { kind: "page", page: "architecture", label: "Review costs" },
    });
  }

  const noAdr = comps.filter((c) => ["Compute", "Data", "Integration"].includes(c.layer) && ctx.linkedOfType(c, "decision").length === 0);
  if (noAdr.length) {
    out.push({
      id: "arch-noadr", bucket: "governance", severity: "low",
      title: `${plural(noAdr.length, "key component")} not justified by an ADR`,
      detail: noAdr.map(itemTitle).slice(0, 3).join(", "),
      itemIds: noAdr.map((c) => c.id),
      fix: { kind: "create", type: "decision", label: "Write ADR", prefill: { title: `Use ${noAdr[0].service || itemTitle(noAdr[0])} for ${noAdr[0].layer.toLowerCase()}`, relatedItems: [noAdr[0].id] } },
    });
  }
  return out;
}

function traceability(ctx) {
  const out = [];
  const musts = ctx.requirements.filter((r) => r.priority === "must");
  const untraced = musts.filter((r) => ctx.linkedOfType(r, "component").length === 0);
  if (untraced.length) {
    // Still-proposed requirements may change, so they weigh less
    const firm = untraced.some((r) => r.status !== "proposed");
    out.push({
      id: "trace-req", bucket: "governance", severity: firm ? "medium" : "low",
      title: `${plural(untraced.length, "must-have requirement")} not traced to the architecture`,
      detail: untraced.map(itemTitle).slice(0, 3).join(", "),
      itemIds: untraced.map((r) => r.id),
      fix: { kind: "page", page: "traceability", label: "Open matrix" },
    });
  }
  const noAc = ctx.requirements.filter((r) => r.status === "confirmed" && blank(r.acceptanceCriteria));
  if (noAc.length) {
    out.push({
      id: "trace-ac", bucket: "governance", severity: "low",
      title: `${plural(noAc.length, "confirmed requirement")} without acceptance criteria`,
      itemIds: noAc.map((r) => r.id), fix: { kind: "open", itemId: noAc[0].id, label: "Add criteria" },
    });
  }
  if (ctx.triage.length) {
    out.push({
      id: "triage", bucket: "governance", severity: "medium",
      title: `${plural(ctx.triage.length, "imported item")} awaiting triage`,
      itemIds: ctx.triage.map((i) => i.id), fix: { kind: "open", itemId: ctx.triage[0].id, label: "Triage" },
    });
  }
  return out;
}

const RULES = [nfrCoverage, riskHygiene, adrHygiene, architectureCoverage, traceability];

// ─── Helpers shared with UI / deliverables ───────────────────────────

export function totalCost(components) {
  return components.reduce((s, c) => s + (Number(c.monthlyCost) || 0), 0);
}

export function costByProvider(components) {
  const out = {};
  for (const c of components) out[c.provider || "Unknown"] = (out[c.provider || "Unknown"] || 0) + (Number(c.monthlyCost) || 0);
  return out;
}

// First cost-pillar NFR that looks like a budget, e.g. "≤ $25,000 / month".
export function parseBudget(nfrs) {
  const n = nfrs.find((x) => x.pillar === "cost" && /budget|run.?rate|monthly cost|spend/i.test(nfrText(x)));
  if (!n?.target) return null;
  const m = String(n.target).replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(k)?/i);
  if (!m) return null;
  return Number(m[1]) * (m[2] ? 1000 : 1);
}

// ─── Phase gates ─────────────────────────────────────────────────────

export const PHASES = [
  { key: "discovery", label: "Discovery" },
  { key: "design", label: "Design" },
  { key: "build", label: "Build" },
  { key: "handover", label: "Handover" },
];

function phaseGates(ctx) {
  const highRisksOpen = ctx.risks.filter((r) => r.impact === "high" && ["open", "mitigating"].includes(r.status));
  const mustsUntraced = ctx.requirements.filter((r) => r.priority === "must" && ctx.linkedOfType(r, "component").length === 0);
  const layers = new Set(ctx.components.map((c) => c.layer));
  return {
    discovery: [
      { label: "Every pillar has at least one NFR", done: PILLARS.every((p) => ctx.nfrs.some((n) => n.pillar === p.key)) },
      { label: "Must-have requirements confirmed", done: ctx.requirements.some((r) => r.priority === "must") && !ctx.requirements.some((r) => r.priority === "must" && r.status === "proposed") },
      { label: "Key assumptions logged", done: ctx.risks.some((r) => r.raidType === "assumption") },
      { label: "Imported notes triaged", done: ctx.triage.length === 0 },
    ],
    design: [
      { label: "All NFRs agreed", done: ctx.nfrs.length > 0 && !ctx.nfrs.some((n) => n.status === "draft") },
      { label: "No ADRs left in proposed", done: ctx.decisions.length > 0 && !ctx.decisions.some((d) => d.status === "proposed") },
      { label: "Identity, Security & Observability designed", done: ["Identity", "Security", "Observability"].every((l) => layers.has(l)) },
      { label: "Every cloud component costed", done: ctx.components.length > 0 && ctx.components.every((c) => c.provider === "On-prem" || !blank(c.monthlyCost)) },
      { label: "Must-haves traced to components", done: mustsUntraced.length === 0 },
      { label: "High-impact risks have mitigations", done: highRisksOpen.every((r) => !blank(r.mitigation)) },
    ],
    build: [
      { label: "All components deployed", done: ctx.components.length > 0 && ctx.components.every((c) => c.status === "deployed") },
      { label: "NFRs validated", done: ctx.nfrs.length > 0 && ctx.nfrs.every((n) => n.status === "validated") },
      { label: "No open high-impact risks", done: highRisksOpen.length === 0 },
    ],
    handover: [
      { label: "All RAID items closed or accepted", done: ctx.risks.every((r) => ["closed", "accepted"].includes(r.status)) },
      { label: "All requirements addressed or deferred", done: ctx.requirements.every((r) => ["addressed", "deferred", "rejected"].includes(r.status)) },
    ],
  };
}

// ─── Entry point ─────────────────────────────────────────────────────

export function assessHealth(config, items) {
  const ctx = buildContext(config, items);
  const findings = RULES.flatMap((rule) => rule(ctx));
  const severityRank = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  const buckets = ALL_BUCKETS.map((b) => {
    const own = findings.filter((f) => f.bucket === b.key);
    const score = Math.max(0, 100 - own.reduce((s, f) => s + PENALTY[f.severity], 0));
    return { ...b, score, findings: own };
  });
  const overall = Math.round(buckets.reduce((s, b) => s + b.score, 0) / buckets.length);

  const musts = ctx.requirements.filter((r) => r.priority === "must");
  const stats = {
    openHighRisks: ctx.risks.filter((r) => r.impact === "high" && ["open", "mitigating"].includes(r.status)).length,
    pendingAdrs: ctx.decisions.filter((d) => d.status === "proposed").length,
    pillarsCovered: PILLARS.filter((p) => ctx.nfrs.some((n) => n.pillar === p.key)).length,
    tracedPct: musts.length ? Math.round((100 * musts.filter((r) => ctx.linkedOfType(r, "component").length).length) / musts.length) : null,
    monthlyCost: totalCost(ctx.components),
    costByProvider: costByProvider(ctx.components),
    budget: parseBudget(ctx.nfrs),
  };

  return { overall, buckets, findings, stats, gates: phaseGates(ctx), bucketLabel: (k) => pillarByKey(k)?.label || k };
}
