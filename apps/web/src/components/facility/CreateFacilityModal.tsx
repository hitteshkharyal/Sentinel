// ─────────────────────────────────────────────
// SENTINEL Web — Create Facility Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Building2, Plus, MapPin } from 'lucide-react';
import type { FacilityType } from '@sentinel/types';
import { useFacility } from '../../context/FacilityContext';
import { useOrganization } from '../../context/OrganizationContext';

interface CreateFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const FACILITY_TYPES: { type: FacilityType; label: string; icon: string }[] = [
  { type: 'hospital_wing', label: 'Hospital Wing / Pavilion', icon: '🏥' },
  { type: 'hotel_tower', label: 'Hotel Tower / Suites', icon: '🏨' },
  { type: 'academic_building', label: 'Academic & Science Center', icon: '🏫' },
  { type: 'transit_depot', label: 'Transit Depot / Fleet Hub', icon: '🚌' },
  { type: 'corporate_tower', label: 'Corporate Office Tower', icon: '🏢' },
  { type: 'manufacturing_plant', label: 'Industrial Plant / Factory', icon: '🏭' },
  { type: 'logistics_hub', label: 'Logistics / Fulfillment Bay', icon: '📦' },
  { type: 'retail_center', label: 'Shopping Mall / Retail Center', icon: '🛍️' },
  { type: 'parking_structure', label: 'Smart Parking Structure', icon: '🅿️' },
  { type: 'civic_center', label: 'Civic & Municipal Hub', icon: '🏛️' },
  { type: 'general', label: 'General / Multi-Use', icon: '🌐' },
];

export const CreateFacilityModal: React.FC<CreateFacilityModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createFacility } = useFacility();
  const { currentOrganization } = useOrganization();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<FacilityType>('general');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [timezone, setTimezone] = useState('America/New_York');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Facility name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createFacility({
        name: name.trim(),
        code: code.trim() || undefined,
        type,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        timezone: timezone.trim() || 'UTC',
      });

      setName('');
      setCode('');
      setAddress('');
      setCity('');
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create facility.');
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
          <span>Add New Facility</span>
        </div>
      }
      description={`Deploy a physical building or campus in ${currentOrganization?.name || 'this organization'}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Unable to add facility">
            {error}
          </Alert>
        )}

        <Input
          label="Facility Name"
          placeholder="e.g. Main Pediatric Hospital Pavilion"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Facility Code"
            placeholder="e.g. STJ-MAIN"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Timezone</label>
            <select
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="America/New_York">Eastern (US/New York)</option>
              <option value="America/Chicago">Central (US/Chicago)</option>
              <option value="America/Denver">Mountain (US/Denver)</option>
              <option value="America/Los_Angeles">Pacific (US/Los Angeles)</option>
              <option value="UTC">UTC Universal</option>
              <option value="Europe/London">London (GMT/BST)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Facility Architectural Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {FACILITY_TYPES.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setType(item.type)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left border text-xs transition-all ${
                  type === item.type
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

        <Input
          label="Street Address (Optional)"
          placeholder="e.g. 262 Danny Thomas Place"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          leftIcon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="City"
            placeholder="e.g. Memphis"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            label="Country"
            placeholder="e.g. United States"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
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
            Create Facility
          </Button>
        </div>
      </form>
    </Modal>
  );
};
