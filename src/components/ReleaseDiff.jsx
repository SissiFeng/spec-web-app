import { User } from "lucide-react";
import { isDone } from "../data/constants";
import { Badge, StatusBadge } from "./shared";

export default function ReleaseDiff({ items, onSelect }) {
  const releases = items.filter((i) => i.type === "release");
  const versions = [...new Set(releases.map((r) => r.versionTarget).filter(Boolean))].sort().reverse();

  return (
    <div className="space-y-4">
      {versions.map((v) => {
        const vItems = releases.filter((r) => r.versionTarget === v);
        const reqs = items.filter((i) => i.type === "requirement" && i.version === v);
        return (
          <div key={v} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
              <span className="font-semibold text-gray-800">{v}</span>
              <div className="flex gap-2">
                <Badge text={`${vItems.length} changes`} color="bg-blue-50 text-blue-600" />
                <Badge text={`${reqs.length} requirements`} color="bg-green-50 text-green-600" />
              </div>
            </div>
            <div className="divide-y">
              {vItems.map((r) => {
                const done = isDone(r.status);
                return (
                  <div key={r.id} onClick={() => onSelect(r)} className="px-5 py-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className={`font-medium text-sm ${done ? "line-through text-gray-400" : "text-gray-800"}`}>{r.component}</span>
                      {r.assignee && r.assignee !== "Unassigned" && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5"><User size={10} />{r.assignee}</span>
                      )}
                      {r.backendRequired && <Badge text="backend" color="bg-orange-50 text-orange-600" />}
                      {(r.dependency || []).map((d) => <Badge key={d} text={d.replace(/_/g, " ")} />)}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-gray-400">Before:</span> <span className="text-gray-600">{r.currentBehavior}</span></div>
                      <div><span className="text-gray-400">After:</span> <span className={`font-medium ${done ? "line-through text-gray-400" : "text-gray-800"}`}>{r.requestedChange}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {versions.length === 0 && <div className="text-center py-12 text-gray-400">No release items yet.</div>}
    </div>
  );
}
