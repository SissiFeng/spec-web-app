import { STATUS_COLORS, PRIORITY_COLORS, isDone } from "../data/constants";

export const Badge = ({ text, color }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${color || "bg-gray-100 text-gray-600"}`}>
    {text}
  </span>
);

export const StatusBadge = ({ status }) => (
  <Badge text={status?.replace(/_/g, " ")} color={STATUS_COLORS[status]} />
);

export const PriorityBadge = ({ priority }) => (
  <Badge text={priority} color={PRIORITY_COLORS[priority]} />
);

export const ItemTitle = ({ text, status }) => (
  <span className={isDone(status) ? "line-through text-gray-400" : "text-gray-800"}>
    {text}
  </span>
);

export function Field({ label, value, long, children }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-400 mb-0.5">{label}</div>
      {children || (
        <div className={`text-sm text-gray-800 ${long ? "whitespace-pre-wrap" : ""}`}>{value || "—"}</div>
      )}
    </div>
  );
}
