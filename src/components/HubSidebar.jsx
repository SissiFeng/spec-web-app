import { ChevronRight, Plus, LogOut } from "lucide-react";
import { resolveIcon } from "../lib/iconMap";

const COLOR_MAP = {
  blue:    { bg: "bg-blue-50",    text: "text-blue-700",    icon: "text-blue-500",    activeBg: "bg-blue-100" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "text-emerald-500", activeBg: "bg-emerald-100" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   icon: "text-amber-500",   activeBg: "bg-amber-100" },
  purple:  { bg: "bg-purple-50",  text: "text-purple-700",  icon: "text-purple-500",  activeBg: "bg-purple-100" },
  rose:    { bg: "bg-rose-50",    text: "text-rose-700",    icon: "text-rose-500",    activeBg: "bg-rose-100" },
  cyan:    { bg: "bg-cyan-50",    text: "text-cyan-700",    icon: "text-cyan-500",    activeBg: "bg-cyan-100" },
  orange:  { bg: "bg-orange-50",  text: "text-orange-700",  icon: "text-orange-500",  activeBg: "bg-orange-100" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-700",  icon: "text-indigo-500",  activeBg: "bg-indigo-100" },
};

export default function HubSidebar({ projects, activeProjectId, onSelectProject, onNewProject, user, onSignOut }) {
  return (
    <div className="w-60 bg-white border-r flex flex-col h-full shrink-0">
      {/* Hub header */}
      <div className="px-4 py-4 border-b flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight">CSA Workbench</h1>
          <p className="text-xs text-gray-400 mt-0.5">Engagements</p>
        </div>
        <button
          onClick={onNewProject}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          title="New engagement"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Project list */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {projects.map((project) => {
          const active = project.id === activeProjectId;
          const colors = COLOR_MAP[project.color] || COLOR_MAP.blue;
          const Icon = project.icon || resolveIcon(project.iconName);

          return (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                active
                  ? `${colors.activeBg} ${colors.text} font-medium`
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                active ? colors.bg : "bg-gray-100"
              }`}>
                <Icon size={16} className={active ? colors.icon : "text-gray-400"} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{project.name}</div>
                <div className="text-xs text-gray-400 truncate">
                  {[project.meta?.customer, project.meta?.clouds?.join("+"), project.meta?.phase].filter(Boolean).join(" · ") || project.description}
                </div>
              </div>
              {active && <ChevronRight size={14} className="text-gray-300 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-gray-400 space-y-2">
        <div>{projects.length} engagement{projects.length === 1 ? "" : "s"}</div>
        {user && (
          <div className="flex items-center justify-between">
            <span className="truncate">{user.email}</span>
            <button
              onClick={onSignOut}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
              title="Sign out"
            >
              <LogOut size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
