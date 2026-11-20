import React, { useState } from 'react';
import { Camera, Check, Plus, Trash2 } from 'lucide-react';
import { useStudySync } from '../services/studySyncStore';
import type { AvailabilityStatus, SkillProficiency, SkillTag } from '../types/studysync';
import {
  CAMPUS_OPTIONS,
  PROGRAM_OPTIONS,
  SKILL_CATALOG,
  validateProfileInput,
} from '../utils/matching';
import { Avatar } from './Avatar';

const AVAILABILITY_OPTIONS: AvailabilityStatus[] = [
  'Available Now',
  'Open for Weekends',
  'Busy',
];

const PROFICIENCIES: SkillProficiency[] = ['Beginner', 'Intermediate', 'Expert'];

interface OnboardingWizardProps {
  onOpenPhotoModal: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onOpenPhotoModal }) => {
  const { currentUser, saveUserProfile } = useStudySync();

  const [name, setName] = useState(currentUser?.name || '');
  const [program, setProgram] = useState(currentUser?.program || '1st Year MBA');
  const [campusCluster, setCampusCluster] = useState(currentUser?.campusCluster || 'DGU Campus');
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(
    currentUser?.availabilityStatus || 'Available Now'
  );
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [skills, setSkills] = useState<SkillTag[]>(
    currentUser?.skills.length
      ? currentUser.skills
      : [{ name: 'Financial Modeling', proficiency: 'Intermediate' }]
  );
  const [customSkill, setCustomSkill] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleCatalogSkill = (skillName: string) => {
    setSkills((prev) => {
      const exists = prev.some((s) => s.name.toLowerCase() === skillName.toLowerCase());
      if (exists) {
        return prev.filter((s) => s.name.toLowerCase() !== skillName.toLowerCase());
      }
      if (prev.length >= 6) return prev;
      return [...prev, { name: skillName, proficiency: 'Intermediate' }];
    });
  };

  const addCustomSkill = () => {
    const clean = customSkill.trim();
    if (!clean) return;
    if (skills.length >= 6) {
      setError('You can add up to 6 skill tags.');
      return;
    }
    if (skills.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      setCustomSkill('');
      return;
    }
    setSkills((prev) => [...prev, { name: clean, proficiency: 'Intermediate' }]);
    setCustomSkill('');
    setError(null);
  };

  const updateProficiency = (skillName: string, proficiency: SkillProficiency) => {
    setSkills((prev) =>
      prev.map((s) => (s.name === skillName ? { ...s, proficiency } : s))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateProfileInput({
      name,
      program,
      campusCluster,
      bio,
      skills,
    });
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveUserProfile({
        name: name.trim(),
        program,
        campusCluster,
        bio: bio.trim(),
        skills,
        availabilityStatus,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="pb-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-600 mb-1">Profile Setup Wizard</p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Tell campus peers what you bring to a team
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Add your photo and up to 6 skills so StudySync can calculate your complementary match score.
            </p>
          </div>
          {currentUser && (
            <div className="flex items-center gap-3 shrink-0">
              <Avatar
                name={name || currentUser.name}
                photoURL={currentUser.photoURL}
                size="lg"
                availabilityStatus={availabilityStatus}
              />
              <button
                type="button"
                onClick={onOpenPhotoModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" />
                Change Photo
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="pt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wiz-name" className="block text-sm font-medium text-slate-800 mb-1.5">
                Full name
              </label>
              <input
                id="wiz-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Harshita Chhetri"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="wiz-program" className="block text-sm font-medium text-slate-800 mb-1.5">
                Academic program
              </label>
              <select
                id="wiz-program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PROGRAM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="wiz-campus" className="block text-sm font-medium text-slate-800 mb-1.5">
                Campus / University cluster
              </label>
              <select
                id="wiz-campus"
                value={campusCluster}
                onChange={(e) => setCampusCluster(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CAMPUS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="wiz-availability" className="block text-sm font-medium text-slate-800 mb-1.5">
                Current availability
              </label>
              <select
                id="wiz-availability"
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="wiz-bio" className="block text-sm font-medium text-slate-800 mb-1.5">
              Short collaboration bio
            </label>
            <textarea
              id="wiz-bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share competitions you are targeting or preferred project roles..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-800">
                Select up to 6 skill tags ({skills.length}/6)
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {SKILL_CATALOG.map((item) => {
                const active = skills.some(
                  (s) => s.name.toLowerCase() === item.name.toLowerCase()
                );
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleCatalogSkill(item.name)}
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

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                aria-label="Add custom skill"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomSkill();
                  }
                }}
                placeholder="Or type a custom skill (e.g., Stata, Tableau)..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {skills.length > 0 && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="text-sm font-medium text-slate-900">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Proficiency for ${skill.name}`}
                        value={skill.proficiency}
                        onChange={(e) =>
                          updateProficiency(skill.name, e.target.value as SkillProficiency)
                        }
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-300 rounded-md text-slate-800"
                      >
                        {PROFICIENCIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => toggleCatalogSkill(skill.name)}
                        aria-label={`Remove skill ${skill.name}`}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving Profile...' : 'Save & Enter StudySync'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
