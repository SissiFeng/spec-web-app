import { useMemo, useState } from "react";
import { Copy, Download, Check, FileText } from "lucide-react";
import { DELIVERABLES } from "../lib/deliverables";
import Markdown from "./Markdown";

// Generate customer-ready documents straight from the engagement data.

export default function DeliverablesView({ config, items, refs, health }) {
  const [selected, setSelected] = useState(DELIVERABLES[0].key);
  const [copied, setCopied] = useState(false);
  const [raw, setRaw] = useState(false);

  const doc = useMemo(() => {
    const d = DELIVERABLES.find((x) => x.key === selected);
    return d.build({ config, items, refs, health });
  }, [selected, config, items, refs, health]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(doc.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setRaw(true);
    }
  };

  const download = () => {
    const blob = new Blob([doc.content], { type: `${doc.mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isMd = doc.mime === "text/markdown";

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-5 items-start">
      <div className="space-y-2">
        {DELIVERABLES.map((d) => (
          <button key={d.key} onClick={() => setSelected(d.key)}
            className={`w-full text-left rounded-xl border p-3 transition-colors ${selected === d.key ? "border-gray-900 bg-white shadow-sm" : "bg-white hover:border-gray-300"}`}>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800"><FileText size={14} /> {d.label}</div>
            <div className="text-xs text-gray-500 mt-1 leading-snug">{d.description}</div>
          </button>
        ))}
        <div className="text-xs text-gray-400 px-1 pt-2">
          Documents regenerate live from the engagement. Paste Markdown into Word, Confluence, Loop or a repo.
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500 flex-1 truncate">{doc.filename}</span>
          {isMd && (
            <button onClick={() => setRaw(!raw)} className="text-xs px-2.5 py-1 border rounded-md hover:bg-gray-50 text-gray-600">
              {raw ? "Preview" : "Markdown"}
            </button>
          )}
          <button onClick={copy} className="text-xs px-2.5 py-1 border rounded-md hover:bg-gray-50 text-gray-600 flex items-center gap-1">
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={download} className="text-xs px-2.5 py-1 rounded-md bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-1">
            <Download size={12} /> Download
          </button>
        </div>
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {isMd && !raw ? <Markdown source={doc.content} /> : (
            <pre className="text-xs font-mono whitespace-pre-wrap text-gray-700">{doc.content}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
