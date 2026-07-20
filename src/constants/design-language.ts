// ============================================
// INVITIA — Design Language System
// Tous les tokens de design pour une identité forte et cohérente
// ============================================

import { EventType } from '@/types';

// ============================================
// Typographie
// ============================================

export const TYPOGRAPHY = {
  heading: {
    font: "var(--font-playfair), 'Cormorant Garamond', Georgia, serif",
    className: 'font-serif',
  },
  body: {
    font: "var(--font-inter), system-ui, -apple-system, sans-serif",
    className: 'font-sans',
  },
  sizes: {
    hero: 'text-4xl md:text-5xl lg:text-6xl',
    title: 'text-2xl md:text-3xl',
    subtitle: 'text-lg md:text-xl',
    body: 'text-sm md:text-base',
    caption: 'text-xs',
    micro: 'text-[10px]',
  },
} as const;

// ============================================
// Palette Invitia — Base commune
// ============================================

export const COLORS = {
  gold: {
    light: '#D4AF37',
    medium: '#C9A84C',
    dark: '#B8960F',
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
  },
  cream: '#F8F4F0',
  sand: '#E8E0D8',
  earth: '#6B5B4F',
  charcoal: '#1A1A2E',
  white: '#FFFFFF',
  black: '#0A0A0F',
} as const;

// ============================================
// Identités par type d'événement
// Chaque catégorie a son âme, sa palette, son rythme
// ============================================

export interface EventIdentity {
  type: EventType;
  name: string;
  emoji: string;
  palette: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    gradient: string;
    glassBg: string;
    border: string;
  };
  /** Palette alternative pour le dark mode */
  darkPalette?: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    accentLight: string;
    accentDark: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    glassBg: string;
  };
  typography: {
    headingClass: string;
    bodyClass: string;
    headingWeight: string;
    letterSpacing: string;
  };
  animations: {
    entrance: string;
    photoEffect: string;
    textReveal: string;
    transitionSpeed: string;
    particleColor: string;
  };
  decorations: {
    icons: string[];
    patterns: string[];
    separators: string[];
  };
  mood: {
    description: string;
    keywords: string[];
    rhythm: 'slow' | 'moderate' | 'lively';
    saturation: 'rich' | 'soft' | 'vibrant';
  };
}

/** Hook-like helper: retourne la palette adaptée au thème courant */
export function getPalette(identity: EventIdentity, isDark: boolean) {
  if (isDark && identity.darkPalette) {
    return { ...identity.palette, ...identity.darkPalette };
  }
  return identity.palette;
}

export const EVENT_IDENTITIES: Record<EventType, EventIdentity> = {
  // ============================================
  // 💍 MARIAGE — Élégance intemporelle
  // ============================================
  wedding: {
    type: 'wedding',
    name: 'Mariage',
    emoji: '💍',
    palette: {
      primary: '#D4AF37',
      primaryLight: '#F5E6C8',
      primaryDark: '#8B7500',
      accent: '#E8D5E0',
      accentLight: '#FDF2F8',
      accentDark: '#9D7B8F',
      background: '#FDFBF7',
      surface: '#FFFFFF',
      text: '#2D1B00',
      textMuted: '#8C7A6B',
      gradient: 'from-amber-100 via-cream to-rose-50',
      glassBg: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(212, 175, 55, 0.15)',
    },
    typography: {
      headingClass: 'font-serif tracking-wide',
      bodyClass: 'font-sans',
      headingWeight: 'font-light',
      letterSpacing: 'tracking-wide',
    },
    animations: {
      entrance: 'animate-fade-in',
      photoEffect: 'ken-burns-soft',
      textReveal: 'reveal-up-slow',
      transitionSpeed: 'duration-1000',
      particleColor: '#D4AF37',
    },
    decorations: {
      icons: ['💍', '💒', '🥂', '💐', '🤍'],
      patterns: ['floral', 'rings', 'hearts-delicate', 'lace'],
      separators: ['ornament-gold', 'divider-elegant'],
    },
    mood: {
      description: 'Amour éternel, pureté, élégance intemporelle',
      keywords: ['romantique', 'élégant', 'sacré', 'lumineux', 'éternel'],
      rhythm: 'slow',
      saturation: 'soft',
    },
  },

  // ============================================
  // 🎂 ANNIVERSAIRE — Joie et célébration
  // ============================================
  birthday: {
    type: 'birthday',
    name: 'Anniversaire',
    emoji: '🎂',
    palette: {
      primary: '#EC4899',
      primaryLight: '#FCE7F3',
      primaryDark: '#BE185D',
      accent: '#F59E0B',
      accentLight: '#FEF3C7',
      accentDark: '#B45309',
      background: '#FFF5F7',
      surface: '#FFFFFF',
      text: '#4A0024',
      textMuted: '#9D6B84',
      gradient: 'from-pink-100 via-amber-50 to-purple-100',
      glassBg: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(236, 72, 153, 0.15)',
    },
    typography: {
      headingClass: 'font-serif tracking-normal',
      bodyClass: 'font-sans',
      headingWeight: 'font-semibold',
      letterSpacing: 'tracking-normal',
    },
    animations: {
      entrance: 'animate-scale-in',
      photoEffect: 'ken-burns-lively',
      textReveal: 'reveal-up',
      transitionSpeed: 'duration-700',
      particleColor: '#EC4899',
    },
    decorations: {
      icons: ['🎂', '🎉', '🎈', '🎁', '✨'],
      patterns: ['confetti', 'balloons', 'stars', 'cake'],
      separators: ['dots-colorful', 'wave-playful'],
    },
    mood: {
      description: 'Joie explosive, couleurs vives, souvenirs heureux',
      keywords: ['festif', 'chaleureux', 'joyeux', 'coloré', 'énergique'],
      rhythm: 'lively',
      saturation: 'vibrant',
    },
  },

  // ============================================
  // 👶 BABY SHOWER — Douceur et tendresse
  // ============================================
  baby_shower: {
    type: 'baby_shower',
    name: 'Baby Shower',
    emoji: '👶',
    palette: {
      primary: '#A7C7E7',
      primaryLight: '#E8F4FD',
      primaryDark: '#6B8FB3',
      accent: '#F4C2C2',
      accentLight: '#FDF2F2',
      accentDark: '#C98F8F',
      background: '#F8FAFE',
      surface: '#FFFFFF',
      text: '#3D5A73',
      textMuted: '#8FA7BE',
      gradient: 'from-blue-50 via-pink-50 to-cream',
      glassBg: 'rgba(255, 255, 255, 0.82)',
      border: 'rgba(167, 199, 231, 0.2)',
    },
    typography: {
      headingClass: 'font-serif tracking-wide',
      bodyClass: 'font-sans',
      headingWeight: 'font-light',
      letterSpacing: 'tracking-wider',
    },
    animations: {
      entrance: 'animate-fade-in',
      photoEffect: 'ken-burns-soft',
      textReveal: 'reveal-up-slow',
      transitionSpeed: 'duration-1000',
      particleColor: '#A7C7E7',
    },
    decorations: {
      icons: ['👶', '🍼', '🧸', '🐣', '🌸'],
      patterns: ['clouds', 'stars-soft', 'bears', 'bottles'],
      separators: ['dots-pastel', 'wave-soft'],
    },
    mood: {
      description: 'Nouveau départ, innocence, amour pur',
      keywords: ['doux', 'tendre', 'rassurant', 'pastel', 'innocent'],
      rhythm: 'slow',
      saturation: 'soft',
    },
  },

  // ============================================
  // 🎓 DIPLÔME — Succès et accomplissement
  // ============================================
  graduation: {
    type: 'graduation',
    name: 'Remise de Diplôme',
    emoji: '🎓',
    palette: {
      primary: '#1E3A5F',
      primaryLight: '#2C5282',
      primaryDark: '#122C47',
      accent: '#D4AF37',
      accentLight: '#F5E6C8',
      accentDark: '#8B7500',
      background: '#F5F7FA',
      surface: '#FFFFFF',
      text: '#1A202C',
      textMuted: '#718096',
      gradient: 'from-navy-50 via-slate-100 to-gold-50',
      glassBg: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(30, 58, 95, 0.12)',
    },
    typography: {
      headingClass: 'font-serif tracking-tight',
      bodyClass: 'font-sans',
      headingWeight: 'font-bold',
      letterSpacing: 'tracking-tight',
    },
    animations: {
      entrance: 'animate-slide-up',
      photoEffect: 'ken-burns-modern',
      textReveal: 'reveal-up',
      transitionSpeed: 'duration-600',
      particleColor: '#D4AF37',
    },
    decorations: {
      icons: ['🎓', '📜', '🏆', '⭐', '🎯'],
      patterns: ['diplomas', 'stars-academic', 'laurels'],
      separators: ['line-bold', 'divider-classic'],
    },
    mood: {
      description: 'Accomplissement, fierté, nouveau chapitre',
      keywords: ['prestigieux', 'académique', 'fier', 'solemnité', 'classique'],
      rhythm: 'moderate',
      saturation: 'rich',
    },
  },

  // ============================================
  // 💕 FIANÇAILLES — Romance et promesse
  // ============================================
  engagement: {
    type: 'engagement',
    name: 'Fiançailles',
    emoji: '💕',
    palette: {
      primary: '#E8A0BF',
      primaryLight: '#FCE4EC',
      primaryDark: '#C2185B',
      accent: '#FFD1DC',
      accentLight: '#FFF0F3',
      accentDark: '#D4869C',
      background: '#FFFAFB',
      surface: '#FFFFFF',
      text: '#4A0E2E',
      textMuted: '#B8758F',
      gradient: 'from-rose-50 via-pink-50 to-peach-50',
      glassBg: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(232, 160, 191, 0.2)',
    },
    typography: {
      headingClass: 'font-serif tracking-wide',
      bodyClass: 'font-sans',
      headingWeight: 'font-light',
      letterSpacing: 'tracking-wider',
    },
    animations: {
      entrance: 'animate-fade-in',
      photoEffect: 'ken-burns-soft',
      textReveal: 'reveal-up-slow',
      transitionSpeed: 'duration-1000',
      particleColor: '#E8A0BF',
    },
    decorations: {
      icons: ['💕', '💍', '🌹', '💌', '🥂'],
      patterns: ['hearts-romantic', 'roses', 'rings-pair', 'ribbon'],
      separators: ['heart-divider', 'floral-swirl'],
    },
    mood: {
      description: 'Romance pure, promesse d\'éternité, douceur passionnée',
      keywords: ['romantique', 'passionné', 'doux', 'promesse', 'intime'],
      rhythm: 'slow',
      saturation: 'soft',
    },
  },

  // ============================================
  // 🙏 RELIGIEUX — Solennité et recueillement
  // ============================================
  religious: {
    type: 'religious',
    name: 'Célébration Religieuse',
    emoji: '🙏',
    palette: {
      primary: '#D4AF37',
      primaryLight: '#F5E6C8',
      primaryDark: '#8B7500',
      accent: '#F5F5F0',
      accentLight: '#FFFFFA',
      accentDark: '#D4CFC0',
      background: '#FDFCF7',
      surface: '#FFFFFF',
      text: '#2D2416',
      textMuted: '#8C8068',
      gradient: 'from-cream-50 via-white to-gold-50',
      glassBg: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(212, 175, 55, 0.2)',
    },
    typography: {
      headingClass: 'font-serif tracking-wider',
      bodyClass: 'font-sans',
      headingWeight: 'font-light',
      letterSpacing: 'tracking-widest',
    },
    animations: {
      entrance: 'animate-fade-in',
      photoEffect: 'ken-burns-soft',
      textReveal: 'reveal-up-slow',
      transitionSpeed: 'duration-1200',
      particleColor: '#D4AF37',
    },
    decorations: {
      icons: ['🙏', '✝️', '🕊️', '📿', '🕯️'],
      patterns: ['cross-light', 'dove', 'rays-divine', 'scroll'],
      separators: ['cross-divider', 'ornament-sacred'],
    },
    mood: {
      description: 'Recueillement sacré, paix divine, solennité lumineuse',
      keywords: ['sacré', 'solennel', 'lumineux', 'paisible', 'spirituel'],
      rhythm: 'slow',
      saturation: 'soft',
    },
  },

  // ============================================
  // 💼 CORPORATE — Professionnalisme moderne
  // ============================================
  corporate: {
    type: 'corporate',
    name: 'Événement Corporate',
    emoji: '💼',
    palette: {
      primary: '#0F172A',
      primaryLight: '#334155',
      primaryDark: '#020617',
      accent: '#3B82F6',
      accentLight: '#DBEAFE',
      accentDark: '#1D4ED8',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#0F172A',
      textMuted: '#64748B',
      gradient: 'from-slate-50 via-gray-100 to-blue-50',
      glassBg: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(15, 23, 42, 0.08)',
    },
    typography: {
      headingClass: 'font-sans tracking-tight',
      bodyClass: 'font-sans',
      headingWeight: 'font-bold',
      letterSpacing: 'tracking-tight',
    },
    animations: {
      entrance: 'animate-slide-up',
      photoEffect: 'ken-burns-modern',
      textReveal: 'reveal-up',
      transitionSpeed: 'duration-500',
      particleColor: '#3B82F6',
    },
    decorations: {
      icons: ['💼', '🤝', '📊', '🏢', '🌐'],
      patterns: ['geometric', 'lines-clean', 'dots-grid'],
      separators: ['line-minimal', 'dot-modern'],
    },
    mood: {
      description: 'Professionnalisme, innovation, confiance',
      keywords: ['moderne', 'professionnel', 'minimaliste', 'épuré', 'fiable'],
      rhythm: 'moderate',
      saturation: 'rich',
    },
  },
} as const;

// ============================================
// Animations keyframes
// ============================================

export const ANIMATION_KEYFRAMES = {
  'ken-burns-soft': `
    @keyframes ken-burns-soft {
      0% { transform: scale(1) translate(0, 0); }
      100% { transform: scale(1.05) translate(-1%, -0.5%); }
    }
  `,
  'ken-burns-lively': `
    @keyframes ken-burns-lively {
      0% { transform: scale(1) translate(0, 0); }
      100% { transform: scale(1.08) translate(-1.5%, -1%); }
    }
  `,
  'ken-burns-modern': `
    @keyframes ken-burns-modern {
      0% { transform: scale(1) translate(0, 0); }
      100% { transform: scale(1.04) translate(-0.5%, -0.3%); }
    }
  `,
  'reveal-up': `
    @keyframes reveal-up {
      0% { opacity: 0; transform: translateY(30px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `,
  'reveal-up-slow': `
    @keyframes reveal-up-slow {
      0% { opacity: 0; transform: translateY(40px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `,
  'parallax-float': `
    @keyframes parallax-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `,
  'cinematic-fade': `
    @keyframes cinematic-fade {
      0% { opacity: 0; filter: brightness(0.5); }
      100% { opacity: 1; filter: brightness(1); }
    }
  `,
} as const;

// ============================================
// Helper — Obtenir l'identité d'un type d'événement
// ============================================

export function getEventIdentity(type: EventType): EventIdentity {
  return EVENT_IDENTITIES[type] || EVENT_IDENTITIES.wedding;
}

// ============================================
// Gradients globaux InVitia
// ============================================

export const GRADIENTS = {
  hero: {
    dark: 'bg-gradient-to-b from-black/60 via-black/40 to-black/80',
    light: 'bg-gradient-to-b from-white/60 via-white/40 to-white/80',
    accent: (color: string) =>
      `bg-gradient-to-b from-transparent via-${color}/20 to-${color}/60`,
  },
  card: {
    premium: 'bg-gradient-to-br from-white to-cream/50 border border-gold/20',
    glass: 'bg-white/80 backdrop-blur-xl border border-white/20',
  },
} as const;