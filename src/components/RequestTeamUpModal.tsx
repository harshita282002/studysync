import React, { useEffect, useState } from 'react';
import { Send, X } from 'lucide-react';
import type { PeerProfile, ProjectBoard } from '../types/studysync';
import { validateMatchMessage } from '../utils/matching';
import { Avatar } from './Avatar';

interface RequestTeamUpModalProps {
  peer: PeerProfile | null;
  projects: ProjectBoard[];
  matchScore: number;
  complementarySkills: string[];
  onClose: () => void;
  onSubmit: (payload: { receiver: PeerProfile; message: string; project?: ProjectBoard }) => Promise<void>;
}

export const RequestTeamUpModal: React.FC<RequestTeamUpModalProps> = ({
  peer,
  projects,
  matchScore,
  complementarySkills,
  onClose,
  onSubmit,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (peer) {
      const skillHighlight =
        complementarySkills.length > 0
          ? complementarySkills.slice(0, 2).join(' & ')
          : peer.skills[0]?.name || 'your domain';
      setMessage(
        `Hi ${peer.name.split(' ')[0]}, your background in ${skillHighlight} complements my skillset well. Would you like to team up?`
      );
      setSelectedProjectId('');
      setError(null);
    }
  }, [peer, complementarySkills]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!peer) return null;

  const openProjects = projects.filter((p) => p.status !== 'Completed');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validateMatchMessage(message);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const linkedProject = openProjects.find((p) => p.id === selectedProjectId);
      await onSubmit({
        receiver: peer,
        message,
        project: linkedProject,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-teamup-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="request-teamup-title" className="text-base font-semibold text-slate-900">
            Request to Team Up
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Request to Team Up modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar
                name={peer.name}
                photoURL={peer.photoURL}
                isProMember={peer.isProMember}
                availabilityStatus={peer.availabilityStatus}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{peer.name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {peer.program} · {peer.campusCluster}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-semibold text-indigo-600 tabular-nums">
                {matchScore}% Match
              </span>
              <p className="text-xs text-slate-500">Complementary</p>
            </div>
          </div>

          <div>
            <label htmlFor="teamup-project" className="block text-sm font-medium text-slate-800 mb-1.5">
              Tie to a project or study session (optional)
            </label>
            <select
              id="teamup-project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">General peer study / future competition</option>
              {openProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="teamup-message" className="block text-sm font-medium text-slate-800 mb-1.5">
              Collaboration pitch
            </label>
            <textarea
              id="teamup-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share what role you are covering and your timeline..."
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {error && <p className="text-xs text-rose-600 mt-1.5">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Send Match Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
