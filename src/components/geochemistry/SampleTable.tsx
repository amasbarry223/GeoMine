'use client';

import React from 'react';
import { GeochemicalSample } from '@/types/geochemistry';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SampleTableProps {
  samples: GeochemicalSample[];
  onSampleClick?: (sample: GeochemicalSample) => void;
}

export function SampleTable({ samples, onSampleClick }: SampleTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sample ID</TableHead>
            <TableHead>Hole ID</TableHead>
            <TableHead>X</TableHead>
            <TableHead>Y</TableHead>
            <TableHead>Z</TableHead>
            <TableHead>Depth (cm)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Geologist</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {samples.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Aucun échantillon trouvé
              </TableCell>
            </TableRow>
          ) : (
            samples.map((sample) => (
              <TableRow
                key={sample.id}
                className={onSampleClick ? 'cursor-pointer hover:bg-muted' : ''}
                onClick={() => onSampleClick?.(sample)}
              >
                <TableCell className="font-medium">{sample.sampleID}</TableCell>
                <TableCell>{sample.holeID || '-'}</TableCell>
                <TableCell>{sample.x ?? '-'}</TableCell>
                <TableCell>{sample.y ?? '-'}</TableCell>
                <TableCell>{sample.z ?? '-'}</TableCell>
                <TableCell>{sample.depth_cm ?? '-'}</TableCell>
                <TableCell>{sample.sampleStatus || '-'}</TableCell>
                <TableCell>{sample.geologist || '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}


