import { useState } from "react";
import {
  X, Plus, Trash2,
  Battery, FlaskConical, Sun, Microscope, Cpu, Atom,
  Beaker, Zap, Leaf, Thermometer, Waves, Dna,
} from "lucide-react";

// ─── Available icons and colors ─────────────────────────────────────

const ICON_OPTIONS = [
  { name: "Battery", icon: Battery },
  { name: "Flask", icon: FlaskConical },
  { name: "Sun", icon: Sun },
  { name: "Microscope", icon: Microscope },
  { name: "Cpu", icon: Cpu },
  { name: "Atom", icon: Atom },
  { name: "Beaker", icon: Beaker },
  { name: "Zap", icon: Zap },
  { name: "Leaf", icon: Leaf },
  { name: "Thermometer", icon: Thermometer },
  { name: "Waves", icon: Waves },
  { name: "Dna", icon: Dna },
];

const COLOR_OPTIONS = [
  { name: "blue", bg: "bg-blue-500" },
  { name: "emerald", bg: "bg-emerald-500" },
  { name: "amber", bg: "bg-amber-500" },
  { name: "purple", bg: "bg-purple-500" },
  { name: "rose", bg: "bg-rose-500" },
  { name: "cyan", bg: "bg-cyan-500" },
  { name: "orange", bg: "bg-orange-500" },
  { name: "indigo", bg: "bg-indigo-500" },
];

const ALL_TYPES = [
  { key: "requirement", label: "Requirements" },
  { key: "decision", label: "Decisions" },
  { key: "definition", label: "Definitions" },
  { key: "rule", label: "Rules" },
  { key: "release", label: "Releases" },
];

const DEFAULT_STATUSES = {
  requirement: ["proposed", "confirmed", "rejected", "implemented", "deprecated"],
  decision: ["open", "needs_clarification", "confirmed", "implemented", "deprecated"],
  definition: ["draft", "needs_clarification", "confirmed", "deprecated"],
  rule: ["proposed", "confirmed", "implemented", "deprecated"],
  release: ["planned", "in_progress", "completed", "reverted"],
};

// ─── Editable list component ────────────────────────────────────────

function EditableList({ label, items, onChange, placeholder }) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="flex gap-1.5 mt-1">
        <input
          className="flex-1 border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {items.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
              {item}
              <button onClick={() => handleRemove(idx)} className="hover:text-red-500">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────────────

export default function NewProjectModal({ onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    description: "",
    iconName: "Flask",
    color: "blue",
    modules: [],
    teamMembers: [],
    enabledTypes: ["requirement", "decision", "definition", "rule", "release"],
    sources: [],
    priorities: ["critical", "high", "medium", "low"],
    dependencies: [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleType = (typeKey) => {
    set("enabledTypes",
      form.enabledTypes.includes(typeKey)
        ? form.enabledTypes.filter((t) => t !== typeKey)
        : [...form.enabledTypes, typeKey]
    );
  };

  const canCreate = form.name.trim() && form.modules.length > 0 && form.teamMembers.length > 0 && form.enabledTypes.length > 0;

  const handleCreate = () => {
    const iconEntry = ICON_OPTIONS.find((i) => i.name === form.iconName) || ICON_OPTIONS[0];
    const statuses = {};
    form.enabledTypes.forEach((t) => { statuses[t] = DEFAULT_STATUSES[t] || []; });

    const teamWithUnassigned = form.teamMembers.includes("Unassigned")
      ? form.teamMembers
      : [...form.teamMembers, "Unassigned"];

    const config = {
      id: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name: form.name.trim(),
      description: form.description.trim(),
      icon: iconEntry.icon,
      iconName: form.iconName,
      color: form.color,
      modules: form.modules,
      statuses,
      doneStatuses: ["implemented", "completed", "deprecated", "rejected", "reverted"],
      priorities: form.priorities,
      dependencies: form.dependencies,
      sources: form.sources,
      teamMembers: teamWithUnassigned,
      enabledTypes: form.enabledTypes,
      seedData: { requirements: [], decisions: [], definitions: [], rules: [], releases: [] },
    };

    onSave(config);
    onClose();
  };

  const SelectedIcon = ICON_OPTIONS.find((i) => i.name === form.iconName)?.icon || FlaskConical;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between z-10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">New Project</span>
            <span className="text-xs text-gray-400">Step {step} of 3</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
        </div>

        {/* Step indicators */}
        <div className="px-5 pt-4 flex gap-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-gray-900" : "bg-gray-200"}`} />
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Step 1: Basic info */}
          {step === 1 && (
            <>
              <div className="text-sm font-medium text-gray-700 mb-1">Basic Information</div>

              <div>
                <label className="text-xs font-medium text-gray-500">Project Name *</label>
                <input
                  className="w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="e.g., Polymer Lab"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Description</label>
                <input
                  className="w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  placeholder="e.g., Polymer synthesis spec tracking"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="text-xs font-medium text-gray-500">Icon</label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {ICON_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const selected = form.iconName === opt.name;
                    return (
                      <button
                        key={opt.name}
                        onClick={() => set("iconName", opt.name)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                          selected ? "border-gray-900 bg-gray-100" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        title={opt.name}
                      >
                        <Icon size={16} className={selected ? "text-gray-900" : "text-gray-400"} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs font-medium text-gray-500">Color</label>
                <div className="flex gap-2 mt-1.5">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => set("color", opt.name)}
                      className={`w-7 h-7 rounded-full ${opt.bg} transition-all ${
                        form.color === opt.name ? "ring-2 ring-offset-2 ring-gray-900 scale-110" : "hover:scale-105"
                      }`}
                      title={opt.name}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Modules & types */}
          {step === 2 && (
            <>
              <div className="text-sm font-medium text-gray-700 mb-1">Modules & Item Types</div>

              <EditableList
                label="Modules *"
                items={form.modules}
                onChange={(v) => set("modules", v)}
                placeholder="e.g., Overview, Experiments, Results..."
              />

              <div>
                <label className="text-xs font-medium text-gray-500">Enabled Item Types *</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {ALL_TYPES.map((t) => {
                    const checked = form.enabledTypes.includes(t.key);
                    return (
                      <label key={t.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        checked ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleType(t.key)}
                          className="rounded"
                        />
                        <span className="text-sm">{t.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <EditableList
                label="Priorities"
                items={form.priorities}
                onChange={(v) => set("priorities", v)}
                placeholder="e.g., critical, high, medium, low"
              />
            </>
          )}

          {/* Step 3: Team & sources */}
          {step === 3 && (
            <>
              <div className="text-sm font-medium text-gray-700 mb-1">Team & Metadata</div>

              <EditableList
                label="Team Members *"
                items={form.teamMembers}
                onChange={(v) => set("teamMembers", v)}
                placeholder="e.g., Dr. Smith, Lab Tech, PI..."
              />

              <EditableList
                label="Sources"
                items={form.sources}
                onChange={(v) => set("sources", v)}
                placeholder="e.g., PI, Meeting, Slack, Lab Notebook..."
              />

              <EditableList
                label="Dependencies"
                items={form.dependencies}
                onChange={(v) => set("dependencies", v)}
                placeholder="e.g., frontend_only, backend_only..."
              />

              {/* Preview */}
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="text-xs font-medium text-gray-500 mb-2">Preview</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center">
                    <SelectedIcon size={20} className="text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-800">{form.name || "Untitled"}</div>
                    <div className="text-xs text-gray-400">{form.description || "No description"}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {form.modules.map((m) => (
                    <span key={m} className="px-2 py-0.5 bg-white border rounded-full text-xs text-gray-600">{m}</span>
                  ))}
                </div>
                <div className="mt-1.5 text-xs text-gray-400">
                  {form.enabledTypes.length} types · {form.teamMembers.length} members · {form.modules.length} modules
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-5 py-3 flex justify-between rounded-b-xl">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">
                Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !form.name.trim()}
                className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={!canCreate}
                className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Create Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
