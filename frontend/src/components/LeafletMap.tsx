import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';

interface LeafletMapProps {
  atms?: any[];
  center?: [number, number];
  zoom?: number;
  selectedAtmId?: string | null;
  onSelectAtm?: (atmId: string) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  atms = [],
  center = [19.0760, 72.8777], // Mumbai central
  zoom = 12,
  selectedAtmId,
  onSelectAtm
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const { addToast, logAudit } = useApp();

  const defaultAtms = [
    { atm_id: 'ATM-Z03', location_name: 'ATM Cluster 03 - Dadar West', latitude: 19.0210, longitude: 72.8424, risk_level: 'CRITICAL', withdrawal_velocity: 480000.0, time_window: '20–40 mins', confidence: '88%' },
    { atm_id: 'ATM-Z11', location_name: 'ATM Cluster 11 - Bandra Reclamation', latitude: 19.0425, longitude: 72.8368, risk_level: 'HIGH', withdrawal_velocity: 350000.0, time_window: '35–55 mins', confidence: '74%' },
    { atm_id: 'ATM-Z07', location_name: 'ATM Cluster 07 - Kurla East', latitude: 19.0600, longitude: 72.8730, risk_level: 'HIGH', withdrawal_velocity: 290000.0, time_window: '15–30 mins', confidence: '82%' },
    { atm_id: 'ATM-Z09', location_name: 'ATM Cluster 09 - Andheri West Station', latitude: 19.1190, longitude: 72.8470, risk_level: 'CRITICAL', withdrawal_velocity: 520000.0, time_window: '10–25 mins', confidence: '91%' },
    { atm_id: 'ATM-Z05', location_name: 'ATM Cluster 05 - Borivali West Sector 4', latitude: 19.2300, longitude: 72.8570, risk_level: 'MEDIUM', withdrawal_velocity: 180000.0, time_window: '45–70 mins', confidence: '62%' }
  ];

  const mapAtms = atms.length > 0 ? atms : defaultAtms;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // 100% Free OpenStreetMap tile server with dark CSS theme filter
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Circles
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    mapAtms.forEach((atm) => {
      const isCritical = atm.risk_level === 'CRITICAL' || atm.risk_level === 'HIGH';
      const color = isCritical ? '#ef4444' : '#d4af37';
      const glow = isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(212, 175, 55, 0.4)';

      // Threat Heat Circle
      const circle = L.circle([atm.latitude, atm.longitude], {
        radius: isCritical ? 1400 : 800,
        fillColor: color,
        fillOpacity: isCritical ? 0.18 : 0.1,
        color: color,
        weight: 1,
        dashArray: '3 6'
      });
      circle.addTo(layerGroup);

      // Custom Div Icon
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            width: 22px;
            height: 22px;
            background-color: #12131b;
            border: 2px solid ${color};
            box-shadow: 0 0 14px ${glow};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="width: 8px; height: 8px; background-color: ${color}; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -12]
      });

      const popupContent = `
        <div style="padding: 6px; font-family: Inter, sans-serif; font-size: 11px; min-width: 200px; color: #f8f7f2;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="color: #d4af37; font-family: monospace;">${atm.atm_id}</strong>
            <span style="font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 3px; background: ${isCritical ? '#450a0a' : '#1c1917'}; color: ${color}; border: 1px solid ${color};">
              ${atm.risk_level} THREAT
            </span>
          </div>
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">${atm.location_name}</div>
          <div style="font-size: 10px; color: #9e9b94; font-family: monospace; margin-bottom: 6px;">
            Coords: ${atm.latitude.toFixed(4)}, ${atm.longitude.toFixed(4)}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #090a0e; padding: 6px; border-radius: 3px; font-family: monospace; font-size: 10px; margin-bottom: 6px;">
            <div>
              <span style="color: #71717a; font-size: 8px; display: block; text-transform: uppercase;">Est. Window</span>
              <strong style="color: #d4af37;">${atm.time_window || '20–40 min'}</strong>
            </div>
            <div>
              <span style="color: #71717a; font-size: 8px; display: block; text-transform: uppercase;">Confidence</span>
              <strong style="color: #34d399;">${atm.confidence || '88%'}</strong>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([atm.latitude, atm.longitude], { icon: customIcon });
      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectAtm) onSelectAtm(atm.atm_id);
      });
      marker.addTo(layerGroup);
    });
  }, [mapAtms, onSelectAtm]);

  return (
    <div className="w-full h-full min-h-[360px] rounded-sm overflow-hidden border border-surface-border relative z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />
    </div>
  );
};

export default LeafletMap;
