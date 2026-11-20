import React, { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Columns3,
  Compass,
  FolderKanban,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useStudySync } from '../services/studySyncStore';
import { Avatar } from './Avatar';
import { BrandMark } from './BrandMark';

type PreviewPreset = 'case' | 'hackathon' | 'term';

const PREVIEW_SQUADS: Record<
  PreviewPreset,
  {
    title: string;
    spots: string;
    summary: string;
    peers: { name: string; meta: string; match: number; pro?: boolean; photoURL: string }[];
    openRole: string;
    openNeed: string;
  }
> = {
  case: {
    title: 'DGU Venture Quest Squad',
    spots: '3/4 spots filled',
    summary: 'Balances Finance + Tech + Pitch',
    peers: [
      {
        name: 'Ananya Verma',
        meta: '1st Year MBA · PPT Pitch Design, Public Speaking',
        match: 96,
        pro: true,
        photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Ananya&backgroundColor=fffbeb',
      },
      {
        name: 'Aarav Sharma',
        meta: 'B.Tech CS · Python / Coding, React / Frontend',
        match: 93,
        pro: true,
        photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aarav&backgroundColor=ecfdf5',
      },
      {
        name: 'Rohan Malhotra',
        meta: 'M.Sc Data Science · Data Analytics, SQL',
        match: 89,
        photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Rohan&backgroundColor=f0f9ff',
      },
    ],
    openRole: 'Open Slot #4 · Finance Lead',
    openNeed: 'Looking for Financial Modeling & Unit Economics',
  },
  hackathon: {
    title: 'Campus AI Sustainability Hack',
    spots: '2/4 spots filled',
    summary: 'Balances ML + UI + GTM Story',
    peers: [
      {
        name: 'Aarav Sharma',
        meta: 'B.Tech CS · React / Frontend, Python / Coding',
        match: 95,
        pro: true,
        photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aarav&backgroundColor=ecfdf5',
      },
      {
        name: 'Kabir Joshi',
        meta: 'BBA Analytics · Product Management, Market Research',
        match: 88,
        photoURL: 'https://api.dicebear.com/9.x/micah/svg?seed=Kabir&backgroundColor=ecfdf5',
      },
      {
        name: 'Siddharth Rawat',
        meta: '1st Year MBA · Public Speaking, Content Writing',
        match: 84,
        photoURL: 'https://api.dicebear.com/9.x/micah/svg?seed=Siddharth&backgroundColor=fffbeb',
      },
    ],
    openRole: 'Open Slot #4 · Strategy Lead',
    openNeed: 'Looking for Case Strategy & Financial Impact',
  },
  term: {
    title: 'Corporate Valuation & M&A Term Paper',
    spots: '2/3 spots filled',
    summary: 'Balances Valuation + Regression + Deck',
    peers: [
      {
        name: 'Meera Nair',
        meta: '2nd Year MBA · Financial Modeling, Market Research',
        match: 92,
        pro: true,
        photoURL: 'https://api.dicebear.com/9.x/micah/svg?seed=Meera&backgroundColor=eef2ff',
      },
      {
        name: 'Rohan Malhotra',
        meta: 'M.Sc Data Science · Statistical Analysis, SQL',
        match: 90,
        photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Rohan&backgroundColor=f0f9ff',
      },
      {
        name: 'Ananya Verma',
        meta: '1st Year MBA · PPT Pitch Design, Writing',
        match: 86,
        pro: true,
        photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Ananya&backgroundColor=fffbeb',
      },
    ],
    openRole: 'Open Slot #3 · Quantitative Analyst',
    openNeed: 'Looking for Econometrics & Data Visualization',
  },
};

export const LandingAuthView: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsDemoGuest,
    authError,
    clearAuthError,
  } = useStudySync();

  const [previewTab, setPreviewTab] = useState<PreviewPreset>('case');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activePreview = PREVIEW_SQUADS[previewTab];

  const openModal = (tab: 'signin' | 'signup' = 'signin') => {
    clearAuthError();
    setLocalError(null);
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (authTab === 'signup' && name.trim().length < 2) {
      setLocalError('Please enter your full name.');
      return;
    }
    if (!email.includes('@')) {
      setLocalError('Please enter a valid university or personal email.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      if (authTab === 'signup') {
        await signUpWithEmail(name, email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDemoGuest = async () => {
    setBusy(true);
    try {
      await signInAsDemoGuest();
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Frosted Glass Sticky Top Bar: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <BrandMark className="w-7 h-7" />
            <span>StudySync</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#how-it-works"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#matching-engine"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Matching Engine
            </a>
            <a
              href="#pro-tier"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Pro Tier
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => openModal('signin')}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split */}
        <section className="hero-grid-bg border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 flex flex-col justify-center">
                <p className="text-sm font-semibold text-indigo-600 mb-3">
                  Built for MBA & postgraduate campus teams · DGU & Dehradun clusters
                </p>
                <h1
                  className="font-bold tracking-tight text-slate-900 leading-[1.12] mb-5"
                  style={{
                    fontSize: 'clamp(2.25rem, 3.6vw, 3.35rem)',
                    textWrap: 'balance',
                  }}
                >
                  Stop wasting hours on chaotic WhatsApp groups—find verified peers with complementary skills in 2 minutes.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mb-8">
                  Assemble balanced teams for national case competitions, hackathons, semester projects, and peer study pods with transparent skill visibility and persistent Kanban workspaces.
                </p>

                <div className="flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDemoGuest}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Quick Demo Guest Login
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openModal('signup')}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Create Student Profile
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200/90 grid grid-cols-3 gap-6 max-w-lg">
                  <div>
                    <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">2 min</p>
                    <p className="text-xs text-slate-500 mt-0.5">Profile & skill setup</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">6 skills</p>
                    <p className="text-xs text-slate-500 mt-0.5">Verified proficiency tags</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">100%</p>
                    <p className="text-xs text-slate-500 mt-0.5">Real-time sync</p>
                  </div>
                </div>
              </div>

              {/* Right Column Interactive Architectural Preview */}
              <div className="lg:col-span-5">
                <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Complementary Skill Engine</p>
                        <h2 className="text-base font-bold text-slate-900 mt-0.5">
                          {activePreview.title}
                        </h2>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 font-mono tabular-nums shrink-0">
                        {activePreview.spots}
                      </span>
                    </div>

                    {/* Interactive Preset Switcher */}
                    <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg mt-4 mb-2" role="group" aria-label="Preview squad presets">
                      {(
                        [
                          { id: 'case', label: 'Case Comp' },
                          { id: 'hackathon', label: 'Hackathon' },
                          { id: 'term', label: 'Term Project' },
                        ] as { id: PreviewPreset; label: string }[]
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPreviewTab(tab.id)}
                          className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                            previewTab === tab.id
                              ? 'bg-white text-indigo-600 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="divide-y divide-slate-100 mt-1">
                      {activePreview.peers.map((peer) => (
                        <div key={peer.name} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              name={peer.name}
                              photoURL={peer.photoURL}
                              size="sm"
                              isProMember={peer.pro}
                              availabilityStatus="Available Now"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {peer.name}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{peer.meta}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 w-20">
                            <span className="text-xs font-semibold text-indigo-600 font-mono tabular-nums">
                              {peer.match}% Match
                            </span>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                style={{ width: `${peer.match}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="py-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-emerald-800 truncate">
                            {activePreview.openRole}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{activePreview.openNeed}</p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 shrink-0">
                          Open Now
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>{activePreview.summary}</span>
                    <button
                      type="button"
                      onClick={handleDemoGuest}
                      className="font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer whitespace-nowrap"
                    >
                      Try live directory →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-white py-16 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Structured team formation built for campus deadlines
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Replace unstructured chat broadcasts with transparent skill profiles, instant filtering, and shared task execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  01. Complementary Matching
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tag up to 6 skills with proficiency levels. Our matching engine highlights peers who bring the exact capabilities your team is missing.
                </p>
              </div>

              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  02. Live Noticeboard
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Browse open calls across Case Competitions, Hackathons, Semester Projects, and Study Groups with real-time spots remaining and deadline countdowns.
                </p>
              </div>

              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Columns3 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  03. Persistent Workspaces
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Once a match request is accepted or you join a project, unlock a dedicated Kanban board and shared resource scratchpad synced across sessions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Matching Engine + Pro Tier */}
        <section id="matching-engine" className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 text-slate-900 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold">Built around real academic roles</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Strong case teams combine quantitative modeling, clear narrative slides, and technical execution. StudySync surfaces peers across MBA, B.Tech, and Data Science cohorts.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl">
                    <p className="font-semibold text-emerald-700">Finance & Strategy</p>
                    <p className="text-xs text-slate-500 mt-1">Financial Modeling, Case Strategy, Market Research</p>
                  </div>
                  <div className="p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl">
                    <p className="font-semibold text-indigo-700">Tech & Analytics</p>
                    <p className="text-xs text-slate-500 mt-1">Python / Coding, Data Analytics, SQL, React</p>
                  </div>
                  <div className="p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl">
                    <p className="font-semibold text-amber-700">Pitch & Story</p>
                    <p className="text-xs text-slate-500 mt-1">PPT Pitch Design, Public Speaking, Writing</p>
                  </div>
                  <div className="p-3.5 bg-[#F8FAFC] border border-slate-200/80 rounded-xl">
                    <p className="font-semibold text-slate-900">Reliability Signal</p>
                    <p className="text-xs text-slate-500 mt-1">Verified campus projects & availability</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="pro-tier" className="bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#312E81] text-white rounded-2xl shadow-sm p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">StudySync Pro</h3>
                  </div>
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    ₹149/month
                  </span>
                </div>
                <p className="text-sm text-indigo-100/85 leading-relaxed mb-6">
                  Free core matching for every student. Upgrade to Pro via Razorpay before major competitions for priority placement and unlimited invites.
                </p>
                <ul className="space-y-2.5 text-sm text-slate-100 mb-6">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Priority search placement in Peer Directory</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited direct teammate invites across clusters</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>AI-recommended balanced team builder</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Verified Pro badge on profile & project calls</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-indigo-800/60">
                <button
                  type="button"
                  onClick={handleDemoGuest}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Explore in Demo Mode
                </button>
                <span className="text-xs text-indigo-200/80">No card required to try</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>StudySync · Campus Peer-Matching & Team-Building Platform</span>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Protected by Firebase Authentication & Cloud Firestore</span>
          </div>
        </div>
      </footer>

      {/* Sign-In / Sign-Up Modal */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAuthModalOpen(false);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 id="auth-modal-title" className="text-base font-bold text-slate-900">
                {authTab === 'signin' ? 'Sign in to StudySync' : 'Create your student account'}
              </h2>
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                aria-label="Close sign in modal"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Segmented Tab */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setLocalError(null);
                    clearAuthError();
                  }}
                  className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    authTab === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signup');
                    setLocalError(null);
                    clearAuthError();
                  }}
                  className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    authTab === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDemoGuest}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Quick Demo Guest Login
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <span className="border-t border-slate-200 w-full" />
                <span className="px-3 text-xs text-slate-400 bg-white whitespace-nowrap">
                  or with university email
                </span>
                <span className="border-t border-slate-200 w-full" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                {authTab === 'signup' && (
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-medium text-slate-700 mb-1">
                      Full name
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Harshita Chhetri"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-medium text-slate-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@dgu.ac.in"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="auth-password" className="block text-xs font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {(localError || authError) && (
                  <p className="text-xs text-rose-600 leading-relaxed">{localError || authError}</p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {busy
                    ? 'Please wait...'
                    : authTab === 'signin'
                      ? 'Sign In with Email'
                      : 'Create Student Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
