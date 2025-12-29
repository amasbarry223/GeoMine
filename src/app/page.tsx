'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useProjects } from '@/lib/api/queries';
import {
  FolderOpen,
  Search,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Project, ProjectStatus } from '@/types/geophysic';
import AppLayout from '@/components/layout/AppLayout';
import { CreateProjectModal } from '@/components/modals/CreateProjectModal';
import { EditProjectModal } from '@/components/modals/EditProjectModal';
import { DeleteProjectModal } from '@/components/modals/DeleteProjectModal';
import { DuplicateProjectModal } from '@/components/modals/DuplicateProjectModal';
import { ProjectCreationWorkflow } from '@/components/workflows/ProjectCreationWorkflow';
import { QuickActions, useQuickActions } from '@/components/navigation/QuickActions';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';

// Mock data for demonstration
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Site Montagne - Zone A',
    description: 'Campagne de sondage RC pour exploration minière en zone montagneuse',
    siteLocation: 'Massif Central, France',
    gpsCoordinates: '45.234, 2.567',
    status: ProjectStatus.ACTIVE,
    tags: ['cuivre', 'or', 'prioritaire'],
    createdBy: 'admin',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'Vallée Sud - Lignes RC-05 à RC-12',
    description: 'Lignes de sondage complémentaires sur zone potentiellement minéralisée',
    siteLocation: 'Vallée du Rhône, France',
    gpsCoordinates: '44.123, 4.890',
    status: ProjectStatus.ACTIVE,
    tags: ['zinc', 'plomb'],
    createdBy: 'admin',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    name: 'Projet Pilote - Test',
    description: 'Projet de test pour validation de méthodologie',
    siteLocation: 'Bassin Parisien',
    gpsCoordinates: '48.856, 2.352',
    status: ProjectStatus.COMPLETED,
    tags: ['test'],
    createdBy: 'admin',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2023-12-15'),
  },
];



const getStatusColor = (status: ProjectStatus): string => {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return 'bg-green-500/15 text-green-500 border-green-500/30';
    case ProjectStatus.COMPLETED:
      return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
    case ProjectStatus.ARCHIVED:
      return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
    default:
      return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
  }
};

const getStatusLabel = (status: ProjectStatus): string => {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return 'Actif';
    case ProjectStatus.COMPLETED:
      return 'Terminé';
    case ProjectStatus.ARCHIVED:
      return 'Archivé';
    default:
      return status;
  }
};

function ProjectCard({ 
  project, 
  onClick,
  onEdit,
  onDelete,
  onDuplicate
}: { 
  project: Project; 
  onClick: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onDuplicate: (project: Project) => void;
}) {
  const router = useRouter();
  
  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-all duration-200 bg-card/50 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold mb-1">{project.name}</CardTitle>
            <CardDescription className="text-sm line-clamp-2">{project.description}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                router.push(`/datasets?project=${project.id}`);
              }}>
                Ouvrir
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
              >
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(project);
                }}
              >
                Dupliquer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete(project);
                }}
              >
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Localisation:</span>
          <span className="font-medium">{project.siteLocation}</span>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={getStatusColor(project.status)}>
            {getStatusLabel(project.status)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(project.updatedAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {project.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [createWorkflowOpen, setCreateWorkflowOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Quick actions for projects page
  const quickActions = useQuickActions({ page: 'projects' });
  
  // Use React Query for projects
  const { data: projectsData, isLoading: loading, refetch } = useProjects({
    search: searchQuery || undefined,
  });
  
  const projects = useMemo(() => {
    if (!projectsData?.projects) return mockProjects;
    return projectsData.projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      siteLocation: p.siteLocation,
      gpsCoordinates: p.gpsCoordinates ? (typeof p.gpsCoordinates === 'string' ? p.gpsCoordinates : JSON.stringify(p.gpsCoordinates)) : null,
      status: p.status,
      tags: p.tags ? (typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags) : [],
      createdBy: p.createdBy,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
  }, [projectsData]);

  // Redirect to login if not authenticated (middleware should handle this, but this is a backup)
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/');
    }
  }, [status, router]);

  // Listen for create project modal/workflow events
  useEffect(() => {
    const handleOpenCreateProject = () => {
      setCreateModalOpen(true);
    };
    const handleOpenCreateProjectWorkflow = () => {
      setCreateWorkflowOpen(true);
    };
    window.addEventListener('open-create-project-modal', handleOpenCreateProject);
    window.addEventListener('open-create-project-workflow', handleOpenCreateProjectWorkflow);
    return () => {
      window.removeEventListener('open-create-project-modal', handleOpenCreateProject);
      window.removeEventListener('open-create-project-workflow', handleOpenCreateProjectWorkflow);
    };
  }, []);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [projects, searchQuery]);

  const handleRefresh = () => {
    refetch();
    // Reset selected project after operations
    setSelectedProject(null);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setEditModalOpen(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setDeleteModalOpen(true);
  };

  const handleDuplicate = (project: Project) => {
    setSelectedProject(project);
    setDuplicateModalOpen(true);
  };

  return (
    <AppLayout
      headerTitle="Projets"
      headerActions={
        <React.Fragment>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 h-9"
            />
          </div>
          <QuickActions actions={quickActions} />
        </React.Fragment>
      }
    >
      <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Projets d'Exploration</h2>
                <p className="text-muted-foreground mt-1">
                  Gérez vos campagnes de sondage et données géophysiques
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardDescription>Projets actifs</CardDescription>
                  <CardTitle className="text-2xl">
                    {projects.filter((p) => p.status === ProjectStatus.ACTIVE).length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardDescription>Terminés</CardDescription>
                  <CardTitle className="text-2xl">
                    {projects.filter((p) => p.status === ProjectStatus.COMPLETED).length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardDescription>Lignes de sondage</CardDescription>
                  <CardTitle className="text-2xl">24</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardDescription>Inversions</CardDescription>
                  <CardTitle className="text-2xl">12</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Projects Grid */}
            {loading ? (
              <LoadingState message="Chargement des projets..." />
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => router.push(`/datasets?project=${project.id}`)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<FolderOpen className="w-12 h-12" />}
                title="Aucun projet trouvé"
                description="Créez un nouveau projet ou modifiez votre recherche."
                action={
                  <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Nouveau Projet
                  </Button>
                }
              />
            )}
          </div>
        </div>

      {/* Modals */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleRefresh}
      />
      <EditProjectModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        project={selectedProject}
        onSuccess={handleRefresh}
      />
      <DeleteProjectModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        project={selectedProject}
        onSuccess={handleRefresh}
      />
      <DuplicateProjectModal
        open={duplicateModalOpen}
        onOpenChange={setDuplicateModalOpen}
        project={selectedProject}
        onSuccess={handleRefresh}
      />
      <ProjectCreationWorkflow
        open={createWorkflowOpen}
        onOpenChange={setCreateWorkflowOpen}
        onComplete={(projectId) => {
          handleRefresh();
          router.push(`/projects/${projectId}`);
        }}
      />
    </AppLayout>
  );
}
