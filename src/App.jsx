import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useProjects } from "./hooks/useProjects";
import { resolveIcon } from "./lib/iconMap";
import HubSidebar from "./components/HubSidebar";
import NewProjectModal from "./components/NewProjectModal";
import AuthGate from "./components/AuthGate";
import SpecDashboard from "./SpecDashboard";

// Add resolved icon component to each project config
function withIcon(project) {
  if (project.icon) return project;
  return { ...project, icon: resolveIcon(project.iconName) };
}

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { projects: dbProjects, loading: projectsLoading, addProject } = useProjects();

  const projects = dbProjects.map(withIcon);
  const loading = authLoading || projectsLoading;

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);

  // Set default active project when projects load
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  const activeConfig = projects.find((p) => p.id === activeProjectId);

  const handleAddProject = useCallback(async (config) => {
    try {
      await addProject(config);
      setActiveProjectId(config.id);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  }, [addProject]);

  // Show auth gate when user not signed in
  if (!authLoading && !user) {
    return <AuthGate onSignIn={signIn} onSignUp={signUp} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <HubSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onNewProject={() => setShowNewProject(true)}
        user={user}
        onSignOut={signOut}
      />
      <div className="flex-1 min-w-0">
        {activeConfig && (
          <SpecDashboard
            key={activeConfig.id}
            config={activeConfig}
            isLocal={false}
            user={user}
          />
        )}
      </div>

      {showNewProject && (
        <NewProjectModal
          onSave={handleAddProject}
          onClose={() => setShowNewProject(false)}
        />
      )}
    </div>
  );
}
