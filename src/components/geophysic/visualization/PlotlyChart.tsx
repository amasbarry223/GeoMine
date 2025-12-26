'use client';

import React, { useState, useEffect } from 'react';

// Fallback component when react-plotly.js fails to load
const PlotlyFallback: React.FC<{ height?: number }> = ({ height = 600 }) => (
  <div
    className="flex flex-col items-center justify-center h-full text-muted-foreground border border-dashed rounded-lg bg-muted/50"
    style={{ minHeight: `${height}px` }}
  >
    <div className="text-center space-y-2 p-6">
      <p className="text-sm font-medium">Impossible de charger le graphique</p>
      <p className="text-xs text-muted-foreground">
        Vérifiez que react-plotly.js est correctement installé
      </p>
    </div>
  </div>
);

// Loading component
const PlotlyLoading: React.FC = () => (
  <div className="flex items-center justify-center h-full text-muted-foreground">
    <div className="text-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm">Chargement du graphique...</p>
    </div>
  </div>
);

// Props type for Plotly component (matching react-plotly.js)
interface PlotlyChartProps {
  data: any[];
  layout?: any;
  config?: any;
  onRelayout?: (event: any) => void;
  onClick?: (event: any) => void;
  style?: React.CSSProperties;
  useResizeHandler?: boolean;
  [key: string]: any;
}

// Wrapper component that loads react-plotly.js only on client side
const PlotlyChart: React.FC<PlotlyChartProps> = (props) => {
  const [PlotComponent, setPlotComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only load on client side
    if (!isClient || typeof window === 'undefined') {
      return;
    }

    let isMounted = true;

    const loadPlotly = async () => {
      try {
        setIsLoading(true);
        const mod = await import('react-plotly.js');
        
        // Extract the component - handle both ESM and CommonJS
        let Component = mod.default;
        
        // If no default, try the module itself (CommonJS)
        if (!Component) {
          // Check if mod is a function (direct CommonJS export)
          if (typeof mod === 'function') {
            Component = mod;
          } else {
            // Try to find the component in the module
            const keys = Object.keys(mod);
            for (const key of keys) {
              if (typeof (mod as any)[key] === 'function') {
                Component = (mod as any)[key];
                break;
              }
            }
          }
        }

        if (!Component || typeof Component !== 'function') {
          throw new Error('react-plotly.js did not export a valid component');
        }

        if (isMounted) {
          setPlotComponent(() => Component);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading react-plotly.js:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
      }
    };

    loadPlotly();

    return () => {
      isMounted = false;
    };
  }, [isClient]);

  // Always return a valid component - never return undefined or null
  // During SSR or initial load, show loading
  if (!isClient) {
    return <PlotlyLoading />;
  }

  // While loading on client, show loading
  if (isLoading) {
    return <PlotlyLoading />;
  }

  // If error or component not loaded, show fallback
  if (error || !PlotComponent) {
    const height = (props.style?.height as number) || 600;
    return <PlotlyFallback height={height} />;
  }

  // Render the actual Plotly component
  return <PlotComponent {...props} />;
};

// Ensure the export is always a valid React component
export default PlotlyChart as React.ComponentType<PlotlyChartProps>;

