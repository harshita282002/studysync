export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Expert';

export interface SkillTag {
  name: string;
  proficiency: SkillProficiency;
}

export type AvailabilityStatus = 'Available Now' | 'Busy' | 'Open for Weekends';

export type ProjectCategory =
  | 'Case Competition'
  | 'Semester Project'
  | 'Hackathon'
  | 'Study Group';

export type ProjectStatus = 'Open' | 'In Progress' | 'Completed';

export type MatchRequestStatus = 'Pending' | 'Accepted' | 'Declined';

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export type AppView = 'dashboard' | 'directory' | 'board' | 'workspaces' | 'profile';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  program: string;
  campusCluster: string;
  bio: string;
  photoURL?: string;
  skills: SkillTag[];
  availabilityStatus: AvailabilityStatus;
  isProMember: boolean;
  proActivatedAt?: string;
  lastPaymentId?: string;
  reliabilityScore: number;
  completedProjects: number;
  createdAt: string;
}

export interface PaymentReceipt {
  uid: string;
  userEmail: string;
  amount: number;
  currency: 'INR';
  razorpayPaymentId: string;
  status: 'captured';
  createdAt: string;
}

export interface PeerProfile {
  uid: string;
  ownerUid: string;
  isDemo: boolean;
  name: string;
  program: string;
  campusCluster: string;
  bio: string;
  photoURL?: string;
  skills: SkillTag[];
  availabilityStatus: AvailabilityStatus;
  isProMember: boolean;
  reliabilityScore: number;
  completedProjects: number;
  createdAt: string;
}

export interface ProjectBoard {
  id: string;
  creatorId: string;
  ownerUid: string;
  creatorName: string;
  title: string;
  category: ProjectCategory;
  description: string;
  requiredSkills: string[];
  deadline: string;
  teamSizeNeeded: number;
  currentMembers: string[];
  status: ProjectStatus;
  createdAt: string;
}

export interface MatchRequest {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  projectId?: string;
  projectTitle?: string;
  message: string;
  status: MatchRequestStatus;
  createdAt: string;
}

export interface WorkspaceMember {
  uid: string;
  name: string;
  role: string;
}

export interface WorkspaceTask {
  id: string;
  title: string;
  assignee: string;
  status: TaskStatus;
}

export interface WorkspaceLink {
  id: string;
  label: string;
  url: string;
}

export interface TeamWorkspace {
  id: string;
  projectId: string;
  projectTitle: string;
  memberIds: string[];
  members: WorkspaceMember[];
  tasks: WorkspaceTask[];
  links: WorkspaceLink[];
  notes: string;
  updatedAt: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  type: 'success' | 'error' | 'info';
}
