'use client';

import { useEffect, useRef } from 'react';
import { EventWithSettings, GuestStatus } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { submitGuestRsvp, listGuestbook } from '@/lib/guests/store';
import { fetchEventMusic } from '@/lib/events/store';
import { checkinQrDataUrl } from '@/lib/guests/checkin-qr';
import { readOfflineInvitation, saveOfflineInvitation, storeOfflineView } from '@/lib/invitation/offline';
import { iosInstallHint, tryInstallPwa } from '@/lib/pwa/install-prompt';

function showPdfNotice(root: HTMLElement, message: string) {
  let note = root.querySelector('#pdf-notice') as HTMLElement | null;
  if (!note) {
    note = document.createElement('div');
    note.id = 'pdf-notice';
    note.setAttribute('role', 'alert');
    note.style.cssText = 'position:fixed;left:12px;right:12px;top:56px;z-index:80;padding:12px 14px;border-radius:14px;background:#fef2f2;color:#b91c1c;font-size:13px;font-weight:650;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.16);';
    root.appendChild(note);
  }
  note.textContent = message;
  note.style.display = 'block';
  window.setTimeout(() => {
    note.style.display = 'none';
  }, 5000);
}

export default function InvitationExperience({
  event,
  guestName,
  guestToken,
  guestStatus,
  guestTable,
  rememberAnswer = true,
  onRsvp,
}: {
  event: EventWithSettings;
  guestName?: string;
  guestToken?: string;
  guestStatus?: GuestStatus;
  guestTable?: string;
  rememberAnswer?: boolean;
  onRsvp?: (result: { status: 'confirmed' | 'declined'; error?: string; notice?: string }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onRsvpRef = useRef(onRsvp);
  onRsvpRef.current = onRsvp;

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.replaceChildren();

    const style = document.createElement('style');
    style.textContent = getOriginalCSS();

    const root = document.createElement('div');
    root.className = 'invitation-experience-root';
    root.innerHTML = getOriginalHTML();
    shadow.append(style, root);

    hydrateEventData(root, event, guestName, guestTable);

    const stopCountdown = event.event_date ? initCountdown(root, event.event_date) : () => {};
    const detachTheme = initThemeToggle(root);
    initGate(root, guestName);
    const detachAbout = initAboutSection(root);
    const detachGallery = initGalleryScroll(root);
    initDrinkMenu(root, event);
    const detachMusic = initMusic(root, event);
    const detachRsvp = initRsvp(root, event, guestToken, guestStatus, rememberAnswer, onRsvpRef);
    const printBtn = root.querySelector('#print-invitation-btn');
    let pdfBusy = false;
    const onPdf = async () => {
      if (pdfBusy || !(printBtn instanceof HTMLButtonElement)) return;
      pdfBusy = true;
      const previous = printBtn.textContent;
      printBtn.textContent = 'PDF…';
      printBtn.disabled = true;
      printBtn.style.opacity = '0.65';
      try {
        const { generateInvitationPdf, downloadBlob } = await import('@/lib/invitation/pdf');
        const result = await generateInvitationPdf(event, {
          name: guestName,
          table: guestTable,
        });
        downloadBlob(result.blob, result.filename);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Le PDF n’a pas pu être créé.';
        showPdfNotice(root, message);
        printBtn.textContent = 'Échec';
        window.setTimeout(() => {
          if (printBtn.isConnected) printBtn.textContent = previous || 'PDF';
        }, 2400);
      } finally {
        if (printBtn.textContent === 'PDF…') printBtn.textContent = previous || 'PDF';
        printBtn.disabled = false;
        printBtn.style.opacity = '';
        pdfBusy = false;
      }
    };
    printBtn?.addEventListener('click', onPdf);
    const offlineBtn = root.querySelector('#save-offline-btn');
    const offlineStatus = root.querySelector('#offline-invitation-status');
    const tokenForOffline = guestToken || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || '' : '');
    const paintOffline = async () => {
      const saved = await readOfflineInvitation(event.slug, tokenForOffline);
      if (!(offlineBtn instanceof HTMLButtonElement) || !(offlineStatus instanceof HTMLElement)) return;
      if (saved && navigator.onLine && event.updated_at && saved.updatedAt !== event.updated_at) {
        offlineBtn.textContent = 'Enregistrer la nouvelle version';
        offlineStatus.textContent = 'Une version plus récente est en ligne. Enregistrez-la à nouveau pour le hors ligne.';
        return;
      }
      if (saved) {
        offlineBtn.textContent = 'Disponible hors ligne';
        offlineStatus.textContent = 'Cette invitation est enregistrée sur cet appareil.';
        return;
      }
      offlineBtn.textContent = 'Installer et enregistrer hors ligne';
      offlineStatus.textContent = navigator.onLine
        ? 'Installe l’application sur cet appareil et enregistre l’invitation pour la relire sans connexion.'
        : 'Cette invitation doit encore être enregistrée pendant que vous êtes en ligne.';
    };
    void paintOffline();
    let offlineBusy = false;
    const onOffline = async () => {
      if (offlineBusy || !(offlineBtn instanceof HTMLButtonElement)) return;
      if (!navigator.onLine) {
        if (offlineStatus instanceof HTMLElement) {
          offlineStatus.textContent = 'Connectez-vous une fois pour enregistrer cette invitation.';
        }
        return;
      }
      offlineBusy = true;
      offlineBtn.disabled = true;
      offlineBtn.textContent = 'Installation…';
      let installNote = '';
      try {
        const installOutcome = await tryInstallPwa();
        if (installOutcome === 'accepted') {
          installNote = 'Application installée. ';
        } else if (installOutcome === 'ios') {
          installNote = `${iosInstallHint()} `;
        }
        offlineBtn.textContent = 'Enregistrement…';
        const shownName = root.querySelector('#display-guest-name')?.textContent?.trim() || '';
        const tableLine = root.querySelector('#guest-table-line') as HTMLElement | null;
        const tableVisible = Boolean(tableLine && tableLine.style.display !== 'none' && tableLine.textContent?.trim());
        const tableText = tableVisible ? (tableLine?.textContent || '').replace(/^Table\s+/i, '').trim() : '';
        const saved = await saveOfflineInvitation({
          event,
          token: tokenForOffline,
          guestName: tokenForOffline ? (guestName || shownName) : undefined,
          guestTable: tokenForOffline ? (guestTable || tableText) : undefined,
        });
        hydrateEventData(root, saved.event, saved.guestName, saved.guestTable);
        await paintOffline();
        const clone = root.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('audio, source').forEach((node) => node.remove());
        const styleEl = shadow.querySelector('style');
        await storeOfflineView(saved.key, {
          css: styleEl?.textContent || '',
          html: clone.outerHTML,
          secrets: [event.adminCode || '', event.user_id || ''],
        });
        if (offlineStatus instanceof HTMLElement && installNote) {
          offlineStatus.textContent = `${installNote}Cette invitation est enregistrée sur cet appareil.`;
        }
      } catch {
        if (offlineStatus instanceof HTMLElement) {
          offlineStatus.textContent = 'L’enregistrement hors ligne n’a pas abouti. Réessayez en ligne.';
        }
        offlineBtn.textContent = 'Installer et enregistrer hors ligne';
      } finally {
        offlineBtn.disabled = false;
        offlineBusy = false;
      }
    };
    offlineBtn?.addEventListener('click', onOffline);
    const detachModals = initModals(root);
    const detachGuestbook = initGuestbook(root, event.slug);

    return () => {
      stopCountdown();
      detachTheme();
      detachAbout();
      detachGallery();
      detachMusic();
      detachRsvp();
      printBtn?.removeEventListener('click', onPdf);
      offlineBtn?.removeEventListener('click', onOffline);
      detachModals();
      detachGuestbook();
      shadow.replaceChildren();
    };
  }, [event, guestName, guestToken, guestStatus, guestTable, rememberAnswer]);

  return <div ref={containerRef} className="invitation-experience-host" />;
}

function mauveButton(hex: string): string {
  const match = hex.trim().toLowerCase().match(/^#([0-9a-f]{6})$/);
  if (!match) return '#7c3aed';
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const saturation = max === 0 ? 0 : delta / max;
  if (saturation > 0.28 && (hue <= 28 || hue >= 320)) return '#7c3aed';
  return hex;
}

function hydrateEventData(root: HTMLElement, event: EventWithSettings, guestName?: string, guestTable?: string) {
  const $ = (sel: string) => root.querySelector(sel) as HTMLElement | null;
  const setText = (sel: string, text: string) => {
    const el = $(sel);
    if (el) el.textContent = text;
  };
  const setImg = (sel: string, src: string) => {
    const el = $(sel) as HTMLImageElement | null;
    if (el && src) el.src = src;
  };
  const setHref = (sel: string, href: string) => {
    const el = $(sel) as HTMLAnchorElement | null;
    if (el && href) el.href = href;
  };

  // Couleurs personnalisées. Un bouton rouge ou rose devient mauve.
  const primaryColor = event.branding?.primaryColor || '#5b21b6';
  const accentColor = event.branding?.accentColor || '#2563eb';
  const rsvpColor = mauveButton(event.rsvpButtonColor || accentColor || '#7c3aed');
  root.style.setProperty('--primary-color', primaryColor);
  root.style.setProperty('--accent-color', accentColor);
  root.style.setProperty('--rsvp-color', rsvpColor);
  root.dataset.template = event.invitationTemplate === 'motifs' ? 'motifs' : 'elegance';

  // Hero & Couverture
  const heroImg =
    event.heroImage ||
    event.hero_image ||
    event.branding?.heroImage ||
    event.cover_image ||
    event.bestPhotos?.[0] ||
    '';
  const welcomeImg =
    event.welcomeImage ||
    event.welcome_image ||
    event.branding?.welcomeImage ||
    heroImg;

  if (heroImg) {
    root.style.setProperty('--hero-image-url', `url("${heroImg}")`);
  }
  if (welcomeImg) {
    root.style.setProperty('--welcome-image-url', `url("${welcomeImg}")`);
  }

  // Titres & Prénoms
  const leftName = (event.coupleLeft || '').trim();
  const rightName = (event.coupleRight || '').trim();
  const hasBothNames = Boolean(leftName && rightName);
  const coupleDisplay = hasBothNames
    ? `${leftName} & ${rightName}`
    : leftName || rightName || event.title;

  setText('#hero-title', event.title);
  setText(
    '#hero-subtitle',
    event.subtitle || (hasBothNames ? `${leftName} & ${rightName}` : event.location || '')
  );
  setText('#welcome-gate-title', coupleDisplay);

  const coupleRow = $('#couple-row-container');
  const joinBadge = $('#couple-join-badge');
  const rightNameEl = $('#couple-name-right');
  setText('#couple-name-left', leftName || event.title);
  if (rightName) {
    setText('#couple-name-right', rightName);
    if (joinBadge) joinBadge.style.display = 'inline-block';
    if (rightNameEl) rightNameEl.style.display = 'inline-block';
  } else {
    if (joinBadge) joinBadge.style.display = 'none';
    if (rightNameEl) rightNameEl.style.display = 'none';
  }
  if (coupleRow) coupleRow.style.display = 'flex';

  // Nom de l'invité
  if (guestName) {
    setText('#display-guest-name', guestName);
  }

  const tableLine = $('#guest-table-line');
  if (tableLine) {
    if (guestTable && guestTable.trim()) {
      tableLine.textContent = `Table ${guestTable.trim()}`;
      tableLine.style.display = 'inline-flex';
    } else {
      tableLine.style.display = 'none';
    }
  }

  // Textes de la carte d'invitation
  const coupleForIntro = hasBothNames ? `${leftName} et ${rightName}` : event.title;
  const introText = (
    event.inviteIntro ||
    `C'est avec une immense joie que nous vous convions à partager ce moment précieux avec nous.`
  ).replace(/\{couple\}/g, coupleForIntro);
  setText('#invite-intro-paragraph', introText);

  const secondaryEl = $('#invite-secondary-text');
  if (secondaryEl) {
    if (event.inviteSecondary && event.inviteSecondary.trim()) {
      secondaryEl.textContent = event.inviteSecondary;
      secondaryEl.style.display = 'block';
    } else {
      secondaryEl.style.display = 'none';
    }
  }

  const mainTextWrap = $('#invite-main-text');
  if (mainTextWrap) {
    if (event.mainText && event.mainText.trim()) {
      setText('#invitation-main-text', event.mainText);
      mainTextWrap.style.display = 'block';
    } else {
      mainTextWrap.style.display = 'none';
    }
  }

  // Date & Calendrier dynamique
  if (event.event_date) {
    const d = new Date(event.event_date);
    if (!isNaN(d.getTime())) {
      const dayNum = d.getDate();
      const monthYear = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      setText('#event-day', dayNum.toString().padStart(2, '0'));
      setText('#event-month-year', monthYear);
      setText('#calendar-month-label', monthYear);
      setText('#summary-date', `${dayNum} ${monthYear}`);
      setText('#hero-date-pill', d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
      renderDynamicCalendar(root, d);
    }
  }

  // Heure
  const timeWrap = $('#event-time-badge');
  if (event.event_time) {
    setText('#event-time-range', event.event_time);
    setText('#summary-time', event.event_time);
    if (timeWrap) timeWrap.style.display = 'block';
  } else if (timeWrap) {
    timeWrap.style.display = 'none';
  }

  // Programme
  const programContainer = $('#program-timeline');
  const programTitleEl = $('#program-section-title');
  if (programContainer) {
    if (event.program && event.program.length > 0) {
      if (programTitleEl) {
        programTitleEl.textContent = event.programSectionTitle || 'Programme de la journée';
        programTitleEl.style.display = 'block';
      }
      programContainer.style.display = 'flex';
      programContainer.innerHTML = event.program
        .map((item, i) => {
          const colors: Record<string, string> = {
            blue: '#3b82f6',
            green: '#10b981',
            pink: '#7c3aed',
            purple: '#8b5cf6',
          };
          const dotColor = colors[item.color] || rsvpColor;
          return `
            <div style="display:flex;align-items:flex-start;gap:14px;">
              <div style="display:flex;flex-direction:column;align-items:center;padding-top:3px;">
                <div style="width:11px;height:11px;border-radius:999px;background:${dotColor};box-shadow:0 0 0 4px rgba(124,58,237,0.1);"></div>
                ${i < event.program!.length - 1 ? '<div class="inv-divider-line" style="width:1px;height:36px;background:#e5e7eb;margin-top:4px;"></div>' : ''}
              </div>
              <div style="padding-bottom:6px;">
                <p style="font-size:11px;font-weight:600;color:${dotColor};margin-bottom:2px;letter-spacing:0.05em;">${item.time}</p>
                <p class="inv-text-primary" style="font-size:14px;font-weight:500;">${item.title}</p>
              </div>
            </div>`;
        })
        .join('');
    } else {
      if (programTitleEl) programTitleEl.style.display = 'none';
      programContainer.style.display = 'none';
    }
  }

  // Lieu & Bouton Itinéraire
  const venueName = event.venue || event.venueDetails?.title || event.location || 'Lieu de réception';
  const venueAddr = event.venueDetails?.address || event.address || event.location || '';
  setText('#venue-title', venueName);
  setText('#venue-address', venueAddr);
  setText('#summary-venue', venueName);
  setText('#summary-address', venueAddr);

  const customMapImg = event.venueDetails?.mapImage || event.mapImage || '';
  const mapFrame = $('#map-frame');
  if (customMapImg) {
    setImg('#map-image', customMapImg);
    if (mapFrame) mapFrame.style.display = 'block';
  } else if (mapFrame) {
    mapFrame.style.display = 'none';
  }

  const rawMapLink = event.links?.map || event.mapLink || '';
  const mapQuery = encodeURIComponent([venueName, venueAddr].filter(Boolean).join(', '));
  const resolvedMapUrl =
    rawMapLink && rawMapLink !== '#'
      ? rawMapLink
      : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  setHref('#venue-map-link', resolvedMapUrl);

  // Texte du bouton RSVP
  const btnText = event.reserveText || 'Confirmer ma présence';
  setText('#reserve-deadline-text', btnText);
  setText('#confirm-presence-label', btnText);
  if (event.rsvpDeadlineText) {
    setText('#rsvp-deadline-caption', event.rsvpDeadlineText);
    const captionEl = $('#rsvp-deadline-caption');
    if (captionEl) captionEl.style.display = 'block';
  }

  // Section À propos (Notre histoire)
  const aboutSection = $('#section-about');
  const hasStory = Boolean(
    (event.aboutStory1 && event.aboutStory1.trim()) ||
      (event.aboutStory2 && event.aboutStory2.trim()) ||
      event.aboutImage
  );
  if (aboutSection) {
    if (hasStory) {
      aboutSection.style.display = 'block';
      const cover = event.aboutImage || heroImg;
      if (cover) setImg('#about-cover-image', cover);
      setText('#about-card-title', event.aboutTitle || 'Notre histoire');
      setText('#about-story-1', event.aboutStory1 || '');
      setText('#about-story-2', event.aboutStory2 || '');
    } else {
      aboutSection.style.display = 'none';
    }
  }

  // Section Galerie Photos
  const gallerySection = $('#section-gallery');
  const showGallery = event.sections?.gallery !== false;
  const uploadedPhotos = (event.bestPhotos || []).filter(Boolean);
  if (gallerySection) {
    if (!showGallery || uploadedPhotos.length === 0) {
      gallerySection.style.display = 'none';
    } else {
      gallerySection.style.display = 'block';
      if (uploadedPhotos.length > 0) {
        const gridContainer = $('#best-photos-grid');
        if (gridContainer) {
          const topPhotos = uploadedPhotos.slice(0, 2);
          gridContainer.style.gridTemplateColumns =
            topPhotos.length === 1 ? '1fr' : 'repeat(2, 1fr)';
          gridContainer.innerHTML = topPhotos
            .map(
              (src, idx) =>
                `<img src="${src}" style="height:175px;width:100%;object-fit:cover;border-radius:12px;" alt="Photo ${idx + 1}">`
            )
            .join('');
        }
        const marqueeTrack = root.querySelector('.premium-marquee-track') as HTMLElement | null;
        if (marqueeTrack) {
          const loopPhotos =
            uploadedPhotos.length >= 3
              ? [...uploadedPhotos, ...uploadedPhotos]
              : [...uploadedPhotos, ...uploadedPhotos, ...uploadedPhotos, ...uploadedPhotos];
          marqueeTrack.innerHTML = loopPhotos
            .map(
              (p, idx) =>
                `<img src="${p}" alt="Souvenir ${idx + 1}" style="width:120px;height:82px;border-radius:0.65rem;object-fit:cover;flex-shrink:0;">`
            )
            .join('');
        }
      }
    }
  }

  // Section Tenue Vestimentaire
  const dressSection = $('#section-dress-code');
  const showDress = event.sections?.dressCode !== false;
  if (dressSection) {
    if (!showDress || (!event.dressCodeTitle?.trim() && !(event.dressImages && event.dressImages.length))) {
      dressSection.style.display = 'none';
    } else {
      dressSection.style.display = 'block';
      if (event.dressCodeTitle) {
        setText('#dress-code-title', event.dressCodeTitle);
      }
      const dressWrapper = root.querySelector('.dress-marquee-wrapper') as HTMLElement | null;
      const dressTrack = root.querySelector('.dress-marquee-track') as HTMLElement | null;
      if (event.dressImages && event.dressImages.length > 0 && dressTrack) {
        const loopDress =
          event.dressImages.length >= 3
            ? [...event.dressImages, ...event.dressImages]
            : [...event.dressImages, ...event.dressImages, ...event.dressImages, ...event.dressImages];
        dressTrack.innerHTML = loopDress
          .map(
            (p) =>
              `<img src="${p}" style="width:120px;height:160px;object-fit:cover;border-radius:0.75rem;border:1px solid rgba(148,163,184,0.25);flex-shrink:0;" alt="Tenue">`
          )
          .join('');
        if (dressWrapper) dressWrapper.style.display = 'block';
      } else if (dressWrapper) {
        dressWrapper.style.display = 'none';
      }
    }
  }

  // Section Compte à rebours
  const countdownSection = $('#section-countdown');
  if (countdownSection) {
    countdownSection.style.display = event.sections?.countdown === false ? 'none' : 'block';
  }

  // Section Infos pratiques
  const practicalSection = $('#section-practical-info');
  const infoList = $('#practical-info-list');
  if (practicalSection && infoList) {
    const validInfos = (event.practicalInfo || []).filter(
      (item) => (item.title && item.title.trim()) || (item.text && item.text.trim())
    );
    if (validInfos.length > 0) {
      practicalSection.style.display = 'block';
      setText('#practical-info-title', event.practicalSectionTitle || 'Informations pratiques');
      const iconMap: Record<string, string> = {
        car: 'M5 17h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2zm0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m6 0h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2zm0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0',
        bed: 'M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7h18M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2M7 11h10',
        wine: 'M8 22h8M7 2l1 6c0 2.5 2 4 5 4s5-1.5 5-4l1-6H7zM12 14v4',
      };
      infoList.innerHTML = validInfos
        .map(
          (item) => `
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div class="inv-icon-badge" style="width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg style="width:16px;height:16px;color:var(--icon-color, #2563eb);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="${iconMap[item.icon] || iconMap.car}"/>
              </svg>
            </div>
            <div>
              <p class="inv-text-primary" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">${item.title}</p>
              <p class="inv-text-muted" style="font-size:12px;line-height:1.5;margin-top:2px;">${item.text}</p>
            </div>
          </div>
        `
        )
        .join('');
      setText('#practical-info-count', `${validInfos.length} info${validInfos.length > 1 ? 's' : ''}`);
    } else {
      practicalSection.style.display = 'none';
    }
  }

  // Liens Cadeau / Cagnotte / WhatsApp / Contact
  const giftSection = $('#section-gift-contact');
  const donationBtn = $('#gift-donation-link') as HTMLAnchorElement | null;
  const whatsappBtn = $('#gift-whatsapp-link') as HTMLAnchorElement | null;
  const contactBtn = $('#support-email-link') as HTMLAnchorElement | null;

  const donationUrl = event.links?.donation || '';
  const whatsappPhone = (event.links?.whatsappDonation || event.whatsappDonationPhone || '').replace(/[^\d+]/g, '');
  const whatsappMsg =
    event.links?.donationWhatsAppMessage ||
    `Bonjour ! Merci pour l'invitation à "${event.title}".`;
  const supportEmail = event.links?.supportEmail || event.supportEmail || '';

  let hasAnyContactAction = false;

  if (donationBtn) {
    if (donationUrl) {
      donationBtn.href = donationUrl;
      donationBtn.style.display = 'inline-flex';
      hasAnyContactAction = true;
    } else {
      donationBtn.style.display = 'none';
    }
  }

  if (whatsappBtn) {
    if (whatsappPhone) {
      const cleanPhone = whatsappPhone.replace(/^\+/, '');
      whatsappBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;
      whatsappBtn.style.display = 'inline-flex';
      hasAnyContactAction = true;
    } else {
      whatsappBtn.style.display = 'none';
    }
  }

  if (contactBtn) {
    if (supportEmail) {
      contactBtn.href = `mailto:${supportEmail}`;
      contactBtn.style.display = 'inline-flex';
      hasAnyContactAction = true;
    } else {
      contactBtn.style.display = 'none';
    }
  }

  if (giftSection) {
    giftSection.style.display = hasAnyContactAction ? 'block' : 'none';
  }

  const motifSection = $('#section-family-motifs');
  const showMotif = (boxSel: string, imgSel: string, src?: string) => {
    const box = $(boxSel);
    const img = root.querySelector(imgSel) as HTMLImageElement | null;
    if (!box) return false;
    if (event.invitationTemplate === 'motifs' && src) {
      if (img) img.src = src;
      box.style.display = 'block';
      return true;
    }
    box.style.display = 'none';
    return false;
  };
  const groomShown = showMotif('#groom-motif', '#groom-motif-img', event.groomMotifImage);
  const brideShown = showMotif('#bride-motif', '#bride-motif-img', event.brideMotifImage);
  const hasMotif = groomShown || brideShown;
  if (motifSection) motifSection.style.display = hasMotif ? 'block' : 'none';

  const main = root.querySelector('#main-view');
  [
    'section-when-where',
    'section-dress-code',
    'section-gallery',
    'section-about',
    'drink-menu-section',
    'section-date-place',
    'section-countdown',
    'section-family-motifs',
    'section-rsvp',
    'section-guestbook',
    'section-practical-info',
    'section-gift-contact',
  ].forEach((id) => {
    const section = root.querySelector(`#${id}`);
    if (section && main) main.appendChild(section);
  });
  ['date-modal', 'place-modal', 'guestbook-modal'].forEach((id) => {
    const modal = root.querySelector(`#${id}`);
    if (modal && main) main.appendChild(modal);
  });
}

function renderDynamicCalendar(root: HTMLElement, date: Date) {
  const grid = root.querySelector('#calendar-days-grid') as HTMLElement | null;
  if (!grid) return;

  const year = date.getFullYear();
  const month = date.getMonth();
  const targetDay = date.getDate();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const leadingEmptyDays = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: string[] = [];
  for (let i = 0; i < leadingEmptyDays; i++) {
    cells.push('<div></div>');
  }
  for (let d = 1; d <= daysInMonth; d++) {
    if (d === targetDay) {
      cells.push(`
        <div id="calendar-event-day" style="padding:5px 0;background:var(--rsvp-color, #7c3aed);color:white;border-radius:8px;font-weight:700;box-shadow:0 4px 10px rgba(124,58,237,0.3);position:relative;">
          ${d}
        </div>
      `);
    } else {
      cells.push(`<div style="padding:5px 0;">${d}</div>`);
    }
  }
  grid.innerHTML = cells.join('');
}

function initCountdown(root: HTMLElement, dateStr: string) {
  const target = new Date(dateStr).getTime();
  if (isNaN(target)) return () => {};

  function update() {
    const now = Date.now();
    const diff = Math.max(0, target - now);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const setVal = (sel: string, val: string) => {
      const el = root.querySelector(sel);
      if (el) el.textContent = val;
    };
    setVal('#days', days.toString().padStart(2, '0'));
    setVal('#hours', hours.toString().padStart(2, '0'));
    setVal('#minutes', minutes.toString().padStart(2, '0'));
    setVal('#seconds', seconds.toString().padStart(2, '0'));

    const statusEl = root.querySelector('#countdown-status');
    if (statusEl) {
      const sameDay = new Date(target).toDateString() === new Date(now).toDateString();
      statusEl.textContent = diff > 0
        ? 'Compte à rebours avant le grand jour'
        : sameDay
          ? "C'est aujourd'hui !"
          : 'Le grand jour est passé';
    }
  }

  update();
  const timer = window.setInterval(update, 1000);
  return () => window.clearInterval(timer);
}

function initAboutSection(root: HTMLElement) {
  const card = root.querySelector('#about-section-card') as HTMLElement | null;
  const detail = root.querySelector('#about-toggle-detail') as HTMLElement | null;
  const label = root.querySelector('#about-toggle-label') as HTMLElement | null;
  if (!card || !detail) return () => {};

  const toggle = () => {
    const isHidden = detail.style.display === 'none' || !detail.style.display;
    detail.style.display = isHidden ? 'block' : 'none';
    if (label) {
      label.textContent = isHidden ? 'Replier notre histoire ↑' : 'Découvrir notre histoire ›';
    }
  };

  card.addEventListener('click', toggle);
  return () => card.removeEventListener('click', toggle);
}

function initGalleryScroll(root: HTMLElement) {
  const trigger = root.querySelector('#gallery-open-text') as HTMLElement | null;
  const marquee = root.querySelector('.best-photos-shell .premium-marquee') as HTMLElement | null;
  if (!trigger || !marquee) return () => {};

  const onClick = () => {
    marquee.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  trigger.addEventListener('click', onClick);
  return () => trigger.removeEventListener('click', onClick);
}

function dayHasPassed(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return Date.now() > end.getTime();
}

function initRsvp(
  root: HTMLElement,
  event: EventWithSettings,
  guestToken?: string,
  guestStatus?: GuestStatus,
  rememberAnswer = true,
  onRsvpRef?: { current?: (result: { status: 'confirmed' | 'declined'; error?: string; notice?: string }) => void },
) {
  const slug = event.slug;
  const responsesClosed = dayHasPassed(event.rsvpDeadline) || dayHasPassed(event.event_date);
  const note = root.querySelector('#rsvp-status-note') as HTMLElement | null;
  const confirmBtn = root.querySelector('#confirm-presence-btn') as HTMLButtonElement | null;
  const reserveBtn = root.querySelector('#reserve-deadline-btn') as HTMLButtonElement | null;
  const declineBtn = root.querySelector('#decline-presence-btn') as HTMLButtonElement | null;
  const rsvpSection = root.querySelector('#section-rsvp') as HTMLElement | null;
  const localKey = `invitia_rsvp_${slug}`;

  const setNote = (text: string, isConfirmed?: boolean) => {
    if (!note) return;
    note.textContent = text;
    note.style.color = isConfirmed === false ? '#9ca3af' : 'var(--rsvp-color, #7c3aed)';
  };

  const token =
    guestToken ||
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || '' : '');

  const showCheckinQr = async () => {
    const box = root.querySelector('#checkin-pass') as HTMLElement | null;
    const img = root.querySelector('#checkin-qr') as HTMLImageElement | null;
    const caption = root.querySelector('#checkin-qr-caption');
    if (!box || !img || !token) {
      if (box) box.style.display = 'none';
      return;
    }
    const name = root.querySelector('#display-guest-name')?.textContent?.trim() || '';
    const tableEl = root.querySelector('#guest-table-line') as HTMLElement | null;
    const tableLabel = tableEl && tableEl.style.display !== 'none' ? tableEl.textContent?.trim() || '' : '';
    img.src = await checkinQrDataUrl(token, 180);
    img.alt = 'Carte d’entrée';
    if (caption) caption.textContent = [name, tableLabel].filter(Boolean).join(' · ');
    const download = root.querySelector('#download-checkin-qr') as HTMLAnchorElement | null;
    if (download) {
      download.href = img.src;
      download.download = 'carte-entree.png';
    }
    box.style.display = 'block';
  };

  const hideCheckinQr = () => {
    const box = root.querySelector('#checkin-pass') as HTMLElement | null;
    if (box) box.style.display = 'none';
  };

  const applyVisualState = (status: 'confirmed' | 'declined') => {
    if (status === 'confirmed') {
      setNote('Votre présence est bien confirmée. Merci !', true);
      if (confirmBtn) {
        const lbl = confirmBtn.querySelector('#confirm-presence-label');
        if (lbl) lbl.textContent = 'Présence confirmée';
      }
      if (reserveBtn) {
        const topLbl = reserveBtn.querySelector('#reserve-deadline-text');
        if (topLbl) topLbl.textContent = 'Présence confirmée';
      }
      void showCheckinQr();
    } else if (status === 'declined') {
      hideCheckinQr();
      setNote('Votre réponse (ne pourra pas venir) est bien enregistrée.', false);
    }
  };

  let alreadyAnswered = false;
  if (guestStatus === 'confirmed' || guestStatus === 'declined') {
    alreadyAnswered = true;
    applyVisualState(guestStatus);
  } else if (rememberAnswer) {
    try {
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal === 'confirmed' || savedLocal === 'declined') {
        alreadyAnswered = true;
        applyVisualState(savedLocal);
      }
    } catch {}
  }

  const paintAnswer = (text: string) => {
    const top = reserveBtn?.querySelector('#reserve-deadline-text');
    const bottom = confirmBtn?.querySelector('#confirm-presence-label');
    if (top) top.textContent = text;
    if (bottom) bottom.textContent = text;
  };

  const respond = async (status: 'confirmed' | 'declined', button: HTMLButtonElement | null) => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const pending = { token, status, message: (root.querySelector('#guest-message') as HTMLTextAreaElement | null)?.value.trim() || '', slug, at: Date.now() };
      try {
        localStorage.setItem('eventia-rsvp-pending', JSON.stringify(pending));
      } catch {
        /* la file locale est indisponible */
      }
      if (button) button.disabled = false;
      paintAnswer('En attente');
      setNote('En attente de synchronisation. La réponse sera envoyée dès le retour de la connexion.', false);
      return;
    }
    if (responsesClosed) {
      paintAnswer('Réponses closes');
      setNote('La date est passée. Les réponses sont closes.', false);
      onRsvpRef?.current?.({ status, error: 'La date est passée. Les réponses sont closes.' });
      return;
    }
    if (button) button.disabled = true;
    paintAnswer('Enregistrement…');
    setNote('Enregistrement de votre réponse…', true);
    const messageField = root.querySelector('#guest-message') as HTMLTextAreaElement | null;
    const message = messageField?.value.trim() || undefined;

    try {
      if (token && isSupabaseReady()) {
        const result = await Promise.race([
          submitGuestRsvp(createClient(), { token, status, message }),
          new Promise<{ error: string }>((resolve) => {
            window.setTimeout(() => resolve({ error: 'La confirmation met trop de temps. Réessayez.' }), 12000);
          }),
        ]);
        if (button) button.disabled = false;
        if (result.error) {
          paintAnswer('Réessayer');
          setNote(result.error, false);
          onRsvpRef?.current?.({ status, error: result.error });
          return;
        }
      } else if (button) {
        button.disabled = false;
      }

      if (rememberAnswer) {
        try {
          localStorage.setItem(localKey, status);
        } catch {}
      }
      applyVisualState(status);
      paintAnswer(status === 'confirmed' ? 'Présence confirmée' : 'Réponse enregistrée');
      const notice = !token
        ? status === 'confirmed'
          ? rememberAnswer
            ? 'Présence confirmée sur ce téléphone seulement. Les mariés la voient quand l’invité utilise son lien personnel.'
            : 'Aperçu seulement : cette confirmation n’est pas envoyée aux mariés.'
          : rememberAnswer
            ? 'Réponse notée sur ce téléphone seulement. Les mariés la voient quand l’invité utilise son lien personnel.'
            : 'Aperçu seulement : cette réponse n’est pas envoyée aux mariés.'
        : status === 'confirmed'
          ? 'Présence confirmée. Merci !'
          : 'Votre réponse est enregistrée.';
      setNote(notice, status === 'confirmed');
      if (token) void refreshGuestbookPreview(root, slug);
      onRsvpRef?.current?.({ status, notice });
    } catch {
      if (button) button.disabled = false;
      paintAnswer('Réessayer');
      const failure = 'La confirmation n’a pas abouti. Réessayez.';
      setNote(failure, false);
      onRsvpRef?.current?.({ status, error: failure });
    }
  };

  const onReserveTopClick = () => {
    if (rsvpSection) {
      rsvpSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    void respond('confirmed', reserveBtn);
  };
  const onConfirm = () => {
    void respond('confirmed', confirmBtn);
  };
  const onDecline = () => {
    void respond('declined', declineBtn);
  };

  if (responsesClosed) {
    [confirmBtn, reserveBtn, declineBtn].forEach((button) => {
      if (!button) return;
      button.disabled = true;
      button.style.opacity = '0.55';
      button.style.cursor = 'not-allowed';
    });
    if (!alreadyAnswered) setNote('La date est passée. Les réponses sont closes.', false);
  }

  const flushPendingRsvp = async () => {
    if (!navigator.onLine || !token || !isSupabaseReady()) return;
    const raw = localStorage.getItem('eventia-rsvp-pending');
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as { token?: string; status?: 'confirmed' | 'declined'; message?: string; slug?: string };
      if (pending.slug !== slug || pending.token !== token || (pending.status !== 'confirmed' && pending.status !== 'declined')) return;
      const result = await submitGuestRsvp(createClient(), { token, status: pending.status, message: pending.message || undefined });
      if (result.error) return;
      localStorage.removeItem('eventia-rsvp-pending');
      applyVisualState(pending.status);
      setNote(pending.status === 'confirmed' ? 'Présence confirmée. Merci !' : 'Votre réponse est enregistrée.', pending.status === 'confirmed');
      onRsvpRef?.current?.({ status: pending.status, notice: pending.status === 'confirmed' ? 'Présence confirmée. Merci !' : 'Votre réponse est enregistrée.' });
    } catch {
      /* on réessaiera au prochain retour en ligne */
    }
  };
  window.addEventListener('online', flushPendingRsvp);
  void flushPendingRsvp();

  confirmBtn?.addEventListener('click', onConfirm);
  reserveBtn?.addEventListener('click', onReserveTopClick);
  declineBtn?.addEventListener('click', onDecline);

  return () => {
    window.removeEventListener('online', flushPendingRsvp);
    confirmBtn?.removeEventListener('click', onConfirm);
    reserveBtn?.removeEventListener('click', onReserveTopClick);
    declineBtn?.removeEventListener('click', onDecline);
  };
}

function initGate(root: HTMLElement, guestName?: string) {
  const gate = root.querySelector('#welcome-gate') as HTMLElement | null;
  const mainView = root.querySelector('#main-view') as HTMLElement | null;
  if (gate) gate.style.display = 'none';
  if (mainView) {
    mainView.style.display = 'block';
    mainView.style.opacity = '1';
  }
  if (guestName) {
    const displayEl = root.querySelector('#display-guest-name');
    if (displayEl) displayEl.textContent = guestName;
  }
}

function readIsDark(): boolean {
  try {
    const explicit = localStorage.getItem('invitia_theme');
    if (explicit === 'dark' || explicit === 'light') return explicit === 'dark';
    const theme = localStorage.getItem('theme') || localStorage.getItem('wedding_theme_mode');
    if (theme === 'dark' || theme === 'light') return theme === 'dark';
  } catch {
    /* stockage indisponible */
  }
  if (document.documentElement.classList.contains('dark')) return true;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function applyDocumentTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

function initThemeToggle(root: HTMLElement) {
  const toggle = root.querySelector('#theme-toggle-input') as HTMLInputElement | null;
  const thumb = root.querySelector('.theme-thumb') as HTMLElement | null;
  if (!toggle) return () => {};

  const sunSvg = `<svg style="width:11px;height:11px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
  const moonSvg = `<svg style="width:11px;height:11px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

  const paintInvitation = (isDark: boolean) => {
    toggle.checked = isDark;
    root.classList.toggle('dark-mode-applied', isDark);
    if (thumb) {
      thumb.style.transform = isDark ? 'translateX(18px)' : 'translateX(0)';
      thumb.style.background = '#2563eb';
      thumb.style.color = '#ffffff';
      thumb.innerHTML = isDark ? moonSvg : sunSvg;
    }
  };

  const initialDark = document.documentElement.classList.contains('dark') || readIsDark();
  applyDocumentTheme(initialDark);
  paintInvitation(initialDark);

  const onExternal = (event: Event) => {
    const next = (event as CustomEvent<string>).detail;
    paintInvitation(next === 'dark' || next === 'light' ? next === 'dark' : readIsDark());
  };

  const onClassChange = () => {
    paintInvitation(document.documentElement.classList.contains('dark'));
  };

  const onChange = () => {
    const isDark = toggle.checked;
    try {
      localStorage.setItem('invitia_theme', isDark ? 'dark' : 'light');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      /* stockage indisponible */
    }
    applyDocumentTheme(isDark);
    paintInvitation(isDark);
    window.dispatchEvent(new CustomEvent('invitia-theme-change', { detail: isDark ? 'dark' : 'light' }));
  };

  const observer = new MutationObserver(onClassChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  toggle.addEventListener('change', onChange);
  window.addEventListener('invitia-theme-change', onExternal);

  return () => {
    observer.disconnect();
    toggle.removeEventListener('change', onChange);
    window.removeEventListener('invitia-theme-change', onExternal);
  };
}

function getDrinkIconSvg(id: string): string {
  const icons: Record<string, string> = {
    champagne: `<svg style="width:28px;height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/></svg>`,
    'vin-rouge': `<svg style="width:28px;height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/></svg>`,
    'vin-blanc': `<svg style="width:28px;height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/></svg>`,
    cocktail: `<svg style="width:28px;height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/></svg>`,
    biere: `<svg style="width:28px;height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6"/><path d="M13 12v6"/><path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 3 11 3s2 .5 3 .5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/></svg>`,
    soft: `<svg style="width:28px;height:28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1.5 12a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8L6 8Z"/><path d="M15 2l-2 6"/><path d="M5 8h14"/></svg>`,
  };
  return icons[id] || icons.champagne;
}

function initDrinkMenu(root: HTMLElement, event?: EventWithSettings) {
  const section = root.querySelector('#drink-menu-section') as HTMLElement | null;
  const grid = root.querySelector('#drink-menu-grid') as HTMLElement | null;
  if (!section || !grid) return;

  const defaultDrinks = event?.drinks || [];
  if (!section || !grid || defaultDrinks.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }

  const selected = new Set<string>();
  const storageKey = `wedding_drink_pick_${event?.slug || 'default'}`;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) JSON.parse(saved).forEach((s: string) => selected.add(s));
  } catch {}

  const checkSvg = `<svg style="width:13px;height:13px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  function render() {
    if (!grid) return;
    grid.innerHTML = defaultDrinks
      .map(
        (d) => `
      <label class="drink-card ${selected.has(d.id) ? 'is-selected' : ''}" data-drink="${d.id}">
        <input type="checkbox" class="drink-card-input" value="${d.id}" ${selected.has(d.id) ? 'checked' : ''}>
        <div class="drink-card-media">
          <div class="drink-card-icon-wrap" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--icon-color, #2563eb);">
            ${getDrinkIconSvg(d.id)}
          </div>
          <span class="drink-card-check">${selected.has(d.id) ? checkSvg : ''}</span>
        </div>
        <div class="drink-card-body">
          <span class="drink-card-title">${escapeHtml(d.name)}</span>
          <span class="drink-card-desc">${escapeHtml(d.desc || '')}</span>
        </div>
      </label>
    `
      )
      .join('');

    grid.querySelectorAll('.drink-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const id = (card as HTMLElement).dataset.drink!;
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        try {
          localStorage.setItem(storageKey, JSON.stringify([...selected]));
        } catch {}
        render();
      });
    });
  }

  render();
  section.style.display = 'block';
}

function initMusic(root: HTMLElement, event: EventWithSettings) {
  if (!event.ambiance?.enabled) return () => {};

  const btn = root.querySelector('#music-toggle-btn') as HTMLButtonElement | null;
  const audio = root.querySelector('#background-music') as HTMLAudioElement | null;
  if (!btn || !audio) return () => {};

  const customUrl = event.ambiance.musicUrl || '';
  const hasFile = Boolean(event.ambiance.hasFile) || customUrl.startsWith('data:');
  const directSrc = customUrl.startsWith('data:') || customUrl.startsWith('http') ? customUrl : '';
  const defaultMusic = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  audio.volume = event.ambiance.volume || 0.35;
  audio.loop = true;
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  audio.style.display = 'block';
  audio.style.position = 'absolute';
  audio.style.width = '0';
  audio.style.height = '0';
  audio.style.opacity = '0';
  audio.style.pointerEvents = 'none';

  btn.textContent = 'Musique';
  btn.style.display = 'flex';
  btn.style.width = 'auto';
  btn.style.height = '32px';
  btn.style.padding = '0 10px';
  btn.style.borderRadius = '999px';
  btn.style.background = '#7c3aed';
  btn.style.color = 'white';
  btn.style.fontSize = '11px';
  btn.style.fontWeight = '700';

  const onPlay = () => { btn.textContent = 'Couper'; };
  const onPause = () => { if (audio.paused) btn.textContent = 'Musique'; };

  const tryPlay = () => {
    if (!audio.src) return;
    void audio.play().then(onPlay).catch(() => {
      btn.textContent = 'Musique';
    });
  };

  const arm = (src: string) => {
    audio.src = src;
    tryPlay();
  };

  if (directSrc) arm(directSrc);
  else if (hasFile) {
    void fetchEventMusic(createClient(), event.id).then((url) => arm(url || defaultMusic)).catch(() => arm(defaultMusic));
  } else {
    arm(defaultMusic);
  }

  const onFirstGesture = (event: Event) => {
    if (event.composedPath().includes(btn)) return;
    if (!audio.paused) {
      document.removeEventListener('pointerdown', onFirstGesture);
      return;
    }
    if (!audio.src) return;
    void audio.play().then(() => {
      onPlay();
      document.removeEventListener('pointerdown', onFirstGesture);
    }).catch(() => {
      btn.textContent = 'Musique';
    });
  };
  const onClick = (event: Event) => {
    event.stopPropagation();
    document.removeEventListener('pointerdown', onFirstGesture);
    if (audio.paused) tryPlay();
    else {
      audio.pause();
      btn.textContent = 'Musique';
    }
  };

  document.addEventListener('pointerdown', onFirstGesture);
  btn.addEventListener('click', onClick);
  audio.addEventListener('play', onPlay);
  audio.addEventListener('pause', onPause);

  return () => {
    audio.pause();
    document.removeEventListener('pointerdown', onFirstGesture);
    btn.removeEventListener('click', onClick);
    audio.removeEventListener('play', onPlay);
    audio.removeEventListener('pause', onPause);
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char
  ));
}

function initModals(root: HTMLElement) {
  const pairs: Array<[string, string]> = [
    ['#open-date-modal', '#date-modal'],
    ['#open-place-modal', '#place-modal'],
  ];
  const cleanups: Array<() => void> = [];

  pairs.forEach(([openSel, modalSel]) => {
    const open = root.querySelector(openSel);
    const modal = root.querySelector(modalSel) as HTMLElement | null;
    const close = modal?.querySelector('[data-close-modal]');
    if (!open || !modal) return;
    const show = () => { modal.style.display = 'flex'; };
    const hide = () => { modal.style.display = 'none'; };
    const onBackdrop = (event: Event) => {
      if (event.target === modal) hide();
    };
    open.addEventListener('click', show);
    close?.addEventListener('click', hide);
    modal.addEventListener('click', onBackdrop);
    cleanups.push(() => {
      open.removeEventListener('click', show);
      close?.removeEventListener('click', hide);
      modal.removeEventListener('click', onBackdrop);
    });
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

async function refreshGuestbookPreview(root: HTMLElement, slug: string) {
  const section = root.querySelector('#section-guestbook') as HTMLElement | null;
  const list = root.querySelector('#guestbook-list') as HTMLElement | null;
  if (!section || !list || !isSupabaseReady()) return;
  const notes = await listGuestbook(createClient(), slug, 3);
  if (!notes.length) {
    section.style.display = 'none';
    return;
  }
  list.innerHTML = guestbookMarkup(notes);
  section.style.display = 'block';
}

function guestbookMarkup(notes: { guest_name: string; message: string }[]): string {
  return notes
    .map(
      (note) => `
      <article class="guestbook-note">
        <p class="guestbook-text">« ${escapeHtml(note.message)} »</p>
        <p class="guestbook-name">${escapeHtml(note.guest_name)}</p>
      </article>`
    )
    .join('');
}

function initGuestbook(root: HTMLElement, slug: string) {
  const section = root.querySelector('#section-guestbook') as HTMLElement | null;
  const list = root.querySelector('#guestbook-list') as HTMLElement | null;
  const open = root.querySelector('#open-guestbook');
  const modal = root.querySelector('#guestbook-modal') as HTMLElement | null;
  const full = root.querySelector('#guestbook-full') as HTMLElement | null;
  const close = modal?.querySelector('[data-close-modal]');
  if (!section || !list || !open || !modal || !full) return () => {};

  let cancelled = false;
  const show = () => { modal.style.display = 'flex'; };
  const hide = () => { modal.style.display = 'none'; };
  const onOpen = () => {
    show();
    if (!isSupabaseReady()) {
      full.innerHTML = '<p class="guestbook-empty">Aucun message pour le moment.</p>';
      return;
    }
    void listGuestbook(createClient(), slug, 200).then((notes) => {
      if (cancelled) return;
      full.innerHTML = notes.length
        ? guestbookMarkup(notes)
        : '<p class="guestbook-empty">Aucun message pour le moment.</p>';
    });
  };
  const onBackdrop = (event: Event) => {
    if (event.target === modal) hide();
  };
  open.addEventListener('click', onOpen);
  close?.addEventListener('click', hide);
  modal.addEventListener('click', onBackdrop);

  if (isSupabaseReady()) {
    void refreshGuestbookPreview(root, slug);
  }

  return () => {
    cancelled = true;
    open.removeEventListener('click', onOpen);
    close?.removeEventListener('click', hide);
    modal.removeEventListener('click', onBackdrop);
  };
}

function getOriginalCSS(): string {
  return `
    .invitation-experience-root {
      --hero-image-url: url("https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80");
      --welcome-image-url: url("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80");
      --primary-color: #5b21b6;
      --accent-color: #2563eb;
      --rsvp-color: #7c3aed;
      --icon-color: #2563eb;
      font-family: 'Montserrat', sans-serif;
      background-color: #f4f4f6;
      color: #1f2937;
      -webkit-tap-highlight-color: transparent;
      transition: background-color 0.25s ease, color 0.25s ease;
    }
    .invitation-experience-root .font-serif { font-family: 'Playfair Display', serif; }
    .invitation-experience-root .text-center { text-align: center; }
    .invitation-experience-root .mb-1 { margin-bottom: 0.25rem; }
    .invitation-experience-root .mb-3 { margin-bottom: 0.75rem; }
    .invitation-experience-root .text-lg { font-size: 1.125rem; }
    .invitation-experience-root .text-xl { font-size: 1.25rem; }
    .invitation-experience-root .text-2xl { font-size: 1.5rem; }
    .invitation-experience-root .rounded-2xl { border-radius: 1rem; }
    @media (min-width: 768px) {
      .invitation-experience-root .md\\:text-3xl { font-size: 1.875rem; }
    }
    .invitation-experience-root .font-cursive { font-family: 'Great Vibes', cursive; }
    .invitation-experience-root .inv-text-primary { color: #1f2937; }
    .invitation-experience-root .inv-text-muted { color: #6b7280; }
    .invitation-experience-root .inv-subsurface { background: #f9fafb; border: 1px solid #f3f4f6; }
    .invitation-experience-root .inv-icon-badge { background: #eff6ff; color: var(--icon-color, #2563eb); }
    .invitation-experience-root .hero-bg {
      background-image: linear-gradient(180deg, rgba(15, 10, 20, 0.45) 0%, rgba(15, 10, 20, 0.78) 100%), var(--hero-image-url);
      background-size: cover;
      background-position: center;
    }
    .invitation-experience-root .invitation-card {
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at 88% 8%, rgba(124, 58, 237, 0.08), transparent 42%),
        radial-gradient(circle at 12% 92%, rgba(15, 23, 42, 0.04), transparent 40%),
        linear-gradient(168deg, #ffffff 0%, #faf8f6 48%, #f8fafc 100%);
      box-shadow: 0 22px 48px rgba(17, 24, 39, 0.09);
      border: 1px solid rgba(15, 23, 42, 0.07);
    }
    .invitation-experience-root .invitation-card--floral::before {
      content: "";
      position: absolute;
      inset: 8px;
      border: 1px solid rgba(219, 39, 119, 0.14);
      border-radius: 14px;
      pointer-events: none;
      z-index: 0;
    }
    .invitation-experience-root .invitation-card-floral {
      position: absolute;
      width: clamp(4.5rem, 18vw, 6.5rem);
      height: clamp(4.5rem, 18vw, 6.5rem);
      opacity: 0.12;
      pointer-events: none;
      z-index: 0;
      color: #111827;
    }
    .invitation-experience-root .invitation-card-floral--tl { top: 0.4rem; left: 0.4rem; }
    .invitation-experience-root .invitation-card-floral--br { right: 0.4rem; bottom: 0.4rem; transform: rotate(180deg); }
    .invitation-experience-root .invitation-card-inner {
      position: relative;
      z-index: 1;
      padding: clamp(2rem, 6vw, 2.6rem) clamp(1.35rem, 5vw, 2rem);
    }
    .invitation-experience-root .invite-card-overline {
      font-size: clamp(0.5625rem, 2.5vw, 0.6875rem);
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 0.4rem;
    }
    .invitation-experience-root .invite-card-title {
      font-family: "Great Vibes", cursive;
      font-size: clamp(3.1rem, 14vw, 4.6rem);
      line-height: 0.95;
      color: #111827;
      margin: 0.2rem 0 0.7rem;
      text-shadow: 0 1px 0 rgba(255,255,255,0.6);
    }
    .invitation-experience-root .invite-couple-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.45rem 0.65rem;
      margin-bottom: 1.1rem;
    }
    .invitation-experience-root .invite-couple-name {
      font-family: "Great Vibes", cursive;
      font-size: clamp(2.35rem, 9vw, 3.1rem);
      line-height: 1;
    }
    .invitation-experience-root .invite-couple-name--left { color: var(--primary-color, #5b21b6); }
    .invitation-experience-root .invite-couple-name--right { color: var(--accent-color, #2563eb); }
    .invitation-experience-root .invite-couple-join {
      font-size: clamp(0.5625rem, 2.4vw, 0.625rem);
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #9ca3af;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: rgba(243, 244, 246, 0.95);
      border: 1px solid rgba(229, 231, 235, 0.9);
    }
    .invitation-experience-root .invite-greeting {
      font-size: clamp(1.15rem, 4.4vw, 1.35rem);
      color: #111827;
      margin-bottom: 0.85rem;
    }
    .invitation-experience-root .invite-guest-name { color: #111827; font-weight: 700; }
    .invitation-experience-root .guest-table-line {
      display: none;
      margin: 0 auto 0.9rem;
      padding: 0.35rem 0.8rem;
      border-radius: 999px;
      border: 1px solid rgba(37, 99, 235, 0.35);
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .invitation-experience-root .invite-body-text {
      font-size: clamp(1rem, 4.1vw, 1.16rem);
      line-height: 1.75;
      color: #1f2937;
      margin-bottom: 0.9rem;
    }
    .invitation-experience-root .invite-calligraphy {
      font-family: "Great Vibes", cursive;
      font-size: clamp(1.55rem, 6.2vw, 2rem);
      font-weight: 400;
      line-height: 1.45;
      color: #374151;
      letter-spacing: 0.02em;
    }
    .invitation-experience-root .invitation-rsvp-wrap { margin-top: 1rem; padding: 0 0.15rem; }
    .invitation-experience-root .btn-rsvp {
      background: var(--rsvp-color, linear-gradient(135deg, #2563eb, #7c3aed));
      color: white;
      border: none;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
    }
    .invitation-experience-root .btn-rsvp:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px -6px rgba(37, 99, 235, 0.35);
    }
    .invitation-experience-root .btn-rsvp:active { transform: scale(0.99); }
    .invitation-experience-root .best-photos-shell {
      border-radius: 1.25rem;
      background: linear-gradient(135deg, #111827 0%, #1f2937 45%, #312e81 100%);
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 22px 45px rgba(17,24,39,0.35);
    }
    .invitation-experience-root .premium-marquee { overflow: hidden; border-radius: .9rem; }
    .invitation-experience-root .premium-marquee-track {
      display: flex;
      gap: .6rem;
      width: max-content;
      padding: .65rem;
      animation: premiumMarquee 24s linear infinite;
    }
    .invitation-experience-root .premium-marquee-track img {
      width: 120px;
      height: 82px;
      border-radius: .65rem;
      object-fit: cover;
      flex-shrink: 0;
    }
    @keyframes premiumMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .invitation-experience-root .dress-marquee-wrapper {
      overflow: hidden;
      border-radius: 0.75rem;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
    }
    .invitation-experience-root .dress-marquee-track {
      display: flex;
      width: max-content;
      gap: 0.75rem;
      padding: 0.75rem;
      animation: dressMarquee 20s linear infinite;
    }
    .invitation-experience-root .dress-marquee-track img {
      width: 120px;
      height: 160px;
      object-fit: cover;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
    @keyframes dressMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    /* Drink menu */
    .invitation-experience-root .drink-menu-shell { background: linear-gradient(168deg, #ffffff 0%, #fffafb 45%, #f8fafc 100%); }
    .invitation-experience-root .drink-menu-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; width: 100%; }
    .invitation-experience-root label.drink-card {
      position: relative;
      display: block;
      margin: 0;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid #e2e8f0;
      background: #fff;
      cursor: pointer;
      user-select: none;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }
    .invitation-experience-root label.drink-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); }
    .invitation-experience-root label.drink-card.is-selected {
      border-color: var(--rsvp-color, #7c3aed);
      box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.25), 0 10px 24px rgba(124, 58, 237, 0.12);
    }
    .invitation-experience-root .drink-card-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; margin: 0; }
    .invitation-experience-root .drink-card-media { position: relative; width: 100%; aspect-ratio: 4 / 3; min-height: 78px; overflow: hidden; background: linear-gradient(135deg, #eff6ff, #dbeafe); }
    .invitation-experience-root .drink-card-check {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid #e2e8f0;
      color: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 2;
    }
    .invitation-experience-root label.drink-card.is-selected .drink-card-check {
      background: var(--rsvp-color, #7c3aed);
      border-color: var(--rsvp-color, #7c3aed);
      color: #fff;
    }
    .invitation-experience-root .drink-card-body { padding: 0.6rem 0.65rem 0.7rem; text-align: center; }
    .invitation-experience-root .drink-card-title { display: block; font-size: 0.78rem; font-weight: 600; color: #0f172a; line-height: 1.25; }
    .invitation-experience-root .drink-card-desc { display: block; margin-top: 0.2rem; font-size: 0.62rem; color: #64748b; line-height: 1.35; }

    /* ═══════════ DARK MODE COMPLET ═══════════ */
    .invitation-experience-root.dark-mode-applied {
      background-color: #0b0f19 !important;
      color: #f3f4f6 !important;
    }
    .invitation-experience-root.dark-mode-applied #main-view {
      background: #0f172a !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
    }
    .invitation-experience-root.dark-mode-applied .surface-card,
    .invitation-experience-root.dark-mode-applied .drink-menu-shell {
      background: #1e293b !important;
      border-color: rgba(148, 163, 184, 0.16) !important;
      color: #f3f4f6 !important;
    }
    .invitation-experience-root.dark-mode-applied .inv-subsurface,
    .invitation-experience-root.dark-mode-applied .dress-marquee-wrapper {
      background: #0f172a !important;
      border-color: rgba(148, 163, 184, 0.14) !important;
      color: #e5e7eb !important;
    }
    .invitation-experience-root.dark-mode-applied {
      --icon-color: #60a5fa;
    }
    .invitation-experience-root.dark-mode-applied .inv-icon-badge {
      background: rgba(37, 99, 235, 0.2) !important;
      color: #60a5fa !important;
    }
    .invitation-experience-root.dark-mode-applied .inv-text-primary,
    .invitation-experience-root.dark-mode-applied h3 {
      color: #f9fafb !important;
    }
    .invitation-experience-root.dark-mode-applied .inv-text-muted {
      color: #9ca3af !important;
    }
    .invitation-experience-root.dark-mode-applied .inv-divider-line {
      background: rgba(148, 163, 184, 0.22) !important;
    }
    .invitation-experience-root.dark-mode-applied .invitation-card {
      background:
        radial-gradient(circle at 88% 8%, rgba(244, 114, 182, 0.14), transparent 42%),
        radial-gradient(circle at 12% 92%, rgba(148, 163, 184, 0.08), transparent 40%),
        linear-gradient(168deg, #1e293b 0%, #111827 55%, #0f172a 100%) !important;
      border-color: rgba(148, 163, 184, 0.2) !important;
    }
    .invitation-experience-root.dark-mode-applied .invitation-card-floral {
      color: #f8fafc !important;
      opacity: 0.15;
    }
    .invitation-experience-root.dark-mode-applied .invite-card-title,
    .invitation-experience-root.dark-mode-applied .invite-guest-name {
      color: #f9fafb !important;
    }
    .invitation-experience-root.dark-mode-applied .invite-couple-join {
      background: rgba(30, 41, 59, 0.9) !important;
      border-color: rgba(148, 163, 184, 0.25) !important;
      color: #cbd5e1 !important;
    }
    .invitation-experience-root.dark-mode-applied .invite-greeting,
    .invitation-experience-root.dark-mode-applied .invite-body-text {
      color: #cbd5e1 !important;
    }
    .invitation-experience-root.dark-mode-applied label.drink-card {
      background: #0f172a !important;
      border-color: rgba(148, 163, 184, 0.2) !important;
    }
    .invitation-experience-root.dark-mode-applied label.drink-card.is-selected {
      border-color: var(--rsvp-color, #7c3aed) !important;
    }
    .invitation-experience-root.dark-mode-applied .drink-card-media {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(30, 64, 175, 0.28)) !important;
    }
    .invitation-experience-root.dark-mode-applied .drink-card-title {
      color: #f8fafc !important;
    }
    .invitation-experience-root.dark-mode-applied .drink-card-desc {
      color: #94a3b8 !important;
    }
    .invitation-experience-root.dark-mode-applied #decline-presence-btn {
      background: #0f172a !important;
      color: #cbd5e1 !important;
      border-color: rgba(148, 163, 184, 0.25) !important;
    }
    .invitation-experience-root .guest-message {
      width: 100%;
      min-height: 88px;
      margin: 0 0 12px;
      padding: 12px 14px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      background: #f8fafc;
      color: #111827;
      font-size: 14px;
      line-height: 1.5;
      resize: vertical;
      font-family: inherit;
    }
    .invitation-experience-root .guestbook-list { display: flex; flex-direction: column; gap: 10px; }
    .invitation-experience-root .guestbook-note {
      padding: 14px 16px;
      border-radius: 14px;
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      text-align: left;
    }
    .invitation-experience-root .guestbook-text {
      margin: 0;
      font-family: "Playfair Display", serif;
      font-size: 15px;
      line-height: 1.55;
      color: #111827;
    }
    .invitation-experience-root .guestbook-name {
      margin: 8px 0 0;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #2563eb;
      font-weight: 700;
    }
    .invitation-experience-root .guestbook-open {
      width: 100%;
      display: block;
      border: 1px solid #f3f4f6;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      padding: 20px;
      cursor: pointer;
      font-family: inherit;
      text-align: center;
      color: inherit;
    }
    .invitation-experience-root .guestbook-more {
      margin: 14px 0 0;
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
    }
    .invitation-experience-root .guestbook-empty {
      margin: 0;
      text-align: center;
      color: #64748b;
      font-size: 13px;
    }
    .invitation-experience-root .checkin-pass {
      margin-top: 14px;
    }
    .invitation-experience-root .checkin-qr-frame {
      display: inline-block;
      background: #ffffff;
      padding: 8px;
      border-radius: 12px;
      line-height: 0;
    }
    .invitation-experience-root .checkin-qr-frame img {
      width: 168px;
      height: 168px;
      display: block;
    }
    .invitation-experience-root .checkin-kicker {
      margin: 0 0 8px;
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #2563eb;
      font-weight: 700;
    }
    .invitation-experience-root .checkin-caption {
      margin: 8px 0 0;
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    }
    .invitation-experience-root .checkin-help {
      margin: 10px 0 0;
      font-size: 12px;
      line-height: 1.45;
      color: #374151;
    }
    .invitation-experience-root .checkin-download {
      display: inline-flex;
      margin-top: 10px;
      min-height: 44px;
      align-items: center;
      justify-content: center;
      padding: 0 14px;
      border-radius: 12px;
      background: #2563eb;
      color: white;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
    }
    .invitation-experience-root[data-template="elegance"] .invitation-card-floral {
      display: none;
    }
    .invitation-experience-root .family-motif img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 16px;
      display: block;
    }
    .invitation-experience-root .family-motif h3 {
      font-family: 'Playfair Display', serif;
      font-size: 18px;
      margin: 0 0 8px;
    }
    @media print {
      .invitation-experience-root #app-floating-tools,
      .invitation-experience-root .inv-modal {
        display: none !important;
      }
      .invitation-experience-root #main-view {
        box-shadow: none !important;
        max-width: none !important;
        overflow: visible !important;
        min-height: auto !important;
      }
      .invitation-experience-root section {
        break-inside: avoid;
      }
    }
    .invitation-experience-root .inv-modal {
      position: fixed;
      inset: 0;
      z-index: 80;
      display: none;
      align-items: flex-end;
      justify-content: center;
      background: rgba(15, 23, 42, 0.55);
      padding: 16px;
    }
    .invitation-experience-root .inv-modal-card {
      width: min(100%, 26rem);
      max-height: min(82vh, 640px);
      overflow: auto;
      background: white;
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 24px 50px rgba(0,0,0,0.28);
    }
    .invitation-experience-root.dark-mode-applied .guestbook-open,
    .invitation-experience-root.dark-mode-applied .guest-message,
    .invitation-experience-root.dark-mode-applied .guestbook-note,
    .invitation-experience-root.dark-mode-applied .inv-modal-card {
      background: #0f172a !important;
      color: #f8fafc !important;
      border-color: rgba(148, 163, 184, 0.25) !important;
    }
    .invitation-experience-root.dark-mode-applied .guestbook-text,
    .invitation-experience-root.dark-mode-applied .guest-message {
      color: #f8fafc !important;
    }
    .invitation-experience-root.dark-mode-applied .guest-table-line {
      background: rgba(37, 99, 235, 0.2);
      color: #bfdbfe;
    }
    .invitation-experience-root.dark-mode-applied .checkin-caption {
      color: #e2e8f0;
    }
    .invitation-experience-root.dark-mode-applied .guestbook-more,
    .invitation-experience-root.dark-mode-applied .checkin-kicker {
      color: #93c5fd;
    }
  `;
}

function getOriginalHTML(): string {
  return `
    <!-- Audio pour musique d'ambiance -->
    <audio id="background-music" loop preload="auto" playsinline style="position:absolute;width:0;height:0;opacity:0;pointer-events:none;"></audio>

    <!-- Outils flottants (Thème & Musique) -->
    <div id="app-floating-tools" style="position:fixed;top:12px;right:12px;z-index:50;display:flex;align-items:center;gap:8px;">
      <label style="cursor:pointer;" title="Mode clair / sombre">
        <input type="checkbox" id="theme-toggle-input" style="display:none;">
        <span style="display:inline-block;width:44px;height:24px;border-radius:999px;background:rgba(255,255,255,0.9);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.1);position:relative;transition:background 0.3s;box-shadow:0 2px 8px rgba(0,0,0,0.14);">
          <span style="position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:999px;background:#1f2937;color:white;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.3s;display:flex;align-items:center;justify-content:center;" class="theme-thumb"></span>
        </span>
      </label>
      <button id="print-invitation-btn" type="button" style="height:32px;padding:0 10px;border-radius:999px;background:#1f2937;color:white;border:none;cursor:pointer;font-size:11px;font-weight:700;" title="Télécharger l'invitation en PDF">PDF</button>
      <button id="music-toggle-btn" type="button" style="width:34px;height:24px;border-radius:999px;background:#1f2937;color:white;border:none;cursor:pointer;display:none;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);" title="Musique">
        <svg style="width:13px;height:13px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
      </button>
    </div>

    <!-- Welcome Gate (masqué par défaut) -->
    <div id="welcome-gate" style="display:none;"></div>

    <!-- Main View -->
    <main id="main-view" style="max-width:28rem;margin:0 auto;background:#fafafa;min-height:100vh;position:relative;box-shadow:0 25px 50px -12px rgba(0,0,0,0.22);overflow:hidden;padding-bottom:44px;display:block;opacity:1;">

      <!-- 1. Hero Couverture -->
      <header class="hero-bg" style="height:58vh;min-height:360px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:white;padding:0 22px;position:relative;">
        <p id="hero-date-pill" style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;background:rgba(255,255,255,0.16);backdrop-filter:blur(6px);padding:5px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.25);margin-bottom:14px;"></p>
        <h1 id="hero-title" class="font-serif text-2xl md:text-3xl mb-3" style="font-family:'Playfair Display',serif;letter-spacing:0.04em;text-shadow:0 2px 14px rgba(0,0,0,0.35);">Titre</h1>
        <div style="width:22px;height:22px;color:#60a5fa;margin:4px auto 12px;">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <p id="hero-subtitle" style="font-size:13px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;opacity:0.92;">Couple</p>
      </header>

      <!-- 2. Carte d'invitation florale -->
      <section style="padding:0 16px;margin-top:-52px;position:relative;z-index:10;">
        <article class="invitation-card invitation-card--floral rounded-2xl text-center" aria-label="Carte d'invitation">
          <div class="invitation-card-floral invitation-card-floral--tl" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none"><path d="M12 58c8-18 26-22 34-38 3-6 2-12-1-16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M18 24c6 4 10 10 10 18 0 8-5 14-12 16" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M42 14c-2 8 2 16 8 22" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><circle cx="24" cy="34" r="5" stroke="currentColor" stroke-width="1"/><circle cx="38" cy="22" r="3.5" fill="currentColor"/><circle cx="52" cy="30" r="2.5" fill="currentColor"/><path d="M20 48c4 6 10 8 16 6" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/></svg>
          </div>
          <div class="invitation-card-floral invitation-card-floral--br" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none"><path d="M12 58c8-18 26-22 34-38 3-6 2-12-1-16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M18 24c6 4 10 10 10 18 0 8-5 14-12 16" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M42 14c-2 8 2 16 8 22" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><circle cx="24" cy="34" r="5" stroke="currentColor" stroke-width="1"/><circle cx="38" cy="22" r="3.5" fill="currentColor"/><circle cx="52" cy="30" r="2.5" fill="currentColor"/><path d="M20 48c4 6 10 8 16 6" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/></svg>
          </div>
          <div class="invitation-card-inner">
            <p class="invite-card-overline">Vous êtes cordialement invité(e)</p>
            <div id="couple-row-container" class="invite-couple-row">
              <span id="couple-name-left" class="invite-couple-name invite-couple-name--left">Prénom</span>
              <span id="couple-join-badge" class="invite-couple-join">&amp;</span>
              <span id="couple-name-right" class="invite-couple-name invite-couple-name--right">Prénom</span>
            </div>
            <p class="invite-greeting font-serif">Cher/Chère <span id="display-guest-name" class="invite-guest-name">Invité(e)</span>,</p>
            <p id="guest-table-line" class="guest-table-line"></p>
            <p id="invite-intro-paragraph" class="invite-body-text invite-calligraphy"></p>
            <p id="invite-secondary-text" class="invite-body-text" style="display:none;"></p>
            <p id="invite-main-text" class="invite-body-text invite-calligraphy" style="display:none;"><span id="invitation-main-text"></span></p>
          </div>
        </article>
      </section>

      <section id="section-when-where" style="padding:0 16px;margin-top:24px;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:22px 18px;border:1px solid #f3f4f6;text-align:center;">
          <p style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">Date et lieu</p>
          <p id="summary-date" class="inv-text-primary" style="font-family:'Playfair Display',serif;font-size:28px;line-height:1.15;margin-bottom:4px;"></p>
          <p id="summary-time" class="inv-text-muted" style="font-size:13px;margin-bottom:14px;"></p>
          <h3 id="summary-venue" class="inv-text-primary" style="font-family:'Playfair Display',serif;font-size:22px;margin-bottom:4px;"></h3>
          <p id="summary-address" class="inv-text-muted" style="font-size:13px;line-height:1.5;margin-bottom:16px;"></p>
          <p id="program-section-title" style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:12px;text-align:center;">Programme de la journée</p>
          <div id="program-timeline" style="display:flex;flex-direction:column;gap:8px;text-align:left;margin-bottom:16px;"></div>
          <button id="reserve-deadline-btn" type="button" class="btn-rsvp" style="width:100%;border-radius:14px;padding:15px 18px;box-shadow:0 10px 20px -5px rgba(124,58,237,0.35);min-height:3.25rem;">
            <span id="reserve-deadline-text" style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;">Confirmer ma présence</span>
          </button>
        </div>
      </section>

      <!-- 3. À propos / Notre histoire -->
      <section id="section-about" style="padding:0 16px;margin-top:24px;display:none;">
        <div id="about-section-card" style="position:relative;border-radius:16px;overflow:hidden;height:118px;box-shadow:0 4px 12px rgba(0,0,0,0.06);background:#111827;cursor:pointer;">
          <img id="about-cover-image" src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Notre histoire" style="width:100%;height:100%;object-fit:cover;opacity:0.62;">
          <div style="position:absolute;inset:0;display:flex;align-items:center;padding:0 24px;">
            <div style="color:white;">
              <h3 id="about-card-title" class="font-serif text-xl mb-1" style="font-family:'Playfair Display',serif;color:white !important;">Notre histoire</h3>
              <p id="about-toggle-label" style="font-size:11px;color:#e5e7eb;font-weight:400;display:inline-flex;align-items:center;background:rgba(0,0,0,0.35);padding:4px 10px;border-radius:999px;backdrop-filter:blur(4px);">
                Découvrir notre histoire ›
              </p>
            </div>
          </div>
        </div>
        <div id="about-toggle-detail" class="surface-card" style="display:none;background:white;border-radius:16px;margin-top:8px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid #f3f4f6;">
          <p id="about-story-1" class="inv-text-muted" style="font-size:13px;line-height:1.75;margin-bottom:10px;"></p>
          <p id="about-story-2" class="inv-text-muted" style="font-size:13px;line-height:1.75;"></p>
        </div>
      </section>

      <!-- 4. Galerie Photos -->
      <section id="section-gallery" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="best-photos-shell" style="padding:18px 16px;color:white;">
          <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#c7d2fe;text-align:center;margin-bottom:4px;">Moments d'exception</p>
          <h3 class="font-serif text-xl text-center mb-3" style="font-family:'Playfair Display',serif;color:white !important;">Les plus belles photos</h3>
          <div id="best-photos-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;"></div>
          <div class="premium-marquee">
            <div class="premium-marquee-track"></div>
          </div>
          <p id="gallery-open-text" style="font-size:10px;color:#c7d2fe;text-align:center;margin-top:10px;cursor:pointer;">Faire défiler les souvenirs ›</p>
        </div>
      </section>

      <!-- 5. Dress Code -->
      <section id="section-dress-code" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:24px;text-align:center;border:1px solid #f3f4f6;">
          <div class="inv-icon-badge" style="width:40px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            <svg style="width:20px;height:20px;color:var(--icon-color, #2563eb);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 8l-4-3-2 2h-4l-2-2-4 3v4l2 1v8h12v-8l2-1z"/></svg>
          </div>
          <h3 id="dress-code-title" class="font-serif text-lg mb-1 inv-text-primary" style="font-family:'Playfair Display',serif;">Tenue élégante</h3>
          <p style="font-size:10px;color:#9ca3af;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.2em;">Code vestimentaire</p>
          <div class="dress-marquee-wrapper" style="display:none;">
            <div class="dress-marquee-track"></div>
          </div>
        </div>
      </section>

      <!-- Calendrier et lieu, discrets, en bas de page -->
      <section id="section-date-place" style="padding:0 16px;margin-top:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <button id="open-date-modal" type="button" class="surface-card inv-text-primary" style="background:white;border-radius:14px;border:1px solid #f3f4f6;padding:14px 10px;font-size:12px;font-weight:700;cursor:pointer;">Calendrier</button>
          <button id="open-place-modal" type="button" class="surface-card inv-text-primary" style="background:white;border-radius:14px;border:1px solid #f3f4f6;padding:14px 10px;font-size:12px;font-weight:700;cursor:pointer;">Plan du lieu</button>
        </div>
      </section>

      <div id="date-modal" class="inv-modal">
        <div class="inv-modal-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <p class="inv-text-primary" style="font-family:'Playfair Display',serif;font-size:20px;">La date</p>
            <button type="button" data-close-modal style="border:none;background:transparent;font-size:20px;cursor:pointer;color:#64748b;">×</button>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
            <div>
              <p id="event-day" class="inv-text-primary" style="font-size:32px;font-weight:300;line-height:1;">30</p>
              <p id="event-month-year" style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.12em;margin-top:4px;">Avril 2026</p>
            </div>
            <div id="event-time-badge" class="inv-subsurface" style="padding:8px 14px;border-radius:12px;text-align:center;">
              <p id="event-time-range" class="inv-text-primary" style="font-size:12px;font-weight:700;">19h00</p>
            </div>
          </div>
          <div class="inv-subsurface" style="border-radius:14px;padding:16px;">
            <div style="display:flex;justify-content:center;align-items:center;margin-bottom:14px;">
              <span id="calendar-month-label" class="inv-text-primary" style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;">Avril 2026</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:9px;color:#9ca3af;margin-bottom:8px;font-weight:700;">
              <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
            </div>
            <div id="calendar-days-grid" class="inv-text-muted" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:11px;"></div>
          </div>
        </div>
      </div>

      <div id="place-modal" class="inv-modal">
        <div class="inv-modal-card" style="text-align:center;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <p class="inv-text-primary" style="font-family:'Playfair Display',serif;font-size:20px;">Le lieu</p>
            <button type="button" data-close-modal style="border:none;background:transparent;font-size:20px;cursor:pointer;color:#64748b;">×</button>
          </div>
          <div id="map-frame" style="display:none;height:9rem;border-radius:12px;overflow:hidden;margin-bottom:12px;">
            <img id="map-image" alt="" style="width:100%;height:100%;object-fit:cover;">
          </div>
          <h3 id="venue-title" class="inv-text-primary" style="font-family:'Playfair Display',serif;font-size:24px;margin-bottom:6px;">Lieu</h3>
          <p id="venue-address" class="inv-text-muted" style="font-size:14px;line-height:1.5;margin-bottom:12px;"></p>
          <a id="venue-map-link" href="#" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:#2563eb;font-weight:600;text-decoration:none;">Voir sur la carte</a>
        </div>
      </div>

      <!-- 8. Compte à rebours -->
      <section id="section-countdown" style="padding:0 16px;margin-top:24px;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:24px;text-align:center;border:1px solid #f3f4f6;">
          <p id="countdown-status" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:var(--rsvp-color, #7c3aed);margin-bottom:16px;min-height:18px;"></p>
          <div style="display:flex;justify-content:center;gap:10px;">
            <div style="text-align:center;width:60px;">
              <div id="days" class="inv-subsurface inv-text-primary" style="width:100%;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:500;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;">Jours</p>
            </div>
            <div style="text-align:center;width:60px;">
              <div id="hours" class="inv-subsurface inv-text-primary" style="width:100%;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:500;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;">Heures</p>
            </div>
            <div style="text-align:center;width:60px;">
              <div id="minutes" class="inv-subsurface inv-text-primary" style="width:100%;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:500;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;">Min</p>
            </div>
            <div style="text-align:center;width:60px;">
              <div id="seconds" class="inv-icon-badge" style="width:100%;height:56px;color:var(--rsvp-color, #7c3aed);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;border:1px solid rgba(124,58,237,0.2);">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;">Sec</p>
            </div>
          </div>
        </div>
      </section>

      <section id="section-family-motifs" style="padding:0 16px;margin-top:24px;display:none;">
        <div id="groom-motif" class="family-motif surface-card" style="display:none;background:white;border-radius:16px;padding:16px;border:1px solid #f3f4f6;margin-bottom:12px;">
          <h3 class="inv-text-primary">Motif de la famille du marié</h3>
          <img id="groom-motif-img" alt="Motif de la famille du marié">
        </div>
        <div id="bride-motif" class="family-motif surface-card" style="display:none;background:white;border-radius:16px;padding:16px;border:1px solid #f3f4f6;">
          <h3 class="inv-text-primary">Motif de la famille de la mariée</h3>
          <img id="bride-motif-img" alt="Motif de la famille de la mariée">
        </div>
      </section>

      <!-- 9. Confirmation de présence (RSVP) -->
      <section id="section-rsvp" style="padding:0 16px;margin-top:24px;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:22px 18px;border:1px solid #f3f4f6;text-align:center;">
          <h3 class="font-serif inv-text-primary" style="font-family:'Playfair Display',serif;font-size:20px;margin-bottom:4px;">Votre réponse</h3>
          <p id="rsvp-deadline-caption" class="inv-text-muted" style="font-size:11px;margin-bottom:14px;display:none;"></p>
          <label for="guest-message" class="inv-text-muted" style="display:block;text-align:left;font-size:12px;font-weight:600;margin-bottom:6px;">Laisser un message aux mariés</label>
          <textarea id="guest-message" class="guest-message" maxlength="500" placeholder="Un mot, un souvenir, une pensée…"></textarea>
          <button id="confirm-presence-btn" type="button" class="btn-rsvp" style="width:100%;border-radius:12px;padding:15px;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;">
            <span style="width:26px;height:26px;border-radius:999px;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;">
              <svg style="width:15px;height:15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </span>
            <span id="confirm-presence-label" style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;">Confirmer ma présence</span>
          </button>
          <button id="decline-presence-btn" type="button" style="width:100%;margin-top:10px;border-radius:12px;padding:12px;background:#f9fafb;color:#4b5563;border:1px solid #e5e7eb;font-size:12px;font-weight:500;cursor:pointer;">
            Je ne pourrai pas venir
          </button>
          <p id="rsvp-status-note" style="margin-top:12px;text-align:center;font-size:15px;font-weight:700;line-height:1.4;min-height:1.4rem;"></p>
          <div id="checkin-pass" class="checkin-pass" style="display:none;">
            <p class="checkin-kicker">Code d'entrée</p>
            <div class="checkin-qr-frame">
              <img id="checkin-qr" alt="Code d'entrée" width="168" height="168">
            </div>
            <p id="checkin-qr-caption" class="checkin-caption"></p>
            <p class="checkin-help">Cette image est votre carte d'entrée. Présentez-la à l'accueil le jour J.</p>
            <a id="download-checkin-qr" class="checkin-download" href="#">Télécharger la carte d'entrée</a>
          </div>
        </div>
      </section>

      <section id="section-guestbook" style="padding:0 16px;margin-top:24px;display:none;">
        <button id="open-guestbook" type="button" class="guestbook-open">
          <p style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#2563eb;text-align:center;margin-bottom:4px;">Livre d'or</p>
          <h3 class="inv-text-primary" style="font-family:'Playfair Display',serif;font-size:22px;text-align:center;margin-bottom:14px;">Leurs mots</h3>
          <div id="guestbook-list" class="guestbook-list"></div>
          <p class="guestbook-more">Voir tous les messages</p>
        </button>
      </section>

      <div id="guestbook-modal" class="inv-modal">
        <div class="inv-modal-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <p class="inv-text-primary" style="font-family:'Playfair Display',serif;font-size:20px;">Livre d'or</p>
            <button type="button" data-close-modal style="border:none;background:transparent;font-size:20px;cursor:pointer;color:#64748b;">×</button>
          </div>
          <div id="guestbook-full" class="guestbook-list"></div>
        </div>
      </div>

      <!-- 10. Menu des boissons -->
      <section id="drink-menu-section" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="drink-menu-shell surface-card" style="border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid #f3f4f6;overflow:hidden;">
          <div style="padding:20px 20px 12px;text-align:center;">
            <div class="inv-icon-badge" style="width:42px;height:42px;border-radius:999px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;color:var(--icon-color, #2563eb);">
              <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z"/></svg>
            </div>
            <h3 class="inv-text-primary" style="font-family:'Playfair Display',serif;font-size:19px;margin-bottom:4px;">Préférences de boissons</h3>
            <p class="inv-text-muted" style="font-size:11px;max-width:320px;margin:0 auto;">Touchez vos préférences pour le jour J (optionnel).</p>
          </div>
          <div id="drink-menu-grid" class="drink-menu-grid" style="padding:0 16px 16px;"></div>
        </div>
      </section>

      <!-- 11. Informations pratiques -->
      <section id="section-practical-info" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:20px;border:1px solid #f3f4f6;">
          <h3 class="inv-text-primary" style="font-weight:700;font-size:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;text-transform:uppercase;letter-spacing:0.08em;">
            <span id="practical-info-title">Informations pratiques</span>
            <span id="practical-info-count" style="color:#9ca3af;font-size:10px;font-weight:500;"></span>
          </h3>
          <div id="practical-info-list" style="display:flex;flex-direction:column;gap:14px;"></div>
        </div>
      </section>

      <!-- 12. Cadeau / Cagnotte / Contact -->
      <section id="section-gift-contact" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:20px;border:1px solid #f3f4f6;text-align:center;">
          <h3 class="font-serif inv-text-primary" style="font-family:'Playfair Display',serif;font-size:18px;margin-bottom:6px;">Une attention ou une question ?</h3>
          <p class="inv-text-muted" style="font-size:11px;margin-bottom:14px;">Retrouvez nos liens directs ci-dessous</p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <a id="gift-donation-link" href="#" target="_blank" rel="noopener noreferrer" style="display:none;width:100%;justify-content:center;align-items:center;gap:8px;background:var(--rsvp-color, #7c3aed);color:white;padding:12px 18px;border-radius:12px;font-size:12px;font-weight:600;text-decoration:none;">
              <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              <span>Accéder à la cagnotte / Liste de cadeaux</span>
            </a>
            <a id="gift-whatsapp-link" href="#" target="_blank" rel="noopener noreferrer" style="display:none;width:100%;justify-content:center;align-items:center;gap:8px;background:#10b981;color:white;padding:12px 18px;border-radius:12px;font-size:12px;font-weight:600;text-decoration:none;">
              <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
              <span>Écrire sur WhatsApp</span>
            </a>
            <a id="support-email-link" href="#" class="inv-subsurface inv-text-primary" style="display:none;width:100%;justify-content:center;align-items:center;gap:8px;padding:12px 18px;border-radius:12px;font-size:12px;font-weight:600;text-decoration:none;">
              <svg style="width:16px;height:16px;color:var(--icon-color, #2563eb);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span>Nous envoyer un e-mail</span>
            </a>
          </div>
        </div>
      </section>
      <div id="offline-invitation-bar" style="position:sticky;bottom:12px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 16px 20px;">
        <button id="save-offline-btn" type="button" style="min-height:40px;padding:0 14px;border-radius:999px;background:#5b21b6;color:white;border:none;cursor:pointer;font-size:12px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.16);">Installer et enregistrer hors ligne</button>
        <p id="offline-invitation-status" style="margin:0;max-width:24rem;text-align:center;font-size:11px;font-weight:650;color:#334155;background:rgba(255,255,255,0.92);border-radius:999px;padding:4px 10px;"></p>
      </div>
    </main>
  `;
}

export function mountInvitationForCapture(
  host: HTMLElement,
  event: EventWithSettings,
  guest?: { name?: string; table?: string },
) {
  host.replaceChildren();
  const style = document.createElement('style');
  style.textContent = `${getOriginalCSS()}
    .invitation-experience-root.pdf-capture #app-floating-tools,
    .invitation-experience-root.pdf-capture #offline-invitation-bar,
    .invitation-experience-root.pdf-capture audio,
    .invitation-experience-root.pdf-capture .inv-modal,
    .invitation-experience-root.pdf-capture #welcome-gate { display: none !important; }
    .invitation-experience-root.pdf-capture,
    .invitation-experience-root.pdf-capture * {
      animation: none !important;
      transition: none !important;
    }
    .invitation-experience-root.pdf-capture #main-view {
      width: 448px !important;
      max-width: 448px !important;
      min-height: 0 !important;
      height: auto !important;
      overflow: visible !important;
      box-shadow: none !important;
      margin: 0 !important;
    }
    .invitation-experience-root.pdf-capture .hero-bg {
      height: 460px !important;
      min-height: 460px !important;
    }
  `;
  const root = document.createElement('div');
  root.className = 'invitation-experience-root pdf-capture';
  root.innerHTML = getOriginalHTML();
  host.append(style, root);
  hydrateEventData(root, event, guest?.name?.trim() || undefined, guest?.table);
  initDrinkMenu(root, event);
  if (event.event_date) initCountdown(root, event.event_date)();
  const main = root.querySelector('#main-view');
  if (!(main instanceof HTMLElement)) {
    throw new Error('Le modèle d’invitation est introuvable.');
  }
  return {
    root,
    main,
    destroy: () => host.replaceChildren(),
  };
}
