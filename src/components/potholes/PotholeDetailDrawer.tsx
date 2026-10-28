import React, { useState, useEffect, useCallback } from 'react';
import { PotholeReport } from '../../types/pothole';
import { Comment, Actor, UserRole } from '../../domain/types';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../kit/StatusBadge';
import { PriorityBadge } from '../kit/PriorityBadge';
import { TimelineList } from '../kit/TimelineList';
import { canTransition } from '../../domain/status';
import { isOverdue } from '../../domain/sla';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { 
  MapPin, 
  ThumbsUp, 
  ShieldAlert, 
  Activity, 
  Building2, 
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  FileDown,
  RefreshCw,
  Send,
  Calendar,
  AlertTriangle,
  Star,
  RotateCcw,
  MessageSquare,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface PotholeDetailDrawerProps {
  pothole: PotholeReport | null;
  onClose: () => void;
  onVerify: (id: string) => void;
  onOpenDispatcher?: (pothole: PotholeReport) => void;
  isAdmin?: boolean;
}

export const PotholeDetailDrawer: React.FC<PotholeDetailDrawerProps> = ({
  pothole,
  onClose,
  onVerify,
  onOpenDispatcher,
  isAdmin = false
}) => {
  const { speakPothole, stopSpeaking, isSpeaking } = useAccessibility();
  const { user } = useAuth();
  const { getComments, addComment, dispatchAction, confirmReport } = useReports();

  const [localReport, setLocalReport] = useState<PotholeReport | null>(pothole);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Closing the loop: Rating state
  const [starRating, setStarRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Closing the loop: Reopen state
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [reopenError, setReopenError] = useState<string>('');
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);

  // Sync prop changes to localReport
  useEffect(() => {
    setLocalReport(pothole);
  }, [pothole]);

  const activeReport = localReport || pothole;

  // Load comments
  const loadComments = useCallback(async () => {
    if (!activeReport?.id) return;
    try {
      const list = await getComments(activeReport.id);
      setComments(list);
    } catch (e) {
      console.error('Failed to load comments', e);
    }
  }, [activeReport?.id, getComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  if (!activeReport) return null;

  const overdue = isOverdue(activeReport);
  const hasValidImage = Boolean(activeReport.imageUrl && activeReport.imageUrl.trim() !== '');

  // Calculate measured or estimated shock telemetry
  const shockValue = 
    activeReport.bumpIntensity && activeReport.bumpIntensity > 0
      ? activeReport.bumpIntensity
      : activeReport.sensorEvidence?.maxGForce
      ? activeReport.sensorEvidence.maxGForce
      : activeReport.severity === 'critical'
      ? 7.80
      : activeReport.severity === 'severe'
      ? 5.40
      : activeReport.severity === 'moderate'
      ? 3.80
      : 1.80;

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generatePotholePdf(activeReport);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleConfirmClick = async () => {
    try {
      const actor: Actor = {
        name: user.displayName || 'Citizen Commuter',
        email: user.email,
        role: (user.role as any) || 'user',
      };
      const updated = await confirmReport(activeReport.id, actor);
      setLocalReport(updated);
      onVerify(activeReport.id);
    } catch {
      onVerify(activeReport.id);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCommentText.trim();
    if (!trimmed || trimmed.length > 1000) return;

    setIsSubmittingComment(true);
    try {
      await addComment(activeReport.id, trimmed, {
        name: user.displayName || 'Citizen Commuter',
        role: (user.role as UserRole) || 'user',
      });
      setNewCommentText('');
      await loadComments();
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleRateFix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (starRating < 1 || starRating > 5) return;

    setIsSubmittingRating(true);
    try {
      const actor: Actor = {
        name: user.displayName || 'Citizen Commuter',
        email: user.email,
        role: (user.role as any) || 'user',
      };
      const result = await dispatchAction(activeReport.id, 'rateFix', actor, {
        rating: starRating,
        comment: ratingComment.trim() || undefined,
      });
      setLocalReport(result.report);
    } catch (err: any) {
      console.error('Failed to rate fix', err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const canReopen = canTransition(activeReport.status, 'verified', {
    resolvedAt: activeReport.resolvedAt,
  });

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reopenReason.trim();
    if (!trimmed) {
      setReopenError('A short reason is required to reopen this ticket.');
      return;
    }

    setIsSubmittingReopen(true);
    setReopenError('');
    try {
      const actor: Actor = {
        name: user.displayName || 'Citizen Commuter',
        email: user.email,
        role: (user.role as any) || 'user',
      };
      const result = await dispatchAction(activeReport.id, 'reopen', actor, {
        message: trimmed,
      });
      setLocalReport(result.report);
      setShowReopenForm(false);
      setReopenReason('');
    } catch (err: any) {
      setReopenError(err?.message || 'Failed to reopen report.');
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  const agencyName =
    activeReport.jurisdiction || activeReport.authorityName || activeReport.assignedAgencyId || 'Gwinnett County DOT';

  const targetDateDisplay =
    activeReport.targetRepairDate ||
    (activeReport.slaDueAt
      ? new Date(activeReport.slaDueAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Standard SLA');

  return (
    <div
      role="dialog"
      aria-label="Report Details"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md overflow-y-auto flex flex-col animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-20 shadow-md">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <StatusBadge status={activeReport.status} size="md" />
          <PriorityBadge
            priority={activeReport.priority || 'medium'}
            score={activeReport.priorityScore}
            size="md"
          />
          <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 border border-teal-800/80 px-2 py-0.5 rounded-lg">
            {activeReport.trackingCode || `#${activeReport.id}`}
          </span>
          {overdue && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase tracking-wider"
              title="Report resolution is past SLA due date"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Overdue</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio Narration */}
          <button
            onClick={() => (isSpeaking ? stopSpeaking() : speakPothole(activeReport))}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700'
            }`}
            title="Narrate hazard overview"
          >
            {isSpeaking ? (
              <VolumeX className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>

          {/* PDF Docket Download */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 flex items-center gap-1 transition disabled:opacity-60 cursor-pointer"
            title="Download PDF Claim Docket"
          >
            {isDownloadingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </button>

          {/* Close Full Screen Panel */}
          <button
            onClick={onClose}
            aria-label="Close details"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition border border-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1 text-slate-200">
        
        {/* Title, Road, and Coordinates */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 inline-flex items-center gap-1">
              📍 {activeReport.landmark || activeReport.roadName || 'Gwinnett County Corridor'}
            </span>

            <a
              href={`https://www.google.com/maps?q=${activeReport.latitude},${activeReport.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {activeReport.title}
          </h2>

          <div className="flex items-start space-x-2 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">
                {activeReport.roadName} {activeReport.landmark ? `(near ${activeReport.landmark})` : ''}
              </p>
              <p className="text-slate-400 text-xs">
                {activeReport.address} &bull; {activeReport.city || 'Lawrenceville'}, Gwinnett County
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                GPS: {activeReport.latitude.toFixed(5)}, {activeReport.longitude.toFixed(5)}
                {activeReport.distanceFromGgcMiles !== undefined &&
                  ` (${activeReport.distanceFromGgcMiles.toFixed(2)} mi from campus)`}
              </p>
            </div>
          </div>

          {activeReport.description && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 leading-relaxed">
              {activeReport.description}
            </div>
          )}
        </div>

        {/* Media Row: Photo Preview / Snapshot & Small Leaflet Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Photo / Snapshot */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">
              Pavement Photo / Snapshot
            </span>
            {hasValidImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video group">
                <img
                  src={activeReport.imageUrl}
                  alt={activeReport.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur px-2.5 py-0.5 rounded-lg text-[10px] text-slate-200 border border-slate-700">
                  Verified Road Capture
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 aspect-video flex flex-col items-center justify-center p-4 text-center text-slate-500">
                <MapPin className="w-8 h-8 text-slate-600 mb-2" />
                <span className="text-xs font-semibold text-slate-400">Map GPS Pin Telemetry</span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Reported at {activeReport.latitude.toFixed(4)}, {activeReport.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>

          {/* Small Interactive Map */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col">
            <span className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">
              Geographic Location
            </span>
            <div className="h-52 sm:h-full min-h-[180px] w-full rounded-2xl overflow-hidden border border-slate-800 relative z-0">
              <MapContainer
                key={`${activeReport.id}-${activeReport.latitude}-${activeReport.longitude}`}
                center={[activeReport.latitude, activeReport.longitude]}
                zoom={16}
                scrollWheelZoom={false}
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[activeReport.latitude, activeReport.longitude]} />
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Agency, Target Date & Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Agency */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Assigned Agency</span>
            </div>
            <p className="text-sm font-bold text-white mt-1 truncate">
              {agencyName}
            </p>
            {activeReport.assignedCrew && (
              <p className="text-xs text-slate-400 mt-0.5">
                Crew: {activeReport.assignedCrew}
              </p>
            )}
          </div>

          {/* Target Date & SLA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <div className="flex items-center space-x-2 text-slate-400 text-xs font-medium">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Target Completion</span>
            </div>
            <p className="text-sm font-bold text-emerald-400 mt-1">
              {targetDateDisplay}
            </p>
            {overdue && (
              <p className="text-xs text-rose-400 font-bold mt-0.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Past resolution target
              </p>
            )}
          </div>

          {/* Confirmations (+1) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> Confirmations
              </span>
              <span className="text-lg font-black font-mono text-emerald-300 mt-0.5 block">
                {activeReport.verificationsCount || 0}
              </span>
            </div>
            <button
              onClick={handleConfirmClick}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>+1 Confirm</span>
            </button>
          </div>
        </div>

        {/* Physical Metrics Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Depth</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {activeReport.estimatedDepthInches}"
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Width</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {activeReport.estimatedWidthInches}"
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Material</span>
            <span className="text-sm font-bold text-white mt-0.5 block truncate">
              {activeReport.surfaceType || 'Asphalt'}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" /> Shock
            </span>
            <span
              className={`text-sm font-bold font-mono mt-0.5 block ${
                shockValue >= 6.0
                  ? 'text-rose-400'
                  : shockValue >= 3.0
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {shockValue.toFixed(1)}G
            </span>
          </div>
        </div>

        {/* Sensor Evidence Section if applicable */}
        {activeReport.sensorEvidence && (
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 text-xs">
            <h3 className="font-bold text-emerald-300 flex items-center gap-1.5 mb-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Sensor Telemetry Verification
            </h3>
            <p className="text-slate-300">
              Auto-promoted after in-vehicle accelerometer registered {activeReport.sensorEvidence.hitCount} repeated road strikes with peak shock of {activeReport.sensorEvidence.maxGForce.toFixed(2)}G.
            </p>
          </div>
        )}

        {/* CLOSING THE LOOP: Rate this Fix or Reopen */}
        {(activeReport.status === 'resolved' || activeReport.status === 'closed') && (
          <div className="bg-slate-900 border border-emerald-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                Closing the Loop: Resolution & Feedback
              </h3>
            </div>

            {/* If resolved: allow Rating */}
            {activeReport.status === 'resolved' && (
              <form onSubmit={handleRateFix} className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                  Rate this Fix (1–5 Stars)
                </span>
                <p className="text-xs text-slate-300">
                  Municipal road crews have restored this roadway segment. Rate the quality of the asphalt patching:
                </p>

                {/* Interactive Star Picker */}
                <div className="flex items-center space-x-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      aria-label={`${star} star`}
                      className="p-1 transition hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= starRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold font-mono text-amber-300 ml-2">
                    {starRating} / 5 Stars
                  </span>
                </div>

                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Optional feedback: Was the patch leveled smoothly? Any loose gravel?"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none"
                />

                <button
                  type="submit"
                  disabled={isSubmittingRating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Rating & Close</span>
                </button>
              </form>
            )}

            {/* If closed and feedback exists */}
            {activeReport.status === 'closed' && activeReport.feedback && (
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Citizen Repair Review Submitted
                </span>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= (activeReport.feedback?.rating || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-mono font-bold text-amber-300 ml-1.5">
                    {activeReport.feedback.rating}/5
                  </span>
                </div>
                {activeReport.feedback.comment && (
                  <p className="text-xs text-slate-300 italic mt-1">
                    "{activeReport.feedback.comment}"
                  </p>
                )}
              </div>
            )}

            {/* Reopening Section: Still broken? */}
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Still Broken or Incomplete?</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Reopening is permitted within 14 days of repair resolution.
                  </p>
                </div>

                {canReopen ? (
                  <button
                    type="button"
                    onClick={() => setShowReopenForm(!showReopenForm)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-200 border border-slate-700 hover:border-rose-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-rose-400" />
                    <span>{showReopenForm ? 'Cancel' : 'Still Broken? Reopen'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 font-mono italic">
                    14-day reopen window expired
                  </span>
                )}
              </div>

              {/* Inline Reopen Form */}
              {showReopenForm && canReopen && (
                <form
                  onSubmit={handleReopenSubmit}
                  className="mt-3 bg-rose-950/20 border border-rose-800/40 rounded-2xl p-3.5 space-y-2 animate-in fade-in"
                >
                  <label className="text-xs font-semibold text-rose-300 block">
                    Reason for Reopening (Required):
                  </label>
                  <textarea
                    value={reopenReason}
                    onChange={(e) => {
                      setReopenReason(e.target.value);
                      if (reopenError) setReopenError('');
                    }}
                    placeholder="Describe why this repair is still broken (e.g. cavity sinking, water pooling, unlevel asphalt)..."
                    rows={2}
                    className="w-full bg-slate-950 border border-rose-800/60 focus:border-rose-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none resize-none"
                  />

                  {reopenError && (
                    <div className="text-xs text-rose-400 font-medium">
                      {reopenError}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingReopen}
                      className="px-4 py-1.5 bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
                    >
                      Confirm & Reopen Work Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReopenForm(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Full Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Incident & Repair Timeline
            </h3>
          </div>
          <TimelineList timeline={activeReport.timeline || []} />
        </div>

        {/* Comment Thread (Citizen / Admin / Officer) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Civic Discussion & Work Notes
              </h3>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {comments.length} Comments
            </span>
          </div>

          {/* Comment List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center italic">
                No comments yet. Share updates, notes for road crews, or repair observations below.
              </p>
            ) : (
              comments.map((c) => {
                const roleBadgeClass =
                  c.authorRole === 'admin'
                    ? 'bg-blue-950 text-blue-300 border-blue-800'
                    : c.authorRole === 'officer'
                    ? 'bg-purple-950 text-purple-300 border-purple-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800';

                return (
                  <div
                    key={c.id}
                    className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">
                          {c.authorName}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded-full border ${roleBadgeClass}`}
                        >
                          {c.authorRole}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(c.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {c.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-800 space-y-2">
            <div className="relative">
              <textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Post a civic update or question for road crews (max 1000 characters)..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none"
              />
              <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-500">
                {newCommentText.length} / 1000
              </span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment || !newCommentText.trim() || newCommentText.length > 1000}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </button>
            </div>
          </form>
        </div>

        {/* Admin Dispatcher Button if applicable */}
        {isAdmin && onOpenDispatcher && (
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => onOpenDispatcher(activeReport)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Admin: Dispatch Structured Work Order</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
