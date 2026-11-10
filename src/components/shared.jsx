import { STATUS_COLORS, PRIORITY_COLORS, isDone } from "../data/constants";
import { pillarByKey } from "../data/pillars";
import { PROVIDER_COLORS } from "../data/cloudCatalog";
import { typeMeta } from "../data/itemTypes";

export const Badge = ({ text, color, title }) => (
  <span title={title} className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${color || "bg-gray-100 text-gray-600"}`}>
    {text}
  </span>
);

export const StatusBadge = ({ status }) => (
  <Badge text={status?.replace(/_/g, " ")} color={STATUS_COLORS[status]} />
);

export const PriorityBadge = ({ priority }) =>
  priority ? <Badge text={priority} color={PRIORITY_COLORS[priority]} /> : null;

export const PillarBadge = ({ pillar }) => {
  const p = pillarByKey(pillar);
  return p ? <Badge text={p.short} title={p.label} color={p.color} /> : null;
};

export const ProviderBadge = ({ provider }) =>
  provider ? <Badge text={provider} color={PROVIDER_COLORS[provider]} /> : null;

export const TypeBadge = ({ type }) => {
  const t = typeMeta(type);
  return <Badge text={t.label} color={t.color} />;
};

export const Ref = ({ value }) => (
  <span className="text-[11px] font-mono text-gray-400 shrink-0">{value}</span>
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

// Type-specific badges shown next to an item in any list.
export function ItemBadges({ item }) {
  return (
    <>
      {item.pillar && <PillarBadge pillar={item.pillar} />}
      {item.provider && <ProviderBadge provider={item.provider} />}
      {item.priority && <PriorityBadge priority={item.priority} />}
      {item.type === "risk" && item.impact && <Badge text={`${item.raidType?.[0]?.toUpperCase() || "R"} · ${item.likelihood?.[0]?.toUpperCase() || "?"}/${item.impact[0].toUpperCase()}`} title="Type · Likelihood/Impact" color={PRIORITY_COLORS[item.impact]} />}
      <StatusBadge status={item.status} />
    </>
  );
}
