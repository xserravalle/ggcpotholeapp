import React from 'react';
import { PotholeReport } from '../../domain/types';
import { TriageQueueView } from '../admin/TriageQueueView';
import { useReports } from '../../context/ReportsContext';

export interface TriageWorkspaceViewProps {
  potholes?: PotholeReport[];
  onSelectPotholeForMap?: (p: PotholeReport) => void;
  onNavigateTab?: (tab: any) => void;
}

export const TriageWorkspaceView: React.FC<TriageWorkspaceViewProps> = ({
  potholes: propPotholes,
  onSelectPotholeForMap,
}) => {
  const { potholes: contextPotholes } = useReports();
  const effectivePotholes = propPotholes || contextPotholes;

  return (
    <div className="animate-in fade-in duration-200">
      <TriageQueueView
        potholes={effectivePotholes}
        onSelectPotholeForMap={onSelectPotholeForMap}
      />
    </div>
  );
};
