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
  MapPin,
  RotateCcw
} from 'lucide-react';
import { useReports } from '../../context/ReportsContext';
import { StatCard } from '../kit/StatCard';

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
  const { resetDemoData, loadSampleWorkflow } = useReports();
  const [isActionPending, setIsActionPending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleResetDemoData = async () => {
    try {
      setIsActionPending(true);
      await resetDemoData();
      setFeedbackMessage('Demo data reset to initial baseline.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage(`Error resetting demo: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleLoadSampleWorkflow = async () => {
    try {
      setIsActionPending(true);
      await loadSampleWorkflow();
      setFeedbackMessage('Sample workflow loaded: 10 reports across all 7 statuses with realistic timelines.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage(`Error loading sample workflow: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsActionPending(false);
    }
  };

  // KPI Metrics
  const totalCount = potholes.length;
  const pendingCount = potholes.filter(p => p.status === 'reported').length;
  const dispatchedCount = potholes.filter(p => p.status === 'verified').length;
  const scheduledCount = potholes.filter(p => p.status === 'assigned' || p.status === 'in_progress').length;
  const repairedCount = potholes.filter(p => p.status === 'resolved' || p.status === 'closed').length;
  const ggcCampusCount = potholes.filter(p => p.authorityId === 'GGC' || p.jurisdiction?.includes('GGC')).length;
  const criticalCount = potholes.filter(p => (p.severity === 'critical' || p.severity === 'severe') && p.status !== 'resolved' && p.status !== 'closed').length;

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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetDemoData}
            disabled={isActionPending}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow disabled:opacity-50"
            title="Reset reports to initial baseline data and clear comments/notifications"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset demo data</span>
          </button>

          <button
            onClick={handleLoadSampleWorkflow}
            disabled={isActionPending}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition shadow disabled:opacity-50"
            title="Seed 10 reports spanning all 7 workflow statuses with realistic timelines"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load sample workflow</span>
          </button>

          <button
            onClick={() => exportPotholesToCsv(potholes)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV Work Orders</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <StatCard
          label="Total Hazards"
          value={totalCount}
          subtext="Across Gwinnett"
          variant="default"
        />

        <StatCard
          label="GGC Campus"
          value={ggcCampusCount}
          subtext="Facilities Queue"
          variant="emerald"
          icon={GraduationCap}
        />

        <StatCard
          label="Axle-Risk Critical"
          value={criticalCount}
          subtext="Immediate Hazard"
          variant="rose"
          icon={AlertTriangle}
        />

        <StatCard
          label="Pending Triage"
          value={pendingCount}
          subtext="Awaiting Crew"
          variant="amber"
          icon={Clock}
        />

        <StatCard
          label="Dispatched"
          value={dispatchedCount}
          subtext="Field En Route"
          variant="blue"
          icon={Send}
        />

        <StatCard
          label="Scheduled"
          value={scheduledCount}
          subtext="Asphalt Slotted"
          variant="purple"
          icon={Building2}
        />

        <StatCard
          label="Repaired"
          value={repairedCount}
          subtext="Closed & Verified"
          variant="emerald"
          icon={CheckCircle2}
        />
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
          <option value="verified">Verified & Triaged</option>
          <option value="assigned">Assigned to Crew</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
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
                            item.status === 'resolved' || item.status === 'closed'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : item.status === 'assigned'
                              ? 'bg-purple-950 text-purple-300 border-purple-700'
                              : item.status === 'in_progress'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                              : item.status === 'verified'
                              ? 'bg-blue-950 text-blue-300 border-blue-700'
                              : item.status === 'rejected'
                              ? 'bg-rose-950 text-rose-300 border-rose-700'
                              : 'bg-amber-950 text-amber-300 border-amber-700'
                          }`}
                        >
                          <option value="reported">REPORTED</option>
                          <option value="verified">VERIFIED</option>
                          <option value="assigned">ASSIGNED</option>
                          <option value="in_progress">IN PROGRESS</option>
                          <option value="resolved">RESOLVED</option>
                          <option value="closed">CLOSED</option>
                          <option value="rejected">REJECTED</option>
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
