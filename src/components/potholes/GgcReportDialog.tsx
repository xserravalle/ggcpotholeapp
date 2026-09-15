import React, { useState } from 'react';
import { PotholeReport } from '../../types/pothole';
import { buildGgcTextReport, downloadTextReport } from '../../services/textReportGenerator';
import { FileText, Download, Copy, Check, Send, X } from 'lucide-react';

interface GgcReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  potholes: PotholeReport[];
}

export const GgcReportDialog: React.FC<GgcReportDialogProps> = ({
  isOpen,
  onClose,
  potholes
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const reportText = buildGgcTextReport(potholes);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('GGC Area Pothole & Roadway Hazard Report');
    const body = encodeURIComponent(reportText);
    window.location.href = `mailto:facilities@ggc.edu?cc=dotcustomerservice@gwinnettcounty.com,511@dot.ga.gov&subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Georgia Gwinnett College Area Pothole Docket
              </h2>
              <p className="text-xs text-slate-400">
                Structured text inventory with exact mileage distances from campus center
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Container */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4">
          <pre className="font-mono text-xs text-slate-300 overflow-y-auto max-h-96 whitespace-pre-wrap leading-relaxed">
            {reportText}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            Covers {potholes.length} recorded hazard{potholes.length === 1 ? '' : 's'} across campus and Gwinnett
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={() => downloadTextReport(potholes)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch to GGC & GDOT</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
