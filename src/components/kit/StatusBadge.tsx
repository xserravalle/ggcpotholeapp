import React from 'react';
import { ReportStatus, REPORT_STATUS_COLORS, REPORT_STATUS_LABELS } from '../../domain/status';

export interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const config = REPORT_STATUS_COLORS[status] || {
    label: status,
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    text: 'text-slate-300',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
    dot: 'bg-slate-400',
  };

  const label = REPORT_STATUS_LABELS[status] || status;

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold font-mono uppercase tracking-wider rounded-full border shadow-sm ${config.badge} ${sizeStyles} ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 animate-pulse ${config.dot} ${dotSizes}`}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
};
