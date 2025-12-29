'use client';

import React from 'react';
import { DrillHole, DrillType } from '@/types/drilling';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface HoleTableProps {
  holes: DrillHole[];
  onHoleClick?: (hole: DrillHole) => void;
}

const drillTypeLabels: Record<DrillType, string> = {
  [DrillType.ACORE]: 'Acore',
  [DrillType.RAB]: 'RAB',
  [DrillType.AUGER]: 'Auger',
  [DrillType.RC]: 'RC',
  [DrillType.DIAMOND]: 'Diamond',
};

export function HoleTable({ holes, onHoleClick }: HoleTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hole ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>X</TableHead>
            <TableHead>Y</TableHead>
            <TableHead>Z</TableHead>
            <TableHead>Azimuth</TableHead>
            <TableHead>Dip</TableHead>
            <TableHead>Profondeur</TableHead>
            <TableHead>Contractor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Aucun trou trouvé
              </TableCell>
            </TableRow>
          ) : (
            holes.map((hole) => (
              <TableRow
                key={hole.id}
                className={onHoleClick ? 'cursor-pointer hover:bg-muted' : ''}
                onClick={() => onHoleClick?.(hole)}
              >
                <TableCell className="font-medium">{hole.holeID}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{drillTypeLabels[hole.drillType]}</Badge>
                </TableCell>
                <TableCell>{hole.collarX.toFixed(2)}</TableCell>
                <TableCell>{hole.collarY.toFixed(2)}</TableCell>
                <TableCell>{hole.collarZ.toFixed(2)}</TableCell>
                <TableCell>{hole.azimuth ? `${hole.azimuth.toFixed(1)}°` : '-'}</TableCell>
                <TableCell>{hole.dip ? `${hole.dip.toFixed(1)}°` : '-'}</TableCell>
                <TableCell>{hole.totalDepth ? `${hole.totalDepth.toFixed(2)} m` : '-'}</TableCell>
                <TableCell>{hole.contractor || '-'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}


