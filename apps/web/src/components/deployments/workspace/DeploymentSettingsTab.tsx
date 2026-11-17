// ─────────────────────────────────────────────
// SENTINEL Web — Deployment Settings Tab
// Configuration, site relocation, and deactivation controls
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Save, Archive } from 'lucide-react';
import type { Deployment } from '@sentinel/types';
import { useDeployment } from '../../../context/DeploymentContext';

interface SettingsTabProps {
  deployment: Deployment;
  onUpdated?: () => void;
}

export const DeploymentSettingsTab: React.FC<SettingsTabProps> = ({
  deployment,
  onUpdated,
}) => {
  const { updateDeployment } = useDeployment();
  const [name, setName] = useState(deployment.name);
  const [description, setDescription] = useState(deployment.description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDeployment(deployment.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      alert('Deployment updated successfully');
      if (onUpdated) onUpdated();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update deployment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate and archive this deployment?')) {
      return;
    }
    try {
      await updateDeployment(deployment.id, {
        status: 'ARCHIVED',
      });
      alert('Deployment archived.');
      if (onUpdated) onUpdated();
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to archive deployment');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-base font-semibold text-[#172033]">Deployment Configuration</h3>
        <p className="text-xs text-slate-500">
          General metadata and lifecycle parameters for this installation
        </p>
      </div>

      <div className="bg-white border border-[#DCE3EC] rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deployment Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3 py-2.5 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-xs p-3 border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-rose-200 rounded-xl p-6 shadow-sm space-y-3">
        <h4 className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
          Danger Zone
        </h4>
        <p className="text-xs text-slate-500">
          Deactivating this deployment stops sensor alert notifications and marks hardware as decommissioned.
        </p>
        <button
          onClick={handleDeactivate}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-300 hover:bg-rose-50 px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Archive className="w-4 h-4" />
          Deactivate & Archive Deployment
        </button>
      </div>
    </div>
  );
};
