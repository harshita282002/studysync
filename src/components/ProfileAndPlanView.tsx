import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Camera, Check, Plus, Save, Sparkles, Star, Trash2, X } from 'lucide-react';
import { useStudySync } from '../services/studySyncStore';
import type { AvailabilityStatus, SkillProficiency, SkillTag } from '../types/studysync';
import { buildAvatarLookup } from '../utils/avatar';
import {
  CAMPUS_OPTIONS,
  PROGRAM_OPTIONS,
  SKILL_CATALOG,
  validateProfileInput,
} from '../utils/matching';
import { Avatar } from './Avatar';

interface ProfileAndPlanViewProps {
  onOpenProUpgrade: () => void;
  onOpenPhotoModal: () => void;
}

const PROFICIENCIES: SkillProficiency[] = ['Beginner', 'Intermediate', 'Expert'];

export const ProfileAndPlanView: React.FC<ProfileAndPlanViewProps> = ({
  onOpenProUpgrade,
  onOpenPhotoModal,
}) => {
  const {
    currentUser,
    peers,
    matchRequests,
    saveUserProfile,
    respondToMatchRequest,
    setActiveView,
  } = useStudySync();

  const [name, setName] = useState(currentUser?.name || '');
  const [program, setProgram] = useState(currentUser?.program || '1st Year MBA');
  const [campusCluster, setCampusCluster] = useState(currentUser?.campusCluster || 'DGU Campus');
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(
    currentUser?.availabilityStatus || 'Available Now'
  );
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [skills, setSkills] = useState<SkillTag[]>(currentUser?.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const avatarMap = useMemo(() => buildAvatarLookup(currentUser, peers), [currentUser, peers]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setProgram(currentUser.program);
      setCampusCluster(currentUser.campusCluster);
      setAvailabilityStatus(currentUser.availabilityStatus);
      setBio(currentUser.bio);
      setSkills(currentUser.skills);
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const incomingRequests = matchRequests.filter((r) => r.receiverId === currentUser.uid);
  const outgoingRequests = matchRequests.filter((r) => r.senderId === currentUser.uid);

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
      setError('Maximum 6 skill tags allowed.');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validateProfileInput({
      name,
      program,
      campusCluster,
      bio,
      skills,
    });
    if (validationErr) {
      setError(validationErr);
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
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenPhotoModal}
            aria-label="Change Profile Photo"
            className="relative group cursor-pointer rounded-full shrink-0"
          >
            <Avatar
              name={currentUser.name}
              photoURL={currentUser.photoURL}
              size="lg"
              isProMember={currentUser.isProMember}
              availabilityStatus={currentUser.availabilityStatus}
            />
            <span className="absolute inset-0 rounded-full bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </span>
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {currentUser.name}
              </h1>
              {currentUser.isProMember && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-md">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Pro Member
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-0.5 flex flex-wrap items-center gap-2">
              <span>{currentUser.email}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {currentUser.reliabilityScore.toFixed(1)} reliability
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{currentUser.completedProjects} completed</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenPhotoModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer self-start sm:self-center whitespace-nowrap shrink-0"
        >
          <Camera className="w-3.5 h-3.5" />
          Change Profile Photo
        </button>
      </div>

      {/* StudySync Pro Plan Card */}
      <section
        className={`rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm ${
          currentUser.isProMember
            ? 'bg-white border border-slate-200'
            : 'bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white'
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <BadgeCheck
              className={`w-5 h-5 ${currentUser.isProMember ? 'text-indigo-600' : 'text-emerald-400'}`}
            />
            <h2
              className={`text-base font-semibold ${
                currentUser.isProMember ? 'text-slate-900' : 'text-white'
              }`}
            >
              {currentUser.isProMember
                ? 'StudySync Pro Plan — Active'
                : 'Upgrade to StudySync Pro (₹149/month)'}
            </h2>
          </div>
          <p
            className={`text-sm max-w-2xl ${
              currentUser.isProMember ? 'text-slate-600' : 'text-indigo-100/90'
            }`}
          >
            {currentUser.isProMember
              ? 'You have priority search placement, unlimited direct teammate invites, AI-recommended team builder access, and a verified Pro badge.'
              : 'Get priority search placement in the Peer Directory, unlimited direct teammate invites, AI-recommended balanced team builder, and a verified badge.'}
          </p>
          {currentUser.isProMember && currentUser.lastPaymentId && (
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              Razorpay Receipt ID: {currentUser.lastPaymentId}
            </p>
          )}
        </div>

        {currentUser.isProMember ? (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg whitespace-nowrap shrink-0">
            <Check className="w-4 h-4" />
            Pro Benefits Unlocked
          </span>
        ) : (
          <button
            type="button"
            onClick={onOpenProUpgrade}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start md:self-center shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Upgrade to Pro
          </button>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Editor */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Edit Academic Profile & Skills</h2>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {skills.length}/6 skills
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-medium text-slate-700 mb-1">
                Full name
              </label>
              <input
                id="prof-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="prof-program" className="block text-xs font-medium text-slate-700 mb-1">
                Academic program
              </label>
              <select
                id="prof-program"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PROGRAM_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-campus" className="block text-xs font-medium text-slate-700 mb-1">
                Campus cluster
              </label>
              <select
                id="prof-campus"
                value={campusCluster}
                onChange={(e) => setCampusCluster(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CAMPUS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prof-avail" className="block text-xs font-medium text-slate-700 mb-1">
                Availability
              </label>
              <select
                id="prof-avail"
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Available Now">Available Now</option>
                <option value="Open for Weekends">Open for Weekends</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prof-bio" className="block text-xs font-medium text-slate-700 mb-1">
              Collaboration bio
            </label>
            <textarea
              id="prof-bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-2">
              Toggle skill tags (max 6)
            </span>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SKILL_CATALOG.map((item) => {
                const active = skills.some(
                  (s) => s.name.toLowerCase() === item.name.toLowerCase()
                );
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleCatalogSkill(item.name)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
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

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                aria-label="Add custom skill"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="Add custom skill..."
                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {skills.length > 0 && (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                {skills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between px-3.5 py-2">
                    <span className="text-xs font-medium text-slate-900">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <select
                        aria-label={`Proficiency for ${skill.name}`}
                        value={skill.proficiency}
                        onChange={(e) =>
                          updateProficiency(skill.name, e.target.value as SkillProficiency)
                        }
                        className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-md"
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
                        aria-label={`Remove ${skill.name}`}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Match Requests Manager */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Incoming Teammate Invites ({incomingRequests.length})
            </h2>

            {incomingRequests.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm font-medium text-slate-700">No incoming requests yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  When peers invite you to collaborate, they will appear here with quick actions.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={req.senderName}
                          photoURL={avatarMap.get(req.senderId)}
                          size="sm"
                        />
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {req.senderName}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          req.status === 'Accepted'
                            ? 'text-emerald-700'
                            : req.status === 'Declined'
                              ? 'text-slate-500'
                              : 'text-indigo-600'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    {req.projectTitle && (
                      <p className="text-xs text-indigo-600 font-medium">{req.projectTitle}</p>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">{req.message}</p>

                    {req.status === 'Pending' ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            await respondToMatchRequest(req, 'Accepted');
                            setActiveView('workspaces');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToMatchRequest(req, 'Declined')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </div>
                    ) : (
                      req.status === 'Accepted' && (
                        <button
                          type="button"
                          onClick={() => setActiveView('workspaces')}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                          Open Team Workspace →
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">
              Sent Requests ({outgoingRequests.length})
            </h2>
            {outgoingRequests.length === 0 ? (
              <p className="text-sm text-slate-500">
                Invite complementary peers from the Peer Directory to form your next team.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={req.receiverName}
                        photoURL={avatarMap.get(req.receiverId)}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          To {req.receiverName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {req.projectTitle || 'General collaboration'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-amber-700 shrink-0">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
