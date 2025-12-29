'use client';

import React, { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
}

export interface GPSInputProps {
  label?: string;
  name: string;
  value?: GPSCoordinates | string | null;
  onChange: (coords: GPSCoordinates | null) => void;
  className?: string;
  error?: string;
  description?: string;
  required?: boolean;
}

/**
 * Normalize GPS coordinates from various formats
 */
function normalizeGPSValue(value: GPSCoordinates | string | null | undefined): {
  lat: string;
  lng: string;
} | null {
  if (!value) return null;

  if (typeof value === 'string') {
    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(value);
      if (parsed.latitude && parsed.longitude) {
        return {
          lat: parsed.latitude.toString(),
          lng: parsed.longitude.toString(),
        };
      }
      if (parsed.lat && parsed.lng) {
        return {
          lat: parsed.lat.toString(),
          lng: parsed.lng.toString(),
        };
      }
    } catch {
      // Not JSON, try comma-separated
      if (value.includes(',')) {
        const [lat, lng] = value.split(',').map((s) => s.trim());
        if (lat && lng) {
          return { lat, lng };
        }
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    const lat = 'latitude' in value ? value.latitude : ('lat' in value ? value.lat : null);
    const lng = 'longitude' in value ? value.longitude : ('lng' in value ? value.lng : null);
    if (lat !== null && lng !== null) {
      return {
        lat: lat.toString(),
        lng: lng.toString(),
      };
    }
  }

  return null;
}

export function GPSInput({
  label = 'Coordonnées GPS',
  name,
  value,
  onChange,
  className,
  error,
  description,
  required = false,
}: GPSInputProps) {
  const normalized = normalizeGPSValue(value);
  const [latitude, setLatitude] = useState(normalized?.lat || '');
  const [longitude, setLongitude] = useState(normalized?.lng || '');

  useEffect(() => {
    const normalized = normalizeGPSValue(value);
    if (normalized) {
      setLatitude(normalized.lat);
      setLongitude(normalized.lng);
    } else {
      setLatitude('');
      setLongitude('');
    }
  }, [value]);

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lat = e.target.value;
    setLatitude(lat);
    updateCoordinates(lat, longitude);
  };

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lng = e.target.value;
    setLongitude(lng);
    updateCoordinates(latitude, lng);
  };

  const updateCoordinates = (lat: string, lng: string) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (!isNaN(latNum) && !isNaN(lngNum)) {
      // Validate ranges
      if (latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180) {
        onChange({ latitude: latNum, longitude: lngNum });
      } else {
        onChange(null);
      }
    } else if (lat === '' && lng === '') {
      onChange(null);
    }
  };

  return (
    <FormField
      label={label}
      name={name}
      required={required}
      error={error}
      description={description}
      className={className}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${name}-latitude`}>Latitude</Label>
          <Input
            id={`${name}-latitude`}
            type="number"
            step="any"
            value={latitude}
            onChange={handleLatitudeChange}
            placeholder="45.234"
            min="-90"
            max="90"
            className={cn(error && 'border-destructive')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${name}-longitude`}>Longitude</Label>
          <Input
            id={`${name}-longitude`}
            type="number"
            step="any"
            value={longitude}
            onChange={handleLongitudeChange}
            placeholder="2.567"
            min="-180"
            max="180"
            className={cn(error && 'border-destructive')}
          />
        </div>
      </div>
    </FormField>
  );
}


