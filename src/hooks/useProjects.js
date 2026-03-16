import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";
import { projectToRow, rowToProject } from "../lib/serializers";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all projects
  useEffect(() => {
    apiFetch("/projects")
      .then((rows) => {
        setProjects(rows.map(rowToProject));
      })
      .catch((err) => {
        console.error("Failed to fetch projects:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const addProject = useCallback(async (config) => {
    const row = projectToRow(config);
    const saved = await apiFetch("/projects", {
      method: "POST",
      body: JSON.stringify(row),
    });
    setProjects((prev) => [...prev, rowToProject(saved)]);
  }, []);

  const updateProject = useCallback(async (id, updates) => {
    const saved = await apiFetch(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? rowToProject(saved) : p))
    );
  }, []);

  return { projects, loading, addProject, updateProject, setProjects };
}
