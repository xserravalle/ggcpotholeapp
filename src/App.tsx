import React, { useState, useEffect } from 'react';
import { PotholeReport, SeverityLevel } from './types/pothole';
import { ParkingLot, SimulationParams } from './types/parking';
import { INITIAL_POTHOLES } from './data/potholesData';
import { HIGH_RISK_ROAD_SEGMENTS } from './data/roadSegmentsData';
import { PARKING_LOTS } from './data/parkingLotsData';
import { calculateParkingState } from './services/predictiveParking';
import { loadStoredPotholes, saveStoredPotholes } from './services/storageService';
import { distanceFromCampusMiles } from './services/distanceCalculator';

// Common Components
import { Header, ActiveTab } from './components/Header';
import { MobileNavBar } from './components/common/MobileNavBar';
import { SensorBanner } from './components/common/SensorBanner';

// Views
import { DualOverview } from './components/overview/DualOverview';
import { PotholeMapView } from './components/potholes/PotholeMapView';
import { AuthorityHubView } from './components/dispatcher/AuthorityHubView';
import { AIDashcamLab } from './components/potholes/AIDashcamLab';
import { PotholeAnalyticsView } from './components/potholes/PotholeAnalyticsView';
import { ParkingDashboard } from './components/parking/ParkingDashboard';
import { ParkingPredictorView } from './components/parking/ParkingPredictorView';

// Modals & Drawers
import { PotholeDetailDrawer } from './components/potholes/PotholeDetailDrawer';
import { PotholeReportModal } from './components/potholes/PotholeReportModal';
import { DocketSuccessModal } from './components/potholes/DocketSuccessModal';
import { MunicipalDispatcherModal } from './components/potholes/MunicipalDispatcherModal';
import { LotDetailModal } from './components/parking/LotDetailModal';

export function App() {
  // Navigation: Default to Map & Reporting
  const [activeTab, setActiveTab] = useState<ActiveTab>('potholes');

  // Core Data State with Local Persistence
  const [potholes, setPotholes] = useState<PotholeReport[]>(() => loadStoredPotholes(INITIAL_POTHOLES));
  const [roadSegments] = useState(HIGH_RISK_ROAD_SEGMENTS);
  const [parkingLots] = useState<ParkingLot[]>(PARKING_LOTS);

  // Auto-save whenever potholes state changes
  useEffect(() => {
    saveStoredPotholes(potholes);
  }, [potholes]);

  // Parking Sub-view (Cards vs Predictive Curves)
  const [parkingSubView, setParkingSubView] = useState<'cards' | 'curves'>('cards');

  // Interactive Selection State
  const [selectedPothole, setSelectedPothole] = useState<PotholeReport | null>(null);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);

  // Modals & Triggers
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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

  // Calculate live statistics
  const criticalPotholeCount = potholes.filter(
    p => (p.severity === 'critical' || p.severity === 'severe') && p.status !== 'repaired'
  ).length;

  const campusPotholeCount = potholes.filter(
    p => p.authorityId === 'GGC' || p.jurisdiction?.includes('GGC')
  ).length;

  const congestedLotsCount = parkingLots.filter(l => {
    const s = calculateParkingState(l, simulationParams);
    return s.congestionStatus === 'full' || s.occupancyPercent >= 90;
  }).length;

  const simulationTimeDisplay = `${simulationParams.dayOfWeek} ${
    simulationParams.hourOfDay > 12 ? simulationParams.hourOfDay - 12 : simulationParams.hourOfDay
  }:${simulationParams.minuteOfDay < 10 ? '0' + simulationParams.minuteOfDay : simulationParams.minuteOfDay} ${
    simulationParams.hourOfDay >= 12 ? 'PM' : 'AM'
  }`;

  // Verification Handler (Upvote)
  const handleVerifyPothole = (id: string) => {
    setPotholes(prev => prev.map(p => {
      if (p.id === id) {
        const newCount = p.verificationsCount + 1;
        return {
          ...p,
          verificationsCount: newCount,
          userConfirmed: true,
          lastVerifiedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    if (selectedPothole && selectedPothole.id === id) {
      setSelectedPothole(prev => prev ? {
        ...prev,
        verificationsCount: prev.verificationsCount + 1,
        userConfirmed: true
      } : null);
    }
  };

  // Submit New Pothole Report
  const handleSubmitNewReport = (
    newReportData: Omit<PotholeReport, 'id' | 'verificationsCount' | 'userConfirmed' | 'reportedAt' | 'lastVerifiedAt'>
  ) => {
    const randomSuffix = Math.floor(1020 + Math.random() * 8800);
    const trackingCode = `GAP-2026-${randomSuffix}`;
    const newId = `GW-POT-${randomSuffix}`;
    const dist = distanceFromCampusMiles({ lat: newReportData.latitude, lng: newReportData.longitude });

    const newReport: PotholeReport = {
      ...newReportData,
      id: newId,
      trackingCode,
      verificationsCount: 1,
      userConfirmed: true,
      reportedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      workOrderNumber: `DISP-${newId}`,
      distanceFromGgcMiles: dist
    };

    setPotholes(prev => [newReport, ...prev]);
    setSelectedPothole(newReport);
    setDocketSuccessReport(newReport);
    setSensorTriggeredTelemetry(undefined);
  };

  // Update Status Lifecycle
  const handleUpdateStatus = (id: string, newStatus: PotholeReport['status']) => {
    setPotholes(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: newStatus };
      }
      return p;
    }));

    if (selectedPothole && selectedPothole.id === id) {
      setSelectedPothole(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Open Dispatcher for specific pothole
  const handleOpenDispatcher = (p: PotholeReport) => {
    setDispatcherTargetPothole(p);
    setIsDispatcherOpen(true);
  };

  // When Sensor detects impact spike while driving
  const handleImpactDetected = (gForce: number) => {
    setSensorTriggeredTelemetry({
      sensorDetected: true,
      bumpIntensity: gForce,
      severity: 'critical'
    });

    // Automatically attempt to acquire current GPS position
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setDroppedPinCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setIsReportModalOpen(true);
        },
        () => {
          setIsReportModalOpen(true);
        },
        { enableHighAccuracy: true, timeout: 4000 }
      );
    } else {
      setIsReportModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950 pb-16 md:pb-0">
      
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => {
          setSensorTriggeredTelemetry(undefined);
          setIsReportModalOpen(true);
        }}
        potholeCount={potholes.length}
        criticalPotholeCount={criticalPotholeCount}
        campusPotholeCount={campusPotholeCount}
        congestedLotsCount={congestedLotsCount}
        simulationTime={simulationTimeDisplay}
      />

      {/* In-Vehicle Accelerometer & Drive Sensor Banner */}
      <SensorBanner onImpactDetected={handleImpactDetected} />

      {/* Main Tab Content */}
      <main className="flex-1">
        {/* Tab 1: Pothole Detection & Map (Integrated GGC 1-Mile Circle & Gwinnett) */}
        {activeTab === 'potholes' && (
          <PotholeMapView
            potholes={potholes}
            roadSegments={roadSegments}
            selectedPothole={selectedPothole}
            onSelectPothole={setSelectedPothole}
            onVerifyPothole={handleVerifyPothole}
            onOpenDispatcher={handleOpenDispatcher}
            onOpenReportModal={() => {
              setSensorTriggeredTelemetry(undefined);
              setIsReportModalOpen(true);
            }}
            onMapDropPin={(lat, lng, address) => {
              setDroppedPinCoords({ lat, lng, address });
            }}
          />
        )}

        {/* Tab 2: Authority & Dispatcher Hub (/admin capabilities) */}
        {activeTab === 'dispatcher' && (
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

        {/* Tab 3: AI Dashcam Vision & Sensor Telemetry Lab */}
        {activeTab === 'ai-lab' && (
          <AIDashcamLab />
        )}

        {/* Tab 4: Unified Command Overview */}
        {activeTab === 'overview' && (
          <DualOverview
            potholes={potholes}
            roadSegments={roadSegments}
            parkingLots={parkingLots}
            simulationParams={simulationParams}
            onNavigateTab={setActiveTab}
            onSelectPothole={setSelectedPothole}
            onSelectLot={setSelectedLot}
            onOpenReportModal={() => {
              setSensorTriggeredTelemetry(undefined);
              setIsReportModalOpen(true);
            }}
          />
        )}

        {/* Tab 5: Corridor & Pavement Analytics */}
        {activeTab === 'analytics' && (
          <PotholeAnalyticsView
            potholes={potholes}
            roadSegments={roadSegments}
          />
        )}

        {/* Tab 6: Campus & Commuter Parking Forecaster */}
        {activeTab === 'parking' && (
          <div>
            {/* Sub-view Switcher Bar */}
            <div className="bg-slate-900/80 border-b border-slate-800 px-4 sm:px-8 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                GGC Campus Decks & Regional Shopping Centers (Sugarloaf Mills, Mall of GA)
              </span>
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setParkingSubView('cards')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    parkingSubView === 'cards'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Facility Cards
                </button>
                <button
                  onClick={() => setParkingSubView('curves')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    parkingSubView === 'curves'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Predictive Surge Curves
                </button>
              </div>
            </div>

            {parkingSubView === 'cards' ? (
              <ParkingDashboard
                parkingLots={parkingLots}
                simulationParams={simulationParams}
                onChangeSimulationParams={setSimulationParams}
                onSelectLot={setSelectedLot}
              />
            ) : (
              <ParkingPredictorView
                parkingLots={parkingLots}
                simulationParams={simulationParams}
                onChangeSimulationParams={setSimulationParams}
              />
            )}
          </div>
        )}
      </main>

      {/* Pothole Inspector Drawer */}
      <PotholeDetailDrawer
        pothole={selectedPothole}
        onClose={() => setSelectedPothole(null)}
        onVerify={handleVerifyPothole}
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
        }}
        onSubmitReport={handleSubmitNewReport}
        initialTelemetry={sensorTriggeredTelemetry}
        initialCoords={droppedPinCoords}
      />

      {/* Incident Docket Success & Dispatch Modal */}
      <DocketSuccessModal
        isOpen={!!docketSuccessReport}
        onClose={() => setDocketSuccessReport(null)}
        report={docketSuccessReport}
        onViewOnMap={() => {
          setDocketSuccessReport(null);
          setActiveTab('potholes');
        }}
      />

      {/* Municipal Dispatcher Work Order Router Modal */}
      {isDispatcherOpen && (
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

      {/* Bottom Navigation Bar for Mobile Phones (Thumb-friendly) */}
      <MobileNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => {
          setSensorTriggeredTelemetry(undefined);
          setIsReportModalOpen(true);
        }}
        criticalPotholeCount={criticalPotholeCount}
      />

      {/* Desktop Footer */}
      <footer className="hidden md:block bg-slate-900 border-t border-slate-800 py-3.5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-400">
            © 2026 Georgia Pothole Patrol &bull; Georgia Gwinnett College (GGC) & Gwinnett County DOT Pilot
          </span>
          <span className="text-slate-500">
            Routing across Lawrenceville, Duluth, Norcross, Snellville, Suwanee, Peachtree Corners & GDOT District 1
          </span>
        </div>
      </footer>

    </div>
  );
}

export default App;
