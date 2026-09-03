import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Landmark, MapPin, Store, User, ShieldAlert, Coins, Key } from 'lucide-react';

export interface GraphNode {
  id: string;
  label: string;
  type: 'VICTIM' | 'MULE' | 'SUSPICIOUS' | 'SAFE' | 'ATM' | 'MERCHANT' | 'BANK_ACCOUNT' | 'CRYPTO_WALLET';
  riskScore: number;
  amount?: number;
  bank?: string;
  holder_name?: string;
  bank_name?: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  type: string;
  riskScore: number;
  timestamp?: string;
}

interface SVGNetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  onSelectEdge?: (edgeId: string) => void;
  selectedEdgeId?: string | null;
  focusTrail?: boolean;
}

export const SVGNetworkGraph: React.FC<SVGNetworkGraphProps> = ({
  nodes,
  edges,
  onSelectNode,
  selectedNodeId,
  onSelectEdge,
  selectedEdgeId,
  focusTrail = false
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).tagName === 'svg' || (e.target as SVGElement).id === 'grid-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full min-h-[360px] bg-canvas-950 rounded border border-border-subtle overflow-hidden select-none">
      
      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 p-1 bg-canvas-900 border border-border-subtle rounded shadow-panel">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.15, 2.5))}
          className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))}
          className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetView}
          className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute top-3 left-3 z-10 hidden sm:flex items-center gap-4 px-2.5 py-1 bg-canvas-900 border border-border-subtle rounded text-[9.5px] font-mono text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Victim</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-threat-critical" />
          <span>Mule Account</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-steel-400" />
          <span>ATM Outlet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Crypto Wallet</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          {/* Hairline Grid */}
          <pattern id="graph-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="0.5" />
          </pattern>

          {/* Steel-Blue Arrow Marker */}
          <marker
            id="arrow-steel"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#60A5FA" />
          </marker>

          {/* Critical Arrow Marker */}
          <marker
            id="arrow-threat"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#DC2626" />
          </marker>

          {/* Cyan Crypto Arrow Marker */}
          <marker
            id="arrow-crypto"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#38BDF8" />
          </marker>
        </defs>

        <rect id="grid-bg" width="100%" height="100%" fill="url(#graph-grid)" />

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          
          {/* 1. EDGES (TRANSACTIONS) */}
          {edges.map((edge) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const isSelected = selectedEdgeId === edge.id;
            const isHighRisk = edge.riskScore >= 75;
            const isCrypto = edge.type.includes('USDT') || edge.type.includes('P2P') || targetNode.type === 'CRYPTO_WALLET';
            
            const strokeColor = isSelected ? '#93C5FD' : isCrypto ? '#38BDF8' : isHighRisk ? '#DC2626' : '#3B82F6';
            const strokeWidth = isSelected ? 2.5 : 1.2;
            const markerId = isCrypto ? 'url(#arrow-crypto)' : isHighRisk ? 'url(#arrow-threat)' : 'url(#arrow-steel)';

            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            return (
              <g
                key={edge.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEdge && onSelectEdge(edge.id);
                }}
                className="cursor-pointer group"
              >
                {/* Connection Line */}
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  markerEnd={markerId}
                  strokeDasharray={isCrypto ? '3 3' : edge.type === 'ATM_WITHDRAWAL' ? '4 4' : 'none'}
                  className="transition-colors group-hover:stroke-steel-300"
                />

                {/* Amount Pill */}
                <g transform={`translate(${midX}, ${midY - 8})`}>
                  <rect
                    x="-28"
                    y="-8"
                    width="56"
                    height="16"
                    rx="2"
                    fill="#090B10"
                    stroke={strokeColor}
                    strokeWidth="0.6"
                  />
                  <text
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="500"
                    fill={strokeColor}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {isCrypto ? `$${(edge.amount / 83).toFixed(0)} USDT` : edge.amount >= 100000 ? `₹${(edge.amount/100000).toFixed(1)}L` : `₹${edge.amount.toLocaleString('en-IN')}`}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 2. NODES (ENTITIES) */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isVictim = node.type === 'VICTIM';
            const isATM = node.type === 'ATM';
            const isMule = node.type === 'MULE';
            const isMerchant = node.type === 'MERCHANT';
            const isCrypto = node.type === 'CRYPTO_WALLET';

            let badgeBorder = isSelected ? '#93C5FD' : 'rgba(255, 255, 255, 0.12)';
            let iconColor = '#9EA4AE';

            if (isVictim) {
              badgeBorder = isSelected ? '#93C5FD' : '#16A34A';
              iconColor = '#16A34A';
            } else if (isATM) {
              badgeBorder = isSelected ? '#93C5FD' : '#60A5FA';
              iconColor = '#60A5FA';
            } else if (isCrypto) {
              badgeBorder = isSelected ? '#93C5FD' : '#38BDF8';
              iconColor = '#38BDF8';
            } else if (isMule) {
              badgeBorder = isSelected ? '#93C5FD' : '#DC2626';
              iconColor = '#DC2626';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode && onSelectNode(node.id);
                }}
                className="cursor-pointer group"
              >
                {/* Node Outer Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r="20"
                  fill="#0D1016"
                  stroke={badgeBorder}
                  strokeWidth={isSelected ? "2" : "1.2"}
                  className="transition-colors group-hover:stroke-steel-400"
                />

                {/* Node Icon */}
                <g transform="translate(-7, -7)">
                  {isVictim && <User width="14" height="14" color={iconColor} strokeWidth="1.8" />}
                  {isMule && <ShieldAlert width="14" height="14" color={iconColor} strokeWidth="1.8" />}
                  {isATM && <MapPin width="14" height="14" color={iconColor} strokeWidth="1.8" />}
                  {isCrypto && <Coins width="14" height="14" color={iconColor} strokeWidth="1.8" />}
                  {isMerchant && <Store width="14" height="14" color={iconColor} strokeWidth="1.8" />}
                  {!isVictim && !isMule && !isATM && !isMerchant && !isCrypto && (
                    <Landmark width="14" height="14" color={iconColor} strokeWidth="1.8" />
                  )}
                </g>

                {/* Risk Score Pill */}
                {(isMule || isCrypto) && (
                  <g transform="translate(12, -12)">
                    <circle cx="0" cy="0" r="7" fill={isCrypto ? "#0284C7" : "#DC2626"} />
                    <text
                      fontSize="7"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                      fill="#FFFFFF"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {Math.round(node.riskScore)}
                    </text>
                  </g>
                )}

                {/* Node ID Label */}
                <g transform="translate(0, 28)">
                  <rect
                    x="-55"
                    y="-7"
                    width="110"
                    height="16"
                    rx="2"
                    fill="#050609"
                    stroke={isSelected ? "#93C5FD" : "rgba(255, 255, 255, 0.08)"}
                    strokeWidth="0.6"
                  />
                  <text
                    fontSize="8.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="500"
                    fill={isSelected ? "#93C5FD" : isCrypto ? "#38BDF8" : "#F2F3F5"}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {node.id.length > 14 ? `${node.id.substring(0, 12)}...` : node.id}
                  </text>
                </g>

                {/* Holder Subtitle */}
                {node.holder_name && (
                  <text
                    x="0"
                    y="46"
                    fontSize="7.5"
                    fontFamily="Inter, sans-serif"
                    fill="#686F7A"
                    textAnchor="middle"
                  >
                    {node.holder_name.length > 16 ? `${node.holder_name.substring(0, 14)}...` : node.holder_name}
                  </text>
                )}
              </g>
            );
          })}

        </g>
      </svg>
    </div>
  );
};

export default SVGNetworkGraph;
