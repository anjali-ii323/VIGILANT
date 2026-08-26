import React, { useState } from 'react';
import { PlayCircle, Award, Clock, ArrowRight, Landmark, User, ShieldAlert } from 'lucide-react';
import { SVGNetworkGraph } from '../components/SVGNetworkGraph';
import { useApp } from '../context/AppContext';

interface SelectedNodeInfo {
  id: string;
  name: string;
  bank: string;
  phone: string;
  risk: number;
  balance: string;
  classification: string;
}

export const MoneyTrail: React.FC = () => {
  const { activeCaseId } = useApp();
  const [visibleSteps, setVisibleSteps] = useState<number>(5); // default showing all
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);

  // Nodes details mapping for inspection
  const nodeDetails: Record<string, SelectedNodeInfo> = {
    'VIC': { id: 'VIC-1024', name: 'Ramesh Chandra', bank: 'State Bank of India', phone: '+91 9876543210', risk: 5, balance: '₹0 (Disputed: ₹1,00,000)', classification: 'VICTIM' },
    'MULE-A': { id: 'MULE-A457', name: 'Mohammad Farooq', bank: 'Canara Bank', phone: '+91 9123456789', risk: 91, balance: '₹0 (Transferred out)', classification: 'HIGH RISK' },
    'MULE-B': { id: 'MULE-B821', name: 'Karan Malhotra', bank: 'Punjab National Bank', phone: '+91 9821234567', risk: 68, balance: '₹25,000', classification: 'SUSPICIOUS' },
    'MULE-C': { id: 'MULE-C912', name: 'Sunil Dutt Gowda', bank: 'Union Bank of India', phone: '+91 9901234567', risk: 91, balance: '₹15,000', classification: 'HIGH RISK' },
    'ATM': { id: 'ATM-Z03', name: 'Dadar West ATM Cluster', bank: 'Mumbai', phone: 'N/A', risk: 95, balance: '₹25,000 withdrawn', classification: 'ATM WITHDRAWAL' },
  };

  const handleSelectNode = (nodeId: string) => {
    const details = nodeDetails[nodeId];
    if (details) {
      setSelectedNode(details);
    }
  };

  const startPlayback = () => {
    setIsPlaying(true);
    setSelectedNode(null);
    setVisibleSteps(1);
    
    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      setVisibleSteps(step);
      if (step >= 5) {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 1500);
  };

  const defaultNodes = [
    { id: 'VIC', label: 'VIC-1024', type: 'VICTIM' as const, riskScore: 5, x: 80, y: 180 },
    { id: 'MULE-A', label: 'MULE-A457', type: 'MULE' as const, riskScore: 91, x: 230, y: 180 },
    { id: 'MULE-B', label: 'MULE-B821', type: 'MULE' as const, riskScore: 68, x: 420, y: 90 },
    { id: 'MULE-C', label: 'MULE-C912', type: 'MULE' as const, riskScore: 91, x: 420, y: 270 },
    { id: 'ATM', label: 'ATM-Z03', type: 'ATM' as const, riskScore: 95, x: 600, y: 270 },
  ];

  const defaultEdges = [
    { id: 'e1', source: 'VIC', target: 'MULE-A', amount: 100000, type: 'UPI', riskScore: 91 },
    { id: 'e2', source: 'MULE-A', target: 'MULE-B', amount: 60000, type: 'IMPS', riskScore: 68 },
    { id: 'e3', source: 'MULE-A', target: 'MULE-C', amount: 40000, type: 'IMPS', riskScore: 91 },
    { id: 'e4', source: 'MULE-C', target: 'ATM', amount: 25000, type: 'ATM_WITHDRAWAL', riskScore: 95 },
  ];

  const currentNodes = defaultNodes.slice(0, visibleSteps);
  const currentEdges = defaultEdges.slice(0, visibleSteps - 1);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-navy-950 font-sans">Money Trail Investigation</h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Trace direct transfers of cyber fraud funds from active case: <span className="font-mono font-bold text-navy-900">{activeCaseId}</span>
          </p>
        </div>

        <button 
          onClick={startPlayback}
          disabled={isPlaying}
          className="px-3 py-1.5 bg-navy-950 text-white rounded text-xs font-bold flex items-center gap-1.5 hover:bg-navy-800 disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4 text-orange-500" />
          Play Transaction Timeline
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: SVG Trail Visualizer */}
        <div className="lg:col-span-8 bg-white p-4 border rounded shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Money Trail Mapping</span>
            <span className="text-[10px] font-mono text-slate-400">Click any node to inspect</span>
          </div>

          <div className="h-[360px] w-full">
            <SVGNetworkGraph 
              nodes={currentNodes} 
              edges={currentEdges}
              onSelectNode={handleSelectNode}
              selectedNodeId={selectedNode ? (selectedNode.id.includes('VIC') ? 'VIC' : selectedNode.id.includes('ATM') ? 'ATM' : selectedNode.id) : null}
            />
          </div>
        </div>

        {/* Right: Selected Node Inspection Card */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          {selectedNode ? (
            <div className="bg-white p-5 border rounded shadow-sm space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="border-b pb-2">
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400">Node Profile</span>
                  <h3 className="font-mono font-extrabold text-sm text-navy-950">{selectedNode.id}</h3>
                  <div className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedNode.risk >= 80 ? 'bg-red-50 text-red-800 border border-red-100' :
                    selectedNode.classification === 'VICTIM' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-800 border border-amber-100'
                  }`}>
                    {selectedNode.classification}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> Holder:</span>
                    <span className="font-semibold text-slate-900">{selectedNode.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 flex items-center gap-1"><Landmark className="w-3.5 h-3.5 text-slate-400" /> Bank:</span>
                    <span className="font-semibold text-slate-800">{selectedNode.bank}</span>
                  </div>
                  {selectedNode.phone !== 'N/A' && (
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-1">📞 Phone:</span>
                      <span className="font-mono text-slate-800">{selectedNode.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 mt-1">
                    <span className="text-slate-500">Node Risk:</span>
                    <span className="font-bold font-mono text-red-700">{selectedNode.risk}%</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-500">Fund Status:</span>
                    <span className="text-navy-950 font-mono">{selectedNode.balance}</span>
                  </div>
                </div>
              </div>

              {selectedNode.classification !== 'VICTIM' && selectedNode.classification !== 'ATM WITHDRAWAL' && (
                <div className="space-y-1.5 pt-4">
                  <button className="w-full py-2 bg-red-700 text-white rounded text-xs font-bold hover:bg-red-650 flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Submit Freeze Request
                  </button>
                  <button className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200 rounded">
                    Query Account History
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed rounded p-6 flex flex-col justify-center items-center text-center text-slate-400 flex-1 min-h-[300px]">
              <ShieldAlert className="w-8 h-8 text-slate-350 mb-2 stroke-[1.5]" />
              <h3 className="font-bold text-xs text-slate-500">No Account Selected</h3>
              <p className="text-[10px] text-slate-400 max-w-[200px] mt-0.5">
                Click any circle in the Money Trail mapping to inspect KYC records and issue freeze holds.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Sequential Transaction Logs Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-950">Recorded Transfer Sequence</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3">Sequence</th>
                <th className="p-3">Source Node</th>
                <th className="p-3">Destination Node</th>
                <th className="p-3">Method</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3">Traced status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono">STEP 1 (10:32 AM)</td>
                <td className="p-3 font-semibold text-slate-800">Victim (VIC-1024)</td>
                <td className="p-3 font-mono font-bold text-navy-950">MULE-A457 (Mohammad Farooq)</td>
                <td className="p-3">UPI</td>
                <td className="p-3 font-bold text-slate-900">₹1,00,000</td>
                <td className="p-3"><span className="bg-red-50 text-red-700 text-[10px] font-mono px-2 py-0.5 border border-red-100 rounded">91%</span></td>
                <td className="p-3 text-slate-500">Transferred Out</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono">STEP 2 (10:38 AM)</td>
                <td className="p-3 font-mono font-bold text-navy-950">MULE-A457 (Mohammad Farooq)</td>
                <td className="p-3 font-mono font-bold text-navy-950">MULE-B821 (Karan Malhotra)</td>
                <td className="p-3">IMPS</td>
                <td className="p-3 font-bold text-slate-900">₹60,000</td>
                <td className="p-3"><span className="bg-orange-50 text-orange-700 text-[10px] font-mono px-2 py-0.5 border border-orange-100 rounded">68%</span></td>
                <td className="p-3 text-amber-700 font-semibold">Active in Account</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono">STEP 3 (10:39 AM)</td>
                <td className="p-3 font-mono font-bold text-navy-950">MULE-A457 (Mohammad Farooq)</td>
                <td className="p-3 font-mono font-bold text-navy-950">MULE-C912 (Sunil Dutt Gowda)</td>
                <td className="p-3">IMPS</td>
                <td className="p-3 font-bold text-slate-900">₹40,000</td>
                <td className="p-3"><span className="bg-red-50 text-red-700 text-[10px] font-mono px-2 py-0.5 border border-red-100 rounded">91%</span></td>
                <td className="p-3 text-slate-500">Partially Withdrawn</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-mono">STEP 4 (10:44 AM)</td>
                <td className="p-3 font-mono font-bold text-navy-950">MULE-C912 (Sunil Dutt Gowda)</td>
                <td className="p-3 font-semibold text-slate-800">Dadar West ATM (ATM-Z03)</td>
                <td className="p-3">ATM Cash-out</td>
                <td className="p-3 font-bold text-slate-900">₹25,000</td>
                <td className="p-3"><span className="bg-red-50 text-red-700 text-[10px] font-mono px-2 py-0.5 border border-red-100 rounded">95%</span></td>
                <td className="p-3 text-red-800 font-extrabold">WITHDRAWN</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
export default MoneyTrail;
