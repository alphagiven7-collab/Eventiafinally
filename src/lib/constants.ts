// ============================================
// INVITIA - Constants
// ============================================

export const APP_NAME = 'Invitia';
export const APP_DESCRIPTION = 'Créez votre événement. Partagez-le. Gérez vos invités.';

// Event Types
export const EVENT_TYPES = {
  wedding: { label: 'Mariage', emoji: '💍', color: 'rose' },
  birthday: { label: 'Anniversaire', emoji: '🎂', color: 'yellow' },
  baby_shower: { label: 'Baby Shower', emoji: '👶', color: 'blue' },
  graduation: { label: 'Diplôme', emoji: '🎓', color: 'purple' },
} as const;

// Templates
export const TEMPLATES = [
  {
    id: 'elegant',
    name: 'ÉLÉGANT',
    slug: 'elegant',
    category: 'classic' as const,
    description: 'Classique et raffiné',
    colors: { primary: '#1A1A2E', accent: '#D4AF37', text: '#FFFFFF' },
  },
  {
    id: 'modern',
    name: 'MODERNE',
    slug: 'modern',
    category: 'contemporary' as const,
    description: 'Design épuré et actuel',
    colors: { primary: '#1A1A2E', accent: '#D4AF37', text: '#1A1A2E' },
  },
  {
    id: 'floral',
    name: 'FLORAL',
    slug: 'floral',
    category: 'nature' as const,
    description: 'Touches florales élégantes',
    colors: { primary: '#2D5A4A', accent: '#E8B4B8', text: '#FFFFFF' },
  },
  {
    id: 'nature',
    name: 'NATURE',
    slug: 'nature',
    category: 'nature' as const,
    description: 'Inspiration naturelle',
    colors: { primary: '#3D5A3D', accent: '#F4E4BA', text: '#FFFFFF' },
  },
  {
    id: 'minimal',
    name: 'MINIMAL',
    slug: 'minimal',
    category: 'minimal' as const,
    description: 'Simple et élégant',
    colors: { primary: '#1A1A2E', accent: '#6B5B4F', text: '#1A1A2E' },
  },
] as const;

// Validation
export const VALIDATION = {
  title: { min: 3, max: 100 },
  location: { min: 3, max: 200 },
  description: { max: 1000 },
  password: { min: 8 },
};

// Date formats
export const DATE_FORMAT = 'dd MMMM yyyy';
export const TIME_FORMAT = 'HH:mm';

// Storage keys
export const STORAGE_KEYS = {
  draftEvent: 'invitia_draft_event',
};
