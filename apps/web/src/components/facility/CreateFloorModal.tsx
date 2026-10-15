// ─────────────────────────────────────────────
// SENTINEL Web — Create Floor Modal
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { Layers, Plus } from 'lucide-react';
import { useFacility } from '../../context/FacilityContext';

interface CreateFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateFloorModal: React.FC<CreateFloorModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { selectedFacility, createFloor } = useFacility();
  const [name, setName] = useState('');
  const [level, setLevel] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) {
      setError('Please select a facility first.');
      return;
    }

    if (!name.trim()) {
      setError('Floor name is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createFloor(selectedFacility.id, {
        name: name.trim(),
        level: Number(level),
        description: description.trim() || undefined,
      });

      setName('');
      setLevel(1);
      setDescription('');
      onCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create floor.');
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
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <span>Add Floor Level</span>
        </div>
      }
      description={`Add a vertical level or floor map to ${selectedFacility?.name || 'this facility'}.`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Unable to add floor">
            {error}
          </Alert>
        )}

        <Input
          label="Floor Name"
          placeholder="e.g. Level 2 - Pediatric Care Wing"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Level Number (Elevation)"
          type="number"
          placeholder="e.g. 2 (or -1 for basement)"
          value={level}
          onChange={(e) => setLevel(parseInt(e.target.value, 10) || 0)}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Operational Notes / Zone Tags (Optional)
          </label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sentinel-500"
            placeholder="Pediatric oncology, patient rooms 201-220, central nurses station..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            Create Floor
          </Button>
        </div>
      </form>
    </Modal>
  );
};
