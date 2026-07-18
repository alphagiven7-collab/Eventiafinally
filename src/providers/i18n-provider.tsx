'use client';

import { ReactNode } from 'react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

// Données inline pour éviter les problèmes d'import JSON
const fr = {
  common: { appName: 'Invitia', loading: 'Chargement...', save: 'Sauvegarder', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier', close: 'Fermer' },
  home: { heroTitle: "Tu stresses pour ton événement ?", heroSubtitle: "On a créé Invitia pour toi.", ctaCreate: 'Créer mon invitation gratuite', ctaDemo: 'Voir une démo' },
  invitation: { welcomeTitle: 'Vous êtes cordialement invité(e)', rsvpButton: 'Confirmer ma présence' },
  admin: { guests: 'Invités', total: 'Total', confirmed: 'Confirmés', declined: 'Déclinés', pending: 'En attente' },
  checkin: { title: 'Check-in des invités', scan: 'Scanner QR', manual: 'Saisie manuelle', validate: 'Valider la présence' },
};

const en = {
  common: { appName: 'Invitia', loading: 'Loading...', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', close: 'Close' },
  home: { heroTitle: 'Stressed about your event?', heroSubtitle: 'We built Invitia for you.', ctaCreate: 'Create my free invitation', ctaDemo: 'View a demo' },
  invitation: { welcomeTitle: 'You are cordially invited', rsvpButton: 'Confirm attendance' },
  admin: { guests: 'Guests', total: 'Total', confirmed: 'Confirmed', declined: 'Declined', pending: 'Pending' },
  checkin: { title: 'Guest Check-in', scan: 'Scan QR', manual: 'Manual entry', validate: 'Validate presence' },
};

// Initialisation unique
let initialized = false;

if (!initialized) {
  i18next.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });
  initialized = true;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}