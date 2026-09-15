import React from 'react';
import { PotholeReport, RoadSegment } from '../../types/pothole';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  Wrench, 
  MapPin, 
  Layers, 
  BarChart3, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface PotholeAnalyticsViewProps {
  potholes: PotholeReport[];
  roadSegments: RoadSegment[];
}

export const PotholeAnalyticsView: React.FC<PotholeAnalyticsViewProps> = ({
  potholes,
  roadSegments
}) => {
  // Severity Distribution Data
  const severityCounts = {
    severe: potholes.filter(p => p.severity === 'severe').length,
    moderate: potholes.filter(p => p.severity === 'moderate').length,
    minor: potholes.filter(p => p.severity === 'minor').length,
  };

  const severityChartData = [
    { name: 'Severe (>4" Depth)', count: severityCounts.severe, color: '#ef4444' },
    { name: 'Moderate (2-4")', count: severityCounts.moderate, color: '#f59e0b' },
    { name: 'Minor (<2")', count: severityCounts.minor, color: '#eab308' },
  ];

  // Road Segment PCI data for Bar Chart
  const segmentPciData = roadSegments.map(seg => ({
    name: seg.corridor,
    pci: seg.pci,
    risk: seg.riskLevel,
    potholes: seg.potholeCount,
    traffic: seg.dailyTrafficAADT
  })).sort((a, b) => a.pci - b.pci);

  // Clusters Ranking Data
  const clusters = [
    {
      corridor: 'Pleasant Hill Rd Corridor (Duluth)',
      reports: 28,
      primaryHazard: 'Tire / Rim Punctures near I-85',
      leadCause: 'High Heavy-Truck Braking Shear',
      pci: 48,
      status: 'Priority Action Zone'
    },
    {
      corridor: 'Scenic Hwy (SR 124) Snellville Strip',
      reports: 24,
      primaryHazard: 'Multi-pothole tire strike cluster',
      leadCause: 'Utility trench settlements & curb cuts',
      pci: 52,
      status: 'Engineering Review'
    },
    {
      corridor: 'Buford Hwy (US-23) Norcross/Duluth',
      reports: 18,
      primaryHazard: 'Manhole perimeter drops & delamination',
      leadCause: 'Subgrade clay saturation from Yellow River basin',
      pci: 54,
      status: 'Scheduled Patching'
    },
    {
      corridor: 'Collins Hill Rd @ GGC Campus',
      reports: 15,
      primaryHazard: 'Right turn lane student traffic void',
      leadCause: 'Stop-and-go bus brake ripples',
      pci: 50,
      status: 'Work Order Active'
    },
    {
      corridor: 'SR 316 / University Pkwy Express',
      reports: 12,
      primaryHazard: 'High-speed wheel-path craters (65 MPH)',
      leadCause: 'Joint spalling under heavy commuter traffic',
      pci: 62,
      status: 'GDOT Inter-Agency'
    }
  ];

  // Recurring Pavement Failure Diagnostic Profiles
  const recurringDistressProfiles = [
    {
      title: 'Subgrade Piedmont Red Clay Expansion & Moisture Washout',
      location: 'Yellow River & Beaver Ruin Basins (Norcross / Duluth / Lilburn)',
      frequency: '34% of County Failures',
      description: 'Gwinnett County Piedmont clay expands significantly during seasonal heavy rain and contracts in summer droughts. This creates underground voids beneath the asphalt sub-base, leading to sudden roadway cave-ins without warning.',
      mitigation: 'Full-depth reclamation with cement-stabilized base (CSB) rather than temporary cold patch.'
    },
    {
      title: 'High-Frequency Commercial Heavy Freight Braking Shear',
      location: 'Pleasant Hill Rd, Satellite Blvd, Jimmy Carter Blvd',
      frequency: '28% of County Failures',
      description: 'Over 60,000 vehicles/day, with heavy tandem freight accessing regional logistics hubs. Severe deceleration forces at signalized intersections cause the top asphalt friction course to ripple and peel away.',
      mitigation: 'Superpave stone matrix asphalt (SMA) with polymer-modified binders.'
    },
    {
      title: 'Commercial Utility Trench Settlement & Joint Separation',
      location: 'Scenic Hwy (SR 124 Snellville) & Buford Hwy',
      frequency: '22% of County Failures',
      description: 'Dense commercial strip developments with frequent water, fiber optic, and electrical trench cuts. Inadequate backfill tamping causes longitudinal asphalt faulting along curb access cuts.',
      mitigation: 'County ordinance enforcement requiring controlled low-strength material (CLSM flowable fill).'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-white">Gwinnett County Pavement & Infrastructure Analytics</h2>
          <span className="bg-teal-950 text-teal-300 text-xs px-2.5 py-0.5 rounded-full border border-teal-800 font-semibold flex items-center gap-1">
            <BarChart3 className="w-3 h-3 text-teal-400" /> PCI & Cluster Telemetry
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          In-depth assessment of pavement distress clusters, structural PCI indexes, and recurring subgrade failure mechanisms across Gwinnett County.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Severe Road Hazards
          </span>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{severityCounts.severe}</div>
          <span className="text-[11px] text-rose-400 font-medium">Depth &gt; 4.0 inches</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" /> Avg Citizen Verifications
          </span>
          <div className="text-2xl font-bold text-teal-400 mt-1 font-mono">24.6</div>
          <span className="text-[11px] text-slate-400">Confirmations per report</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-blue-400" /> Mean Repair Turnaround
          </span>
          <div className="text-2xl font-bold text-white mt-1 font-mono">3.2 Days</div>
          <span className="text-[11px] text-emerald-400 font-medium">Target: &lt; 4.0 Days</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Lowest PCI Segment
          </span>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">48 / 100</div>
          <span className="text-[11px] text-slate-400">Pleasant Hill Rd Corridor</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PCI Condition Index by Corridor (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                Pavement Condition Index (PCI) by Major Corridor
              </h3>
              <p className="text-xs text-slate-400">Lower scores indicate severe pavement deterioration and immediate resurfacing need</p>
            </div>
            <span className="text-[11px] text-slate-400">Scale: 0 (Failed) to 100 (Good)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentPciData} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#cbd5e1" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-teal-400">PCI Score: {data.pci}/100 ({data.risk} Risk)</p>
                          <p className="text-slate-300">Potholes: {data.potholes} active</p>
                          <p className="text-slate-400">Traffic: {data.traffic.toLocaleString()} AADT</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pci" radius={[0, 6, 6, 0]}>
                  {segmentPciData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.pci < 55 ? '#ef4444' : entry.pci < 70 ? '#f59e0b' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Pie Chart (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Pothole Severity Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Breakdown across Gwinnett County</p>
            
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 border border-slate-700 p-2 rounded text-xs text-white">
                            <p className="font-semibold">{payload[0].name}: {payload[0].value} reports</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            {severityChartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-bold text-white font-mono">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Pothole Cluster Hotspots Ranking Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">High-Density Pothole Clusters & Corridors</h3>
            <p className="text-xs text-slate-400">Ranked by verified citizen incidents and structural pavement degradation</p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700">
            5 Critical Corridors Identified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Corridor & Municipality</th>
                <th className="py-2.5 px-3">Incident Count</th>
                <th className="py-2.5 px-3">Pavement Index (PCI)</th>
                <th className="py-2.5 px-3">Primary Vehicular Hazard</th>
                <th className="py-2.5 px-3">Engineering Distress Mechanism</th>
                <th className="py-2.5 px-3">County Action Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {clusters.map((cluster, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-semibold text-white">
                    {cluster.corridor}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-teal-400">
                    {cluster.reports} reports
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-mono font-bold ${
                      cluster.pci < 50 ? 'text-red-400' : cluster.pci < 60 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {cluster.pci} / 100
                    </span>
                  </td>
                  <td className="py-3 px-3 text-rose-300">
                    {cluster.primaryHazard}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {cluster.leadCause}
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-blue-950 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded text-[11px] font-medium">
                      {cluster.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Areas with Recurring Pavement Issues (Engineering Deep-Dive) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-bold text-white mb-1">
          Areas with Recurring Pavement Issues & Root Causes
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Detailed civil engineering diagnosis explaining why certain Gwinnett roads develop chronic potholes repeatedly
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recurringDistressProfiles.map((p, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                    {p.frequency}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug mb-1">{p.title}</h4>
                <p className="text-[11px] text-amber-300/90 font-medium mb-2">{p.location}</p>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{p.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-700/60 text-[11px]">
                <strong className="text-teal-300 block mb-0.5">Recommended Engineering Fix:</strong>
                <span className="text-slate-400">{p.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
