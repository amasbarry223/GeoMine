'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/use-api';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
}

interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ReportTemplate[];
  onSuccess?: () => void;
}

export function GenerateReportModal({
  open,
  onOpenChange,
  templates,
  onSuccess,
}: GenerateReportModalProps) {
  const [reportName, setReportName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const { execute, loading } = useApi();

  const handleToggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportName.trim() || !selectedTemplate) return;

    // TODO: Implement actual report generation API call
    const result = await execute(
      () =>
        fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: reportName.trim(),
            description: description.trim() || null,
            templateType: selectedTemplate,
            includedModels: selectedModels,
            projectId: '1', // TODO: Get from context
          }),
        }),
      {
        successMessage: 'Rapport généré avec succès',
        onSuccess: () => {
          setReportName('');
          setDescription('');
          setSelectedTemplate('');
          setSelectedModels([]);
          onOpenChange(false);
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  // Mock models - TODO: Fetch from API
  const mockModels = [
    { id: '1', name: 'Modèle Inversion RC-001' },
    { id: '2', name: 'Modèle Inversion RC-002' },
    { id: '3', name: 'Modèle Inversion RC-003' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Générer un Nouveau Rapport
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau rapport en sélectionnant un template et les modèles à inclure
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom du rapport */}
          <div className="space-y-2">
            <Label htmlFor="report-name">
              Nom du rapport <span className="text-destructive">*</span>
            </Label>
            <Input
              id="report-name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Ex: Rapport complet - Campagne Alpha"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="report-description">Description</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du rapport..."
              rows={3}
            />
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>
              Template <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplateData && (
              <div className="mt-2 rounded-lg border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedTemplateData.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplateData.sections.map((section) => (
                    <Badge key={section} variant="secondary" className="text-xs">
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Models Selection */}
          <div className="space-y-2">
            <Label>Modèles à inclure</Label>
            <ScrollArea className="h-[200px] rounded-lg border p-4">
              <div className="space-y-2">
                {mockModels.map((model) => (
                  <div key={model.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`model-${model.id}`}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={() => handleToggleModel(model.id)}
                    />
                    <Label htmlFor={`model-${model.id}`} className="cursor-pointer flex-1">
                      {model.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !reportName.trim() || !selectedTemplate}>
              {loading ? (
                'Génération...'
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Générer le rapport
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

