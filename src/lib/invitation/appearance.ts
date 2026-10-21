import {
  CardTextAlign,
  CardTextSettings,
  CardTextWeight,
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

export function cardTextOf(value?: CardTextSettings): Required<CardTextSettings> {
  const style = textStyleOf(value?.style);
  const align: CardTextAlign = value?.align === 'left' ? 'left' : 'center';
  return {
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
