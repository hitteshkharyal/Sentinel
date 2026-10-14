// ─────────────────────────────────────────────
// SENTINEL Web — Admin Access Approvals & Allowlist Modal
// ─────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';
import {
  ShieldAlert,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import type { AllowlistEntry, Role } from '@sentinel/types';

interface AccessApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessApprovalsModal: React.FC<AccessApprovalsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    getAccessRequests,
    allowlistEmail,
    approveAccessRequest,
    rejectAccessRequest,
    revokeAllowlistEntry,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'preauth' | 'directory'>('pending');
  const [pendingRequests, setPendingRequests] = useState<AllowlistEntry[]>([]);
  const [approvedEntries, setApprovedEntries] = useState<AllowlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pre-authorization form state
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('OPERATOR');
  const [newNotes, setNewNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAccessRequests();
      setPendingRequests(data.pending || []);
      setApprovedEntries(data.approved || []);
    } catch (err) {

      setFeedback({ type: 'error', message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [getAccessRequests]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleApprove = async (id: string, role?: Role) => {
    try {
      setFeedback(null);
      await approveAccessRequest(id, role);
      setFeedback({ type: 'success', message: 'Access request approved! User is now active.' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const handleReject = async (id: string) => {
    try {
      setFeedback(null);
      await rejectAccessRequest(id);
      setFeedback({ type: 'success', message: 'Access request rejected.' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  const handlePreAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      setIsAdding(true);
      setFeedback(null);
      await allowlistEmail(newEmail.trim(), newRole, newNotes.trim() || undefined);
      setFeedback({
        type: 'success',
        message: `Successfully pre-authorized ${newEmail} as ${newRole}. They can now sign in with Google or register immediately.`,
      });
      setNewEmail('');
      setNewNotes('');
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke access for ${email}?`)) return;

    try {
      setFeedback(null);
      await revokeAllowlistEntry(id);
      setFeedback({ type: 'success', message: `Revoked access for ${email}.` });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: (err as Error).message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hardware IoT Access Control & Approvals"
      description="Zero-trust perimeter control: approve pending user registrations and pre-authorize email addresses."
      maxWidth="xl"
    >

      <div className="space-y-5">
        {feedback && (
          <Alert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            onDismiss={() => setFeedback(null)}
            className="text-xs"
          >
            {feedback.message}
          </Alert>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-sentinel-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'pending' ? 'bg-white text-sentinel-700' : 'bg-amber-500 text-white'
              }`}>
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preauth')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'preauth'
                ? 'bg-sentinel-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Pre-Authorize Email (Allowlist)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'bg-sentinel-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approved Directory ({approvedEntries.length})</span>
          </button>

          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              title="Refresh access records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ── TAB 1: PENDING REQUESTS ── */}
        {activeTab === 'pending' && (
          <div className="space-y-3">
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Hardware Security Protocol:</span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Users below attempted to register or sign in via Google. They cannot access sensor telemetry or send commands until you click Approve.
                </p>
              </div>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Pending Requests</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All user registrations and Google sign-ins are reviewed.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{req.email}</span>
                        <Badge variant="warning" size="sm">PENDING</Badge>
                        <Badge variant="neutral" size="sm">
                          {req.provider === 'google' ? 'Google OAuth' : 'Email/Password'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {req.displayName && <span>Name: <strong className="text-slate-600">{req.displayName}</strong></span>}
                        <span>Requested: {new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                      {req.notes && <p className="text-[11px] text-slate-500 italic">Notes: {req.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(req.id, req.role)}
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        className="text-xs font-bold py-1.5"
                      >
                        Approve Access
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(req.id)}
                        leftIcon={<UserX className="w-3.5 h-3.5" />}
                        className="text-xs font-bold py-1.5"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: PRE-AUTHORIZE (ALLOWLIST) ── */}
        {activeTab === 'preauth' && (
          <form onSubmit={handlePreAuthorize} className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-sentinel-600" />
                Pre-Authorize Any Email Address
              </h4>
              <p className="text-xs text-slate-500">
                Add an email to the allowlist before the user signs up. When they sign in with Google or register, their account will be approved automatically without queuing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address to Allow"
                type="email"
                placeholder="colleague@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Assigned Platform Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-sentinel-500 focus:ring-2 focus:ring-sentinel-500/20 outline-none"
                >
                  <option value="OPERATOR">OPERATOR (Standard operations & telemetry)</option>
                  <option value="TECHNICIAN">TECHNICIAN (Hardware & sensor configuration)</option>
                  <option value="FACILITY_ADMIN">FACILITY_ADMIN (Facility management)</option>
                  <option value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN (Tenant management)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full platform privilege)</option>
                  <option value="VIEWER">VIEWER (Read-only monitoring)</option>
                </select>
              </div>
            </div>

            <Input
              label="Administrative Notes (Optional)"
              type="text"
              placeholder="e.g. Lead mmWave engineer - Lab 4"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isAdding}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="font-bold text-xs"
              >
                Pre-Authorize Email
              </Button>
            </div>
          </form>
        )}

        {/* ── TAB 3: APPROVED DIRECTORY ── */}
        {activeTab === 'directory' && (
          <div className="space-y-3">
            {approvedEntries.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No approved allowlist records found.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[360px] overflow-y-auto">
                {approvedEntries.map((entry) => (
                  <div key={entry.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{entry.email}</span>
                        <Badge variant="success" size="sm">{entry.role}</Badge>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Authorized: {new Date(entry.approvedAt || entry.createdAt).toLocaleDateString()}
                        {entry.notes && <span className="ml-2 italic text-slate-500">· {entry.notes}</span>}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(entry.id, entry.email)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Revoke access"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
