'use client';

import { useEffect, useRef } from 'react';
import { EventWithSettings, GuestStatus } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { listGuestbook, saveGuestDrinks, submitGuestRsvp } from '@/lib/guests/store';
import { fetchEventMusic } from '@/lib/events/store';
import { checkinCardFileName, checkinEntryCardDataUrl, checkinQrDataUrl } from '@/lib/guests/checkin-qr';
import { saveOfflineInvitation, storeOfflineView } from '@/lib/invitation/offline';
import { captureInstallClick, iosInstallHint, isStandalonePwa, launchInstalledApp, rememberGuestEntry, rememberGuestEntryOffline } from '@/lib/pwa/install-prompt';
import { cardTextOf, cssColor, cssColorSoft, familyMotifsVisible, heroLightOf, heroTextOf, heroTitleSize, invitationModel, textFontFamily } from '@/lib/invitation/appearance';

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
    const detachGallery = initGallery(root);
    const detachDrinks = initDrinkMenu(root, event, guestToken);
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
    const tokenForOffline = guestToken || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || '' : '');
    if (offlineBtn instanceof HTMLButtonElement) {
      if (isStandalonePwa()) offlineBtn.style.display = 'none';
      else offlineBtn.textContent = 'Installer';
    }
    let offlineBusy = false;
    const onInstall = () => {
      if (offlineBusy || !(offlineBtn instanceof HTMLButtonElement)) return;
      const invitationPath = `${window.location.pathname}${window.location.search}`;
      rememberGuestEntry(invitationPath);
      const installResult = captureInstallClick();
      offlineBusy = true;
      offlineBtn.disabled = true;
      offlineBtn.textContent = 'Installation…';
      const persisted = (async () => {
        await rememberGuestEntryOffline(invitationPath);
        const shownName = root.querySelector('#display-guest-name')?.textContent?.trim() || '';
        const tableLine = root.querySelector('#guest-table-line') as HTMLElement | null;
        const tableVisible = Boolean(tableLine && tableLine.style.display !== 'none' && tableLine.textContent?.trim());
        const tableText = tableVisible ? (tableLine?.textContent || '').replace(/^Table\s+/i, '').trim() : '';
        const saved = await saveOfflineInvitation({
          event,
          token: tokenForOffline,
          guestName: tokenForOffline ? (guestName || shownName) : undefined,
          guestTable: tokenForOffline ? (guestTable || tableText) : undefined,
          guestStatus: tokenForOffline && (guestStatus === 'confirmed' || guestStatus === 'declined') ? guestStatus : undefined,
        });
        const clone = root.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('audio, source').forEach((node) => node.remove());
        const styleEl = shadow.querySelector('style');
        await storeOfflineView(saved.key, {
          css: styleEl?.textContent || '',
          html: clone.outerHTML,
          secrets: [event.adminCode || '', event.user_id || ''],
        });
      })().catch(() => {
        /* Le lien est déjà mémorisé. L’installation ne doit pas attendre une copie parfaite. */
      });
      void (async () => {
        let installed: Awaited<ReturnType<typeof captureInstallClick>> = 'unavailable';
        try {
          installed = await installResult;
        } catch {
          installed = 'unavailable';
        }
        await persisted;
        if (installed === 'accepted' || installed === 'standalone') {
          launchInstalledApp(invitationPath);
          return;
        }
        if (!(offlineBtn instanceof HTMLButtonElement) || !offlineBtn.isConnected) return;
        offlineBtn.disabled = false;
        offlineBusy = false;
        offlineBtn.textContent = 'Installer';
        if (installed === 'ios') window.alert(iosInstallHint());
        else if (installed === 'unavailable') {
          window.alert('Touchez le menu du navigateur, puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».');
        }
      })();
    };
    offlineBtn?.addEventListener('click', onInstall);
    const detachQuiet = initQuietMark(root);
    const detachGuestbook = initGuestbook(root, event.slug, event.sections?.guestbook === true);

    return () => {
      stopCountdown();
      detachTheme();
      detachAbout();
      detachGallery();
      detachMusic();
      detachRsvp();
      printBtn?.removeEventListener('click', onPdf);
      offlineBtn?.removeEventListener('click', onInstall);
      detachDrinks();
      detachQuiet();
      detachGuestbook();
      shadow.replaceChildren();
    };
  }, [event, guestName, guestToken, guestStatus, guestTable, rememberAnswer]);

  const fallbackHero =
    event.heroImage ||
    event.hero_image ||
    event.branding?.heroImage ||
    event.cover_image ||
    event.bestPhotos?.[0] ||
    '';
  const fallbackText = heroTextOf(event.heroText);
  const fallbackLight = heroLightOf(event.heroBrightness);
  const lightText = fallbackText.color !== 'black';
  const fallbackOverlay = lightText
    ? `linear-gradient(180deg, rgba(15,10,20,${fallbackLight.whiteTop}), rgba(15,10,20,${fallbackLight.whiteBottom}))`
    : `linear-gradient(180deg, rgba(255,248,240,${fallbackLight.blackTop}), rgba(255,248,240,${fallbackLight.blackBottom}))`;

  return (
    <div ref={containerRef} className="invitation-experience-host">
      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          height: '58vh',
          minHeight: 360,
          maxWidth: '28rem',
          margin: '0 auto',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            fallbackText.position === 'top'
              ? 'flex-start'
              : fallbackText.position === 'bottom'
                ? 'flex-end'
                : 'center',
          padding:
            fallbackText.position === 'top'
              ? '72px 22px 0'
              : fallbackText.position === 'bottom'
                ? '0 22px 78px'
                : '0 22px',
          background: '#1c1418',
          color: fallbackText.color === 'black' ? '#111827' : fallbackText.color === 'gold' ? '#f6e2a8' : '#fff',
          textAlign: 'center',
        }}
      >
        {fallbackHero && (
          <img
            src={fallbackHero}
            alt=""
            fetchPriority="high"
            decoding="async"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: `brightness(${fallbackLight.photo})`,
              transform: 'scale(1.04)',
            }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: fallbackOverlay }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 14px', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase' }}>
            {new Date(event.event_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            })}
          </p>
          <h1
            style={{
              margin: '0 0 10px',
              fontFamily: textFontFamily(fallbackText.style),
              fontWeight: 600,
              fontStyle: fallbackText.style === 'elegant' ? 'italic' : 'normal',
              fontSize: heroTitleSize(fallbackText.style, fallbackText.size),
              lineHeight: 1.12,
              letterSpacing: fallbackText.style === 'straight' ? '0.14em' : '0.02em',
              textTransform: fallbackText.style === 'straight' ? 'uppercase' : 'none',
              textShadow: 'none',
              WebkitFontSmoothing: 'antialiased',
            }}
          >
            {event.title}
          </h1>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            {event.subtitle || [event.coupleLeft, event.coupleRight].filter(Boolean).join(' & ')}
          </p>
        </div>
      </div>
    </div>
  );
}

function isWebAddress(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function placeLabel(value: string): string {
  const text = value.trim();
  if (!text || isWebAddress(text)) return '';
  return text;
}

function isCurrentInvitation(href: string, slug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(href, window.location.origin);
    const path = url.pathname.replace(/\/$/, '');
    return url.origin === window.location.origin && path === `/e/${slug}`;
  } catch {
    return false;
  }
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

  const primaryColor = cssColor(event.branding?.primaryColor, '#5b21b6');
  const accentColor = cssColor(event.branding?.accentColor, '#2563eb');
  const rsvpColor = cssColor(event.rsvpButtonColor || accentColor, '#7c3aed');
  const dressColor = cssColor(event.dressCodeColor || accentColor, '#c06c84');
  const template = invitationModel(event.invitationTemplate);
  const motifsOn = familyMotifsVisible(event);
  const hero = heroTextOf(event.heroText);
  const card = cardTextOf(event.cardText);
  const light = heroLightOf(event.heroBrightness);
  root.style.setProperty('--primary-color', primaryColor);
  root.style.setProperty('--accent-color', accentColor);
  root.style.setProperty('--rsvp-color', rsvpColor);
  root.style.setProperty('--icon-color', accentColor);
  root.style.setProperty('--dress-color', dressColor);
  root.dataset.template = template;
  root.dataset.motifs = motifsOn ? 'on' : 'off';
  root.dataset.heroPosition = hero.position;
  root.dataset.heroSize = hero.size;
  root.dataset.heroStyle = hero.style;
  root.dataset.heroColor = hero.color;
  root.dataset.cardStyle = card.style;
  root.dataset.messageStyle = card.messageStyle;
  root.dataset.cardWeight = card.weight;
  root.dataset.cardSize = card.size;
  root.dataset.cardAlign = card.align;
  root.dataset.heroBand = event.heroBand === true ? 'on' : 'off';
  root.style.setProperty('--wash-ink', cssColorSoft(primaryColor, '#1e293b', 0.16));
  root.style.setProperty('--wash-light', cssColorSoft(accentColor, '#d6c4a8', 0.22));
  root.style.setProperty('--ink-line', cssColorSoft(primaryColor, '#1e293b', 0.28));
  root.style.setProperty('--hero-photo-brightness', light.photo);
  root.style.setProperty('--hero-veil-white-top', light.whiteTop);
  root.style.setProperty('--hero-veil-white-bottom', light.whiteBottom);
  root.style.setProperty('--hero-veil-black-top', light.blackTop);
  root.style.setProperty('--hero-veil-black-bottom', light.blackBottom);
  root.style.setProperty('--hero-veil-gold-top', light.goldTop);
  root.style.setProperty('--hero-veil-gold-bottom', light.goldBottom);
  const reliefOn = event.textRelief !== false;
  root.dataset.textRelief = reliefOn ? 'on' : 'off';
  root.dataset.guestbook = event.sections?.guestbook === true ? 'on' : 'off';
  root.style.setProperty('--text-relief', cssColorSoft(event.textReliefColor, '#1e293b', 0.34));

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
  const namesLine = [leftName, rightName].filter(Boolean).join(' & ');
  const heroSubtitle = $('#hero-subtitle');
  const subtitleText = (event.subtitle || namesLine || event.location || '').trim();
  if (heroSubtitle) {
    heroSubtitle.textContent = subtitleText;
    heroSubtitle.style.display = subtitleText ? '' : 'none';
  }
  setText('#welcome-gate-title', coupleDisplay);

  const coupleRow = $('#couple-row-container');
  const joinBadge = $('#couple-join-badge');
  const rightNameEl = $('#couple-name-right');
  if (!leftName && !rightName) {
    if (coupleRow) coupleRow.style.display = 'none';
  } else {
    if (coupleRow) coupleRow.style.display = 'flex';
    setText('#couple-name-left', leftName || rightName);
    if (leftName && rightName) {
      setText('#couple-name-right', rightName);
      if (joinBadge) joinBadge.style.display = 'inline-block';
      if (rightNameEl) rightNameEl.style.display = 'inline-block';
    } else {
      if (joinBadge) joinBadge.style.display = 'none';
      if (rightNameEl) rightNameEl.style.display = 'none';
    }
  }

  const kickerEl = $('#card-kicker');
  const kickerText = event.cardKicker === undefined ? 'On vous invite' : event.cardKicker.trim();
  if (kickerEl) {
    kickerEl.textContent = kickerText;
    kickerEl.style.display = kickerText ? 'block' : 'none';
  }

  const greetingText = event.cardGreeting === undefined ? 'Bonjour' : event.cardGreeting.trim();
  const guestShown = Boolean(guestName && guestName.trim());
  setText('#card-greeting', greetingText);
  if (guestShown) setText('#display-guest-name', guestName || '');
  const greetingGap = $('#card-greeting-gap');
  if (greetingGap) greetingGap.style.display = greetingText && guestShown ? 'inline' : 'none';
  const greetingLine = $('#card-greeting-line');
  if (greetingLine) greetingLine.style.display = greetingText || guestShown ? 'block' : 'none';

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
  const namedCouple = [leftName, rightName].filter(Boolean);
  const coupleForIntro = namedCouple.length === 2 ? `${namedCouple[0]} et ${namedCouple[1]}` : namedCouple[0] || 'nous';
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

  // Date
  if (event.event_date) {
    const d = new Date(event.event_date);
    if (!isNaN(d.getTime())) {
      const dayNum = d.getDate();
      const monthYear = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      setText('#summary-date', `${dayNum} ${monthYear}`);
      setText('#hero-date-pill', d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
    }
  }

  // Heure : champ dédié, sinon l'heure déjà portée par la date
  const timeEl = $('#summary-time');
  let timeLabel = (event.event_time || '').trim();
  if (!timeLabel && event.event_date) {
    const clock = new Date(event.event_date);
    if (!isNaN(clock.getTime()) && (clock.getHours() !== 0 || clock.getMinutes() !== 0)) {
      timeLabel = clock.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
  }
  if (timeEl) {
    timeEl.textContent = timeLabel;
    timeEl.style.display = timeLabel ? '' : 'none';
  }

  // Programme
  const programContainer = $('#program-timeline');
  const programTitleEl = $('#program-section-title');
  if (programContainer) {
    if (event.program && event.program.length > 0) {
      if (programTitleEl) {
        programTitleEl.textContent = event.programSectionTitle || 'Au programme';
        programTitleEl.style.display = 'block';
      }
      programContainer.style.display = 'flex';
      const dayProgram = $('#day-program');
      if (dayProgram) dayProgram.style.display = 'block';
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
                ${i < event.program!.length - 1 ? '<div class="inv-divider-line" style="width:1px;height:16px;background:#e5e7eb;margin-top:3px;"></div>' : ''}
              </div>
              <div style="padding-bottom:4px;">
                <p style="font-size:13px;font-weight:700;color:${dotColor};margin-bottom:2px;letter-spacing:0.02em;">${item.time}</p>
                <p class="inv-text-primary" style="font-size:15px;font-weight:600;color:#111827;">${item.title}</p>
              </div>
            </div>`;
        })
        .join('');
    } else {
      if (programTitleEl) programTitleEl.style.display = 'none';
      programContainer.style.display = 'none';
      const dayProgram = $('#day-program');
      if (dayProgram) dayProgram.style.display = 'none';
    }
  }

  // Lieu & Bouton Itinéraire
  const rawPlace = [event.venue, event.venueDetails?.title, event.location, event.address, event.venueDetails?.address]
    .find((value) => value && isWebAddress(value)) || '';
  const venueName = placeLabel(event.venue || event.venueDetails?.title || event.location || '');
  const venueAddr = placeLabel(event.venueDetails?.address || event.address || '');
  setText('#venue-title', venueName || 'Lieu de réception');
  setText('#venue-address', venueAddr);
  setText('#summary-venue', venueName || 'Lieu de réception');
  const addressEl = $('#summary-address');
  if (addressEl) {
    addressEl.textContent = venueAddr;
    addressEl.style.display = venueAddr ? '' : 'none';
  }

  const customMapImg = event.venueDetails?.mapImage || event.mapImage || '';
  const mapFrame = $('#map-frame');
  if (customMapImg) {
    setImg('#map-image', customMapImg);
    if (mapFrame) mapFrame.style.display = 'block';
  } else if (mapFrame) {
    mapFrame.style.display = 'none';
  }

  const rawMapLink = event.links?.map || event.mapLink || rawPlace;
  const mapQuery = encodeURIComponent([venueName, venueAddr].filter((value) => value && value !== 'Lieu de réception').join(', '));
  const candidateMap = rawMapLink && rawMapLink !== '#' && isWebAddress(rawMapLink) ? rawMapLink : '';
  const resolvedMapUrl = !candidateMap || isCurrentInvitation(candidateMap, event.slug)
    ? (mapQuery ? `https://www.google.com/maps/search/?api=1&query=${mapQuery}` : '')
    : candidateMap;
  const mapLink = root.querySelector('#venue-map-link') as HTMLAnchorElement | null;
  if (mapLink) {
    if (resolvedMapUrl) {
      mapLink.href = resolvedMapUrl;
      mapLink.style.display = '';
    } else {
      mapLink.removeAttribute('href');
      mapLink.style.display = 'none';
    }
  }

  const gpsSection = $('#section-gps');
  const gpsMap = root.querySelector('#gps-map') as HTMLIFrameElement | null;
  const gpsLive = $('#gps-live');
  const gpsImageWrap = $('#gps-image-wrap');
  const gpsOpen = root.querySelector('#gps-open') as HTMLAnchorElement | null;
  const placeLine = [venueName, venueAddr].filter((value) => value && value !== 'Lieu de réception').join(' · ');
  if (gpsSection) {
    if (!resolvedMapUrl && !customMapImg) {
      gpsSection.style.display = 'none';
    } else {
      gpsSection.style.display = 'block';
      setText('#gps-place', placeLine);
      if (gpsMap && gpsLive && mapQuery) {
        gpsMap.src = `https://maps.google.com/maps?q=${mapQuery}&z=16&hl=fr&output=embed`;
        gpsLive.style.display = 'block';
        if (gpsImageWrap) gpsImageWrap.style.display = 'none';
      } else if (customMapImg && gpsImageWrap) {
        setImg('#gps-image', customMapImg);
        gpsImageWrap.style.display = 'block';
        if (gpsLive) gpsLive.style.display = 'none';
      }
      if (gpsOpen) {
        if (resolvedMapUrl) {
          gpsOpen.href = resolvedMapUrl;
          gpsOpen.style.display = 'flex';
        } else {
          gpsOpen.style.display = 'none';
        }
      }
    }
  }

  // Texte du bouton RSVP
  const btnText = event.reserveText || 'Oui, je viens';
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
      [
        ['.gallery-kicker', event.galleryKicker ?? 'Ensemble'],
        ['.gallery-title', event.galleryTitle ?? 'Nos photos'],
        ['.gallery-flow-label', event.galleryFlowText ?? 'La suite de nos souvenirs'],
      ].forEach(([selector, value]) => {
        const text = String(value).trim();
        const element = gallerySection.querySelector(selector) as HTMLElement | null;
        if (!element) return;
        element.textContent = text;
        element.style.display = text ? '' : 'none';
      });
      if (uploadedPhotos.length > 0) {
        const gridContainer = $('#best-photos-grid');
        if (gridContainer) fillGallery(gridContainer, uploadedPhotos);
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
              `<img src="${p}" loading="lazy" decoding="async" style="width:120px;height:160px;object-fit:cover;border-radius:0.75rem;border:1px solid rgba(148,163,184,0.25);flex-shrink:0;" alt="Tenue">`
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
  const quietContact = $('#quiet-contact') as HTMLAnchorElement | null;
  if (quietContact) quietContact.hidden = !hasAnyContactAction;

  const motifSection = $('#section-family-motifs');
  const groomSrc = motifsOn ? event.groomMotifImage || '' : '';
  const brideSrc = motifsOn ? event.brideMotifImage || '' : '';
  const showMotifCard = (boxSel: string, imgSel: string, src: string) => {
    const box = $(boxSel);
    const img = root.querySelector(imgSel) as HTMLImageElement | null;
    if (!box) return false;
    if (template !== 'fairepart' && src) {
      if (img) img.src = src;
      box.style.display = 'block';
      return true;
    }
    box.style.display = 'none';
    return false;
  };
  const groomShown = showMotifCard('#groom-motif', '#groom-motif-img', groomSrc);
  const brideShown = showMotifCard('#bride-motif', '#bride-motif-img', brideSrc);
  if (motifSection) {
    const motifCount = Number(groomShown) + Number(brideShown);
    motifSection.dataset.count = String(motifCount);
    motifSection.style.display = motifCount > 0 ? 'grid' : 'none';
  }

  const frameLeft = root.querySelector('#paper-motif-left') as HTMLImageElement | null;
  const frameRight = root.querySelector('#paper-motif-right') as HTMLImageElement | null;
  const leftFrame = groomSrc || brideSrc;
  const rightFrame = brideSrc || groomSrc;
  if (template === 'fairepart' && leftFrame && frameLeft && frameRight) {
    frameLeft.src = leftFrame;
    frameRight.src = rightFrame;
    root.dataset.motifFrame = '1';
  } else {
    root.dataset.motifFrame = '0';
  }

  const main = root.querySelector('#main-view');
  [
    'section-when-where',
    'section-gps',
    'section-dress-code',
    'section-gallery',
    'section-about',
    'drink-menu-section',
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
  ['guestbook-modal'].forEach((id) => {
    const modal = root.querySelector(`#${id}`);
    if (modal && main) main.appendChild(modal);
  });
  const endMark = root.querySelector('.invitation-end-mark');
  if (endMark && main) main.appendChild(endMark);
  const offlineBar = root.querySelector('#offline-invitation-bar');
  if (offlineBar && main) main.appendChild(offlineBar);
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

function fillGallery(grid: HTMLElement, photos: string[]) {
  grid.replaceChildren();
  const featured = photos.slice(0, 4);
  grid.dataset.featured = String(featured.length);

  const makeTile = (src: string, index: number, className: string) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = className;
    tile.dataset.index = String(index);
    tile.setAttribute('aria-label', `Ouvrir la photo ${index + 1}`);
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Photo ${index + 1}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    tile.append(img);
    return tile;
  };

  featured.forEach((src, index) => {
    grid.append(makeTile(src, index, 'gallery-tile gallery-featured-tile'));
  });

  const flow = grid.parentElement?.querySelector('.gallery-flow') as HTMLElement | null;
  const track = flow?.querySelector('.gallery-flow-track') as HTMLElement | null;
  const remaining = photos.slice(4);
  if (!flow || !track) return;

  track.replaceChildren();
  if (remaining.length === 0) {
    flow.hidden = true;
    return;
  }

  flow.hidden = false;
  track.style.setProperty('--gallery-flow-duration', `${Math.max(14, remaining.length * 6)}s`);
  for (let copy = 0; copy < 2; copy += 1) {
    const group = document.createElement('div');
    group.className = 'gallery-flow-group';
    group.setAttribute('aria-hidden', copy === 0 ? 'false' : 'true');
    remaining.forEach((src, offset) => {
      group.append(makeTile(src, offset + 4, 'gallery-tile gallery-flow-tile'));
    });
    track.append(group);
  }
}

function initGallery(root: HTMLElement) {
  const gallery = root.querySelector('#section-gallery');
  const grid = root.querySelector('#best-photos-grid');
  const lightbox = root.querySelector('#gallery-lightbox') as HTMLElement | null;
  const image = root.querySelector('.gallery-lightbox-image') as HTMLImageElement | null;
  const count = root.querySelector('.gallery-lightbox-count');
  const closeBtn = root.querySelector('.gallery-lightbox-close');
  const prevBtn = root.querySelector('.gallery-lightbox-prev');
  const nextBtn = root.querySelector('.gallery-lightbox-next');
  if (!gallery || !grid || !lightbox || !image) return () => {};

  const indexedSources = new Map<number, string>();
  gallery.querySelectorAll<HTMLButtonElement>('.gallery-tile').forEach((tile) => {
    const sourceIndex = Number(tile.dataset.index || '0');
    const source = tile.querySelector('img')?.getAttribute('src') || '';
    if (source && !indexedSources.has(sourceIndex)) indexedSources.set(sourceIndex, source);
  });
  const sources = [...indexedSources.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, source]) => source);
  let index = 0;

  const show = (next: number) => {
    if (!sources.length) return;
    index = (next + sources.length) % sources.length;
    image.src = sources[index];
    image.alt = `Photo ${index + 1}`;
    if (count) count.textContent = `${index + 1} / ${sources.length}`;
    const single = sources.length < 2;
    if (prevBtn instanceof HTMLElement) prevBtn.hidden = single;
    if (nextBtn instanceof HTMLElement) nextBtn.hidden = single;
  };
  const open = (next: number) => {
    show(next);
    lightbox.hidden = false;
    lightbox.classList.add('is-open');
  };
  const close = () => {
    lightbox.classList.remove('is-open');
    lightbox.hidden = true;
    image.removeAttribute('src');
  };
  const onGallery = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const tile = target.closest('.gallery-tile');
    if (!(tile instanceof HTMLButtonElement) || !gallery.contains(tile)) return;
    const picked = Number(tile.dataset.index || '0');
    open(Number.isFinite(picked) ? picked : 0);
  };
  const onPrev = () => show(index - 1);
  const onNext = () => show(index + 1);
  const onBackdrop = (event: Event) => {
    if (event.target === lightbox) close();
  };
  const onKey = (event: KeyboardEvent) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') onPrev();
    if (event.key === 'ArrowRight') onNext();
  };

  gallery.addEventListener('click', onGallery);
  closeBtn?.addEventListener('click', close);
  prevBtn?.addEventListener('click', onPrev);
  nextBtn?.addEventListener('click', onNext);
  lightbox.addEventListener('click', onBackdrop);
  window.addEventListener('keydown', onKey);
  return () => {
    gallery.removeEventListener('click', onGallery);
    closeBtn?.removeEventListener('click', close);
    prevBtn?.removeEventListener('click', onPrev);
    nextBtn?.removeEventListener('click', onNext);
    lightbox.removeEventListener('click', onBackdrop);
    window.removeEventListener('keydown', onKey);
  };
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
  const token =
    guestToken ||
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || '' : '');
  const localKey = token ? `invitia_rsvp_${slug}_${token}` : `invitia_rsvp_${slug}`;

  const setNote = (text: string, isConfirmed?: boolean) => {
    if (!note) return;
    note.textContent = text;
    note.style.color = isConfirmed === false ? '#9ca3af' : 'var(--rsvp-color, #7c3aed)';
  };

  let passGeneration = 0;

  const showCheckinQr = async () => {
    const generation = ++passGeneration;
    const box = root.querySelector('#checkin-pass') as HTMLElement | null;
    const img = root.querySelector('#checkin-qr') as HTMLImageElement | null;
    const caption = root.querySelector('#checkin-qr-caption');
    if (!box || !img || !token) {
      if (box) box.style.display = 'none';
      return;
    }
    const name = root.querySelector('#display-guest-name')?.textContent?.trim() || 'Invité';
    const tableEl = root.querySelector('#guest-table-line') as HTMLElement | null;
    const tableLabel = tableEl && tableEl.style.display !== 'none' ? tableEl.textContent?.trim() || '' : '';
    const [qrSrc, cardSrc] = await Promise.all([
      checkinQrDataUrl(token, 180),
      checkinEntryCardDataUrl({
        token,
        guestName: name,
        tableLabel,
        eventTitle: event.title,
      }),
    ]);
    if (generation !== passGeneration || !box.isConnected) return;
    img.src = qrSrc;
    img.alt = `Carte d’entrée de ${name}`;
    if (caption) caption.textContent = [name, tableLabel].filter(Boolean).join(' · ');
    const download = root.querySelector('#download-checkin-qr') as HTMLAnchorElement | null;
    if (download) {
      download.href = cardSrc;
      download.download = checkinCardFileName(name);
    }
    box.style.display = 'flex';
  };

  const hideCheckinQr = () => {
    passGeneration += 1;
    const box = root.querySelector('#checkin-pass') as HTMLElement | null;
    if (box) box.style.display = 'none';
  };

  const applyVisualState = (status: 'confirmed' | 'declined', revealPass: boolean) => {
    const prompt = root.querySelector('#rsvp-prompt') as HTMLElement | null;
    if (prompt) prompt.style.display = 'none';
    if (status === 'confirmed') {
      setNote('C’est confirmé. On vous attend.', true);
      if (confirmBtn) {
        const lbl = confirmBtn.querySelector('#confirm-presence-label');
        if (lbl) lbl.textContent = 'C’est confirmé';
      }
      if (reserveBtn) {
        const topLbl = reserveBtn.querySelector('#reserve-deadline-text');
        if (topLbl) topLbl.textContent = 'C’est confirmé';
      }
      if (revealPass && token) void showCheckinQr();
      else hideCheckinQr();
    } else if (status === 'declined') {
      hideCheckinQr();
      setNote('C’est noté. Merci d’avoir répondu.', false);
    }
  };

  let alreadyAnswered = false;
  if (guestStatus === 'confirmed' || guestStatus === 'declined') {
    alreadyAnswered = true;
    applyVisualState(guestStatus, guestStatus === 'confirmed');
  } else if (guestStatus === 'pending') {
    hideCheckinQr();
  } else if (rememberAnswer && typeof navigator !== 'undefined' && navigator.onLine === false && token) {
    try {
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal === 'confirmed' || savedLocal === 'declined') {
        alreadyAnswered = true;
        applyVisualState(savedLocal, savedLocal === 'confirmed');
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
      const pending = {
        token,
        status,
        message: (root.querySelector('#guest-message') as HTMLTextAreaElement | null)?.value.trim() || '',
        drinks: rememberedDrinks(slug),
        slug,
        at: Date.now(),
      };
      try {
        localStorage.setItem('eventia-rsvp-pending', JSON.stringify(pending));
      } catch {
        /* la file locale est indisponible */
      }
      if (button) button.disabled = false;
      paintAnswer('Pas de réseau');
      setNote('Pas de réseau. Votre réponse partira dès que vous serez connecté.', false);
      return;
    }
    if (responsesClosed) {
      paintAnswer('Trop tard');
      setNote('Il est trop tard pour répondre.', false);
      onRsvpRef?.current?.({ status, error: 'Il est trop tard pour répondre.' });
      return;
    }
    if (button) button.disabled = true;
    paintAnswer('Un instant…');
    setNote('On enregistre votre réponse…', true);
    const messageField = root.querySelector('#guest-message') as HTMLTextAreaElement | null;
    const message = messageField?.value.trim() || undefined;

    try {
      if (token && isSupabaseReady()) {
        const result = await Promise.race([
          submitGuestRsvp(createClient(), { token, status, message }),
          new Promise<{ error: string }>((resolve) => {
            window.setTimeout(() => resolve({ error: 'Ça prend trop de temps. Réessayez.' }), 12000);
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

      const recorded = Boolean(token && isSupabaseReady() && !responsesClosed);
      if (recorded) persistGuestDrinks(slug, token);
      if (rememberAnswer && recorded) {
        try {
          localStorage.setItem(localKey, status);
        } catch {}
      }
      applyVisualState(status, status === 'confirmed' && recorded);
      paintAnswer(status === 'confirmed' ? 'C’est confirmé' : 'C’est noté');
      const notice = !token
        ? 'Ceci est un essai. Les mariés voient la réponse seulement avec le lien personnel de l’invité.'
        : status === 'confirmed'
          ? 'C’est confirmé. Voici votre carte : gardez-la et montrez-la à l’entrée.'
          : 'C’est noté. Merci d’avoir répondu.';
      setNote(notice, status === 'confirmed');
      if (token) void refreshGuestbookPreview(root, slug);
      onRsvpRef?.current?.({ status, notice });
    } catch {
      if (button) button.disabled = false;
      paintAnswer('Réessayer');
      const failure = 'Ça n’a pas marché. Réessayez.';
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
    if (!alreadyAnswered) setNote('Il est trop tard pour répondre.', false);
  }

  const flushPendingRsvp = async () => {
    if (!navigator.onLine || !token || !isSupabaseReady()) return;
    const raw = localStorage.getItem('eventia-rsvp-pending');
    if (!raw) return;
    try {
      const pending = JSON.parse(raw) as { token?: string; status?: 'confirmed' | 'declined'; message?: string; drinks?: string[] | null; slug?: string };
      if (pending.slug !== slug || pending.token !== token || (pending.status !== 'confirmed' && pending.status !== 'declined')) return;
      const result = await submitGuestRsvp(createClient(), { token, status: pending.status, message: pending.message || undefined });
      if (result.error) return;
      if (pending.drinks) void saveGuestDrinks(createClient(), { token, drinks: pending.drinks });
      localStorage.removeItem('eventia-rsvp-pending');
      if (rememberAnswer) {
        try {
          localStorage.setItem(localKey, pending.status);
        } catch {}
      }
      applyVisualState(pending.status, pending.status === 'confirmed');
      const synced = pending.status === 'confirmed'
        ? 'C’est confirmé. Voici votre carte : gardez-la et montrez-la à l’entrée.'
        : 'C’est noté. Merci d’avoir répondu.';
      setNote(synced, pending.status === 'confirmed');
      onRsvpRef?.current?.({ status: pending.status, notice: synced });
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

function drinkStorageKey(slug?: string) {
  return `wedding_drink_pick_${slug || 'default'}`;
}

function rememberedDrinks(slug?: string): string[] | null {
  try {
    const saved = localStorage.getItem(drinkStorageKey(slug));
    if (saved == null) return null;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string').slice(0, 12)
      : [];
  } catch {
    return null;
  }
}

function persistGuestDrinks(slug: string, token: string) {
  const drinks = rememberedDrinks(slug);
  if (!token || !drinks || !isSupabaseReady()) return;
  void saveGuestDrinks(createClient(), { token, drinks });
}

function initDrinkMenu(root: HTMLElement, event?: EventWithSettings, guestToken?: string) {
  const section = root.querySelector('#drink-menu-section') as HTMLElement | null;
  const grid = root.querySelector('#drink-menu-grid') as HTMLElement | null;
  if (!section || !grid) return () => {};

  const defaultDrinks = event?.drinks || [];
  if (defaultDrinks.length === 0) {
    section.style.display = 'none';
    return () => {};
  }

  const selected = new Set<string>();
  const storageKey = drinkStorageKey(event?.slug);
  const token =
    guestToken ||
    (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') || '' : '');
  let saveTimer = 0;

  try {
    const saved = rememberedDrinks(event?.slug);
    saved?.forEach((id) => selected.add(id));
  } catch {}

  const checkSvg = `<svg style="width:13px;height:13px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  const remember = () => {
    const ids = [...selected];
    try {
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch {}
    if (!token || !isSupabaseReady()) return;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      void saveGuestDrinks(createClient(), { token, drinks: ids });
    }, 350);
  };

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
        remember();
        render();
      });
    });
  }

  render();
  section.style.display = 'block';
  return () => window.clearTimeout(saveTimer);
}

const pageMusic: { audio: HTMLAudioElement | null; eventId: string; source: string; trackKey: string; holders: number } = {
  audio: null,
  eventId: '',
  source: '',
  trackKey: '',
  holders: 0,
};

function silenceAudio(audio: HTMLAudioElement) {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
}

function initMusic(root: HTMLElement, event: EventWithSettings) {
  const templateAudio = root.querySelector('#background-music') as HTMLAudioElement | null;
  if (templateAudio) {
    silenceAudio(templateAudio);
    templateAudio.remove();
  }
  if (!event.ambiance?.enabled) return () => {};

  const btn = root.querySelector('#music-toggle-btn') as HTMLButtonElement | null;
  if (!btn) return () => {};

  const customUrl = event.ambiance.musicUrl || '';
  const hasFile = Boolean(event.ambiance.hasFile) || customUrl.startsWith('data:');
  const directSrc = customUrl.startsWith('data:') || customUrl.startsWith('http') ? customUrl : '';

  let audio = pageMusic.audio;
  if (!audio || !audio.isConnected) {
    audio = document.createElement('audio');
    audio.loop = true;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audio.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none';
    document.body.appendChild(audio);
    pageMusic.audio = audio;
    pageMusic.source = '';
    pageMusic.trackKey = '';
  }
  if (pageMusic.eventId && pageMusic.eventId !== event.id) {
    silenceAudio(audio);
    pageMusic.source = '';
    pageMusic.trackKey = '';
  }
  pageMusic.eventId = event.id;
  pageMusic.holders += 1;

  audio.volume = event.ambiance.volume || 0.35;
  audio.loop = true;

  btn.textContent = audio.paused ? 'Musique' : 'Couper';
  btn.style.display = 'flex';
  btn.style.width = 'auto';
  btn.style.height = '32px';
  btn.style.padding = '0 10px';
  btn.style.borderRadius = '999px';
  btn.style.background = 'var(--rsvp-color, #7c3aed)';
  btn.style.color = 'white';
  btn.style.fontSize = '11px';
  btn.style.fontWeight = '700';

  let cancelled = false;
  const onPlay = () => { if (btn.isConnected) btn.textContent = 'Couper'; };
  const onPause = () => { if (audio.paused && btn.isConnected) btn.textContent = 'Musique'; };

  const tryPlay = () => {
    if (cancelled || !audio.src) return;
    void audio.play().then(onPlay).catch(() => {
      if (btn.isConnected) btn.textContent = 'Musique';
    });
  };

  const trackKey = directSrc || (hasFile ? `file:${event.id}:${event.updated_at || ''}` : '');

  const arm = (src: string, key: string) => {
    if (cancelled || pageMusic.audio !== audio) return;
    if (pageMusic.trackKey === key && pageMusic.source === src && audio.src) return;
    pageMusic.trackKey = key;
    pageMusic.source = src;
    audio.src = src;
    tryPlay();
  };

  const sameTrack = trackKey !== '' && pageMusic.trackKey === trackKey && Boolean(audio.src);
  if (!sameTrack && trackKey) {
    if (directSrc.startsWith('http') || directSrc.startsWith('data:')) arm(directSrc, trackKey);
    else if (hasFile) {
      void fetchEventMusic(createClient(), event.id).then((url) => {
        if (url) arm(url, trackKey);
      }).catch(() => {
        /* pas de musique distante de secours : elle ralentit l’ouverture */
      });
    }
  }

  const onFirstGesture = (gesture: Event) => {
    if (gesture.composedPath().includes(btn)) return;
    if (!audio.paused) {
      document.removeEventListener('pointerdown', onFirstGesture);
      return;
    }
    if (!audio.src) return;
    void audio.play().then(() => {
      onPlay();
      document.removeEventListener('pointerdown', onFirstGesture);
    }).catch(() => {
      if (btn.isConnected) btn.textContent = 'Musique';
    });
  };
  const onClick = (click: Event) => {
    click.stopPropagation();
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
    cancelled = true;
    document.removeEventListener('pointerdown', onFirstGesture);
    btn.removeEventListener('click', onClick);
    audio.removeEventListener('play', onPlay);
    audio.removeEventListener('pause', onPause);
    pageMusic.holders = Math.max(0, pageMusic.holders - 1);
    if (pageMusic.holders === 0) {
      queueMicrotask(() => {
        if (pageMusic.holders === 0 && pageMusic.audio) {
          silenceAudio(pageMusic.audio);
          pageMusic.audio.remove();
          pageMusic.audio = null;
          pageMusic.eventId = '';
          pageMusic.source = '';
          pageMusic.trackKey = '';
        }
      });
    }
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char
  ));
}

async function refreshGuestbookPreview(root: HTMLElement, slug: string) {
  const section = root.querySelector('#section-guestbook') as HTMLElement | null;
  const list = root.querySelector('#guestbook-list') as HTMLElement | null;
  if (!section || !list || root.dataset.guestbook === 'off' || !isSupabaseReady()) {
    if (section && root.dataset.guestbook === 'off') section.style.display = 'none';
    return;
  }
  const notes = await listGuestbook(createClient(), slug, 3);
  list.innerHTML = notes.length
    ? guestbookMarkup(notes)
    : '<p class="guestbook-empty">Aucun message pour le moment.</p>';
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

function initQuietMark(root: HTMLElement) {
  const contact = root.querySelector('#quiet-contact');
  const onClick = (event: Event) => {
    event.preventDefault();
    root.querySelector('#section-gift-contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  contact?.addEventListener('click', onClick);
  return () => contact?.removeEventListener('click', onClick);
}

function initGuestbook(root: HTMLElement, slug: string, enabled: boolean) {
  const section = root.querySelector('#section-guestbook') as HTMLElement | null;
  const list = root.querySelector('#guestbook-list') as HTMLElement | null;
  const open = root.querySelector('#open-guestbook');
  const modal = root.querySelector('#guestbook-modal') as HTMLElement | null;
  const full = root.querySelector('#guestbook-full') as HTMLElement | null;
  const close = modal?.querySelector('[data-close-modal]');
  if (!section || !list || !open || !modal || !full) return () => {};
  if (!enabled) {
    section.style.display = 'none';
    return () => {};
  }
  section.style.display = 'block';
  if (!list.textContent?.trim()) {
    list.innerHTML = '<p class="guestbook-empty">Aucun message pour le moment.</p>';
  }

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
    .invitation-experience-root, .invitation-experience-root *, .invitation-experience-root *::before, .invitation-experience-root *::after { box-sizing: border-box; }
    .invitation-experience-root {
      --hero-image-url: url("https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80");
      --welcome-image-url: url("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80");
      --primary-color: #5b21b6;
      --accent-color: #2563eb;
      --rsvp-color: #7c3aed;
      --icon-color: #2563eb;
      --dress-color: #c06c84;
      font-family: 'Montserrat', sans-serif;
      background-color: #f4f4f6;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
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
      height: 58vh;
      min-height: 360px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: #fff;
      padding: 0 22px;
      position: relative;
      overflow: hidden;
      background: #1c1418;
    }
    .invitation-experience-root .hero-photo,
    .invitation-experience-root .hero-veil {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .invitation-experience-root .hero-photo {
      background-image: var(--hero-image-url);
      background-size: cover;
      background-position: center;
      filter: brightness(var(--hero-photo-brightness, 1));
      transform: scale(1.04);
    }
    .invitation-experience-root .hero-veil {
      background: linear-gradient(
        180deg,
        rgba(15, 10, 20, var(--hero-veil-white-top, 0.42)) 0%,
        rgba(15, 10, 20, var(--hero-veil-white-bottom, 0.72)) 100%
      );
    }
    .invitation-experience-root .hero-copy { position: relative; z-index: 1; max-width: 100%; }
    .invitation-experience-root .hero-title {
      font-family: "Playfair Display", Georgia, serif;
      font-weight: 600;
      font-size: 1.5rem;
      line-height: 1.15;
      letter-spacing: 0.02em;
      margin: 0 0 0.65rem;
      text-shadow: none;
    }
    .invitation-experience-root .hero-date {
      display: inline-block;
      font-size: 10px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.18);
      padding: 5px 14px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      margin: 0 0 14px;
    }
    .invitation-experience-root .hero-subtitle {
      margin: 0;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.2em;
      text-shadow: none;
      text-transform: uppercase;
      opacity: 0.92;
    }
    .invitation-experience-root[data-hero-band="on"] .hero-copy {
      background: rgba(17, 12, 16, 0.46);
      border-radius: 18px;
      padding: 16px 18px 14px;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.16);
    }
    .invitation-experience-root[data-hero-band="on"][data-hero-color="black"] .hero-copy {
      background: rgba(255, 250, 244, 0.84);
      box-shadow: 0 0 0 1px rgba(17, 24, 39, 0.08);
    }
    .invitation-experience-root[data-hero-band="on"][data-hero-color="gold"] .hero-copy {
      background: rgba(28, 16, 6, 0.52);
    }
    .invitation-experience-root .hero-heart {
      width: 22px;
      height: 22px;
      margin: 4px auto 12px;
      color: var(--accent-color, #60a5fa);
    }
    .invitation-experience-root .hero-heart svg { width: 100%; height: 100%; display: block; }
    .invitation-experience-root .invitation-card {
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at 88% 8%, var(--wash-light, rgba(196, 165, 116, 0.2)), transparent 42%),
        radial-gradient(circle at 12% 92%, var(--wash-ink, rgba(30, 41, 59, 0.08)), transparent 46%),
        linear-gradient(168deg, #ffffff 0%, #fffcf8 58%, #ffffff 100%);
      box-shadow: 0 0 0 1px #fff, 0 16px 36px rgba(17, 24, 39, 0.08);
      border: 1px solid var(--ink-line, rgba(30, 41, 59, 0.16));
    }
    .invitation-experience-root .invitation-card--floral::before {
      content: "";
      position: absolute;
      inset: 8px;
      border: 1px solid var(--ink-line, rgba(30, 41, 59, 0.18));
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
      font-family: "Playfair Display", Georgia, serif;
      font-weight: 600;
      font-size: clamp(2rem, 8vw, 2.8rem);
      line-height: 1.1;
      color: #111827;
      margin: 0.2rem 0 0.7rem;
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
      font-family: "Playfair Display", Georgia, serif;
      font-weight: 600;
      font-size: clamp(1.7rem, 7vw, 2.35rem);
      line-height: 1.15;
      letter-spacing: 0.01em;
    }
    .invitation-experience-root .invite-couple-name--left,
    .invitation-experience-root .invite-couple-name--right { color: var(--primary-color, #5b21b6); }
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
      font-family: "Playfair Display", Georgia, serif;
      font-size: clamp(1.05rem, 4.2vw, 1.22rem);
      font-weight: 500;
      line-height: 1.55;
      color: #374151;
      letter-spacing: 0.01em;
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
    .invitation-experience-root .gallery-kicker {
      margin: 0 0 4px;
      font-size: 10px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #9ca3af;
      text-align: center;
    }
    .invitation-experience-root .gallery-title {
      margin: 0 0 14px;
      font-family: "Playfair Display", serif;
      font-size: 1.5rem;
      line-height: 1.1;
      text-align: center;
      color: #111827;
    }
    .invitation-experience-root .gallery-mosaic {
      display: grid;
      gap: 6px;
      overflow: hidden;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.5);
    }
    .invitation-experience-root .gallery-mosaic[data-featured="1"] {
      grid-template-columns: 1fr;
    }
    .invitation-experience-root .gallery-mosaic[data-featured="2"] {
      grid-template-columns: repeat(2, 1fr);
    }
    .invitation-experience-root .gallery-mosaic[data-featured="3"],
    .invitation-experience-root .gallery-mosaic[data-featured="4"] {
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
      grid-auto-rows: 78px;
    }
    .invitation-experience-root .gallery-tile {
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
      border: 0;
      border-radius: 8px;
      overflow: hidden;
      background: #e7e5e4;
      cursor: pointer;
      position: relative;
    }
    .invitation-experience-root .gallery-mosaic[data-featured="1"] .gallery-tile {
      aspect-ratio: 3 / 2;
    }
    .invitation-experience-root .gallery-mosaic[data-featured="2"] .gallery-tile {
      aspect-ratio: 4 / 5;
    }
    .invitation-experience-root .gallery-mosaic[data-featured="3"] .gallery-tile:first-child {
      grid-row: 1 / span 2;
    }
    .invitation-experience-root .gallery-mosaic[data-featured="4"] .gallery-tile:first-child {
      grid-row: 1 / span 3;
    }
    .invitation-experience-root .gallery-tile img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.45s ease;
    }
    .invitation-experience-root .gallery-tile:hover img {
      transform: scale(1.035);
    }
    .invitation-experience-root .gallery-tile:focus-visible {
      outline: 2px solid var(--accent-color, #2563eb);
      outline-offset: 2px;
    }
    .invitation-experience-root .gallery-flow {
      margin-top: 12px;
      overflow: hidden;
      border-radius: 14px;
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
      mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
    }
    .invitation-experience-root .gallery-flow[hidden] { display: none; }
    .invitation-experience-root .gallery-flow-label {
      margin: 0 0 8px;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      text-align: center;
      color: #9ca3af;
    }
    .invitation-experience-root .gallery-flow-track {
      display: flex;
      width: max-content;
      animation: galleryFlow var(--gallery-flow-duration, 18s) linear infinite;
      will-change: transform;
    }
    .invitation-experience-root .gallery-flow:hover .gallery-flow-track,
    .invitation-experience-root .gallery-flow:focus-within .gallery-flow-track {
      animation-play-state: paused;
    }
    .invitation-experience-root .gallery-flow-group {
      display: flex;
      gap: 8px;
      padding-right: 8px;
    }
    .invitation-experience-root .gallery-flow-tile {
      width: 132px;
      height: 92px;
      flex: 0 0 auto;
      box-shadow: 0 8px 20px rgba(17, 24, 39, 0.1);
    }
    @keyframes galleryFlow {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    @media (prefers-reduced-motion: reduce) {
      .invitation-experience-root .gallery-flow {
        overflow-x: auto;
        -webkit-mask-image: none;
        mask-image: none;
      }
      .invitation-experience-root .gallery-flow-track { animation: none; }
      .invitation-experience-root .gallery-tile img { transition: none; }
    }
    .invitation-experience-root.dark-mode-applied .gallery-mosaic {
      background: rgba(15, 23, 42, 0.4);
    }
    .invitation-experience-root.dark-mode-applied .gallery-flow-label { color: #94a3b8; }
    .invitation-experience-root.dark-mode-applied .gallery-flow-tile {
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.32);
    }
    .invitation-experience-root .gallery-lightbox {
      position: fixed;
      inset: 0;
      z-index: 90;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 72px 64px 80px;
      background: rgba(255, 252, 248, 0.96);
    }
    .invitation-experience-root .gallery-lightbox.is-open { display: flex; }
    .invitation-experience-root .gallery-lightbox-image {
      max-width: min(100%, 920px);
      max-height: calc(100vh - 160px);
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 18px 50px rgba(17, 24, 39, 0.22);
    }
    .invitation-experience-root .gallery-lightbox-close,
    .invitation-experience-root .gallery-lightbox-prev,
    .invitation-experience-root .gallery-lightbox-next {
      position: absolute;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 999px;
      background: rgba(17, 24, 39, 0.08);
      color: #111827;
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
    }
    .invitation-experience-root .gallery-lightbox-close { top: 16px; right: 16px; }
    .invitation-experience-root .gallery-lightbox-prev,
    .invitation-experience-root .gallery-lightbox-next { top: 50%; transform: translateY(-50%); }
    .invitation-experience-root .gallery-lightbox-prev { left: 12px; }
    .invitation-experience-root .gallery-lightbox-next { right: 12px; }
    .invitation-experience-root .gallery-lightbox-count {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 22px;
      margin: 0;
      text-align: center;
      font-size: 12px;
      letter-spacing: 0.16em;
      color: #374151;
    }
    .invitation-experience-root.dark-mode-applied .gallery-lightbox {
      background: rgba(2, 6, 16, 0.94);
    }
    .invitation-experience-root.dark-mode-applied .gallery-lightbox-close,
    .invitation-experience-root.dark-mode-applied .gallery-lightbox-prev,
    .invitation-experience-root.dark-mode-applied .gallery-lightbox-next {
      background: rgba(255, 255, 255, 0.12);
      color: #f8fafc;
    }
    .invitation-experience-root.dark-mode-applied .gallery-lightbox-count { color: #e5e7eb; }
    .invitation-experience-root.dark-mode-applied .gallery-tile { background: #1e293b; }
    .invitation-experience-root .dress-marquee-wrapper {
      overflow: hidden;
      border-radius: 0.625rem;
      background: transparent;
      border: 0;
    }
    .invitation-experience-root .dress-marquee-track {
      display: flex;
      width: max-content;
      gap: 0.55rem;
      padding: 0.15rem 0;
      animation: dressMarquee 20s linear infinite;
    }
    .invitation-experience-root .dress-marquee-track img {
      width: 120px;
      height: 160px;
      object-fit: cover;
      border-radius: 0.625rem;
      border: 0;
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
      display: block;
      width: 100%;
      max-width: 100%;
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
    .invitation-experience-root .gps-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #f3f4f6;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      overflow: hidden;
      text-align: center;
    }
    .invitation-experience-root .gps-frame {
      height: 220px;
      background: #F8F4F0;
    }
    .invitation-experience-root .gps-frame iframe,
    .invitation-experience-root .gps-frame img {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
      object-fit: cover;
    }
    .invitation-experience-root .gps-body {
      padding: 14px 16px 16px;
    }
    .invitation-experience-root .gps-kicker {
      margin: 0;
      font-size: 10px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #6B5B4F;
      font-weight: 700;
    }
    .invitation-experience-root .gps-place {
      margin: 6px 0 0;
      font-family: "Playfair Display", serif;
      font-size: 20px;
      line-height: 1.3;
      color: #1A1A2E;
    }
    .invitation-experience-root .gps-open {
      display: flex;
      width: 100%;
      margin-top: 12px;
      min-height: 44px;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background: var(--rsvp-color, #1A1A2E);
      color: white;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
    }
    .invitation-experience-root .checkin-pass {
      margin: 18px auto 0;
      width: 100%;
      max-width: 280px;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .invitation-experience-root .checkin-qr-frame {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 8px;
      border-radius: 12px;
      line-height: 0;
      border: 1px solid #E8E0D8;
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
      margin: 10px 0 0;
      width: 100%;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.35;
      color: #111827;
      text-align: center;
    }
    .invitation-experience-root .checkin-help {
      margin: 8px 0 0;
      width: 100%;
      font-size: 12px;
      line-height: 1.45;
      color: #374151;
      text-align: center;
    }
    .invitation-experience-root .checkin-download {
      display: flex;
      width: 100%;
      margin-top: 12px;
      min-height: 44px;
      align-items: center;
      justify-content: center;
      padding: 0 14px;
      border-radius: 12px;
      background: var(--rsvp-color, #2563eb);
      color: white;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      text-align: center;
    }
    .invitation-experience-root .invitation-card-floral {
      display: none;
    }
    .invitation-experience-root .paper-motif-rail { display: none; }
    .invitation-experience-root #section-family-motifs {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      align-items: start;
    }
    .invitation-experience-root #section-family-motifs[data-count="1"] {
      grid-template-columns: minmax(0, 15.5rem);
      justify-content: center;
    }
    .invitation-experience-root .family-motif {
      min-width: 0;
      margin: 0 !important;
      padding: 7px !important;
      border-radius: 12px !important;
      border-color: rgba(148, 163, 184, 0.2) !important;
      box-shadow: 0 7px 18px rgba(17, 24, 39, 0.055);
    }
    .invitation-experience-root .family-motif img {
      width: 100%;
      height: auto;
      aspect-ratio: 3 / 4;
      object-fit: cover;
      border-radius: 8px;
      display: block;
    }
    .invitation-experience-root .family-motif h3 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(0.78rem, 3.5vw, 0.94rem);
      line-height: 1.25;
      text-align: center;
      margin: 3px 2px 8px;
    }
    .invitation-experience-root .dress-code-card {
      padding: 16px 14px !important;
      border-radius: 14px !important;
      border-color: color-mix(in srgb, var(--dress-color, #c06c84) 24%, transparent) !important;
      box-shadow: 0 8px 22px rgba(17, 24, 39, 0.055) !important;
    }
    .invitation-experience-root .dress-code-icon {
      width: 34px !important;
      height: 34px !important;
      margin-bottom: 9px !important;
      background: color-mix(in srgb, var(--dress-color, #c06c84) 14%, white) !important;
      color: var(--dress-color, #c06c84) !important;
    }
    .invitation-experience-root .dress-code-icon svg {
      width: 17px !important;
      height: 17px !important;
      color: currentColor !important;
    }
    .invitation-experience-root #dress-code-title {
      color: var(--dress-color, #c06c84) !important;
    }
    .invitation-experience-root .dress-code-label {
      color: color-mix(in srgb, var(--dress-color, #c06c84) 66%, #6b7280) !important;
      margin-bottom: 11px !important;
    }
    .invitation-experience-root.dark-mode-applied .family-motif {
      border-color: rgba(148, 163, 184, 0.16) !important;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
    }
    .invitation-experience-root.dark-mode-applied .dress-code-card {
      border-color: color-mix(in srgb, var(--dress-color, #c06c84) 38%, transparent) !important;
    }
    .invitation-experience-root.dark-mode-applied .dress-code-icon {
      background: color-mix(in srgb, var(--dress-color, #c06c84) 20%, #0f172a) !important;
      color: color-mix(in srgb, var(--dress-color, #c06c84) 72%, white) !important;
    }
    .invitation-experience-root.dark-mode-applied #dress-code-title,
    .invitation-experience-root.dark-mode-applied .dress-code-label {
      color: color-mix(in srgb, var(--dress-color, #c06c84) 72%, white) !important;
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

    @media (min-width: 768px) {
      .invitation-experience-root .hero-title { font-size: 1.875rem; }
    }
    .invitation-experience-root[data-hero-position="top"] .hero-bg {
      justify-content: flex-start;
      padding-top: 72px;
    }
    .invitation-experience-root[data-hero-position="bottom"] .hero-bg {
      justify-content: flex-end;
      padding-bottom: 78px;
    }
    .invitation-experience-root[data-hero-size="small"] .hero-title { font-size: 1.2rem; }
    .invitation-experience-root[data-hero-size="large"] .hero-title { font-size: 2.55rem; line-height: 1.05; }
    .invitation-experience-root[data-hero-style="elegant"] .hero-title {
      font-family: "Cormorant Garamond", "Playfair Display", serif;
      font-style: italic;
      font-weight: 600;
      letter-spacing: 0.01em;
      text-transform: none;
    }
    .invitation-experience-root[data-hero-style="elegant"][data-hero-size="small"] .hero-title { font-size: 1.55rem; }
    .invitation-experience-root[data-hero-style="elegant"][data-hero-size="normal"] .hero-title { font-size: 2.15rem; }
    .invitation-experience-root[data-hero-style="elegant"][data-hero-size="large"] .hero-title { font-size: 3rem; }
    .invitation-experience-root[data-hero-style="modern"] .hero-title {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: none;
    }
    .invitation-experience-root[data-hero-style="modern"][data-hero-size="small"] .hero-title { font-size: 1.05rem; }
    .invitation-experience-root[data-hero-style="modern"][data-hero-size="large"] .hero-title { font-size: 2rem; }
    .invitation-experience-root[data-hero-style="script"] .hero-title {
      font-family: "Dancing Script", cursive;
      font-weight: 600;
      letter-spacing: 0;
      text-transform: none;
      text-shadow: none;
    }
    .invitation-experience-root[data-hero-style="script"][data-hero-size="small"] .hero-title { font-size: 1.9rem; }
    .invitation-experience-root[data-hero-style="script"][data-hero-size="normal"] .hero-title { font-size: 2.6rem; }
    .invitation-experience-root[data-hero-style="script"][data-hero-size="large"] .hero-title { font-size: 3.4rem; }
    .invitation-experience-root[data-hero-style="signature"] .hero-title {
      font-family: "Great Vibes", cursive;
      font-weight: 400;
      letter-spacing: 0;
      text-transform: none;
      text-shadow: none;
    }
    .invitation-experience-root[data-hero-style="signature"][data-hero-size="small"] .hero-title { font-size: 2.1rem; }
    .invitation-experience-root[data-hero-style="signature"][data-hero-size="normal"] .hero-title { font-size: 3.1rem; }
    .invitation-experience-root[data-hero-style="signature"][data-hero-size="large"] .hero-title { font-size: 4rem; }
    .invitation-experience-root[data-hero-style="straight"] .hero-title {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-size: 1.05rem;
    }
    .invitation-experience-root[data-hero-style="straight"][data-hero-size="small"] .hero-title { font-size: 0.82rem; }
    .invitation-experience-root[data-hero-style="straight"][data-hero-size="large"] .hero-title { font-size: 1.45rem; }
    .invitation-experience-root[data-hero-color="white"] .hero-bg { color: #fff; }
    .invitation-experience-root[data-hero-color="white"] .hero-veil {
      background: linear-gradient(
        180deg,
        rgba(15, 10, 20, var(--hero-veil-white-top, 0.42)) 0%,
        rgba(15, 10, 20, var(--hero-veil-white-bottom, 0.72)) 100%
      );
    }
    .invitation-experience-root[data-hero-color="black"] .hero-bg { color: #111827; }
    .invitation-experience-root[data-hero-color="black"] .hero-veil {
      background: linear-gradient(
        180deg,
        rgba(255, 248, 240, var(--hero-veil-black-top, 0.58)) 0%,
        rgba(255, 248, 240, var(--hero-veil-black-bottom, 0.78)) 100%
      );
    }
    .invitation-experience-root[data-hero-color="black"] .hero-title,
    .invitation-experience-root[data-hero-color="black"] .hero-subtitle { text-shadow: none; }
    .invitation-experience-root[data-hero-color="black"] .hero-date {
      background: rgba(17, 24, 39, 0.08);
      border-color: rgba(17, 24, 39, 0.18);
      color: #111827;
    }
    .invitation-experience-root[data-hero-color="gold"] .hero-bg { color: #f6e2a8; }
    .invitation-experience-root[data-hero-color="gold"] .hero-veil {
      background: linear-gradient(
        180deg,
        rgba(28, 16, 6, var(--hero-veil-gold-top, 0.4)) 0%,
        rgba(28, 16, 6, var(--hero-veil-gold-bottom, 0.68)) 100%
      );
    }
    .invitation-experience-root #summary-date,
    .invitation-experience-root #summary-venue,
    .invitation-experience-root #venue-title {
      color: var(--primary-color, #5b21b6);
    }
    .invitation-experience-root #venue-map-link,
    .invitation-experience-root .guestbook-more,
    .invitation-experience-root .guestbook-name,
    .invitation-experience-root .checkin-kicker,
    .invitation-experience-root .gps-kicker,
    .invitation-experience-root #countdown-status {
      color: var(--accent-color, #2563eb) !important;
    }
    .invitation-experience-root .guest-table-line {
      border-color: color-mix(in srgb, var(--accent-color, #2563eb) 35%, white);
      background: color-mix(in srgb, var(--accent-color, #2563eb) 12%, white);
      color: var(--accent-color, #2563eb);
    }

    .invitation-experience-root[data-template="fairepart"] {
      background: #e8dcc6;
      color: #3f2e22;
    }
    .invitation-experience-root[data-template="fairepart"] #main-view {
      background: #fbf7ef !important;
      width: calc(100% - 24px);
      max-width: 26.5rem !important;
      margin: 16px auto !important;
      min-height: calc(100vh - 32px) !important;
      border-radius: 2px !important;
      box-shadow:
        0 0 0 1px #c9b89a,
        0 0 0 7px #fbf7ef,
        0 0 0 8px #b7a484,
        0 22px 40px rgba(74, 48, 18, 0.18) !important;
    }
    .invitation-experience-root[data-template="fairepart"] .hero-bg {
      height: 196px;
      min-height: 168px;
      margin: 28px 34px 0;
      border-radius: 2px;
      box-shadow: 0 0 0 6px #fbf7ef, 0 0 0 7px #c9b89a;
    }
    .invitation-experience-root[data-template="fairepart"][data-hero-position="top"] .hero-bg { padding-top: 18px; }
    .invitation-experience-root[data-template="fairepart"][data-hero-position="bottom"] .hero-bg { padding-bottom: 18px; }
    .invitation-experience-root[data-template="fairepart"][data-hero-size="large"] .hero-title { font-size: 1.85rem; }
    .invitation-experience-root[data-template="fairepart"][data-hero-style="script"][data-hero-size="large"] .hero-title,
    .invitation-experience-root[data-template="fairepart"][data-hero-style="signature"][data-hero-size="large"] .hero-title { font-size: 2.7rem; }
    .invitation-experience-root[data-template="fairepart"] .hero-subtitle { font-size: 11px; }
    .invitation-experience-root[data-template="fairepart"] .hero-heart { width: 16px; height: 16px; }
    .invitation-experience-root[data-template="fairepart"] .invite-sheet {
      margin-top: 8px !important;
      padding-left: 28px !important;
      padding-right: 28px !important;
    }
    .invitation-experience-root[data-template="fairepart"] .invitation-card,
    .invitation-experience-root[data-template="fairepart"] .invitation-card--floral::before {
      background: transparent !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
    }
    .invitation-experience-root[data-template="fairepart"] .invitation-card--floral::before { display: none; }
    .invitation-experience-root[data-template="fairepart"] .invite-card-overline {
      letter-spacing: 0.42em;
      color: #8a735c;
    }
    .invitation-experience-root[data-template="fairepart"] .invite-couple-row {
      flex-wrap: nowrap;
      gap: 0.35rem 0.5rem;
    }
    .invitation-experience-root[data-template="fairepart"] .invite-couple-name {
      font-family: "Playfair Display", serif;
      font-weight: 400;
      font-size: clamp(1.35rem, 5.6vw, 1.9rem);
    }
    .invitation-experience-root[data-template="fairepart"] .invite-body-text.invite-calligraphy {
      font-family: "Playfair Display", serif;
      font-style: italic;
      font-size: 1.05rem;
    }
    .invitation-experience-root[data-template="fairepart"] .surface-card,
    .invitation-experience-root[data-template="fairepart"] .gps-card,
    .invitation-experience-root[data-template="fairepart"] .guestbook-open,
    .invitation-experience-root[data-template="fairepart"] .drink-menu-shell,
    .invitation-experience-root[data-template="fairepart"] #section-gallery {
      background: transparent !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      border: none !important;
      border-top: 1px solid #e4d5bc !important;
      color: #3f2e22 !important;
    }
    .invitation-experience-root[data-template="fairepart"] .gallery-title,
    .invitation-experience-root[data-template="fairepart"] .gallery-kicker,
    .invitation-experience-root[data-template="fairepart"] .gps-place,
    .invitation-experience-root[data-template="fairepart"] .inv-text-primary,
    .invitation-experience-root[data-template="fairepart"] h3 {
      color: #3f2e22 !important;
    }
    .invitation-experience-root[data-template="fairepart"] #summary-date,
    .invitation-experience-root[data-template="fairepart"] #summary-venue,
    .invitation-experience-root[data-template="fairepart"] .invite-couple-name {
      color: var(--primary-color, #5b21b6) !important;
    }
    .invitation-experience-root[data-template="fairepart"] .inv-text-muted,
    .invitation-experience-root[data-template="fairepart"] .invite-body-text,
    .invitation-experience-root[data-template="fairepart"] .invite-greeting {
      color: #6d5848 !important;
    }
    .invitation-experience-root[data-template="fairepart"] .inv-subsurface,
    .invitation-experience-root[data-template="fairepart"] .dress-marquee-wrapper {
      background: rgba(255, 252, 246, 0.7) !important;
      border-color: #e4d5bc !important;
    }
    .invitation-experience-root[data-template="fairepart"] #section-family-motifs { display: none !important; }
    .invitation-experience-root[data-motif-frame="1"] .paper-motif-rail {
      display: block;
      position: absolute;
      inset: 0;
      z-index: 4;
      pointer-events: none;
    }
    .invitation-experience-root[data-motif-frame="1"] .paper-motif-rail img {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 42px;
      height: 100%;
      object-fit: cover;
    }
    .invitation-experience-root[data-motif-frame="1"] #paper-motif-left { left: 0; }
    .invitation-experience-root[data-motif-frame="1"] #paper-motif-right { right: 0; }
    .invitation-experience-root[data-motif-frame="1"] #main-view {
      padding-left: 42px;
      padding-right: 42px;
    }
    .invitation-experience-root[data-template="fairepart"][data-motif-frame="1"] .hero-bg {
      margin-left: 10px;
      margin-right: 10px;
    }
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"],
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] #main-view {
      background: #fbf7ef !important;
      color: #3f2e22 !important;
    }
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .surface-card,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .gps-card,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .guestbook-open,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .drink-menu-shell,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .invitation-card,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .guest-message,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .guestbook-note,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .inv-modal-card {
      background: #fffdf8 !important;
      color: #3f2e22 !important;
      border-color: #e4d5bc !important;
    }
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .guestbook-text,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .guest-message,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .inv-text-primary,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] h3 {
      color: #3f2e22 !important;
    }
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] .inv-text-muted {
      color: #6d5848 !important;
    }

    .invitation-experience-root[data-template="photos"] #main-view {
      background: transparent !important;
    }
    .invitation-experience-root[data-template="photos"] .hero-bg {
      background: transparent;
    }
    .invitation-experience-root[data-template="photos"] #main-view::before,
    .invitation-experience-root[data-template="photos"] #main-view::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }
    .invitation-experience-root[data-template="photos"] #main-view::before {
      background-image: var(--hero-image-url);
      background-size: cover;
      background-position: center top;
      filter: brightness(var(--hero-photo-brightness, 1));
    }
    .invitation-experience-root[data-template="photos"] #main-view::after {
      background: linear-gradient(180deg, rgba(255, 252, 248, 0.08) 0%, rgba(255, 252, 248, 0.18) 46%, rgba(255, 252, 248, 0.32) 100%);
    }
    .invitation-experience-root[data-template="photos"] #main-view > * {
      position: relative;
      z-index: 1;
    }
    .invitation-experience-root[data-template="photos"] .gallery-title,
    .invitation-experience-root[data-template="photos"] .gallery-kicker {
      color: #fff !important;
      text-shadow: 0 1px 1px rgba(0, 0, 0, 0.75);
    }
    .invitation-experience-root[data-template="photos"] .gallery-flow-label {
      color: rgba(255, 255, 255, 0.9);
      text-shadow: 0 1px 8px rgba(0, 0, 0, 0.72);
    }
    .invitation-experience-root[data-template="photos"] .invitation-card,
    .invitation-experience-root[data-template="photos"] #section-when-where .surface-card {
      background: rgba(255, 255, 255, 0.72) !important;
      border-color: rgba(255, 255, 255, 0.7) !important;
      box-shadow: 0 18px 40px rgba(17, 24, 39, 0.14) !important;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }
    .invitation-experience-root.dark-mode-applied[data-template="photos"] #main-view {
      background: transparent !important;
    }
    .invitation-experience-root.dark-mode-applied[data-template="photos"] #main-view::after {
      background: linear-gradient(180deg, rgba(2, 6, 16, 0.18) 0%, rgba(2, 6, 16, 0.28) 46%, rgba(2, 6, 16, 0.42) 100%);
    }
    .invitation-experience-root.dark-mode-applied[data-template="photos"] .gallery-title,
    .invitation-experience-root.dark-mode-applied[data-template="photos"] .gallery-kicker {
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.75);
    }
    .invitation-experience-root.dark-mode-applied[data-template="photos"] .invitation-card,
    .invitation-experience-root.dark-mode-applied[data-template="photos"] #section-when-where .surface-card {
      background: rgba(15, 23, 42, 0.58) !important;
      border-color: rgba(255, 255, 255, 0.16) !important;
      color: #f8fafc !important;
    }
    .invitation-experience-root[data-text-relief="on"] .hero-title,
    .invitation-experience-root[data-text-relief="on"] .invite-couple-name {
      text-shadow: 1px 1px 0 var(--text-relief, rgba(30, 41, 59, 0.34)) !important;
    }
    .invitation-experience-root[data-hero-style="script"] .hero-title,
    .invitation-experience-root[data-hero-style="signature"] .hero-title,
    .invitation-experience-root[data-card-style="script"] .invite-couple-name,
    .invitation-experience-root[data-card-style="script"] .invite-greeting,
    .invitation-experience-root[data-card-style="script"] .invite-body-text,
    .invitation-experience-root[data-card-style="signature"] .invite-couple-name,
    .invitation-experience-root[data-card-style="signature"] .invite-greeting,
    .invitation-experience-root[data-card-style="signature"] .invite-body-text {
      text-shadow: none !important;
    }
    .invitation-experience-root[data-card-align="left"] .invitation-card-inner { text-align: left; }
    .invitation-experience-root[data-card-align="left"] .invite-couple-row { justify-content: flex-start; }
    .invitation-experience-root[data-card-align="left"] .guest-table-line { margin-left: 0; margin-right: auto; }
    .invitation-experience-root[data-card-size="small"] .invite-couple-name { font-size: clamp(1.35rem, 5.4vw, 1.75rem); }
    .invitation-experience-root[data-card-size="large"] .invite-couple-name { font-size: clamp(2rem, 8vw, 2.7rem); }
    .invitation-experience-root[data-card-size="small"] .invite-body-text { font-size: clamp(0.95rem, 3.6vw, 1.05rem); }
    .invitation-experience-root[data-card-size="large"] .invite-body-text { font-size: clamp(1.12rem, 4.4vw, 1.32rem); }
    .invitation-experience-root[data-card-size="small"] .invite-greeting { font-size: clamp(1rem, 3.8vw, 1.15rem); }
    .invitation-experience-root[data-card-size="large"] .invite-greeting { font-size: clamp(1.3rem, 5vw, 1.55rem); }
    .invitation-experience-root[data-card-style="classic"] .invite-couple-name,
    .invitation-experience-root[data-card-style="classic"] .invite-greeting,
    .invitation-experience-root[data-card-style="classic"] .invite-body-text,
    .invitation-experience-root[data-card-style="classic"] .invite-body-text.invite-calligraphy,
    .invitation-experience-root[data-card-style="classic"] .invite-card-overline {
      font-family: "Playfair Display", Georgia, serif;
      font-weight: 600;
      font-style: normal;
      letter-spacing: 0.01em;
      text-transform: none;
    }
    .invitation-experience-root[data-card-style="classic"] .invite-body-text { font-weight: 500; }
    .invitation-experience-root[data-card-style="classic"] .invite-card-overline {
      font-weight: 600;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .invitation-experience-root[data-card-style="elegant"] .invite-couple-name,
    .invitation-experience-root[data-card-style="elegant"] .invite-greeting,
    .invitation-experience-root[data-card-style="elegant"] .invite-body-text,
    .invitation-experience-root[data-card-style="elegant"] .invite-body-text.invite-calligraphy,
    .invitation-experience-root[data-card-style="elegant"] .invite-card-overline {
      font-family: "Cormorant Garamond", "Playfair Display", serif;
      font-weight: 600;
      font-style: italic;
      letter-spacing: 0.01em;
      text-transform: none;
    }
    .invitation-experience-root[data-card-style="elegant"] .invite-card-overline {
      font-style: normal;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .invitation-experience-root[data-card-style="elegant"] .invite-couple-name { font-size: clamp(2rem, 8vw, 2.8rem); }
    .invitation-experience-root[data-card-style="elegant"][data-card-size="small"] .invite-couple-name { font-size: clamp(1.6rem, 6.2vw, 2.1rem); }
    .invitation-experience-root[data-card-style="elegant"][data-card-size="large"] .invite-couple-name { font-size: clamp(2.4rem, 9vw, 3.3rem); }
    .invitation-experience-root[data-card-style="modern"] .invite-couple-name,
    .invitation-experience-root[data-card-style="modern"] .invite-greeting,
    .invitation-experience-root[data-card-style="modern"] .invite-body-text,
    .invitation-experience-root[data-card-style="modern"] .invite-body-text.invite-calligraphy,
    .invitation-experience-root[data-card-style="modern"] .invite-card-overline {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      font-style: normal;
      letter-spacing: 0.01em;
      text-transform: none;
    }
    .invitation-experience-root[data-card-style="modern"] .invite-body-text { font-weight: 500; }
    .invitation-experience-root[data-card-style="modern"] .invite-card-overline {
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .invitation-experience-root[data-card-style="modern"] .invite-couple-name { font-size: clamp(1.35rem, 5.5vw, 1.85rem); }
    .invitation-experience-root[data-card-style="modern"][data-card-size="small"] .invite-couple-name { font-size: clamp(1.1rem, 4.4vw, 1.45rem); }
    .invitation-experience-root[data-card-style="modern"][data-card-size="large"] .invite-couple-name { font-size: clamp(1.6rem, 6.4vw, 2.2rem); }
    .invitation-experience-root[data-card-style="straight"] .invite-couple-name,
    .invitation-experience-root[data-card-style="straight"] .invite-greeting,
    .invitation-experience-root[data-card-style="straight"] .invite-body-text,
    .invitation-experience-root[data-card-style="straight"] .invite-body-text.invite-calligraphy,
    .invitation-experience-root[data-card-style="straight"] .invite-card-overline {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      font-style: normal;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .invitation-experience-root[data-card-style="straight"] .invite-body-text {
      font-weight: 500;
      letter-spacing: 0.06em;
      line-height: 1.7;
    }
    .invitation-experience-root[data-card-style="straight"] .invite-couple-name { font-size: clamp(1.05rem, 4.2vw, 1.4rem); }
    .invitation-experience-root[data-card-style="straight"][data-card-size="small"] .invite-couple-name { font-size: clamp(0.85rem, 3.4vw, 1.1rem); }
    .invitation-experience-root[data-card-style="straight"][data-card-size="large"] .invite-couple-name { font-size: clamp(1.25rem, 5vw, 1.7rem); }
    .invitation-experience-root[data-card-style="script"] .invite-couple-name,
    .invitation-experience-root[data-card-style="script"] .invite-greeting,
    .invitation-experience-root[data-card-style="script"] .invite-body-text,
    .invitation-experience-root[data-card-style="script"] .invite-body-text.invite-calligraphy,
    .invitation-experience-root[data-card-style="script"] .invite-card-overline {
      font-family: "Dancing Script", cursive;
      font-weight: 600;
      font-style: normal;
      letter-spacing: 0;
      text-transform: none;
    }
    .invitation-experience-root[data-card-style="script"] .invite-body-text.invite-calligraphy { font-size: clamp(1.35rem, 5vw, 1.7rem); line-height: 1.45; }
    .invitation-experience-root[data-card-style="script"][data-card-size="small"] .invite-body-text.invite-calligraphy { font-size: clamp(1.15rem, 4.2vw, 1.4rem); }
    .invitation-experience-root[data-card-style="script"][data-card-size="large"] .invite-body-text.invite-calligraphy { font-size: clamp(1.55rem, 5.6vw, 1.95rem); }
    .invitation-experience-root[data-card-style="script"] .invite-couple-name { font-size: clamp(2.2rem, 8vw, 2.9rem); }
    .invitation-experience-root[data-card-style="script"][data-card-size="small"] .invite-couple-name { font-size: clamp(1.8rem, 6.5vw, 2.3rem); }
    .invitation-experience-root[data-card-style="script"][data-card-size="large"] .invite-couple-name { font-size: clamp(2.6rem, 10vw, 3.5rem); }
    .invitation-experience-root[data-card-style="signature"] .invite-couple-name,
    .invitation-experience-root[data-card-style="signature"] .invite-greeting,
    .invitation-experience-root[data-card-style="signature"] .invite-body-text,
    .invitation-experience-root[data-card-style="signature"] .invite-body-text.invite-calligraphy,
    .invitation-experience-root[data-card-style="signature"] .invite-card-overline {
      font-family: "Great Vibes", cursive;
      font-weight: 400;
      font-style: normal;
      letter-spacing: 0;
      text-transform: none;
    }
    .invitation-experience-root[data-card-style="signature"] .invite-body-text.invite-calligraphy { font-size: clamp(1.7rem, 6vw, 2.15rem); line-height: 1.35; }
    .invitation-experience-root[data-card-style="signature"][data-card-size="small"] .invite-body-text.invite-calligraphy { font-size: clamp(1.4rem, 5vw, 1.75rem); }
    .invitation-experience-root[data-card-style="signature"][data-card-size="large"] .invite-body-text.invite-calligraphy { font-size: clamp(2rem, 7vw, 2.5rem); }
    .invitation-experience-root[data-card-style="signature"] .invite-couple-name { font-size: clamp(2.6rem, 10vw, 3.5rem); }
    .invitation-experience-root[data-card-style="signature"][data-card-size="small"] .invite-couple-name { font-size: clamp(2.1rem, 8vw, 2.7rem); }
    .invitation-experience-root[data-card-style="signature"][data-card-size="large"] .invite-couple-name { font-size: clamp(3.1rem, 12vw, 4.2rem); }
    .invitation-experience-root[data-card-style="classic"] .invite-body-text.invite-calligraphy,
    .invitation-experience-root[data-card-style="elegant"] .invite-body-text.invite-calligraphy,
    .invitation-experience-root[data-card-style="modern"] .invite-body-text.invite-calligraphy {
      font-weight: 500;
    }
    .invitation-experience-root[data-card-style="script"] .invite-card-overline,
    .invitation-experience-root[data-card-style="signature"] .invite-card-overline {
      font-family: "Montserrat", sans-serif;
      font-weight: 600;
      font-size: 0.68rem;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .invitation-experience-root[data-message-style="classic"] .invite-body-text.invite-calligraphy {
      font-family: "Playfair Display", Georgia, serif;
      font-weight: 500;
      font-style: normal;
      letter-spacing: 0.01em;
      text-transform: none;
      font-size: clamp(1.02rem, 3.8vw, 1.16rem);
      line-height: 1.55;
    }
    .invitation-experience-root[data-message-style="elegant"] .invite-body-text.invite-calligraphy {
      font-family: "Cormorant Garamond", "Playfair Display", serif;
      font-weight: 500;
      font-style: italic;
      letter-spacing: 0.01em;
      text-transform: none;
      font-size: clamp(1.12rem, 4.2vw, 1.32rem);
      line-height: 1.45;
    }
    .invitation-experience-root[data-message-style="modern"] .invite-body-text.invite-calligraphy {
      font-family: "Montserrat", sans-serif;
      font-weight: 500;
      font-style: normal;
      letter-spacing: 0.01em;
      text-transform: none;
      font-size: clamp(0.95rem, 3.6vw, 1.05rem);
      line-height: 1.6;
    }
    .invitation-experience-root[data-message-style="straight"] .invite-body-text.invite-calligraphy {
      font-family: "Montserrat", sans-serif;
      font-weight: 500;
      font-style: normal;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-size: clamp(0.82rem, 3.2vw, 0.95rem);
      line-height: 1.65;
    }
    .invitation-experience-root[data-message-style="script"] .invite-body-text.invite-calligraphy {
      font-family: "Dancing Script", cursive;
      font-weight: 600;
      font-style: normal;
      letter-spacing: 0;
      text-transform: none;
      font-size: clamp(1.25rem, 4.6vw, 1.5rem);
      line-height: 1.4;
    }
    .invitation-experience-root[data-message-style="signature"] .invite-body-text.invite-calligraphy {
      font-family: "Great Vibes", cursive;
      font-weight: 400;
      font-style: normal;
      letter-spacing: 0;
      text-transform: none;
      font-size: clamp(1.45rem, 5vw, 1.75rem);
      line-height: 1.35;
    }
    .invitation-experience-root[data-card-weight="fine"] .invite-couple-name { font-weight: 500; }
    .invitation-experience-root[data-card-weight="strong"] .invite-couple-name { font-weight: 700; }
    .invitation-experience-root[data-card-weight="fine"] .invite-body-text.invite-calligraphy { font-weight: 400; }
    .invitation-experience-root[data-card-weight="strong"] .invite-body-text.invite-calligraphy { font-weight: 600; }
    .invitation-experience-root[data-card-style="signature"] .invite-couple-name,
    .invitation-experience-root[data-message-style="signature"] .invite-body-text.invite-calligraphy { font-weight: 400; }
    .invitation-experience-root[data-card-style="script"] .invite-couple-name,
    .invitation-experience-root[data-message-style="script"] .invite-body-text.invite-calligraphy { font-weight: 600; }
    .invitation-experience-root #section-when-where .day-card,
    .invitation-experience-root[data-template="photos"] #section-when-where .day-card,
    .invitation-experience-root[data-template="fairepart"] #section-when-where .day-card,
    .invitation-experience-root.dark-mode-applied #section-when-where .day-card,
    .invitation-experience-root.dark-mode-applied[data-template="photos"] #section-when-where .day-card,
    .invitation-experience-root.dark-mode-applied[data-template="fairepart"] #section-when-where .day-card {
      background: #fffdfb !important;
      color: #111827 !important;
      border: 1px solid rgba(17, 24, 39, 0.1) !important;
      border-radius: 18px;
      box-shadow: 0 8px 24px rgba(17, 24, 39, 0.06) !important;
      padding: 20px 18px 16px;
      text-align: center;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    .invitation-experience-root #section-when-where .day-kicker,
    .invitation-experience-root.dark-mode-applied #section-when-where .day-kicker {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #1f2937 !important;
    }
    .invitation-experience-root #section-when-where .day-rule {
      display: block;
      width: 42px;
      height: 1px;
      margin: 14px auto;
      background: #111827;
    }
    .invitation-experience-root #section-when-where #summary-date,
    .invitation-experience-root #section-when-where #summary-venue,
    .invitation-experience-root[data-template="fairepart"] #section-when-where #summary-date,
    .invitation-experience-root[data-template="fairepart"] #section-when-where #summary-venue,
    .invitation-experience-root.dark-mode-applied #section-when-where #summary-date,
    .invitation-experience-root.dark-mode-applied #section-when-where #summary-venue,
    .invitation-experience-root.dark-mode-applied #section-when-where .day-card h3 {
      font-family: "Playfair Display", Georgia, serif;
      font-weight: 600;
      line-height: 1.25;
      margin: 0;
      color: #111827 !important;
      text-shadow: none !important;
    }
    .invitation-experience-root #section-when-where #summary-date { font-size: 1.7rem; }
    .invitation-experience-root #section-when-where #summary-venue { font-size: 1.4rem; }
    .invitation-experience-root #section-when-where .day-detail,
    .invitation-experience-root.dark-mode-applied #section-when-where .day-detail {
      margin: 8px 0 0;
      font-size: 16px;
      line-height: 1.45;
      color: #111827 !important;
      font-weight: 600;
    }
    .invitation-experience-root #section-when-where .day-program {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid rgba(17, 24, 39, 0.12);
    }
    .invitation-experience-root #section-when-where #program-section-title,
    .invitation-experience-root.dark-mode-applied #section-when-where #program-section-title {
      color: #1f2937 !important;
      font-size: 12px !important;
    }
    .invitation-experience-root #section-when-where .day-card .inv-text-primary,
    .invitation-experience-root.dark-mode-applied #section-when-where .day-card .inv-text-primary,
    .invitation-experience-root.dark-mode-applied #section-when-where .day-card h3 {
      color: #111827 !important;
    }
    .invitation-experience-root #program-timeline { gap: 2px; margin-bottom: 10px; }
    .invitation-experience-root .invite-body-text {
      color: color-mix(in srgb, var(--primary-color, #1e293b) 78%, #111827);
    }
    .invitation-experience-root .invitation-end-mark {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 18px;
      padding: 36px 16px 22px;
    }
    .invitation-experience-root .invitation-end-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      text-decoration: none;
    }
    .invitation-experience-root .invitation-end-link svg { width: 14px; height: 14px; }
    .invitation-experience-root .invitation-end-link[hidden] { display: none; }
    .invitation-experience-root.dark-mode-applied .invitation-end-link { color: #64748b; }
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
      <div id="paper-motif-rail" class="paper-motif-rail" aria-hidden="true">
        <img id="paper-motif-left" alt="">
        <img id="paper-motif-right" alt="">
      </div>

      <!-- 1. Hero Couverture -->
      <header class="hero-bg">
        <div class="hero-photo" aria-hidden="true"></div>
        <div class="hero-veil" aria-hidden="true"></div>
        <div class="hero-copy">
          <p id="hero-date-pill" class="hero-date"></p>
          <h1 id="hero-title" class="hero-title">Titre</h1>
          <div class="hero-heart">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <p id="hero-subtitle" class="hero-subtitle">Couple</p>
        </div>
      </header>

      <!-- 2. Carte d'invitation -->
      <section class="invite-sheet" style="padding:0 16px;margin-top:-52px;position:relative;z-index:10;">
        <article class="invitation-card invitation-card--floral rounded-2xl text-center" aria-label="Carte d'invitation">
          <div class="invitation-card-floral invitation-card-floral--tl" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none"><path d="M12 58c8-18 26-22 34-38 3-6 2-12-1-16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M18 24c6 4 10 10 10 18 0 8-5 14-12 16" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M42 14c-2 8 2 16 8 22" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><circle cx="24" cy="34" r="5" stroke="currentColor" stroke-width="1"/><circle cx="38" cy="22" r="3.5" fill="currentColor"/><circle cx="52" cy="30" r="2.5" fill="currentColor"/><path d="M20 48c4 6 10 8 16 6" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/></svg>
          </div>
          <div class="invitation-card-floral invitation-card-floral--br" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none"><path d="M12 58c8-18 26-22 34-38 3-6 2-12-1-16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M18 24c6 4 10 10 10 18 0 8-5 14-12 16" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M42 14c-2 8 2 16 8 22" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><circle cx="24" cy="34" r="5" stroke="currentColor" stroke-width="1"/><circle cx="38" cy="22" r="3.5" fill="currentColor"/><circle cx="52" cy="30" r="2.5" fill="currentColor"/><path d="M20 48c4 6 10 8 16 6" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/></svg>
          </div>
          <div class="invitation-card-inner">
            <p id="card-kicker" class="invite-card-overline">On vous invite</p>
            <div id="couple-row-container" class="invite-couple-row">
              <span id="couple-name-left" class="invite-couple-name invite-couple-name--left"></span>
              <span id="couple-join-badge" class="invite-couple-join">&amp;</span>
              <span id="couple-name-right" class="invite-couple-name invite-couple-name--right"></span>
            </div>
            <p id="card-greeting-line" class="invite-greeting"><span id="card-greeting">Bonjour</span><span id="card-greeting-gap"> </span><span id="display-guest-name" class="invite-guest-name"></span></p>
            <p id="guest-table-line" class="guest-table-line"></p>
            <p id="invite-intro-paragraph" class="invite-body-text invite-calligraphy"></p>
            <p id="invite-secondary-text" class="invite-body-text invite-calligraphy" style="display:none;"></p>
            <p id="invite-main-text" class="invite-body-text invite-calligraphy" style="display:none;"><span id="invitation-main-text"></span></p>
          </div>
        </article>
      </section>

      <section id="section-when-where" style="padding:0 16px;margin-top:16px;">
        <div class="surface-card day-card">
          <p class="day-kicker">Le jour et le lieu</p>
          <p id="summary-date"></p>
          <p id="summary-time" class="day-detail"></p>
          <span class="day-rule" aria-hidden="true"></span>
          <h3 id="summary-venue"></h3>
          <p id="summary-address" class="day-detail"></p>
          <div id="day-program" class="day-program">
            <p id="program-section-title" style="font-size:12px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:0.16em;margin-bottom:10px;text-align:center;">Au programme</p>
            <div id="program-timeline" style="display:flex;flex-direction:column;gap:2px;text-align:left;margin-bottom:10px;"></div>
          </div>
          <button id="reserve-deadline-btn" type="button" class="btn-rsvp" style="width:100%;border-radius:12px;padding:12px 14px;min-height:2.75rem;">
            <span id="reserve-deadline-text" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.16em;">Oui, je viens</span>
          </button>
        </div>
      </section>

      <section id="section-gps" style="padding:0 16px;margin-top:16px;display:none;">
        <div class="gps-card surface-card">
          <div id="gps-image-wrap" class="gps-frame" style="display:none;">
            <img id="gps-image" loading="lazy" decoding="async" alt="Carte du lieu">
          </div>
          <div id="gps-live" class="gps-frame" style="display:none;">
            <iframe id="gps-map" title="Carte pour aller au lieu" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
          <div class="gps-body">
            <p class="gps-kicker">Y aller</p>
            <p id="gps-place" class="gps-place"></p>
            <a id="gps-open" class="gps-open" href="#" target="_blank" rel="noopener noreferrer">Ouvrir le GPS</a>
          </div>
        </div>
      </section>

      <!-- 3. À propos / Notre histoire -->
      <section id="section-about" style="padding:0 16px;margin-top:24px;display:none;">
        <div id="about-section-card" style="position:relative;border-radius:16px;overflow:hidden;height:118px;box-shadow:0 4px 12px rgba(0,0,0,0.06);background:#111827;cursor:pointer;">
          <img id="about-cover-image" loading="lazy" decoding="async" src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Notre histoire" style="width:100%;height:100%;object-fit:cover;opacity:0.62;">
          <div style="position:absolute;inset:0;display:flex;align-items:center;padding:0 24px;">
            <div style="color:white;">
              <h3 id="about-card-title" class="font-serif text-xl mb-1" style="font-family:'Playfair Display',serif;color:white !important;">Notre histoire</h3>
              <p id="about-toggle-label" style="font-size:11px;color:#e5e7eb;font-weight:400;display:inline-flex;align-items:center;background:rgba(0,0,0,0.35);padding:4px 10px;border-radius:999px;backdrop-filter:blur(4px);">
                Lire notre histoire ›
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
        <p class="gallery-kicker">Ensemble</p>
        <h3 class="gallery-title">Nos photos</h3>
        <div id="best-photos-grid" class="gallery-mosaic"></div>
        <div class="gallery-flow" hidden>
          <p class="gallery-flow-label">La suite de nos souvenirs</p>
          <div class="gallery-flow-track"></div>
        </div>
      </section>

      <!-- 5. Dress Code -->
      <section id="section-dress-code" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="surface-card dress-code-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:24px;text-align:center;border:1px solid #f3f4f6;">
          <div class="inv-icon-badge dress-code-icon" style="width:40px;height:40px;border-radius:999px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            <svg style="width:20px;height:20px;color:var(--icon-color, #2563eb);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 8l-4-3-2 2h-4l-2-2-4 3v4l2 1v8h12v-8l2-1z"/></svg>
          </div>
          <h3 id="dress-code-title" class="font-serif text-lg mb-1 inv-text-primary" style="font-family:'Playfair Display',serif;">Tenue élégante</h3>
          <p class="dress-code-label" style="font-size:10px;color:#9ca3af;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.2em;">La tenue</p>
          <div class="dress-marquee-wrapper" style="display:none;">
            <div class="dress-marquee-track"></div>
          </div>
        </div>
      </section>

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
          <h3 class="inv-text-primary">Famille de l'homme</h3>
          <img id="groom-motif-img" loading="lazy" decoding="async" alt="Tissu de la famille de l'homme">
        </div>
        <div id="bride-motif" class="family-motif surface-card" style="display:none;background:white;border-radius:16px;padding:16px;border:1px solid #f3f4f6;">
          <h3 class="inv-text-primary">Famille de la femme</h3>
          <img id="bride-motif-img" loading="lazy" decoding="async" alt="Tissu de la famille de la femme">
        </div>
      </section>

      <!-- 9. Confirmation de présence (RSVP) -->
      <section id="section-rsvp" style="padding:0 16px;margin-top:24px;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:22px 18px;border:1px solid #f3f4f6;text-align:center;">
          <h3 class="font-serif inv-text-primary" style="font-family:'Playfair Display',serif;font-size:20px;margin-bottom:4px;">Vous venez ?</h3>
          <p id="rsvp-prompt" class="inv-text-muted" style="font-size:13px;line-height:1.45;margin:0 0 12px;">Dites oui maintenant. Votre carte d'entrée apparaît juste après.</p>
          <p id="rsvp-deadline-caption" class="inv-text-muted" style="font-size:11px;margin-bottom:14px;display:none;"></p>
          <label for="guest-message" class="inv-text-muted" style="display:block;text-align:left;font-size:12px;font-weight:600;margin-bottom:6px;">Un mot pour les mariés</label>
          <textarea id="guest-message" class="guest-message" maxlength="500" placeholder="Un souvenir, un souhait, un simple oui…"></textarea>
          <button id="confirm-presence-btn" type="button" class="btn-rsvp" style="width:100%;border-radius:12px;padding:15px;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;">
            <span style="width:26px;height:26px;border-radius:999px;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;">
              <svg style="width:15px;height:15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </span>
            <span id="confirm-presence-label" style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;">Oui, je viens</span>
          </button>
          <button id="decline-presence-btn" type="button" style="width:100%;margin-top:10px;border-radius:12px;padding:12px;background:#f9fafb;color:#4b5563;border:1px solid #e5e7eb;font-size:12px;font-weight:500;cursor:pointer;">
            Non, je ne pourrai pas
          </button>
          <p id="rsvp-status-note" style="margin-top:12px;text-align:center;font-size:15px;font-weight:700;line-height:1.4;min-height:1.4rem;"></p>
          <div id="checkin-pass" class="checkin-pass" style="display:none;">
            <p class="checkin-kicker">Votre carte d'entrée</p>
            <div class="checkin-qr-frame">
              <img id="checkin-qr" alt="Carte d'entrée" width="168" height="168">
            </div>
            <p id="checkin-qr-caption" class="checkin-caption"></p>
            <p class="checkin-help">Gardez-la. Le jour de la fête, montrez-la à l'entrée.</p>
            <a id="download-checkin-qr" class="checkin-download" href="#">Enregistrer ma carte</a>
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
            <h3 class="inv-text-primary" style="font-family:'Playfair Display',serif;font-size:19px;margin-bottom:4px;">Que boire ?</h3>
            <p class="inv-text-muted" style="font-size:11px;max-width:320px;margin:0 auto;">Choisissez ce que vous aimez. Avec votre lien personnel, les mariés voient ce choix.</p>
          </div>
          <div id="drink-menu-grid" class="drink-menu-grid" style="padding:0 16px 16px;"></div>
        </div>
      </section>

      <!-- 11. Informations pratiques -->
      <section id="section-practical-info" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:20px;border:1px solid #f3f4f6;">
          <h3 class="inv-text-primary" style="font-weight:700;font-size:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;text-transform:uppercase;letter-spacing:0.08em;">
            <span id="practical-info-title">À savoir</span>
            <span id="practical-info-count" style="color:#9ca3af;font-size:10px;font-weight:500;"></span>
          </h3>
          <div id="practical-info-list" style="display:flex;flex-direction:column;gap:14px;"></div>
        </div>
      </section>

      <!-- 12. Cadeau / Cagnotte / Contact -->
      <section id="section-gift-contact" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:20px;border:1px solid #f3f4f6;text-align:center;">
          <h3 class="font-serif inv-text-primary" style="font-family:'Playfair Display',serif;font-size:18px;margin-bottom:6px;">Un cadeau ou une question ?</h3>
          <p class="inv-text-muted" style="font-size:11px;margin-bottom:14px;">Les liens sont juste en dessous.</p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <a id="gift-donation-link" href="#" target="_blank" rel="noopener noreferrer" style="display:none;width:100%;justify-content:center;align-items:center;gap:8px;background:var(--rsvp-color, #7c3aed);color:white;padding:12px 18px;border-radius:12px;font-size:12px;font-weight:600;text-decoration:none;">
              <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              <span>Voir la liste de cadeaux</span>
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
      <footer class="invitation-end-mark">
        <a id="quiet-home" class="invitation-end-link" href="/">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c2 3 2 5 0 8-2-3-2-5 0-8Z"/><path d="M12 11c3 1 5 3 5 6a5 5 0 0 1-10 0c0-3 2-5 5-6Z"/></svg>
          <span>Eventia</span>
        </a>
        <a id="quiet-contact" class="invitation-end-link" href="#section-gift-contact" hidden>Nous écrire</a>
      </footer>
      <div id="offline-invitation-bar" style="position:sticky;bottom:12px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 16px 20px;">
        <button id="save-offline-btn" type="button" style="min-height:40px;padding:0 14px;border-radius:999px;background:var(--rsvp-color, #5b21b6);color:white;border:none;cursor:pointer;font-size:12px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.16);">Installer</button>
      </div>
    </main>
    <div id="gallery-lightbox" class="gallery-lightbox" hidden>
      <button type="button" class="gallery-lightbox-close" aria-label="Fermer">×</button>
      <button type="button" class="gallery-lightbox-prev" aria-label="Photo précédente">‹</button>
      <img class="gallery-lightbox-image" alt="">
      <button type="button" class="gallery-lightbox-next" aria-label="Photo suivante">›</button>
      <p class="gallery-lightbox-count"></p>
    </div>
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
    .invitation-experience-root.pdf-capture #welcome-gate,
    .invitation-experience-root.pdf-capture .gallery-lightbox { display: none !important; }
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
    .invitation-experience-root.pdf-capture[data-template="fairepart"] .hero-bg {
      height: 220px !important;
      min-height: 180px !important;
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
