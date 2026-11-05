// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Wizard Host Page
// ─────────────────────────────────────────────

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Rocket } from 'lucide-react';
import { DeploymentWizard } from '../components/deployments/DeploymentWizard';

export const DeploymentWizardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/deployments')}
          className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
          title="Back to Deployment Center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            New Hardware Deployment Wizard
          </h1>
          <p className="text-xs text-text-secondary">
            Guided 4-step deployment configurator with real-time pin conflict engine.
          </p>
        </div>
      </div>

      <DeploymentWizard />
    </div>
  );
};

