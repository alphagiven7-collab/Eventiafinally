import { EventWithSettings } from '@/types';

// Données des événements - importées directement sans fetch
// Garantit le fonctionnement sur iPhone 7 et Safari iOS

const yanickKeren: EventWithSettings = {
  id: 'yanick-keren',
  slug: 'yanick-keren',
  type: 'wedding',
  identityRevision: 2,
  title: 'Mariage de Josue et Divine',
  subtitle: 'Josue et Divine',
  coupleLeft: 'Divine',
  coupleRight: 'Josue',
  welcomeMessage: 'Avec amour, nous vous ouvrons cette enveloppe de bonheur.',
  gateHint: 'Veuillez saisir votre nom pour découvrir votre invitation personnelle.',
  inviteIntro: "C'est avec une grande joie que {couple} vous invitent à célébrer leur mariage.",
  inviteSecondary: "Ils seraient honorés de vous compter parmi leurs invités pour célébrer cette union sacrée et partager le bonheur de leur engagement.",
  reserveText: 'Confirmer ma présence',
  rsvpDeadlineText: 'Merci de confirmer avant le 25 avril 2026',
  rsvpButtonColor: '#ec4899',
  metaDescription: 'Invitation officielle au mariage de Josue et Divine.',
  aboutTitle: 'Notre Histoire',
  mainText: 'La cérémonie, suivie d\'une réception, se tiendra le jeudi 30 avril 2026 à partir de 19h30 au Sultani River.',
  event_date: '2026-04-30T19:30:00',
  venue: 'Sultani River',
  venueDetails: {
    title: 'Sultani River',
    address: '32, avenue de la Justice (Gombe), Kinshasa, RDC',
    lat: '-4.3215',
    lng: '15.3128',
    mapImage: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  programSectionTitle: 'Programme de la journée',
  program: [
    { time: '19h30 - 20h00', title: 'Arrivée des invités', color: 'blue' },
    { time: '20h00 - 20h30', title: 'Emplacements', color: 'green' },
    { time: '20h30 - 21h00', title: 'Entrée des mariés', color: 'pink' },
    { time: '21h00 - 23h30', title: 'Danses et spectacles', color: 'purple' }
  ],
  practicalSectionTitle: 'Informations pratiques',
  practicalInfo: [
    { icon: 'car', title: 'PARKING', text: 'Le parking est disponible, disposant de 200 places.' },
    { icon: 'bed', title: 'HÉBERGEMENT', text: 'Hôtel le Pullman à 5 min — réservation recommandée.' },
    { icon: 'wine', title: 'BOÎTE À BOISSON', text: 'Merci de ne pas apporter de boisson de l\'extérieur.' }
  ],
  rsvpDeadline: '2026-04-25',
  branding: {
    primaryColor: '#4caf50',
    accentColor: '#ec4899',
    welcomeImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    heroImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    ogShareImage: 'https://alphagiven7-collab.github.io/invitation_mariage/assets/images/michelline-hero-envelopes.png'
  },
  sections: {
    quiz: true,
    donation: true,
    guestbook: true,
    gallery: true,
    countdown: true,
    dressCode: true
  },
  adminCode: 'YANICK-CLIENT-2026',
  links: {
    donation: 'https://www.paypal.com',
    whatsappDonation: '243900000000',
    donationWhatsAppMessage: 'Bonjour {couple}, je souhaite vous faire un don pour votre mariage. Merci de me communiquer les modalités.',
    supportEmail: 'contact@josue-divine.com',
    map: 'https://maps.google.com/?q=Sultani+River+Kinshasa'
  },
  dressCodeTitle: 'Tenue élégante',
  location: 'Sultani River',
  is_published: true,
  view_count: 0,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  ambiance: {
    musicUrl: '',
    volume: 0.35,
    enabled: true
  }
};

const anniversaireGrace: EventWithSettings = {
  id: 'anniversaire-grace',
  slug: 'anniversaire-grace',
  type: 'birthday',
  identityRevision: 1,
  title: 'Anniversaire de Grace',
  subtitle: 'Grace',
  coupleLeft: '',
  coupleRight: '',
  welcomeMessage: 'Rejoignez-nous pour célébrer Grace !',
  gateHint: 'Entrez votre nom pour accéder à l\'invitation',
  inviteIntro: 'Venez fêter l\'anniversaire de {couple} avec nous !',
  inviteSecondary: 'Une journée de joie et de célébration vous attend.',
  reserveText: 'Confirmer ma présence',
  rsvpDeadlineText: 'Merci de confirmer avant le 15 mai 2026',
  rsvpButtonColor: '#ec4899',
  metaDescription: 'Invitation anniversaire de Grace',
  aboutTitle: 'À propos',
  mainText: 'Nous célébrons l\'anniversaire de Grace le 15 mai 2026.',
  event_date: '2026-05-15T14:00:00',
  venue: 'Maison familiale',
  venueDetails: {
    title: 'Maison familiale',
    address: 'Kinshasa, RDC',
    lat: '-4.3215',
    lng: '15.3128',
    mapImage: ''
  },
  programSectionTitle: 'Programme',
  program: [
    { time: '14h00', title: 'Arrivée', color: 'blue' },
    { time: '15h00', title: 'Gâteau', color: 'pink' },
    { time: '16h00', title: 'Cadeaux', color: 'green' }
  ],
  practicalSectionTitle: 'Infos pratiques',
  practicalInfo: [
    { icon: 'car', title: 'PARKING', text: 'Parking disponible sur place.' }
  ],
  rsvpDeadline: '2026-05-10',
  branding: {
    primaryColor: '#ec4899',
    accentColor: '#f59e0b',
    welcomeImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    heroImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    ogShareImage: ''
  },
  sections: {
    quiz: false,
    donation: false,
    guestbook: true,
    gallery: true,
    countdown: true,
    dressCode: false
  },
  adminCode: 'GRACE-2026',
  links: {
    donation: '',
    whatsappDonation: '',
    donationWhatsAppMessage: '',
    supportEmail: 'contact@grace-anniversaire.com',
    map: ''
  },
  dressCodeTitle: '',
  location: 'Maison familiale',
  is_published: true,
  view_count: 0,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  ambiance: {
    musicUrl: '',
    volume: 0.35,
    enabled: false
  }
};

const conferenceTech: EventWithSettings = {
  id: 'conference-tech-2026',
  slug: 'conference-tech-2026',
  type: 'corporate',
  identityRevision: 1,
  title: 'Conférence Tech 2026',
  subtitle: 'Tech Conference',
  coupleLeft: '',
  coupleRight: '',
  welcomeMessage: 'Bienvenue à la Conférence Tech 2026',
  gateHint: 'Entrez votre nom pour accéder à l\'événement',
  inviteIntro: 'Rejoignez-nous pour la plus grande conférence tech de l\'année !',
  inviteSecondary: 'Networkez avec les meilleurs experts du domaine.',
  reserveText: 'S\'inscrire',
  rsvpDeadlineText: 'Inscription avant le 1er juin 2026',
  rsvpButtonColor: '#3b82f6',
  metaDescription: 'Conférence Tech 2026 - Kinshasa',
  aboutTitle: 'À propos de la conférence',
  mainText: 'La conférence Tech 2026 rassemble les experts et passionnés de technologie.',
  event_date: '2026-06-15T09:00:00',
  venue: 'Centre de conférence',
  venueDetails: {
    title: 'Centre de conférence',
    address: 'Kinshasa, RDC',
    lat: '-4.3215',
    lng: '15.3128',
    mapImage: ''
  },
  programSectionTitle: 'Programme',
  program: [
    { time: '09h00', title: 'Accueil', color: 'blue' },
    { time: '10h00', title: 'Keynote', color: 'purple' },
    { time: '12h00', title: 'Networking', color: 'green' }
  ],
  practicalSectionTitle: 'Informations pratiques',
  practicalInfo: [
    { icon: 'car', title: 'PARKING', text: 'Parking gratuit disponible.' }
  ],
  rsvpDeadline: '2026-06-01',
  branding: {
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
    welcomeImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    heroImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    ogShareImage: ''
  },
  sections: {
    quiz: false,
    donation: false,
    guestbook: false,
    gallery: false,
    countdown: true,
    dressCode: false
  },
  adminCode: 'TECH-2026',
  links: {
    donation: '',
    whatsappDonation: '',
    donationWhatsAppMessage: '',
    supportEmail: 'contact@tech-conf.com',
    map: ''
  },
  dressCodeTitle: '',
  location: 'Centre de conférence',
  is_published: true,
  view_count: 0,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  ambiance: {
    musicUrl: '',
    volume: 0.35,
    enabled: false
  }
};

export const events: Record<string, EventWithSettings> = {
  'yanick-keren': yanickKeren,
  'anniversaire-grace': anniversaireGrace,
  'conference-tech-2026': conferenceTech,
};

export function getEventBySlug(slug: string): EventWithSettings | null {
  return events[slug] || null;
}

export function getAllEvents(): EventWithSettings[] {
  return Object.values(events);
}