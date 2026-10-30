import React from 'react';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = 'bg-blue-950 text-blue-300 border-blue-800',
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 ${className}`}
    >
      <div>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          {badge && (
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
};
