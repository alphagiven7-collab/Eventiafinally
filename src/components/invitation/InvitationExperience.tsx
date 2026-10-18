'use client';

import { useEffect, useRef } from 'react';
import { EventWithSettings, GuestStatus } from '@/types';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { submitGuestRsvp } from '@/lib/guests/store';

export default function InvitationExperience({
  event,
  guestName,
  guestToken,
  guestStatus,
}: {
  event: EventWithSettings;
  guestName?: string;
  guestToken?: string;
  guestStatus?: GuestStatus;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const root = containerRef.current;

    const tailwind = document.createElement('link');
    tailwind.rel = 'stylesheet';
    tailwind.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    root.prepend(tailwind);

    const style = document.createElement('style');
    style.textContent = getOriginalCSS();
    root.prepend(style);

    hydrateEventData(root, event, guestName);

    const stopCountdown = event.event_date ? initCountdown(root, event.event_date) : () => {};
    const detachTheme = initThemeToggle(root);
    initGate(root, guestName);
    const detachAbout = initAboutSection(root);
    const detachGallery = initGalleryScroll(root);
    initDrinkMenu(root, event);
    const detachMusic = initMusic(root, event);
    const detachRsvp = initRsvp(root, event.slug, guestToken, guestStatus);

    return () => {
      stopCountdown();
      detachTheme();
      detachAbout();
      detachGallery();
      detachMusic();
      detachRsvp();
      style.remove();
      tailwind.remove();
    };
  }, [event, guestName, guestToken, guestStatus]);

  return (
    <div ref={containerRef} className="invitation-experience-root">
      <div dangerouslySetInnerHTML={{ __html: getOriginalHTML() }} />
    </div>
  );
}

function hydrateEventData(root: HTMLElement, event: EventWithSettings, guestName?: string) {
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

  // Couleurs personnalisées
  const primaryColor = event.branding?.primaryColor || '#db2777';
  const accentColor = event.branding?.accentColor || '#be185d';
  const rsvpColor = event.rsvpButtonColor || accentColor || '#ec4899';
  root.style.setProperty('--primary-color', primaryColor);
  root.style.setProperty('--accent-color', accentColor);
  root.style.setProperty('--rsvp-color', rsvpColor);

  // Hero & Couverture (prend en compte heroImage, hero_image, cover_image ou la 1re photo de la galerie)
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
  setText('#welcome-gate-message', event.welcomeMessage || '');
  setText(
    '#welcome-gate-hint',
    event.gateHint || 'Découvrez votre invitation personnelle.'
  );

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

  // Date & Vrai Calendrier dynamique
  if (event.event_date) {
    const d = new Date(event.event_date);
    if (!isNaN(d.getTime())) {
      const dayNum = d.getDate();
      const monthYear = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      setText('#event-day', dayNum.toString().padStart(2, '0'));
      setText('#event-month-year', monthYear);
      setText('#calendar-month-label', monthYear);
      setText('#hero-date-pill', d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
      renderDynamicCalendar(root, d);
    }
  }

  // Heure
  const timeWrap = $('#event-time-badge');
  if (event.event_time) {
    setText('#event-time-range', event.event_time);
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
            pink: '#ec4899',
            purple: '#8b5cf6',
          };
          const dotColor = colors[item.color] || rsvpColor;
          return `
            <div style="display:flex;align-items:flex-start;gap:14px;">
              <div style="display:flex;flex-direction:column;align-items:center;padding-top:3px;">
                <div style="width:11px;height:11px;border-radius:999px;background:${dotColor};box-shadow:0 0 0 4px rgba(236,72,153,0.1);"></div>
                ${i < event.program!.length - 1 ? '<div style="width:1px;height:36px;background:#e5e7eb;margin-top:4px;"></div>' : ''}
              </div>
              <div style="padding-bottom:6px;">
                <p style="font-size:11px;font-weight:600;color:${dotColor};margin-bottom:2px;letter-spacing:0.05em;">${item.time}</p>
                <p style="font-size:14px;font-weight:500;color:#1f2937;">${item.title}</p>
              </div>
            </div>`;
        })
        .join('');
    } else {
      if (programTitleEl) programTitleEl.style.display = 'none';
      programContainer.style.display = 'none';
    }
  }

  // Lieu & Bouton Itinéraire (toujours fonctionnel avec fallback Google Maps Search)
  const venueName = event.venue || event.venueDetails?.title || event.location || 'Lieu de réception';
  const venueAddr = event.venueDetails?.address || event.address || event.location || '';
  setText('#venue-title', venueName);
  setText('#venue-address', venueAddr);

  const customMapImg = event.venueDetails?.mapImage || event.mapImage || '';
  if (customMapImg) {
    setImg('#map-image', customMapImg);
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

  // Section Galerie Photos (Best Photos)
  const gallerySection = $('#section-gallery');
  const showGallery = event.sections?.gallery !== false;
  const uploadedPhotos = (event.bestPhotos || []).filter(Boolean);
  if (gallerySection) {
    if (!showGallery) {
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

  // Section Tenue Vestimentaire (Dress Code)
  const dressSection = $('#section-dress-code');
  const showDress = event.sections?.dressCode !== false;
  if (dressSection) {
    if (!showDress) {
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
              `<img src="${p}" style="width:120px;height:160px;object-fit:cover;border-radius:0.75rem;border:1px solid #e5e7eb;flex-shrink:0;" alt="Tenue">`
          )
          .join('');
        if (dressWrapper) dressWrapper.style.display = 'block';
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
            <div style="width:34px;height:34px;background:#fdf2f8;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg style="width:16px;height:16px;color:${rsvpColor};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="${iconMap[item.icon] || iconMap.car}"/>
              </svg>
            </div>
            <div>
              <p style="font-size:11px;font-weight:700;color:#1f2937;text-transform:uppercase;letter-spacing:0.06em;">${item.title}</p>
              <p style="font-size:12px;color:#6b7280;line-height:1.5;margin-top:2px;">${item.text}</p>
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
}

function renderDynamicCalendar(root: HTMLElement, date: Date) {
  const grid = root.querySelector('#calendar-days-grid') as HTMLElement | null;
  if (!grid) return;

  const year = date.getFullYear();
  const month = date.getMonth();
  const targetDay = date.getDate();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Dim) .. 6 (Sam)
  const leadingEmptyDays = (firstDayOfMonth + 6) % 7; // Lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: string[] = [];
  for (let i = 0; i < leadingEmptyDays; i++) {
    cells.push('<div></div>');
  }
  for (let d = 1; d <= daysInMonth; d++) {
    if (d === targetDay) {
      cells.push(`
        <div id="calendar-event-day" style="padding:5px 0;background:var(--rsvp-color, #ec4899);color:white;border-radius:8px;font-weight:700;box-shadow:0 4px 10px rgba(236,72,153,0.3);position:relative;">
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
      statusEl.textContent = diff > 0 ? 'Compte à rebours avant le grand jour' : "C'est aujourd'hui !";
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

function initRsvp(
  root: HTMLElement,
  slug: string,
  guestToken?: string,
  guestStatus?: GuestStatus
) {
  const note = root.querySelector('#rsvp-status-note') as HTMLElement | null;
  const confirmBtn = root.querySelector('#confirm-presence-btn') as HTMLButtonElement | null;
  const reserveBtn = root.querySelector('#reserve-deadline-btn') as HTMLButtonElement | null;
  const declineBtn = root.querySelector('#decline-presence-btn') as HTMLButtonElement | null;
  const rsvpSection = root.querySelector('#section-rsvp') as HTMLElement | null;
  const localKey = `invitia_rsvp_${slug}`;

  const setNote = (text: string, isConfirmed?: boolean) => {
    if (!note) return;
    note.textContent = text;
    note.style.color = isConfirmed === false ? '#6b7280' : 'var(--rsvp-color, #ec4899)';
  };

  const applyVisualState = (status: 'confirmed' | 'declined') => {
    if (status === 'confirmed') {
      setNote('✓ Votre présence est bien confirmée. Merci !', true);
      if (confirmBtn) {
        confirmBtn.style.opacity = '1';
        const lbl = confirmBtn.querySelector('#confirm-presence-label');
        if (lbl) lbl.textContent = 'Présence confirmée ✓';
      }
      if (reserveBtn) {
        const topLbl = reserveBtn.querySelector('#reserve-deadline-text');
        if (topLbl) topLbl.textContent = 'Présence confirmée ✓';
      }
    } else if (status === 'declined') {
      setNote('Votre réponse (ne pourra pas venir) est bien enregistrée.', false);
    }
  };

  if (guestStatus === 'confirmed' || guestStatus === 'declined') {
    applyVisualState(guestStatus);
  } else {
    try {
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal === 'confirmed' || savedLocal === 'declined') {
        applyVisualState(savedLocal);
      }
    } catch {}
  }

  const respond = async (status: 'confirmed' | 'declined', button: HTMLButtonElement | null) => {
    if (button) button.disabled = true;

    if (guestToken && isSupabaseReady()) {
      const result = await submitGuestRsvp(createClient(), { token: guestToken, status });
      if (button) button.disabled = false;
      if (result.error) {
        setNote(result.error, false);
        return;
      }
    } else {
      if (button) button.disabled = false;
    }

    try {
      localStorage.setItem(localKey, status);
    } catch {}
    applyVisualState(status);
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

  confirmBtn?.addEventListener('click', onConfirm);
  reserveBtn?.addEventListener('click', onReserveTopClick);
  declineBtn?.addEventListener('click', onDecline);

  return () => {
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

function initThemeToggle(root: HTMLElement) {
  const toggle = root.querySelector('#theme-toggle-input') as HTMLInputElement | null;
  const thumb = root.querySelector('.theme-thumb') as HTMLElement | null;
  if (!toggle) return () => {};

  const applyTheme = (isDark: boolean) => {
    toggle.checked = isDark;
    root.classList.toggle('dark-mode-applied', isDark);
    if (thumb) {
      thumb.style.transform = isDark ? 'translateX(16px)' : 'translateX(0)';
      thumb.textContent = isDark ? '☾' : '☀';
    }
  };

  try {
    const saved = localStorage.getItem('invitia_theme') || localStorage.getItem('wedding_theme_mode');
    if (saved === 'dark') {
      applyTheme(true);
    }
  } catch {}

  const onChange = () => {
    const isDark = toggle.checked;
    applyTheme(isDark);
    try {
      localStorage.setItem('invitia_theme', isDark ? 'dark' : 'light');
    } catch {}
  };

  toggle.addEventListener('change', onChange);
  return () => toggle.removeEventListener('change', onChange);
}

function initDrinkMenu(root: HTMLElement, event?: EventWithSettings) {
  const section = root.querySelector('#drink-menu-section') as HTMLElement | null;
  const grid = root.querySelector('#drink-menu-grid') as HTMLElement | null;
  if (!section || !grid) return;

  const defaultDrinks =
    event?.drinks && event.drinks.length > 0
      ? event.drinks
      : [
          { id: 'champagne', name: 'Champagne', desc: 'Fines bulles', emoji: '🥂' },
          { id: 'vin-rouge', name: 'Vin Rouge', desc: 'Sélection du couple', emoji: '🍷' },
          { id: 'vin-blanc', name: 'Vin Blanc', desc: 'Frais & fruité', emoji: '🥂' },
          { id: 'cocktail', name: 'Cocktail', desc: 'Création maison', emoji: '🍹' },
          { id: 'biere', name: 'Bière', desc: 'Artisanale', emoji: '🍺' },
          { id: 'soft', name: 'Soft & Jus', desc: 'Sans alcool', emoji: '🥤' },
        ];

  const selected = new Set<string>();
  const storageKey = `wedding_drink_pick_${event?.slug || 'default'}`;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) JSON.parse(saved).forEach((s: string) => selected.add(s));
  } catch {}

  function render() {
    if (!grid) return;
    grid.innerHTML = defaultDrinks
      .map(
        (d) => `
      <label class="drink-card ${selected.has(d.id) ? 'is-selected' : ''}" data-drink="${d.id}">
        <input type="checkbox" class="drink-card-input" value="${d.id}" ${selected.has(d.id) ? 'checked' : ''}>
        <div class="drink-card-media">
          <div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:2.25rem;background:linear-gradient(135deg,#fdf2f8,#fce7f3);">${d.emoji}</div>
          <span class="drink-card-check">${selected.has(d.id) ? '✓' : ''}</span>
        </div>
        <div class="drink-card-body">
          <span class="drink-card-title">${d.name}</span>
          <span class="drink-card-desc">${d.desc}</span>
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

  const btn = root.querySelector('#music-toggle-btn') as HTMLElement | null;
  const audio = root.querySelector('#background-music') as HTMLAudioElement | null;
  if (!btn || !audio) return () => {};

  const defaultMusic = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  audio.src = event.ambiance.musicUrl || defaultMusic;
  audio.volume = event.ambiance.volume || 0.35;
  audio.loop = true;
  btn.style.display = 'flex';

  function updateBtn() {
    if (!btn || !audio) return;
    const isPlaying = !audio.paused;
    const icon = btn.querySelector('.music-toggle-icon');
    if (icon) icon.textContent = isPlaying ? '♫' : '♪';
    btn.title = isPlaying ? 'Couper la musique' : 'Lancer la musique';
  }

  const onClick = () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    updateBtn();
  };

  btn.addEventListener('click', onClick);
  audio.addEventListener('play', updateBtn);
  audio.addEventListener('pause', updateBtn);
  audio.play().catch(() => {});

  return () => {
    audio.pause();
    btn.removeEventListener('click', onClick);
    audio.removeEventListener('play', updateBtn);
    audio.removeEventListener('pause', updateBtn);
  };
}

function getOriginalCSS(): string {
  return `
    .invitation-experience-root {
      --hero-image-url: url("https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80");
      --welcome-image-url: url("https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80");
      --primary-color: #db2777;
      --accent-color: #be185d;
      --rsvp-color: #ec4899;
      font-family: 'Montserrat', sans-serif;
      background-color: #f4f4f6;
      color: #333;
      -webkit-tap-highlight-color: transparent;
    }
    .invitation-experience-root .font-serif { font-family: 'Playfair Display', serif; }
    .invitation-experience-root .font-cursive { font-family: 'Great Vibes', cursive; }
    .invitation-experience-root .hero-bg {
      background-image: linear-gradient(180deg, rgba(15, 10, 20, 0.45) 0%, rgba(15, 10, 20, 0.78) 100%), var(--hero-image-url);
      background-size: cover;
      background-position: center;
    }
    .invitation-experience-root .welcome-gate-bg {
      background-image: linear-gradient(rgba(2, 6, 23, 0.78), rgba(15, 23, 42, 0.9)), var(--welcome-image-url);
      background-size: cover;
      background-position: center;
    }
    .invitation-experience-root .invitation-card {
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at 88% 8%, rgba(236, 72, 153, 0.08), transparent 42%),
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
    }
    .invitation-experience-root .invitation-card-floral--tl { top: 0.4rem; left: 0.4rem; }
    .invitation-experience-root .invitation-card-floral--br { right: 0.4rem; bottom: 0.4rem; transform: rotate(180deg); }
    .invitation-experience-root .invitation-card-inner {
      position: relative;
      z-index: 1;
      padding: clamp(1.5rem, 5vw, 2rem) clamp(1.2rem, 4.5vw, 1.65rem);
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
      font-size: clamp(2.35rem, 10vw, 3.15rem);
      line-height: 1.05;
      color: #1f2937;
      margin: 0 0 0.85rem;
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
      font-size: clamp(1.95rem, 7.8vw, 2.45rem);
      line-height: 1.1;
    }
    .invitation-experience-root .invite-couple-name--left { color: var(--primary-color, #db2777); }
    .invitation-experience-root .invite-couple-name--right { color: var(--accent-color, #be185d); }
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
      font-size: clamp(0.95rem, 3.8vw, 1.08rem);
      color: #374151;
      margin-bottom: 0.75rem;
    }
    .invitation-experience-root .invite-guest-name { color: #111827; font-weight: 600; }
    .invitation-experience-root .invite-body-text {
      font-size: clamp(0.8125rem, 3.45vw, 0.9375rem);
      line-height: 1.72;
      color: #4b5563;
      margin-bottom: 0.85rem;
    }
    .invitation-experience-root .invitation-rsvp-wrap { margin-top: 1rem; padding: 0 0.15rem; }
    .invitation-experience-root .btn-rsvp {
      background: var(--rsvp-color, linear-gradient(135deg, #ec4899, #f43f5e));
      color: white;
      border: none;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
    }
    .invitation-experience-root .btn-rsvp:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px -6px rgba(236, 72, 153, 0.45);
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
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .invitation-experience-root label.drink-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); }
    .invitation-experience-root label.drink-card.is-selected {
      border-color: var(--rsvp-color, #ec4899);
      box-shadow: 0 0 0 1px rgba(236, 72, 153, 0.25), 0 10px 24px rgba(236, 72, 153, 0.12);
    }
    .invitation-experience-root .drink-card-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; margin: 0; }
    .invitation-experience-root .drink-card-media { position: relative; width: 100%; aspect-ratio: 4 / 3; min-height: 82px; overflow: hidden; background: #f1f5f9; }
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
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 2;
    }
    .invitation-experience-root label.drink-card.is-selected .drink-card-check {
      background: var(--rsvp-color, #ec4899);
      border-color: var(--rsvp-color, #ec4899);
      color: #fff;
    }
    .invitation-experience-root .drink-card-body { padding: 0.6rem 0.65rem 0.7rem; text-align: center; }
    .invitation-experience-root .drink-card-title { display: block; font-size: 0.78rem; font-weight: 600; color: #0f172a; line-height: 1.25; }
    .invitation-experience-root .drink-card-desc { display: block; margin-top: 0.2rem; font-size: 0.62rem; color: #64748b; line-height: 1.35; }

    /* Dark mode */
    .invitation-experience-root.dark-mode-applied { background: #0f172a; color: #e5e7eb; }
    .invitation-experience-root.dark-mode-applied #main-view { background: #111827 !important; }
    .invitation-experience-root.dark-mode-applied .surface-card {
      background: #1f2937 !important;
      border-color: rgba(148, 163, 184, 0.16) !important;
      color: #f3f4f6 !important;
    }
    .invitation-experience-root.dark-mode-applied .invitation-card {
      background:
        radial-gradient(circle at 88% 8%, rgba(244, 114, 182, 0.12), transparent 42%),
        radial-gradient(circle at 12% 92%, rgba(148, 163, 184, 0.08), transparent 40%),
        linear-gradient(168deg, #1e293b 0%, #111827 55%, #0f172a 100%);
      border-color: rgba(148, 163, 184, 0.18);
    }
    .invitation-experience-root.dark-mode-applied .invite-card-title,
    .invitation-experience-root.dark-mode-applied .invite-guest-name { color: #f9fafb; }
    .invitation-experience-root.dark-mode-applied .invite-greeting,
    .invitation-experience-root.dark-mode-applied .invite-body-text { color: #d1d5db; }
  `;
}

function getOriginalHTML(): string {
  return `
    <!-- Audio pour musique d'ambiance -->
    <audio id="background-music" loop preload="auto" style="display:none;"></audio>

    <!-- Outils flottants (Thème & Musique) -->
    <div id="app-floating-tools" style="position:fixed;top:12px;right:12px;z-index:50;display:flex;align-items:center;gap:8px;">
      <label style="cursor:pointer;" title="Mode clair / sombre">
        <input type="checkbox" id="theme-toggle-input" style="display:none;">
        <span style="display:inline-block;width:42px;height:24px;border-radius:999px;background:rgba(255,255,255,0.88);backdrop-filter:blur(8px);border:1px solid rgba(0,0,0,0.08);position:relative;transition:background 0.3s;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
          <span style="position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:999px;background:#1f2937;color:white;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.3s;display:flex;align-items:center;justify-content:center;font-size:10px;" class="theme-thumb">☀</span>
        </span>
      </label>
      <button id="music-toggle-btn" type="button" style="width:34px;height:24px;border-radius:999px;background:#1f2937;color:white;border:none;cursor:pointer;font-size:12px;display:none;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);" title="Musique">
        <span class="music-toggle-icon">♪</span>
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
        <div style="width:22px;height:22px;color:#f9a8d4;margin:4px auto 12px;">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <p id="hero-subtitle" style="font-size:13px;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;opacity:0.92;">Couple</p>
      </header>

      <!-- 2. Carte d'invitation florale -->
      <section style="padding:0 16px;margin-top:-52px;position:relative;z-index:10;">
        <article class="invitation-card invitation-card--floral rounded-2xl text-center" aria-label="Carte d'invitation">
          <div class="invitation-card-floral invitation-card-floral--tl" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none"><path d="M12 58c8-18 26-22 34-38 3-6 2-12-1-16" stroke="#111827" stroke-width="1.3" stroke-linecap="round"/><path d="M18 24c6 4 10 10 10 18 0 8-5 14-12 16" stroke="#111827" stroke-width="1.1" stroke-linecap="round"/><path d="M42 14c-2 8 2 16 8 22" stroke="#111827" stroke-width="1" stroke-linecap="round"/><circle cx="24" cy="34" r="5" stroke="#111827" stroke-width="1"/><circle cx="38" cy="22" r="3.5" fill="#111827"/><circle cx="52" cy="30" r="2.5" fill="#111827"/><path d="M20 48c4 6 10 8 16 6" stroke="#111827" stroke-width="0.9" stroke-linecap="round"/></svg>
          </div>
          <div class="invitation-card-floral invitation-card-floral--br" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none"><path d="M12 58c8-18 26-22 34-38 3-6 2-12-1-16" stroke="#111827" stroke-width="1.3" stroke-linecap="round"/><path d="M18 24c6 4 10 10 10 18 0 8-5 14-12 16" stroke="#111827" stroke-width="1.1" stroke-linecap="round"/><path d="M42 14c-2 8 2 16 8 22" stroke="#111827" stroke-width="1" stroke-linecap="round"/><circle cx="24" cy="34" r="5" stroke="#111827" stroke-width="1"/><circle cx="38" cy="22" r="3.5" fill="#111827"/><circle cx="52" cy="30" r="2.5" fill="#111827"/><path d="M20 48c4 6 10 8 16 6" stroke="#111827" stroke-width="0.9" stroke-linecap="round"/></svg>
          </div>
          <div class="invitation-card-inner">
            <p class="invite-card-overline">Vous êtes cordialement invité(e)</p>
            <h2 class="invite-card-title">Invitation</h2>
            <div id="couple-row-container" class="invite-couple-row">
              <span id="couple-name-left" class="invite-couple-name invite-couple-name--left">Prénom</span>
              <span id="couple-join-badge" class="invite-couple-join">&amp;</span>
              <span id="couple-name-right" class="invite-couple-name invite-couple-name--right">Prénom</span>
            </div>
            <p class="invite-greeting font-serif">Cher/Chère <span id="display-guest-name" class="invite-guest-name">Invité(e)</span>,</p>
            <p id="invite-intro-paragraph" class="invite-body-text"></p>
            <p id="invite-secondary-text" class="invite-body-text" style="display:none;"></p>
            <p id="invite-main-text" class="invite-body-text" style="display:none;"><span id="invitation-main-text"></span></p>
          </div>
        </article>
        <div class="invitation-rsvp-wrap">
          <button id="reserve-deadline-btn" type="button" class="btn-rsvp" style="width:100%;border-radius:14px;padding:15px 18px;box-shadow:0 10px 20px -5px rgba(236,72,153,0.35);min-height:3.25rem;">
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
              <h3 id="about-card-title" class="font-serif text-xl mb-1" style="font-family:'Playfair Display',serif;">Notre histoire</h3>
              <p id="about-toggle-label" style="font-size:11px;color:#e5e7eb;font-weight:400;display:inline-flex;align-items:center;background:rgba(0,0,0,0.35);padding:4px 10px;border-radius:999px;backdrop-filter:blur(4px);">
                Découvrir notre histoire ›
              </p>
            </div>
          </div>
        </div>
        <div id="about-toggle-detail" class="surface-card" style="display:none;background:white;border-radius:16px;margin-top:8px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid #f3f4f6;">
          <p id="about-story-1" style="font-size:13px;color:#4b5563;line-height:1.75;margin-bottom:10px;"></p>
          <p id="about-story-2" style="font-size:13px;color:#4b5563;line-height:1.75;"></p>
        </div>
      </section>

      <!-- 4. Galerie Photos -->
      <section id="section-gallery" style="padding:0 16px;margin-top:24px;">
        <div class="best-photos-shell" style="padding:18px 16px;color:white;">
          <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#c7d2fe;text-align:center;margin-bottom:4px;">Moments d'exception</p>
          <h3 class="font-serif text-xl text-center mb-3" style="font-family:'Playfair Display',serif;">Les plus belles photos</h3>
          <div id="best-photos-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
            <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80" style="height:165px;width:100%;object-fit:cover;border-radius:12px;" alt="Photo 1">
            <img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80" style="height:165px;width:100%;object-fit:cover;border-radius:12px;" alt="Photo 2">
          </div>
          <div class="premium-marquee">
            <div class="premium-marquee-track">
              <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=500&q=80" alt="Souvenir 1">
              <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80" alt="Souvenir 2">
              <img src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=500&q=80" alt="Souvenir 3">
              <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=500&q=80" alt="Souvenir 4">
              <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=500&q=80" alt="Souvenir 1b">
              <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80" alt="Souvenir 2b">
            </div>
          </div>
          <p id="gallery-open-text" style="font-size:10px;color:#c7d2fe;text-align:center;margin-top:10px;cursor:pointer;">Faire défiler les souvenirs ›</p>
        </div>
      </section>

      <!-- 5. Dress Code -->
      <section id="section-dress-code" style="padding:0 16px;margin-top:24px;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:24px;text-align:center;border:1px solid #f3f4f6;">
          <div style="width:40px;height:40px;background:#fdf2f8;border-radius:999px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            <svg style="width:20px;height:20px;color:var(--rsvp-color, #ec4899);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 8l-4-3-2 2h-4l-2-2-4 3v4l2 1v8h12v-8l2-1z"/></svg>
          </div>
          <h3 id="dress-code-title" class="font-serif text-lg mb-1" style="font-family:'Playfair Display',serif;">Tenue élégante</h3>
          <p style="font-size:10px;color:#9ca3af;margin-bottom:14px;text-transform:uppercase;letter-spacing:0.2em;">Code vestimentaire</p>
          <div class="dress-marquee-wrapper">
            <div class="dress-marquee-track">
              <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=500&q=80" alt="Tenue 1">
              <img src="https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=500&q=80" alt="Tenue 2">
              <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80" alt="Tenue 3">
              <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80" alt="Tenue 4">
              <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=500&q=80" alt="Tenue 1b">
              <img src="https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=500&q=80" alt="Tenue 2b">
            </div>
          </div>
        </div>
      </section>

      <!-- 6. Date, Calendrier & Programme -->
      <section style="padding:0 16px;margin-top:24px;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:24px;border:1px solid #f3f4f6;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
            <div>
              <p id="event-day" style="font-size:32px;font-weight:300;color:#1f2937;line-height:1;">30</p>
              <p id="event-month-year" style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.12em;margin-top:4px;">Avril 2026</p>
            </div>
            <div id="event-time-badge" style="background:#f9fafb;padding:8px 14px;border-radius:12px;text-align:center;border:1px solid #f3f4f6;">
              <svg style="width:16px;height:16px;margin:0 auto 4px;color:var(--rsvp-color, #ec4899);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p id="event-time-range" style="font-size:11px;font-weight:600;color:#374151;">19h00</p>
            </div>
          </div>

          <!-- Vrai Calendrier dynamique du mois -->
          <div style="margin-bottom:24px;background:#f9fafb;border-radius:14px;padding:16px;border:1px solid #f3f4f6;">
            <div style="display:flex;justify-content:center;align-items:center;margin-bottom:14px;">
              <span id="calendar-month-label" style="font-weight:700;font-size:11px;color:#374151;text-transform:uppercase;letter-spacing:0.2em;">Avril 2026</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:9px;color:#9ca3af;margin-bottom:8px;font-weight:700;">
              <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
            </div>
            <div id="calendar-days-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:11px;color:#6b7280;"></div>
          </div>

          <p id="program-section-title" style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:18px;text-align:center;">Programme de la journée</p>
          <div id="program-timeline" style="display:flex;flex-direction:column;gap:8px;"></div>
        </div>
      </section>

      <!-- 7. Lieu & Itinéraire -->
      <section style="padding:0 16px;margin-top:24px;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:6px;border:1px solid #f3f4f6;overflow:hidden;">
          <div style="height:11.5rem;position:relative;background:#e5e7eb;border-radius:12px;overflow:hidden;">
            <img id="map-image" src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" style="width:100%;height:100%;object-fit:cover;opacity:0.75;" alt="Lieu">
            <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;pointer-events:none;">
              <div style="width:46px;height:46px;background:white;border-radius:999px;box-shadow:0 10px 20px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;">
                <svg style="width:22px;height:22px;color:var(--rsvp-color, #ec4899);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
            </div>
          </div>
          <div style="padding:18px 16px;text-align:center;">
            <h3 id="venue-title" class="font-serif text-lg mb-1" style="font-family:'Playfair Display',serif;color:#1f2937;">Lieu</h3>
            <p id="venue-address" style="font-size:12px;color:#6b7280;margin-bottom:14px;padding:0 12px;"></p>
            <a id="venue-map-link" href="#" target="_blank" rel="noopener noreferrer" style="display:inline-flex;width:100%;justify-content:center;align-items:center;gap:8px;background:#111827;color:#ffffff;padding:13px 20px;border-radius:12px;font-size:12px;font-weight:600;text-decoration:none;transition:opacity 0.2s;">
              <svg style="width:15px;height:15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
              <span>Ouvrir l'itinéraire sur Google Maps</span>
            </a>
          </div>
        </div>
      </section>

      <!-- 8. Compte à rebours -->
      <section id="section-countdown" style="padding:0 16px;margin-top:24px;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:24px;text-align:center;border:1px solid #f3f4f6;">
          <p id="countdown-status" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:var(--rsvp-color, #ec4899);margin-bottom:16px;min-height:18px;"></p>
          <div style="display:flex;justify-content:center;gap:10px;">
            <div style="text-align:center;width:60px;">
              <div id="days" style="width:100%;height:56px;background:#f9fafb;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:500;color:#1f2937;border:1px solid #f3f4f6;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;">Jours</p>
            </div>
            <div style="text-align:center;width:60px;">
              <div id="hours" style="width:100%;height:56px;background:#f9fafb;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:500;color:#1f2937;border:1px solid #f3f4f6;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;">Heures</p>
            </div>
            <div style="text-align:center;width:60px;">
              <div id="minutes" style="width:100%;height:56px;background:#f9fafb;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:500;color:#1f2937;border:1px solid #f3f4f6;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;">Min</p>
            </div>
            <div style="text-align:center;width:60px;">
              <div id="seconds" style="width:100%;height:56px;background:#fdf2f8;color:var(--rsvp-color, #ec4899);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;border:1px solid #fce7f3;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:6px;text-transform:uppercase;letter-spacing:0.08em;">Sec</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 9. Confirmation de présence (RSVP) -->
      <section id="section-rsvp" style="padding:0 16px;margin-top:24px;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:22px 18px;border:1px solid #f3f4f6;text-align:center;">
          <h3 class="font-serif" style="font-family:'Playfair Display',serif;font-size:20px;color:#1f2937;margin-bottom:4px;">Votre réponse</h3>
          <p id="rsvp-deadline-caption" style="font-size:11px;color:#6b7280;margin-bottom:14px;display:none;"></p>
          <button id="confirm-presence-btn" type="button" class="btn-rsvp" style="width:100%;border-radius:12px;padding:15px;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;">
            <span style="width:26px;height:26px;border-radius:999px;background:rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;">
              <svg style="width:15px;height:15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </span>
            <span id="confirm-presence-label" style="font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;">Confirmer ma présence</span>
          </button>
          <button id="decline-presence-btn" type="button" style="width:100%;margin-top:10px;border-radius:12px;padding:12px;background:#f9fafb;color:#4b5563;border:1px solid #e5e7eb;font-size:12px;font-weight:500;cursor:pointer;">
            Je ne pourrai pas venir
          </button>
          <p id="rsvp-status-note" style="margin-top:10px;text-align:center;font-size:12px;font-weight:600;min-height:1.1rem;"></p>
        </div>
      </section>

      <!-- 10. Menu des boissons -->
      <section id="drink-menu-section" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="drink-menu-shell surface-card" style="border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid #f3f4f6;overflow:hidden;">
          <div style="padding:20px 20px 12px;text-align:center;">
            <div style="width:42px;height:42px;border-radius:999px;background:linear-gradient(135deg,#fce7f3,#fdf2f8);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:1.25rem;">🥂</div>
            <h3 style="font-family:'Playfair Display',serif;font-size:19px;color:#1f2937;margin-bottom:4px;">Préférences de boissons</h3>
            <p style="font-size:11px;color:#6b7280;max-width:320px;margin:0 auto;">Touchez vos préférences pour le jour J (optionnel).</p>
          </div>
          <div id="drink-menu-grid" class="drink-menu-grid" style="padding:0 16px 16px;"></div>
        </div>
      </section>

      <!-- 11. Informations pratiques -->
      <section id="section-practical-info" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:20px;border:1px solid #f3f4f6;">
          <h3 style="font-weight:700;font-size:12px;color:#1f2937;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;text-transform:uppercase;letter-spacing:0.08em;">
            <span id="practical-info-title">Informations pratiques</span>
            <span id="practical-info-count" style="color:#9ca3af;font-size:10px;font-weight:500;"></span>
          </h3>
          <div id="practical-info-list" style="display:flex;flex-direction:column;gap:14px;"></div>
        </div>
      </section>

      <!-- 12. Cadeau / Cagnotte / Contact (affiché uniquement si renseigné) -->
      <section id="section-gift-contact" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="surface-card" style="background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:20px;border:1px solid #f3f4f6;text-align:center;">
          <h3 class="font-serif" style="font-family:'Playfair Display',serif;font-size:18px;color:#1f2937;margin-bottom:6px;">Une attention ou une question ?</h3>
          <p style="font-size:11px;color:#6b7280;margin-bottom:14px;">Retrouvez nos liens directs ci-dessous</p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <a id="gift-donation-link" href="#" target="_blank" rel="noopener noreferrer" style="display:none;width:100%;justify-content:center;align-items:center;gap:8px;background:var(--rsvp-color, #ec4899);color:white;padding:12px 18px;border-radius:12px;font-size:12px;font-weight:600;text-decoration:none;">
              🎁 Accéder à la cagnotte / Liste de cadeaux
            </a>
            <a id="gift-whatsapp-link" href="#" target="_blank" rel="noopener noreferrer" style="display:none;width:100%;justify-content:center;align-items:center;gap:8px;background:#10b981;color:white;padding:12px 18px;border-radius:12px;font-size:12px;font-weight:600;text-decoration:none;">
              💬 Écrire sur WhatsApp
            </a>
            <a id="support-email-link" href="#" style="display:none;width:100%;justify-content:center;align-items:center;gap:8px;background:#f3f4f6;color:#1f2937;padding:12px 18px;border-radius:12px;font-size:12px;font-weight:600;text-decoration:none;">
              ✉️ Nous envoyer un e-mail
            </a>
          </div>
        </div>
      </section>
    </main>
  `;
}
