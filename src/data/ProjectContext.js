import { createContext, useContext } from "react";

export const ProjectContext = createContext(null);

export function useProjectConfig() {
  const config = useContext(ProjectContext);
  if (!config) {
    throw new Error("useProjectConfig must be used within a ProjectContext.Provider");
  }
  return config;
}
