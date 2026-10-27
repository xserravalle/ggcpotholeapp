import React from 'react';
import { SectionHeader } from '../kit/SectionHeader';
import { EmptyState } from '../kit/EmptyState';
import { ListFilter } from 'lucide-react';

export const TriageWorkspaceView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      <SectionHeader
        title="Road Hazard Triage Queue"
        subtitle="Review, verify, and prioritize incoming citizen reports across municipal jurisdictions."
        badge="Admin Triage"
        badgeColor="bg-amber-950 text-amber-300 border-amber-800"
      />

      <div className="py-12">
        <EmptyState
          icon={ListFilter}
          title="Triage Queue & Duplicate Detector"
          description="The automated triage queue and AI duplicate detection workspace is coming in a later task."
        />
      </div>
    </div>
  );
};
