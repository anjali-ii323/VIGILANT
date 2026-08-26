import React, { useState } from 'react';

export interface GraphNode {
  id: string;
  label: string;
  type: 'VICTIM' | 'MULE' | 'SUSPICIOUS' | 'SAFE' | 'ATM' | 'MERCHANT';
  riskScore: number;
  amount?: number;
  bank?: string;
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
    // Only drag if clicking on the background, not nodes
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const newZoom = e.deltaY < 0 ? Math.min(zoom + zoomFactor, 2.5) : Math.max(zoom - zoomFactor, 0.4);
    setZoom(Number(newZoom.toFixed(2)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Helper to color nodes based on risk
  const getNodeColor = (node: GraphNode) => {
    if (node.type === 'VICTIM') return { bg: '#dbe3ed', border: '#1b293e', text: '#0b131f' }; // Victim
    if (node.type === 'ATM') return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }; // ATM
    if (node.type === 'MERCHANT') return { bg: '#fef3c7', border: '#d97706', text: '#92400e' }; // Merchant
    
    // Mule & suspicious
    if (node.riskScore >= 80) return { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' }; // High Risk
    if (node.riskScore >= 50) return { bg: '#fff7ed', border: '#f97316', text: '#9a3412' }; // Suspicious
    return { bg: '#f0fdf4', border: '#16a34a', text: '#166534' }; // Safe
  };

  return (
    <div className="relative w-full h-full border border-slate-200 rounded overflow-hidden bg-[#fafafa]">
      {/* Graph Toolbar */}
      <div className="absolute top-2 left-2 z-10 flex gap-1 bg-white p-1 rounded shadow-sm border border-slate-200 text-[11px] font-mono">
        <button 
          onClick={() => setZoom((z) => Math.min(z + 0.1, 2.5))}
          className="px-2 py-0.5 hover:bg-slate-100 rounded border border-slate-200"
        >
          +
        </button>
        <button 
          onClick={() => setZoom((z) => Math.max(z - 0.1, 0.4))}
          className="px-2 py-0.5 hover:bg-slate-100 rounded border border-slate-200"
        >
          -
        </button>
        <button 
          onClick={resetView}
          className="px-2 py-0.5 hover:bg-slate-100 rounded border border-slate-200"
        >
          Reset View
        </button>
      </div>

      <div className="absolute top-2 right-2 z-10 bg-white bg-opacity-95 p-2 rounded shadow-sm border border-slate-200 text-[10px] flex flex-wrap gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#dbe3ed] border border-[#1b293e]" />
          <span>Victim</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fef2f2] border border-[#dc2626]" />
          <span>High Risk / Mule</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fff7ed] border border-[#f97316]" />
          <span>Suspicious</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fee2e2] border border-[#ef4444]" />
          <span>ATM Cash-Out</span>
        </div>
      </div>

      {/* Main SVG Area */}
      <svg
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ minHeight: '400px' }}
      >
        <defs>
          {/* Edge Marker Arrows */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
          </marker>
          <marker
            id="arrow-risk"
            viewBox="0 0 10 10"
            refX="22"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
          </marker>
          {/* Subtle Grid Background */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect id="grid-bg" width="100%" height="100%" fill="url(#grid)" />

        {/* Viewport Transform Group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Render Edges/Links */}
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const isHighRisk = edge.riskScore >= 75;
            const isSelected = selectedEdgeId === edge.id;
            const strokeColor = isSelected ? '#1d4ed8' : (isHighRisk ? '#dc2626' : '#64748b');
            const strokeWidth = isSelected ? 3.5 : (isHighRisk ? 2.5 : 1.5);
            const markerId = isSelected ? 'url(#arrow)' : (isHighRisk ? 'url(#arrow-risk)' : 'url(#arrow)');
            
            // Calculate edge midpoint for currency label
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
                {/* Glowing thick path under selected line */}
                {isSelected && (
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="#93c5fd"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="opacity-50 transition-all duration-300"
                  />
                )}
                {/* Connection Line */}
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  markerEnd={markerId}
                  strokeDasharray={edge.type === 'ATM_WITHDRAWAL' ? '4 4' : 'none'}
                  className="transition-all duration-300 group-hover:stroke-blue-500"
                />
                {/* Transaction Amount Badge */}
                <g transform={`translate(${midX}, ${midY - 8})`}>
                  <rect
                    x="-28"
                    y="-8"
                    width="56"
                    height="14"
                    rx="3"
                    fill="white"
                    stroke={strokeColor}
                    strokeWidth="0.5"
                    className="shadow-sm group-hover:stroke-blue-500"
                  />
                  <text
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill={strokeColor}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="group-hover:fill-blue-500"
                  >
                    ₹{edge.amount >= 100000 ? `${(edge.amount/100000).toFixed(1)}L` : edge.amount.toLocaleString('en-IN')}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 2. Render Nodes */}
          {nodes.map((node) => {
            const colors = getNodeColor(node);
            const isSelected = selectedNodeId === node.id;
            const radius = node.type === 'VICTIM' ? 18 : 20;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectNode && onSelectNode(node.id)}
                className="cursor-pointer group"
              >
                {/* Outer Glow Ring for Selected Node */}
                {isSelected && (
                  <circle
                    r={radius + 4}
                    fill="none"
                    stroke="#1b293e"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin"
                    style={{ animationDuration: '8s' }}
                  />
                )}
                {/* Node Circle */}
                <circle
                  r={radius}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="transition-all duration-300 group-hover:scale-110 shadow-sm"
                />
                
                {/* Node Label Prefix Icon (e.g. V, M, A) */}
                <text
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="bold"
                  fill={colors.text}
                  textAnchor="middle"
                  y="-2"
                >
                  {node.type === 'VICTIM' ? 'VIC' : node.type === 'ATM' ? 'ATM' : 'MULE'}
                </text>
                
                {/* Risk Score Label (only for Accounts/Mules) */}
                {node.type !== 'VICTIM' && node.type !== 'ATM' && (
                  <text
                    fontSize="8"
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    fill={node.riskScore >= 75 ? '#ef4444' : '#64748b'}
                    textAnchor="middle"
                    y="8"
                  >
                    {node.riskScore}%
                  </text>
                )}

                {/* Node ID label text below */}
                <g transform={`translate(0, ${radius + 12})`}>
                  <rect
                    x="-32"
                    y="-7"
                    width="64"
                    height="12"
                    rx="2"
                    fill="#1b293e"
                    opacity="0.9"
                  />
                  <text
                    fontSize="8"
                    fontFamily="monospace"
                    fill="white"
                    textAnchor="middle"
                    y="1"
                  >
                    {node.label}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute bottom-2 right-2 bg-white px-2 py-0.5 text-[9px] font-mono border rounded shadow-sm">
        Scroll to Zoom | Drag Background to Pan
      </div>
    </div>
  );
};
export default SVGNetworkGraph;
