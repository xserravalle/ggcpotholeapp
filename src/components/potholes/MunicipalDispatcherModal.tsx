import React, { useState } from 'react';
import { PotholeReport, Jurisdiction } from '../../types/pothole';
import { MUNICIPAL_CONTACTS } from '../../data/jurisdictionsData';
import { 
  Building2, 
  Send, 
  Copy, 
  Check, 
  Phone, 
  ExternalLink, 
  Mail, 
  FileText, 
  ShieldCheck, 
  Clock, 
  X,
  AlertCircle
} from 'lucide-react';

interface MunicipalDispatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  pothole: PotholeReport | null;
  allPotholes: PotholeReport[];
  onSelectPothole: (p: PotholeReport) => void;
  onUpdateStatus: (id: string, newStatus: PotholeReport['status']) => void;
}

// Hooks must run in the same order on every render, so the open check lives in this
// wrapper. The dialog mounts fresh each time it opens, exactly as before.
export const MunicipalDispatcherModal: React.FC<MunicipalDispatcherModalProps> = (props) =>
  props.isOpen ? <MunicipalDispatcherDialogBody {...props} /> : null;

const MunicipalDispatcherDialogBody: React.FC<MunicipalDispatcherModalProps> = ({
  onClose,
  pothole,
  allPotholes,
  onSelectPothole,
  onUpdateStatus
}) => {

  // Selected or active pothole
  const activePothole = pothole || allPotholes[0];
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction>(
    activePothole?.jurisdiction || 'Gwinnett County DOT'
  );
  const [ticketStatus, setTicketStatus] = useState<PotholeReport['status']>(
    activePothole?.status || 'reported'
  );

  const contact = MUNICIPAL_CONTACTS[selectedJurisdiction] || MUNICIPAL_CONTACTS['Gwinnett County DOT'];

  // Work order ticket text
  const workOrderText = `=======================================================
GWINNETT COUNTY CIVIC INFRASTRUCTURE DISPATCH WORK ORDER
=======================================================
TICKET ID:          ${activePothole?.workOrderNumber || `GW-DISP-${activePothole?.id || 'NEW'}`}
MUNICIPAL TARGET:   ${contact.jurisdiction}
DEPARTMENT:         ${contact.department}
DISPATCH HOTLINE:   ${contact.potholeHotline}
DATE GENERATED:     ${new Date().toLocaleString()}

LOCATION DETAILS:
- Address:          ${activePothole?.address || 'N/A'}
- Primary Road:     ${activePothole?.roadName || 'N/A'}
- City:             ${activePothole?.city || 'N/A'}, GA
- GPS Coordinates:  ${activePothole?.latitude?.toFixed(5)}, ${activePothole?.longitude?.toFixed(5)}

PAVEMENT DEFECT SPECIFICATIONS:
- Severity Level:   ${activePothole?.severity?.toUpperCase()}
- Physical Cavity:  ${activePothole?.estimatedDepthInches} in. Depth x ${activePothole?.estimatedWidthInches} in. Diameter
- Pavement Surface: ${activePothole?.surfaceType}
- Vehicular Hazard: ${activePothole?.damageRisk}
- Citizen Upvotes:  ${activePothole?.verificationsCount} Confirmed Community Encounters
- Detection Provenance: ${activePothole?.detectedBy}

NARRATIVE / DRIVER HAZARD:
${activePothole?.description}

ROUTING PROTOCOL:
Dispatched via Gwinnett County TranspSight Intelligent Insight System.
Complies with Georgia DOT Title 32 Municipal Street Repair Protocols.
=======================================================`;

  // SeeClickFix / CRM JSON Payload
  const crmJson = JSON.stringify({
    source: "Gwinnett_TranspSight_v2",
    ticket_id: activePothole?.workOrderNumber || `GW-${activePothole?.id}`,
    agency: contact.jurisdiction,
    coordinates: {
      lat: activePothole?.latitude,
      lng: activePothole?.longitude
    },
    address: activePothole?.address,
    city: activePothole?.city,
    severity: activePothole?.severity,
    depth_inches: activePothole?.estimatedDepthInches,
    width_inches: activePothole?.estimatedWidthInches,
    community_confirmations: activePothole?.verificationsCount,
    description: activePothole?.description,
    risk_category: activePothole?.damageRisk,
    timestamp: new Date().toISOString()
  }, null, 2);

  // Copy helper
  const handleCopy = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Mailto link generator
  const emailSubject = encodeURIComponent(`URGENT ROAD HAZARD: Pothole Work Order on ${activePothole?.roadName} (${activePothole?.severity?.toUpperCase()})`);
  const emailBody = encodeURIComponent(workOrderText);
  const mailtoLink = `mailto:${contact.email}?subject=${emailSubject}&body=${emailBody}`;

  const handleStatusChange = (newStatus: PotholeReport['status']) => {
    setTicketStatus(newStatus);
    if (activePothole) {
      onUpdateStatus(activePothole.id, newStatus);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Municipal Dispatcher & Structured Work Order Router
              </h2>
              <p className="text-xs text-slate-400">
                Direct municipal interface for Gwinnett County DOT and 6 constituent cities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Jurisdiction Selector Tabs */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Target Municipal Jurisdiction (Gwinnett County + 6 Cities):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.keys(MUNICIPAL_CONTACTS).map((jurKey) => (
              <button
                key={jurKey}
                type="button"
                onClick={() => setSelectedJurisdiction(jurKey as Jurisdiction)}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition border ${
                  selectedJurisdiction === jurKey
                    ? 'bg-blue-600/30 text-blue-200 border-blue-500 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="font-bold truncate">{jurKey}</div>
                <div className="text-[10px] text-slate-400 truncate">
                  {MUNICIPAL_CONTACTS[jurKey as Jurisdiction].dispatchLeadTime}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Agency Contact Details Banner */}
        <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 mb-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Department</span>
            <span className="text-white font-semibold block mt-0.5">{contact.department}</span>
            <span className="text-teal-400 text-[11px] mt-1 block">Lead Time: {contact.dispatchLeadTime}</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Direct Contacts</span>
            <div className="mt-1 space-y-1">
              <a href={`tel:${contact.potholeHotline}`} className="text-blue-300 hover:text-blue-200 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Hotline: {contact.potholeHotline}
              </a>
              <a href={`mailto:${contact.email}`} className="text-slate-300 hover:text-white flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {contact.email}
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 block font-medium">Citizen Portal</span>
            <a 
              href={contact.portalUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition"
            >
              <span>Launch Official Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-[10px] text-slate-400 mt-1">
              {contact.activeWorkOrders} active tickets in queue
            </span>
          </div>
        </div>

        {/* Pothole Picker if user wants to change which pothole to dispatch */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select Pothole Incident to Dispatch:
          </label>
          <select
            value={activePothole?.id}
            onChange={(e) => {
              const found = allPotholes.find(p => p.id === e.target.value);
              if (found) {
                onSelectPothole(found);
                setSelectedJurisdiction(found.jurisdiction);
                setTicketStatus(found.status);
              }
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {allPotholes.map(p => (
              <option key={p.id} value={p.id}>
                [{p.severity.toUpperCase()}] {p.title} - {p.roadName} ({p.city}) - {p.verificationsCount} confirms
              </option>
            ))}
          </select>
        </div>

        {/* Ticket Generation View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5 text-xs">
          
          {/* Printable Ticket Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col h-72">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="font-mono text-slate-300 font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" /> Formatted Work Order
              </span>
              <button
                onClick={() => handleCopy(workOrderText, 'ticket')}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 transition"
              >
                {copiedFormat === 'ticket' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFormat === 'ticket' ? 'Copied!' : 'Copy Ticket'}</span>
              </button>
            </div>
            <pre className="font-mono text-[11px] text-slate-300 overflow-y-auto flex-1 leading-relaxed whitespace-pre-wrap">
              {workOrderText}
            </pre>
          </div>

          {/* CRM / API Payload Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col h-72">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="font-mono text-slate-300 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> SeeClickFix / Cityworks Payload (JSON)
              </span>
              <button
                onClick={() => handleCopy(crmJson, 'json')}
                className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 bg-slate-900 px-2 py-1 rounded border border-slate-800 transition"
              >
                {copiedFormat === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedFormat === 'json' ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="font-mono text-[11px] text-teal-300/90 overflow-y-auto flex-1 leading-relaxed whitespace-pre-wrap">
              {crmJson}
            </pre>
          </div>

        </div>

        {/* Status Lifecycle Updater */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-slate-200 block">Municipal Work Order Lifecycle:</span>
            <span className="text-slate-400 text-[11px]">Update the live status of this infrastructure repair in the central GIS</span>
          </div>
          <div className="flex items-center gap-1.5">
            {(['reported', 'investigating', 'scheduled', 'repaired'] as PotholeReport['status'][]).map(st => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  ticketStatus === st
                    ? st === 'repaired'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Sends verified GPS and citizen damage reports directly to municipal public works inbox</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition"
            >
              Close
            </button>
            <a
              href={mailtoLink}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch Pre-Filled Direct Email to {selectedJurisdiction}</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
