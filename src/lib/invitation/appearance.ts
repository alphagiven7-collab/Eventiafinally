import {
  HeroTextColor,
  HeroTextPosition,
  HeroTextSettings,
  HeroTextSize,
  HeroTextStyle,
  InvitationModel,
} from '@/types';

export function invitationModel(value?: string): InvitationModel {
  return value === 'fairepart' ? 'fairepart' : 'ecran';
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
