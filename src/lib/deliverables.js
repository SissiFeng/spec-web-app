import { PILLARS, pillarByKey } from "../data/pillars";
import { LAYERS, findCapability } from "../data/cloudCatalog";
import { itemTitle } from "../data/itemTypes";
import { formatUSD, today } from "../data/constants";
import { PHASES } from "./health";

// ─── Deliverable Generators ──────────────────────────────────────────
//
// Turn the engagement's items into customer-ready documents. Output is
// Markdown (or CSV) so it pastes cleanly into Word, Confluence, Loop or a
// GitHub repo. Each generator is (ctx) => { filename, mime, content }.

const cell = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim() || "—";
const table = (headers, rows) =>
  [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n");
const para = (v) => (String(v ?? "").trim() || "_Not captured yet._");
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const ACTIVE = (i) => !["rejected", "retired", "superseded", "deprecated"].includes(i.status);

function header(ctx, docTitle) {
  const m = ctx.config.meta || {};
  const lines = [
    `# ${docTitle}`,
    "",
    `**Engagement:** ${ctx.config.name}  `,
    m.customer ? `**Customer:** ${m.customer}  ` : null,
    m.engagementType ? `**Engagement type:** ${m.engagementType}  ` : null,
    m.clouds?.length ? `**Target cloud(s):** ${m.clouds.join(", ")}  ` : null,
    `**Phase:** ${PHASES.find((p) => p.key === (m.phase || "discovery"))?.label}  `,
    `**Generated:** ${today()}`,
    "",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

const of = (ctx, type) => ctx.items.filter((i) => i.type === type && ACTIVE(i));

function healthSection(ctx) {
  const h = ctx.health;
  return [
    "## Well-Architected Assessment",
    "",
    `Overall readiness: **${h.overall}/100**`,
    "",
    table(["Pillar", "Score", "Open findings"], h.buckets.map((b) => [b.label, `${b.score}`, `${b.findings.length}`])),
    "",
    h.findings.length ? "### Top findings" : "",
    "",
    ...h.findings.slice(0, 10).map((f) => `- **[${f.severity.toUpperCase()}]** ${pillarByKey(f.bucket)?.label}: ${f.title}${f.detail ? ` — ${f.detail}` : ""}`),
  ].join("\n");
}

function hld(ctx) {
  const { refs } = ctx;
  const reqs = of(ctx, "requirement");
  const nfrs = of(ctx, "nfr");
  const comps = of(ctx, "component");
  const adrs = of(ctx, "decision");
  const risks = of(ctx, "risk").filter((r) => !["closed"].includes(r.status));

  const archByLayer = LAYERS.map((layer) => {
    const inLayer = comps.filter((c) => c.layer === layer);
    if (!inLayer.length) return null;
    return [
      `### ${layer}`,
      "",
      table(["Ref", "Component", "Provider", "Service", "SKU", "Region", "HA / DR", "Est. $/mo"],
        inLayer.map((c) => [refs[c.id], itemTitle(c), c.provider, c.service, c.sku, c.region, c.haPattern, c.monthlyCost ? formatUSD(c.monthlyCost) : ""])),
    ].join("\n");
  }).filter(Boolean);

  const total = comps.reduce((s, c) => s + (Number(c.monthlyCost) || 0), 0);
  const byProvider = ctx.health.stats.costByProvider;

  const content = [
    header(ctx, `High-Level Design — ${ctx.config.name}`),
    "## 1. Executive Summary",
    "",
    para(ctx.config.description),
    "",
    `This design covers ${reqs.length} requirements, ${nfrs.length} non-functional requirements and ${comps.length} architecture components, governed by ${adrs.length} architecture decisions.`,
    "",
    "## 2. Business & Functional Requirements",
    "",
    reqs.length ? table(["Ref", "Requirement", "Workload", "Priority", "Status", "Acceptance criteria"],
      reqs.map((r) => [refs[r.id], itemTitle(r), r.module, r.priority, r.status, r.acceptanceCriteria])) : para(""),
    "",
    "## 3. Non-functional Requirements",
    "",
    ...PILLARS.flatMap((p) => {
      const list = nfrs.filter((n) => n.pillar === p.key);
      return [`### ${p.label}`, "", list.length ? table(["Ref", "Metric", "Target", "Measurement", "Status"], list.map((n) => [refs[n.id], n.metric || itemTitle(n), n.target, n.measurement, n.status])) : "_No NFRs captured — see findings._", ""];
    }),
    "## 4. Target Architecture",
    "",
    ...(archByLayer.length ? archByLayer.flatMap((s) => [s, ""]) : [para(""), ""]),
    "### Cost summary",
    "",
    table(["Provider", "Est. monthly"], [...Object.entries(byProvider).map(([p, v]) => [p, formatUSD(v)]), ["**Total**", `**${formatUSD(total)}**`]]),
    ctx.health.stats.budget ? `\nAgreed budget: ${formatUSD(ctx.health.stats.budget)} / month.` : "",
    "",
    "## 5. Key Architecture Decisions",
    "",
    adrs.length ? table(["Ref", "Decision", "Status", "Pillars"], adrs.map((d) => [refs[d.id], itemTitle(d), d.status, (d.pillars || []).map((k) => pillarByKey(k)?.short).join(", ")])) : para(""),
    "",
    "_Full records are in the ADR pack._",
    "",
    "## 6. Risks, Assumptions, Issues & Dependencies",
    "",
    risks.length ? table(["Ref", "Type", "Item", "L", "I", "Mitigation", "Owner", "Status"],
      risks.map((r) => [refs[r.id], r.raidType, itemTitle(r), r.likelihood, r.impact, r.mitigation, r.owner, r.status])) : para(""),
    "",
    "## 7. " + healthSection(ctx).replace(/^## /, ""),
    "",
  ].join("\n");

  return { filename: `${slug(ctx.config.name)}-hld.md`, mime: "text/markdown", content };
}

function adrPack(ctx) {
  const byRef = (a, b) => (ctx.refs[a.id] || "").localeCompare(ctx.refs[b.id] || "");
  const adrs = of(ctx, "decision").sort(byRef).concat(ctx.items.filter((i) => i.type === "decision" && !ACTIVE(i)).sort(byRef));
  const body = adrs.map((d) => {
    const linked = (d.relatedItems || []).map((id) => ctx.items.find((i) => i.id === id)).filter(Boolean);
    const options = String(d.alternatives || "").split(/\r?\n/).map((s) => s.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
    return [
      `## ${ctx.refs[d.id]}: ${itemTitle(d)}`,
      "",
      `- **Status:** ${d.status}`,
      `- **Deciders:** ${d.decidedBy || d.owner || "—"}`,
      `- **Date:** ${d.decidedAt || d.createdAt || "—"}`,
      d.pillars?.length ? `- **Pillars:** ${d.pillars.map((k) => pillarByKey(k)?.label).join(", ")}` : null,
      "",
      "### Context and Problem Statement",
      "",
      para(d.context),
      "",
      "### Considered Options",
      "",
      options.length ? options.map((o) => `- ${o}`).join("\n") : para(""),
      "",
      "### Decision Outcome",
      "",
      para(d.statement),
      "",
      "### Consequences",
      "",
      para(d.consequences),
      linked.length ? `\n### Related\n\n${linked.map((l) => `- ${ctx.refs[l.id]} ${itemTitle(l)}`).join("\n")}` : null,
      "",
    ].filter((l) => l !== null).join("\n");
  });
  const content = [header(ctx, `Architecture Decision Records — ${ctx.config.name}`), body.length ? body.join("\n---\n\n") : para("")].join("\n");
  return { filename: `${slug(ctx.config.name)}-adrs.md`, mime: "text/markdown", content };
}

function statusReport(ctx) {
  const h = ctx.health;
  const phase = ctx.config.meta?.phase || "discovery";
  const gates = h.gates[phase] || [];
  const risks = of(ctx, "risk").filter((r) => ["open", "mitigating"].includes(r.status))
    .sort((a, b) => score(b) - score(a)).slice(0, 5);
  const pending = of(ctx, "decision").filter((d) => d.status === "proposed");
  const recent = ctx.items.filter((i) => (i.updatedAt || "") >= daysAgo(7));

  const content = [
    header(ctx, `Weekly Status — ${ctx.config.name}`),
    "## Summary",
    "",
    `- Architecture readiness: **${h.overall}/100**`,
    `- Pillars with NFRs: **${h.stats.pillarsCovered}/5**`,
    h.stats.tracedPct !== null ? `- Must-have requirements traced: **${h.stats.tracedPct}%**` : null,
    `- Estimated run-rate: **${formatUSD(h.stats.monthlyCost)} / month**${h.stats.budget ? ` (budget ${formatUSD(h.stats.budget)})` : ""}`,
    `- Open high-impact risks: **${h.stats.openHighRisks}** · Decisions pending: **${h.stats.pendingAdrs}**`,
    "",
    `## Phase exit criteria — ${PHASES.find((p) => p.key === phase)?.label}`,
    "",
    ...gates.map((g) => `- [${g.done ? "x" : " "}] ${g.label}`),
    "",
    "## Decisions needed from the customer",
    "",
    pending.length ? pending.map((d) => `- ${ctx.refs[d.id]} ${itemTitle(d)}${d.owner ? ` (owner: ${d.owner})` : ""}`).join("\n") : "_None._",
    "",
    "## Top risks",
    "",
    risks.length ? table(["Ref", "Item", "L/I", "Mitigation", "Owner"], risks.map((r) => [ctx.refs[r.id], itemTitle(r), `${r.likelihood || "?"}/${r.impact || "?"}`, r.mitigation, r.owner])) : "_None open._",
    "",
    "## Changed this week",
    "",
    recent.length ? recent.map((i) => `- ${ctx.refs[i.id]} ${itemTitle(i)} — ${i.status}`).join("\n") : "_No changes in the last 7 days._",
    "",
    "## Next actions",
    "",
    ...h.findings.slice(0, 5).map((f) => `- ${f.title}`),
    "",
  ].filter((l) => l !== null).join("\n");
  return { filename: `${slug(ctx.config.name)}-status-${today()}.md`, mime: "text/markdown", content };
}

function raidCsv(ctx) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = ctx.items.filter((i) => i.type === "risk").map((r) =>
    [ctx.refs[r.id], r.raidType, itemTitle(r), r.description, pillarByKey(r.pillar)?.label, r.likelihood, r.impact, r.mitigation, r.owner, r.dueDate, r.status]);
  const content = [["Ref", "Type", "Title", "Description", "Pillar", "Likelihood", "Impact", "Mitigation", "Owner", "Due", "Status"], ...rows]
    .map((r) => r.map(esc).join(",")).join("\n");
  return { filename: `${slug(ctx.config.name)}-raid.csv`, mime: "text/csv", content };
}

// Multi-cloud comparison: what each designed component maps to elsewhere.
function cloudComparison(ctx) {
  const comps = of(ctx, "component").filter((c) => ["Azure", "AWS", "GCP"].includes(c.provider));
  const rows = comps.map((c) => {
    const cap = findCapability(c.service);
    return [ctx.refs[c.id], itemTitle(c), c.layer, `${c.provider}: ${c.service || "—"}`, cap?.Azure, cap?.AWS, cap?.GCP];
  });
  const content = [
    header(ctx, `Multi-cloud Service Mapping — ${ctx.config.name}`),
    "Equivalent managed services for each designed component, to support portability discussions and exit-strategy reviews.",
    "",
    rows.length ? table(["Ref", "Component", "Layer", "Designed as", "Azure", "AWS", "GCP"], rows) : para(""),
    "",
  ].join("\n");
  return { filename: `${slug(ctx.config.name)}-cloud-mapping.md`, mime: "text/markdown", content };
}

const LEVEL = { low: 1, medium: 2, high: 3 };
const score = (r) => (LEVEL[r.likelihood] || 0) * (LEVEL[r.impact] || 0);
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

export const DELIVERABLES = [
  { key: "hld", label: "High-Level Design", description: "Requirements, NFRs by pillar, target architecture by layer, costs, ADR index, RAID and WAF assessment.", build: hld },
  { key: "adr", label: "ADR Pack", description: "Every decision in MADR format with options, outcome, consequences and links.", build: adrPack },
  { key: "status", label: "Weekly Status Report", description: "Readiness, phase exit criteria, decisions needed, top risks and what changed.", build: statusReport },
  { key: "mapping", label: "Multi-cloud Mapping", description: "Azure / AWS / GCP equivalents for every designed component.", build: cloudComparison },
  { key: "raid", label: "RAID Log (CSV)", description: "Spreadsheet-ready export of risks, assumptions, issues and dependencies.", build: raidCsv },
];
