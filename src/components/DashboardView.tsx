import React, { useMemo } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Columns3,
  Compass,
  FolderKanban,
  Plus,
  Send,
  Star,
} from 'lucide-react';
import { useStudySync } from '../services/studySyncStore';
import type { PeerProfile } from '../types/studysync';
import { buildAvatarLookup } from '../utils/avatar';
import {
  calculateMatchScore,
  getDeadlineInfo,
  getProjectSkillCoverage,
} from '../utils/matching';
import { Avatar } from './Avatar';

interface DashboardViewProps {
  onRequestTeamUp: (peer: PeerProfile, score: number, complementary: string[]) => void;
  onOpenPostProject: () => void;
  onOpenProUpgrade: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onRequestTeamUp,
  onOpenPostProject,
  onOpenProUpgrade,
}) => {
  const {
    currentUser,
    peers,
    projects,
    matchRequests,
    workspaces,
    isLoadingData,
    setActiveView,
  } = useStudySync();

  const avatarMap = useMemo(() => buildAvatarLookup(currentUser, peers), [currentUser, peers]);
  const userSkills = currentUser?.skills || [];

  const rankedPeers = peers
    .filter((p) => p.uid !== currentUser?.uid)
    .map((peer) => {
      const analysis = calculateMatchScore(
        userSkills,
        peer.skills,
        peer.availabilityStatus,
        peer.reliabilityScore,
        peer.isProMember
      );
      return { peer, ...analysis };
    })
    .sort((a, b) => b.score - a.score);

  const topPeers = rankedPeers.slice(0, 3);
  const openProjects = projects.filter((p) => p.status === 'Open').slice(0, 3);
  const pendingIncomingCount = matchRequests.filter(
    (r) => r.receiverId === currentUser?.uid && r.status === 'Pending'
  ).length;
  const activeWorkspace = workspaces[0];
  const activeDoneTasks = activeWorkspace
    ? activeWorkspace.tasks.filter((t) => t.status === 'Done').length
    : 0;
  const activeTotalTasks = activeWorkspace ? activeWorkspace.tasks.length : 0;
  const activeProgressPct =
    activeTotalTasks > 0 ? Math.round((activeDoneTasks / activeTotalTasks) * 100) : 0;

  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="h-36 rounded-2xl shimmer-skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="h-4 w-24 rounded shimmer-skeleton" />
              <div className="h-7 w-12 rounded shimmer-skeleton mt-3" />
            </div>
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-2xl shimmer-skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Focal Readiness Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white p-6 sm:p-7 shadow-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-emerald-400/15 blur-3xl"
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-indigo-200">
              <span>{currentUser?.program}</span>
              <span aria-hidden="true">·</span>
              <span>{currentUser?.campusCluster}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {currentUser?.skills.length || 0} active skill tags
              </span>
              {currentUser?.isProMember && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Pro Verified
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, {currentUser?.name.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-sm text-indigo-100/85 max-w-xl">
              {rankedPeers.filter((p) => p.score >= 70).length} complementary campus peers are ready to balance your next case deck, hackathon build, or semester project.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('directory')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 bg-white rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              Explore Matches
            </button>
            <button
              type="button"
              onClick={onOpenPostProject}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Post Team Call
            </button>
            {!currentUser?.isProMember && (
              <button
                type="button"
                onClick={onOpenProUpgrade}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-indigo-100 bg-white/10 border border-white/15 rounded-lg hover:bg-white/15 transition-colors cursor-pointer whitespace-nowrap"
              >
                <BadgeCheck className="w-4 h-4 text-emerald-300" />
                Upgrade Pro · ₹149/mo
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 4-Column Interactive KPI Shortcut Strip */}
      <section aria-label="Workspace overview metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveView('directory')}
          className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">Complementary Peers</p>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <Compass className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {rankedPeers.filter((p) => p.score >= 70).length}
          </p>
          <p className="text-xs text-emerald-700 mt-1 flex items-center justify-between">
            <span>70%+ match score</span>
            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('board')}
          className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">Open Project Calls</p>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <FolderKanban className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {projects.filter((p) => p.status === 'Open').length}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Across 4 categories</span>
            <ArrowRight className="w-3 h-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('workspaces')}
          className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">Active Workspaces</p>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Columns3 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {workspaces.length}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Synced Kanban boards</span>
            <ArrowRight className="w-3 h-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('profile')}
          className="text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">Incoming Requests</p>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <BellRing className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-2">
            {pendingIncomingCount}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Awaiting your response</span>
            <ArrowRight className="w-3 h-3 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </button>
      </section>

      {/* Top Complementary Matches */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Top Complementary Matches for You
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by verified skills you lack to help form balanced teams
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveView('directory')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer whitespace-nowrap"
          >
            Browse all peers
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {topPeers.map(({ peer, score, complementarySkills }) => (
            <div
              key={peer.uid}
              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <Avatar
                  name={peer.name}
                  photoURL={peer.photoURL}
                  isProMember={peer.isProMember}
                  availabilityStatus={peer.availabilityStatus}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-semibold text-slate-900">{peer.name}</span>
                    <div className="inline-flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-semibold tabular-nums ${
                          score >= 85 ? 'text-emerald-700' : 'text-indigo-600'
                        }`}
                      >
                        {score}% Match
                      </span>
                      <span className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:inline-block">
                        <span
                          className={`block h-full rounded-full ${
                            score >= 85 ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </span>
                    </div>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 tabular-nums">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {peer.reliabilityScore.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {peer.program} · {peer.campusCluster} · {peer.availabilityStatus}
                  </p>
                  <p className="text-xs text-slate-700 mt-1.5">
                    <span className="text-slate-500">Brings: </span>
                    <span className="font-medium text-slate-800">
                      {complementarySkills.length > 0
                        ? complementarySkills.join(', ')
                        : peer.skills.map((s) => s.name).join(', ')}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRequestTeamUp(peer, score, complementarySkills)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-center"
              >
                <Send className="w-3.5 h-3.5" />
                Request to Team Up
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom 2-Column Split: Open Noticeboard Calls & Active Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">Active Campus Calls</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenPostProject}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer whitespace-nowrap"
              >
                + Post Project
              </button>
              <button
                type="button"
                onClick={() => setActiveView('board')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer whitespace-nowrap"
              >
                Noticeboard →
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {openProjects.map((project) => {
              const deadlineInfo = getDeadlineInfo(project.deadline);
              const coverage = getProjectSkillCoverage(userSkills, project.requiredSkills);
              return (
                <div
                  key={project.id}
                  className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar
                      name={project.creatorName}
                      photoURL={avatarMap.get(project.creatorId)}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">
                        {project.category} · by {project.creatorName}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Needs: {project.requiredSkills.join(', ')}
                        {coverage.matched.length > 0 && (
                          <span className="text-emerald-700 font-medium">
                            {' '}
                            ({coverage.matched.length} skill match)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-mono font-medium tabular-nums ${
                        deadlineInfo.urgency === 'urgent'
                          ? 'text-rose-600'
                          : deadlineInfo.urgency === 'soon'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                      }`}
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      {deadlineInfo.label}
                    </span>
                    <p className="text-xs text-slate-500 font-mono tabular-nums mt-1">
                      {project.currentMembers.length}/{project.teamSizeNeeded} filled
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">Workspace Progress</h2>
            <button
              type="button"
              onClick={() => setActiveView('workspaces')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer whitespace-nowrap"
            >
              Open Kanban →
            </button>
          </div>

          {activeWorkspace ? (
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {activeWorkspace.projectTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex -space-x-2">
                        {activeWorkspace.members.slice(0, 4).map((m) => (
                          <div key={m.uid} className="rounded-full ring-2 ring-white">
                            <Avatar
                              name={m.name}
                              photoURL={avatarMap.get(m.uid)}
                              size="xs"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 truncate">
                        {activeWorkspace.members.map((m) => m.name.split(' ')[0]).join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-700 tabular-nums shrink-0">
                    {activeProgressPct}%
                  </span>
                </div>

                <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${activeProgressPct}%` }}
                  />
                </div>

                <div className="mt-4 divide-y divide-slate-100">
                  {activeWorkspace.tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="py-2.5 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-800 truncate">{task.title}</span>
                      <span
                        className={`text-xs font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1 ${
                          task.status === 'Done'
                            ? 'text-emerald-700'
                            : task.status === 'In Progress'
                              ? 'text-indigo-600'
                              : 'text-slate-500'
                        }`}
                      >
                        {task.status === 'Done' && <CheckCircle2 className="w-3 h-3" />}
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveView('workspaces')}
                className="mt-4 w-full py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Manage Tasks & Shared Links
              </button>
            </div>
          ) : (
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-slate-800">No active team workspace yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Apply to an open project or accept a match request to unlock your shared Kanban workspace.
              </p>
              <button
                type="button"
                onClick={() => setActiveView('board')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Browse Open Projects
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
