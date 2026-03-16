import { useState } from "react";
import { X } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { uid, now, today } from "../data/constants";

export default function FormModal({ type, editItem, onSave, onClose, currentUser }) {
  const config = useProjectConfig();
  const isEdit = !!editItem;

  const [form, setForm] = useState(() => {
    if (editItem) return { ...editItem, _tags: editItem.tags?.join(", ") || "" };
    const base = {
      id: uid(), type, title: "", module: config.modules[0], source: "", owner: "",
      assignee: config.teamMembers[0],
      status: (config.statuses[type] || [])[0] || "proposed",
      tags: [], createdAt: today(), updatedAt: today(),
      relatedItems: [],
      comments: [],
      activityLog: [{ actor: currentUser, action: `Created this ${type}`, timestamp: now() }],
      _tags: "",
    };
    if (type === "requirement") return { ...base, userIntent: "", priority: "medium", version: "" };
    if (type === "decision") return { ...base, statement: "", rationale: "", decidedBy: "", decidedAt: today(), supersedes: false, impactedComponents: [] };
    if (type === "definition") return { ...base, term: "", definition: "", scope: "", examples: [], unresolvedQuestions: [] };
    if (type === "rule") return { ...base, ruleId: "", layer: "", ruleName: "", description: "", severity: "warning", blocking: false, threshold: "", appliesTo: "", sourceOfTruth: "" };
    if (type === "release") return { ...base, component: "", currentBehavior: "", requestedChange: "", dependency: [], backendRequired: false, versionTarget: "" };
    return base;
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, updatedAt: today() }));

  const Input = ({ label, field, textarea }) => (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {textarea ? (
        <textarea className="w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none" rows={3} value={form[field] || ""} onChange={(e) => set(field, e.target.value)} />
      ) : (
        <input className="w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400" value={form[field] || ""} onChange={(e) => set(field, e.target.value)} />
      )}
    </div>
  );

  const Select = ({ label, field, options }) => (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <select className="w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm bg-white" value={form[field] || ""} onChange={(e) => set(field, e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
    </div>
  );

  const Check = ({ label, field }) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={!!form[field]} onChange={(e) => set(field, e.target.checked)} className="rounded" />
      {label}
    </label>
  );

  const handleSave = () => {
    const tags = form._tags ? form._tags.split(",").map((t) => t.trim()).filter(Boolean) : form.tags || [];
    const cleaned = { ...form, tags };
    delete cleaned._tags;
    if (isEdit) {
      cleaned.activityLog = [
        ...(cleaned.activityLog || []),
        { actor: currentUser, action: `Edited this ${type}`, timestamp: now() },
      ];
    }
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between z-10 rounded-t-xl">
          <span className="font-semibold text-gray-800">
            {isEdit ? "Edit" : "New"} {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3">
          <Select label="Assignee" field="assignee" options={config.teamMembers} />

          {type === "requirement" && (
            <>
              <Input label="Title" field="title" />
              <Input label="User Intent" field="userIntent" textarea />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Module" field="module" options={config.modules} />
                <Select label="Priority" field="priority" options={config.priorities} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Source" field="source" options={config.sources} />
                <Select label="Status" field="status" options={config.statuses.requirement || []} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Owner" field="owner" />
                <Input label="Version" field="version" />
              </div>
            </>
          )}
          {type === "decision" && (
            <>
              <Input label="Title" field="title" />
              <Input label="Decision Statement" field="statement" textarea />
              <Input label="Rationale" field="rationale" textarea />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Module" field="module" options={config.modules} />
                <Select label="Status" field="status" options={config.statuses.decision || []} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Decided By" field="decidedBy" />
                <Input label="Decided At" field="decidedAt" />
              </div>
              <Input label="Owner" field="owner" />
              <Input label="Source" field="source" />
              <Check label="Supersedes previous decision?" field="supersedes" />
            </>
          )}
          {type === "definition" && (
            <>
              <Input label="Term" field="term" />
              <Input label="Definition" field="definition" textarea />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Scope" field="scope" />
                <Select label="Module" field="module" options={config.modules} />
              </div>
              <Select label="Status" field="status" options={config.statuses.definition || []} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Owner" field="owner" />
                <Input label="Source" field="source" />
              </div>
            </>
          )}
          {type === "rule" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Rule ID" field="ruleId" />
                <Input label="Rule Name" field="ruleName" />
              </div>
              <Input label="Layer" field="layer" />
              <Input label="Description" field="description" textarea />
              <div className="grid grid-cols-3 gap-3">
                <Select label="Severity" field="severity" options={["error", "warning", "info"]} />
                <Select label="Module" field="module" options={config.modules} />
                <Select label="Status" field="status" options={config.statuses.rule || []} />
              </div>
              <Input label="Threshold / Formula" field="threshold" />
              <Input label="Applies To" field="appliesTo" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Owner" field="owner" />
                <Input label="Source of Truth" field="sourceOfTruth" />
              </div>
              <Check label="Blocking?" field="blocking" />
            </>
          )}
          {type === "release" && (
            <>
              <Input label="Component" field="component" />
              <Input label="Current Behavior" field="currentBehavior" textarea />
              <Input label="Requested Change" field="requestedChange" textarea />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Module" field="module" options={config.modules} />
                <Select label="Status" field="status" options={config.statuses.release || []} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Version Target" field="versionTarget" />
                <Input label="Owner" field="owner" />
              </div>
              <Input label="Source" field="source" />
              <Check label="Backend Required?" field="backendRequired" />
            </>
          )}

          <Input label="Tags (comma separated)" field="_tags" />
        </div>
        <div className="sticky bottom-0 bg-white border-t px-5 py-3 flex justify-end gap-2 rounded-b-xl">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
          <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800">
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
