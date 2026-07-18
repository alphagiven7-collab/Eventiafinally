// ============================================
// INVITIA - Types
// ============================================

// Event Types
export type EventType = 'wedding' | 'birthday' | 'baby_shower' | 'graduation' | 'corporate';

// Event Status
export type EventStatus = 'draft' | 'pending_review' | 'approved' | 'live' | 'archived';

// RSVP Status
export type RsvpStatus = 'pending' | 'confirmed' | 'declined';

// Guest Status
export type GuestStatus = 'pending' | 'confirmed' | 'declined';

// User Role
export type UserRole = 'organizer' | 'super_admin' | 'staff';

// ============================================
// Core Entities
// ============================================

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  type: EventType;
  event_date: string;
  event_time?: string;
  location: string;
  address?: string;
  lat?: string;
  lng?: string;
  description?: string;
  cover_image?: string;
  hero_image?: string;
  welcome_image?: string;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  phone?: string;
  email?: string;
  group?: string;
  status: GuestStatus;
  adults: number;
  children: number;
  table_number?: string;
  message?: string;
  token: string;
  created_at: string;
  updated_at: string;
}

export interface RSVP {
  id: string;
  guest_id: string;
  event_id: string;
  status: RsvpStatus;
  adults: number;
  children: number;
  message?: string;
  responded_at: string;
}

export interface CheckIn {
  id: string;
  guest_id: string;
  event_id: string;
  staff_name?: string;
  checked_in_at: string;
  table_number?: string;
  notes?: string;
}

// ============================================
// Event Customization (from invitation.html)
// ============================================

export interface VenueDetails {
  title: string;
  address: string;
  lat: string;
  lng: string;
  mapImage: string;
}

export interface ProgramItem {
  time: string;
  title: string;
  color: string;
}

export interface PracticalInfoItem {
  icon: string;
  title: string;
  text: string;
}

export interface Branding {
  primaryColor: string;
  accentColor: string;
  welcomeImage: string;
  heroImage: string;
  ogShareImage: string;
}

export interface EventSections {
  quiz: boolean;
  donation: boolean;
  guestbook: boolean;
  gallery: boolean;
  countdown: boolean;
  dressCode: boolean;
}

export interface EventLinks {
  donation?: string;
  whatsappDonation?: string;
  donationWhatsAppMessage?: string;
  supportEmail?: string;
  map?: string;
}

export interface Ambiance {
  musicUrl: string;
  volume: number;
  enabled: boolean;
}

// Complete Event with customization (from JSON files)
export interface EventWithSettings extends Event {
    identityRevision?: number;
    welcomeMessage?: string;
    gateHint?: string;
    inviteIntro?: string;
    inviteSecondary?: string;
    reserveText?: string;
    rsvpDeadlineText?: string;
    rsvpButtonColor?: string;
    metaDescription?: string;
    aboutTitle?: string;
    aboutStory1?: string;
    aboutStory2?: string;
    aboutImage?: string;
    mainText?: string;
    programSectionTitle?: string;
    program?: ProgramItem[];
    practicalSectionTitle?: string;
    practicalInfo?: PracticalInfoItem[];
    rsvpDeadline?: string;
    branding?: Branding;
    sections?: EventSections;
    adminCode?: string;
    links?: EventLinks;
    dressCodeTitle?: string;
    dressImages?: string[];
    ambiance?: Ambiance;
    venue?: string;
    venueDetails?: VenueDetails;
    mapLink?: string;
    mapImage?: string;
    venueTitle?: string;
    welcomeImage?: string;
    heroImage?: string;
    bestPhotos?: string[];
    whatsappDonationPhone?: string;
    supportEmail?: string;
    address?: string;
    coupleLeft?: string;
    coupleRight?: string;
  }

export interface EventSettings {
  id: string;
  event_id: string;
  settings: Record<string, any>;
  updated_at: string;
}

// ============================================
// Form Types
// ============================================

export interface EventInput {
  title: string;
  subtitle?: string;
  eventType: EventType;
  eventDate: string;
  eventTime?: string;
  location: string;
  address?: string;
  description?: string;
  coverImage?: string;
  heroImage?: string;
  welcomeImage?: string;
}

export interface GuestInput {
  name: string;
  phone?: string;
  email?: string;
  group?: string;
  adults: number;
  children: number;
}

export interface RSVPInput {
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  adults: number;
  children: number;
  message?: string;
  status: RsvpStatus;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Component Props Types
// ============================================

export interface CountdownProps {
  targetDate: string;
  onComplete?: () => void;
}

export interface GuestGateProps {
  event: EventWithSettings;
  onOpen: (guestName: string) => void;
}

export interface RsvpFormProps {
  eventId: string;
  onSubmit: (data: RSVPInput) => void;
  isOpen: boolean;
  onClose: () => void;
}

export interface PhotoGalleryProps {
  images: string[];
  title?: string;
}

export interface MusicPlayerProps {
  url: string;
  volume: number;
  autoPlay?: boolean;
}

// ============================================
// Utility Types
// ============================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type CreateEventData = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'view_count'>;
export type UpdateEventData = Partial<CreateEventData>;

export type CreateGuestData = Omit<Guest, 'id' | 'created_at' | 'updated_at' | 'token'>;
export type UpdateGuestData = Partial<CreateGuestData>;