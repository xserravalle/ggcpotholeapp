import React from 'react';
import { PotholeReport } from '../../domain/types';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { isOverdue } from '../../domain/sla';
import { MapPin, ThumbsUp, Calendar, AlertTriangle, Building2 } from 'lucide-react';

export interface ReportCardProps {
  report: PotholeReport;
  onClick?: () => void;
  isSelected?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onClick,
  isSelected = false,
  actions,
  className = '',
}) => {
  const overdue = isOverdue(report);
  const dateObj = new Date(report.reportedAt);
  const formattedDate = !Number.isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : report.reportedAt;

  const agencyName =
    report.jurisdiction || report.authorityName || report.assignedAgencyId || 'Gwinnett County';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`bg-slate-900 border rounded-2xl p-4 transition shadow-md ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
          : 'border-slate-800 hover:border-slate-700'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Top Header: Tracking code, Badges & Overdue Alert */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={report.status} size="sm" />
          <PriorityBadge
            priority={report.priority || 'medium'}
            score={report.priorityScore}
            size="sm"
          />
          {overdue && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase tracking-wider"
              title="Report resolution is past SLA due date"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Overdue</span>
            </span>
          )}
        </div>

        <span className="text-[11px] font-mono font-bold text-teal-400">
          {report.trackingCode || `#${report.id.slice(-6)}`}
        </span>
      </div>

      {/* Main Title & Road */}
      <div className="mb-2.5">
        <h4 className="text-sm font-bold text-white tracking-tight truncate">
          {report.title}
        </h4>
        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{report.roadName || report.address}</span>
        </div>
      </div>

      {/* Agency & Metadata Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-1 text-slate-400 truncate">
          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{agencyName}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3 text-slate-400" />
            <span className="font-mono">{report.verificationsCount || 0}</span>
          </span>

          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{formattedDate}</span>
          </span>
        </div>
      </div>

      {actions && <div className="mt-3 pt-2.5 border-t border-slate-800">{actions}</div>}
    </div>
  );
};
