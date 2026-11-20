import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  storage,
  testFirestoreConnection,
} from '../lib/firebase';
import {
  createDefaultDemoUser,
  createSeedMatchRequests,
  createSeedPeers,
  createSeedProjects,
  createSeedWorkspaces,
  DEMO_GUEST_UID,
} from '../data/seedData';
import type {
  AppView,
  AvailabilityStatus,
  MatchRequest,
  PaymentReceipt,
  PeerProfile,
  ProjectBoard,
  ProjectCategory,
  SkillTag,
  TaskStatus,
  TeamWorkspace,
  ToastMessage,
  UserProfile,
  WorkspaceLink,
  WorkspaceTask,
} from '../types/studysync';

const DEMO_STORAGE_KEY = 'studysync_demo_state_v1';

interface DemoPersistedState {
  active: boolean;
  user: UserProfile;
  peers: PeerProfile[];
  projects: ProjectBoard[];
  matchRequests: MatchRequest[];
  workspaces: TeamWorkspace[];
  payments?: PaymentReceipt[];
}

function toIsoString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function sanitizeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

interface StudySyncContextValue {
  authReady: boolean;
  isLoadingData: boolean;
  authMode: 'none' | 'firebase' | 'demo';
  currentUser: UserProfile | null;
  needsOnboarding: boolean;
  peers: PeerProfile[];
  projects: ProjectBoard[];
  matchRequests: MatchRequest[];
  workspaces: TeamWorkspace[];
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  toasts: ToastMessage[];
  pushToast: (title: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signInAsDemoGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
  saveUserProfile: (updates: {
    name: string;
    program: string;
    campusCluster: string;
    bio: string;
    skills: SkillTag[];
    availabilityStatus: AvailabilityStatus;
  }) => Promise<void>;
  updateUserPhoto: (input: {
    photoURL?: string;
    blob?: Blob;
    dataUrl?: string;
  }) => Promise<string>;
  upgradeToPro: (razorpayPaymentId: string) => Promise<void>;
  createProjectPost: (input: {
    title: string;
    category: ProjectCategory;
    description: string;
    requiredSkills: string[];
    deadline: string;
    teamSizeNeeded: number;
  }) => Promise<void>;
  applyToJoinProject: (project: ProjectBoard) => Promise<void>;
  sendMatchRequest: (input: {
    receiver: PeerProfile;
    message: string;
    project?: ProjectBoard;
  }) => Promise<void>;
  respondToMatchRequest: (request: MatchRequest, decision: 'Accepted' | 'Declined') => Promise<void>;
  addWorkspaceTask: (workspaceId: string, title: string, assignee: string) => Promise<void>;
  moveWorkspaceTask: (workspaceId: string, taskId: string, nextStatus: TaskStatus) => Promise<void>;
  deleteWorkspaceTask: (workspaceId: string, taskId: string) => Promise<void>;
  addWorkspaceLink: (workspaceId: string, label: string, url: string) => Promise<void>;
  removeWorkspaceLink: (workspaceId: string, linkId: string) => Promise<void>;
  updateWorkspaceNotes: (workspaceId: string, notes: string) => Promise<void>;
}

const StudySyncContext = createContext<StudySyncContextValue | null>(null);

export function useStudySync(): StudySyncContextValue {
  const ctx = useContext(StudySyncContext);
  if (!ctx) {
    throw new Error('useStudySync must be used within StudySyncProvider');
  }
  return ctx;
}

function loadDemoState(): DemoPersistedState | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoPersistedState;
    if (parsed && parsed.active && parsed.user) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveDemoState(state: DemoPersistedState): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function clearDemoState(): void {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export const StudySyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [authMode, setAuthMode] = useState<'none' | 'firebase' | 'demo'>('none');
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [projects, setProjects] = useState<ProjectBoard[]>([]);
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([]);
  const [workspaces, setWorkspaces] = useState<TeamWorkspace[]>([]);

  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);

  const sentReqRef = useRef<MatchRequest[]>([]);
  const receivedReqRef = useRef<MatchRequest[]>([]);

  const pushToast = useCallback((title: string, type: ToastMessage['type'] = 'success') => {
    const id = sanitizeId('toast');
    setToasts((prev) => [...prev.slice(-3), { id, title, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const activateDemoSession = useCallback((existing?: DemoPersistedState | null) => {
    const demoUser = existing?.user ?? createDefaultDemoUser();
    const initial: DemoPersistedState = existing ?? {
      active: true,
      user: demoUser,
      peers: createSeedPeers(demoUser.uid),
      projects: createSeedProjects(demoUser.uid),
      matchRequests: createSeedMatchRequests(demoUser.uid, demoUser.name),
      workspaces: createSeedWorkspaces(demoUser.uid, demoUser.name),
    };
    saveDemoState(initial);
    setAuthMode('demo');
    setCurrentUser(initial.user);
    setPeers(initial.peers);
    setProjects(initial.projects);
    setMatchRequests(initial.matchRequests);
    setWorkspaces(initial.workspaces);
    setNeedsOnboarding(false);
    setAuthReady(true);
    setIsLoadingData(false);
  }, []);

  // Sync demo state mutations back to localStorage whenever in demo mode
  const persistDemoSnapshot = useCallback(
    (patch: Partial<Omit<DemoPersistedState, 'active'>>) => {
      if (authMode !== 'demo') return;
      const existingDemo = loadDemoState();
      const next: DemoPersistedState = {
        active: true,
        user: patch.user ?? currentUser ?? createDefaultDemoUser(),
        peers: patch.peers ?? peers,
        projects: patch.projects ?? projects,
        matchRequests: patch.matchRequests ?? matchRequests,
        workspaces: patch.workspaces ?? workspaces,
        payments: patch.payments ?? existingDemo?.payments ?? [],
      };
      saveDemoState(next);
    },
    [authMode, currentUser, peers, projects, matchRequests, workspaces]
  );

  // Seed Firestore once if empty when authenticated with Firebase
  const seedFirestoreIfEmpty = useCallback(async (uid: string) => {
    try {
      const peerCheck = await getDocs(query(collection(db, 'peerProfiles'), limit(1)));
      if (peerCheck.empty) {
        const batch = writeBatch(db);
        for (const p of createSeedPeers(uid)) {
          batch.set(doc(db, 'peerProfiles', p.uid), {
            ...p,
            ownerUid: uid,
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }

      const projCheck = await getDocs(query(collection(db, 'projectBoards'), limit(1)));
      if (projCheck.empty) {
        const batch = writeBatch(db);
        for (const proj of createSeedProjects(uid)) {
          batch.set(doc(db, 'projectBoards', proj.id), {
            ...proj,
            ownerUid: uid,
            createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'peerProfiles/seed');
    }
  }, []);

  // Boot connection test + auth state listener
  useEffect(() => {
    void testFirestoreConnection();

    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setAuthMode('firebase');
        setIsLoadingData(true);
        try {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            setCurrentUser({
              uid: data.uid,
              name: data.name,
              email: data.email,
              program: data.program,
              campusCluster: data.campusCluster,
              bio: data.bio || '',
              photoURL: data.photoURL ? String(data.photoURL) : user.photoURL || undefined,
              skills: Array.isArray(data.skills) ? data.skills : [],
              availabilityStatus: data.availabilityStatus || 'Available Now',
              isProMember: Boolean(data.isProMember),
              proActivatedAt: data.proActivatedAt ? toIsoString(data.proActivatedAt) : undefined,
              lastPaymentId: data.lastPaymentId ? String(data.lastPaymentId) : undefined,
              reliabilityScore: Number(data.reliabilityScore ?? 4.8),
              completedProjects: Number(data.completedProjects ?? 0),
              createdAt: toIsoString(data.createdAt),
            });
            setNeedsOnboarding(false);
          } else {
            // New Firebase user -> needs onboarding unless anonymous quick guest
            const draftName = user.displayName || (user.isAnonymous ? 'Campus Guest' : 'Student Peer');
            setCurrentUser({
              uid: user.uid,
              name: draftName,
              email: user.email || `${user.uid.slice(0, 8)}@campus.edu`,
              program: '1st Year MBA',
              campusCluster: 'DGU Campus',
              bio: '',
              photoURL: user.photoURL || undefined,
              skills: [],
              availabilityStatus: 'Available Now',
              isProMember: false,
              reliabilityScore: 4.8,
              completedProjects: 0,
              createdAt: new Date().toISOString(),
            });
            setNeedsOnboarding(!autostart);
          }
          await seedFirestoreIfEmpty(user.uid);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        } finally {
          setIsLoadingData(false);
          setAuthReady(true);
        }
      } else {
        setFirebaseUser(null);
        const savedDemo = loadDemoState();
        if (savedDemo) {
          activateDemoSession(savedDemo);
        } else if (autostart) {
          activateDemoSession(null);
        } else {
          setAuthMode('none');
          setCurrentUser(null);
          setNeedsOnboarding(false);
          setAuthReady(true);
        }
      }
    });

    return () => unsubAuth();
  }, [activateDemoSession, seedFirestoreIfEmpty]);

  // Attach real-time Firestore listeners when authenticated in Firebase mode
  useEffect(() => {
    if (authMode !== 'firebase' || !firebaseUser) return;
    const uid = firebaseUser.uid;

    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCurrentUser({
            uid: data.uid,
            name: data.name,
            email: data.email,
            program: data.program,
            campusCluster: data.campusCluster,
            bio: data.bio || '',
            photoURL: data.photoURL ? String(data.photoURL) : firebaseUser.photoURL || undefined,
            skills: Array.isArray(data.skills) ? data.skills : [],
            availabilityStatus: data.availabilityStatus || 'Available Now',
            isProMember: Boolean(data.isProMember),
            proActivatedAt: data.proActivatedAt ? toIsoString(data.proActivatedAt) : undefined,
            lastPaymentId: data.lastPaymentId ? String(data.lastPaymentId) : undefined,
            reliabilityScore: Number(data.reliabilityScore ?? 4.8),
            completedProjects: Number(data.completedProjects ?? 0),
            createdAt: toIsoString(data.createdAt),
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const unsubPeers = onSnapshot(
      collection(db, 'peerProfiles'),
      (snap) => {
        const list: PeerProfile[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            uid: data.uid,
            ownerUid: data.ownerUid,
            isDemo: Boolean(data.isDemo),
            name: data.name,
            program: data.program,
            campusCluster: data.campusCluster,
            bio: data.bio || '',
            photoURL: data.photoURL ? String(data.photoURL) : undefined,
            skills: Array.isArray(data.skills) ? data.skills : [],
            availabilityStatus: data.availabilityStatus || 'Available Now',
            isProMember: Boolean(data.isProMember),
            reliabilityScore: Number(data.reliabilityScore ?? 4.8),
            completedProjects: Number(data.completedProjects ?? 0),
            createdAt: toIsoString(data.createdAt),
          };
        });
        setPeers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'peerProfiles')
    );

    const unsubProjects = onSnapshot(
      collection(db, 'projectBoards'),
      (snap) => {
        const list: ProjectBoard[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            creatorId: data.creatorId,
            ownerUid: data.ownerUid,
            creatorName: data.creatorName,
            title: data.title,
            category: data.category,
            description: data.description,
            requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills : [],
            deadline: data.deadline,
            teamSizeNeeded: Number(data.teamSizeNeeded ?? 4),
            currentMembers: Array.isArray(data.currentMembers) ? data.currentMembers : [],
            status: data.status || 'Open',
            createdAt: toIsoString(data.createdAt),
          };
        });
        setProjects(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'projectBoards')
    );

    const mergeRequests = () => {
      const merged = new Map<string, MatchRequest>();
      for (const r of sentReqRef.current) merged.set(r.id, r);
      for (const r of receivedReqRef.current) merged.set(r.id, r);
      setMatchRequests(
        Array.from(merged.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    };

    const mapReqDoc = (d: { id: string; data: () => Record<string, unknown> }): MatchRequest => {
      const data = d.data();
      return {
        id: String(data.id || d.id),
        senderId: String(data.senderId),
        senderName: String(data.senderName),
        receiverId: String(data.receiverId),
        receiverName: String(data.receiverName),
        projectId: data.projectId ? String(data.projectId) : undefined,
        projectTitle: data.projectTitle ? String(data.projectTitle) : undefined,
        message: String(data.message),
        status: (data.status as MatchRequest['status']) || 'Pending',
        createdAt: toIsoString(data.createdAt),
      };
    };

    const unsubSent = onSnapshot(
      query(collection(db, 'matchRequests'), where('senderId', '==', uid)),
      (snap) => {
        sentReqRef.current = snap.docs.map(mapReqDoc);
        mergeRequests();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'matchRequests/sent')
    );

    const unsubReceived = onSnapshot(
      query(collection(db, 'matchRequests'), where('receiverId', '==', uid)),
      (snap) => {
        receivedReqRef.current = snap.docs.map(mapReqDoc);
        mergeRequests();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'matchRequests/received')
    );

    const unsubWorkspaces = onSnapshot(
      query(collection(db, 'teamWorkspaces'), where('memberIds', 'array-contains', uid)),
      (snap) => {
        const list: TeamWorkspace[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            projectId: data.projectId,
            projectTitle: data.projectTitle,
            memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
            members: Array.isArray(data.members) ? data.members : [],
            tasks: Array.isArray(data.tasks) ? data.tasks : [],
            links: Array.isArray(data.links) ? data.links : [],
            notes: data.notes || '',
            updatedAt: toIsoString(data.updatedAt),
          };
        });
        setWorkspaces(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'teamWorkspaces')
    );

    return () => {
      unsubUser();
      unsubPeers();
      unsubProjects();
      unsubSent();
      unsubReceived();
      unsubWorkspaces();
    };
  }, [authMode, firebaseUser]);

  // Auth Actions
  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      pushToast('Signed in with Google');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setAuthError(msg);
    }
  }, [pushToast]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      try {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        pushToast('Welcome back to StudySync');
      } catch (err) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          setAuthError(
            'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method). Use Google Sign-In or Quick Demo Guest Login.'
          );
        } else {
          setAuthError(err instanceof Error ? err.message : 'Unable to sign in.');
        }
      }
    },
    [pushToast]
  );

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthError(null);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        pushToast('Account created! Complete your skill profile.');
      } catch (err) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          setAuthError(
            'Email/Password sign-up is not yet enabled in Firebase Console (Authentication → Sign-in method). Use Google Sign-In or Quick Demo Guest Login.'
          );
        } else {
          setAuthError(err instanceof Error ? err.message : 'Unable to create account.');
        }
      }
    },
    [pushToast]
  );

  const signInAsDemoGuest = useCallback(async () => {
    setAuthError(null);
    if (import.meta.env.VITE_ENABLE_ANON_AUTH === 'true') {
      try {
        await signInAnonymously(auth);
        pushToast('Demo guest session active in Firestore');
        return;
      } catch {
        // Fall through to persisted demo session
      }
    }
    activateDemoSession(loadDemoState());
    pushToast('Quick Demo session ready — explore DGU Campus peers!');
  }, [activateDemoSession, pushToast]);

  const signOutUser = useCallback(async () => {
    clearDemoState();
    if (firebaseUser) {
      await signOut(auth);
    }
    setAuthMode('none');
    setCurrentUser(null);
    setPeers([]);
    setProjects([]);
    setMatchRequests([]);
    setWorkspaces([]);
    setNeedsOnboarding(false);
    setActiveView('dashboard');
    pushToast('Signed out', 'info');
  }, [firebaseUser, pushToast]);

  // Profile Mutations
  const saveUserProfile = useCallback(
    async (updates: {
      name: string;
      program: string;
      campusCluster: string;
      bio: string;
      skills: SkillTag[];
      availabilityStatus: AvailabilityStatus;
    }) => {
      if (!currentUser) return;
      const updatedUser: UserProfile = {
        ...currentUser,
        ...updates,
      };

      if (authMode === 'demo') {
        setCurrentUser(updatedUser);
        setNeedsOnboarding(false);
        persistDemoSnapshot({ user: updatedUser });
        pushToast('Profile & skills saved!');
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const peerRef = doc(db, 'peerProfiles', currentUser.uid);
        const existingUser = await getDoc(userRef);

        if (!existingUser.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            name: updatedUser.name,
            email: updatedUser.email,
            program: updatedUser.program,
            campusCluster: updatedUser.campusCluster,
            bio: updatedUser.bio,
            ...(updatedUser.photoURL ? { photoURL: updatedUser.photoURL } : {}),
            skills: updatedUser.skills,
            availabilityStatus: updatedUser.availabilityStatus,
            isProMember: updatedUser.isProMember,
            reliabilityScore: updatedUser.reliabilityScore,
            completedProjects: updatedUser.completedProjects,
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(userRef, {
            name: updatedUser.name,
            program: updatedUser.program,
            campusCluster: updatedUser.campusCluster,
            bio: updatedUser.bio,
            ...(updatedUser.photoURL ? { photoURL: updatedUser.photoURL } : {}),
            skills: updatedUser.skills,
            availabilityStatus: updatedUser.availabilityStatus,
          });
        }

        const existingPeer = await getDoc(peerRef);
        if (!existingPeer.exists()) {
          await setDoc(peerRef, {
            uid: currentUser.uid,
            ownerUid: currentUser.uid,
            isDemo: false,
            name: updatedUser.name,
            program: updatedUser.program,
            campusCluster: updatedUser.campusCluster,
            bio: updatedUser.bio,
            ...(updatedUser.photoURL ? { photoURL: updatedUser.photoURL } : {}),
            skills: updatedUser.skills,
            availabilityStatus: updatedUser.availabilityStatus,
            isProMember: updatedUser.isProMember,
            reliabilityScore: updatedUser.reliabilityScore,
            completedProjects: updatedUser.completedProjects,
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(peerRef, {
            name: updatedUser.name,
            program: updatedUser.program,
            campusCluster: updatedUser.campusCluster,
            bio: updatedUser.bio,
            ...(updatedUser.photoURL ? { photoURL: updatedUser.photoURL } : {}),
            skills: updatedUser.skills,
            availabilityStatus: updatedUser.availabilityStatus,
          });
        }

        if (firebaseUser) {
          await updateProfile(firebaseUser, {
            displayName: updatedUser.name,
            ...(updatedUser.photoURL && updatedUser.photoURL.startsWith('http')
              ? { photoURL: updatedUser.photoURL }
              : {}),
          }).catch(() => {});
        }

        setCurrentUser(updatedUser);
        setNeedsOnboarding(false);
        pushToast('Profile & skills saved to Firestore!');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
      }
    },
    [authMode, currentUser, firebaseUser, persistDemoSnapshot, pushToast]
  );

  const updateUserPhoto = useCallback(
    async ({
      photoURL,
      blob,
      dataUrl,
    }: {
      photoURL?: string;
      blob?: Blob;
      dataUrl?: string;
    }): Promise<string> => {
      if (!currentUser) return '';

      let resolvedUrl = photoURL || dataUrl || '';

      if (authMode === 'demo') {
        const demoUrl = dataUrl || photoURL || '';
        const updatedUser: UserProfile = { ...currentUser, photoURL: demoUrl };
        const updatedPeers = peers.map((p) =>
          p.uid === currentUser.uid ? { ...p, photoURL: demoUrl } : p
        );
        setCurrentUser(updatedUser);
        setPeers(updatedPeers);
        persistDemoSnapshot({ user: updatedUser, peers: updatedPeers });
        pushToast('Profile photo updated!');
        return demoUrl;
      }

      if (blob && dataUrl) {
        try {
          const avatarRef = storageRef(storage, `avatars/${currentUser.uid}/profile.jpg`);
          const uploadWithTimeout = Promise.race([
            uploadBytes(avatarRef, blob, { contentType: 'image/jpeg' }).then(() =>
              getDownloadURL(avatarRef)
            ),
            new Promise<string>((_, reject) =>
              window.setTimeout(() => reject(new Error('Storage upload timeout')), 4500)
            ),
          ]);
          resolvedUrl = await uploadWithTimeout;
        } catch {
          // Automatic fallback to compressed 256x256 JPEG data URL if Firebase Storage isn't enabled
          resolvedUrl = dataUrl;
        }
      }

      if (!resolvedUrl) return '';

      const updatedUser: UserProfile = { ...currentUser, photoURL: resolvedUrl };

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const existingUser = await getDoc(userRef);
        if (existingUser.exists()) {
          await updateDoc(userRef, { photoURL: resolvedUrl });
        }

        const peerRef = doc(db, 'peerProfiles', currentUser.uid);
        const existingPeer = await getDoc(peerRef);
        if (existingPeer.exists()) {
          await updateDoc(peerRef, { photoURL: resolvedUrl });
        }

        if (firebaseUser && resolvedUrl.startsWith('http')) {
          await updateProfile(firebaseUser, { photoURL: resolvedUrl }).catch(() => {});
        }

        setCurrentUser(updatedUser);
        pushToast('Profile photo saved across StudySync!');
        return resolvedUrl;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}/photoURL`);
      }
    },
    [authMode, currentUser, firebaseUser, peers, persistDemoSnapshot, pushToast]
  );

  const upgradeToPro = useCallback(
    async (razorpayPaymentId: string) => {
      if (!currentUser) return;
      const cleanPaymentId = razorpayPaymentId.trim();
      const paymentDocId =
        cleanPaymentId.replace(/[^a-zA-Z0-9_-]/g, '') || sanitizeId('pay');

      const updatedUser: UserProfile = {
        ...currentUser,
        isProMember: true,
        proActivatedAt: new Date().toISOString(),
        lastPaymentId: cleanPaymentId,
      };

      const receipt: PaymentReceipt = {
        uid: currentUser.uid,
        userEmail: currentUser.email,
        amount: 149,
        currency: 'INR',
        razorpayPaymentId: cleanPaymentId,
        status: 'captured',
        createdAt: new Date().toISOString(),
      };

      if (authMode === 'demo') {
        const existingDemo = loadDemoState();
        const nextPayments = [receipt, ...(existingDemo?.payments ?? [])];
        setCurrentUser(updatedUser);
        persistDemoSnapshot({ user: updatedUser, payments: nextPayments });
        pushToast(`StudySync Pro activated! Payment ID: ${cleanPaymentId}`);
        return;
      }

      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          isProMember: true,
          proActivatedAt: serverTimestamp(),
          lastPaymentId: cleanPaymentId,
        });

        const peerSnap = await getDoc(doc(db, 'peerProfiles', currentUser.uid));
        if (peerSnap.exists()) {
          await updateDoc(doc(db, 'peerProfiles', currentUser.uid), { isProMember: true });
        }

        await setDoc(doc(db, 'payments', paymentDocId), {
          uid: currentUser.uid,
          userEmail: currentUser.email,
          amount: 149,
          currency: 'INR',
          razorpayPaymentId: paymentDocId,
          status: 'captured',
          createdAt: serverTimestamp(),
        });

        setCurrentUser(updatedUser);
        pushToast(`StudySync Pro activated! Payment ID: ${cleanPaymentId}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `payments/${paymentDocId}`);
      }
    },
    [authMode, currentUser, persistDemoSnapshot, pushToast]
  );

  // Project Noticeboard Mutations
  const createProjectPost = useCallback(
    async (input: {
      title: string;
      category: ProjectCategory;
      description: string;
      requiredSkills: string[];
      deadline: string;
      teamSizeNeeded: number;
    }) => {
      if (!currentUser) return;
      const id = sanitizeId('proj');
      const newProject: ProjectBoard = {
        id,
        creatorId: currentUser.uid,
        ownerUid: currentUser.uid,
        creatorName: currentUser.name,
        title: input.title.trim(),
        category: input.category,
        description: input.description.trim(),
        requiredSkills: input.requiredSkills,
        deadline: input.deadline,
        teamSizeNeeded: input.teamSizeNeeded,
        currentMembers: [currentUser.uid],
        status: 'Open',
        createdAt: new Date().toISOString(),
      };

      const newWorkspace: TeamWorkspace = {
        id: sanitizeId('ws'),
        projectId: id,
        projectTitle: newProject.title,
        memberIds: [currentUser.uid],
        members: [{ uid: currentUser.uid, name: currentUser.name, role: 'Project Lead' }],
        tasks: [
          {
            id: sanitizeId('task'),
            title: 'Define team milestones & divide deliverables',
            assignee: currentUser.name,
            status: 'To Do',
          },
        ],
        links: [],
        notes: `Workspace initialized for ${newProject.title}.`,
        updatedAt: new Date().toISOString(),
      };

      if (authMode === 'demo') {
        const nextProjects = [newProject, ...projects];
        const nextWorkspaces = [newWorkspace, ...workspaces];
        setProjects(nextProjects);
        setWorkspaces(nextWorkspaces);
        persistDemoSnapshot({ projects: nextProjects, workspaces: nextWorkspaces });
        pushToast('Project posted to live noticeboard!');
        return;
      }

      try {
        await setDoc(doc(db, 'projectBoards', id), {
          ...newProject,
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, 'teamWorkspaces', newWorkspace.id), {
          ...newWorkspace,
          updatedAt: serverTimestamp(),
        });
        pushToast('Project posted & team workspace created!');
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `projectBoards/${id}`);
      }
    },
    [authMode, currentUser, persistDemoSnapshot, projects, pushToast, workspaces]
  );

  const applyToJoinProject = useCallback(
    async (project: ProjectBoard) => {
      if (!currentUser) return;
      if (project.currentMembers.includes(currentUser.uid)) {
        pushToast('You are already on this project team!', 'info');
        return;
      }
      if (project.currentMembers.length >= project.teamSizeNeeded) {
        pushToast('This team is already full.', 'error');
        return;
      }

      const updatedMembers = [...project.currentMembers, currentUser.uid];
      const existingWs = workspaces.find((w) => w.projectId === project.id);

      if (authMode === 'demo') {
        const nextProjects = projects.map((p) =>
          p.id === project.id ? { ...p, currentMembers: updatedMembers } : p
        );
        let nextWorkspaces = workspaces;
        if (!existingWs) {
          nextWorkspaces = [
            {
              id: sanitizeId('ws'),
              projectId: project.id,
              projectTitle: project.title,
              memberIds: [currentUser.uid, project.creatorId],
              members: [
                { uid: project.creatorId, name: project.creatorName, role: 'Project Lead' },
                { uid: currentUser.uid, name: currentUser.name, role: 'Teammate' },
              ],
              tasks: [
                {
                  id: sanitizeId('task'),
                  title: `Kickoff sync for ${project.title}`,
                  assignee: currentUser.name,
                  status: 'To Do',
                },
              ],
              links: [],
              notes: `Joined ${project.title} via Collaboration Noticeboard.`,
              updatedAt: new Date().toISOString(),
            },
            ...workspaces,
          ];
        }
        setProjects(nextProjects);
        setWorkspaces(nextWorkspaces);
        persistDemoSnapshot({ projects: nextProjects, workspaces: nextWorkspaces });
        pushToast(`Joined "${project.title}"! Team workspace unlocked.`);
        return;
      }

      try {
        await updateDoc(doc(db, 'projectBoards', project.id), {
          currentMembers: updatedMembers,
        });

        if (!existingWs) {
          const wsId = `ws_${project.id}`;
          const wsRef = doc(db, 'teamWorkspaces', wsId);
          const wsSnap = await getDoc(wsRef);
          if (wsSnap.exists()) {
            const wsData = wsSnap.data();
            const memberIds: string[] = Array.isArray(wsData.memberIds) ? wsData.memberIds : [];
            const members = Array.isArray(wsData.members) ? wsData.members : [];
            if (!memberIds.includes(currentUser.uid)) {
              await updateDoc(wsRef, {
                memberIds: [...memberIds, currentUser.uid],
                members: [...members, { uid: currentUser.uid, name: currentUser.name, role: 'Teammate' }],
                updatedAt: serverTimestamp(),
              });
            }
          } else {
            await setDoc(wsRef, {
              id: wsId,
              projectId: project.id,
              projectTitle: project.title,
              memberIds: updatedMembers,
              members: [
                { uid: project.creatorId, name: project.creatorName, role: 'Project Lead' },
                { uid: currentUser.uid, name: currentUser.name, role: 'Teammate' },
              ],
              tasks: [
                {
                  id: sanitizeId('task'),
                  title: `Kickoff sync for ${project.title}`,
                  assignee: currentUser.name,
                  status: 'To Do',
                },
              ],
              links: [],
              notes: `Joined ${project.title} via Collaboration Noticeboard.`,
              updatedAt: serverTimestamp(),
            });
          }
        }
        pushToast(`Joined "${project.title}"! Team workspace unlocked.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `projectBoards/${project.id}`);
      }
    },
    [authMode, currentUser, persistDemoSnapshot, projects, pushToast, workspaces]
  );

  // Match Requests
  const sendMatchRequest = useCallback(
    async ({
      receiver,
      message,
      project,
    }: {
      receiver: PeerProfile;
      message: string;
      project?: ProjectBoard;
    }) => {
      if (!currentUser) return;
      const id = sanitizeId('req');
      const newReq: MatchRequest = {
        id,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        receiverId: receiver.uid,
        receiverName: receiver.name,
        ...(project ? { projectId: project.id, projectTitle: project.title } : {}),
        message: message.trim(),
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };

      if (authMode === 'demo') {
        const nextReqs = [newReq, ...matchRequests];
        setMatchRequests(nextReqs);
        persistDemoSnapshot({ matchRequests: nextReqs });
        pushToast(`Match request sent to ${receiver.name}!`);
        return;
      }

      try {
        await setDoc(doc(db, 'matchRequests', id), {
          ...newReq,
          createdAt: serverTimestamp(),
        });
        pushToast(`Match request sent to ${receiver.name}!`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `matchRequests/${id}`);
      }
    },
    [authMode, currentUser, matchRequests, persistDemoSnapshot, pushToast]
  );

  const respondToMatchRequest = useCallback(
    async (request: MatchRequest, decision: 'Accepted' | 'Declined') => {
      if (!currentUser) return;

      const updatedReqs = matchRequests.map((r) =>
        r.id === request.id ? { ...r, status: decision } : r
      );

      let unlockedWs: TeamWorkspace | null = null;
      if (decision === 'Accepted') {
        const targetTitle = request.projectTitle || `${request.senderName} & ${currentUser.name} Pod`;
        const alreadyExists = workspaces.some(
          (w) =>
            (request.projectId && w.projectId === request.projectId) ||
            (w.memberIds.includes(request.senderId) && w.memberIds.includes(currentUser.uid) && w.projectTitle === targetTitle)
        );
        if (!alreadyExists) {
          unlockedWs = {
            id: sanitizeId('ws'),
            projectId: request.projectId || sanitizeId('pod'),
            projectTitle: targetTitle,
            memberIds: [currentUser.uid, request.senderId],
            members: [
              { uid: request.senderId, name: request.senderName, role: 'Collaborator' },
              { uid: currentUser.uid, name: currentUser.name, role: 'Teammate' },
            ],
            tasks: [
              {
                id: sanitizeId('task'),
                title: 'Align on deliverables & timeline',
                assignee: currentUser.name,
                status: 'To Do',
              },
            ],
            links: [],
            notes: `Collaboration formed via StudySync match request: "${request.message}"`,
            updatedAt: new Date().toISOString(),
          };
        }
      }

      if (authMode === 'demo') {
        const nextWorkspaces = unlockedWs ? [unlockedWs, ...workspaces] : workspaces;
        setMatchRequests(updatedReqs);
        setWorkspaces(nextWorkspaces);
        persistDemoSnapshot({ matchRequests: updatedReqs, workspaces: nextWorkspaces });
        pushToast(
          decision === 'Accepted'
            ? `Accepted! Team workspace with ${request.senderName} unlocked.`
            : 'Match request declined.',
          decision === 'Accepted' ? 'success' : 'info'
        );
        return;
      }

      try {
        await updateDoc(doc(db, 'matchRequests', request.id), { status: decision });
        if (unlockedWs) {
          await setDoc(doc(db, 'teamWorkspaces', unlockedWs.id), {
            ...unlockedWs,
            updatedAt: serverTimestamp(),
          });
        }
        pushToast(
          decision === 'Accepted'
            ? `Accepted! Team workspace with ${request.senderName} unlocked.`
            : 'Match request declined.',
          decision === 'Accepted' ? 'success' : 'info'
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `matchRequests/${request.id}`);
      }
    },
    [authMode, currentUser, matchRequests, persistDemoSnapshot, pushToast, workspaces]
  );

  // Team Workspace Mutations
  const patchWorkspace = useCallback(
    async (
      workspaceId: string,
      updater: (ws: TeamWorkspace) => TeamWorkspace,
      toastText: string
    ) => {
      const target = workspaces.find((w) => w.id === workspaceId);
      if (!target) return;
      const updated = {
        ...updater(target),
        updatedAt: new Date().toISOString(),
      };

      if (authMode === 'demo') {
        const nextWorkspaces = workspaces.map((w) => (w.id === workspaceId ? updated : w));
        setWorkspaces(nextWorkspaces);
        persistDemoSnapshot({ workspaces: nextWorkspaces });
        pushToast(toastText);
        return;
      }

      try {
        await updateDoc(doc(db, 'teamWorkspaces', workspaceId), {
          tasks: updated.tasks,
          links: updated.links,
          notes: updated.notes,
          members: updated.members,
          memberIds: updated.memberIds,
          updatedAt: serverTimestamp(),
        });
        pushToast(toastText);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `teamWorkspaces/${workspaceId}`);
      }
    },
    [authMode, persistDemoSnapshot, pushToast, workspaces]
  );

  const addWorkspaceTask = useCallback(
    async (workspaceId: string, title: string, assignee: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const newTask: WorkspaceTask = {
        id: sanitizeId('task'),
        title: trimmed,
        assignee: assignee || currentUser?.name || 'Unassigned',
        status: 'To Do',
      };
      await patchWorkspace(
        workspaceId,
        (ws) => ({ ...ws, tasks: [...ws.tasks, newTask] }),
        'Task added to Kanban board'
      );
    },
    [currentUser?.name, patchWorkspace]
  );

  const moveWorkspaceTask = useCallback(
    async (workspaceId: string, taskId: string, nextStatus: TaskStatus) => {
      await patchWorkspace(
        workspaceId,
        (ws) => ({
          ...ws,
          tasks: ws.tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)),
        }),
        'Task progress saved'
      );
    },
    [patchWorkspace]
  );

  const deleteWorkspaceTask = useCallback(
    async (workspaceId: string, taskId: string) => {
      await patchWorkspace(
        workspaceId,
        (ws) => ({
          ...ws,
          tasks: ws.tasks.filter((t) => t.id !== taskId),
        }),
        'Task removed'
      );
    },
    [patchWorkspace]
  );

  const addWorkspaceLink = useCallback(
    async (workspaceId: string, label: string, url: string) => {
      const cleanLabel = label.trim();
      const cleanUrl = url.trim();
      if (!cleanLabel || !cleanUrl) return;
      const newLink: WorkspaceLink = {
        id: sanitizeId('link'),
        label: cleanLabel,
        url: cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`,
      };
      await patchWorkspace(
        workspaceId,
        (ws) => ({ ...ws, links: [...ws.links, newLink] }),
        'Resource link saved'
      );
    },
    [patchWorkspace]
  );

  const removeWorkspaceLink = useCallback(
    async (workspaceId: string, linkId: string) => {
      await patchWorkspace(
        workspaceId,
        (ws) => ({
          ...ws,
          links: ws.links.filter((l) => l.id !== linkId),
        }),
        'Resource link removed'
      );
    },
    [patchWorkspace]
  );

  const updateWorkspaceNotes = useCallback(
    async (workspaceId: string, notes: string) => {
      await patchWorkspace(
        workspaceId,
        (ws) => ({ ...ws, notes }),
        'Workspace scratchpad saved'
      );
    },
    [patchWorkspace]
  );

  return (
    <StudySyncContext.Provider
      value={{
        authReady,
        isLoadingData,
        authMode,
        currentUser,
        needsOnboarding,
        peers,
        projects,
        matchRequests,
        workspaces,
        activeView,
        setActiveView,
        globalSearch,
        setGlobalSearch,
        toasts,
        pushToast,
        dismissToast,
        authError,
        clearAuthError,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInAsDemoGuest,
        signOutUser,
        saveUserProfile,
        updateUserPhoto,
        upgradeToPro,
        createProjectPost,
        applyToJoinProject,
        sendMatchRequest,
        respondToMatchRequest,
        addWorkspaceTask,
        moveWorkspaceTask,
        deleteWorkspaceTask,
        addWorkspaceLink,
        removeWorkspaceLink,
        updateWorkspaceNotes,
      }}
    >
      {children}
    </StudySyncContext.Provider>
  );
};
