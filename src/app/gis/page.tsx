'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Layers,
  Plus,
  Trash2,
  Eye,
  Download,
  Upload,
  Grid3x3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/useAppStore';
import { GISType, GISLayer as GISLayerType } from '@/types/geophysic';
import AppLayout from '@/components/layout/AppLayout';
import { CreateGISLayerModal } from '@/components/modals/CreateGISLayerModal';

// Mock GIS data
const mockGISLayers: GISLayerType[] = [
  {
    id: '1',
    name: 'Géologie régionale',
    layerType: GISType.GEOLOGY,
    fileName: 'geology.geojson',
    format: 'GeoJSON',
    data: null,
    style: { strokeColor: '#ff6b6b', fillColor: 'rgba(255, 107, 107, 0.2)' },
    isVisible: true,
    zIndex: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Forages',
    layerType: GISType.BOREHOLES,
    fileName: 'boreholes.geojson',
    format: 'GeoJSON',
    data: null,
    style: { strokeColor: '#4ecdc4', fillColor: '#4ecdc4' },
    isVisible: true,
    zIndex: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Topographie',
    layerType: GISType.TOPOGRAPHY,
    fileName: 'dem.tif',
    format: 'GeoTIFF',
    data: null,
    style: { strokeColor: '#45b7d1', fillColor: 'rgba(69, 183, 209, 0.3)' },
    isVisible: true,
    zIndex: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Structures',
    layerType: GISType.STRUCTURES,
    fileName: 'structures.geojson',
    format: 'GeoJSON',
    data: null,
    style: { strokeColor: '#f39c12', strokeWidth: 2 },
    isVisible: false,
    zIndex: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: 'Échantillonnages',
    layerType: GISType.SAMPLES,
    fileName: 'samples.geojson',
    format: 'GeoJSON',
    data: null,
    style: { strokeColor: '#9b59b6', pointSize: 5 },
    isVisible: true,
    zIndex: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function getLayerTypeIcon(type: GISType) {
  switch (type) {
    case GISType.GEOLOGY:
      return 'G';
    case GISType.BOREHOLES:
      return 'B';
    case GISType.SAMPLES:
      return 'S';
    case GISType.TOPOGRAPHY:
      return 'T';
    case GISType.STRUCTURES:
      return 'F';
    default:
      return 'C';
  }
}

function getLayerTypeColor(type: GISType): string {
  switch (type) {
    case GISType.GEOLOGY:
      return 'bg-red-500/15 text-red-500 border-red-500/30';
    case GISType.BOREHOLES:
      return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
    case GISType.SAMPLES:
      return 'bg-purple-500/15 text-purple-500 border-purple-500/30';
    case GISType.TOPOGRAPHY:
      return 'bg-green-500/15 text-green-500 border-green-500/30';
    case GISType.STRUCTURES:
      return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30';
    default:
      return 'bg-gray-500/15 text-gray-500 border-gray-500/30';
  }
}

export default function GISPage() {
  const { activeTab, setActiveTab } = useAppStore();

  const [layers, setLayers] = useState<GISLayerType[]>(mockGISLayers);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab !== 'gis') {
      setActiveTab('gis');
    }
  }, [activeTab, setActiveTab]);

  const filteredLayers = layers.filter((layer) =>
    layer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(layers.map((layer) =>
      layer.id === layerId ? { ...layer, isVisible: !layer.isVisible } : layer
    ));
  };

  const handleDeleteLayer = (layerId: string) => {
    setLayers(layers.filter((layer) => layer.id !== layerId));
  };

  const handleMoveLayer = (layerId: string, direction: 'up' | 'down') => {
    const currentIndex = layers.findIndex((l) => l.id === layerId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const newLayers = [...layers];
    [newLayers[currentIndex], newLayers[newIndex]] = [newLayers[newIndex], newLayers[currentIndex]];
    setLayers(newLayers);
  };

  const visibleLayers = layers.filter((l) => l.isVisible);

  return (
    <AppLayout headerTitle="SIG">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            SIG - Système d'Information Géographique
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez et visualisez vos couches géographiques et vos données géophysiques
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setImportModalOpen(true)}
          >
            <Upload className="w-4 h-4" />
            Importer couche
          </Button>
          <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle couche
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Layers List */}
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des couches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Layers List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Couches SIG</CardTitle>
              <CardDescription>
                {visibleLayers.length}/{layers.length} couches visibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {filteredLayers.map((layer, index) => (
                    <div
                      key={layer.id}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{layer.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getLayerTypeColor(layer.layerType)}>
                              {getLayerTypeIcon(layer.layerType)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {layer.format}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Move Up */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveLayer(layer.id, 'up')}
                            disabled={index === 0}
                          >
                            <Upload className="w-3 h-3" />
                          </Button>

                          {/* Move Down */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveLayer(layer.id, 'down')}
                            disabled={index === layers.length - 1}
                          >
                            <Download className="w-3 h-3 rotate-180" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLayer(layer.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={layer.isVisible}
                            onCheckedChange={() => toggleLayerVisibility(layer.id)}
                          />
                          <span className={layer.isVisible ? 'font-medium' : 'text-muted-foreground'}>
                            {layer.isVisible ? 'Visible' : 'Masqué'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Map Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Viewer */}
          <Card className="h-[600px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Visualisation Cartographique</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-full p-0">
              {/* Map placeholder - In production, this would use Leaflet, Mapbox, or similar */}
              <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                {/* Simulated map background */}
                <div className="absolute inset-0 opacity-30">
                  <div className="w-full h-full" style={{
                    backgroundImage: 'radial-gradient(circle at 30% 40%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 70% 60%, #10b981 0%, transparent 50%)',
                  }} />
                </div>

                {/* Layer overlays simulation */}
                {layers.filter((l) => l.isVisible).map((layer) => (
                  <div
                    key={layer.id}
                    className="absolute p-4 bg-card/90 backdrop-blur-sm border rounded-lg"
                    style={{
                      top: 20 + (parseInt(layer.id) * 10),
                      left: 20 + (parseInt(layer.id) * 15),
                      borderColor: layer.style?.strokeColor || '#ffffff',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: layer.style?.strokeColor }} />
                      <span className="text-sm font-medium">{layer.name}</span>
                    </div>
                  </div>
                ))}

                {/* Map UI overlay */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <div className="p-3 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg">
                    <h4 className="font-semibold text-sm mb-2">Couches actives</h4>
                    <div className="space-y-1">
                      {visibleLayers.map((layer) => (
                        <div key={layer.id} className="flex items-center gap-2 text-xs">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: layer.style?.strokeColor }}
                          />
                          <span>{layer.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                  <div className="p-3 bg-card/95 backdrop-blur-sm border rounded-lg shadow-lg">
                    <p className="text-xs text-muted-foreground">
                      Coordonnes: <span className="font-mono text-primary">45.234° N, 2.567° E</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layer Info */}
          {filteredLayers.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Couches totales</CardDescription>
                  <CardTitle className="text-2xl">{layers.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Couches visibles</CardDescription>
                  <CardTitle className="text-2xl">{visibleLayers.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Layer Types Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Légende des Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(GISType).map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${getLayerTypeColor(type).split(' ')[0]}`} />
                    <span className="text-sm">{type.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Modals */}
        <CreateGISLayerModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={() => {
            // Refresh layers
            console.log('Layer created, refreshing...');
          }}
        />
        <CreateGISLayerModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onSuccess={() => {
            // Refresh layers
            console.log('Layer imported, refreshing...');
          }}
        />
      </div>
    </AppLayout>
  );
}
