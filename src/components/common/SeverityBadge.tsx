import React from 'react';
import { SeverityLevel } from '../../types/pothole';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  className?: string;
  showSymbol?: boolean;
}

export const SEVERITY_DUAL_CODE: Record<SeverityLevel, { symbol: string; label: string }> = {
  critical: { symbol: '▲', label: 'Critical' },
  severe: { symbol: '▲', label: 'Severe' },
  moderate: { symbol: '◆', label: 'Moderate' },
  minor: { symbol: '●', label: 'Minor' }
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ 
  severity, 
  className = '',
  showSymbol = true 
}) => {
  const info = SEVERITY_DUAL_CODE[severity] || { symbol: '◆', label: severity };
  const isHigh = severity === 'critical' || severity === 'severe';
  const isMod = severity === 'moderate';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono tracking-wider border uppercase transition-colors ${
        isHigh
          ? 'bg-[var(--sev-high-bg,#450a0a)] text-[var(--sev-high-text,#fca5a5)] border-[var(--sev-high-border,#b91c1c)]'
          : isMod
          ? 'bg-[var(--sev-med-bg,#451a03)] text-[var(--sev-med-text,#fde047)] border-[var(--sev-med-border,#d97706)]'
          : 'bg-[var(--sev-low-bg,#064e3b)] text-[var(--sev-low-text,#6ee7b7)] border-[var(--sev-low-border,#059669)]'
      } ${className}`}
    >
      {showSymbol && <span className="text-[11px]" aria-hidden="true">{info.symbol}</span>}
      <span>{info.label}</span>
    </span>
  );
};
