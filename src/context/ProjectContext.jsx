'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (project) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects((prev) => [newProject, ...prev]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const updateProject = async (id, updates) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const deleteProject = async (id) => {
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <ProjectContext.Provider
      value={{ projects, loading, addProject, updateProject, deleteProject, refetch: fetchProjects }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export const useProjects = () => useContext(ProjectContext);
