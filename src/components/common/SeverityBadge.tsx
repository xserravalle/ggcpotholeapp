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

  const badgeClass = isHigh ? 'severity-badge-high' : isMod ? 'severity-badge-med' : 'severity-badge-low';

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono tracking-wider border uppercase transition-colors ${badgeClass} ${className}`}
    >
      {showSymbol && <span className="text-[11px]" aria-hidden="true">{info.symbol}</span>}
      <span>{info.label}</span>
    </span>
  );
};
