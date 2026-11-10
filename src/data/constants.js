import { DEFAULT_DONE_STATUSES } from "./itemTypes";

// ─── Shared Display Constants ────────────────────────────────────────

export const STATUS_COLORS = {
  proposed: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_design: "bg-indigo-100 text-indigo-800",
  addressed: "bg-green-100 text-green-800",
  deferred: "bg-gray-200 text-gray-500",
  rejected: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-600",
  agreed: "bg-blue-100 text-blue-800",
  validated: "bg-green-100 text-green-800",
  at_risk: "bg-orange-100 text-orange-800",
  accepted: "bg-green-100 text-green-800",
  superseded: "bg-gray-200 text-gray-500",
  deprecated: "bg-gray-200 text-gray-500",
  open: "bg-red-100 text-red-800",
  mitigating: "bg-amber-100 text-amber-800",
  closed: "bg-gray-200 text-gray-500",
  designed: "bg-blue-100 text-blue-800",
  deployed: "bg-green-100 text-green-800",
  retired: "bg-gray-200 text-gray-500",
  pending_review: "bg-violet-100 text-violet-800",
};

export const PRIORITY_COLORS = {
  must: "bg-red-100 text-red-700",
  should: "bg-orange-100 text-orange-700",
  could: "bg-yellow-100 text-yellow-700",
  wont: "bg-gray-100 text-gray-500",
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

export const SEVERITY_COLORS = {
  high: "text-red-600",
  medium: "text-amber-600",
  low: "text-blue-600",
};

export const isDone = (status, doneStatuses = DEFAULT_DONE_STATUSES) =>
  doneStatuses.includes(status);

// ─── Utilities ───────────────────────────────────────────────────────

export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);
export const today = () => new Date().toISOString().slice(0, 10);

export const formatUSD = (n) =>
  `$${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
