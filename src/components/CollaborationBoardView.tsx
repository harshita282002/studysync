import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Briefcase,
  CalendarClock,
  Check,
  Code2,
  FolderKanban,
  Plus,
  Trophy,
  Users,
} from 'lucide-react';
import { useStudySync } from '../services/studySyncStore';
import type { ProjectCategory } from '../types/studysync';
import { buildAvatarLookup, getSkillChipClasses } from '../utils/avatar';
import { getDeadlineInfo, getProjectSkillCoverage } from '../utils/matching';
import { Avatar } from './Avatar';

interface CollaborationBoardViewProps {
  onOpenPostProject: () => void;
}

const CATEGORIES: ('All' | ProjectCategory)[] = [
  'All',
  'Case Competition',
  'Semester Project',
  'Hackathon',
  'Study Group',
];

const CategoryIcon: React.FC<{ category: ProjectCategory }> = ({ category }) => {
  switch (category) {
    case 'Case Competition':
      return <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    case 'Hackathon':
      return <Code2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    case 'Study Group':
      return <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    default:
      return <Briefcase className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
  }
};

export const CollaborationBoardView: React.FC<CollaborationBoardViewProps> = ({
  onOpenPostProject,
}) => {
  const {
    currentUser,
    peers,
    projects,
    globalSearch,
    applyToJoinProject,
    setActiveView,
    isLoadingData,
  } = useStudySync();

  const [categoryFilter, setCategoryFilter] = useState<'All' | ProjectCategory>('All');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const avatarMap = useMemo(() => buildAvatarLookup(currentUser, peers), [currentUser, peers]);
  const userSkills = currentUser?.skills || [];

  const filteredProjects = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return projects.filter((proj) => {
      if (categoryFilter !== 'All' && proj.category !== categoryFilter) {
        return false;
      }
      if (q) {
        const hay = [
          proj.title,
          proj.description,
          proj.creatorName,
          proj.category,
          ...proj.requiredSkills,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [categoryFilter, globalSearch, projects]);

  const handleJoin = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    setJoiningId(projectId);
    try {
      await applyToJoinProject(project);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Live Collaboration Noticeboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Open calls for teammates—your matching skills are highlighted automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenPostProject}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Post Team Requirement
        </button>
      </div>

      {/* Category Segmented Filter */}
      <div
        className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm p-2"
        role="group"
        aria-label="Filter projects by category"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="h-4 w-32 rounded shimmer-skeleton" />
              <div className="h-6 w-3/4 rounded shimmer-skeleton" />
              <div className="h-12 w-full rounded shimmer-skeleton" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <FolderKanban className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No project posts in this view</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Be the first to post an open team call for your upcoming case competition, hackathon, or study group.
          </p>
          <button
            type="button"
            onClick={onOpenPostProject}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Project Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((project) => {
            const deadlineInfo = getDeadlineInfo(project.deadline);
            const coverage = getProjectSkillCoverage(userSkills, project.requiredSkills);
            const isMember = currentUser ? project.currentMembers.includes(currentUser.uid) : false;
            const isFull = project.currentMembers.length >= project.teamSizeNeeded;
            const fillRatio = Math.min(
              100,
              Math.round((project.currentMembers.length / Math.max(1, project.teamSizeNeeded)) * 100)
            );
            const creatorPhoto = avatarMap.get(project.creatorId);

            return (
              <article
                key={project.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={project.creatorName}
                        photoURL={creatorPhoto}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {project.creatorName}
                        </p>
                        <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <CategoryIcon category={project.category} />
                          <span>{project.category}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-mono font-semibold tabular-nums shrink-0 ${
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
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 leading-snug">
                    {project.title}
                  </h2>

                  <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>

                  {/* Required Skills with Color-Coded Chips */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {project.requiredSkills.map((skill) => {
                        const matched = coverage.matched.includes(skill);
                        return (
                          <span
                            key={skill}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border ${getSkillChipClasses(
                              skill,
                              matched
                            )}`}
                          >
                            {matched && <Check className="w-3 h-3 shrink-0" />}
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                    {coverage.matched.length > 0 && (
                      <p className="text-[11px] font-medium text-emerald-700 font-mono tabular-nums">
                        {coverage.matched.length}/{project.requiredSkills.length} required skills matched
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer with Capacity Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 max-w-[200px] space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono tabular-nums font-medium">
                        {project.currentMembers.length}/{project.teamSizeNeeded} spots
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{project.status}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${fillRatio}%` }}
                      />
                    </div>
                  </div>

                  {isMember ? (
                    <button
                      type="button"
                      onClick={() => setActiveView('workspaces')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Open Workspace
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isFull || joiningId === project.id}
                      onClick={() => handleJoin(project.id)}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {isFull
                        ? 'Team Full'
                        : joiningId === project.id
                          ? 'Joining...'
                          : 'Apply to Join'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
