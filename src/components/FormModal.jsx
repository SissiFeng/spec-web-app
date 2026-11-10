import { useState, useMemo } from "react";
import { X, Sparkles, Link2 } from "lucide-react";
import { useProjectConfig } from "../data/ProjectContext";
import { uid, now, today } from "../data/constants";
import { typeMeta, blankFields, resolveOptions, itemTitle } from "../data/itemTypes";
import { pillarByKey } from "../data/pillars";
import { suggestServices, findCapability } from "../data/cloudCatalog";
import { TypeBadge, Ref } from "./shared";

const inputCls = "w-full mt-0.5 border rounded-md px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-400 focus:border-blue-400";
const label = (s) => s.replace(/_/g, " ");

export default function FormModal({ type, editItem, prefill, allItems = [], refs = {}, onSave, onClose, currentUser }) {
  const config = useProjectConfig();
  const meta = typeMeta(type);
  const isEdit = !!editItem;

  const [form, setForm] = useState(() => {
    if (editItem) return { ...editItem, _tags: editItem.tags?.join(", ") || "" };
    return {
      id: uid(), type, title: "", module: config.modules[0] || "", source: "", owner: currentUser || "",
      assignee: "Unassigned",
      status: (config.statuses[type] || meta.statuses)[0],
      tags: [], createdAt: today(), updatedAt: today(),
      relatedItems: [],
      comments: [],
      activityLog: [{ actor: currentUser, action: `Created this ${meta.label}`, timestamp: now() }],
      ...blankFields(type, config),
      ...(prefill || {}),
      _tags: "",
    };
  });
  const [linkQuery, setLinkQuery] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, updatedAt: today() }));

  // ─── Smart suggestions ────────────────────────────────────────────

  const pillar = pillarByKey(form.pillar);
  const serviceOptions = type === "component" ? suggestServices(form.provider, form.layer) : [];
  const capability = type === "component" ? findCapability(form.service) : null;

  const linkCandidates = useMemo(() => {
    const q = linkQuery.trim().toLowerCase();
    if (!q) return [];
    return allItems
      .filter((i) => i.id !== form.id && !(form.relatedItems || []).includes(i.id))
      .filter((i) => `${refs[i.id]} ${itemTitle(i)} ${i.service || ""}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [linkQuery, allItems, form.id, form.relatedItems, refs]);

  // ─── Field rendering (plain functions, not components, so inputs keep focus)

  const renderField = (f) => {
    const value = form[f.key];
    if (f.kind === "textarea") {
      return <textarea className={`${inputCls} resize-none`} rows={3} value={value || ""} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} />;
    }
    if (f.kind === "select") {
      const opts = resolveOptions(f, config);
      return (
        <select className={`${inputCls} bg-white`} value={value ?? ""} onChange={(e) => set(f.key, e.target.value)}>
          {opts.map((o) => <option key={o} value={o}>{f.key === "pillar" ? pillarByKey(o)?.label : o ? label(o) : "—"}</option>)}
        </select>
      );
    }
    if (f.kind === "list") {
      const opts = resolveOptions(f, config);
      const arr = value || [];
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {opts.map((o) => {
            const on = arr.includes(o);
            return (
              <button type="button" key={o} onClick={() => set(f.key, on ? arr.filter((x) => x !== o) : [...arr, o])}
                className={`px-2 py-0.5 rounded-full text-xs border ${on ? "bg-gray-900 text-white border-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
                {pillarByKey(o)?.label || label(o)}
              </button>
            );
          })}
        </div>
      );
    }
    if (f.kind === "check") {
      return <input type="checkbox" checked={!!value} onChange={(e) => set(f.key, e.target.checked)} className="rounded mt-1" />;
    }
    const inputType = f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text";
    return (
      <input type={inputType} className={inputCls} value={value ?? ""} placeholder={f.placeholder}
        list={f.suggest === "service" ? "service-suggestions" : undefined}
        onChange={(e) => set(f.key, e.target.value)} />
    );
  };

  const fieldBlock = (f) => (
    <div key={f.key} className={f.kind === "textarea" || f.kind === "list" ? "col-span-2" : ""}>
      <label className="text-xs font-medium text-gray-500">{f.label}</label>
      {renderField(f)}
    </div>
  );

  const handleSave = () => {
    const tags = form._tags ? form._tags.split(",").map((t) => t.trim()).filter(Boolean) : form.tags || [];
    const cleaned = { ...form, tags };
    delete cleaned._tags;
    // A component's title defaults to its service; an NFR's to its metric
    if (!cleaned.title?.trim()) cleaned.title = cleaned.service || cleaned.metric || "";
    if (cleaned.monthlyCost !== "" && cleaned.monthlyCost !== undefined) cleaned.monthlyCost = Number(cleaned.monthlyCost) || 0;
    if (isEdit) {
      cleaned.activityLog = [
        ...(cleaned.activityLog || []),
        { actor: currentUser, action: `Edited this ${meta.label}`, timestamp: now() },
      ];
    }
    onSave(cleaned);
    onClose();
  };

  const canSave = !!(form.title?.trim() || form.service?.trim() || form.metric?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSave) handleSave(); if (e.key === "Escape") onClose(); }}
      >
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between z-10 rounded-t-xl">
          <span className="font-semibold text-gray-800 flex items-center gap-2">
            {isEdit ? "Edit" : "New"} <TypeBadge type={type} />
            {isEdit && <Ref value={refs[form.id]} />}
          </span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">Title</label>
            <input className={inputCls} value={form.title || ""} onChange={(e) => set("title", e.target.value)} autoFocus
              placeholder={type === "component" ? "Defaults to the service name" : type === "decision" ? "e.g. Use AKS for the order API" : ""} />
          </div>

          {/* NFR: one-click key metrics for the chosen pillar */}
          {type === "nfr" && pillar?.keyMetrics?.length > 0 && (
            <div className="bg-violet-50 rounded-lg p-2.5">
              <div className="text-xs text-violet-700 flex items-center gap-1 mb-1.5"><Sparkles size={12} /> Key {pillar.label} metrics</div>
              <div className="flex flex-wrap gap-1.5">
                {pillar.keyMetrics.map((km) => (
                  <button key={km.metric} type="button"
                    onClick={() => setForm((f) => ({ ...f, metric: km.metric, target: f.target || km.target, title: f.title || km.metric }))}
                    className="text-xs px-2 py-0.5 rounded-full bg-white border border-violet-200 text-violet-800 hover:bg-violet-100">
                    {km.metric}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {meta.fields.map(fieldBlock)}
          </div>

          {/* Component: suggestions + cross-cloud equivalents */}
          {type === "component" && (
            <>
              <datalist id="service-suggestions">
                {serviceOptions.map((s) => <option key={s} value={s} />)}
              </datalist>
              {!form.service && serviceOptions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs text-violet-700 flex items-center gap-1"><Sparkles size={12} /> {form.provider} · {form.layer}:</span>
                  {serviceOptions.slice(0, 6).map((s) => (
                    <button key={s} type="button" onClick={() => set("service", s)} className="text-xs px-2 py-0.5 rounded-full border border-violet-200 text-violet-800 hover:bg-violet-50">{s}</button>
                  ))}
                </div>
              )}
              {capability && (
                <div className="text-xs bg-gray-50 rounded-lg p-2.5 text-gray-600">
                  <span className="font-medium text-gray-700">{capability.capability}</span> elsewhere —
                  {["Azure", "AWS", "GCP"].filter((p) => p !== form.provider).map((p) => <span key={p}> {p}: <span className="text-gray-800">{capability[p]}</span>;</span>)}
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Workload</label>
              <select className={`${inputCls} bg-white`} value={form.module || ""} onChange={(e) => set("module", e.target.value)}>
                {config.modules.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Status</label>
              <select className={`${inputCls} bg-white`} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {(config.statuses[type] || meta.statuses).map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Owner</label>
              <input className={inputCls} value={form.owner || ""} list="team-members" onChange={(e) => set("owner", e.target.value)} />
              <datalist id="team-members">{config.teamMembers.filter((m) => m !== "Unassigned").map((m) => <option key={m} value={m} />)}</datalist>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Source</label>
              <input className={inputCls} value={form.source || ""} list="sources" placeholder="e.g. Discovery workshop 1" onChange={(e) => set("source", e.target.value)} />
              <datalist id="sources">{(config.sources || []).map((m) => <option key={m} value={m} />)}</datalist>
            </div>
          </div>

          {/* Traceability links */}
          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1"><Link2 size={12} /> Linked items</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(form.relatedItems || []).map((rid) => {
                const it = allItems.find((i) => i.id === rid);
                return (
                  <span key={rid} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700">
                    <span className="font-mono text-gray-400">{refs[rid] || "?"}</span> {it ? itemTitle(it) : "missing"}
                    <button type="button" onClick={() => set("relatedItems", form.relatedItems.filter((r) => r !== rid))} className="hover:text-red-500"><X size={10} /></button>
                  </span>
                );
              })}
            </div>
            <input className={`${inputCls} mt-1.5`} placeholder="Search by ref or title to link (e.g. NFR-002, AKS)…" value={linkQuery} onChange={(e) => setLinkQuery(e.target.value)} />
            {linkCandidates.length > 0 && (
              <div className="border rounded-md mt-1 divide-y">
                {linkCandidates.map((i) => (
                  <button key={i.id} type="button" onClick={() => { set("relatedItems", [...(form.relatedItems || []), i.id]); setLinkQuery(""); }}
                    className="w-full text-left px-2.5 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Ref value={refs[i.id]} /> <span className="truncate">{itemTitle(i)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">Tags (comma separated)</label>
            <input className={inputCls} value={form._tags || ""} onChange={(e) => set("_tags", e.target.value)} />
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t px-5 py-3 flex items-center justify-between gap-2 rounded-b-xl">
          <span className="text-xs text-gray-400">⌘↵ to save</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
            <button onClick={handleSave} disabled={!canSave} className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-30">
              {isEdit ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
