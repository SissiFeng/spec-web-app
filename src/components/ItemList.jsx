import { useState, useMemo, Fragment } from "react";
import { Search, User, MessageSquare, Link2 } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { isDone } from "../data/constants";
import { PILLARS } from "../data/pillars";
import { typeMeta, itemTitle } from "../data/itemTypes";
import { ItemBadges, Ref } from "./shared";

const LEVELS = ["high", "medium", "low"];
const CELL = {
  9: "bg-red-500 text-white", 6: "bg-red-300 text-red-950", 4: "bg-amber-300 text-amber-950",
  3: "bg-amber-200 text-amber-900", 2: "bg-yellow-100 text-yellow-900", 1: "bg-gray-100 text-gray-600",
};
const LV = { low: 1, medium: 2, high: 3 };

// Likelihood × impact heat map; clicking a cell filters the list.
function RiskMatrix({ risks, cell, onCell }) {
  return (
    <div className="bg-white border rounded-xl p-4 inline-block">
      <div className="text-xs font-medium text-gray-500 mb-2">Open exposure (likelihood × impact)</div>
      <div className="grid grid-cols-[auto_repeat(3,3.5rem)] gap-1 text-xs items-center">
        <span />
        {["low", "medium", "high"].map((i) => <span key={i} className="text-center text-gray-400">I: {i}</span>)}
        {LEVELS.map((l) => (
          <Fragment key={l}>
            <span className="text-gray-400 pr-1 text-right">L: {l}</span>
            {["low", "medium", "high"].map((i) => {
              const n = risks.filter((r) => r.likelihood === l && r.impact === i).length;
              const active = cell && cell.l === l && cell.i === i;
              return (
                <button key={`${l}-${i}`} onClick={() => onCell(active ? null : { l, i })}
                  className={`h-10 rounded-md font-semibold ${CELL[LV[l] * LV[i]]} ${active ? "ring-2 ring-gray-900" : ""} ${n ? "" : "opacity-40"}`}>
                  {n || ""}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default function ItemList({ items, refs, onSelect, type }) {
  const config = useProjectConfig();
  const meta = typeMeta(type);
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterModule, setFilterModule] = useState("all");
  const [filterPillar, setFilterPillar] = useState("all");
  const [riskCell, setRiskCell] = useState(null);
  const [search, setSearch] = useState("");

  const hasPillar = meta.fields.some((f) => f.key === "pillar");
  const statuses = config.statuses[type] || meta.statuses;
  const doneStatuses = meta.doneStatuses;

  const ofType = useMemo(() => items.filter((i) => i.type === type), [items, type]);

  const filtered = useMemo(() => {
    return ofType
      .filter((i) => filterStatus === "all" || (filterStatus === "active" ? !isDone(i.status, doneStatuses) : i.status === filterStatus))
      .filter((i) => filterModule === "all" || i.module === filterModule)
      .filter((i) => filterPillar === "all" || i.pillar === filterPillar || (i.pillars || []).includes(filterPillar))
      .filter((i) => !riskCell || (i.likelihood === riskCell.l && i.impact === riskCell.i))
      .filter((i) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return [refs[i.id], itemTitle(i), i.description, i.statement, i.context, i.service, i.target, i.mitigation, i.owner, ...(i.tags || [])]
          .some((v) => v && String(v).toLowerCase().includes(s));
      })
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }, [ofType, filterStatus, filterModule, filterPillar, riskCell, search, refs, doneStatuses]);

  const subtitle = (i) => i.type === "nfr" ? [i.metric, i.target].filter(Boolean).join(" · ")
    : i.type === "component" ? [i.service, i.sku, i.region].filter(Boolean).join(" · ")
    : i.type === "risk" ? i.mitigation && `Mitigation: ${i.mitigation}`
    : i.description || i.statement || i.context;

  return (
    <div className="space-y-3">
      {type === "risk" && (
        <RiskMatrix risks={ofType.filter((r) => ["open", "mitigating"].includes(r.status))} cell={riskCell} onCell={setRiskCell} />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm" placeholder={`Search ${meta.plural.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="border rounded-lg px-2.5 py-1.5 text-sm bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="all">All status</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        {hasPillar || type === "decision" ? (
          <select className="border rounded-lg px-2.5 py-1.5 text-sm bg-white" value={filterPillar} onChange={(e) => setFilterPillar(e.target.value)}>
            <option value="all">All pillars</option>
            {PILLARS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        ) : null}
        <select className="border rounded-lg px-2.5 py-1.5 text-sm bg-white" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
          <option value="all">All workloads</option>
          {config.modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="text-xs text-gray-400">{filtered.length} of {ofType.length} {meta.plural.toLowerCase()}</div>
      <div className="space-y-1.5">
        {filtered.map((i) => {
          const done = isDone(i.status, doneStatuses);
          const sub = subtitle(i);
          return (
            <div key={i.id} onClick={() => onSelect(i)} className={`bg-white rounded-lg border p-3 hover:shadow-sm cursor-pointer transition-shadow ${done ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5"><Ref value={refs[i.id]} /></span>
                <div className="min-w-0 flex-1">
                  <div className={`font-medium text-sm truncate ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {itemTitle(i)}
                  </div>
                  {sub && <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{sub}</div>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <ItemBadges item={i} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span>{i.module}</span>
                {i.owner && <span className="flex items-center gap-0.5"><User size={10} /> {i.owner}</span>}
                {(i.relatedItems || []).length > 0 && <span className="flex items-center gap-0.5"><Link2 size={10} /> {i.relatedItems.length}</span>}
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
        {filtered.length === 0 && <div className="text-center py-8 text-gray-400 text-sm">No {meta.plural.toLowerCase()} match your filters. Press <kbd className="px-1 border rounded">N</kbd> to add one.</div>}
      </div>
    </div>
  );
}
