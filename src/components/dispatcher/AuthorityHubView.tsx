import React, { useState, useEffect } from 'react';
import { PotholeReport, PotholeStatus } from '../../types/pothole';
import { useReports } from '../../context/ReportsContext';
import { ActiveTab } from '../Header';
import { AdminOverviewView } from '../admin/AdminOverviewView';
import { TriageQueueView } from '../admin/TriageQueueView';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { exportPotholesToCsv } from '../../services/storageService';
import { 
  Building2, 
  Download, 
  FileDown, 
  Send, 
  ExternalLink,
  LayoutDashboard,
  ListFilter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export interface AuthorityHubViewProps {
  potholes?: PotholeReport[];
  onUpdateStatus?: (id: string, newStatus: PotholeStatus) => void;
  onOpenDispatcherModal?: (p: PotholeReport) => void;
  onSelectPotholeForMap?: (p: PotholeReport) => void;
  activeSubTab?: 'overview' | 'triage' | 'dispatch';
  onNavigateTab?: (tab: ActiveTab) => void;
}

export const AuthorityHubView: React.FC<AuthorityHubViewProps> = ({
  potholes: propPotholes,
  onUpdateStatus,
  onOpenDispatcherModal,
  onSelectPotholeForMap,
  activeSubTab: initialSubTab = 'overview',
  onNavigateTab,
}) => {
  const { potholes: contextPotholes, resetDemoData, loadSampleWorkflow } = useReports();
  const potholes = propPotholes || contextPotholes;

  const [activeTab, setActiveTab] = useState<'overview' | 'triage' | 'dispatch'>(initialSubTab);
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tab: 'overview' | 'triage' | 'dispatch') => {
    setActiveTab(tab);
    if (onNavigateTab) {
      if (tab === 'overview') onNavigateTab('admin-overview');
      else if (tab === 'triage') onNavigateTab('triage');
      else if (tab === 'dispatch') onNavigateTab('dispatch-board');
    }
  };

  const pendingTriageCount = potholes.filter((p) => p.status === 'reported').length;
  const dispatchReadyCount = potholes.filter((p) => p.status === 'verified' || p.status === 'assigned').length;

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

  // Filtered List for Dispatch Operations
  const filteredList = potholes.filter((p) => {
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
    <div className="space-y-6">
      
      {/* Admin Workspace Internal Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between overflow-x-auto py-2.5 gap-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleTabChange('overview')}
                data-testid="admin-tab-overview"
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Overview</span>
              </button>

              <button
                onClick={() => handleTabChange('triage')}
                data-testid="admin-tab-triage"
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'triage'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>Triage Queue</span>
                {pendingTriageCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === 'triage' ? 'bg-amber-950 text-amber-200' : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  }`}>
                    {pendingTriageCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('dispatch')}
                data-testid="admin-tab-dispatch"
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'dispatch'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Dispatch Board</span>
                {dispatchReadyCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === 'dispatch' ? 'bg-purple-950 text-purple-200' : 'bg-purple-950/80 text-purple-300 border border-purple-800'
                  }`}>
                    {dispatchReadyCount}
                  </span>
                )}
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <button
                onClick={() => exportPotholesToCsv(potholes)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View 1: Admin Overview */}
      {activeTab === 'overview' && (
        <AdminOverviewView
          potholes={potholes}
          onNavigateTab={onNavigateTab}
          onSelectPotholeForMap={onSelectPotholeForMap}
        />
      )}

      {/* View 2: Triage Queue */}
      {activeTab === 'triage' && (
        <TriageQueueView
          potholes={potholes}
          onSelectPotholeForMap={onSelectPotholeForMap}
        />
      )}

      {/* View 3: Dispatch Operations */}
      {activeTab === 'dispatch' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Agency Work Order Dispatch Board</h2>
                <span className="bg-purple-950 text-purple-300 text-xs px-2.5 py-0.5 rounded-full border border-purple-800 font-semibold">
                  Field Assignment
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Route verified road defects to field crews across GGC Campus, Gwinnett DOT, GDOT District 1, and municipalities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleResetDemoData}
                disabled={isActionPending}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Demo Data</span>
              </button>

              <button
                onClick={handleLoadSampleWorkflow}
                disabled={isActionPending}
                className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition shadow disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Load Sample Workflow</span>
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

          {/* Filtering Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by roadway, docket code, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />

            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Jurisdictions</option>
              <option value="GGC">GGC Facilities Only</option>
              <option value="GCDOT">Gwinnett County DOT</option>
              <option value="GDOT">GDOT State Routes</option>
              <option value="MUNICIPAL">Municipalities</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Work Orders Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="py-3 px-4">Docket & Roadway</th>
                  <th className="py-3 px-4">Agency</th>
                  <th className="py-3 px-4">Assigned Crew</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{item.roadName || item.address}</div>
                      <div className="font-mono text-[11px] text-emerald-400">{item.trackingCode || item.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.authorityName || item.jurisdiction || 'Gwinnett County'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.assignedOfficerId || item.assignedCrew || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-700 bg-slate-800 text-slate-300">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* PDF Work Order */}
                        <button
                          onClick={() => generatePotholePdf(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-800 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Download Certified PDF Work Order"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>

                        {/* Open Dispatcher Modal */}
                        {onOpenDispatcherModal && (
                          <button
                            onClick={() => onOpenDispatcherModal(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Assign Crew / Dispatch"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {/* Inspect on Map */}
                        {onSelectPotholeForMap && (
                          <button
                            onClick={() => onSelectPotholeForMap(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-teal-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Inspect on Map"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export { AdminOverviewView, TriageQueueView };
