import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { itemTitle } from "../data/itemTypes";
import { PROVIDER_COLORS } from "../data/cloudCatalog";
import { Badge, PillarBadge, PriorityBadge, Ref } from "./shared";

// Requirements/NFRs × components matrix. Clicking a cell links or unlinks
// the pair, so traceability is maintained in seconds rather than by
// editing each item.

const INACTIVE = ["rejected", "deferred", "retired", "superseded", "deprecated"];

export default function TraceabilityView({ items, refs, onSelect, onToggleLink }) {
  const [rowType, setRowType] = useState("requirement");
  const [onlyGaps, setOnlyGaps] = useState(false);

  const linked = useMemo(() => {
    const set = new Set();
    for (const i of items) for (const r of i.relatedItems || []) { set.add(`${i.id}|${r}`); set.add(`${r}|${i.id}`); }
    return set;
  }, [items]);

  const comps = items.filter((i) => i.type === "component" && !INACTIVE.includes(i.status));
  const allRows = items.filter((i) => i.type === rowType && !INACTIVE.includes(i.status));
  const traced = (r) => comps.some((c) => linked.has(`${r.id}|${c.id}`));
  const rows = onlyGaps ? allRows.filter((r) => !traced(r)) : allRows;
  const coverage = allRows.length ? Math.round((100 * allRows.filter(traced).length) / allRows.length) : 0;

  if (comps.length === 0) {
    return <div className="text-sm text-gray-400 py-8 text-center">Add architecture components first — then trace requirements to them here.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-white border rounded-lg p-0.5">
          {[["requirement", "Requirements"], ["nfr", "NFRs"]].map(([k, label]) => (
            <button key={k} onClick={() => setRowType(k)} className={`px-2.5 py-1 text-xs rounded-md ${rowType === k ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}>{label}</button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          <input type="checkbox" checked={onlyGaps} onChange={(e) => setOnlyGaps(e.target.checked)} className="rounded" /> Only untraced
        </label>
        <div className="text-sm text-gray-600 ml-auto">
          Coverage <span className={`font-semibold ${coverage >= 80 ? "text-emerald-600" : "text-amber-600"}`}>{coverage}%</span>
          <span className="text-gray-400"> · click a cell to link / unlink</span>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10 text-left px-3 py-2 border-b w-[300px] min-w-[300px] max-w-[300px]" />
              {comps.map((c) => (
                <th key={c.id} className="border-b border-l px-1 py-2 align-bottom">
                  <button onClick={() => onSelect(c)} className="flex flex-col items-center gap-1 w-20 hover:text-blue-600" title={`${itemTitle(c)} — ${c.service || ""}`}>
                    <Badge text={c.provider || "?"} color={PROVIDER_COLORS[c.provider]} />
                    <span className="line-clamp-2 font-medium text-center leading-tight">{itemTitle(c)}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const ok = traced(r);
              return (
                <tr key={r.id} className={ok ? "" : "bg-amber-50/50"}>
                  <td className="sticky left-0 bg-white z-10 px-3 py-1.5 border-b w-[300px] min-w-[300px] max-w-[300px]">
                    <button onClick={() => onSelect(r)} className="flex items-center gap-2 text-left w-full hover:text-blue-600">
                      <Ref value={refs[r.id]} />
                      <span className="truncate flex-1 min-w-0">{itemTitle(r)}</span>
                      {r.pillar ? <PillarBadge pillar={r.pillar} /> : <PriorityBadge priority={r.priority} />}
                    </button>
                  </td>
                  {comps.map((c) => {
                    const on = linked.has(`${r.id}|${c.id}`);
                    return (
                      <td key={c.id} className="border-b border-l p-0 text-center">
                        <button onClick={() => onToggleLink(r, c)} className={`w-full h-8 flex items-center justify-center ${on ? "bg-emerald-100 text-emerald-700" : "hover:bg-gray-100 text-transparent hover:text-gray-300"}`}>
                          <Check size={14} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={comps.length + 1} className="px-3 py-6 text-center text-gray-400">{onlyGaps ? "Everything is traced." : "Nothing to trace yet."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
