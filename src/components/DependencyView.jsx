import { User } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { Badge, StatusBadge, ItemTitle } from "./shared";

export default function DependencyView({ items, onSelect }) {
  const config = useProjectConfig();

  const groups = {};
  config.dependencies.forEach((d) => { groups[d] = []; });
  groups["unresolved_definition"] = [];

  items.forEach((i) => {
    if (i.dependency) i.dependency.forEach((d) => { if (groups[d]) groups[d].push(i); });
    if (i.type === "definition" && ["draft", "needs_clarification"].includes(i.status)) {
      groups["unresolved_definition"].push(i);
    }
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
