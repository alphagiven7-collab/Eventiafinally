import {
  CardTextAlign,
  CardTextSettings,
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

export function cardTextOf(value?: CardTextSettings): Required<CardTextSettings> {
  const align: CardTextAlign = value?.align === 'left' ? 'left' : 'center';
  return {
    style: textStyleOf(value?.style),
    size: textSizeOf(value?.size),
    align,
  };
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
