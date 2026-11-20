import type {
  AvailabilityStatus,
  ProjectCategory,
  SkillProficiency,
  SkillTag,
} from '../types/studysync';

export const SKILL_CATALOG: { name: string; group: 'Finance & Strategy' | 'Tech & Data' | 'Design & Comms' }[] = [
  { name: 'Financial Modeling', group: 'Finance & Strategy' },
  { name: 'Case Strategy', group: 'Finance & Strategy' },
  { name: 'Market Research', group: 'Finance & Strategy' },
  { name: 'Product Management', group: 'Finance & Strategy' },
  { name: 'Python / Coding', group: 'Tech & Data' },
  { name: 'Data Analytics', group: 'Tech & Data' },
  { name: 'React / Frontend', group: 'Tech & Data' },
  { name: 'Statistical Analysis', group: 'Tech & Data' },
  { name: 'SQL / Databases', group: 'Tech & Data' },
  { name: 'PPT Pitch Design', group: 'Design & Comms' },
  { name: 'Public Speaking', group: 'Design & Comms' },
  { name: 'Content Writing', group: 'Design & Comms' },
];

export const PROGRAM_OPTIONS = [
  '1st Year MBA',
  '2nd Year MBA',
  'B.Tech CS',
  'M.Sc Data Science',
  'BBA Analytics',
  'MBA Finance',
  'PGDM Operations',
];

export const CAMPUS_OPTIONS = [
  'DGU Campus',
  'Dehradun Cluster',
  'DGU Hostel Block B',
  'Dehradun Tech Park',
];

const PROFICIENCY_WEIGHT: Record<SkillProficiency, number> = {
  Beginner: 0.6,
  Intermediate: 0.85,
  Expert: 1.0,
};

export interface MatchAnalysis {
  score: number;
  complementarySkills: string[];
  sharedSkills: string[];
}

/**
 * Calculates a 15-99% Complementary Match score.
 * Peers who contribute strong skills that the current user LACKS score higher,
 * solving the core problem of forming balanced cross-functional teams.
 */
export function calculateMatchScore(
  currentUserSkills: SkillTag[],
  peerSkills: SkillTag[],
  peerAvailability: AvailabilityStatus = 'Available Now',
  peerReliability = 4.5,
  isProMember = false
): MatchAnalysis {
  if (peerSkills.length === 0) {
    return { score: 25, complementarySkills: [], sharedSkills: [] };
  }

  const userSkillMap = new Map<string, SkillTag>();
  for (const s of currentUserSkills) {
    userSkillMap.set(s.name.trim().toLowerCase(), s);
  }

  const complementarySkills: string[] = [];
  const sharedSkills: string[] = [];
  let complementPoints = 0;
  let sharedPoints = 0;

  for (const peerSkill of peerSkills) {
    const key = peerSkill.name.trim().toLowerCase();
    const weight = PROFICIENCY_WEIGHT[peerSkill.proficiency] ?? 0.75;
    if (userSkillMap.has(key)) {
      sharedSkills.push(peerSkill.name);
      sharedPoints += 5 * weight;
    } else {
      complementarySkills.push(peerSkill.name);
      complementPoints += 20 * weight;
    }
  }

  // If the current user has no skills yet, treat all peer skills as potentially helpful
  const baseComplementScore =
    currentUserSkills.length === 0
      ? Math.min(65, peerSkills.length * 14)
      : Math.min(68, complementPoints);

  const overlapSynergy = Math.min(10, sharedPoints);
  const availabilityBoost =
    peerAvailability === 'Available Now'
      ? 12
      : peerAvailability === 'Open for Weekends'
        ? 8
        : 2;
  const reliabilityBoost = Math.round(Math.max(0, Math.min(5, peerReliability)) * 1.8);
  const proBoost = isProMember ? 2 : 0;

  const rawScore = Math.round(
    baseComplementScore + overlapSynergy + availabilityBoost + reliabilityBoost + proBoost
  );

  const boundedScore = Math.max(15, Math.min(99, rawScore));

  return {
    score: boundedScore,
    complementarySkills,
    sharedSkills,
  };
}

export interface ProjectSkillCoverage {
  matched: string[];
  missing: string[];
  matchRatio: number;
}

export function getProjectSkillCoverage(
  userSkills: SkillTag[],
  requiredSkills: string[]
): ProjectSkillCoverage {
  const userSet = new Set(userSkills.map((s) => s.name.trim().toLowerCase()));
  const matched: string[] = [];
  const missing: string[] = [];

  for (const req of requiredSkills) {
    if (userSet.has(req.trim().toLowerCase())) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  }

  const matchRatio =
    requiredSkills.length > 0 ? matched.length / requiredSkills.length : 0;

  return { matched, missing, matchRatio };
}

export interface DeadlineInfo {
  daysRemaining: number;
  label: string;
  urgency: 'overdue' | 'urgent' | 'soon' | 'normal';
}

export function getDeadlineInfo(deadlineIso: string, referenceDate = new Date()): DeadlineInfo {
  const target = new Date(deadlineIso);
  if (Number.isNaN(target.getTime())) {
    return { daysRemaining: 0, label: 'Flexible deadline', urgency: 'normal' };
  }

  const startOfRef = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffMs = startOfTarget.getTime() - startOfRef.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      label: `${Math.abs(daysRemaining)}d overdue`,
      urgency: 'overdue',
    };
  }
  if (daysRemaining === 0) {
    return { daysRemaining: 0, label: 'Due today', urgency: 'urgent' };
  }
  if (daysRemaining <= 2) {
    return {
      daysRemaining,
      label: `${daysRemaining}d left`,
      urgency: 'urgent',
    };
  }
  if (daysRemaining <= 7) {
    return {
      daysRemaining,
      label: `${daysRemaining}d left`,
      urgency: 'soon',
    };
  }
  return {
    daysRemaining,
    label: `${daysRemaining}d left`,
    urgency: 'normal',
  };
}

export function validateProfileInput(input: {
  name: string;
  program: string;
  campusCluster: string;
  bio: string;
  skills: SkillTag[];
}): string | null {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) {
    return 'Please enter your full name (2–100 characters).';
  }
  if (!input.program.trim() || input.program.trim().length > 100) {
    return 'Please select or enter your academic program.';
  }
  if (!input.campusCluster.trim() || input.campusCluster.trim().length > 100) {
    return 'Please select or enter your campus cluster.';
  }
  if (input.bio.length > 600) {
    return 'Bio must be 600 characters or fewer.';
  }
  if (input.skills.length === 0) {
    return 'Add at least 1 skill tag so peers can match with you.';
  }
  if (input.skills.length > 6) {
    return 'You can add up to 6 skill tags.';
  }
  return null;
}

export function validateProjectInput(input: {
  title: string;
  category: ProjectCategory;
  description: string;
  requiredSkills: string[];
  deadline: string;
  teamSizeNeeded: number;
}): string | null {
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 3 || title.length > 140) {
    return 'Project title must be between 3 and 140 characters.';
  }
  if (description.length < 5 || description.length > 1500) {
    return 'Project description must be between 5 and 1500 characters.';
  }
  if (input.requiredSkills.length < 1 || input.requiredSkills.length > 10) {
    return 'Select between 1 and 10 required skills.';
  }
  if (!input.deadline.trim()) {
    return 'Please select a target deadline.';
  }
  if (input.teamSizeNeeded < 2 || input.teamSizeNeeded > 12) {
    return 'Team size must be between 2 and 12 members.';
  }
  return null;
}

export function validateMatchMessage(message: string): string | null {
  const trimmed = message.trim();
  if (trimmed.length < 5) {
    return 'Write a short note (at least 5 characters) explaining how you can collaborate.';
  }
  if (trimmed.length > 800) {
    return 'Invitation message must be 800 characters or fewer.';
  }
  return null;
}
