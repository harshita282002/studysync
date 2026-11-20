import React, { useMemo, useState } from 'react';
import { ArrowUpDown, BadgeCheck, Compass, Search, Send, Sparkles, Star } from 'lucide-react';
import { useStudySync } from '../services/studySyncStore';
import type { AvailabilityStatus, PeerProfile } from '../types/studysync';
import {
  getFallbackGradientTheme,
  getSkillChipClasses,
  getSkillTone,
} from '../utils/avatar';
import { calculateMatchScore, SKILL_CATALOG } from '../utils/matching';
import { Avatar } from './Avatar';

interface PeerDirectoryViewProps {
  onRequestTeamUp: (peer: PeerProfile, score: number, complementary: string[]) => void;
}

type SkillGroupFilter = 'All' | 'Finance & Strategy' | 'Tech & Data' | 'Design & Comms';
type AvailabilityFilter = 'All' | AvailabilityStatus;
type SortOption = 'match' | 'reliability' | 'completed';

export const PeerDirectoryView: React.FC<PeerDirectoryViewProps> = ({ onRequestTeamUp }) => {
  const { currentUser, peers, matchRequests, globalSearch, setGlobalSearch, isLoadingData } =
    useStudySync();

  const [groupFilter, setGroupFilter] = useState<SkillGroupFilter>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('All');
  const [minReliability, setMinReliability] = useState<'all' | '4.8'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('match');

  const userSkills = currentUser?.skills || [];

  const sentPeerIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of matchRequests) {
      if (r.senderId === currentUser?.uid && r.status === 'Pending') {
        set.add(r.receiverId);
      }
    }
    return set;
  }, [matchRequests, currentUser?.uid]);

  const skillGroupLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of SKILL_CATALOG) {
      map.set(item.name.toLowerCase(), item.group);
    }
    return map;
  }, []);

  const filteredPeers = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();

    return peers
      .filter((p) => p.uid !== currentUser?.uid)
      .map((peer) => ({
        peer,
        analysis: calculateMatchScore(
          userSkills,
          peer.skills,
          peer.availabilityStatus,
          peer.reliabilityScore,
          peer.isProMember
        ),
      }))
      .filter(({ peer }) => {
        if (availabilityFilter !== 'All' && peer.availabilityStatus !== availabilityFilter) {
          return false;
        }
        if (minReliability === '4.8' && peer.reliabilityScore < 4.8) {
          return false;
        }
        if (groupFilter !== 'All') {
          const hasGroupSkill = peer.skills.some(
            (s) => skillGroupLookup.get(s.name.toLowerCase()) === groupFilter
          );
          if (!hasGroupSkill) return false;
        }
        if (q) {
          const haystack = [
            peer.name,
            peer.program,
            peer.campusCluster,
            peer.bio,
            ...peer.skills.map((s) => s.name),
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'reliability') {
          return b.peer.reliabilityScore - a.peer.reliabilityScore;
        }
        if (sortBy === 'completed') {
          return b.peer.completedProjects - a.peer.completedProjects;
        }
        if (b.peer.isProMember !== a.peer.isProMember) {
          return (
            b.analysis.score +
            (b.peer.isProMember ? 3 : 0) -
            (a.analysis.score + (a.peer.isProMember ? 3 : 0))
          );
        }
        return b.analysis.score - a.analysis.score;
      });
  }, [
    availabilityFilter,
    currentUser?.uid,
    globalSearch,
    groupFilter,
    minReliability,
    peers,
    skillGroupLookup,
    sortBy,
    userSkills,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Peer Directory</h1>
          <p className="text-sm text-slate-600 mt-1">
            Sorted by Complementary Match %—prioritizing peers who bring skills your profile lacks.
          </p>
        </div>
        <p className="text-xs font-mono text-slate-500 tabular-nums">
          {filteredPeers.length} peers shown
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="relative sm:hidden">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            aria-label="Search peers and skills"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search peers or skills..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
          />
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Skill Category Segmented Buttons */}
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by skill category">
            {(['All', 'Finance & Strategy', 'Tech & Data', 'Design & Comms'] as SkillGroupFilter[]).map(
              (group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setGroupFilter(group)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    groupFilter === group
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {group}
                </button>
              )
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                aria-label="Sort peers by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-xs font-medium bg-transparent text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="match">Sort: Highest Match %</option>
                <option value="reliability">Sort: Reliability</option>
                <option value="completed">Sort: Most Completed</option>
              </select>
            </div>

            <select
              aria-label="Filter by availability"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="All">All Availability</option>
              <option value="Available Now">Available Now</option>
              <option value="Open for Weekends">Open for Weekends</option>
              <option value="Busy">Busy</option>
            </select>

            <button
              type="button"
              onClick={() => setMinReliability((prev) => (prev === 'all' ? '4.8' : 'all'))}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                minReliability === '4.8'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              4.8+ Reliability
            </button>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="h-14 shimmer-skeleton" />
              <div className="p-6 space-y-3">
                <div className="h-5 w-40 rounded shimmer-skeleton" />
                <div className="h-4 w-full rounded shimmer-skeleton" />
                <div className="h-4 w-2/3 rounded shimmer-skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPeers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <Compass className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No matching peers found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Try clearing your search query or adjusting the skill category and availability filters to discover more campus teammates.
          </p>
          <button
            type="button"
            onClick={() => {
              setGroupFilter('All');
              setAvailabilityFilter('All');
              setMinReliability('all');
              setSortBy('match');
              setGlobalSearch('');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPeers.map(({ peer, analysis }) => {
            const alreadyInvited = sentPeerIds.has(peer.uid);
            const primaryTone = peer.skills[0] ? getSkillTone(peer.skills[0].name) : 'finance';
            const bannerGradient =
              primaryTone === 'tech'
                ? 'from-indigo-500/15 via-violet-500/10 to-slate-50'
                : primaryTone === 'finance'
                  ? 'from-emerald-500/15 via-teal-500/10 to-slate-50'
                  : getFallbackGradientTheme(peer.name).bannerClass;

            const isHighMatch = analysis.score >= 85;

            return (
              <article
                key={peer.uid}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-indigo-200 transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Subtle Gradient Top Banner */}
                  <div
                    className={`h-14 bg-gradient-to-r ${bannerGradient} border-b border-slate-100 px-5 pt-3 flex items-start justify-end`}
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold font-mono tabular-nums rounded-full border ${
                        isHighMatch
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_14px_-2px_rgba(16,185,129,0.38)]'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-[0_0_14px_-2px_rgba(79,70,229,0.32)]'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 shrink-0" />
                      {analysis.score}% Skill Match
                    </span>
                  </div>

                  {/* Overlapping Avatar + Identity */}
                  <div className="px-6 pb-5">
                    <div className="-mt-7 mb-3 flex items-end justify-between gap-3">
                      <div className="rounded-full ring-4 ring-white bg-white">
                        <Avatar
                          name={peer.name}
                          photoURL={peer.photoURL}
                          size="lg"
                          isProMember={peer.isProMember}
                          availabilityStatus={peer.availabilityStatus}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 pb-1">
                        {peer.campusCluster}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <h2 className="text-base font-bold text-slate-900 truncate">
                        {peer.name}
                      </h2>
                      {peer.isProMember && (
                        <BadgeCheck
                          className="w-4 h-4 text-indigo-600 shrink-0"
                          aria-label="Pro Verified"
                        />
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{peer.program}</p>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mt-3">
                      {peer.bio}
                    </p>

                    {/* Color-Coded Skill Chips */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {peer.skills.map((skill) => {
                          const isComplementary = analysis.complementarySkills.includes(skill.name);
                          return (
                            <span
                              key={skill.name}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border ${getSkillChipClasses(
                                skill.name,
                                isComplementary
                              )}`}
                            >
                              {isComplementary && <Sparkles className="w-3 h-3 shrink-0" />}
                              {skill.name} · {skill.proficiency}
                            </span>
                          );
                        })}
                      </div>
                      {analysis.complementarySkills.length > 0 && (
                        <p className="text-[11px] text-emerald-700 font-medium">
                          {analysis.complementarySkills.length} complementary skill
                          {analysis.complementarySkills.length > 1 ? 's' : ''} your profile lacks
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Row */}
                <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span
                      className={`font-semibold whitespace-nowrap ${
                        peer.availabilityStatus === 'Available Now'
                          ? 'text-emerald-700'
                          : peer.availabilityStatus === 'Open for Weekends'
                            ? 'text-amber-700'
                            : 'text-slate-500'
                      }`}
                    >
                      {peer.availabilityStatus}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums whitespace-nowrap">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      {peer.reliabilityScore.toFixed(1)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums whitespace-nowrap">{peer.completedProjects} done</span>
                  </div>

                  <button
                    type="button"
                    disabled={alreadyInvited}
                    onClick={() =>
                      onRequestTeamUp(peer, analysis.score, analysis.complementarySkills)
                    }
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 w-full sm:w-auto ${
                      alreadyInvited
                        ? 'bg-slate-100 text-slate-500 cursor-default'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs cursor-pointer'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {alreadyInvited ? 'Request Sent' : 'Request to Team Up'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
