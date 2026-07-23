'use client';

import { useEffect, useRef } from 'react';
import { EventWithSettings } from '@/types';

/**
 * Ce composant injecte le HTML original du modèle invitation_mariage
 * pour garantir une reproduction pixel-par-pixel.
 * Il charge les CSS et JS originaux et hydrate les données depuis l'événement.
 */
export default function InvitationExperience({ event, guestName }: { event: EventWithSettings; guestName?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const root = containerRef.current;

    // Injecter le CSS original
    const tailwind = document.createElement('link');
    tailwind.rel = 'stylesheet';
    tailwind.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    root.prepend(tailwind);

    // Polices déjà chargées via layout.tsx

    // Injecter le CSS inline du modèle original (reproduit fidèlement)
    const style = document.createElement('style');
    style.textContent = getOriginalCSS();
    root.prepend(style);

    // Hydrater les données dynamiques
    hydrateEventData(root, event, guestName);

    // Initialiser le compte à rebours
    if (event.event_date) initCountdown(event.event_date);

    // Initialiser le thème
    initThemeToggle(root);

    // Initialiser le gate (welcome → main view)
    initGate(root, guestName);

    // Initialiser le menu des boissons
    initDrinkMenu(root, event);

    // Initialiser la musique de fond
    initMusic(root, event);

    return () => {
      style.remove();
      tailwind.remove();
    };
  }, [event, guestName]);

  return (
    <div ref={containerRef} className="invitation-experience-root">
      {/* Le HTML original est rendu ici, fidèlement reproduit */}
      <div dangerouslySetInnerHTML={{ __html: getOriginalHTML() }} />
    </div>
  );
}

function hydrateEventData(root: HTMLElement, event: EventWithSettings, guestName?: string) {
  const $ = (sel: string) => root.querySelector(sel);
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

  // Hero & Gate
  const heroImg = event.hero_image || event.branding?.heroImage || event.cover_image || '';
  const welcomeImg = event.branding?.welcomeImage || '';
  if (heroImg) {
    root.style.setProperty('--hero-image-url', `url('${heroImg}')`);
  }
  if (welcomeImg) {
    root.style.setProperty('--welcome-image-url', `url('${welcomeImg}')`);
  }

  // Titres
  const coupleDisplay = `${event.coupleLeft || event.title} & ${event.coupleRight || ''}`;
  setText('#hero-title', event.title);
  setText('#hero-subtitle', event.subtitle || `${event.coupleLeft || ''} et ${event.coupleRight || ''}`);
  setText('#welcome-gate-title', coupleDisplay);
  setText('#welcome-gate-message', event.welcomeMessage || '');
  setText('#welcome-gate-hint', event.gateHint || 'Veuillez saisir votre nom pour découvrir votre invitation personnelle.');

  // Couple names
  setText('#couple-name-left', event.coupleLeft || event.title);
  setText('#couple-name-right', event.coupleRight || '');
  setText('#invite-couple-display', `${event.coupleLeft || event.title} et ${event.coupleRight || ''}`);

  // Guest name
  if (guestName) {
    setText('#display-guest-name', guestName);
  }

  // Invitation text
  const introText = event.inviteIntro?.replace('{couple}', `${event.coupleLeft || event.title} et ${event.coupleRight || ''}`) || '';
  setText('#invite-intro-paragraph', introText);
  setText('#invite-secondary-text', event.inviteSecondary || '');
  if (event.mainText) {
    setText('#invitation-main-text', event.mainText);
  }

  // Date
  if (event.event_date) {
    const d = new Date(event.event_date);
    setText('#event-day', d.getDate().toString());
    setText('#event-month-year', d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    const eventDayEl = root.querySelector('#calendar-event-day');
    if (eventDayEl) eventDayEl.textContent = d.getDate().toString();
    const calendarLabel = root.querySelector('#calendar-month-label');
    if (calendarLabel) calendarLabel.textContent = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  // Time
  if (event.event_time) {
    setText('#event-time-range', event.event_time);
  }

  // Programme
  const programContainer = root.querySelector('#program-timeline');
  if (programContainer && event.program) {
    programContainer.innerHTML = event.program.map((item, i) => {
      const colors: Record<string, string> = { blue: 'bg-blue-500', green: 'bg-green-500', pink: 'bg-pink-500', purple: 'bg-purple-500' };
      const dotColor = colors[item.color] || 'bg-gray-500';
      return `
        <div class="flex items-start space-x-4">
          <div class="flex flex-col items-center">
            <div class="w-3 h-3 ${dotColor} rounded-full shadow-sm"></div>
            ${i < event.program!.length - 1 ? '<div class="w-px h-10 bg-gray-200"></div>' : ''}
          </div>
          <div>
            <p class="text-[11px] font-medium text-gray-400 mb-0.5">${item.time}</p>
            <p class="text-sm font-medium text-gray-800">${item.title}</p>
          </div>
        </div>`;
    }).join('');
  }

  // Programme title
  if (event.programSectionTitle) {
    setText('#program-section-title', event.programSectionTitle);
  }

  // Venue
  if (event.venue || event.location) {
    setText('#venue-title', event.venue || event.location);
  }
  if (event.venueDetails?.address || event.address) {
    setText('#venue-address', event.venueDetails?.address || event.address || '');
  }
  if (event.venueDetails?.mapImage) {
    setImg('#map-image', event.venueDetails.mapImage);
  }
  if (event.links?.map) {
    setHref('#venue-map-link', event.links.map);
  }

  // RSVP deadline
  if (event.rsvpDeadlineText) {
    setText('#reserve-deadline-text', event.reserveText || 'Confirmer ma présence');
  }

  // Dress code
  if (event.dressCodeTitle) {
    setText('#dress-code-title', event.dressCodeTitle);
  }
  // Injecter les photos de dress code
  if (event.dressImages && event.dressImages.length > 0) {
    const dressTrack = root.querySelector('.dress-marquee-track') as HTMLElement;
    if (dressTrack) {
      const allDress = [...event.dressImages, ...event.dressImages];
      dressTrack.innerHTML = allDress.map(p =>
        `<img src="${p}" style="width:120px;height:160px;object-fit:cover;border-radius:0.75rem;border:1px solid #e5e7eb;flex-shrink:0;" alt="Tenue">`
      ).join('');
    }
  }

  // Practical info
  if (event.practicalSectionTitle) {
    setText('#practical-info-title', event.practicalSectionTitle);
  }
  const infoList = root.querySelector('#practical-info-list');
  if (infoList && event.practicalInfo) {
    const iconMap: Record<string, string> = {
      car: 'M5 17h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2zm0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0m6 0h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2zm0 0a2 2 0 1 0 4 0m-4 0a2 2 0 1 1 4 0',
      bed: 'M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7h18M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2M7 11h10',
      wine: 'M8 22h8M7 2l1 6c0 2.5 2 4 5 4s5-1.5 5-4l1-6H7zM12 14v4',
    };
    infoList.innerHTML = event.practicalInfo.map(item => `
      <div class="flex items-start space-x-3">
        <div class="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="${iconMap[item.icon] || iconMap.car}"/>
          </svg>
        </div>
        <div>
          <p class="text-[11px] font-semibold text-gray-800 uppercase tracking-wider">${item.title}</p>
          <p class="text-[11px] text-gray-500 leading-relaxed">${item.text}</p>
        </div>
      </div>
    `).join('');
    const countEl = root.querySelector('#practical-info-count');
    if (countEl) countEl.textContent = `${event.practicalInfo.length} infos`;
  }

  // Best Photos - injecter les photos uploadées
  if (event.bestPhotos && event.bestPhotos.length > 0) {
    // Remplacer les deux images statiques dans la grille
    const shell = root.querySelector('.best-photos-shell') as HTMLElement;
    if (shell) {
      const staticImgs = shell.querySelectorAll('div[style*="grid-template-columns"] > img');
      const photos = event.bestPhotos.slice(0, Math.min(event.bestPhotos.length, 6));
      staticImgs.forEach((img, i) => {
        if (i < photos.length) (img as HTMLImageElement).src = photos[i];
        else if (i === 0 && photos.length > 0) (img as HTMLImageElement).src = photos[0];
      });
    }
    // Remplacer le marquee
    const marqueeTrack = root.querySelector('.premium-marquee-track') as HTMLElement;
    if (marqueeTrack && event.bestPhotos.length > 0) {
      const all = [...event.bestPhotos, ...event.bestPhotos];
      marqueeTrack.innerHTML = all.map(p =>
        `<img src="${p}" alt="Souvenir" style="width:110px;height:72px;border-radius:.65rem;object-fit:cover;flex-shrink:0;">`
      ).join('');
    }
  }

  // À propos - injecter image et textes
  if (event.aboutImage) {
    setImg('#about-cover-image', event.aboutImage);
  }
  if (event.aboutTitle) {
    setText('#about-card-title', event.aboutTitle);
  }
  if (event.aboutStory1) {
    setText('#about-story-1', event.aboutStory1);
  }
  if (event.aboutStory2) {
    setText('#about-story-2', event.aboutStory2);
  }

  // Support email
  if (event.links?.supportEmail) {
    const el = root.querySelector('#support-email-link') as HTMLAnchorElement;
    if (el) {
      el.href = `mailto:${event.links.supportEmail}`;
      el.textContent = 'Contactez-nous';
    }
  }

  // RSVP modal deadline
  if (event.rsvpDeadlineText) {
    setText('#rsvp-modal-deadline', event.rsvpDeadlineText);
    setText('#gate-rsvp-deadline', event.rsvpDeadlineText);
  }
}

function initCountdown(dateStr: string) {
  if (!dateStr) return;
  const target = new Date(dateStr).getTime();

  function update() {
    const now = Date.now();
    const diff = Math.max(0, target - now);
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    const setVal = (id: string, val: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setVal('days', days.toString().padStart(2, '0'));
    setVal('hours', hours.toString().padStart(2, '0'));
    setVal('minutes', minutes.toString().padStart(2, '0'));
    setVal('seconds', seconds.toString().padStart(2, '0'));

    const statusEl = document.getElementById('countdown-status');
    if (statusEl) {
      statusEl.textContent = diff > 0 ? 'Compte à rebours' : 'C\'est aujourd\'hui !';
    }
  }

  update();
  setInterval(update, 1000);
}

function initGate(root: HTMLElement, guestName?: string) {
  const gate = root.querySelector('#welcome-gate') as HTMLElement;
  const mainView = root.querySelector('#main-view') as HTMLElement;
  const enterBtn = root.querySelector('#gate-enter-btn') as HTMLButtonElement;
  const nameInput = root.querySelector('#gate-guest-name-input') as HTMLInputElement;

  if (!gate || !mainView) return;

  function openMainView() {
    gate.style.opacity = '0';
    gate.style.pointerEvents = 'none';
    setTimeout(() => {
      gate.style.display = 'none';
      mainView.style.display = 'block';
      requestAnimationFrame(() => {
        mainView.style.opacity = '1';
      });
    }, 500);
  }

  // Si déjà un guest name (passé en props), ouvrir directement
  if (guestName) {
    const displayEl = root.querySelector('#display-guest-name');
    if (displayEl) displayEl.textContent = guestName;
    openMainView();
    return;
  }

  // Vérifier le localStorage
  try {
    const stored = localStorage.getItem('invitia_guest_name');
    if (stored) {
      const displayEl = root.querySelector('#display-guest-name');
      if (displayEl) displayEl.textContent = stored;
      openMainView();
      return;
    }
  } catch {}

  // Sinon, gérer le clic sur le bouton
  if (enterBtn && nameInput) {
    enterBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (name) {
        const displayEl = root.querySelector('#display-guest-name');
        if (displayEl) displayEl.textContent = name;
        try { localStorage.setItem('invitia_guest_name', name); } catch {}
        openMainView();
      }
    });

    // Enter key
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') enterBtn.click();
    });
  }
}

function initThemeToggle(root: HTMLElement) {
  const toggle = root.querySelector('#theme-toggle-input') as HTMLInputElement;
  if (!toggle) return;

  // Restaurer le thème sauvegardé
  const saved = localStorage.getItem('invitia_theme') || localStorage.getItem('wedding_theme_mode');
  if (saved === 'dark') {
    toggle.checked = true;
    document.documentElement.classList.add('dark');
    root.classList.add('dark-mode-applied');
  }

  toggle.addEventListener('change', () => {
    const isDark = toggle.checked;
    // Mettre à jour next-themes via le DOM
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    // Mettre à jour le style de l'invitation
    root.classList.toggle('dark-mode-applied', isDark);
    // Persister
    localStorage.setItem('invitia_theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

function initDrinkMenu(root: HTMLElement, event?: EventWithSettings) {
  const section = root.querySelector('#drink-menu-section') as HTMLElement;
  const grid = root.querySelector('#drink-menu-grid') as HTMLElement;
  if (!section || !grid) return;

  // Boissons personnalisées ou par défaut
  const defaultDrinks = (event?.drinks && event.drinks.length > 0)
    ? event.drinks
    : [
        { id: 'champagne', name: 'Champagne', desc: 'Moët & Chandon', emoji: '🥂' },
        { id: 'vin-rouge', name: 'Vin Rouge', desc: 'Bordeaux', emoji: '🍷' },
        { id: 'vin-blanc', name: 'Vin Blanc', desc: 'Chablis', emoji: '🥂' },
        { id: 'cocktail', name: 'Cocktail', desc: 'Spritz', emoji: '🍹' },
        { id: 'biere', name: 'Bière', desc: 'Artisanale', emoji: '🍺' },
        { id: 'soft', name: 'Soft', desc: 'Jus / Eau', emoji: '🥤' },
      ];

  const selected = new Set<string>();
  const storageKey = `wedding_drink_pick_${window.location.pathname}`;

  // Restaurer sélection
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) JSON.parse(saved).forEach((s: string) => selected.add(s));
  } catch {}

  function render() {
    grid.innerHTML = defaultDrinks.map(d => `
      <label class="drink-card ${selected.has(d.id) ? 'is-selected' : ''}" data-drink="${d.id}">
        <input type="checkbox" class="drink-card-input" value="${d.id}" ${selected.has(d.id) ? 'checked' : ''}>
        <div class="drink-card-media">
          <div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:2.5rem;background:linear-gradient(135deg,#fdf2f8,#fce7f3);">${d.emoji}</div>
          <span class="drink-card-check">${selected.has(d.id) ? '✓' : ''}</span>
        </div>
        <div class="drink-card-body">
          <span class="drink-card-title">${d.name}</span>
          <span class="drink-card-desc">${d.desc}</span>
        </div>
      </label>
    `).join('');

    // Bind clicks
    grid.querySelectorAll('.drink-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = (card as HTMLElement).dataset.drink!;
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        try { localStorage.setItem(storageKey, JSON.stringify([...selected])); } catch {}
        render();
      });
    });
  }

  render();
  section.style.display = 'block';
}

function initMusic(root: HTMLElement, event: EventWithSettings) {
  // Si la musique n'est pas activée, ne rien faire
  if (!event.ambiance?.enabled) return;

  const btn = root.querySelector('#music-toggle-btn') as HTMLElement;
  const audio = root.querySelector('#background-music') as HTMLAudioElement;
  if (!btn || !audio) return;

  // Musique par défaut si aucune n'est uploadée (libre de droits)
  const defaultMusic = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  audio.src = event.ambiance.musicUrl || defaultMusic;
  audio.volume = event.ambiance.volume || 0.35;
  audio.loop = true;
  btn.style.display = 'flex';

  let isPlaying = false;

  function updateBtn() {
    isPlaying = !audio.paused;
    const icon = btn.querySelector('.music-toggle-icon');
    if (icon) icon.textContent = isPlaying ? '♫' : '♪';
    btn.title = isPlaying ? 'Couper la musique' : 'Lancer la musique';
  }

  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
    updateBtn();
  });

  // Autoplay après ouverture du gate
  const observer = new MutationObserver(() => {
    const gate = root.querySelector('#welcome-gate') as HTMLElement;
    const mainView = root.querySelector('#main-view') as HTMLElement;
    if (gate?.style.display === 'none' && mainView?.style.display === 'block') {
      audio.play().catch(() => {});
      observer.disconnect();
    }
  });
  const gate = root.querySelector('#welcome-gate');
  if (gate) observer.observe(gate, { attributes: true, attributeFilter: ['style'] });

  audio.addEventListener('play', updateBtn);
  audio.addEventListener('pause', updateBtn);
}

function getOriginalCSS(): string {
  return `
    :root {
      --hero-image-url: url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80');
      --welcome-image-url: url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80');
    }
    .invitation-experience-root { font-family: 'Montserrat', sans-serif; background-color: #f4f4f6; color: #333; -webkit-tap-highlight-color: transparent; }
    .invitation-experience-root .font-serif { font-family: 'Playfair Display', serif; }
    .invitation-experience-root .font-cursive { font-family: 'Great Vibes', cursive; }
    .invitation-experience-root .hero-bg {
      background-image: linear-gradient(rgba(20, 15, 25, 0.6), rgba(20, 15, 25, 0.8)), var(--hero-image-url);
      background-size: cover; background-position: center;
    }
    .invitation-experience-root .welcome-gate-bg {
      background-image: linear-gradient(rgba(2, 6, 23, 0.78), rgba(15, 23, 42, 0.9)), var(--welcome-image-url);
      background-size: cover; background-position: center;
    }
    .invitation-experience-root .glass-card { background: rgba(255, 255, 255, 0.98); box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid rgba(255,255,255,0.8); }
    .invitation-experience-root .invitation-card {
      position: relative; overflow: hidden;
      background: radial-gradient(circle at 88% 8%, rgba(236, 72, 153, 0.08), transparent 42%), radial-gradient(circle at 12% 92%, rgba(15, 23, 42, 0.04), transparent 40%), linear-gradient(168deg, #ffffff 0%, #faf8f6 48%, #f8fafc 100%);
      box-shadow: 0 20px 44px rgba(17, 24, 39, 0.07); border: 1px solid rgba(15, 23, 42, 0.06);
    }
    .invitation-experience-root .invitation-card--floral::before { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 28%); pointer-events: none; z-index: 0; }
    .invitation-experience-root .invitation-card-floral { position: absolute; width: clamp(4.5rem, 18vw, 6.5rem); height: clamp(4.5rem, 18vw, 6.5rem); opacity: 0.11; pointer-events: none; z-index: 0; }
    .invitation-experience-root .invitation-card-floral--tl { top: 0.35rem; left: 0.35rem; }
    .invitation-experience-root .invitation-card-floral--br { right: 0.35rem; bottom: 0.35rem; transform: rotate(180deg); }
    .invitation-experience-root .invitation-card-inner { position: relative; z-index: 1; padding: clamp(1.35rem, 5vw, 1.85rem) clamp(1.1rem, 4.5vw, 1.5rem); }
    .invitation-experience-root .invite-card-overline { font-size: clamp(0.5625rem, 2.6vw, 0.6875rem); letter-spacing: 0.28em; text-transform: uppercase; color: #9ca3af; margin-bottom: 0.35rem; }
    .invitation-experience-root .invite-card-title { font-family: "Great Vibes", cursive; font-size: clamp(2.35rem, 10vw, 3.15rem); line-height: 1.05; color: #1f2937; margin: 0 0 0.85rem; }
    .invitation-experience-root .invite-couple-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.45rem 0.65rem; margin-bottom: 1rem; }
    .invitation-experience-root .invite-couple-name { font-family: "Great Vibes", cursive; font-size: clamp(1.85rem, 7.5vw, 2.35rem); line-height: 1.1; }
    .invitation-experience-root .invite-couple-name--left { color: #db2777; }
    .invitation-experience-root .invite-couple-name--right { color: #2563eb; }
    .invitation-experience-root .invite-couple-join { font-size: clamp(0.5625rem, 2.4vw, 0.625rem); letter-spacing: 0.22em; text-transform: uppercase; color: #9ca3af; padding: 0.2rem 0.55rem; border-radius: 999px; background: rgba(243, 244, 246, 0.95); border: 1px solid rgba(229, 231, 235, 0.9); }
    .invitation-experience-root .invite-greeting { font-size: clamp(0.9375rem, 3.8vw, 1.0625rem); color: #374151; margin-bottom: 0.75rem; }
    .invitation-experience-root .invite-guest-name { color: #111827; font-weight: 600; }
    .invitation-experience-root .invite-body-text { font-size: clamp(0.8125rem, 3.45vw, 0.9375rem); line-height: 1.68; color: #4b5563; margin-bottom: 0.85rem; }
    .invitation-experience-root .invite-emphasis { color: #111827; font-weight: 600; }
    .invitation-experience-root .invitation-rsvp-wrap { margin-top: 1rem; padding: 0 0.15rem; }
    .invitation-experience-root .btn-rsvp { background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; border: none; cursor: pointer; }
    .invitation-experience-root .envelope-seal { width: 3.2rem; height: 3.2rem; border-radius: 999px; background: linear-gradient(145deg, #ec4899, #be185d); color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 18px rgba(190, 24, 93, 0.35); }
    .invitation-experience-root .welcome-envelope-shell {
      position: relative;
      background: linear-gradient(145deg, rgba(255,255,255,0.93) 0%, rgba(253,246,243,0.86) 50%, rgba(255,255,255,0.92) 100%);
      border: 1px solid rgba(236, 72, 153, 0.18);
      box-shadow: 0 24px 48px rgba(31, 41, 55, 0.25);
      overflow: hidden;
    }
    .invitation-experience-root .gate-confirm-btn { border-radius: 9999px !important; }
    .invitation-experience-root .best-photos-shell { border-radius: 1.25rem; background: linear-gradient(135deg, #111827 0%, #1f2937 45%, #312e81 100%); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 22px 45px rgba(17,24,39,0.35); }
    .invitation-experience-root .premium-marquee { overflow: hidden; border-radius: .9rem; }
    .invitation-experience-root .premium-marquee-track { display:flex; gap:.6rem; width:max-content; padding:.65rem; animation: premiumMarquee 24s linear infinite; }
    .invitation-experience-root .premium-marquee-track img { width:110px; height:72px; border-radius:.65rem; object-fit:cover; flex-shrink:0; }
    @keyframes premiumMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .invitation-experience-root .dress-marquee-wrapper { overflow: hidden; border-radius: 0.75rem; background: #f8fafc; border: 1px solid #f1f5f9; }
    .invitation-experience-root .dress-marquee-track { display: flex; width: max-content; gap: 0.75rem; padding: 0.75rem; animation: dressMarquee 20s linear infinite; }
    .invitation-experience-root .dress-marquee-track img { width: 120px; height: 160px; object-fit: cover; border-radius: 0.75rem; border: 1px solid #e5e7eb; flex-shrink: 0; }
    @keyframes dressMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .invitation-experience-root .venue-map-container { position: relative; }
    .invitation-experience-root .venue-map-embed { width: 100%; height: 200px; border: 0; }
    .invitation-experience-root .venue-map-fallback { height: 12rem; position: relative; }

    /* Drink menu */
    .invitation-experience-root .drink-menu-shell { background: linear-gradient(168deg, #ffffff 0%, #fffafb 45%, #f8fafc 100%); }
    .invitation-experience-root .drink-menu-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; width: 100%; }
    .invitation-experience-root label.drink-card { position: relative; display: block; margin: 0; border-radius: 16px; overflow: hidden; border: 2px solid #e2e8f0; background: #fff; cursor: pointer; user-select: none; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
    .invitation-experience-root label.drink-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08); }
    .invitation-experience-root label.drink-card.is-selected { border-color: #ec4899; box-shadow: 0 0 0 1px rgba(236, 72, 153, 0.25), 0 10px 24px rgba(236, 72, 153, 0.12); }
    .invitation-experience-root .drink-card-input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; margin: 0; }
    .invitation-experience-root .drink-card-media { position: relative; width: 100%; aspect-ratio: 4 / 3; min-height: 88px; overflow: hidden; background: #f1f5f9; }
    .invitation-experience-root .drink-card-check { position: absolute; top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 999px; background: rgba(255, 255, 255, 0.92); border: 1px solid #e2e8f0; color: transparent; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; z-index: 2; }
    .invitation-experience-root label.drink-card.is-selected .drink-card-check { background: #ec4899; border-color: #ec4899; color: #fff; }
    .invitation-experience-root .drink-card-body { padding: 0.65rem 0.7rem 0.75rem; text-align: center; }
    .invitation-experience-root .drink-card-title { display: block; font-size: 0.78rem; font-weight: 600; color: #0f172a; line-height: 1.25; }
    .invitation-experience-root .drink-card-desc { display: block; margin-top: 0.2rem; font-size: 0.62rem; color: #64748b; line-height: 1.35; }

    /* Dark mode */
    .invitation-experience-root.dark-mode-applied { background: #0f172a; color: #e5e7eb; }
    .invitation-experience-root.dark-mode-applied #main-view { background: #111827 !important; }
    .invitation-experience-root.dark-mode-applied .bg-white { background: #1f2937 !important; }
    .invitation-experience-root.dark-mode-applied .bg-gray-50 { background: #0f172a !important; }
    .invitation-experience-root.dark-mode-applied .invitation-card {
      background: radial-gradient(circle at 88% 8%, rgba(244, 114, 182, 0.12), transparent 42%), radial-gradient(circle at 12% 92%, rgba(148, 163, 184, 0.08), transparent 40%), linear-gradient(168deg, #1e293b 0%, #111827 55%, #0f172a 100%);
      border-color: rgba(148, 163, 184, 0.18);
    }
  `;
}

function getOriginalHTML(): string {
  return `
    <!-- Audio element pour musique de fond -->
    <audio id="background-music" loop preload="auto" style="display:none;"></audio>

    <!-- Outils flottants -->
    <div id="app-floating-tools" style="position:fixed;top:12px;right:12px;z-index:50;display:flex;align-items:center;gap:8px;">
      <label style="cursor:pointer;" title="Mode clair / sombre">
        <input type="checkbox" id="theme-toggle-input" style="display:none;">
        <span style="display:inline-block;width:40px;height:24px;border-radius:999px;background:#e5e7eb;border:1px solid #d1d5db;position:relative;transition:background 0.3s;">
          <span style="position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:999px;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.2);transition:transform 0.3s;display:flex;align-items:center;justify-content:center;font-size:10px;" class="theme-thumb">☀</span>
        </span>
      </label>
      <button id="music-toggle-btn" type="button" style="width:32px;height:24px;border-radius:999px;background:#1f2937;color:white;border:none;cursor:pointer;font-size:12px;display:none;align-items:center;justify-content:center;" title="Musique">
        <span class="music-toggle-icon">♪</span>
      </button>
    </div>

    <!-- Welcome Gate -->
    <div id="welcome-gate" class="fixed inset-0 z-[100] welcome-gate-bg backdrop-blur-sm flex items-center justify-center px-5 transition-opacity duration-500">
      <div class="w-full max-w-sm welcome-envelope-shell rounded-3xl p-6 text-center" style="position:relative;">
        <div style="position:relative;z-index:10;">
          <div class="envelope-seal mx-auto mb-4">♥</div>
          <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.25em;color:#f472b6;margin-bottom:8px;">Invitation du coeur</p>
          <h1 class="font-serif text-2xl text-gray-800 mb-1" id="welcome-gate-title" style="font-family:'Playfair Display',serif;">Couple</h1>
          <p id="welcome-gate-message" style="font-size:12px;color:#6b7280;margin-bottom:4px;"></p>
          <p id="welcome-gate-hint" style="font-size:12px;color:#9ca3af;margin-bottom:20px;font-style:italic;"></p>
        </div>
        <div id="gate-name-input-container">
          <input id="gate-guest-name-input" type="text" placeholder="Votre nom et prénom" style="width:100%;background:rgba(255,255,255,0.95);border:1px solid #fce7f3;border-radius:12px;padding:12px;font-size:14px;color:#374151;text-align:center;outline:none;margin-bottom:12px;">
          <button id="gate-enter-btn" type="button" class="gate-confirm-btn" style="width:100%;background:linear-gradient(to right,#ec4899,#e11d48);color:white;padding:12px;font-size:12px;font-weight:600;letter-spacing:0.05em;border:none;cursor:pointer;transition:opacity 0.2s;">
            Ouvrir mon invitation
          </button>
        </div>
        <div style="margin-top:16px;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;">
          <span style="font-size:9px;color:#9ca3af;background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:999px;">📸 Photos</span>
          <span style="font-size:9px;color:#9ca3af;background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:999px;">📅 Programme</span>
          <span style="font-size:9px;color:#9ca3af;background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:999px;">📍 GPS</span>
          <span style="font-size:9px;color:#9ca3af;background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:999px;">✓ RSVP</span>
          <span style="font-size:9px;color:#9ca3af;background:rgba(255,255,255,0.1);padding:3px 8px;border-radius:999px;">⏳ Compte à rebours</span>
        </div>
      </div>
    </div>

    <!-- Main View -->
    <main id="main-view" style="max-width:28rem;margin:0 auto;background:#fafafa;min-height:100vh;position:relative;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;padding-bottom:40px;display:none;opacity:0;transition:opacity 0.5s;">

      <!-- 1. Hero -->
      <header class="hero-bg" style="height:60vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;color:white;padding:0 16px;">
        <h1 id="hero-title" class="font-serif text-2xl md:text-3xl mb-3" style="font-family:'Playfair Display',serif;letter-spacing:0.05em;">Titre</h1>
        <div style="width:24px;height:24px;color:#f9a8d4;margin:0 auto 12px;animation:pulse 2s infinite;">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <p id="hero-subtitle" style="font-size:14px;font-weight:300;letter-spacing:0.2em;">Couple</p>
      </header>

      <!-- 2. Invitation Card -->
      <section style="padding:0 16px;margin-top:-48px;position:relative;z-index:10;">
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
            <div class="invite-couple-row">
              <span id="couple-name-left" class="invite-couple-name invite-couple-name--left">Prénom</span>
              <span class="invite-couple-join">et</span>
              <span id="couple-name-right" class="invite-couple-name invite-couple-name--right">Prénom</span>
            </div>
            <p class="invite-greeting font-serif">Cher/Chère <span id="display-guest-name" class="invite-guest-name">Invité(e)</span>,</p>
            <p id="invite-intro-paragraph" class="invite-body-text">Texte d'introduction</p>
            <p id="invite-secondary-text" class="invite-body-text">Texte secondaire</p>
            <p id="invite-main-text" class="invite-body-text"><span id="invitation-main-text"></span></p>
          </div>
        </article>
        <div class="invitation-rsvp-wrap">
          <button id="reserve-deadline-btn" type="button" class="btn-rsvp" style="width:100%;border-radius:12px;padding:16px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);min-height:3.25rem;">
            <span id="reserve-deadline-text" style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;">Confirmer ma présence</span>
          </button>
        </div>
      </section>

      <!-- 3. À propos -->
      <section style="padding:0 16px;margin-top:24px;">
        <div id="about-section-card" style="position:relative;border-radius:16px;overflow:hidden;height:112px;box-shadow:0 1px 2px rgba(0,0,0,0.05);background:#111827;cursor:pointer;" onclick="var d=document.getElementById('about-toggle-detail');if(d)d.style.display=d.style.display==='block'?'none':'block'">
          <img id="about-cover-image" src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Couple" style="width:100%;height:100%;object-fit:cover;opacity:0.6;">
          <div style="position:absolute;inset:0;display:flex;align-items:center;padding:0 24px;">
            <div style="color:white;">
              <h3 id="about-card-title" class="font-serif text-xl mb-1" style="font-family:'Playfair Display',serif;">À propos de nous</h3>
              <p style="font-size:11px;color:#e5e7eb;font-weight:300;display:flex;align-items:center;background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:999px;backdrop-filter:blur(4px);">
                Découvrir notre histoire ›
              </p>
            </div>
          </div>
        </div>
        <div id="about-toggle-detail" style="display:none;background:white;border-radius:16px;margin-top:8px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
          <p id="about-story-1" style="font-size:13px;color:#4b5563;line-height:1.7;margin-bottom:12px;"></p>
          <p id="about-story-2" style="font-size:13px;color:#4b5563;line-height:1.7;"></p>
        </div>
      </section>

      <!-- 4. Best Photos -->
      <section style="padding:0 16px;margin-top:24px;">
        <div class="best-photos-shell" style="padding:16px;color:white;">
          <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#c7d2fe;text-align:center;">Moments d'exception</p>
          <h3 class="font-serif text-2xl text-center mb-3" style="font-family:'Playfair Display',serif;">Les plus belles photos du couple</h3>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:12px;">
            <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80" style="height:160px;width:100%;object-fit:cover;border-radius:12px;" alt="Couple 1">
            <img src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80" style="height:160px;width:100%;object-fit:cover;border-radius:12px;" alt="Couple 2">
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
          <p id="gallery-open-text" style="font-size:10px;color:#c7d2fe;text-align:center;margin-top:12px;cursor:pointer;" onclick="const g=document.querySelector('.best-photos-shell .premium-marquee'); if(g)g.scrollIntoView({behavior:'smooth'});">Touchez ici pour faire défiler les photos ›</p>
        </div>
      </section>

      <!-- 5. Dress Code -->
      <section style="padding:0 16px;margin-top:24px;">
        <div style="background:white;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,0.05);padding:24px;text-align:center;border:1px solid #f9fafb;">
          <div style="width:40px;height:40px;background:#f9fafb;border-radius:999px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            <svg style="width:20px;height:20px;color:#4b5563;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 8l-4-3-2 2h-4l-2-2-4 3v4l2 1v8h12v-8l2-1z"/></svg>
          </div>
          <h3 id="dress-code-title" class="font-serif text-lg mb-1" style="font-family:'Playfair Display',serif;">Tenue élégante</h3>
          <p style="font-size:10px;color:#9ca3af;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.2em;">Couleurs</p>
          <div style="display:flex;justify-content:center;gap:16px;margin-bottom:24px;">
            <div style="width:32px;height:32px;border-radius:999px;background:#f4e1e1;box-shadow:inset 0 2px 4px rgba(0,0,0,0.06);border:1px solid #f3f4f6;"></div>
            <div style="width:32px;height:32px;border-radius:999px;background:#5a2a35;box-shadow:inset 0 2px 4px rgba(0,0,0,0.06);border:1px solid #f3f4f6;"></div>
            <div style="width:32px;height:32px;border-radius:999px;background:#2d3748;box-shadow:inset 0 2px 4px rgba(0,0,0,0.06);border:1px solid #f3f4f6;"></div>
          </div>
          <div class="dress-marquee-wrapper">
            <div class="dress-marquee-track">
              <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=500&q=80" alt="Tenue 1">
              <img src="https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=500&q=80" alt="Tenue 2">
              <img src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80" alt="Tenue 3">
              <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80" alt="Tenue 4">
              <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=500&q=80" alt="Tenue 5">
              <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80" alt="Tenue 6">
              <img src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=500&q=80" alt="Tenue 1b">
              <img src="https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=500&q=80" alt="Tenue 2b">
            </div>
          </div>
        </div>
      </section>

      <!-- 6. Date & Programme -->
      <section style="padding:0 16px;margin-top:24px;">
        <div style="background:white;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,0.05);padding:24px;border:1px solid #f9fafb;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
            <div>
              <p id="event-day" style="font-size:30px;font-weight:300;color:#1f2937;">30</p>
              <p id="event-month-year" style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Avril 2026</p>
            </div>
            <div style="background:#f9fafb;padding:8px 12px;border-radius:12px;text-align:center;border:1px solid #f3f4f6;">
              <svg style="width:16px;height:16px;margin:0 auto 4px;color:#9ca3af;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p id="event-time-range" style="font-size:11px;font-weight:500;color:#4b5563;">19h30 - 23h30</p>
            </div>
          </div>

          <!-- Calendrier -->
          <div style="margin-bottom:32px;background:#f9fafb;border-radius:12px;padding:16px;border:1px solid #f3f4f6;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <span style="color:#d1d5db;">‹</span>
              <span id="calendar-month-label" style="font-weight:600;font-size:11px;color:#4b5563;text-transform:uppercase;letter-spacing:0.2em;">Avril 2026</span>
              <span style="color:#d1d5db;">›</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:9px;color:#9ca3af;margin-bottom:8px;font-weight:600;">
              <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:11px;color:#6b7280;">
              <div></div><div></div>
              <div style="padding:4px 0;">1</div><div style="padding:4px 0;">2</div><div style="padding:4px 0;">3</div><div style="padding:4px 0;">4</div><div style="padding:4px 0;">5</div>
              <div style="padding:4px 0;">6</div><div style="padding:4px 0;">7</div><div style="padding:4px 0;">8</div><div style="padding:4px 0;">9</div><div style="padding:4px 0;">10</div><div style="padding:4px 0;">11</div><div style="padding:4px 0;">12</div>
              <div style="padding:4px 0;">13</div><div style="padding:4px 0;">14</div><div style="padding:4px 0;">15</div><div style="padding:4px 0;">16</div><div style="padding:4px 0;">17</div><div style="padding:4px 0;">18</div><div style="padding:4px 0;">19</div>
              <div style="padding:4px 0;">20</div><div style="padding:4px 0;">21</div><div style="padding:4px 0;">22</div><div style="padding:4px 0;">23</div><div style="padding:4px 0;">24</div><div style="padding:4px 0;">25</div><div style="padding:4px 0;">26</div>
              <div style="padding:4px 0;">27</div><div style="padding:4px 0;">28</div><div style="padding:4px 0;">29</div>
              <div id="calendar-event-day" style="padding:4px 0;background:#1f2937;color:white;border-radius:6px;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,0.1);position:relative;">
                30
                <div style="position:absolute;top:-2px;right:-2px;width:6px;height:6px;background:#ec4899;border-radius:999px;"></div>
              </div>
            </div>
          </div>

          <p id="program-section-title" style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:20px;text-align:center;">Programme de la journée</p>
          <div id="program-timeline" style="display:flex;flex-direction:column;gap:24px;"></div>
        </div>
      </section>

      <!-- 7. Lieu -->
      <section style="padding:0 16px;margin-top:24px;">
        <div style="background:white;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,0.05);padding:4px;border:1px solid #f9fafb;overflow:hidden;">
          <div style="height:12rem;position:relative;background:#e5e7eb;">
            <img id="map-image" src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" style="width:100%;height:100%;object-fit:cover;opacity:0.5;" alt="Carte">
            <div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:center;pointer-events:none;">
              <div style="width:48px;height:48px;background:white;border-radius:999px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;animation:bounce 1s infinite;">
                <svg style="width:24px;height:24px;color:#1f2937;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
            </div>
          </div>
          <div style="padding:20px;text-align:center;">
            <h3 id="venue-title" class="font-serif text-lg mb-1" style="font-family:'Playfair Display',serif;color:#1f2937;">Lieu</h3>
            <p id="venue-address" style="font-size:11px;color:#6b7280;margin-bottom:4px;padding:0 16px;">Adresse</p>
            <a id="venue-map-link" href="#" target="_blank" style="display:inline-flex;width:100%;justify-content:center;align-items:center;gap:8px;background:#f3f4f6;color:#1f2937;padding:12px 24px;border-radius:12px;font-size:12px;font-weight:600;text-decoration:none;transition:background 0.2s;">
              <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
              <span>Obtenir l'itinéraire</span>
            </a>
          </div>
        </div>
      </section>

      <!-- 8. Compte à rebours -->
      <section style="padding:0 16px;margin-top:24px;">
        <div style="background:white;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,0.05);padding:24px;text-align:center;border:1px solid #f9fafb;">
          <svg style="width:24px;height:24px;color:#d1d5db;margin:0 auto 12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L3 5"/><path d="M19 3l2 2"/></svg>
          <p id="countdown-status" style="font-size:14px;font-weight:500;color:#ec4899;margin-bottom:12px;min-height:20px;"></p>
          <div style="display:flex;justify-content:center;gap:12px;margin-bottom:24px;">
            <div style="text-align:center;width:56px;">
              <div id="days" style="width:100%;height:56px;background:#f9fafb;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:300;color:#1f2937;border:1px solid #f3f4f6;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:8px;text-transform:uppercase;">Jours</p>
            </div>
            <div style="text-align:center;width:56px;">
              <div id="hours" style="width:100%;height:56px;background:#f9fafb;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:300;color:#1f2937;border:1px solid #f3f4f6;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:8px;text-transform:uppercase;">H</p>
            </div>
            <div style="text-align:center;width:56px;">
              <div id="minutes" style="width:100%;height:56px;background:#f9fafb;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:300;color:#1f2937;border:1px solid #f3f4f6;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:8px;text-transform:uppercase;">Min</p>
            </div>
            <div style="text-align:center;width:56px;">
              <div id="seconds" style="width:100%;height:56px;background:#fdf2f8;color:#ec4899;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:300;border:1px solid #fce7f3;">00</div>
              <p style="font-size:9px;color:#9ca3af;margin-top:8px;text-transform:uppercase;">Sec</p>
            </div>
          </div>
          <div style="display:flex;justify-content:center;font-size:36px;">🫶</div>
        </div>
      </section>

      <!-- 9. RSVP Button -->
      <section style="padding:0 16px;margin-top:24px;">
        <button id="confirm-presence-btn" type="button" class="btn-rsvp" style="width:100%;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);padding:16px;display:flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;" onclick="var m=encodeURIComponent('Bonjour, je confirme ma présence !');window.open('https://wa.me/?text='+m,'_blank')">
          <span style="width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;">
            <svg style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </span>
          <span style="font-weight:600;font-size:14px;">Confirmer ma présence</span>
        </button>
      </section>

      <!-- 10. Menu des boissons -->
      <section id="drink-menu-section" style="padding:0 16px;margin-top:24px;display:none;">
        <div class="drink-menu-shell" style="border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,0.05);border:1px solid #f3f4f6;overflow:hidden;">
          <div style="padding:20px 20px 12px;text-align:center;">
            <div style="width:44px;height:44px;border-radius:999px;background:linear-gradient(135deg,#fce7f3,#fdf2f8);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:1.25rem;box-shadow:0 4px 14px rgba(236,72,153,0.12);">🥂</div>
            <h3 style="font-family:'Playfair Display',serif;font-size:20px;color:#1f2937;margin-bottom:4px;">Menu des boissons</h3>
            <p style="font-size:11px;color:#6b7280;max-width:320px;margin:0 auto;">Sélectionnez vos préférences pour le jour J (optionnel).</p>
          </div>
          <div id="drink-menu-grid" class="drink-menu-grid" style="padding:0 16px 16px;"></div>
          <p style="font-size:10px;text-align:center;color:#9ca3af;padding:0 16px 16px;border-top:1px dashed #e2e8f0;padding-top:12px;margin-top:4px;">Vos choix seront repris automatiquement lors de la confirmation RSVP.</p>
        </div>
      </section>

      <!-- 11. Practical Info -->
      <section style="padding:0 16px;margin-top:24px;">
        <div style="background:white;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,0.05);padding:16px;border:1px solid #f9fafb;">
          <h3 style="font-weight:600;font-size:12px;color:#1f2937;margin-bottom:16px;padding:0 8px;display:flex;justify-content:space-between;align-items:center;">
            <span id="practical-info-title">Informations pratiques</span>
            <span id="practical-info-count" style="color:#9ca3af;font-size:10px;font-weight:400;">3 infos</span>
          </h3>
          <div id="practical-info-list" style="display:flex;flex-direction:column;gap:16px;"></div>
        </div>
      </section>

      <!-- 11. Help -->
      <section style="padding:0 16px;margin-top:24px;margin-bottom:48px;">
        <div style="background:linear-gradient(135deg, #eef2ff, #f5f3ff);border-radius:16px;padding:24px;text-align:center;">
          <div style="background:white;width:48px;height:48px;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,0.05);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            <svg style="width:24px;height:24px;color:#a5b4fc;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M4.9 4.9l4.2 4.2"/><path d="M14.9 14.9l4.2 4.2"/><path d="M19.1 4.9l-4.2 4.2"/><path d="M9.1 14.9l-4.2 4.2"/></svg>
          </div>
          <h3 style="font-weight:700;font-size:14px;color:#1f2937;margin-bottom:4px;">Besoin d'aide ?</h3>
          <p style="font-size:10px;color:#6b7280;margin-bottom:16px;">Notre équipe est là pour vous assister.</p>
          <div style="font-size:36px;">🫶</div>
        </div>
        <div style="text-align:center;margin-top:24px;padding-bottom:24px;">
          <p style="font-size:10px;color:#9ca3af;">Vous avez aimé cet espace ? <a id="support-email-link" href="#" style="font-weight:700;color:#4b5563;text-decoration:underline;">Contactez-nous</a></p>
        </div>
      </section>
    </main>
  `;
}