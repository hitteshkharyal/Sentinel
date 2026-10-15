// ─────────────────────────────────────────────
// SENTINEL Web — Create Organization Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Building2, Plus, Sparkles } from 'lucide-react';
import type { IndustryType } from '@sentinel/types';
import { useOrganization } from '../../context/OrganizationContext';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const INDUSTRY_OPTIONS: { value: IndustryType; label: string; icon: string }[] = [
  { value: 'hospital', label: 'Hospital & Healthcare', icon: '🏥' },
  { value: 'hotel', label: 'Hotel & Hospitality', icon: '🏨' },
  { value: 'school', label: 'School & University Campus', icon: '🏫' },
  { value: 'transport', label: 'Public Transit & Fleet Bus', icon: '🚌' },
  { value: 'office', label: 'Commercial Office Tower', icon: '🏢' },
  { value: 'factory', label: 'Industrial Manufacturing', icon: '🏭' },
  { value: 'warehouse', label: 'Logistics Warehouse', icon: '📦' },
  { value: 'mall', label: 'Shopping Mall & Retail', icon: '🛍️' },
  { value: 'parking', label: 'Smart Parking Structure', icon: '🅿️' },
  { value: 'public_facility', label: 'Civic & Municipal Hub', icon: '🏛️' },
  { value: 'general', label: 'General / Multi-Use', icon: '🌐' },
];

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createOrganization } = useOrganization();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState<IndustryType>('hospital');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Organization name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrganization({
        name: name.trim(),
        industry,
        description: description.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });

      setName('');
      setDescription('');
      setContactEmail('');
      setIndustry('hospital');
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sentinel-100 text-sentinel-700 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <span>Create New Organization</span>
        </div>
      }
      description="Deploy a privacy-preserving IoT workspace with isolated RBAC boundaries."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Unable to create organization">
            {error}
          </Alert>
        )}

        <Input
          label="Organization Name"
          placeholder="e.g. St. Jude Regional Medical Center"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Industry & Facility Sector
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INDUSTRY_OPTIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setIndustry(item.value)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs transition-all ${
                  industry === item.value
                    ? 'border-sentinel-500 bg-sentinel-50 text-sentinel-900 font-semibold ring-1 ring-sentinel-500 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500 focus:border-transparent transition-all"
            placeholder="Autonomous environmental monitoring, patient safety, and HVAC optimization..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Input
          label="Operational Contact Email (Optional)"
          type="email"
          placeholder="facilities@organization.com"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-[11px] text-slate-600">
          <Sparkles className="w-4 h-4 text-sentinel-600 shrink-0 mt-0.5" />
          <p>
            You will be automatically designated as the <strong>Organization Administrator</strong>{' '}
            with full sovereignty over facilities, sensors, and member permissions.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Organization
          </Button>
        </div>
      </form>
    </Modal>
  );
};
