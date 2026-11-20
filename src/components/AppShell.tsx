import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Camera,
  Check,
  Columns3,
  Compass,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  UserCircle,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useStudySync } from '../services/studySyncStore';
import type { AppView } from '../types/studysync';
import { buildAvatarLookup } from '../utils/avatar';
import { Avatar } from './Avatar';
import { BrandMark } from './BrandMark';

interface AppShellProps {
  onOpenPostProject: () => void;
  onOpenPhotoModal: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  id: AppView;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'directory', label: 'Peer Directory', shortLabel: 'Peers', icon: Compass },
  { id: 'board', label: 'Collaboration Board', shortLabel: 'Board', icon: FolderKanban },
  { id: 'workspaces', label: 'Team Workspaces', shortLabel: 'Teams', icon: Columns3 },
  { id: 'profile', label: 'My Profile & Plan', shortLabel: 'Profile', icon: UserCircle },
];

export const AppShell: React.FC<AppShellProps> = ({
  onOpenPostProject,
  onOpenPhotoModal,
  children,
}) => {
  const {
    currentUser,
    peers,
    activeView,
    setActiveView,
    globalSearch,
    setGlobalSearch,
    matchRequests,
    workspaces,
    respondToMatchRequest,
    signOutUser,
  } = useStudySync();

  const [notifOpen, setNotifOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const avatarMap = useMemo(() => buildAvatarLookup(currentUser, peers), [currentUser, peers]);

  const pendingIncoming = matchRequests.filter(
    (r) => r.receiverId === currentUser?.uid && r.status === 'Pending'
  );

  const handleSearchChange = (val: string) => {
    setGlobalSearch(val);
    if (val.trim() && activeView === 'dashboard') {
      setActiveView('directory');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-16 px-5 flex items-center border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 cursor-pointer whitespace-nowrap"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <BrandMark className="w-7 h-7 shrink-0" />
            <span>StudySync</span>
          </button>
        </div>

        <nav aria-label="Primary navigation" className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            const badgeCount =
              item.id === 'profile'
                ? pendingIncoming.length
                : item.id === 'workspaces'
                  ? workspaces.length
                  : 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-[inset_0_0_0_1px_rgba(79,70,229,0.16)]'
                    : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {badgeCount > 0 && (
                  <span
                    className={`text-xs font-mono font-semibold tabular-nums ${
                      item.id === 'profile' ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/70">
          {currentUser && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenPhotoModal}
                aria-label="Change Profile Photo"
                className="relative group cursor-pointer rounded-full shrink-0"
              >
                <Avatar
                  name={currentUser.name}
                  photoURL={currentUser.photoURL}
                  size="sm"
                  isProMember={currentUser.isProMember}
                  availabilityStatus={currentUser.availabilityStatus}
                />
                <span className="absolute inset-0 rounded-full bg-slate-900/45 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('profile')}
                className="min-w-0 flex-1 text-left rounded-lg p-1 -m-1 hover:bg-white transition-colors cursor-pointer"
              >
                <p className="text-sm font-semibold text-slate-900 truncate flex items-center gap-1">
                  <span className="truncate">{currentUser.name}</span>
                  {currentUser.isProMember && (
                    <BadgeCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  )}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {currentUser.program} · {currentUser.campusCluster}
                </p>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={signOutUser}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-16 md:pb-0">
        {/* Frosted Glass Sticky Top Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:hidden">
            <BrandMark className="w-6 h-6 shrink-0" />
            <span
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              StudySync
            </span>
          </div>

          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Global search across peers and projects"
              value={globalSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search skills, peers, or projects..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50/90 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenPostProject}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Post Project</span>
              <span className="sm:hidden">Post</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen(false);
                  setNotifOpen((prev) => !prev);
                }}
                aria-label={`Notifications (${pendingIncoming.length} pending requests)`}
                aria-expanded={notifOpen}
                className="relative p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {pendingIncoming.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                    {pendingIncoming.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-semibold text-slate-900">
                      Incoming Teammate Requests
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      aria-label="Close notifications"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {pendingIncoming.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                      No pending teammate invitations right now.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                      {pendingIncoming.map((req) => (
                        <div key={req.id} className="p-4 space-y-2.5">
                          <div className="flex items-start gap-3">
                            <Avatar
                              name={req.senderName}
                              photoURL={avatarMap.get(req.senderId)}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {req.senderName}
                              </p>
                              {req.projectTitle && (
                                <p className="text-xs text-indigo-600 font-medium truncate">
                                  {req.projectTitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{req.message}</p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={async () => {
                                await respondToMatchRequest(req, 'Accepted');
                                setNotifOpen(false);
                                setActiveView('workspaces');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept & Open Workspace
                            </button>
                            <button
                              type="button"
                              onClick={() => respondToMatchRequest(req, 'Declined')}
                              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Top Navbar Avatar Menu (DP Studio + Profile) */}
            {currentUser && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    setAccountMenuOpen((prev) => !prev);
                  }}
                  aria-label="Open profile and photo menu"
                  aria-expanded={accountMenuOpen}
                  className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-indigo-600 hover:ring-2 hover:ring-indigo-500/30 transition-all"
                >
                  <Avatar
                    name={currentUser.name}
                    photoURL={currentUser.photoURL}
                    size="sm"
                    isProMember={currentUser.isProMember}
                    availabilityStatus={currentUser.availabilityStatus}
                  />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden py-1.5">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        onOpenPhotoModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Change Profile Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setActiveView('profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors"
                    >
                      <UserCircle className="w-3.5 h-3.5" />
                      My Profile & Plan
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        void signOutUser();
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white/90 backdrop-blur-md border-t border-slate-200 z-30 grid grid-cols-5"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium cursor-pointer transition-colors ${
                active ? 'text-indigo-600 font-semibold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-full px-1">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
