import { useState, useMemo, useCallback, useRef } from "react";
import {
  Search, Plus, X, ChevronDown, ChevronRight, Clock,
  AlertTriangle, CheckCircle, FileText, BookOpen, Shield,
  Package, Link, Edit3, Trash2, MessageSquare, Send,
  User, Activity, History,
} from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────

const MODULES = ["Overview", "Campaign", "Alerts", "Analysis", "Data Explorer"];
const STATUSES = {
  requirement: ["proposed", "confirmed", "rejected", "implemented", "deprecated"],
  decision: ["open", "needs_clarification", "confirmed", "implemented", "deprecated"],
  definition: ["draft", "needs_clarification", "confirmed", "deprecated"],
  rule: ["proposed", "confirmed", "implemented", "deprecated"],
  release: ["planned", "in_progress", "completed", "reverted"],
};
const DONE_STATUSES = ["implemented", "completed", "deprecated", "rejected", "reverted"];
const PRIORITIES = ["critical", "high", "medium", "low"];
const DEPENDENCIES = [
  "frontend_only", "backend_only", "ETL", "schema",
  "scientific_definition_needed", "PM_approval_needed",
];
const SOURCES = ["Ali", "Scientist", "PM", "Meeting", "Code Review", "Slack"];
const TEAM_MEMBERS = ["Ali", "Dr. Chen", "PM", "Tech Lead", "Unassigned"];

let _id = 100;
const uid = () => String(++_id);
const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const today = () => new Date().toISOString().slice(0, 10);

// ─── Seed Data (all English) ───────────────────────────────────────────

const makeSeedLog = (actor, action, date) => [{ actor, action, timestamp: date + " 10:00:00" }];

const SEED = {
  requirements: [
    {
      id: "r1", type: "requirement",
      title: "Change Overview subtitle to 'Real-time monitoring & data management'",
      source: "Ali", module: "Overview",
      userIntent: "Make the Overview page subtitle more accurately describe system capabilities",
      priority: "medium", status: "confirmed", owner: "Ali", assignee: "Ali",
      version: "v2.1", tags: ["UI", "copy"],
      createdAt: "2026-03-10", updatedAt: "2026-03-11",
      relatedItems: ["d1"],
      comments: [
        { author: "Ali", text: "Confirmed in product review — subtitle should reflect monitoring focus.", timestamp: "2026-03-11 14:30:00" },
      ],
      activityLog: [
        { actor: "Ali", action: "Created this requirement", timestamp: "2026-03-10 09:15:00" },
        { actor: "PM", action: "Changed status from proposed → confirmed", timestamp: "2026-03-11 11:00:00" },
      ],
    },
    {
      id: "r2", type: "requirement",
      title: "Change KPI target to 0.99",
      source: "Scientist", module: "Overview",
      userIntent: "Adjust KPI target threshold from current value to 0.99, reflecting higher quality standards",
      priority: "high", status: "proposed", owner: "Dr. Chen", assignee: "Dr. Chen",
      version: "v2.1", tags: ["KPI", "threshold"],
      createdAt: "2026-03-11", updatedAt: "2026-03-11",
      relatedItems: ["rule1"],
      comments: [],
      activityLog: makeSeedLog("Dr. Chen", "Created this requirement", "2026-03-11"),
    },
    {
      id: "r3", type: "requirement",
      title: "Analysis must be attached to a Campaign — no Campaign, no Analysis",
      source: "PM", module: "Analysis",
      userIntent: "Ensure Analysis page data is always linked to a Campaign to prevent orphan analyses",
      priority: "critical", status: "implemented", owner: "PM", assignee: "Ali",
      version: "v2.0", tags: ["architecture", "constraint"],
      createdAt: "2026-03-08", updatedAt: "2026-03-11",
      relatedItems: ["d3", "def1"],
      comments: [
        { author: "Ali", text: "This is effectively a product rule — should be synced to the Rule Registry.", timestamp: "2026-03-09 10:00:00" },
      ],
      activityLog: [
        { actor: "PM", action: "Created this requirement", timestamp: "2026-03-08 14:00:00" },
        { actor: "PM", action: "Changed status from proposed → confirmed", timestamp: "2026-03-09 09:00:00" },
        { actor: "Ali", action: "Changed status from confirmed → implemented", timestamp: "2026-03-11 16:00:00" },
      ],
    },
    {
      id: "r4", type: "requirement",
      title: "Add severity filter to Alerts page",
      source: "Scientist", module: "Alerts",
      userIntent: "Scientists want to quickly find critical alerts without scrolling through pages",
      priority: "high", status: "proposed", owner: "", assignee: "Unassigned",
      version: "v2.2", tags: ["filter", "UX"],
      createdAt: "2026-03-12", updatedAt: "2026-03-12",
      relatedItems: [],
      comments: [],
      activityLog: makeSeedLog("Scientist", "Created this requirement", "2026-03-12"),
    },
    {
      id: "r5", type: "requirement",
      title: "Support CSV export in Data Explorer",
      source: "Meeting", module: "Data Explorer",
      userIntent: "Scientists need to download filtered data locally for further analysis",
      priority: "medium", status: "confirmed", owner: "Ali", assignee: "Ali",
      version: "v2.1", tags: ["export", "data"],
      createdAt: "2026-03-09", updatedAt: "2026-03-10",
      relatedItems: [],
      comments: [],
      activityLog: makeSeedLog("Ali", "Created this requirement", "2026-03-09"),
    },
  ],
  decisions: [
    {
      id: "d1", type: "decision",
      title: "'This Week' defined as Sunday 00:00 to Saturday 23:59",
      statement: "All 'This Week' time ranges in the system are unified as: Sunday 00:00:00 UTC to Saturday 23:59:59 UTC",
      rationale: "Prevent inconsistencies between frontend, backend, and scientist interpretations of the time window",
      decidedBy: "Ali + PM", decidedAt: "2026-03-11",
      supersedes: false, module: "Overview",
      impactedComponents: ["Overview KPI", "Campaign timeline", "Data Explorer filter"],
      status: "confirmed", owner: "Ali", assignee: "Ali",
      source: "2026-03-11 Ali dashboard discussion",
      tags: ["time", "definition"],
      createdAt: "2026-03-11", updatedAt: "2026-03-11",
      relatedItems: ["r1"],
      comments: [],
      activityLog: makeSeedLog("Ali", "Created this decision", "2026-03-11"),
    },
    {
      id: "d2", type: "decision",
      title: "Alerts scope limited to experiment quality only, not system errors",
      statement: "The Alerts module is scoped to experiment quality alerts (e.g. data validation failures, KPI threshold breaches), excluding system-level errors (e.g. server errors, ETL failures)",
      rationale: "System errors should go through DevOps monitoring channels (PagerDuty/Datadog), not mixed into the scientist's working interface",
      decidedBy: "PM + Tech Lead", decidedAt: "2026-03-10",
      supersedes: false, module: "Alerts",
      impactedComponents: ["Alerts page", "Notification system"],
      status: "confirmed", owner: "PM", assignee: "PM",
      source: "2026-03-10 product review",
      tags: ["scope", "alerts"],
      createdAt: "2026-03-10", updatedAt: "2026-03-10",
      relatedItems: [],
      comments: [],
      activityLog: makeSeedLog("PM", "Created this decision", "2026-03-10"),
    },
    {
      id: "d3", type: "decision",
      title: "Warning data retained but requires manual verification",
      statement: "When a data row has status 'warning', it is not automatically discarded. It remains in the system but is marked as requiring scientist manual verification before being included in KPI calculations",
      rationale: "Automatic discard could cause data loss, but unverified data would pollute KPIs",
      decidedBy: "Dr. Chen + PM", decidedAt: "2026-03-11",
      supersedes: true, module: "Analysis",
      impactedComponents: ["Validation pipeline", "KPI calculation", "Status rollup"],
      status: "confirmed", owner: "Dr. Chen", assignee: "Dr. Chen",
      source: "2026-03-11 scientist feedback",
      tags: ["validation", "data-quality"],
      createdAt: "2026-03-11", updatedAt: "2026-03-11",
      relatedItems: ["r3", "rule2"],
      comments: [
        { author: "Dr. Chen", text: "This supersedes the previous approach of directly discarding warning data.", timestamp: "2026-03-11 15:00:00" },
      ],
      activityLog: makeSeedLog("Dr. Chen", "Created this decision", "2026-03-11"),
    },
  ],
  definitions: [
    {
      id: "def1", type: "definition",
      term: "Campaign",
      definition: "A group of experiments linked to a particular goal. Campaigns can be dynamically adjusted and may contain multiple sessions. Each Campaign has a clear start time, target metrics, and an owner.",
      scope: "System-wide", module: "Campaign",
      examples: ["Stability optimization Q1 2026", "Yield improvement for Substrate A"],
      unresolvedQuestions: ["Can a Campaign span multiple quarters?", "Are nested Campaigns allowed?"],
      status: "confirmed", owner: "PM", assignee: "PM",
      source: "2026-03-08 kickoff meeting",
      tags: ["core"],
      createdAt: "2026-03-08", updatedAt: "2026-03-11",
      relatedItems: ["r3"],
      comments: [],
      activityLog: makeSeedLog("PM", "Created this definition", "2026-03-08"),
    },
    {
      id: "def2", type: "definition",
      term: "Session",
      definition: "A single continuous experimental run belonging to a Campaign. A Session contains fixed experimental conditions (substrate, temperature, pressure, etc.) and a set of data cycles.",
      scope: "Within Campaign", module: "Campaign",
      examples: ["Session #42: Substrate A, 25C, 1atm, 200 cycles"],
      unresolvedQuestions: ["Are mid-session condition changes allowed?", "If yes, how should sessions be split?"],
      status: "confirmed", owner: "Dr. Chen", assignee: "Dr. Chen",
      source: "2026-03-09 definition workshop",
      tags: ["core"],
      createdAt: "2026-03-09", updatedAt: "2026-03-09",
      relatedItems: ["def1"],
      comments: [],
      activityLog: makeSeedLog("Dr. Chen", "Created this definition", "2026-03-09"),
    },
    {
      id: "def3", type: "definition",
      term: "Stability Score",
      definition: "A composite metric measuring performance degradation of an experiment under given conditions. Calculation method TBD.",
      scope: "Analysis module", module: "Analysis",
      examples: [],
      unresolvedQuestions: [
        "Exact formula?",
        "Use degradation rate vs baseline?",
        "Time window for calculation?",
      ],
      status: "draft", owner: "", assignee: "Unassigned",
      source: "2026-03-11 Ali dashboard discussion",
      tags: ["KPI", "unresolved"],
      createdAt: "2026-03-11", updatedAt: "2026-03-11",
      relatedItems: [],
      comments: [
        { author: "Ali", text: "This is one of the highest-priority terms to define.", timestamp: "2026-03-11 16:00:00" },
      ],
      activityLog: makeSeedLog("Ali", "Created this definition", "2026-03-11"),
    },
    {
      id: "def4", type: "definition",
      term: "Valid / Invalid / Questionable",
      definition: "Row-level data quality statuses. Valid = passes all validation rules; Invalid = at least one blocking rule fails; Questionable = at least one warning rule triggers but no blocking failures.",
      scope: "Validation pipeline", module: "Analysis",
      examples: ["dc_row_count < 100 → Invalid", "cycle_count deviates > 2σ from mean → Questionable"],
      unresolvedQuestions: ["Does Questionable data participate in KPI calculation?", "What status is completed_partial?"],
      status: "needs_clarification", owner: "Dr. Chen", assignee: "Dr. Chen",
      source: "2026-03-10 product review",
      tags: ["status", "validation"],
      createdAt: "2026-03-10", updatedAt: "2026-03-11",
      relatedItems: ["rule1", "rule2", "d3"],
      comments: [],
      activityLog: makeSeedLog("Dr. Chen", "Created this definition", "2026-03-10"),
    },
  ],
  rules: [
    {
      id: "rule1", type: "rule",
      ruleId: "VAL-001", layer: "Row Validation",
      ruleName: "dc_row_count minimum",
      description: "Each data cycle must contain at least 100 data rows, otherwise it is marked Invalid",
      severity: "error", blocking: true,
      threshold: "dc_row_count >= 100",
      appliesTo: "Data Cycle", sourceOfTruth: "Scientist requirement",
      owner: "Dr. Chen", assignee: "Dr. Chen", module: "Analysis",
      status: "implemented", tags: ["validation", "data-quality"],
      createdAt: "2026-03-08", updatedAt: "2026-03-10",
      relatedItems: ["def4"],
      comments: [],
      activityLog: makeSeedLog("Dr. Chen", "Created this rule", "2026-03-08"),
    },
    {
      id: "rule2", type: "rule",
      ruleId: "VAL-002", layer: "Row Validation",
      ruleName: "cycle_count warning",
      description: "When cycle count deviates more than 2 standard deviations from the session mean, trigger a warning",
      severity: "warning", blocking: false,
      threshold: "|cycle_count - session_mean| > 2σ",
      appliesTo: "Data Cycle", sourceOfTruth: "Scientist requirement",
      owner: "Dr. Chen", assignee: "Dr. Chen", module: "Analysis",
      status: "implemented", tags: ["validation", "statistical"],
      createdAt: "2026-03-08", updatedAt: "2026-03-10",
      relatedItems: ["def4", "d3"],
      comments: [],
      activityLog: makeSeedLog("Dr. Chen", "Created this rule", "2026-03-08"),
    },
    {
      id: "rule3", type: "rule",
      ruleId: "VAL-003", layer: "Session Validation",
      ruleName: "baseline_ce_range",
      description: "Baseline coulombic efficiency must be within 0.95-1.05 range; values outside mark the entire session for review",
      severity: "warning", blocking: false,
      threshold: "0.95 <= baseline_CE <= 1.05",
      appliesTo: "Session", sourceOfTruth: "Scientist requirement",
      owner: "Dr. Chen", assignee: "Dr. Chen", module: "Analysis",
      status: "confirmed", tags: ["validation", "baseline"],
      createdAt: "2026-03-09", updatedAt: "2026-03-11",
      relatedItems: [],
      comments: [],
      activityLog: makeSeedLog("Dr. Chen", "Created this rule", "2026-03-09"),
    },
    {
      id: "rule4", type: "rule",
      ruleId: "KPI-001", layer: "KPI Calculation",
      ruleName: "Status Rollup Logic",
      description: "Session-level status is determined by all contained data cycle statuses: any Invalid → Session Invalid; all Valid → Session Valid; otherwise → Session Questionable",
      severity: "info", blocking: false,
      threshold: "rollup(cycle_statuses)",
      appliesTo: "Session → Campaign", sourceOfTruth: "PM + Scientist",
      owner: "PM", assignee: "PM", module: "Overview",
      status: "confirmed", tags: ["rollup", "KPI"],
      createdAt: "2026-03-10", updatedAt: "2026-03-11",
      relatedItems: ["def4"],
      comments: [],
      activityLog: makeSeedLog("PM", "Created this rule", "2026-03-10"),
    },
  ],
  releases: [
    {
      id: "rel1", type: "release",
      component: "Overview / KPI Card",
      currentBehavior: "KPI target displayed as 0.95",
      requestedChange: "Change KPI target to 0.99",
      dependency: ["backend_only"], backendRequired: true,
      versionTarget: "v2.1", status: "planned",
      module: "Overview", owner: "Ali", assignee: "Ali",
      source: "r2", tags: ["KPI"],
      createdAt: "2026-03-11", updatedAt: "2026-03-11",
      relatedItems: ["r2"],
      comments: [],
      activityLog: makeSeedLog("Ali", "Created this release item", "2026-03-11"),
    },
    {
      id: "rel2", type: "release",
      component: "Overview / Subtitle",
      currentBehavior: "Displays old subtitle",
      requestedChange: "Change to 'Real-time monitoring & data management'",
      dependency: ["frontend_only"], backendRequired: false,
      versionTarget: "v2.1", status: "completed",
      module: "Overview", owner: "Ali", assignee: "Ali",
      source: "r1", tags: ["UI", "copy"],
      createdAt: "2026-03-10", updatedAt: "2026-03-11",
      relatedItems: ["r1", "d1"],
      comments: [],
      activityLog: [
        { actor: "Ali", action: "Created this release item", timestamp: "2026-03-10 09:00:00" },
        { actor: "Ali", action: "Changed status from planned → in_progress", timestamp: "2026-03-10 14:00:00" },
        { actor: "Ali", action: "Changed status from in_progress → completed", timestamp: "2026-03-11 10:00:00" },
      ],
    },
    {
      id: "rel3", type: "release",
      component: "Alerts / Filter Bar",
      currentBehavior: "No filter functionality",
      requestedChange: "Add severity filter (critical / warning / info)",
      dependency: ["frontend_only"], backendRequired: false,
      versionTarget: "v2.2", status: "planned",
      module: "Alerts", owner: "", assignee: "Unassigned",
      source: "r4", tags: ["filter"],
      createdAt: "2026-03-12", updatedAt: "2026-03-12",
      relatedItems: ["r4"],
      comments: [],
      activityLog: makeSeedLog("PM", "Created this release item", "2026-03-12"),
    },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  proposed: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  implemented: "bg-green-100 text-green-800",
  deprecated: "bg-gray-200 text-gray-500",
  open: "bg-yellow-100 text-yellow-800",
  needs_clarification: "bg-orange-100 text-orange-800",
  draft: "bg-gray-100 text-gray-600",
  planned: "bg-purple-100 text-purple-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  reverted: "bg-red-100 text-red-800",
};
const PRIORITY_COLORS = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};
const SEVERITY_COLORS = { error: "text-red-600", warning: "text-amber-600", info: "text-blue-600" };

const isDone = (status) => DONE_STATUSES.includes(status);

const Badge = ({ text, color }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${color || "bg-gray-100 text-gray-600"}`}>
    {text}
  </span>
);
const StatusBadge = ({ status }) => <Badge text={status?.replace(/_/g, " ")} color={STATUS_COLORS[status]} />;
const PriorityBadge = ({ priority }) => <Badge text={priority} color={PRIORITY_COLORS[priority]} />;

// Title text with strikethrough when done
const ItemTitle = ({ text, status }) => (
  <span className={isDone(status) ? "line-through text-gray-400" : "text-gray-800"}>
    {text}
  </span>
);

// ─── Detail Panel with Comments & Activity Log ─────────────────────────

function DetailPanel({ item, allItems, onClose, onEdit, onDelete, onAddComment, onChangeStatus }) {
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState(TEAM_MEMBERS[0]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const commentInputRef = useRef(null);

  if (!item) return null;
  const related = (item.relatedItems || []).map((rid) => allItems.find((i) => i.id === rid)).filter(Boolean);
  const done = isDone(item.status);

  const handleSubmitComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onAddComment(item.id, { author: commentAuthor, text: trimmed, timestamp: now() });
    setCommentText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmitComment();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{item.id}</span>
            <StatusBadge status={item.status} />
            {item.assignee && item.assignee !== "Unassigned" && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <User size={11} /> {item.assignee}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit">
              <Edit3 size={15} />
            </button>
            <button onClick={() => { onDelete(item.id); onClose(); }} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete">
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title with strikethrough */}
          <h2 className={`text-lg font-semibold ${done ? "line-through text-gray-400" : "text-gray-900"}`}>
            {item.title || item.term || item.component || item.statement}
          </h2>

          {/* Quick status change */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Status:</span>
            <select
              className="text-xs border rounded px-2 py-1 bg-white"
              value={item.status}
              onChange={(e) => onChangeStatus(item.id, e.target.value)}
            >
              {(STATUSES[item.type] || []).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400">Assignee:</span>
            <span className="text-xs font-medium text-gray-700">{item.assignee || "Unassigned"}</span>
          </div>

          {/* Type-specific fields */}
          {item.type === "requirement" && (
            <>
              <Field label="User Intent" value={item.userIntent} long />
              <Field label="Priority"><PriorityBadge priority={item.priority} /></Field>
              <Field label="Version" value={item.version} />
            </>
          )}
          {item.type === "decision" && (
            <>
              <Field label="Decision Statement" value={item.statement} long />
              <Field label="Rationale" value={item.rationale} long />
              <Field label="Decided By" value={item.decidedBy} />
              <Field label="Decided At" value={item.decidedAt} />
              <Field label="Supersedes Previous?" value={item.supersedes ? "Yes" : "No"} />
              <Field label="Impacted Components" value={(item.impactedComponents || []).join(", ")} />
            </>
          )}
          {item.type === "definition" && (
            <>
              <Field label="Definition" value={item.definition} long />
              <Field label="Scope" value={item.scope} />
              {item.examples?.length > 0 && <Field label="Examples" value={item.examples.join("; ")} long />}
              {item.unresolvedQuestions?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> Unresolved Questions
                  </div>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {item.unresolvedQuestions.map((q, i) => <li key={i}>• {q}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
          {item.type === "rule" && (
            <>
              <Field label="Rule ID" value={item.ruleId} />
              <Field label="Layer" value={item.layer} />
              <Field label="Description" value={item.description} long />
              <Field label="Severity">
                <span className={`font-medium ${SEVERITY_COLORS[item.severity]}`}>{item.severity}</span>
              </Field>
              <Field label="Blocking?" value={item.blocking ? "Yes — blocks processing" : "No"} />
              <Field label="Threshold / Formula">
                <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">{item.threshold}</code>
              </Field>
              <Field label="Applies To" value={item.appliesTo} />
              <Field label="Source of Truth" value={item.sourceOfTruth} />
            </>
          )}
          {item.type === "release" && (
            <>
              <Field label="Current Behavior" value={item.currentBehavior} long />
              <Field label="Requested Change" value={item.requestedChange} long />
              <Field label="Dependencies" value={(item.dependency || []).map((d) => d.replace(/_/g, " ")).join(", ")} />
              <Field label="Backend Required?" value={item.backendRequired ? "Yes" : "No"} />
              <Field label="Version Target" value={item.versionTarget} />
            </>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 space-y-3">
            <Field label="Module" value={item.module} />
            <Field label="Owner" value={item.owner || "—"} />
            <Field label="Assignee" value={item.assignee || "Unassigned"} />
            <Field label="Source" value={item.source} />
            {item.tags?.length > 0 && (
              <Field label="Tags">
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((t) => <Badge key={t} text={t} />)}
                </div>
              </Field>
            )}
            <div className="flex gap-4 text-xs text-gray-400">
              <span>Created {item.createdAt}</span>
              <span>Updated {item.updatedAt}</span>
            </div>
          </div>

          {/* Related Items */}
          {related.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Link size={12} /> Related Items
              </div>
              <div className="space-y-1">
                {related.map((r) => (
                  <div key={r.id} className="text-sm text-blue-600 hover:underline cursor-pointer">
                    [{r.id}] {r.title || r.term || r.component || r.statement}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t pt-4">
            <div className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1">
              <MessageSquare size={12} /> Comments ({(item.comments || []).length})
            </div>

            {/* Existing comments */}
            {(item.comments || []).length > 0 && (
              <div className="space-y-2.5 mb-4">
                {item.comments.map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <User size={11} /> {c.author}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {c.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* New comment input */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-500">Post as:</label>
                <select
                  className="text-xs border rounded px-2 py-0.5 bg-white"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                >
                  {TEAM_MEMBERS.filter((m) => m !== "Unassigned").map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <textarea
                ref={commentInputRef}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
                rows={3}
                placeholder="Add a comment... (Cmd+Enter to submit)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send size={12} /> Submit
                </button>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowActivityLog(!showActivityLog)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-2"
            >
              <History size={12} />
              Activity Log ({(item.activityLog || []).length})
              {showActivityLog ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {showActivityLog && (
              <div className="relative pl-4 border-l-2 border-gray-200 space-y-3">
                {(item.activityLog || []).slice().reverse().map((log, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-300" />
                    <div className="text-xs">
                      <span className="font-semibold text-gray-700">{log.actor}</span>
                      <span className="text-gray-500"> {log.action}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} /> {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, long, children }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-400 mb-0.5">{label}</div>
      {children || (
        <div className={`text-sm text-gray-800 ${long ? "whitespace-pre-wrap" : ""}`}>{value || "—"}</div>
      )}
    </div>
  );
}

// ─── Create / Edit Modal ───────────────────────────────────────────────

function FormModal({ type, editItem, onSave, onClose, currentUser }) {
  const isEdit = !!editItem;
  const [form, setForm] = useState(() => {
    if (editItem) return { ...editItem, _tags: editItem.tags?.join(", ") || "" };
    const base = {
      id: uid(), type, title: "", module: MODULES[0], source: "", owner: "",
      assignee: TEAM_MEMBERS[0],
      status: STATUSES[type]?.[0] || "proposed",
      tags: [], createdAt: today(), updatedAt: today(),
      relatedItems: [],
      comments: [],
      activityLog: [{ actor: currentUser, action: `Created this ${type}`, timestamp: now() }],
      _tags: "",
    };
    if (type === "requirement") return { ...base, userIntent: "", priority: "medium", version: "" };
    if (type === "decision") return { ...base, statement: "", rationale: "", decidedBy: "", decidedAt: today(), supersedes: false, impactedComponents: [] };
    if (type === "definition") return { ...base, term: "", definition: "", scope: "", examples: [], unresolvedQuestions: [] };
    if (type === "rule") return { ...base, ruleId: "", layer: "", ruleName: "", description: "", severity: "warning", blocking: false, threshold: "", appliesTo: "", sourceOfTruth: "" };
    if (type === "release") return { ...base, component: "", currentBehavior: "", requestedChange: "", dependency: [], backendRequired: false, versionTarget: "" };
    return base;
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, updatedAt: today() }));
  const Input = ({ label, field, textarea }) => (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {textarea ? (
        <textarea className="w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none" rows={3} value={form[field] || ""} onChange={(e) => set(field, e.target.value)} />
      ) : (
        <input className="w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400" value={form[field] || ""} onChange={(e) => set(field, e.target.value)} />
      )}
    </div>
  );
  const Select = ({ label, field, options }) => (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <select className="w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm bg-white" value={form[field] || ""} onChange={(e) => set(field, e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );
  const Check = ({ label, field }) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={!!form[field]} onChange={(e) => set(field, e.target.checked)} className="rounded" />
      {label}
    </label>
  );

  const handleSave = () => {
    const tags = form._tags ? form._tags.split(",").map((t) => t.trim()).filter(Boolean) : form.tags || [];
    const cleaned = { ...form, tags };
    delete cleaned._tags;
    // Add edit log entry if editing
    if (isEdit) {
      cleaned.activityLog = [
        ...(cleaned.activityLog || []),
        { actor: currentUser, action: `Edited this ${type}`, timestamp: now() },
      ];
    }
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between z-10 rounded-t-xl">
          <span className="font-semibold text-gray-800">
            {isEdit ? "Edit" : "New"} {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          {/* Assignee — shared across all types */}
          <Select label="Assignee" field="assignee" options={TEAM_MEMBERS} />

          {type === "requirement" && (
            <>
              <Input label="Title" field="title" />
              <Input label="User Intent" field="userIntent" textarea />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Module" field="module" options={MODULES} />
                <Select label="Priority" field="priority" options={PRIORITIES} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Source" field="source" options={SOURCES} />
                <Select label="Status" field="status" options={STATUSES.requirement} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Owner" field="owner" />
                <Input label="Version" field="version" />
              </div>
            </>
          )}
          {type === "decision" && (
            <>
              <Input label="Title" field="title" />
              <Input label="Decision Statement" field="statement" textarea />
              <Input label="Rationale" field="rationale" textarea />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Module" field="module" options={MODULES} />
                <Select label="Status" field="status" options={STATUSES.decision} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Decided By" field="decidedBy" />
                <Input label="Decided At" field="decidedAt" />
              </div>
              <Input label="Owner" field="owner" />
              <Input label="Source" field="source" />
              <Check label="Supersedes previous decision?" field="supersedes" />
            </>
          )}
          {type === "definition" && (
            <>
              <Input label="Term" field="term" />
              <Input label="Definition" field="definition" textarea />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Scope" field="scope" />
                <Select label="Module" field="module" options={MODULES} />
              </div>
              <Select label="Status" field="status" options={STATUSES.definition} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Owner" field="owner" />
                <Input label="Source" field="source" />
              </div>
            </>
          )}
          {type === "rule" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Rule ID" field="ruleId" />
                <Input label="Rule Name" field="ruleName" />
              </div>
              <Input label="Layer" field="layer" />
              <Input label="Description" field="description" textarea />
              <div className="grid grid-cols-3 gap-3">
                <Select label="Severity" field="severity" options={["error", "warning", "info"]} />
                <Select label="Module" field="module" options={MODULES} />
                <Select label="Status" field="status" options={STATUSES.rule} />
              </div>
              <Input label="Threshold / Formula" field="threshold" />
              <Input label="Applies To" field="appliesTo" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Owner" field="owner" />
                <Input label="Source of Truth" field="sourceOfTruth" />
              </div>
              <Check label="Blocking?" field="blocking" />
            </>
          )}
          {type === "release" && (
            <>
              <Input label="Component" field="component" />
              <Input label="Current Behavior" field="currentBehavior" textarea />
              <Input label="Requested Change" field="requestedChange" textarea />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Module" field="module" options={MODULES} />
                <Select label="Status" field="status" options={STATUSES.release} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Version Target" field="versionTarget" />
                <Input label="Owner" field="owner" />
              </div>
              <Input label="Source" field="source" />
              <Check label="Backend Required?" field="backendRequired" />
            </>
          )}

          <Input label="Tags (comma separated)" field="_tags" />
        </div>
        <div className="sticky bottom-0 bg-white border-t px-5 py-3 flex justify-end gap-2 rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
          <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800">
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Spec Board ────────────────────────────────────────────────────────

function SpecBoard({ items, onSelect }) {
  const [expandedModule, setExpandedModule] = useState(null);
  const byModule = useMemo(() => {
    const m = {};
    MODULES.forEach((mod) => { m[mod] = { requirements: [], decisions: [], definitions: [], rules: [], releases: [] }; });
    items.forEach((i) => {
      const mod = i.module || "Overview";
      if (!m[mod]) m[mod] = { requirements: [], decisions: [], definitions: [], rules: [], releases: [] };
      const cat = { requirement: "requirements", decision: "decisions", definition: "definitions", rule: "rules", release: "releases" }[i.type];
      if (cat && m[mod]) m[mod][cat].push(i);
    });
    return m;
  }, [items]);

  const unresolved = items.filter((i) => ["proposed", "open", "draft", "needs_clarification"].includes(i.status));

  return (
    <div className="space-y-4">
      {unresolved.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-800 font-medium text-sm mb-2">
            <AlertTriangle size={15} /> Open Questions & Unresolved ({unresolved.length})
          </div>
          <div className="grid gap-1.5">
            {unresolved.slice(0, 8).map((i) => (
              <div key={i.id} onClick={() => onSelect(i)} className="flex items-center gap-2 text-sm text-amber-900 hover:bg-amber-100 rounded px-2 py-1 cursor-pointer">
                <StatusBadge status={i.status} />
                <span className="text-xs text-amber-500 font-mono">{i.id}</span>
                <span className="truncate">{i.title || i.term || i.component || i.statement}</span>
                {i.assignee && i.assignee !== "Unassigned" && (
                  <span className="text-xs text-amber-500 flex items-center gap-0.5"><User size={10} />{i.assignee}</span>
                )}
                <span className="ml-auto text-xs text-amber-500">{i.module}</span>
              </div>
            ))}
            {unresolved.length > 8 && <div className="text-xs text-amber-500 pl-2">+{unresolved.length - 8} more...</div>}
          </div>
        </div>
      )}

      {MODULES.map((mod) => {
        const data = byModule[mod];
        const total = Object.values(data).reduce((s, arr) => s + arr.length, 0);
        const isExpanded = expandedModule === mod;
        return (
          <div key={mod} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors" onClick={() => setExpandedModule(isExpanded ? null : mod)}>
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                <span className="font-semibold text-gray-800">{mod}</span>
                <span className="text-xs text-gray-400">{total} items</span>
              </div>
              <div className="flex gap-1.5">
                {data.requirements.length > 0 && <Badge text={`${data.requirements.length} req`} color="bg-blue-50 text-blue-600" />}
                {data.decisions.length > 0 && <Badge text={`${data.decisions.length} dec`} color="bg-green-50 text-green-600" />}
                {data.definitions.length > 0 && <Badge text={`${data.definitions.length} def`} color="bg-purple-50 text-purple-600" />}
                {data.rules.length > 0 && <Badge text={`${data.rules.length} rule`} color="bg-orange-50 text-orange-600" />}
                {data.releases.length > 0 && <Badge text={`${data.releases.length} rel`} color="bg-pink-50 text-pink-600" />}
              </div>
            </button>
            {isExpanded && (
              <div className="border-t px-5 py-3 space-y-2">
                {Object.entries(data).map(([cat, arr]) => arr.length > 0 && (
                  <div key={cat}>
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{cat}</div>
                    {arr.map((i) => (
                      <div key={i.id} onClick={() => onSelect(i)} className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer text-sm">
                        <span className="text-xs font-mono text-gray-400 w-10">{i.id}</span>
                        <StatusBadge status={i.status} />
                        <ItemTitle text={i.title || i.term || i.component || i.statement} status={i.status} />
                        {i.priority && <PriorityBadge priority={i.priority} />}
                        {i.assignee && i.assignee !== "Unassigned" && (
                          <span className="ml-auto text-xs text-gray-400 flex items-center gap-0.5"><User size={10} />{i.assignee}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Item List (shared for Decisions, Definitions, Rules) ──────────────

function ItemList({ items, onSelect, type }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return items
      .filter((i) => i.type === type)
      .filter((i) => filterStatus === "all" || i.status === filterStatus)
      .filter((i) => filterModule === "all" || i.module === filterModule)
      .filter((i) => filterAssignee === "all" || i.assignee === filterAssignee)
      .filter((i) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return [i.title, i.term, i.component, i.statement, i.description, i.definition, i.ruleName, i.ruleId, i.owner, i.assignee, ...(i.tags || [])].some((v) => v?.toLowerCase()?.includes(s));
      })
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }, [items, type, filterStatus, filterModule, filterAssignee, search]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="border rounded-lg px-2.5 py-1.5 text-sm bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All status</option>
          {(STATUSES[type] || []).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select className="border rounded-lg px-2.5 py-1.5 text-sm bg-white" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
          <option value="all">All modules</option>
          {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="border rounded-lg px-2.5 py-1.5 text-sm bg-white" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="all">All assignees</option>
          {TEAM_MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="text-xs text-gray-400">{filtered.length} items</div>
      <div className="space-y-1.5">
        {filtered.map((i) => {
          const done = isDone(i.status);
          return (
            <div key={i.id} onClick={() => onSelect(i)} className={`bg-white rounded-lg border p-3 hover:shadow-sm cursor-pointer transition-shadow ${done ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-2">
                <span className="text-xs font-mono text-gray-400 mt-0.5 shrink-0">{i.id}{i.ruleId ? ` / ${i.ruleId}` : ""}</span>
                <div className="min-w-0 flex-1">
                  <div className={`font-medium text-sm truncate ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {i.title || i.term || i.component || i.statement}
                  </div>
                  {i.description && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{i.description}</div>}
                  {i.definition && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{i.definition}</div>}
                  {i.requestedChange && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{i.requestedChange}</div>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={i.status} />
                  {i.priority && <PriorityBadge priority={i.priority} />}
                  {i.severity && <span className={`text-xs font-medium ${SEVERITY_COLORS[i.severity]}`}>{i.severity}</span>}
                  {i.blocking && <Badge text="blocking" color="bg-red-100 text-red-700" />}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span>{i.module}</span>
                {i.assignee && i.assignee !== "Unassigned" && (
                  <span className="flex items-center gap-0.5"><User size={10} /> {i.assignee}</span>
                )}
                {i.versionTarget && <span>{i.versionTarget}</span>}
                {(i.comments || []).length > 0 && (
                  <span className="flex items-center gap-0.5"><MessageSquare size={10} /> {i.comments.length}</span>
                )}
                {i.tags?.length > 0 && (
                  <span className="flex gap-1">{i.tags.slice(0, 3).map((t) => <span key={t} className="bg-gray-100 px-1.5 rounded">{t}</span>)}</span>
                )}
                <span className="ml-auto">{i.updatedAt}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No items match your filters.</div>}
      </div>
    </div>
  );
}

// ─── Release Diff ──────────────────────────────────────────────────────

function ReleaseDiff({ items, onSelect }) {
  const releases = items.filter((i) => i.type === "release");
  const versions = [...new Set(releases.map((r) => r.versionTarget).filter(Boolean))].sort().reverse();

  return (
    <div className="space-y-4">
      {versions.map((v) => {
        const vItems = releases.filter((r) => r.versionTarget === v);
        const reqs = items.filter((i) => i.type === "requirement" && i.version === v);
        return (
          <div key={v} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
              <span className="font-semibold text-gray-800">{v}</span>
              <div className="flex gap-2">
                <Badge text={`${vItems.length} changes`} color="bg-blue-50 text-blue-600" />
                <Badge text={`${reqs.length} requirements`} color="bg-green-50 text-green-600" />
              </div>
            </div>
            <div className="divide-y">
              {vItems.map((r) => {
                const done = isDone(r.status);
                return (
                  <div key={r.id} onClick={() => onSelect(r)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className={`font-medium text-sm ${done ? "line-through text-gray-400" : "text-gray-800"}`}>{r.component}</span>
                      {r.assignee && r.assignee !== "Unassigned" && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5"><User size={10} />{r.assignee}</span>
                      )}
                      {r.backendRequired && <Badge text="backend" color="bg-orange-50 text-orange-600" />}
                      {(r.dependency || []).map((d) => <Badge key={d} text={d.replace(/_/g, " ")} />)}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-gray-400">Before:</span> <span className="text-gray-600">{r.currentBehavior}</span></div>
                      <div><span className="text-gray-400">After:</span> <span className={`font-medium ${done ? "line-through text-gray-400" : "text-gray-800"}`}>{r.requestedChange}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {versions.length === 0 && <div className="text-center py-12 text-gray-400">No release items yet.</div>}
    </div>
  );
}

// ─── Dependency View ───────────────────────────────────────────────────

function DependencyView({ items, onSelect }) {
  const groups = {};
  DEPENDENCIES.forEach((d) => { groups[d] = []; });
  groups["unresolved_definition"] = [];

  items.forEach((i) => {
    if (i.dependency) i.dependency.forEach((d) => { if (groups[d]) groups[d].push(i); });
    if (i.type === "definition" && ["draft", "needs_clarification"].includes(i.status)) groups["unresolved_definition"].push(i);
  });

  return (
    <div className="space-y-3">
      {Object.entries(groups).filter(([, arr]) => arr.length > 0).map(([dep, arr]) => (
        <div key={dep} className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
            <span className="font-semibold text-sm text-gray-700">{dep.replace(/_/g, " ").toUpperCase()}</span>
            <Badge text={`${arr.length}`} color="bg-gray-200 text-gray-600" />
          </div>
          <div className="divide-y">
            {arr.map((i) => (
              <div key={`${dep}-${i.id}`} onClick={() => onSelect(i)} className="px-5 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm">
                <span className="text-xs font-mono text-gray-400">{i.id}</span>
                <StatusBadge status={i.status} />
                <ItemTitle text={i.title || i.term || i.component || i.statement} status={i.status} />
                {i.assignee && i.assignee !== "Unassigned" && (
                  <span className="text-xs text-gray-400 flex items-center gap-0.5"><User size={10} />{i.assignee}</span>
                )}
                <span className="ml-auto text-xs text-gray-400">{i.module}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────

const NAV = [
  { id: "board", label: "Spec Board", icon: FileText },
  { id: "decisions", label: "Decision Log", icon: CheckCircle },
  { id: "definitions", label: "Definitions", icon: BookOpen },
  { id: "rules", label: "Rule Registry", icon: Shield },
  { id: "releases", label: "Release Diff", icon: Package },
  { id: "dependencies", label: "Dependencies", icon: Link },
];

export default function App() {
  const [page, setPage] = useState("board");
  const [currentUser, setCurrentUser] = useState("Ali");
  const [data, setData] = useState(() => [
    ...SEED.requirements, ...SEED.decisions,
    ...SEED.definitions, ...SEED.rules, ...SEED.releases,
  ]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSave = useCallback((item) => {
    setData((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) return prev.map((v, j) => (j === idx ? item : v));
      return [...prev, item];
    });
  }, []);

  const handleDelete = useCallback((id) => {
    setData((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleAddComment = useCallback((id, comment) => {
    setData((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      return {
        ...i,
        comments: [...(i.comments || []), comment],
        activityLog: [
          ...(i.activityLog || []),
          { actor: comment.author, action: "Added a comment", timestamp: comment.timestamp },
        ],
        updatedAt: today(),
      };
    }));
    // Also update selectedItem so the panel refreshes
    setSelectedItem((prev) => {
      if (!prev || prev.id !== id) return prev;
      return {
        ...prev,
        comments: [...(prev.comments || []), comment],
        activityLog: [
          ...(prev.activityLog || []),
          { actor: comment.author, action: "Added a comment", timestamp: comment.timestamp },
        ],
        updatedAt: today(),
      };
    });
  }, []);

  const handleChangeStatus = useCallback((id, newStatus) => {
    setData((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const logEntry = {
        actor: currentUser,
        action: `Changed status from ${i.status} → ${newStatus}`,
        timestamp: now(),
      };
      return {
        ...i, status: newStatus, updatedAt: today(),
        activityLog: [...(i.activityLog || []), logEntry],
      };
    }));
    setSelectedItem((prev) => {
      if (!prev || prev.id !== id) return prev;
      const logEntry = {
        actor: currentUser,
        action: `Changed status from ${prev.status} → ${newStatus}`,
        timestamp: now(),
      };
      return {
        ...prev, status: newStatus, updatedAt: today(),
        activityLog: [...(prev.activityLog || []), logEntry],
      };
    });
  }, [currentUser]);

  const counts = useMemo(() => ({
    requirement: data.filter((i) => i.type === "requirement").length,
    decision: data.filter((i) => i.type === "decision").length,
    definition: data.filter((i) => i.type === "definition").length,
    rule: data.filter((i) => i.type === "rule").length,
    release: data.filter((i) => i.type === "release").length,
  }), [data]);

  const typeForPage = { decisions: "decision", definitions: "definition", rules: "rule", releases: "release" };
  const addType = page === "board" ? null : typeForPage[page];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} bg-white border-r flex flex-col transition-all duration-200 shrink-0`}>
        <div className="px-4 py-4 border-b">
          <h1 className="text-base font-bold text-gray-900 tracking-tight">Product Spec</h1>
          <p className="text-xs text-gray-400 mt-0.5">System v0.1</p>
        </div>

        {/* Current user selector */}
        <div className="px-4 py-2 border-b">
          <label className="text-xs text-gray-400">Acting as</label>
          <select
            className="w-full mt-0.5 text-sm border rounded px-2 py-1 bg-white font-medium"
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
          >
            {TEAM_MEMBERS.filter((m) => m !== "Unassigned").map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = page === n.id;
            return (
              <button key={n.id} onClick={() => setPage(n.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                <Icon size={15} />{n.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t text-xs text-gray-400 space-y-1">
          <div className="grid grid-cols-2 gap-1">
            <span>Req: {counts.requirement}</span><span>Dec: {counts.decision}</span>
            <span>Def: {counts.definition}</span><span>Rule: {counts.rule}</span>
            <span>Rel: {counts.release}</span><span>Total: {data.length}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded">
              <FileText size={16} />
            </button>
            <h2 className="font-semibold text-gray-800">{NAV.find((n) => n.id === page)?.label}</h2>
          </div>
          <div className="flex items-center gap-2">
            {page === "board" && (
              <div className="flex gap-1">
                {["requirement", "decision", "definition", "rule", "release"].map((t) => (
                  <button key={t} onClick={() => setShowForm({ type: t })} className="px-2.5 py-1 text-xs border rounded-md hover:bg-gray-50 text-gray-600">
                    + {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            )}
            {addType && (
              <button onClick={() => setShowForm({ type: addType })} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
                <Plus size={14} /> New
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {page === "board" && <SpecBoard items={data} onSelect={setSelectedItem} />}
          {page === "decisions" && <ItemList items={data} type="decision" onSelect={setSelectedItem} />}
          {page === "definitions" && <ItemList items={data} type="definition" onSelect={setSelectedItem} />}
          {page === "rules" && <ItemList items={data} type="rule" onSelect={setSelectedItem} />}
          {page === "releases" && <ReleaseDiff items={data} onSelect={setSelectedItem} />}
          {page === "dependencies" && <DependencyView items={data} onSelect={setSelectedItem} />}
        </div>
      </main>

      {/* Detail Panel */}
      {selectedItem && (
        <DetailPanel
          item={selectedItem}
          allItems={data}
          onClose={() => setSelectedItem(null)}
          onEdit={(item) => { setShowForm({ type: item.type, editItem: item }); setSelectedItem(null); }}
          onDelete={handleDelete}
          onAddComment={handleAddComment}
          onChangeStatus={handleChangeStatus}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <FormModal
          type={showForm.type}
          editItem={showForm.editItem}
          onSave={handleSave}
          onClose={() => setShowForm(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
