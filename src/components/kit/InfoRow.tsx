import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  subValue?: React.ReactNode;
  className?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  icon: Icon,
  subValue,
  className = '',
}) => {
  return (
    <div
      className={`flex items-start justify-between py-2 border-b border-slate-800/60 last:border-b-0 text-xs gap-3 ${className}`}
    >
      <div className="flex items-center gap-2 text-slate-400 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
        <span className="font-medium">{label}</span>
      </div>

      <div className="text-right">
        <div className="text-slate-200 font-semibold">{value}</div>
        {subValue && (
          <div className="text-[10px] text-slate-500 mt-0.5">{subValue}</div>
        )}
      </div>
    </div>
  );
};
