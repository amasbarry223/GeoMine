import { create } from 'zustand';
import { Project, Dataset, InversionModel, VisualizationSettings, ColorScale, ViewSettings, Annotation, ImportResult } from '@/types/geophysic';

// ============= APP STORE =============

interface AppState {
  // Current view state
  currentProjectId: string | null;
  currentDatasetId: string | null;
  currentInversionId: string | null;

  // UI state
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  activeTab: string;

  // Visualization settings
  visualizationSettings: VisualizationSettings;
  viewSettings: ViewSettings;

  // Data caches
  projects: Project[];
  datasets: Dataset[];
  inversions: InversionModel[];
  annotations: Annotation[];

  // Import state
  importResult: ImportResult | null;
  isImporting: boolean;

  // Actions
  setCurrentProject: (id: string | null) => void;
  setCurrentDataset: (id: string | null) => void;
  setCurrentInversion: (id: string | null) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setActiveTab: (tab: string) => void;
  updateVisualizationSettings: (settings: Partial<VisualizationSettings>) => void;
  updateViewSettings: (settings: Partial<ViewSettings>) => void;
  setColorScale: (scale: ColorScale) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setDatasets: (datasets: Dataset[]) => void;
  addDataset: (dataset: Dataset) => void;
  updateDataset: (id: string, updates: Partial<Dataset>) => void;
  deleteDataset: (id: string) => void;
  setInversions: (inversions: InversionModel[]) => void;
  addInversion: (inversion: InversionModel) => void;
  updateInversion: (id: string, updates: Partial<InversionModel>) => void;
  deleteInversion: (id: string) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  setImportResult: (result: ImportResult | null) => void;
  setImporting: (importing: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentProjectId: null,
  currentDatasetId: null,
  currentInversionId: null,

  sidebarOpen: true,
  rightPanelOpen: false,
  activeTab: 'projects',

  visualizationSettings: {
    colorScale: ColorScale.VIRIDIS,
    showTopography: true,
    showAnnotations: true,
    showGrid: false,
    showContours: true,
    contourLevels: undefined,
    opacity: 1,
  },

  viewSettings: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotation: 0,
    pitch: 90,
  },

  projects: [],
  datasets: [],
  inversions: [],
  annotations: [],

  importResult: null,
  isImporting: false,

  // Actions
  setCurrentProject: (id) => set({ currentProjectId: id }),
  setCurrentDataset: (id) => set({ currentDatasetId: id }),
  setCurrentInversion: (id) => set({ currentInversionId: id }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),

  updateVisualizationSettings: (settings) =>
    set((state) => ({
      visualizationSettings: { ...state.visualizationSettings, ...settings },
    })),

  updateViewSettings: (settings) =>
    set((state) => ({
      viewSettings: { ...state.viewSettings, ...settings },
    })),

  setColorScale: (scale) =>
    set((state) => ({
      visualizationSettings: { ...state.visualizationSettings, colorScale: scale },
    })),

  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    })),

  setDatasets: (datasets) => set({ datasets }),
  addDataset: (dataset) =>
    set((state) => ({ datasets: [...state.datasets, dataset] })),
  updateDataset: (id, updates) =>
    set((state) => ({
      datasets: state.datasets.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  deleteDataset: (id) =>
    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== id),
      currentDatasetId: state.currentDatasetId === id ? null : state.currentDatasetId,
    })),

  setInversions: (inversions) => set({ inversions }),
  addInversion: (inversion) =>
    set((state) => ({ inversions: [...state.inversions, inversion] })),
  updateInversion: (id, updates) =>
    set((state) => ({
      inversions: state.inversions.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })),
  deleteInversion: (id) =>
    set((state) => ({
      inversions: state.inversions.filter((i) => i.id !== id),
      currentInversionId: state.currentInversionId === id ? null : state.currentInversionId,
    })),

  setAnnotations: (annotations) => set({ annotations }),
  addAnnotation: (annotation) =>
    set((state) => ({ annotations: [...state.annotations, annotation] })),
  updateAnnotation: (id, updates) =>
    set((state) => ({
      annotations: state.annotations.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  deleteAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
    })),

  setImportResult: (result) => set({ importResult: result }),
  setImporting: (importing) => set({ isImporting: importing }),
}));

// ============= SELECTORS =============

export const selectCurrentProject = (state: AppState) =>
  state.projects.find((p) => p.id === state.currentProjectId) || null;

export const selectCurrentDataset = (state: AppState) =>
  state.datasets.find((d) => d.id === state.currentDatasetId) || null;

export const selectCurrentInversion = (state: AppState) =>
  state.inversions.find((i) => i.id === state.currentInversionId) || null;

export const selectProjectDatasets = (projectId: string) => (state: AppState) =>
  state.datasets.filter((d) => d.id === state.currentDatasetId);

export const selectDatasetInversions = (datasetId: string) => (state: AppState) =>
  state.inversions.filter((i) => i.datasetId === datasetId);

export const selectModelAnnotations = (modelId: string) => (state: AppState) =>
  state.annotations.filter((a) => a.inversionModelId === modelId);
