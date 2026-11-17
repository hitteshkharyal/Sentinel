// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Detail & Workspace Host Page
// ─────────────────────────────────────────────

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useDeployment } from '../context/DeploymentContext';
import { DeploymentWorkspaceLayout } from '../components/deployments/workspace/DeploymentWorkspaceLayout';

export const DeploymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getDeploymentById, activeDeployment, isLoading } = useDeployment();

  useEffect(() => {
    if (id) {
      getDeploymentById(id).catch(() => {});
    }
  }, [id, getDeploymentById]);

  if (isLoading || !activeDeployment) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          <p className="text-xs font-medium text-slate-500">Opening Deployment Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <DeploymentWorkspaceLayout
      deployment={activeDeployment}
      onRefresh={() => {
        if (id) getDeploymentById(id).catch(() => {});
      }}
    />
  );
};
