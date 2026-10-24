import React, { useState } from 'react';
import { PotholeReport, PotholeStatus, SeverityLevel } from '../../types/pothole';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { exportPotholesToCsv } from '../../services/storageService';
import { 
  Building2, 
  Download, 
  FileDown, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Search,
  ExternalLink,
  GraduationCap,
  Sparkles,
  MapPin
} from 'lucide-react';

interface AuthorityHubViewProps {
  potholes: PotholeReport[];
  onUpdateStatus: (id: string, newStatus: PotholeStatus) => void;
  onOpenDispatcherModal: (p: PotholeReport) => void;
  onSelectPotholeForMap: (p: PotholeReport) => void;
}

export const AuthorityHubView: React.FC<AuthorityHubViewProps> = ({
  potholes,
  onUpdateStatus,
  onOpenDispatcherModal,
  onSelectPotholeForMap
}) => {
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // KPI Metrics
  const totalCount = potholes.length;
  const pendingCount = potholes.filter(p => p.status === 'reported').length;
  const dispatchedCount = potholes.filter(p => p.status === 'investigating').length;
  const scheduledCount = potholes.filter(p => p.status === 'scheduled').length;
  const repairedCount = potholes.filter(p => p.status === 'repaired').length;
  const ggcCampusCount = potholes.filter(p => p.authorityId === 'GGC' || p.jurisdiction?.includes('GGC')).length;
  const criticalCount = potholes.filter(p => (p.severity === 'critical' || p.severity === 'severe') && p.status !== 'repaired').length;

  // Filtered List
  const filteredList = potholes.filter(p => {
    if (agencyFilter !== 'all') {
      if (agencyFilter === 'GGC' && p.authorityId !== 'GGC' && !p.jurisdiction?.includes('GGC')) return false;
      if (agencyFilter === 'GCDOT' && p.authorityId !== 'GWINNETT_COUNTY' && !p.jurisdiction?.includes('Gwinnett County')) return false;
      if (agencyFilter === 'GDOT' && p.authorityId !== 'GDOT' && !p.jurisdiction?.includes('GDOT')) return false;
      if (agencyFilter === 'MUNICIPAL' && (p.authorityId === 'GGC' || p.authorityId === 'GWINNETT_COUNTY' || p.authorityId === 'GDOT')) return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.jurisdiction.toLowerCase().includes(q) ||
        (p.trackingCode || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">Authority & Dispatcher Operations Hub</h2>
            <span className="bg-blue-950 text-blue-300 text-xs px-2.5 py-0.5 rounded-full border border-blue-800 font-semibold">
              Multi-Agency GIS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centralized work order dispatch across Georgia Gwinnett College (GGC), Gwinnett County DOT, GDOT District 1, and 16 municipalities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPotholesToCsv(potholes)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV Work Orders</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-slate-400 text-[11px] block">Total Hazards</span>
          <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">{totalCount}</span>
          <span className="text-[10px] text-slate-500">Across Gwinnett</span>
        </div>

        <div className="bg-slate-900 border border-emerald-800/60 rounded-xl p-3 shadow-md bg-emerald-950/20">
          <span className="text-emerald-400 text-[11px] font-semibold block flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> GGC Campus
          </span>
          <span className="text-xl font-extrabold text-emerald-300 font-mono mt-0.5 block">{ggcCampusCount}</span>
          <span className="text-[10px] text-slate-400">Facilities Queue</span>
        </div>

        <div className="bg-slate-900 border border-rose-800/60 rounded-xl p-3 shadow-md bg-rose-950/20">
          <span className="text-rose-400 text-[11px] font-semibold block">Axle-Risk Critical</span>
          <span className="text-xl font-extrabold text-rose-300 font-mono mt-0.5 block">{criticalCount}</span>
          <span className="text-[10px] text-rose-400/80">Immediate Hazard</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-amber-400 text-[11px] font-semibold block">Pending Triage</span>
          <span className="text-xl font-extrabold text-amber-300 font-mono mt-0.5 block">{pendingCount}</span>
          <span className="text-[10px] text-slate-500">Awaiting Crew</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-blue-400 text-[11px] font-semibold block">Dispatched</span>
          <span className="text-xl font-extrabold text-blue-300 font-mono mt-0.5 block">{dispatchedCount}</span>
          <span className="text-[10px] text-slate-500">Field En Route</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-purple-400 text-[11px] font-semibold block">Scheduled</span>
          <span className="text-xl font-extrabold text-purple-300 font-mono mt-0.5 block">{scheduledCount}</span>
          <span className="text-[10px] text-slate-500">Asphalt Slotted</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-emerald-400 text-[11px] font-semibold block">Repaired</span>
          <span className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5 block">{repairedCount}</span>
          <span className="text-[10px] text-slate-500">Closed & Verified</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by street, tracking code, or city..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Agency Group Tabs */}
        <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
          {[
            { id: 'all', label: 'All Agencies' },
            { id: 'GGC', label: '🎓 GGC Campus' },
            { id: 'GCDOT', label: 'County DOT' },
            { id: 'GDOT', label: 'GDOT District 1' },
            { id: 'MUNICIPAL', label: 'Municipal Cities' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAgencyFilter(tab.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                agencyFilter === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 outline-none font-medium"
        >
          <option value="all">All Lifecycles</option>
          <option value="reported">Reported</option>
          <option value="investigating">Investigating / Dispatched</option>
          <option value="scheduled">Scheduled for Repair</option>
          <option value="repaired">Repaired</option>
        </select>
      </div>

      {/* Work Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <th className="py-3 px-4">Tracking #</th>
                <th className="py-3 px-4">Severity / Hazard</th>
                <th className="py-3 px-4">Location & Address</th>
                <th className="py-3 px-4">Responsible Agency</th>
                <th className="py-3 px-4">Telemetry</th>
                <th className="py-3 px-4">Status Lifecycle</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No roadway hazards found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const tracking = item.trackingCode || `GAP-2026-${item.id.replace(/[^0-9]/g, '').slice(-4) || '1042'}`;
                  const isCampus = item.authorityId === 'GGC' || item.jurisdiction?.includes('GGC');

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition group">
                      
                      {/* Tracking Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        <span className="text-teal-400">{tracking}</span>
                        <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                          {item.verificationsCount} confirmations
                        </div>
                      </td>

                      {/* Severity & Hazard */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.severity === 'critical' || item.severity === 'severe'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : item.severity === 'moderate'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                        }`}>
                          {item.severity}
                        </span>
                        <div className="text-[11px] text-slate-300 font-semibold mt-1">
                          {item.title}
                        </div>
                      </td>

                      {/* Location & Address */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-200 font-medium truncate">{item.address}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                          {item.distanceFromGgcMiles !== undefined && (
                            <span className="text-emerald-400">({item.distanceFromGgcMiles.toFixed(2)} mi from GGC)</span>
                          )}
                        </div>
                      </td>

                      {/* Responsible Agency */}
                      <td className="py-3 px-4">
                        <span className={`font-semibold block ${isCampus ? 'text-emerald-300' : 'text-slate-200'}`}>
                          {isCampus ? '🎓 ' : ''}{item.jurisdiction}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {item.authorityEmail || 'dotcustomerservice@gwinnettcounty.com'}
                        </span>
                      </td>

                      {/* Telemetry */}
                      <td className="py-3 px-4">
                        {item.sensorDetected ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            ⚡ {item.bumpIntensity}G Impact
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">{item.detectedBy}</span>
                        )}
                      </td>

                      {/* Status Lifecycle Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as PotholeStatus)}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1 border outline-none cursor-pointer ${
                            item.status === 'repaired'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : item.status === 'scheduled'
                              ? 'bg-purple-950 text-purple-300 border-purple-700'
                              : item.status === 'investigating'
                              ? 'bg-blue-950 text-blue-300 border-blue-700'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="reported">REPORTED</option>
                          <option value="investigating">INVESTIGATING</option>
                          <option value="scheduled">SCHEDULED</option>
                          <option value="repaired">REPAIRED</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Certified PDF Docket */}
                          <button
                            onClick={() => generatePotholePdf(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-700 text-slate-300 hover:text-white transition"
                            title="Download Certified PDF Work Order"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>

                          {/* Work Order Router Modal */}
                          <button
                            onClick={() => onOpenDispatcherModal(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                            title="Open Municipal Work Order Dispatcher"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* View on Map */}
                          <button
                            onClick={() => onSelectPotholeForMap(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white transition"
                            title="Inspect Pin on Map"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
