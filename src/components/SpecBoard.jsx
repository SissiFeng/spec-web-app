import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, User } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { Badge, StatusBadge, PriorityBadge, ItemTitle } from "./shared";

export default function SpecBoard({ items, onSelect }) {
  const config = useProjectConfig();
  const [expandedModule, setExpandedModule] = useState(null);

  const byModule = useMemo(() => {
    const m = {};
    config.modules.forEach((mod) => {
      m[mod] = { requirements: [], decisions: [], definitions: [], rules: [], releases: [] };
    });
    items.forEach((i) => {
      const mod = i.module || config.modules[0];
      if (!m[mod]) m[mod] = { requirements: [], decisions: [], definitions: [], rules: [], releases: [] };
      const cat = { requirement: "requirements", decision: "decisions", definition: "definitions", rule: "rules", release: "releases" }[i.type];
      if (cat && m[mod]) m[mod][cat].push(i);
    });
    return m;
  }, [items, config.modules]);

  const unresolved = items.filter((i) =>
    ["proposed", "open", "draft", "needs_clarification"].includes(i.status)
  );

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

      {config.modules.map((mod) => {
        const data = byModule[mod];
        if (!data) return null;
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
