import { useState, useMemo, useCallback, useEffect } from "react";
import {
  LayoutDashboard, Boxes, FileText, Gauge, AlertOctagon, Layers, CheckCircle,
  Link2, FileDown, Plus, Upload, PanelLeft, ChevronDown,
} from "lucide-react";
import { ProjectContext } from "./data/ProjectContext";
import { ITEM_TYPES, TYPE_KEYS, buildRefMap } from "./data/itemTypes";
import { assessHealth } from "./lib/health";
import { useProjectItems } from "./hooks/useProjectItems";
import Overview from "./components/Overview";
import SpecBoard from "./components/SpecBoard";
import ItemList from "./components/ItemList";
import ArchitectureView from "./components/ArchitectureView";
import TraceabilityView from "./components/TraceabilityView";
import DeliverablesView from "./components/DeliverablesView";
import DetailPanel from "./components/DetailPanel";
import FormModal from "./components/FormModal";
import ImportNotesModal from "./components/ImportNotesModal";

// ─── Navigation ──────────────────────────────────────────────────────
// `type` is the item type a page lists (and what its "New" button creates).

const NAV_GROUPS = [
  { label: "Engagement", items: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "board", label: "Workloads", icon: Boxes },
  ] },
  { label: "Capture", items: [
    { id: "requirements", label: "Requirements", icon: FileText, type: "requirement" },
    { id: "nfrs", label: "NFRs", icon: Gauge, type: "nfr" },
    { id: "risks", label: "RAID Log", icon: AlertOctagon, type: "risk" },
  ] },
  { label: "Design", items: [
    { id: "architecture", label: "Architecture", icon: Layers, type: "component" },
    { id: "decisions", label: "ADRs", icon: CheckCircle, type: "decision" },
    { id: "traceability", label: "Traceability", icon: Link2 },
  ] },
  { label: "Deliver", items: [
    { id: "deliverables", label: "Deliverables", icon: FileDown },
  ] },
];

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

// ─── SpecDashboard ──────────────────────────────────────────────────

export default function SpecDashboard({ config, user, onUpdateProject }) {
  const [page, setPage] = useState("overview");
  const [currentUser, setCurrentUser] = useState(
    user?.email?.split("@")[0] || user?.displayName || config.teamMembers[0]
  );
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ─── Data layer: REST API + WebSocket ─────────────────────────────

  const {
    items: data,
    loading: dbLoading,
    saveItem,
    deleteItem,
    addComment,
    changeStatus,
  } = useProjectItems(config.id);

  const refs = useMemo(() => buildRefMap(data), [data]);
  const health = useMemo(() => assessHealth(config, data), [config, data]);

  // ─── CRUD handlers ────────────────────────────────────────────────

  const handleChangeStatus = useCallback((id, newStatus) => {
    changeStatus(id, newStatus, currentUser);
  }, [currentUser, changeStatus]);

  const openItem = useCallback((idOrItem) => {
    const id = typeof idOrItem === "string" ? idOrItem : idOrItem?.id;
    const found = data.find((i) => i.id === id);
    if (found) setSelectedItem(found);
  }, [data]);

  // Links are undirected: toggling removes the link from whichever side
  // holds it, or adds it to `a` when neither does.
  const toggleLink = useCallback((a, b) => {
    const has = (x, y) => (x.relatedItems || []).includes(y.id);
    if (has(a, b) || has(b, a)) {
      if (has(a, b)) saveItem({ ...a, relatedItems: a.relatedItems.filter((r) => r !== b.id) });
      if (has(b, a)) saveItem({ ...b, relatedItems: b.relatedItems.filter((r) => r !== a.id) });
    } else {
      saveItem({ ...a, relatedItems: [...(a.relatedItems || []), b.id] });
    }
  }, [saveItem]);

  // Executes a health finding's one-click fix.
  const handleFix = useCallback((fix) => {
    if (!fix) return;
    if (fix.kind === "create") setShowForm({ type: fix.type, prefill: fix.prefill });
    else if (fix.kind === "open") openItem(fix.itemId);
    else if (fix.kind === "page") setPage(fix.page);
  }, [openItem]);

  const setPhase = useCallback((phase) => {
    onUpdateProject?.(config.id, { meta: { ...(config.meta || {}), phase } });
  }, [config.id, config.meta, onUpdateProject]);

  // Keep selectedItem in sync with data updates
  useEffect(() => {
    if (selectedItem) {
      const updated = data.find((i) => i.id === selectedItem.id);
      if (updated && updated !== selectedItem) {
        setSelectedItem(updated);
      }
    }
  }, [data, selectedItem]);

  // "n" opens a new item of the current page's type
  const current = ALL_NAV.find((n) => n.id === page);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
      if (showForm || showImport || selectedItem || document.querySelector(".fixed.inset-0")) return;
      e.preventDefault();
      setShowForm({ type: current?.type || "requirement" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, showForm, showImport, selectedItem]);

  const counts = useMemo(() => {
    const c = {};
    for (const t of TYPE_KEYS) c[t] = data.filter((i) => i.type === t).length;
    return c;
  }, [data]);

  if (dbLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400 text-sm">Loading items...</div>
      </div>
    );
  }

  const meta = config.meta || {};
  const listProps = { items: data, refs, onSelect: setSelectedItem };

  return (
    <ProjectContext.Provider value={config}>
      <div className="flex h-full text-gray-900 font-sans">
        {/* Inner sidebar */}
        <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} bg-white border-r flex flex-col transition-all duration-200 shrink-0`}>
          <div className="px-4 py-4 border-b">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">{config.name}</h1>
            {meta.customer && <p className="text-xs text-gray-500 mt-0.5">{meta.customer}</p>}
            {meta.clouds?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {meta.clouds.map((c) => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{c}</span>)}
              </div>
            )}
          </div>

          {/* Current user selector */}
          <div className="px-4 py-2 border-b">
            <label className="text-xs text-gray-400">Acting as</label>
            <select
              className="w-full mt-0.5 text-sm border rounded px-2 py-1 bg-white font-medium"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
            >
              {[...new Set([currentUser, ...config.teamMembers.filter((m) => m !== "Unassigned")])].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <nav className="flex-1 py-2 px-2 overflow-y-auto">
            {NAV_GROUPS.map((g) => (
              <div key={g.label} className="mb-2">
                <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{g.label}</div>
                {g.items.map((n) => {
                  const Icon = n.icon;
                  const active = page === n.id;
                  const badge = n.id === "overview" ? health.findings.filter((f) => f.severity === "high").length || null : n.type ? counts[n.type] : null;
                  return (
                    <button key={n.id} onClick={() => setPage(n.id)} className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${active ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                      <Icon size={15} />
                      <span className="flex-1 text-left">{n.label}</span>
                      {badge ? (
                        <span className={`text-[10px] px-1.5 rounded-full ${n.id === "overview" ? "bg-red-100 text-red-700" : "text-gray-400"}`}>{badge}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="p-3 border-t text-xs text-gray-400 flex items-center justify-between">
            <span>{data.length} items</span>
            <span title="Overall architecture readiness" className="font-medium text-gray-600">Readiness {health.overall}</span>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded" title="Toggle sidebar">
                <PanelLeft size={16} />
              </button>
              <h2 className="font-semibold text-gray-800">{current?.label}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap">
                <Upload size={14} /> Import Notes
              </button>
              <div className="relative flex">
                <button onClick={() => setShowForm({ type: current?.type || "requirement" })} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-gray-900 text-white text-sm rounded-l-lg hover:bg-gray-800 whitespace-nowrap" title="Shortcut: N">
                  <Plus size={14} /> New {ITEM_TYPES[current?.type || "requirement"].label}
                </button>
                <button onClick={() => setNewMenuOpen(!newMenuOpen)} className="px-1.5 bg-gray-900 text-white rounded-r-lg hover:bg-gray-800 border-l border-gray-700" title="Other item types">
                  <ChevronDown size={14} />
                </button>
                {newMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setNewMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-30 w-44">
                      {TYPE_KEYS.map((t) => (
                        <button key={t} onClick={() => { setNewMenuOpen(false); setShowForm({ type: t }); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700">
                          New {ITEM_TYPES[t].label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            {page === "overview" && <Overview health={health} items={data} refs={refs} onFix={handleFix} onSelect={setSelectedItem} onSetPhase={setPhase} onNavigate={setPage} />}
            {page === "board" && <SpecBoard {...listProps} />}
            {page === "requirements" && <ItemList {...listProps} type="requirement" />}
            {page === "nfrs" && <ItemList {...listProps} type="nfr" />}
            {page === "risks" && <ItemList {...listProps} type="risk" />}
            {page === "decisions" && <ItemList {...listProps} type="decision" />}
            {page === "architecture" && <ArchitectureView {...listProps} health={health} onCreate={(prefill) => setShowForm({ type: "component", prefill })} />}
            {page === "traceability" && <TraceabilityView {...listProps} onToggleLink={toggleLink} />}
            {page === "deliverables" && <DeliverablesView config={config} items={data} refs={refs} health={health} />}
          </div>
        </main>

        {/* Detail Panel */}
        {selectedItem && (
          <DetailPanel
            item={selectedItem}
            allItems={data}
            refs={refs}
            onClose={() => setSelectedItem(null)}
            onSelect={openItem}
            onEdit={(item) => { setShowForm({ type: item.type, editItem: item }); setSelectedItem(null); }}
            onDelete={deleteItem}
            onAddComment={addComment}
            onChangeStatus={handleChangeStatus}
            currentUser={currentUser}
          />
        )}

        {/* Form Modal */}
        {showForm && (
          <FormModal
            type={showForm.type}
            editItem={showForm.editItem}
            prefill={showForm.prefill}
            allItems={data}
            refs={refs}
            onSave={saveItem}
            onClose={() => setShowForm(null)}
            currentUser={currentUser}
          />
        )}
        {/* Import Notes Modal */}
        {showImport && (
          <ImportNotesModal
            projectId={config.id}
            currentUser={currentUser}
            onClose={() => setShowImport(false)}
          />
        )}
      </div>
    </ProjectContext.Provider>
  );
}
