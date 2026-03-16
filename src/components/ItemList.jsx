import { useState, useMemo } from "react";
import { Search, User, MessageSquare } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { isDone, SEVERITY_COLORS } from "../data/constants";
import { Badge, StatusBadge, PriorityBadge } from "./shared";

export default function ItemList({ items, onSelect, type }) {
  const config = useProjectConfig();
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
          {(config.statuses[type] || []).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select className="border rounded-lg px-2.5 py-1.5 text-sm bg-white" value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
          <option value="all">All modules</option>
          {config.modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="border rounded-lg px-2.5 py-1.5 text-sm bg-white" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
          <option value="all">All assignees</option>
          {config.teamMembers.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="text-xs text-gray-400">{filtered.length} items</div>
      <div className="space-y-1.5">
        {filtered.map((i) => {
          const done = isDone(i.status, config.doneStatuses);
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
