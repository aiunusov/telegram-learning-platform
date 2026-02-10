import { create } from 'zustand';
import { apiClient } from '../lib/api-client';

interface ProjectState {
  projects: any[];
  currentProject: any | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  setCurrentProject: (project: any) => void;
  createProject: (params: { name: string; description?: string }) => Promise<any>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await apiClient.getProjects();
      set({ projects, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setCurrentProject: (project: any) => {
    set({ currentProject: project });
  },

  createProject: async (params) => {
    const project = await apiClient.createProject(params);
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },
}));
