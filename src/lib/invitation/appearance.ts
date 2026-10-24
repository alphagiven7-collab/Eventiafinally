import {
  CardTextAlign,
  CardTextSettings,
  CardTextWeight,
  CardTheme,
  HeroTextColor,
  HeroTextPosition,
  HeroTextSettings,
  HeroTextSize,
  HeroTextStyle,
  InvitationModel,
} from '@/types';

export function invitationModel(value?: string): InvitationModel {
  if (value === 'fairepart') return 'fairepart';
  if (value === 'photos') return 'photos';
  return 'ecran';
}

export function heroBrightnessOf(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function veil(value: number): string {
  return Math.min(0.92, Math.max(0.06, value)).toFixed(3);
}

/** 50 reproduit le voile actuel. 0 assombrit la photo, 100 l’éclaircit. */
export function heroLightOf(value?: number) {
  const level = heroBrightnessOf(value);
  const shift = (50 - level) / 50;
  return {
    photo: (0.55 + (level / 100) * 0.9).toFixed(3),
    whiteTop: veil(0.42 + shift * 0.2),
    whiteBottom: veil(0.72 + shift * 0.16),
    blackTop: veil(0.58 + shift * 0.16),
    blackBottom: veil(0.78 + shift * 0.12),
    goldTop: veil(0.4 + shift * 0.18),
    goldBottom: veil(0.68 + shift * 0.14),
  };
}

export function familyMotifsVisible(event: {
  invitationTemplate?: string;
  showFamilyMotifs?: boolean;
}): boolean {
  if (typeof event.showFamilyMotifs === 'boolean') return event.showFamilyMotifs;
  return event.invitationTemplate === 'motifs';
}

const TEXT_STYLES: readonly HeroTextStyle[] = ['classic', 'elegant', 'modern', 'straight', 'script', 'signature'];

export function textStyleOf(value?: string): HeroTextStyle {
  return TEXT_STYLES.includes(value as HeroTextStyle) ? (value as HeroTextStyle) : 'classic';
}

export function textSizeOf(value?: string): HeroTextSize {
  return value === 'small' || value === 'large' ? value : 'normal';
}

export function heroTextOf(value?: HeroTextSettings): Required<HeroTextSettings> {
  const position: HeroTextPosition =
    value?.position === 'top' || value?.position === 'bottom' ? value.position : 'center';
  const size = textSizeOf(value?.size);
  const style = textStyleOf(value?.style);
  const color: HeroTextColor = value?.color === 'black' || value?.color === 'gold' ? value.color : 'white';
  return { position, size, style, color };
}

export function cardTextWeightOf(value?: string): CardTextWeight {
  return value === 'fine' || value === 'strong' ? value : 'clear';
}

export const CARD_THEMES: readonly { id: CardTheme; label: string; hint: string }[] = [
  { id: 'classic', label: 'Classique', hint: 'Cadre fin et ornement discret.' },
  { id: 'botanical', label: 'Jardin botanique', hint: 'Branches dessinées, lavis aquarelle, papier texturé.' },
  { id: 'deco', label: 'Art déco doré', hint: 'Cadre à double filet, éventails d’or, monogramme.' },
  { id: 'envelope', label: 'Enveloppe & sceau', hint: 'La carte s’ouvre depuis une enveloppe scellée.' },
] as const;

export function cardThemeOf(value?: string): CardTheme {
  return CARD_THEMES.some((theme) => theme.id === value) ? (value as CardTheme) : 'classic';
}

export function cardTextOf(value?: CardTextSettings): Required<CardTextSettings> {
  const style = textStyleOf(value?.style);
  const align: CardTextAlign = value?.align === 'left' ? 'left' : 'center';
  return {
    theme: cardThemeOf(value?.theme),
    style,
    messageStyle: value?.messageStyle ? textStyleOf(value.messageStyle) : style,
    size: textSizeOf(value?.size),
    align,
    weight: cardTextWeightOf(value?.weight),
  };
}

export const COLOR_HARMONIES = [
  { name: 'Encre & or', ink: '#1c1917', light: '#c4a574' },
  { name: 'Nuit & ivoire', ink: '#1e293b', light: '#e7d7c1' },
  { name: 'Bordeaux & rose', ink: '#7f1d1d', light: '#e7b8c4' },
  { name: 'Forêt & champagne', ink: '#14532d', light: '#e4d5a8' },
  { name: 'Ardoise & lavande', ink: '#334155', light: '#c4b5fd' },
  { name: 'Corail & crème', ink: '#9a3412', light: '#f3d5c4' },
  { name: 'Prune & perle', ink: '#581c87', light: '#e9d5ff' },
  { name: 'Bleu & sable', ink: '#1e3a8a', light: '#e7d3b0' },
] as const;

export function mixHex(base: string, tint: string, baseShare = 0.82): string {
  const ink = cssColor(base, '#1e293b').slice(1);
  const wash = cssColor(tint, '#d6c4a8').slice(1);
  const channel = (start: number) =>
    Math.round(
      Number.parseInt(ink.slice(start, start + 2), 16) * baseShare +
        Number.parseInt(wash.slice(start, start + 2), 16) * (1 - baseShare),
    );
  return `#${[0, 2, 4].map((start) => channel(start).toString(16).padStart(2, '0')).join('')}`;
}

export function buttonFromPair(ink: string, light: string): string {
  return mixHex(ink, light, 0.84);
}

const HERO_TITLE_SIZE: Record<HeroTextStyle, Record<HeroTextSize, string>> = {
  classic: { small: '1.2rem', normal: '1.5rem', large: '2.55rem' },
  elegant: { small: '1.55rem', normal: '2.15rem', large: '3rem' },
  modern: { small: '1.05rem', normal: '1.45rem', large: '2rem' },
  straight: { small: '0.82rem', normal: '1.05rem', large: '1.45rem' },
  script: { small: '1.9rem', normal: '2.6rem', large: '3.4rem' },
  signature: { small: '2.1rem', normal: '3.1rem', large: '4rem' },
};

export function heroTitleSize(style: HeroTextStyle, size: HeroTextSize): string {
  return HERO_TITLE_SIZE[style][size];
}

export function textFontFamily(style: HeroTextStyle): string {
  if (style === 'elegant') return '"Cormorant Garamond", "Playfair Display", serif';
  if (style === 'modern' || style === 'straight') return '"Montserrat", sans-serif';
  if (style === 'script') return '"Dancing Script", cursive';
  if (style === 'signature') return '"Great Vibes", cursive';
  return '"Playfair Display", Georgia, serif';
}

export function cssColor(value: string | undefined, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? (value as string) : fallback;
}

export function cssColorSoft(value: string | undefined, fallback: string, alpha = 0.34): string {
  const hex = cssColor(value, fallback).slice(1);
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function luminanceOf(hex: string): number {
  const channel = (start: number) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrastRatio(first: string, second: string): number {
  const a = luminanceOf(first);
  const b = luminanceOf(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Rapproche une couleur du noir (fond clair) ou du blanc (fond sombre) jusqu'à ce qu'elle se lise. */
export function readableColor(color: string, dark: boolean, minRatio = 4.5): string {
  const base = cssColor(color, '#1e293b');
  const surface = dark ? '#111827' : '#faf6ee';
  if (contrastRatio(base, surface) >= minRatio) return base;
  const target = dark ? 255 : 0;
  const channels = [1, 3, 5].map((start) => Number.parseInt(base.slice(start, start + 2), 16));
  for (let step = 1; step <= 20; step += 1) {
    const share = step / 20;
    const mixed = channels.map((value) => Math.round(value + (target - value) * share));
    const hex = `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
    if (contrastRatio(hex, surface) >= minRatio) return hex;
  }
  return dark ? '#ffffff' : '#000000';
}

export const INVITATION_CARDS: { id: string; label: string; selector: string }[] = [
  { id: 'message', label: "Carte d'invitation (message)", selector: '.invite-sheet' },
  { id: 'day', label: 'Le jour et le lieu', selector: '#section-when-where' },
  { id: 'gps', label: 'Itinéraire', selector: '#section-gps' },
  { id: 'about', label: 'Notre histoire', selector: '#section-about' },
  { id: 'gallery', label: 'Galerie', selector: '#section-gallery' },
  { id: 'dress', label: 'Code vestimentaire', selector: '#section-dress-code' },
  { id: 'drinks', label: 'Boissons', selector: '#drink-menu-section' },
  { id: 'countdown', label: 'Compte à rebours', selector: '#section-countdown' },
  { id: 'rsvp', label: 'Réponse (RSVP)', selector: '#section-rsvp' },
  { id: 'guestbook', label: "Livre d'or", selector: '#section-guestbook' },
  { id: 'practical', label: 'Infos pratiques', selector: '#section-practical-info' },
  { id: 'gift', label: 'Cadeau / contact', selector: '#section-gift-contact' },
];
