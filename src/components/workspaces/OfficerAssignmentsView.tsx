import React from 'react';
import { PotholeReport } from '../../domain/types';
import { useAuth } from '../../context/AuthContext';
import { isAssignedOfficer } from '../../domain/permissions';
import { SectionHeader } from '../kit/SectionHeader';
import { EmptyState } from '../kit/EmptyState';
import { ReportCard } from '../kit/ReportCard';
import { Wrench } from 'lucide-react';

export interface OfficerAssignmentsViewProps {
  potholes?: PotholeReport[];
  onSelectPothole?: (report: PotholeReport) => void;
  onNavigateToMap?: () => void;
}

export const OfficerAssignmentsView: React.FC<OfficerAssignmentsViewProps> = ({
  potholes = [],
  onSelectPothole,
  onNavigateToMap,
}) => {
  const { user } = useAuth();

  const myAssignments = potholes.filter((p) =>
    isAssignedOfficer(p, {
      id: user.officerId || user.id,
      name: user.displayName || 'Field Officer',
      email: user.email,
      role: 'officer',
    })
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      <SectionHeader
        title="My Field Assignments"
        subtitle="Work orders and road repairs assigned directly to your field crew."
        badge={user.agencyId ? (user.agencyId + ' Crew') : 'Agency Crew'}
        badgeColor="bg-purple-950 text-purple-300 border-purple-800"
      />

      {myAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myAssignments.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onClick={onSelectPothole ? () => onSelectPothole(report) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="py-12">
          <EmptyState
            icon={Wrench}
            title="No Active Field Assignments"
            description="You currently have no open work orders assigned. Full crew dispatch and resolution workflow is coming in a later task."
            action={
              onNavigateToMap
                ? {
                    label: 'Explore Map',
                    onClick: onNavigateToMap,
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
};
