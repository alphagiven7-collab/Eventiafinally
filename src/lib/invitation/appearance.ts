import {
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

export function heroTextOf(value?: HeroTextSettings): Required<HeroTextSettings> {
  const position: HeroTextPosition =
    value?.position === 'top' || value?.position === 'bottom' ? value.position : 'center';
  const size: HeroTextSize = value?.size === 'small' || value?.size === 'large' ? value.size : 'normal';
  const style: HeroTextStyle =
    value?.style === 'script' || value?.style === 'straight' ? value.style : 'classic';
  const color: HeroTextColor = value?.color === 'black' || value?.color === 'gold' ? value.color : 'white';
  return { position, size, style, color };
}

export function cssColor(value: string | undefined, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? (value as string) : fallback;
}
