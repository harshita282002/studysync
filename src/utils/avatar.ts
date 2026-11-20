import { SKILL_CATALOG } from './matching';

export interface GradientAvatarTheme {
  id: string;
  label: string;
  token: string;
  gradientClass: string;
  bannerClass: string;
}

export const GRADIENT_AVATAR_THEMES: GradientAvatarTheme[] = [
  {
    id: 'indigo-violet',
    label: 'Indigo Violet',
    token: 'gradient:indigo-violet',
    gradientClass: 'bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white',
    bannerClass: 'from-indigo-500/15 via-violet-500/10 to-slate-50',
  },
  {
    id: 'emerald-teal',
    label: 'Emerald Teal',
    token: 'gradient:emerald-teal',
    gradientClass: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white',
    bannerClass: 'from-emerald-500/15 via-teal-500/10 to-slate-50',
  },
  {
    id: 'sunset-coral',
    label: 'Sunset Coral',
    token: 'gradient:sunset-coral',
    gradientClass: 'bg-gradient-to-br from-rose-500 via-orange-500 to-amber-500 text-white',
    bannerClass: 'from-rose-500/15 via-amber-500/10 to-slate-50',
  },
  {
    id: 'ocean-blue',
    label: 'Ocean Blue',
    token: 'gradient:ocean-blue',
    gradientClass: 'bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-500 text-white',
    bannerClass: 'from-blue-500/15 via-sky-500/10 to-slate-50',
  },
  {
    id: 'midnight-slate',
    label: 'Midnight Slate',
    token: 'gradient:midnight-slate',
    gradientClass: 'bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 text-white',
    bannerClass: 'from-slate-500/15 via-indigo-500/10 to-slate-50',
  },
  {
    id: 'royal-gold',
    label: 'Royal Gold',
    token: 'gradient:royal-gold',
    gradientClass: 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 text-white',
    bannerClass: 'from-amber-500/15 via-yellow-500/10 to-slate-50',
  },
];

export interface CuratedAvatarPreset {
  id: string;
  label: string;
  style: 'Notionists' | 'Micah' | 'Lorelei';
  url: string;
}

export const CURATED_AVATARS: CuratedAvatarPreset[] = [
  {
    id: 'notion-1',
    label: 'Strategist',
    style: 'Notionists',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Harshita&backgroundColor=eef2ff',
  },
  {
    id: 'notion-2',
    label: 'Builder',
    style: 'Notionists',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aarav&backgroundColor=ecfdf5',
  },
  {
    id: 'notion-3',
    label: 'Presenter',
    style: 'Notionists',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Ananya&backgroundColor=fffbeb',
  },
  {
    id: 'notion-4',
    label: 'Quant',
    style: 'Notionists',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Rohan&backgroundColor=f0f9ff',
  },
  {
    id: 'micah-1',
    label: 'Analyst',
    style: 'Micah',
    url: 'https://api.dicebear.com/9.x/micah/svg?seed=Meera&backgroundColor=eef2ff',
  },
  {
    id: 'micah-2',
    label: 'Product',
    style: 'Micah',
    url: 'https://api.dicebear.com/9.x/micah/svg?seed=Kabir&backgroundColor=ecfdf5',
  },
  {
    id: 'micah-3',
    label: 'Speaker',
    style: 'Micah',
    url: 'https://api.dicebear.com/9.x/micah/svg?seed=Siddharth&backgroundColor=fffbeb',
  },
  {
    id: 'micah-4',
    label: 'Founder',
    style: 'Micah',
    url: 'https://api.dicebear.com/9.x/micah/svg?seed=Diya&backgroundColor=fdf2f8',
  },
  {
    id: 'lorelei-1',
    label: 'Finance',
    style: 'Lorelei',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Ira&backgroundColor=eef2ff',
  },
  {
    id: 'lorelei-2',
    label: 'Architect',
    style: 'Lorelei',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Dev&backgroundColor=ecfdf5',
  },
  {
    id: 'lorelei-3',
    label: 'Designer',
    style: 'Lorelei',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Sana&backgroundColor=fffbeb',
  },
  {
    id: 'lorelei-4',
    label: 'Researcher',
    style: 'Lorelei',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Vikram&backgroundColor=f1f5f9',
  },
];

export function getGradientThemeByToken(token?: string | null): GradientAvatarTheme | null {
  if (!token || !token.startsWith('gradient:')) return null;
  const id = token.slice('gradient:'.length);
  return GRADIENT_AVATAR_THEMES.find((t) => t.id === id) || GRADIENT_AVATAR_THEMES[0];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'S';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getFallbackGradientTheme(name: string): GradientAvatarTheme {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) {
    sum += name.charCodeAt(i);
  }
  return GRADIENT_AVATAR_THEMES[sum % GRADIENT_AVATAR_THEMES.length];
}

export function isImagePhotoUrl(photoURL?: string | null): boolean {
  if (!photoURL) return false;
  return (
    photoURL.startsWith('https://') ||
    photoURL.startsWith('http://') ||
    photoURL.startsWith('data:image/')
  );
}

export function buildAvatarLookup(
  currentUser: { uid: string; photoURL?: string } | null | undefined,
  peers: { uid: string; photoURL?: string }[]
): Map<string, string | undefined> {
  const map = new Map<string, string | undefined>();
  for (const peer of peers) {
    if (peer.photoURL) {
      map.set(peer.uid, peer.photoURL);
    }
  }
  if (currentUser?.uid && currentUser.photoURL) {
    map.set(currentUser.uid, currentUser.photoURL);
  }
  return map;
}

export type SkillCategoryTone = 'tech' | 'finance' | 'design';

const SKILL_GROUP_MAP = new Map<string, 'Finance & Strategy' | 'Tech & Data' | 'Design & Comms'>(
  SKILL_CATALOG.map((item) => [item.name.toLowerCase(), item.group])
);

export function getSkillTone(skillName: string): SkillCategoryTone {
  const lower = skillName.trim().toLowerCase();
  const mapped = SKILL_GROUP_MAP.get(lower);
  if (mapped === 'Tech & Data') return 'tech';
  if (mapped === 'Finance & Strategy') return 'finance';
  if (mapped === 'Design & Comms') return 'design';

  if (
    lower.includes('python') ||
    lower.includes('react') ||
    lower.includes('sql') ||
    lower.includes('code') ||
    lower.includes('coding') ||
    lower.includes('data') ||
    lower.includes('stat') ||
    lower.includes('ml') ||
    lower.includes('ai') ||
    lower.includes('tableau')
  ) {
    return 'tech';
  }
  if (
    lower.includes('financ') ||
    lower.includes('case') ||
    lower.includes('market') ||
    lower.includes('product') ||
    lower.includes('strategy') ||
    lower.includes('econ') ||
    lower.includes('stata')
  ) {
    return 'finance';
  }
  return 'design';
}

export function getSkillChipClasses(skillName: string, emphasized = false): string {
  const tone = getSkillTone(skillName);
  if (tone === 'tech') {
    return emphasized
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/20'
      : 'bg-indigo-50/70 text-indigo-700 border-indigo-200/80';
  }
  if (tone === 'finance') {
    return emphasized
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20'
      : 'bg-emerald-50/70 text-emerald-700 border-emerald-200/80';
  }
  return emphasized
    ? 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20'
    : 'bg-amber-50/70 text-amber-800 border-amber-200/80';
}

export function getSkillAccentDotClass(skillName: string): string {
  const tone = getSkillTone(skillName);
  if (tone === 'tech') return 'text-indigo-600';
  if (tone === 'finance') return 'text-emerald-600';
  return 'text-amber-600';
}

export interface CroppedAvatarResult {
  blob: Blob;
  dataUrl: string;
  sizeBytes: number;
}

/**
 * Center-crops any user-selected image to a square 256x256 JPEG avatar using HTML5 Canvas.
 */
export async function cropAndCompressImage(
  file: File,
  targetSize = 256,
  quality = 0.85
): Promise<CroppedAvatarResult> {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please choose a PNG, JPG, or WebP image file.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Unable to read the selected image file.'));
      el.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is not available in this browser.');
    }

    // Fill white backdrop for transparent PNGs before JPEG export
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetSize, targetSize);

    const side = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const sx = Math.max(0, Math.floor(((img.naturalWidth || img.width) - side) / 2));
    const sy = Math.max(0, Math.floor(((img.naturalHeight || img.height) - side) / 2));

    ctx.drawImage(img, sx, sy, side, side, 0, 0, targetSize, targetSize);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image compression failed.'))),
        'image/jpeg',
        quality
      );
    });

    return {
      blob,
      dataUrl,
      sizeBytes: blob.size,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
