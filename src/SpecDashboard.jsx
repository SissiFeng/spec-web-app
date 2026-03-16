import { useState, useMemo, useCallback, useEffect } from "react";
import {
  FileText, CheckCircle, BookOpen, Shield, Package, Link, Plus,
} from "lucide-react";
import { ProjectContext } from "./data/ProjectContext";
import { now, today } from "./data/constants";
import { useProjectItems } from "./hooks/useProjectItems";
import SpecBoard from "./components/SpecBoard";
import ItemList from "./components/ItemList";
import ReleaseDiff from "./components/ReleaseDiff";
import DependencyView from "./components/DependencyView";
import DetailPanel from "./components/DetailPanel";
import FormModal from "./components/FormModal";

// ─── All possible nav entries ────────────────────────────────────────

const ALL_NAV = [
  { id: "board", label: "Spec Board", icon: FileText, requiredTypes: null },
  { id: "decisions", label: "Decision Log", icon: CheckCircle, requiredTypes: ["decision"] },
  { id: "definitions", label: "Definitions", icon: BookOpen, requiredTypes: ["definition"] },
  { id: "rules", label: "Rule Registry", icon: Shield, requiredTypes: ["rule"] },
  { id: "releases", label: "Release Diff", icon: Package, requiredTypes: ["release"] },
  { id: "dependencies", label: "Dependencies", icon: Link, requiredTypes: null },
];

const TYPE_FOR_PAGE = {
  decisions: "decision",
  definitions: "definition",
  rules: "rule",
  releases: "release",
};

// ─── SpecDashboard ──────────────────────────────────────────────────

export default function SpecDashboard({ config, user }) {
  // Dynamic nav based on enabled types
  const NAV = useMemo(() => {
    return ALL_NAV.filter((n) => {
      if (!n.requiredTypes) return true;
      return n.requiredTypes.some((t) => config.enabledTypes.includes(t));
    });
  }, [config.enabledTypes]);

  const [page, setPage] = useState("board");
  const [currentUser, setCurrentUser] = useState(
    user?.email?.split("@")[0] || user?.displayName || config.teamMembers[0]
  );
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(null);
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

  // ─── CRUD handlers ────────────────────────────────────────────────

  const handleSave = useCallback((item) => {
    saveItem(item);
  }, [saveItem]);

  const handleDelete = useCallback((id) => {
    deleteItem(id);
  }, [deleteItem]);

  const handleAddComment = useCallback((id, comment) => {
    addComment(id, comment);
  }, [addComment]);

  const handleChangeStatus = useCallback((id, newStatus) => {
    changeStatus(id, newStatus, currentUser);
  }, [currentUser, changeStatus]);

  // Keep selectedItem in sync with data updates
  useEffect(() => {
    if (selectedItem) {
      const updated = data.find((i) => i.id === selectedItem.id);
      if (updated && updated !== selectedItem) {
        setSelectedItem(updated);
      }
    }
  }, [data, selectedItem]);

  const counts = useMemo(() => ({
    requirement: data.filter((i) => i.type === "requirement").length,
    decision: data.filter((i) => i.type === "decision").length,
    definition: data.filter((i) => i.type === "definition").length,
    rule: data.filter((i) => i.type === "rule").length,
    release: data.filter((i) => i.type === "release").length,
  }), [data]);

  const addType = page === "board" ? null : TYPE_FOR_PAGE[page];

  if (dbLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400 text-sm">Loading items...</div>
      </div>
    );
  }

  return (
    <ProjectContext.Provider value={config}>
      <div className="flex h-full text-gray-900 font-sans">
        {/* Inner sidebar */}
        <aside className={`${sidebarOpen ? "w-56" : "w-0 overflow-hidden"} bg-white border-r flex flex-col transition-all duration-200 shrink-0`}>
          <div className="px-4 py-4 border-b">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">{config.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{config.description}</p>
          </div>

          {/* Current user selector */}
          <div className="px-4 py-2 border-b">
            <label className="text-xs text-gray-400">Acting as</label>
            <select
              className="w-full mt-0.5 text-sm border rounded px-2 py-1 bg-white font-medium"
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
            >
              {config.teamMembers.filter((m) => m !== "Unassigned").map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <nav className="flex-1 py-2 px-2 space-y-0.5">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = page === n.id;
              return (
                <button key={n.id} onClick={() => setPage(n.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                  <Icon size={15} />{n.label}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t text-xs text-gray-400 space-y-1">
            <div className="grid grid-cols-2 gap-1">
              {config.enabledTypes.includes("requirement") && <span>Req: {counts.requirement}</span>}
              {config.enabledTypes.includes("decision") && <span>Dec: {counts.decision}</span>}
              {config.enabledTypes.includes("definition") && <span>Def: {counts.definition}</span>}
              {config.enabledTypes.includes("rule") && <span>Rule: {counts.rule}</span>}
              {config.enabledTypes.includes("release") && <span>Rel: {counts.release}</span>}
              <span>Total: {data.length}</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded">
                <FileText size={16} />
              </button>
              <h2 className="font-semibold text-gray-800">{NAV.find((n) => n.id === page)?.label}</h2>
            </div>
            <div className="flex items-center gap-2">
              {page === "board" && (
                <div className="flex gap-1">
                  {config.enabledTypes.map((t) => (
                    <button key={t} onClick={() => setShowForm({ type: t })} className="px-2.5 py-1 text-xs border rounded-md hover:bg-gray-50 text-gray-600">
                      + {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              )}
              {addType && (
                <button onClick={() => setShowForm({ type: addType })} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
                  <Plus size={14} /> New
                </button>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-5">
            {page === "board" && <SpecBoard items={data} onSelect={setSelectedItem} />}
            {page === "decisions" && <ItemList items={data} type="decision" onSelect={setSelectedItem} />}
            {page === "definitions" && <ItemList items={data} type="definition" onSelect={setSelectedItem} />}
            {page === "rules" && <ItemList items={data} type="rule" onSelect={setSelectedItem} />}
            {page === "releases" && <ReleaseDiff items={data} onSelect={setSelectedItem} />}
            {page === "dependencies" && <DependencyView items={data} onSelect={setSelectedItem} />}
          </div>
        </main>

        {/* Detail Panel */}
        {selectedItem && (
          <DetailPanel
            item={selectedItem}
            allItems={data}
            onClose={() => setSelectedItem(null)}
            onEdit={(item) => { setShowForm({ type: item.type, editItem: item }); setSelectedItem(null); }}
            onDelete={handleDelete}
            onAddComment={handleAddComment}
            onChangeStatus={handleChangeStatus}
          />
        )}

        {/* Form Modal */}
        {showForm && (
          <FormModal
            type={showForm.type}
            editItem={showForm.editItem}
            onSave={handleSave}
            onClose={() => setShowForm(null)}
            currentUser={currentUser}
          />
        )}
      </div>
    </ProjectContext.Provider>
  );
}
