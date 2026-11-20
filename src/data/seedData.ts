import type {
  MatchRequest,
  PeerProfile,
  ProjectBoard,
  TeamWorkspace,
  UserProfile,
} from '../types/studysync';

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export const DEMO_GUEST_UID = 'demo_guest_harshita';

export function createDefaultDemoUser(): UserProfile {
  return {
    uid: DEMO_GUEST_UID,
    name: 'Harshita Chhetri',
    email: 'harshita.mba@dgu.ac.in',
    program: '1st Year MBA',
    campusCluster: 'DGU Campus',
    bio: 'MBA candidate passionate about business strategy, venture design, and high-impact national case competitions.',
    photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Harshita&backgroundColor=eef2ff',
    skills: [
      { name: 'Financial Modeling', proficiency: 'Expert' },
      { name: 'Case Strategy', proficiency: 'Intermediate' },
      { name: 'Market Research', proficiency: 'Intermediate' },
    ],
    availabilityStatus: 'Available Now',
    isProMember: false,
    reliabilityScore: 4.9,
    completedProjects: 3,
    createdAt: new Date().toISOString(),
  };
}

export function createSeedPeers(ownerUid = 'seed_system'): PeerProfile[] {
  const now = new Date().toISOString();
  return [
    {
      uid: 'demo_peer_1',
      ownerUid,
      isDemo: true,
      name: 'Aarav Sharma',
      program: 'B.Tech CS (Final Year)',
      campusCluster: 'DGU Campus',
      bio: 'Full-stack engineer and hackathon finalist. Love teaming up with MBA strategists to build working MVPs and data pipelines.',
      photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aarav&backgroundColor=ecfdf5',
      skills: [
        { name: 'Python / Coding', proficiency: 'Expert' },
        { name: 'React / Frontend', proficiency: 'Expert' },
        { name: 'Data Analytics', proficiency: 'Intermediate' },
      ],
      availabilityStatus: 'Available Now',
      isProMember: true,
      reliabilityScore: 4.9,
      completedProjects: 7,
      createdAt: now,
    },
    {
      uid: 'demo_peer_2',
      ownerUid,
      isDemo: true,
      name: 'Ananya Verma',
      program: '1st Year MBA',
      campusCluster: 'DGU Campus',
      bio: 'Former brand strategist specializing in executive storytelling, McKinsey-style pitch decks, and final jury presentations.',
      photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Ananya&backgroundColor=fffbeb',
      skills: [
        { name: 'PPT Pitch Design', proficiency: 'Expert' },
        { name: 'Public Speaking', proficiency: 'Expert' },
        { name: 'Content Writing', proficiency: 'Intermediate' },
      ],
      availabilityStatus: 'Available Now',
      isProMember: true,
      reliabilityScore: 5.0,
      completedProjects: 5,
      createdAt: now,
    },
    {
      uid: 'demo_peer_3',
      ownerUid,
      isDemo: true,
      name: 'Rohan Malhotra',
      program: 'M.Sc Data Science',
      campusCluster: 'Dehradun Cluster',
      bio: 'Quantitative analyst focused on econometrics, predictive modeling, and clean SQL/Python dashboards for business cases.',
      photoURL: 'https://api.dicebear.com/9.x/notionists/svg?seed=Rohan&backgroundColor=f0f9ff',
      skills: [
        { name: 'Data Analytics', proficiency: 'Expert' },
        { name: 'Statistical Analysis', proficiency: 'Expert' },
        { name: 'SQL / Databases', proficiency: 'Intermediate' },
      ],
      availabilityStatus: 'Open for Weekends',
      isProMember: false,
      reliabilityScore: 4.8,
      completedProjects: 4,
      createdAt: now,
    },
    {
      uid: 'demo_peer_4',
      ownerUid,
      isDemo: true,
      name: 'Meera Nair',
      program: '2nd Year MBA',
      campusCluster: 'DGU Campus',
      bio: 'National B-school case comp semi-finalist. Strong in DCF valuation, unit economics, and competitive market sizing.',
      photoURL: 'https://api.dicebear.com/9.x/micah/svg?seed=Meera&backgroundColor=eef2ff',
      skills: [
        { name: 'Financial Modeling', proficiency: 'Expert' },
        { name: 'Market Research', proficiency: 'Expert' },
        { name: 'Case Strategy', proficiency: 'Intermediate' },
      ],
      availabilityStatus: 'Available Now',
      isProMember: true,
      reliabilityScore: 4.9,
      completedProjects: 6,
      createdAt: now,
    },
    {
      uid: 'demo_peer_5',
      ownerUid,
      isDemo: true,
      name: 'Kabir Joshi',
      program: 'BBA Analytics',
      campusCluster: 'DGU Hostel Block B',
      bio: 'Product thinker who bridges user interviews, Figma wireframes, and crisp pitch decks for campus venture quests.',
      photoURL: 'https://api.dicebear.com/9.x/micah/svg?seed=Kabir&backgroundColor=ecfdf5',
      skills: [
        { name: 'Product Management', proficiency: 'Intermediate' },
        { name: 'PPT Pitch Design', proficiency: 'Intermediate' },
        { name: 'Market Research', proficiency: 'Expert' },
      ],
      availabilityStatus: 'Open for Weekends',
      isProMember: false,
      reliabilityScore: 4.6,
      completedProjects: 3,
      createdAt: now,
    },
    {
      uid: 'demo_peer_6',
      ownerUid,
      isDemo: true,
      name: 'Siddharth Rawat',
      program: '1st Year MBA',
      campusCluster: 'Dehradun Cluster',
      bio: 'Ex-corporate communications lead. Ready for persuasive Q&A defense, qualitative synthesis, and go-to-market plans.',
      photoURL: 'https://api.dicebear.com/9.x/micah/svg?seed=Siddharth&backgroundColor=fffbeb',
      skills: [
        { name: 'Public Speaking', proficiency: 'Expert' },
        { name: 'Content Writing', proficiency: 'Expert' },
        { name: 'Python / Coding', proficiency: 'Beginner' },
      ],
      availabilityStatus: 'Busy',
      isProMember: false,
      reliabilityScore: 4.7,
      completedProjects: 2,
      createdAt: now,
    },
  ];
}

export function createSeedProjects(ownerUid = 'seed_system'): ProjectBoard[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo_proj_1',
      creatorId: 'demo_peer_2',
      ownerUid,
      creatorName: 'Ananya Verma',
      title: 'DGU Venture Quest — FinTech GTM Case',
      category: 'Case Competition',
      description:
        'Building a 12-slide investor & jury deck for the DGU Venture Quest finals. We already have deck design & pitch delivery covered—looking for financial modeling and data analytics support.',
      requiredSkills: ['Financial Modeling', 'Data Analytics', 'PPT Pitch Design'],
      deadline: addDaysIso(2),
      teamSizeNeeded: 4,
      currentMembers: ['demo_peer_2', 'demo_peer_5'],
      status: 'Open',
      createdAt: now,
    },
    {
      id: 'demo_proj_2',
      creatorId: 'demo_peer_1',
      ownerUid,
      creatorName: 'Aarav Sharma',
      title: 'Campus AI Sustainability Hackathon',
      category: 'Hackathon',
      description:
        '48-hour regional hackathon building a campus energy & waste tracker. Backend Python API and React UI are underway; need a business strategist and compelling pitch designer.',
      requiredSkills: ['React / Frontend', 'Case Strategy', 'PPT Pitch Design', 'Public Speaking'],
      deadline: addDaysIso(5),
      teamSizeNeeded: 4,
      currentMembers: ['demo_peer_1', 'demo_peer_3'],
      status: 'Open',
      createdAt: now,
    },
    {
      id: 'demo_proj_3',
      creatorId: 'demo_peer_4',
      ownerUid,
      creatorName: 'Meera Nair',
      title: 'Corporate Valuation & M&A Term Project',
      category: 'Semester Project',
      description:
        'Term-end financial analysis comparing mid-cap SaaS acquisitions in India. Seeking peers comfortable with statistical regression, market research, and executive report formatting.',
      requiredSkills: ['Financial Modeling', 'Statistical Analysis', 'Market Research'],
      deadline: addDaysIso(12),
      teamSizeNeeded: 3,
      currentMembers: ['demo_peer_4'],
      status: 'Open',
      createdAt: now,
    },
    {
      id: 'demo_proj_4',
      creatorId: 'demo_peer_3',
      ownerUid,
      creatorName: 'Rohan Malhotra',
      title: 'Quantitative Methods & SQL Peer Study Pod',
      category: 'Study Group',
      description:
        'Twice-weekly evening study sessions at DGU Central Library preparing for mid-term quantitative analytics, hypothesis testing, and SQL case interviews.',
      requiredSkills: ['Data Analytics', 'SQL / Databases', 'Statistical Analysis'],
      deadline: addDaysIso(9),
      teamSizeNeeded: 5,
      currentMembers: ['demo_peer_3', 'demo_peer_6'],
      status: 'Open',
      createdAt: now,
    },
  ];
}

export function createSeedMatchRequests(currentUserId: string, currentUserName: string): MatchRequest[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo_req_1',
      senderId: 'demo_peer_2',
      senderName: 'Ananya Verma',
      receiverId: currentUserId,
      receiverName: currentUserName,
      projectId: 'demo_proj_1',
      projectTitle: 'DGU Venture Quest — FinTech GTM Case',
      message:
        'Hi! Saw your Expert Financial Modeling & Case Strategy profile—we need a finance lead for our DGU Venture Quest submission due in 48 hours. Want to join our workspace?',
      status: 'Pending',
      createdAt: now,
    },
  ];
}

export function createSeedWorkspaces(currentUserId: string, currentUserName: string): TeamWorkspace[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo_ws_1',
      projectId: 'demo_proj_2',
      projectTitle: 'DGU Entrepreneurship Capstone Squad',
      memberIds: [currentUserId, 'demo_peer_1', 'demo_peer_2'],
      members: [
        { uid: currentUserId, name: currentUserName, role: 'Strategy & Finance' },
        { uid: 'demo_peer_1', name: 'Aarav Sharma', role: 'Engineering Lead' },
        { uid: 'demo_peer_2', name: 'Ananya Verma', role: 'Pitch & Design' },
      ],
      tasks: [
        {
          id: 'task_1',
          title: 'Finalize TAM / SAM / SOM unit economics sheet',
          assignee: currentUserName,
          status: 'Done',
        },
        {
          id: 'task_2',
          title: 'Build interactive prototype & matching engine',
          assignee: 'Aarav Sharma',
          status: 'In Progress',
        },
        {
          id: 'task_3',
          title: 'Design 10-slide jury presentation deck',
          assignee: 'Ananya Verma',
          status: 'To Do',
        },
        {
          id: 'task_4',
          title: 'Synthesize 25 DGU hostel interview quotes',
          assignee: currentUserName,
          status: 'To Do',
        },
      ],
      links: [
        {
          id: 'link_1',
          label: 'Google Drive — Case Financials & Data',
          url: 'https://drive.google.com',
        },
        {
          id: 'link_2',
          label: 'Figma — Jury Pitch Deck v2',
          url: 'https://figma.com',
        },
      ],
      notes:
        'Next sync: Thursday 6:30 PM at DGU Library Mezzanine.\nFocus: Lock unit economics contribution margin (₹40/unit) and rehearse 5-minute jury Q&A.',
      updatedAt: now,
    },
  ];
}
