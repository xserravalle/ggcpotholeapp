import React from 'react';
import { SectionHeader } from '../kit/SectionHeader';
import { EmptyState } from '../kit/EmptyState';
import { Activity } from 'lucide-react';

export const PerformanceWorkspaceView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      <SectionHeader
        title="Agency Performance & SLA Dashboard"
        subtitle="Track municipal response times, SLA adherence, and crew resolution benchmarks."
        badge="Performance & SLA"
        badgeColor="bg-cyan-950 text-cyan-300 border-cyan-800"
      />

      <div className="py-12">
        <EmptyState
          icon={Activity}
          title="Performance & SLA Analytics"
          description="Agency performance metrics and SLA compliance tracking workspace is coming in a later task."
        />
      </div>
    </div>
  );
};
