import { useState } from "react";
import { X, Plus, Check } from "lucide-react";
import { ICON_OPTIONS } from "../lib/iconMap";
import { DEFAULT_STATUSES, DEFAULT_DONE_STATUSES, TYPE_KEYS } from "../data/itemTypes";
import { ENGAGEMENT_TYPES, starterItems } from "../data/templates";
import { PILLARS } from "../data/pillars";

// ─── Options ────────────────────────────────────────────────────────

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

const CLOUDS = ["Azure", "AWS", "GCP"];

const inputCls = "w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400";

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
    customer: "",
    description: "",
    engagementType: "migration",
    iconName: "Cloud",
    color: "blue",
    clouds: ["Azure"],
    modules: ENGAGEMENT_TYPES[0].workloads,
    teamMembers: [],
    goLive: "",
  });
  const [starter, setStarter] = useState({ includeTemplate: true, includeNfrs: true, includeComponents: true });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const template = ENGAGEMENT_TYPES.find((t) => t.key === form.engagementType);

  // Switching template swaps in its workloads unless the user customised them
  const pickTemplate = (t) => {
    const untouched = !form.modules.length || ENGAGEMENT_TYPES.some((x) => x.workloads.join() === form.modules.join());
    setForm((f) => ({ ...f, engagementType: t.key, modules: untouched ? t.workloads : f.modules }));
  };

  const toggleCloud = (c) => {
    const has = form.clouds.includes(c);
    if (has && form.clouds.length === 1) return;
    set("clouds", has ? form.clouds.filter((x) => x !== c) : [...form.clouds, c]);
  };

  const entries = starterItems(template, { clouds: form.clouds, ...starter });
  const canCreate = form.name.trim() && form.modules.length > 0 && form.clouds.length > 0;

  const handleCreate = () => {
    const teamWithUnassigned = form.teamMembers.includes("Unassigned")
      ? form.teamMembers
      : [...form.teamMembers, "Unassigned"];

    const config = {
      id: `${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36).slice(-4)}`,
      name: form.name.trim(),
      description: form.description.trim(),
      iconName: form.iconName,
      color: form.color,
      modules: form.modules,
      statuses: DEFAULT_STATUSES,
      doneStatuses: DEFAULT_DONE_STATUSES,
      priorities: ["must", "should", "could", "wont"],
      dependencies: [],
      sources: ["Discovery workshop", "Stakeholder interview", "Architecture review", "Email", "Teams / Slack"],
      teamMembers: teamWithUnassigned,
      enabledTypes: TYPE_KEYS,
      meta: {
        customer: form.customer.trim(),
        engagementType: template.label,
        clouds: form.clouds,
        phase: "discovery",
        goLive: form.goLive,
      },
    };

    onSave(config, entries);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between z-10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">New Engagement</span>
            <span className="text-xs text-gray-400">Step {step} of 3</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
        </div>

        <div className="px-5 pt-4 flex gap-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-gray-900" : "bg-gray-200"}`} />
          ))}
        </div>

        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Engagement name *</label>
                  <input className={inputCls} placeholder="e.g. Contoso ERP Migration" value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Customer</label>
                  <input className={inputCls} placeholder="e.g. Contoso Ltd." value={form.customer} onChange={(e) => set("customer", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Business objective</label>
                <input className={inputCls} placeholder="e.g. Exit the Toronto data centre by Q4 and cut infra cost 20%" value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">Engagement type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1.5">
                  {ENGAGEMENT_TYPES.map((t) => {
                    const on = t.key === form.engagementType;
                    return (
                      <button key={t.key} onClick={() => pickTemplate(t)} className={`text-left rounded-lg border p-2.5 transition-colors ${on ? "border-gray-900 bg-gray-50" : "hover:border-gray-300"}`}>
                        <div className="text-sm font-medium text-gray-800 flex items-center gap-1">{on && <Check size={12} />}{t.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-snug">{t.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500">Icon</label>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {ICON_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const selected = form.iconName === opt.name;
                      return (
                        <button key={opt.name} onClick={() => set("iconName", opt.name)} title={opt.name}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${selected ? "border-gray-900 bg-gray-100" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}>
                          <Icon size={15} className={selected ? "text-gray-900" : "text-gray-400"} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Color</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COLOR_OPTIONS.map((opt) => (
                      <button key={opt.name} onClick={() => set("color", opt.name)} title={opt.name}
                        className={`w-6 h-6 rounded-full ${opt.bg} transition-all ${form.color === opt.name ? "ring-2 ring-offset-2 ring-gray-900" : "hover:scale-105"}`} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="text-xs font-medium text-gray-500">Target cloud(s) * — first selected is primary</label>
                <div className="flex gap-2 mt-1.5">
                  {CLOUDS.map((c) => {
                    const idx = form.clouds.indexOf(c);
                    return (
                      <button key={c} onClick={() => toggleCloud(c)} className={`px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 ${idx >= 0 ? "border-gray-900 bg-gray-50" : "text-gray-500 hover:border-gray-300"}`}>
                        {idx >= 0 && <Check size={13} />}{c}{idx === 0 && <span className="text-[10px] text-gray-400">primary</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <EditableList label="Workloads *" items={form.modules} onChange={(v) => set("modules", v)} placeholder="e.g. Order API, Data Platform…" />
              <EditableList label="Team (CSA, customer architects, PMs…)" items={form.teamMembers} onChange={(v) => set("teamMembers", v)} placeholder="e.g. Sissi (CSA), Customer EA…" />

              <div className="w-48">
                <label className="text-xs font-medium text-gray-500">Target go-live</label>
                <input type="date" className={inputCls} value={form.goLive} onChange={(e) => set("goLive", e.target.value)} />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-sm text-gray-700">Starter pack — begin with a scaffold the health check can work with.</div>
              {[
                ["includeTemplate", `${template.label} starter requirements & RAID`, `${template.requirements.length} requirements, ${template.raid.length} RAID items`],
                ["includeNfrs", "Well-Architected NFR checklist", `${PILLARS.reduce((n, p) => n + p.keyMetrics.length, 0)} draft NFRs across 5 pillars with suggested targets`],
                ["includeComponents", `Landing-zone baseline on ${form.clouds[0]}`, "Identity, security, network, observability and DevOps building blocks"],
              ].map(([k, title, sub]) => (
                <label key={k} className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${starter[k] ? "border-gray-900 bg-gray-50" : "hover:border-gray-300"}`}>
                  <input type="checkbox" className="rounded mt-0.5" checked={starter[k]} onChange={(e) => setStarter((s) => ({ ...s, [k]: e.target.checked }))} />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{title}</div>
                    <div className="text-xs text-gray-500">{sub}</div>
                  </div>
                </label>
              ))}
              <div className="border rounded-lg p-3 bg-gray-50 text-xs text-gray-500">
                <span className="font-medium text-gray-700">{form.name || "Untitled"}</span>
                {form.customer && <> · {form.customer}</>} · {template.label} · {form.clouds.join(" + ")} · {form.modules.length} workloads · {entries.length} starter items
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-5 py-3 flex justify-between rounded-b-xl">
          <div>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Back</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)} disabled={step === 1 && !form.name.trim()}
                className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
                Next
              </button>
            ) : (
              <button onClick={handleCreate} disabled={!canCreate}
                className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed">
                Create Engagement
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
