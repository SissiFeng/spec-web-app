import { useState, useRef } from "react";
import {
  X, Clock, AlertTriangle, User, Link, Edit3, Trash2,
  MessageSquare, Send, History, ChevronDown, ChevronRight,
} from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { isDone, SEVERITY_COLORS } from "../data/constants";
import { Badge, StatusBadge, PriorityBadge, Field } from "./shared";

export default function DetailPanel({ item, allItems, onClose, onEdit, onDelete, onAddComment, onChangeStatus }) {
  const config = useProjectConfig();
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState(config.teamMembers[0]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const commentInputRef = useRef(null);

  if (!item) return null;
  const related = (item.relatedItems || []).map((rid) => allItems.find((i) => i.id === rid)).filter(Boolean);
  const done = isDone(item.status, config.doneStatuses);

  const handleSubmitComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    onAddComment(item.id, { author: commentAuthor, text: trimmed, timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) });
    setCommentText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmitComment();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{item.id}</span>
            <StatusBadge status={item.status} />
            {item.assignee && item.assignee !== "Unassigned" && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <User size={11} /> {item.assignee}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit">
              <Edit3 size={15} />
            </button>
            <button onClick={() => { onDelete(item.id); onClose(); }} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete">
              <Trash2 size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Title */}
          <h2 className={`text-lg font-semibold ${done ? "line-through text-gray-400" : "text-gray-900"}`}>
            {item.title || item.term || item.component || item.statement}
          </h2>

          {/* Quick status change */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Status:</span>
            <select
              className="text-xs border rounded px-2 py-1 bg-white"
              value={item.status}
              onChange={(e) => onChangeStatus(item.id, e.target.value)}
            >
              {(config.statuses[item.type] || []).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400">Assignee:</span>
            <span className="text-xs font-medium text-gray-700">{item.assignee || "Unassigned"}</span>
          </div>

          {/* Type-specific fields */}
          {item.type === "requirement" && (
            <>
              <Field label="User Intent" value={item.userIntent} long />
              <Field label="Priority"><PriorityBadge priority={item.priority} /></Field>
              <Field label="Version" value={item.version} />
            </>
          )}
          {item.type === "decision" && (
            <>
              <Field label="Decision Statement" value={item.statement} long />
              <Field label="Rationale" value={item.rationale} long />
              <Field label="Decided By" value={item.decidedBy} />
              <Field label="Decided At" value={item.decidedAt} />
              <Field label="Supersedes Previous?" value={item.supersedes ? "Yes" : "No"} />
              <Field label="Impacted Components" value={(item.impactedComponents || []).join(", ")} />
            </>
          )}
          {item.type === "definition" && (
            <>
              <Field label="Definition" value={item.definition} long />
              <Field label="Scope" value={item.scope} />
              {item.examples?.length > 0 && <Field label="Examples" value={item.examples.join("; ")} long />}
              {item.unresolvedQuestions?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                    <AlertTriangle size={12} /> Unresolved Questions
                  </div>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {item.unresolvedQuestions.map((q, i) => <li key={i}>• {q}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
          {item.type === "rule" && (
            <>
              <Field label="Rule ID" value={item.ruleId} />
              <Field label="Layer" value={item.layer} />
              <Field label="Description" value={item.description} long />
              <Field label="Severity">
                <span className={`font-medium ${SEVERITY_COLORS[item.severity]}`}>{item.severity}</span>
              </Field>
              <Field label="Blocking?" value={item.blocking ? "Yes — blocks processing" : "No"} />
              <Field label="Threshold / Formula">
                <code className="bg-gray-100 px-2 py-0.5 rounded text-sm font-mono">{item.threshold}</code>
              </Field>
              <Field label="Applies To" value={item.appliesTo} />
              <Field label="Source of Truth" value={item.sourceOfTruth} />
            </>
          )}
          {item.type === "release" && (
            <>
              <Field label="Current Behavior" value={item.currentBehavior} long />
              <Field label="Requested Change" value={item.requestedChange} long />
              <Field label="Dependencies" value={(item.dependency || []).map((d) => d.replace(/_/g, " ")).join(", ")} />
              <Field label="Backend Required?" value={item.backendRequired ? "Yes" : "No"} />
              <Field label="Version Target" value={item.versionTarget} />
            </>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 space-y-3">
            <Field label="Module" value={item.module} />
            <Field label="Owner" value={item.owner || "—"} />
            <Field label="Assignee" value={item.assignee || "Unassigned"} />
            <Field label="Source" value={item.source} />
            {item.tags?.length > 0 && (
              <Field label="Tags">
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((t) => <Badge key={t} text={t} />)}
                </div>
              </Field>
            )}
            <div className="flex gap-4 text-xs text-gray-400">
              <span>Created {item.createdAt}</span>
              <span>Updated {item.updatedAt}</span>
            </div>
          </div>

          {/* Related Items */}
          {related.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Link size={12} /> Related Items
              </div>
              <div className="space-y-1">
                {related.map((r) => (
                  <div key={r.id} className="text-sm text-blue-600 hover:underline cursor-pointer">
                    [{r.id}] {r.title || r.term || r.component || r.statement}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t pt-4">
            <div className="text-xs font-medium text-gray-500 mb-3 flex items-center gap-1">
              <MessageSquare size={12} /> Comments ({(item.comments || []).length})
            </div>

            {(item.comments || []).length > 0 && (
              <div className="space-y-2.5 mb-4">
                {item.comments.map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                        <User size={11} /> {c.author}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> {c.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* New comment input */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-500">Post as:</label>
                <select
                  className="text-xs border rounded px-2 py-0.5 bg-white"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                >
                  {config.teamMembers.filter((m) => m !== "Unassigned").map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <textarea
                ref={commentInputRef}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 bg-white"
                rows={3}
                placeholder="Add a comment... (Cmd+Enter to submit)"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send size={12} /> Submit
                </button>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowActivityLog(!showActivityLog)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-2"
            >
              <History size={12} />
              Activity Log ({(item.activityLog || []).length})
              {showActivityLog ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {showActivityLog && (
              <div className="relative pl-4 border-l-2 border-gray-200 space-y-3">
                {(item.activityLog || []).slice().reverse().map((log, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-300" />
                    <div className="text-xs">
                      <span className="font-semibold text-gray-700">{log.actor}</span>
                      <span className="text-gray-500"> {log.action}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} /> {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
