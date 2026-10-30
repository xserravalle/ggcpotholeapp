import React from 'react';
import { ReportPriority } from '../../domain/types';

export interface PriorityBadgeProps {
  priority: ReportPriority | string;
  score?: number;
  size?: 'sm' | 'md';
  className?: string;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: {
    bg: 'bg-rose-950/80',
    text: 'text-rose-300',
    border: 'border-rose-800',
  },
  high: {
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-800',
  },
  medium: {
    bg: 'bg-yellow-950/80',
    text: 'text-yellow-300',
    border: 'border-yellow-800',
  },
  low: {
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    border: 'border-emerald-800',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  score,
  size = 'md',
  className = '',
}) => {
  const norm = (priority || 'medium').toLowerCase();
  const style = PRIORITY_STYLES[norm] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold font-mono uppercase tracking-wider rounded-md border ${style.bg} ${style.text} ${style.border} ${sizeStyles} ${className}`}
    >
      <span>{norm}</span>
      {typeof score === 'number' && (
        <span className="opacity-75 font-normal text-[10px]">
          ({score} pts)
        </span>
      )}
    </span>
  );
};
