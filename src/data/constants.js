// ─── Shared Display Constants ────────────────────────────────────────

export const STATUS_COLORS = {
  proposed: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  implemented: "bg-green-100 text-green-800",
  deprecated: "bg-gray-200 text-gray-500",
  open: "bg-yellow-100 text-yellow-800",
  needs_clarification: "bg-orange-100 text-orange-800",
  draft: "bg-gray-100 text-gray-600",
  pending_review: "bg-violet-100 text-violet-800",
  planned: "bg-purple-100 text-purple-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  reverted: "bg-red-100 text-red-800",
};

export const PRIORITY_COLORS = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

export const SEVERITY_COLORS = {
  error: "text-red-600",
  warning: "text-amber-600",
  info: "text-blue-600",
};

const DEFAULT_DONE = ["implemented", "completed", "deprecated", "rejected", "reverted"];

export const isDone = (status, doneStatuses = DEFAULT_DONE) =>
  doneStatuses.includes(status);

// ─── Utilities ───────────────────────────────────────────────────────

export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);
export const today = () => new Date().toISOString().slice(0, 10);
