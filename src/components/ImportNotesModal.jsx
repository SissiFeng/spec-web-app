import { useState } from "react";
import { Upload, X, Sparkles } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { apiFetch } from "../lib/api";
import { classifyLine } from "../lib/classify";
import { TYPE_KEYS, typeMeta } from "../data/itemTypes";
import { pillarByKey } from "../data/pillars";

const TYPES = TYPE_KEYS;

export default function ImportNotesModal({ projectId, currentUser, onClose, onImported }) {
  const config = useProjectConfig();
  const [text, setText] = useState("");
  const [defaultType, setDefaultType] = useState("auto");
  const [module, setModule] = useState(config.modules[0] || "");
  const [source, setSource] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePreview = () => {
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setError("No lines found");
      return;
    }

    setPreview(lines.map((line) => {
      const guess = classifyLine(line);
      if (defaultType === "auto") return guess;
      return { title: guess.title, type: defaultType, fields: guess.type === defaultType ? guess.fields : {} };
    }));
    setError("");
  };

  const handleImport = async () => {
    if (!preview) return;
    setLoading(true);
    setError("");

    try {
      await apiFetch(`/projects/${projectId}/items/batch`, {
        method: "POST",
        body: JSON.stringify({
          items: preview.map((p) => ({ type: p.type, title: p.title, module, type_fields: p.fields || {} })),
          source,
          actor: currentUser,
        }),
      });
      onImported?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Upload size={16} /> Import Meeting Notes
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!preview ? (
            <>
              {/* Text input */}
              <div>
                <label className="text-xs font-medium text-gray-500">Paste notes (one item per line)</label>
                <textarea
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm h-40 resize-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"- Checkout must support guest users\n- RTO for orders ≤ 1 hour\n- Risk: legacy ERP has no API for stock levels\n- Assumption: customer keeps on-prem AD until Q3\n- Decided to go with AKS for the order services"}
                  autoFocus
                />
              </div>

              {/* Options row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Item type</label>
                  <select
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white"
                    value={defaultType}
                    onChange={(e) => setDefaultType(e.target.value)}
                  >
                    <option value="auto">Auto-detect per line</option>
                    {TYPES.map((t) => (
                      <option key={t} value={t}>All as {typeMeta(t).label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Workload</label>
                  <select
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm bg-white"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                  >
                    {config.modules.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Source</label>
                <input
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-violet-400 focus:border-violet-400"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Discovery workshop 2026-11-09"
                />
              </div>
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="text-xs text-gray-500 font-medium">
                <span className="inline-flex items-center gap-1"><Sparkles size={12} className="text-violet-500" /> Preview — {preview.length} items, types auto-detected. Adjust before importing; they land in the triage inbox.</span>
              </div>
              <div className="space-y-1.5">
                {preview.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                    <select
                      className="text-xs border rounded px-1.5 py-0.5 bg-white text-violet-700 font-medium"
                      value={item.type}
                      onChange={(e) => {
                        setPreview((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, type: e.target.value, fields: {} } : p))
                        );
                      }}
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>{typeMeta(t).label}</option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-800 truncate">{item.title}</span>
                    {item.fields?.pillar && <span className="text-[10px] text-violet-600 shrink-0">{pillarByKey(item.fields.pillar)?.short}</span>}
                    {item.fields?.raidType && <span className="text-[10px] text-violet-600 shrink-0">{item.fields.raidType}</span>}
                    {item.fields?.provider && <span className="text-[10px] text-violet-600 shrink-0">{item.fields.provider}</span>}
                    <button
                      onClick={() => setPreview((prev) => prev.filter((_, i) => i !== idx))}
                      className="ml-auto text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPreview(null)}
                className="text-xs text-violet-600 hover:text-violet-800"
              >
                ← Back to edit
              </button>
            </>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          {!preview ? (
            <button
              onClick={handlePreview}
              disabled={!text.trim()}
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              Preview
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={loading || preview.length === 0}
              className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? "Importing..." : `Import ${preview.length} items`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
