import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ProjectCategory } from '../types/studysync';
import { SKILL_CATALOG, validateProjectInput } from '../utils/matching';

interface PostProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    category: ProjectCategory;
    description: string;
    requiredSkills: string[];
    deadline: string;
    teamSizeNeeded: number;
  }) => Promise<void>;
}

const CATEGORIES: ProjectCategory[] = [
  'Case Competition',
  'Semester Project',
  'Hackathon',
  'Study Group',
];

function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

export const PostProjectModal: React.FC<PostProjectModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Case Competition');
  const [description, setDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Financial Modeling', 'PPT Pitch Design']);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [teamSizeNeeded, setTeamSizeNeeded] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleSkill = (skillName: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skillName)) {
        return prev.filter((s) => s !== skillName);
      }
      if (prev.length >= 10) return prev;
      return [...prev, skillName];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateProjectInput({
      title,
      category,
      description,
      requiredSkills: selectedSkills,
      deadline,
      teamSizeNeeded,
    });
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        category,
        description,
        requiredSkills: selectedSkills,
        deadline,
        teamSizeNeeded,
      });
      setTitle('');
      setDescription('');
      setSelectedSkills(['Financial Modeling', 'PPT Pitch Design']);
      setDeadline(defaultDeadline());
      setTeamSizeNeeded(4);
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
      aria-labelledby="post-project-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 id="post-project-title" className="text-base font-semibold text-slate-900">
              Post Team Requirement
            </h2>
            <p className="text-xs text-slate-500">Publish an open call to the live campus noticeboard</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Post Project modal"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="proj-title" className="block text-sm font-medium text-slate-800 mb-1.5">
              Project or competition title
            </label>
            <input
              id="proj-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., National B-School Strategy Case Challenge"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="proj-category" className="block text-sm font-medium text-slate-800 mb-1.5">
                Category
              </label>
              <select
                id="proj-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="proj-deadline" className="block text-sm font-medium text-slate-800 mb-1.5">
                Target deadline
              </label>
              <input
                id="proj-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="proj-size" className="block text-sm font-medium text-slate-800 mb-1.5">
                Total team size
              </label>
              <input
                id="proj-size"
                type="number"
                min={2}
                max={12}
                value={teamSizeNeeded}
                onChange={(e) => setTeamSizeNeeded(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="proj-desc" className="block text-sm font-medium text-slate-800 mb-1.5">
              Brief & what roles you still need
            </label>
            <textarea
              id="proj-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what your team already covers and what complementary skills you need..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-800 mb-2">
              Required complementary skills ({selectedSkills.length}/10)
            </span>
            <div className="flex flex-wrap gap-2">
              {SKILL_CATALOG.map((item) => {
                const active = selectedSkills.includes(item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleSkill(item.name)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              <Plus className="w-4 h-4" />
              {submitting ? 'Publishing...' : 'Publish Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
