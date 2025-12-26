'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/useAppStore';
import { ReportStatus } from '@/types/geophysic';
import AppLayout from '@/components/layout/AppLayout';
import { GenerateReportModal } from '@/components/modals/GenerateReportModal';
import { DeleteReportModal } from '@/components/modals/DeleteReportModal';
import { toast } from '@/hooks/use-toast';

// Mock data
const mockReports = [
  {
    id: '1',
    projectId: '1',
    name: 'Rapport complet - Campagne Alpha',
    description: 'Rapport incluant données, inversion et statistiques',
    templateType: 'COMPREHENSIVE',
    includedModels: ['1', '2'],
    generatedAt: new Date('2024-01-20'),
    generatedBy: 'admin@geomine.com',
    fileUrl: '/reports/report_1.pdf',
    status: ReportStatus.COMPLETED,
  },
  {
    id: '2',
    projectId: '1',
    name: 'Rapport inversion - Ligne RC-001',
    description: 'Rapport détaillé des résultats d\'inversion',
    templateType: 'INVERSION',
    includedModels: ['1'],
    generatedAt: new Date('2024-01-18'),
    generatedBy: 'admin@geomine.com',
    fileUrl: '/reports/report_2.pdf',
    status: ReportStatus.COMPLETED,
  },
  {
    id: '3',
    projectId: '2',
    name: 'Rapport statistique - Site Montagne',
    description: 'Analyse statistique complète des données géophysiques',
    templateType: 'STATISTICAL',
    includedModels: [],
    generatedAt: new Date('2024-01-15'),
    generatedBy: 'admin@geomine.com',
    fileUrl: '/reports/report_3.pdf',
    status: ReportStatus.COMPLETED,
  },
  {
    id: '4',
    projectId: '1',
    name: 'Rapport en cours - Nouvelle campagne',
    description: 'Génération en cours du rapport',
    templateType: 'COMPREHENSIVE',
    includedModels: ['3', '4'],
    generatedAt: new Date('2024-01-22'),
    generatedBy: 'admin@geomine.com',
    fileUrl: null,
    status: ReportStatus.GENERATING,
  },
];

const reportTemplates = [
  {
    id: 'comprehensive',
    name: 'Rapport Complet',
    description: 'Inclut toutes les sections : données, inversion, statistiques, anomalies',
    sections: ['summary', 'data', 'inversion', 'statistics', 'anomalies', 'conclusions'],
  },
  {
    id: 'inversion',
    name: 'Rapport d\'Inversion',
    description: 'Résultats détaillés de l\'inversion géophysique',
    sections: ['summary', 'inversion', 'results', 'quality'],
  },
  {
    id: 'statistical',
    name: 'Rapport Statistique',
    description: 'Analyse statistique des données',
    sections: ['summary', 'statistics', 'distributions', 'correlations'],
  },
  {
    id: 'anomalies',
    name: 'Rapport d\'Anomalies',
    description: 'Liste et analyse des anomalies détectées',
    sections: ['summary', 'anomalies', 'maps', 'interpretation'],
  },
  {
    id: 'executive',
    name: 'Rapport Exécutif',
    description: 'Résumé pour la direction et les décideurs',
    sections: ['summary', 'key_findings', 'recommendations', 'conclusions'],
  },
];

function getStatusColor(status: ReportStatus): string {
  switch (status) {
    case ReportStatus.COMPLETED:
      return 'bg-green-500/15 text-green-500 border-green-500/30';
    case ReportStatus.GENERATING:
      return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
    case ReportStatus.DRAFT:
      return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
    case ReportStatus.FAILED:
      return 'bg-red-500/15 text-red-500 border-red-500/30';
    default:
      return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
  }
}

function getStatusLabel(status: ReportStatus): string {
  switch (status) {
    case ReportStatus.COMPLETED:
      return 'Terminé';
    case ReportStatus.GENERATING:
      return 'En cours';
    case ReportStatus.DRAFT:
      return 'Brouillon';
    case ReportStatus.FAILED:
      return 'Échoué';
    default:
      return status;
  }
}

export default function ReportsPage() {
  const router = useRouter();
  const { activeTab, setActiveTab } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    if (activeTab !== 'reports') {
      setActiveTab('reports');
    }
  }, [activeTab, setActiveTab]);

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    // TODO: Fetch reports from API
    console.log('Refreshing reports...');
  };

  return (
    <AppLayout headerTitle="Rapports">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Rapports
          </h1>
          <p className="text-muted-foreground mt-1">
            Générez et gérez vos rapports géophysiques
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Report List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des rapports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={(v: ReportStatus | 'ALL') => setStatusFilter(v)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value={ReportStatus.DRAFT}>Brouillons</SelectItem>
                    <SelectItem value={ReportStatus.GENERATING}>En cours</SelectItem>
                    <SelectItem value={ReportStatus.COMPLETED}>Terminés</SelectItem>
                    <SelectItem value={ReportStatus.FAILED}>Échoués</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className="bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold mb-1">
                        {report.name}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {report.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getStatusColor(report.status)}>
                      {getStatusLabel(report.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className="text-xs">
                      {report.templateType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {new Date(report.generatedAt).toLocaleDateString('fr-FR')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Modèles inclus:</span>
                    <span className="font-medium">{report.includedModels.length}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => {
                        if (report.fileUrl) {
                          window.open(report.fileUrl, '_blank');
                        } else {
                          toast({
                            title: 'Rapport non disponible',
                            description: 'Le rapport n\'est pas encore généré',
                            variant: 'destructive',
                          });
                        }
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      Voir
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1" 
                      disabled={report.status !== ReportStatus.COMPLETED}
                      onClick={() => {
                        if (report.fileUrl) {
                          const link = document.createElement('a');
                          link.href = report.fileUrl;
                          link.download = `${report.name}.pdf`;
                          link.click();
                        }
                      }}
                    >
                      <Download className="w-3 h-3" />
                      Télécharger
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <Card className="col-span-full flex items-center justify-center p-12">
              <div className="text-center space-y-4">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg">Aucun rapport trouvé</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Créez votre premier rapport de géophysique
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Generator */}
        <div className="space-y-6">
          {/* New Report Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nouveau Rapport
              </CardTitle>
              <CardDescription>
                Créez un nouveau rapport en sélectionnant un template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setGenerateModalOpen(true)}
                className="w-full gap-2"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                Générer un nouveau rapport
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total rapports</span>
                <span className="font-semibold">{mockReports.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Terminés</span>
                <span className="font-semibold">
                  {mockReports.filter((r) => r.status === ReportStatus.COMPLETED).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">En cours</span>
                <span className="font-semibold">
                  {mockReports.filter((r) => r.status === ReportStatus.GENERATING).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Modals */}
        <GenerateReportModal
          open={generateModalOpen}
          onOpenChange={setGenerateModalOpen}
          templates={reportTemplates}
          onSuccess={handleRefresh}
        />
        <DeleteReportModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          report={selectedReport}
          onSuccess={handleRefresh}
        />
      </div>
    </AppLayout>
  );
}
