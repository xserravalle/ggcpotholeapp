import React from 'react';
import { LucideIcon } from 'lucide-react';

export type StatCardVariant =
  | 'default'
  | 'emerald'
  | 'blue'
  | 'rose'
  | 'amber'
  | 'purple'
  | 'cyan';

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  variant?: StatCardVariant;
  className?: string;
  onClick?: () => void;
}

const VARIANT_STYLES: Record<
  StatCardVariant,
  {
    border: string;
    bg: string;
    text: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  default: {
    border: 'border-slate-800',
    bg: 'bg-slate-900',
    text: 'text-white',
    iconBg: 'bg-slate-800',
    iconColor: 'text-slate-400',
  },
  emerald: {
    border: 'border-emerald-800/60',
    bg: 'bg-slate-900 bg-emerald-950/20',
    text: 'text-emerald-300',
    iconBg: 'bg-emerald-950',
    iconColor: 'text-emerald-400',
  },
  blue: {
    border: 'border-blue-800/60',
    bg: 'bg-slate-900 bg-blue-950/20',
    text: 'text-blue-300',
    iconBg: 'bg-blue-950',
    iconColor: 'text-blue-400',
  },
  rose: {
    border: 'border-rose-800/60',
    bg: 'bg-slate-900 bg-rose-950/20',
    text: 'text-rose-300',
    iconBg: 'bg-rose-950',
    iconColor: 'text-rose-400',
  },
  amber: {
    border: 'border-amber-800/60',
    bg: 'bg-slate-900 bg-amber-950/20',
    text: 'text-amber-300',
    iconBg: 'bg-amber-950',
    iconColor: 'text-amber-400',
  },
  purple: {
    border: 'border-purple-800/60',
    bg: 'bg-slate-900 bg-purple-950/20',
    text: 'text-purple-300',
    iconBg: 'bg-purple-950',
    iconColor: 'text-purple-400',
  },
  cyan: {
    border: 'border-cyan-800/60',
    bg: 'bg-slate-900 bg-cyan-950/20',
    text: 'text-cyan-300',
    iconBg: 'bg-cyan-950',
    iconColor: 'text-cyan-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  className = '',
  onClick,
}) => {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`border rounded-xl p-3 shadow-md transition ${styles.border} ${styles.bg} ${
        isClickable ? 'cursor-pointer hover:border-slate-600 active:scale-[0.98]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-slate-400 text-[11px] font-medium block truncate">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg} ${styles.iconColor}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <span
        className={`text-xl font-extrabold font-mono mt-1 block tracking-tight ${styles.text}`}
      >
        {value}
      </span>

      {subtext && (
        <span className="text-[10px] text-slate-500 block mt-0.5 truncate">
          {subtext}
        </span>
      )}
    </div>
  );
};
