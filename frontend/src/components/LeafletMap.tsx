import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface ATMZone {
  id: string;
  location_name: string;
  city: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  risk_level: string; // LOW, MODERATE, HIGH, CRITICAL
  risk_color: string; // green, yellow, orange, red
  predicted_window_mins: number;
  factors: Record<string, number>;
}

interface LeafletMapProps {
  zones: ATMZone[];
  onSelectZone?: (zone: ATMZone) => void;
  selectedZoneId?: string | null;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ zones, onSelectZone, selectedZoneId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Initialize map if not already done
    if (mapRef.current && !leafletMap.current) {
      // Center in Mumbai (around Dadar/Bandra where our synthetic ATM coordinates lie)
      leafletMap.current = L.map(mapRef.current, {
        center: [19.0280, 72.8400],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap.current);

      markerGroupRef.current = L.layerGroup().addTo(leafletMap.current);
    }

    // Cleanup on unmount
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, []);

  // Update markers when zones or selections change
  useEffect(() => {
    if (!leafletMap.current || !markerGroupRef.current) return;

    // Clear previous markers
    markerGroupRef.current.clearLayers();

    zones.forEach((zone) => {
      // Choose pulse color based on risk color
      let pulseClass = 'bg-green-600';
      if (zone.risk_color === 'red') pulseClass = 'risk-pulse-red';
      else if (zone.risk_color === 'orange') pulseClass = 'risk-pulse-orange';
      else if (zone.risk_color === 'yellow') pulseClass = 'bg-yellow-500 border border-white rounded-full';
      
      const isSelected = selectedZoneId === zone.id;
      const ringStyle = isSelected ? 'ring-4 ring-navy-700 ring-offset-2' : '';
      
      // Create a neat custom div icon
      const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="flex items-center justify-center w-6 h-6">
            <div class="w-4 h-4 rounded-full ${pulseClass} ${ringStyle} shadow-md flex items-center justify-center">
              <span class="text-[8px] font-bold text-white">${zone.risk_score}%</span>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([zone.latitude, zone.longitude], { icon })
        .bindPopup(`
          <div class="p-1 font-sans">
            <h4 class="font-bold text-navy-950 text-xs">${zone.location_name}</h4>
            <p class="text-[10px] text-slate-500 m-0">ID: ${zone.id} | City: ${zone.city}</p>
            <div class="mt-1 flex items-center justify-between text-[11px]">
              <span class="font-semibold text-slate-700">Risk Level:</span>
              <span class="uppercase font-bold text-${zone.risk_color}-700">${zone.risk_level}</span>
            </div>
            <div class="mt-0.5 flex items-center justify-between text-[11px]">
              <span class="font-semibold text-slate-700">Withdrawal window:</span>
              <span class="font-bold text-slate-900">${zone.predicted_window_mins} mins</span>
            </div>
          </div>
        `);

      marker.on('click', () => {
        if (onSelectZone) {
          onSelectZone(zone);
        }
      });

      markerGroupRef.current.addLayer(marker);

      // Center view on selected marker
      if (isSelected) {
        leafletMap.current.setView([zone.latitude, zone.longitude], 14, { animate: true });
        marker.openPopup();
      }
    });
  }, [zones, selectedZoneId, onSelectZone]);

  return (
    <div className="relative w-full h-full rounded border border-slate-200 shadow-sm overflow-hidden bg-slate-100">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: '350px' }} />
      <div className="absolute bottom-2 left-2 z-[1000] bg-white bg-opacity-95 px-2 py-1.5 rounded shadow-sm text-[10px] border border-slate-200">
        <h5 className="font-semibold text-navy-950 mb-1 border-b pb-0.5">ATM Risk Severity</h5>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block risk-pulse-red" />
            <span className="text-slate-700">Critical Risk (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block risk-pulse-orange" />
            <span className="text-slate-700">High Risk (60% - 80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block border border-slate-300" />
            <span className="text-slate-700">Moderate Risk (35% - 59%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />
            <span className="text-slate-700">Low Risk (&lt;35%)</span>
          </div>
        </div>
      </div>
      <div className="absolute top-2 right-2 z-[1000] bg-navy-950 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm opacity-80 uppercase">
        SIMULATED GEOLOCATIONS
      </div>
    </div>
  );
};
export default LeafletMap;
