import React, { useState, useEffect, useMemo } from 'react';
import { PotholeReport, SeverityLevel } from './types/pothole';
import { TrackedHazardSpot } from './types/sensorQueue';
import { DriveShockIncident } from './types/driveSession';
import { ParkingLot, SimulationParams } from './types/parking';
import { HIGH_RISK_ROAD_SEGMENTS } from './data/roadSegmentsData';
import { PARKING_LOTS } from './data/parkingLotsData';
import { useAuth } from './context/AuthContext';
import { ReportsProvider, useReports } from './context/ReportsContext';
import { canAccessTab } from './domain/permissions';
import { Actor } from './domain/types';
import { RecipientFilter } from './repository/ReportRepository';

// Common Components
import { Header, ActiveTab } from './components/Header';
import { MobileNavBar } from './components/common/MobileNavBar';
import { SettingsModal } from './components/common/SettingsModal';
import { AuthModal } from './components/common/AuthModal';

// Views
import { UnifiedDashboard } from './components/dashboard/UnifiedDashboard';
import { PotholeMapView } from './components/potholes/PotholeMapView';
import { DriveSensorView } from './components/sensor/DriveSensorView';
import { MyReportsView } from './components/potholes/MyReportsView';
import { AboutHelpView } from './components/about/AboutHelpView';
import { AuthorityHubView } from './components/dispatcher/AuthorityHubView';
import { PotholeAnalyticsView } from './components/potholes/PotholeAnalyticsView';
import { 
  TriageWorkspaceView, 
  PerformanceWorkspaceView, 
  OfficerAssignmentsView 
} from './components/workspaces';

// Modals & Drawers
import { PotholeDetailDrawer } from './components/potholes/PotholeDetailDrawer';
import { PotholeReportModal } from './components/potholes/PotholeReportModal';
import { DocketSuccessModal } from './components/potholes/DocketSuccessModal';
import { MunicipalDispatcherModal } from './components/potholes/MunicipalDispatcherModal';
import { LotDetailModal } from './components/parking/LotDetailModal';

function AppContent() {
  const { user, isAdmin, isOfficer, isAuthModalOpen, closeAuthModal, openAuthModal } = useAuth();
  const {
    potholes,
    submitReport,
    confirmReport,
    updateReportStatus,
    promoteSensorSpot,
    promoteDriveIncidents,
    updateReport,
    deleteReport
  } = useReports();

  // Navigation: Default to Map & Hazards
  const [activeTab, setActiveTab] = useState<ActiveTab>('potholes');

  // Core Data State
  const [roadSegments] = useState(HIGH_RISK_ROAD_SEGMENTS);
  const [parkingLots] = useState<ParkingLot[]>(PARKING_LOTS);

  // Always reset window scroll position to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Route security: verify tab access against user role permissions using canAccessTab(tab, role)
  useEffect(() => {
    if (!canAccessTab(activeTab, user.role)) {
      if (user.role === 'admin') {
        setActiveTab('admin-overview');
      } else if (user.role === 'officer') {
        setActiveTab('my-assignments');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, user.role]);

  // Open report modal when report tab is selected
  useEffect(() => {
    if (activeTab === 'report') {
      setIsReportModalOpen(true);
    }
  }, [activeTab]);

  // Interactive Selection State
  const [selectedPothole, setSelectedPothole] = useState<PotholeReport | null>(null);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);

  // Modals & Triggers
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);
  const [dispatcherTargetPothole, setDispatcherTargetPothole] = useState<PotholeReport | null>(null);
  const [docketSuccessReport, setDocketSuccessReport] = useState<PotholeReport | null>(null);

  // Sensor / Accelerometer Trigger State
  const [sensorTriggeredTelemetry, setSensorTriggeredTelemetry] = useState<{
    sensorDetected: boolean;
    bumpIntensity: number;
    severity?: SeverityLevel;
  } | undefined>(undefined);

  // Map dropped pin coordinates
  const [droppedPinCoords, setDroppedPinCoords] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | undefined>(undefined);

  // Simulation Parameters (Default to Saturday 2:15 PM)
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    dayOfWeek: 'Saturday',
    hourOfDay: 14,
    minuteOfDay: 15,
    isWeekendRush: true,
    isHolidaySurge: false,
    isGgcClassChange: false,
    isRainWeather: false
  });

  const handleOpenDispatcher = (pothole?: PotholeReport) => {
    setDispatcherTargetPothole(pothole || null);
    setIsDispatcherOpen(true);
  };

  // Verification Handler (Upvote)
  const handleVerifyPothole = async (id: string) => {
    const updated = await confirmReport(id);
    if (selectedPothole && selectedPothole.id === id) {
      setSelectedPothole(updated);
    }
  };

  // Submit New Pothole Report
  const handleSubmitNewReport = async (
    newReportData: Omit<PotholeReport, 'id' | 'verificationsCount' | 'userConfirmed' | 'reportedAt' | 'lastVerifiedAt' | 'priority' | 'priorityScore' | 'timeline'>
  ) => {
    const newReport = await submitReport(newReportData);
    setSelectedPothole(newReport);
    setDocketSuccessReport(newReport);
    setSensorTriggeredTelemetry(undefined);
  };

  // Update Status Lifecycle
  const handleUpdateStatus = async (id: string, newStatus: PotholeReport['status']) => {
    const updated = await updateReportStatus(id, newStatus);
    if (selectedPothole && selectedPothole.id === id) {
      setSelectedPothole(updated);
    }
  };

  // Promote a spot that hit 3x into an official confirmed PotholeReport
  const handlePromoteSpotToReport = async (spot: TrackedHazardSpot) => {
    await promoteSensorSpot(spot);
  };

  // Promote all incidents from a completed Drive Session to official reports
  const handlePromoteDriveIncidents = async (incidents: DriveShockIncident[]) => {
    await promoteDriveIncidents(incidents);
  };

  // Update report details (from My Reports edit modal)
  const handleUpdateReport = async (updatedReport: PotholeReport) => {
    const saved = await updateReport(updatedReport);
    if (selectedPothole && selectedPothole.id === updatedReport.id) {
      setSelectedPothole(saved);
    }
  };

  // Delete report (from My Reports edit modal)
  const handleDeleteReport = async (id: string) => {
    await deleteReport(id);
    if (selectedPothole && selectedPothole.id === id) {
      setSelectedPothole(null);
    }
  };

  return (
    <div className={`bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950 ${
      activeTab === 'my-reports' 
        ? 'h-screen max-h-screen overflow-hidden pb-16 md:pb-0' 
        : 'min-h-screen pb-16 md:pb-0'
    }`}>
      
      {/* Universal Streamlined Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuthModal={openAuthModal}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onSelectReport={(reportId) => {
          const found = potholes.find((p) => p.id === reportId);
          if (found) setSelectedPothole(found);
        }}
        potholeCount={potholes.length}
      />

      {/* Main Tab Content */}
      <main className={`flex-1 ${activeTab === 'my-reports' ? 'min-h-0 overflow-hidden flex flex-col' : ''}`}>
        {/* Tab 1: Campus Parking Availability */}
        {activeTab === 'dashboard' && (
          <UnifiedDashboard
            potholes={potholes}
            onSelectPothole={(p) => setSelectedPothole(p)}
            parkingLots={parkingLots}
            simulationParams={simulationParams}
            onChangeSimulationParams={setSimulationParams}
            onSelectLot={setSelectedLot}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {/* Tab 2: Interactive OpenStreetMap Hazard Map */}
        {(activeTab === 'potholes' || activeTab === 'report') && (
          <PotholeMapView
            potholes={potholes}
            roadSegments={roadSegments}
            selectedPothole={selectedPothole}
            onSelectPothole={setSelectedPothole}
            onVerifyPothole={handleVerifyPothole}
            onMapDropPin={(lat, lng, address) => {
              setDroppedPinCoords({ lat, lng, address });
            }}
            onNavigateToDrive={() => setActiveTab('sensor')}
          />
        )}

        {/* Tab 3: Dedicated Drive Sensor View with Audio Hazard Warnings */}
        {activeTab === 'sensor' && (
          <DriveSensorView
            potholes={potholes}
            onPromoteSpotToReport={handlePromoteSpotToReport}
            onPromoteDriveIncidents={handlePromoteDriveIncidents}
            onNavigateToMyReports={() => setActiveTab('my-reports')}
          />
        )}

        {/* Tab 4: My Reports Submissions View */}
        {activeTab === 'my-reports' && (
          <MyReportsView
            potholes={potholes}
            onSelectPothole={setSelectedPothole}
            onOpenReportModal={() => {
              setSensorTriggeredTelemetry(undefined);
              setIsReportModalOpen(true);
            }}
            onNavigateToMap={() => setActiveTab('potholes')}
            onUpdateReport={handleUpdateReport}
            onDeleteReport={handleDeleteReport}
          />
        )}

        {/* Admin Workspaces: Overview & Dispatch Hub */}
        {(activeTab === 'admin-overview' || activeTab === 'dispatcher' || activeTab === 'dispatch-board') && (
          <AuthorityHubView
            potholes={potholes}
            onUpdateStatus={handleUpdateStatus}
            onOpenDispatcherModal={handleOpenDispatcher}
            onSelectPotholeForMap={(p) => {
              setSelectedPothole(p);
              setActiveTab('potholes');
            }}
          />
        )}

        {/* Admin Workspaces: Triage Queue */}
        {activeTab === 'triage' && (
          <TriageWorkspaceView />
        )}

        {/* Admin Workspaces: Performance & SLA Dashboard */}
        {activeTab === 'performance' && (
          <PerformanceWorkspaceView />
        )}

        {/* Admin Workspaces: Pavement Corridor Analytics */}
        {activeTab === 'analytics' && (
          <PotholeAnalyticsView
            potholes={potholes}
            roadSegments={roadSegments}
          />
        )}

        {/* Officer Workspaces: My Field Assignments */}
        {activeTab === 'my-assignments' && (
          <OfficerAssignmentsView
            potholes={potholes}
            onSelectPothole={(p) => {
              setSelectedPothole(p);
            }}
            onNavigateToMap={() => setActiveTab('potholes')}
          />
        )}

        {/* Tab 6: About & Help Documentation */}
        {activeTab === 'about' && (
          <AboutHelpView
            onNavigateTab={setActiveTab}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}
      </main>

      {/* Pothole Inspector Drawer */}
      <PotholeDetailDrawer
        pothole={selectedPothole}
        onClose={() => setSelectedPothole(null)}
        onVerify={handleVerifyPothole}
        isAdmin={isAdmin}
        onOpenDispatcher={(p) => {
          setSelectedPothole(null);
          handleOpenDispatcher(p);
        }}
      />

      {/* Citizen / Student Reporting Modal */}
      <PotholeReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSensorTriggeredTelemetry(undefined);
          setDroppedPinCoords(undefined);
          if (activeTab === 'report') {
            setActiveTab('dashboard');
          }
        }}
        onSubmitReport={handleSubmitNewReport}
        initialTelemetry={sensorTriggeredTelemetry}
        initialCoords={droppedPinCoords}
        existingReports={potholes}
        onConfirmExistingReport={async (id, customMsg) => {
          const actor: Actor = {
            name: user.displayName || 'Citizen Commuter',
            email: user.email,
            role: (user.role as any) || 'user',
          };
          const updated = await confirmReport(id, actor, customMsg);
          setSelectedPothole(updated);
          setIsReportModalOpen(false);
          setSensorTriggeredTelemetry(undefined);
          setDroppedPinCoords(undefined);
          if (activeTab === 'report') {
            setActiveTab('dashboard');
          }
        }}
      />

      {/* Incident Docket Success Modal */}
      <DocketSuccessModal
        isOpen={!!docketSuccessReport}
        onClose={() => setDocketSuccessReport(null)}
        report={docketSuccessReport}
        onViewOnMap={() => {
          setDocketSuccessReport(null);
          setActiveTab('potholes');
        }}
      />

      {/* Municipal Dispatcher Work Order Router Modal (Admin Only) */}
      {isAdmin && isDispatcherOpen && (
        <MunicipalDispatcherModal
          isOpen={isDispatcherOpen}
          onClose={() => setIsDispatcherOpen(false)}
          pothole={dispatcherTargetPothole || potholes[0]}
          allPotholes={potholes}
          onSelectPothole={setDispatcherTargetPothole}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Parking Lot Detail Modal */}
      <LotDetailModal
        lot={selectedLot}
        simulationParams={simulationParams}
        onClose={() => setSelectedLot(null)}
        onSelectAlternate={(altId) => {
          const found = parkingLots.find(l => l.id === altId);
          if (found) setSelectedLot(found);
        }}
      />

      {/* Settings & Accessibility Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onNavigateToSensor={() => {
          setActiveTab('sensor');
          setIsSettingsOpen(false);
        }}
        potholes={potholes}
      />

      {/* User & Admin Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />

      {/* Bottom Navigation Bar for Mobile Phones */}
      <MobileNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Streamlined Desktop Footer */}
      <footer className="shrink-0 hidden md:block bg-slate-900 border-t border-slate-800 py-3.5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-400 font-medium">
            &copy; 2026 GGC SansPotholes &bull; Georgia Gwinnett College ITEC 4860 &bull; Erick Vale, Tina Ly, Hina Luna, Peyton Holland
          </span>
          <div className="flex items-center space-x-4 text-slate-500">
            <button
              onClick={() => setActiveTab('about')}
              className="hover:text-slate-300 transition"
            >
              About & Help
            </button>
            <span>&bull;</span>
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('admin-overview')}
                  className="hover:text-blue-400 transition"
                >
                  Admin Overview
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => setActiveTab('dispatcher')}
                  className="hover:text-blue-400 transition"
                >
                  Agency Dispatch
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="hover:text-teal-400 transition"
                >
                  Pavement Analytics
                </button>
                <span>&bull;</span>
                <span className="text-blue-400 font-semibold font-mono text-[11px]">
                  Admin Portal Active
                </span>
              </>
            ) : isOfficer ? (
              <>
                <button
                  onClick={() => setActiveTab('my-assignments')}
                  className="hover:text-purple-400 transition"
                >
                  My Assignments
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => setActiveTab('potholes')}
                  className="hover:text-emerald-400 transition"
                >
                  Hazard Map
                </button>
                <span>&bull;</span>
                <span className="text-purple-400 font-semibold font-mono text-[11px]">
                  Officer Crew Active ({user.agencyId || 'Field'})
                </span>
              </>
            ) : (
              <button
                onClick={openAuthModal}
                className="hover:text-slate-300 transition text-slate-400"
              >
                Staff / Admin Sign In
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}

export function App() {
  const { user } = useAuth();
  const recipient = useMemo<RecipientFilter>(() => ({
    role: (user?.role as any) || 'user',
    name: user?.displayName,
    email: user?.email,
  }), [user?.role, user?.displayName, user?.email]);

  return (
    <ReportsProvider activeRecipient={recipient}>
      <AppContent />
    </ReportsProvider>
  );
}

export default App;
