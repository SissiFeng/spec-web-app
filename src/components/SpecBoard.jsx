import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Inbox, User } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { TYPE_KEYS, typeMeta, itemTitle } from "../data/itemTypes";
import { formatUSD } from "../data/constants";
import { Badge, ItemBadges, ItemTitle, Ref } from "./shared";

// Workload board: everything in the engagement, grouped by workload.

export default function SpecBoard({ items, refs, onSelect }) {
  const config = useProjectConfig();
  const [expanded, setExpanded] = useState(() => new Set());

  const byModule = useMemo(() => {
    const m = {};
    const modules = [...config.modules, ...new Set(items.map((i) => i.module).filter((x) => x && !config.modules.includes(x)))];
    modules.forEach((mod) => { m[mod] = []; });
    items.forEach((i) => {
      const mod = i.module || config.modules[0];
      (m[mod] ||= []).push(i);
    });
    return m;
  }, [items, config.modules]);

  const triage = items.filter((i) => i.status === "pending_review");

  const toggle = (mod) => setExpanded((s) => {
    const n = new Set(s);
    n.has(mod) ? n.delete(mod) : n.add(mod);
    return n;
  });

  return (
    <div className="space-y-4">
      {triage.length > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-violet-800 font-medium text-sm mb-2">
            <Inbox size={15} /> Triage inbox ({triage.length}) — confirm type and status of imported notes
          </div>
          <div className="grid gap-1.5">
            {triage.slice(0, 10).map((i) => (
              <div key={i.id} onClick={() => onSelect(i)} className="flex items-center gap-2 text-sm text-violet-900 hover:bg-violet-100 rounded px-2 py-1 cursor-pointer">
                <Badge text={typeMeta(i.type).label} color="bg-violet-100 text-violet-700" />
                <span className="truncate">{itemTitle(i)}</span>
                <span className="ml-auto text-xs text-violet-500">{i.module}</span>
              </div>
            ))}
            {triage.length > 10 && <div className="text-xs text-violet-500 pl-2">+{triage.length - 10} more...</div>}
          </div>
        </div>
      )}

      {Object.entries(byModule).map(([mod, list]) => {
        const isExpanded = expanded.has(mod);
        const cost = list.filter((i) => i.type === "component").reduce((s, c) => s + (Number(c.monthlyCost) || 0), 0);
        return (
          <div key={mod} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <button className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors" onClick={() => toggle(mod)}>
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                <span className="font-semibold text-gray-800">{mod}</span>
                <span className="text-xs text-gray-400">{list.length} items</span>
                {cost > 0 && <span className="text-xs text-gray-500">{formatUSD(cost)}/mo</span>}
              </div>
              <div className="flex gap-1.5">
                {TYPE_KEYS.map((t) => {
                  const n = list.filter((i) => i.type === t).length;
                  return n > 0 && <Badge key={t} text={`${n} ${typeMeta(t).label}`} color={typeMeta(t).color} />;
                })}
              </div>
            </button>
            {isExpanded && (
              <div className="border-t px-5 py-3 space-y-3">
                {list.length === 0 && <div className="text-sm text-gray-400">Nothing captured for this workload yet.</div>}
                {TYPE_KEYS.map((t) => {
                  const arr = list.filter((i) => i.type === t);
                  if (!arr.length) return null;
                  return (
                    <div key={t}>
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{typeMeta(t).plural}</div>
                      {arr.map((i) => (
                        <div key={i.id} onClick={() => onSelect(i)} className="flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded cursor-pointer text-sm">
                          <Ref value={refs[i.id]} />
                          <span className="truncate flex-1"><ItemTitle text={itemTitle(i)} status={i.status} /></span>
                          <ItemBadges item={i} />
                          {i.owner && <span className="text-xs text-gray-400 flex items-center gap-0.5"><User size={10} />{i.owner}</span>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
