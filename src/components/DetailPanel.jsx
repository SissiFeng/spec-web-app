import { useState, useRef } from "react";
import {
  X, Clock, AlertTriangle, User, Link, Edit3, Trash2,
  MessageSquare, Send, History, ChevronDown, ChevronRight,
} from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { isDone, formatUSD } from "../data/constants";
import { typeMeta, itemTitle } from "../data/itemTypes";
import { pillarByKey } from "../data/pillars";
import { findCapability } from "../data/cloudCatalog";
import { Badge, StatusBadge, Field, ItemBadges, TypeBadge, Ref } from "./shared";

// Renders one schema field's value for read-only display.
function displayValue(field, value) {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) return null;
  if (field.key === "pillar") return pillarByKey(value)?.label;
  if (field.key === "pillars") return value.map((k) => pillarByKey(k)?.label).join(", ");
  if (field.key === "monthlyCost") return `${formatUSD(value)} / month`;
  if (field.kind === "check") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value).replace(/_/g, field.kind === "select" ? " " : "_");
}

export default function DetailPanel({ item, allItems, refs = {}, onClose, onSelect, onEdit, onDelete, onAddComment, onChangeStatus, currentUser }) {
  const config = useProjectConfig();
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState(currentUser || config.teamMembers[0]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const commentInputRef = useRef(null);

  if (!item) return null;
  const meta = typeMeta(item.type);
  // Links are undirected: show items this one points to and items pointing here
  const relatedIds = new Set([
    ...(item.relatedItems || []),
    ...allItems.filter((i) => (i.relatedItems || []).includes(item.id)).map((i) => i.id),
  ]);
  const related = [...relatedIds].map((rid) => allItems.find((i) => i.id === rid)).filter(Boolean);
  const done = isDone(item.status, meta.doneStatuses);
  const capability = item.type === "component" ? findCapability(item.service) : null;
  const statuses = config.statuses[item.type] || meta.statuses;

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
            <TypeBadge type={item.type} />
            <Ref value={refs[item.id]} />
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
            <button onClick={() => { if (window.confirm(`Delete ${refs[item.id] || "this item"}? This cannot be undone.`)) { onDelete(item.id); onClose(); } }} className="p-1.5 hover:bg-red-50 rounded text-red-500" title="Delete">
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
            {itemTitle(item)}
          </h2>
          <div className="flex flex-wrap gap-1.5 -mt-3"><ItemBadges item={item} /></div>

          {/* Quick status change */}
          <div className="flex flex-wrap items-center gap-1.5">
            {statuses.map((st) => (
              <button key={st} onClick={() => st !== item.status && onChangeStatus(item.id, st)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${st === item.status ? "bg-gray-900 text-white border-gray-900" : "text-gray-500 hover:bg-gray-50"}`}>
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Type-specific fields (schema-driven) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {meta.fields.map((f) => {
              const v = displayValue(f, item[f.key]);
              const wide = f.kind === "textarea";
              return (
                <div key={f.key} className={wide ? "col-span-2" : ""}>
                  <Field label={f.label} value={v} long={wide} />
                </div>
              );
            })}
          </div>

          {capability && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs">
              <div className="font-medium text-gray-700 mb-1">Multi-cloud equivalents · {capability.capability}</div>
              <div className="grid grid-cols-3 gap-2 text-gray-600">
                {["Azure", "AWS", "GCP"].map((p) => (
                  <div key={p} className={p === item.provider ? "font-semibold text-gray-900" : ""}><div className="text-gray-400">{p}</div>{capability[p]}</div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Workload" value={item.module} />
              <Field label="Owner" value={item.owner || "—"} />
              <Field label="Source" value={item.source} />
            </div>
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
                <Link size={12} /> Traceability ({related.length})
              </div>
              <div className="space-y-1">
                {related.map((r) => (
                  <button key={r.id} onClick={() => onSelect?.(r.id)} className="w-full flex items-center gap-2 text-sm text-left hover:bg-gray-50 rounded px-1.5 py-1">
                    <Ref value={refs[r.id]} />
                    <span className="truncate flex-1 text-blue-700">{itemTitle(r)}</span>
                    <StatusBadge status={r.status} />
                  </button>
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
                  {[...new Set([commentAuthor, ...config.teamMembers.filter((m) => m !== "Unassigned")])].map((m) => (
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
