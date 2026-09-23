import React, { useState, useEffect } from 'react';
import { PotholeReport, SeverityLevel } from '../../types/pothole';
import { 
  X, 
  Save, 
  Trash2, 
  MapPin, 
  Camera, 
  AlertTriangle, 
  Building2, 
  Calendar,
  Layers,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface EditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PotholeReport | null;
  onSaveReport: (updatedReport: PotholeReport) => void;
  onDeleteReport: (id: string) => void;
}

export const EditReportModal: React.FC<EditReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onSaveReport,
  onDeleteReport
}) => {
  const [title, setTitle] = useState(report?.title || '');
  const [description, setDescription] = useState(report?.description || '');
  const [landmark, setLandmark] = useState(report?.landmark || '');
  const [severity, setSeverity] = useState<SeverityLevel>(report?.severity || 'moderate');
  const [surfaceType, setSurfaceType] = useState<'Asphalt' | 'Concrete' | 'Composite'>(report?.surfaceType || 'Asphalt');
  const [estimatedDepthInches, setEstimatedDepthInches] = useState(report?.estimatedDepthInches || 3.0);
  const [estimatedWidthInches, setEstimatedWidthInches] = useState(report?.estimatedWidthInches || 18);
  const [photoPreview, setPhotoPreview] = useState<string | null>(report?.imageUrl || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync with prop when selected report changes
  useEffect(() => {
    if (report) {
      setTitle(report.title);
      setDescription(report.description);
      setLandmark(report.landmark || '');
      setSeverity(report.severity);
      setSurfaceType(report.surfaceType || 'Asphalt');
      setEstimatedDepthInches(report.estimatedDepthInches || 3.0);
      setEstimatedWidthInches(report.estimatedWidthInches || 18);
      setPhotoPreview(report.imageUrl || null);
      setShowDeleteConfirm(false);
    }
  }, [report]);

  if (!isOpen || !report) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PotholeReport = {
      ...report,
      title: title.trim() || report.title,
      description: description.trim(),
      landmark: landmark.trim() || undefined,
      severity,
      surfaceType,
      estimatedDepthInches,
      estimatedWidthInches,
      imageUrl: photoPreview || report.imageUrl,
      lastVerifiedAt: new Date().toISOString()
    };
    onSaveReport(updated);
    onClose();
  };

  const handleDelete = () => {
    onDeleteReport(report.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950 border border-teal-800/80 px-2 py-0.5 rounded-md">
                {report.trackingCode || report.id}
              </span>
              <span className="text-xs text-slate-400 capitalize bg-slate-800 px-2 py-0.5 rounded-md">
                Status: <span className="text-white font-semibold">{report.status}</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1.5">
              Review & Edit Report
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{report.address || `${report.roadName}, ${report.city}`}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          
          {/* Telemetry banner if auto-detected */}
          {report.sensorDetected && (
            <div className="bg-slate-950 border border-emerald-900/60 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
                  <Activity className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-bold text-white block">Auto-Logged Telemetry</span>
                  <span className="text-[11px] text-slate-400">
                    Peak shock: <strong className="text-emerald-300">{report.bumpIntensity}G</strong> • {report.verificationsCount} verified strikes
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                {report.jurisdiction}
              </span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Report Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
              placeholder="e.g. Deep Pothole on Collins Hill Rd"
              required
            />
          </div>

          {/* Severity & Surface Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
              >
                <option value="minor">Minor (&lt; 2" deep)</option>
                <option value="moderate">Moderate (2" – 4")</option>
                <option value="severe">Severe (4" – 6")</option>
                <option value="critical">Critical Axle Risk (&gt; 6")</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Pavement Surface
              </label>
              <select
                value={surfaceType}
                onChange={(e) => setSurfaceType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs"
              >
                <option value="Asphalt">Asphalt</option>
                <option value="Concrete">Concrete</option>
                <option value="Composite">Composite</option>
              </select>
            </div>
          </div>

          {/* Estimated Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Estimated Depth (inches)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={estimatedDepthInches}
                onChange={(e) => setEstimatedDepthInches(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Estimated Width (inches)
              </label>
              <input
                type="number"
                step="1"
                min="2"
                max="120"
                value={estimatedWidthInches}
                onChange={(e) => setEstimatedWidthInches(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-teal-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* Landmark */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Landmark / Cross Street (Optional)
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs"
              placeholder="e.g. In right lane near GGC entrance gate, in front of Student Center"
            />
          </div>

          {/* Description & Driver Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Driver Notes / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-xs leading-relaxed"
              placeholder="Provide any additional context for road maintenance crews..."
            />
          </div>

          {/* Photo Attachment */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Hazard Photo
            </label>
            <div className="flex items-center gap-3">
              {photoPreview ? (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                  <img src={photoPreview} alt="Hazard preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 hover:bg-rose-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-xl border border-dashed border-slate-700 hover:border-teal-500 bg-slate-950 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-teal-400 transition shrink-0">
                  <Camera className="w-5 h-5 mb-1" />
                  <span className="text-[10px]">Add Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
              <div className="text-[11px] text-slate-400">
                <span className="block font-medium text-slate-300">Attach or update site photo</span>
                <span>Optional photo for public works dispatchers to confirm road surface breakdown.</span>
              </div>
            </div>
          </div>

          {/* Delete confirmation alert if triggered */}
          {showDeleteConfirm && (
            <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-3.5 text-xs text-rose-200 space-y-2 animate-in fade-in">
              <span className="font-bold block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Are you sure you want to delete this report?
              </span>
              <p className="text-[11px] text-rose-300/80">
                This will remove the hazard from your reports list and from the active community map.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition"
                >
                  Yes, Delete Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto px-3.5 py-2 bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 hover:border-rose-800 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Report</span>
              </button>
            ) : <div />}

            <div className="w-full sm:w-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 sm:w-auto px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
