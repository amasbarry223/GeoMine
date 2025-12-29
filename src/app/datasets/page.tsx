'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  Download,
  Upload,
  Trash2,
  Eye,
  BarChart3,
  AlertCircle,
  Archive,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/useAppStore';
import { DataType, Dataset } from '@/types/geophysic';
import AppLayout from '@/components/layout/AppLayout';
import { CreateDatasetModal } from '@/components/modals/CreateDatasetModal';
import { DatasetDetailsModal } from '@/components/modals/DatasetDetailsModal';
import { ExportDatasetModal } from '@/components/modals/ExportDatasetModal';
import { DeleteDatasetModal } from '@/components/modals/DeleteDatasetModal';
import { useDatasets } from '@/lib/api/queries';

interface Campaign {
  id: string;
  name: string;
  projectId: string;
}

interface SurveyLine {
  id: string;
  name: string;
  campaignId: string;
}

// Mock data for demonstration
const mockCampaigns: Campaign[] = [
  { id: '1', name: 'Campagne Alpha', projectId: '1' },
  { id: '2', name: 'Campagne Beta', projectId: '1' },
  { id: '3', name: 'Campagne Gamma', projectId: '2' },
];

const mockSurveyLines: SurveyLine[] = [
  { id: '1', name: 'Ligne RC-001', campaignId: '1' },
  { id: '2', name: 'Ligne RC-002', campaignId: '1' },
  { id: '3', name: 'Ligne RC-003', campaignId: '2' },
  { id: '4', name: 'Ligne RC-004', campaignId: '3' },
];

// Mock datasets removed - now using API via useDatasets hook

function getDataTypeColor(type: DataType): string {
  switch (type) {
    case DataType.RESISTIVITY:
      return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
    case DataType.CHARGEABILITY:
      return 'bg-orange-500/15 text-orange-500 border-orange-500/30';
    default:
      return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
  }
}

function getDataTypeLabel(type: DataType): string {
  switch (type) {
    case DataType.RESISTIVITY:
      return 'Résistivité';
    case DataType.CHARGEABILITY:
      return 'Chargeabilité';
    default:
      return type;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export default function DatasetsPage() {
  const router = useRouter();
  const { activeTab, setActiveTab } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DataType | 'ALL'>('ALL');
  const [filterCampaign, setFilterCampaign] = useState<string>('ALL');
  const [filterSurveyLine, setFilterSurveyLine] = useState<string>('ALL');
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab !== 'datasets') {
      setActiveTab('datasets');
    }
  }, [activeTab, setActiveTab]);

  // Fetch datasets from API
  const { data: datasetsData, isLoading, error, refetch } = useDatasets({
    search: searchQuery,
    dataType: filterType,
    surveyLineId: filterSurveyLine !== 'ALL' ? filterSurveyLine : undefined,
    campaignId: filterCampaign !== 'ALL' ? filterCampaign : undefined,
  });

  const datasets = datasetsData?.items || [];
  const totalDatasets = datasetsData?.total || 0;

  return (
    <AppLayout
      headerTitle="Jeux de Données"
      headerActions={
        <>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              router.push('/import');
            }}
          >
            <Upload className="w-4 h-4" />
            Importer
          </Button>
          <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouveau Dataset
          </Button>
        </>
      }
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Database className="w-6 h-6" />
            Jeux de Données
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez et visualisez vos données géophysiques
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              router.push('/import');
            }}
          >
            <Upload className="w-4 h-4" />
            Importer
          </Button>
          <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouveau Dataset
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Total Datasets</CardDescription>
            <CardTitle className="text-2xl">{isLoading ? '...' : totalDatasets}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Résistivité</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? '...' : datasets.filter((d) => d.dataType === DataType.RESISTIVITY).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Chargeabilité</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? '...' : datasets.filter((d) => d.dataType === DataType.CHARGEABILITY).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardDescription>Taille Totale</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading
                ? '...'
                : (datasets.reduce((sum, d) => sum + (d.fileSize || 0), 0) / 1024 / 1024).toFixed(2) + ' MB'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select
                value={filterType}
                onValueChange={(value: DataType | 'ALL') => setFilterType(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type de données" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les types</SelectItem>
                  <SelectItem value={DataType.RESISTIVITY}>Résistivité</SelectItem>
                  <SelectItem value={DataType.CHARGEABILITY}>Chargeabilité</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Campagne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les campagnes</SelectItem>
                  {mockCampaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSurveyLine} onValueChange={setFilterSurveyLine}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ligne de sondage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les lignes</SelectItem>
                  {mockSurveyLines.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <Card className="col-span-full flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <Database className="w-12 h-12 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-muted-foreground">Chargement des datasets...</p>
            </div>
          </Card>
        ) : error ? (
          <Card className="col-span-full flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Erreur de chargement</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {error instanceof Error ? error.message : 'Impossible de charger les datasets. Veuillez réessayer.'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="gap-2"
              >
                <Database className="w-4 h-4" />
                Réessayer
              </Button>
            </div>
          </Card>
        ) : datasets.length > 0 ? (
          datasets.map((dataset) => (
            <Card
              key={dataset.id}
              className="cursor-pointer hover:border-primary/50 transition-all duration-200 bg-card/50 backdrop-blur-sm"
              onClick={(e) => {
                // Only open modal if clicking on the card itself, not on buttons
                if ((e.target as HTMLElement).closest('button')) {
                  return;
                }
                setSelectedDataset(dataset);
                setDetailsModalOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold mb-1">
                      {dataset.name}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {dataset.fileName}
                    </CardDescription>
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
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDataset(dataset);
                          setDetailsModalOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir détails
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/statistics?dataset=${dataset.id}`);
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Analyser
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDataset(dataset);
                          setExportModalOpen(true);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDataset(dataset);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="outline" className={getDataTypeColor(dataset.dataType)}>
                    {getDataTypeLabel(dataset.dataType)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {dataset.sourceFormat}
                  </Badge>
                  {(() => {
                    try {
                      const metadata = typeof dataset.metadata === 'string' 
                        ? JSON.parse(dataset.metadata) 
                        : dataset.metadata || {};
                      if (metadata.isArchive || dataset.sourceFormat === 'ZIP') {
                        const fileCount = metadata.filesProcessed || metadata.archiveInfo?.extractedFiles?.length || 0;
                        return (
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                            <Archive className="w-3 h-3 mr-1" />
                            {fileCount > 0 ? `${fileCount} fichier${fileCount > 1 ? 's' : ''}` : 'Archive ZIP'}
                          </Badge>
                        );
                      }
                    } catch {
                      // Ignore parsing errors
                    }
                    return null;
                  })()}
                  {dataset.isProcessed && (
                    <Badge variant="secondary" className="text-xs">
                      Traité
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Taille:</span>
                    <span className="font-medium ml-1">
                      {formatFileSize(dataset.fileSize || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créé le:</span>
                    <span className="font-medium ml-1">
                      {new Date(dataset.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {(() => {
                    try {
                      const metadata = typeof dataset.metadata === 'string' 
                        ? JSON.parse(dataset.metadata) 
                        : dataset.metadata || {};
                      if (metadata.isArchive || dataset.sourceFormat === 'ZIP') {
                        const fileCount = metadata.filesProcessed || metadata.archiveInfo?.extractedFiles?.length || 0;
                        if (fileCount > 0) {
                          return (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Fichiers extraits:</span>
                              <span className="font-medium ml-1 flex items-center gap-1">
                                <Archive className="w-3 h-3" />
                                {fileCount} fichier{fileCount > 1 ? 's' : ''}
                              </span>
                            </div>
                          );
                        }
                      }
                    } catch {
                      // Ignore parsing errors
                    }
                    return null;
                  })()}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedDataset(dataset);
                      setDetailsModalOpen(true);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/statistics?dataset=${dataset.id}`);
                    }}
                  >
                    <BarChart3 className="w-3 h-3" />
                    Analyser
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDataset(dataset);
                      setExportModalOpen(true);
                    }}
                  >
                    <Download className="w-3 h-3" />
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <Database className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">Aucun dataset trouvé</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Importez vos premières données ou modifiez vos filtres
                </p>
              </div>
              <Button
                className="gap-2"
                onClick={() => {
                  router.push('/import');
                }}
              >
                <Upload className="w-4 h-4" />
                Importer des données
              </Button>
            </div>
          </Card>
        )}
      </div>

        {/* Modals */}
        <CreateDatasetModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={() => {
            // Navigate to import page
            router.push('/import');
          }}
        />
        <DatasetDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          dataset={selectedDataset}
        />
        <ExportDatasetModal
          open={exportModalOpen}
          onOpenChange={setExportModalOpen}
          dataset={selectedDataset}
        />
        <DeleteDatasetModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          dataset={selectedDataset}
          onSuccess={() => {
            // Refresh datasets
            console.log('Dataset deleted, refreshing...');
          }}
        />
      </div>
    </AppLayout>
  );
}
