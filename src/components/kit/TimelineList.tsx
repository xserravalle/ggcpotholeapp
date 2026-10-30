import React from 'react';
import { TimelineEntry } from '../../domain/types';
import { StatusBadge } from './StatusBadge';
import { Clock, UserCheck, Shield, Wrench, CheckCircle2 } from 'lucide-react';

export interface TimelineListProps {
  timeline: TimelineEntry[];
  emptyMessage?: string;
  className?: string;
}

export const TimelineList: React.FC<TimelineListProps> = ({
  timeline,
  emptyMessage = 'No history recorded for this report.',
  className = '',
}) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className={`text-center py-6 text-slate-500 text-xs ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  const getActorIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-blue-400" />;
      case 'officer':
        return <Wrench className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className={`relative border-l border-slate-800 ml-3 space-y-4 my-2 ${className}`}>
      {timeline.map((entry, idx) => {
        const dateObj = new Date(entry.timestamp);
        const formattedDate = !Number.isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : entry.timestamp;

        return (
          <div key={entry.id || idx} className="relative pl-6 group">
            {/* Dot marker */}
            <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-teal-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs shadow-sm hover:border-slate-700 transition">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={entry.status} size="sm" />
                  <span className="text-[10px] font-mono text-slate-400">
                    {entry.action}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {formattedDate}
                </span>
              </div>

              {entry.message && (
                <p className="text-slate-300 text-xs mb-1.5 leading-relaxed">
                  {entry.message}
                </p>
              )}

              {(entry.actorName || entry.actorRole) && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  {getActorIcon(entry.actorRole)}
                  <span>{entry.actorName || 'System'}</span>
                  {entry.actorRole && (
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {entry.actorRole}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
