import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { CollaborationBoardView } from './components/CollaborationBoardView';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingAuthView } from './components/LandingAuthView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { PeerDirectoryView } from './components/PeerDirectoryView';
import { PostProjectModal } from './components/PostProjectModal';
import { ProfileAndPlanView } from './components/ProfileAndPlanView';
import { ProfilePhotoModal } from './components/ProfilePhotoModal';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { RequestTeamUpModal } from './components/RequestTeamUpModal';
import { ToastContainer } from './components/ToastContainer';
import { WorkspacesView } from './components/WorkspacesView';
import { StudySyncProvider, useStudySync } from './services/studySyncStore';
import type { PeerProfile } from './types/studysync';

const StudySyncAppContent: React.FC = () => {
  const {
    authReady,
    authMode,
    currentUser,
    needsOnboarding,
    activeView,
    projects,
    createProjectPost,
    sendMatchRequest,
    upgradeToPro,
  } = useStudySync();

  const [postModalOpen, setPostModalOpen] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [teamUpTarget, setTeamUpTarget] = useState<{
    peer: PeerProfile;
    score: number;
    complementary: string[];
  } | null>(null);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p
            className="text-xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            StudySync
          </p>
          <p className="text-sm text-slate-500">Connecting to campus workspace...</p>
        </div>
      </div>
    );
  }

  if (authMode === 'none' || !currentUser) {
    return <LandingAuthView />;
  }

  return (
    <>
      {needsOnboarding ? (
        <OnboardingWizard onOpenPhotoModal={() => setPhotoModalOpen(true)} />
      ) : (
        <AppShell
          onOpenPostProject={() => setPostModalOpen(true)}
          onOpenPhotoModal={() => setPhotoModalOpen(true)}
        >
          {activeView === 'dashboard' && (
            <DashboardView
              onRequestTeamUp={(peer, score, complementary) =>
                setTeamUpTarget({ peer, score, complementary })
              }
              onOpenPostProject={() => setPostModalOpen(true)}
              onOpenProUpgrade={() => setProModalOpen(true)}
            />
          )}
          {activeView === 'directory' && (
            <PeerDirectoryView
              onRequestTeamUp={(peer, score, complementary) =>
                setTeamUpTarget({ peer, score, complementary })
              }
            />
          )}
          {activeView === 'board' && (
            <CollaborationBoardView onOpenPostProject={() => setPostModalOpen(true)} />
          )}
          {activeView === 'workspaces' && <WorkspacesView />}
          {activeView === 'profile' && (
            <ProfileAndPlanView
              onOpenProUpgrade={() => setProModalOpen(true)}
              onOpenPhotoModal={() => setPhotoModalOpen(true)}
            />
          )}
        </AppShell>
      )}

      <PostProjectModal
        open={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSubmit={createProjectPost}
      />

      <RequestTeamUpModal
        peer={teamUpTarget?.peer || null}
        projects={projects}
        matchScore={teamUpTarget?.score || 0}
        complementarySkills={teamUpTarget?.complementary || []}
        onClose={() => setTeamUpTarget(null)}
        onSubmit={sendMatchRequest}
      />

      <ProUpgradeModal
        open={proModalOpen}
        isProMember={currentUser.isProMember}
        userName={currentUser.name}
        userEmail={currentUser.email}
        lastPaymentId={currentUser.lastPaymentId}
        onClose={() => setProModalOpen(false)}
        onPaymentSuccess={upgradeToPro}
      />

      <ProfilePhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
      />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StudySyncProvider>
        <StudySyncAppContent />
        <ToastContainer />
      </StudySyncProvider>
    </ErrorBoundary>
  );
}
