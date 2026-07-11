# 🎨 DESIGN SYSTEM — Invitia

Système de design pour une identité cohérente et élégante.

---

## 1. Philosophie Design

> **"Élégance accessible"** — Un design qui inspire confiance sans intimider. Inspiré du luxe africain moderne.

### Principes
1. **Clarté** — Chaque élément a une raison d'être
2. **Élégance** — Espacement généreux, typographie soignée
3. **Chaleur** — Couleurs chaleureuses, touches dorées
4. **Simplicité** — Zéro friction pour l'utilisateur

---

## 2. Palette de Couleurs

### 2.1 Couleurs Primaires

```
┌────────────────────────────────────────────────────────────────┐
│                         COULEURS PRIMAIRES                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   #1A1A2E  ████████  PRIMARY (Noir profond)                   │
│            #1A1A2E  Titres, texte principal                   │
│            Usage: Headings, paragraphs, icons                   │
│                                                                │
│   #D4AF37  ████████  GOLD (Or)                                 │
│            #D4AF37  Accents, CTAs principaux                  │
│            Usage: Buttons, highlights, borders                  │
│                                                                │
│   #FFFFFF  ████████  WHITE                                     │
│            #FFFFFF  Arrière-plans, cartes                       │
│            Usage: Backgrounds, cards, surfaces                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 Couleurs Secondaires

```
┌────────────────────────────────────────────────────────────────┐
│                        COULEURS SECONDAIRES                    │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   #F8F4F0  ████████  CREAM (Ivoire)                           │
│            #F8F4F0  Arrière-plan principal                     │
│            Usage: Page background                              │
│                                                                │
│   #E8E0D8  ████████  SAND (Sable)                              │
│            #E8E0D8  Séparateurs, bordures douces                │
│            Usage: Dividers, borders, input backgrounds         │
│                                                                │
│   #6B5B4F  ████████  EARTH (Terre)                              │
│            #6B5B4F  Texte secondaire, labels                    │
│            Usage: Subtitles, captions, placeholders             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2.3 Couleurs Fonctionnelles

```
┌────────────────────────────────────────────────────────────────┐
│                        STATUS & ACTIONS                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   #2ECC71  ████████  SUCCESS (Vert)                            │
│            #2ECC71  Confirmations, boutons positifs            │
│            Usage: "Je serai présent", success states            │
│                                                                │
│   #E74C3C  ████████  ERROR (Rouge)                             │
│            #E74C3C  Erreurs, boutons négatifs                  │
│            Usage: "Je ne viendrai pas", error messages         │
│                                                                │
│   #F39C12  ████████  WARNING (Orange)                          │
│            #F39C12  Avertissements, en attente                  │
│            Usage: Pending states, alerts                        │
│                                                                │
│   #3498DB  ████████  INFO (Bleu)                               │
│            #3498DB  Informations, liens                        │
│            Usage: Links, info banners, tooltips                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 2.4 Couleurs WhatsApp

```
┌────────────────────────────────────────────────────────────────┐
│                         WHATSAPP                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   #25D366  ████████  WHATSAPP GREEN                           │
│            #25D366  Bouton partage WhatsApp                    │
│            Usage: WhatsApp CTA button                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Typographie

### 3.1 Familles de Police

```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

/* Titres - Élégance */
font-family: 'Playfair Display', Georgia, serif;

/* Corps - Lisibilité */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 3.2 Hiérarchie Typographique

```
┌────────────────────────────────────────────────────────────────┐
│                         H1 - TITRE HERO                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Playfair Display | Bold (700) | 40px / 1.2                   │
│                                                                │
│   Nous avons l'honneur de vous inviter                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                         H2 - SECTION                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Playfair Display | SemiBold (600) | 32px / 1.3               │
│                                                                │
│   Les informations                                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                         H3 - CARD                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Playfair Display | Medium (500) | 24px / 1.4                 │
│                                                                │
│   Mariage de Jean et Marie                                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                      H4 - SOUS-TITRE                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Inter | SemiBold (600) | 18px / 1.5                          │
│                                                                │
│   Samedi 15 Août 2026                                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                         BODY                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Inter | Regular (400) | 16px / 1.6                          │
│                                                                │
│   Rejoignez-nous pour celebrar cet moment unique...           │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                      SMALL - CAPTION                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Inter | Medium (500) | 14px / 1.5                           │
│   Text-transform: uppercase; letter-spacing: 0.5px;           │
│                                                                │
│   SAMEDI 15 AOÛT 2026 • 14H00                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                       BUTTON TEXT                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Inter | SemiBold (600) | 16px / 1                          │
│                                                                │
│   CRÉER MON ÉVÉNEMENT                                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Règles d'Usage

| Contexte | Police | Taille |
|----------|--------|--------|
| Noms d'événements | Playfair Display | 32-40px |
| Texte d'invitation | Playfair Display | 18-24px |
| Corps de texte | Inter | 16px |
| Labels/Buttons | Inter | 14-16px |
| Légendes | Inter | 12-14px |

---

## 4. Espacement

### 4.1 Système de Grille

```
Base: 8px

0px    - 0    (reset)
4px    - 0.5  (xs)
8px    - 1    (sm)
16px   - 2    (md)
24px   - 3    (lg)
32px   - 4    (xl)
48px   - 6    (2xl)
64px   - 8    (3xl)
96px   - 12   (4xl)
128px  - 16   (5xl)
```

### 4.2 Espacement des Composants

```
┌────────────────────────────────────────────────────────────────┐
│                      PADDING STANDARDS                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Inline (boutons, inputs):    12px 16px                       │
│   Card padding:                16px 24px                       │
│   Section padding:             48px 24px                       │
│   Page padding mobile:         16px                            │
│   Page padding desktop:        24px 64px                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                      MARGIN STANDARDS                          │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Entre éléments similaires:    16px                          │
│   Entre sections:               48px                          │
│   Entre heading et contenu:     16px                          │
│   Entre cartes (grid gap):      24px                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 4.3 Container

```
┌────────────────────────────────────────────────────────────────┐
│                         CONTAINER                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Mobile (< 640px):    max-width: 100%  padding: 16px          │
│   Tablet (640-1024px): max-width: 640px  padding: 24px         │
│   Desktop (> 1024px): max-width: 1024px padding: 32px 64px     │
│                                                                │
│   Container centré horizontalement                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Composants UI

### 5.1 Boutons

```
┌────────────────────────────────────────────────────────────────┐
│                      BUTTONS                                   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                                                      │     │
│  │   PRIMARY BUTTON                                    │     │
│  │   Background: #D4AF37                               │     │
│  │   Text: #1A1A2E (SemiBold)                           │     │
│  │   Border-radius: 12px                               │     │
│  │   Padding: 16px 32px                                 │     │
│  │   Hover: brightness(1.1) + translateY(-2px)        │     │
│  │   Active: brightness(0.95) + translateY(0)         │     │
│  │   Shadow: 0 4px 12px rgba(212, 175, 55, 0.3)       │     │
│  │                                                      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                                                      │     │
│  │   SECONDARY BUTTON                                   │     │
│  │   Background: transparent                            │     │
│  │   Text: #1A1A2E (SemiBold)                          │     │
│  │   Border: 2px solid #1A1A2E                          │     │
│  │   Border-radius: 12px                               │     │
│  │   Padding: 14px 30px                                 │     │
│  │   Hover: Background #1A1A2E, Text #FFFFFF            │     │
│  │                                                      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                                                      │     │
│  │   WHATSAPP BUTTON                                    │     │
│  │   Background: #25D366                               │     │
│  │   Text: #FFFFFF (SemiBold)                          │     │
│  │   Border-radius: 12px                               │     │
│  │   Padding: 16px 32px                                 │     │
│  │   Icon: WhatsApp (left)                             │     │
│  │   Hover: brightness(1.1)                            │     │
│  │                                                      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                                                      │     │
│  │   RSVP CONFIRM BUTTON                                │     │
│  │   Background: #2ECC71                               │     │
│  │   Text: #FFFFFF (SemiBold)                          │     │
│  │   Icon: ✓ (left)                                    │     │
│  │                                                      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                                                      │     │
│  │   RSVP DECLINE BUTTON                                │     │
│  │   Background: #E74C3C                               │     │
│  │   Text: #FFFFFF (SemiBold)                          │     │
│  │   Icon: ✗ (left)                                    │     │
│  │                                                      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Tailles de boutons:**
- `sm`: 12px 20px, 14px font
- `md`: 16px 24px, 16px font
- `lg`: 16px 32px, 16px font

### 5.2 Inputs

```
┌────────────────────────────────────────────────────────────────┐
│                      FORM INPUTS                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Default State:                                              │
│   ┌────────────────────────────────────────────────────┐     │
│   │ Label (Inter Medium 14px, #6B5B4F)                  │     │
│   │                                                    │     │
│   │ ┌────────────────────────────────────────────────┐ │     │
│   │ │                                                │ │     │
│   │ │ Placeholder text                               │ │     │
│   │ │                                                │ │     │
│   │ └────────────────────────────────────────────────┘ │     │
│   │                                                    │     │
│   └────────────────────────────────────────────────────┘     │
│                                                                │
│   Input:                                                      │
│   - Background: #FFFFFF                                       │
│   - Border: 1.5px solid #E8E0D8                              │
│   - Border-radius: 12px                                       │
│   - Padding: 14px 16px                                        │
│   - Font: Inter 16px, color #1A1A2E                          │
│                                                                │
│   ─────────────────────────────────────────────────────────   │
│                                                                │
│   Focus State:                                                │
│   - Border: 2px solid #D4AF37                                │
│   - Box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.1)           │
│                                                                │
│   ─────────────────────────────────────────────────────────   │
│                                                                │
│   Error State:                                                │
│   - Border: 2px solid #E74C3C                                │
│   - Message: Inter 14px, color #E74C3C                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 5.3 Cards

```
┌────────────────────────────────────────────────────────────────┐
│                      EVENT CARDS                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Default Card:                                               │
│   ┌─────────────────────────────────────────────────────┐     │
│   │  ┌───────────────────────────────────────────────┐  │     │
│   │  │                                               │  │     │
│   │  │              IMAGE (aspect 16:9)              │  │     │
│   │  │              ou Gradient/Pattern              │  │     │
│   │  │                                               │  │     │
│   │  └───────────────────────────────────────────────┘  │     │
│   │                                                     │     │
│   │   💍  MARIAGE                                      │     │
│   │                                                     │     │
│   │   Mariage de Jean et Marie                         │     │
│   │                                                     │     │
│   │   📅 15 Août 2026                                  │     │
│   │   📍 Kolwezi                                       │     │
│   │                                                     │     │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐             │     │
│   │   │  ✅ 90  │ │  ❌ 20  │ │  👀 150 │             │     │
│   │   └─────────┘ └─────────┘ └─────────┘             │     │
│   │                                                     │     │
│   └─────────────────────────────────────────────────────┘     │
│                                                                │
│   Card Styling:                                               │
│   - Background: #FFFFFF                                       │
│   - Border-radius: 16px                                       │
│   - Shadow: 0 4px 20px rgba(26, 26, 46, 0.08)               │
│   - Overflow: hidden                                          │
│                                                                │
│   Hover:                                                      │
│   - Transform: translateY(-4px)                               │
│   - Shadow: 0 8px 30px rgba(26, 26, 46, 0.12)              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 5.4 Templates d'Invitation

```
┌────────────────────────────────────────────────────────────────┐
│                      TEMPLATE: ÉLÉGANT                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Background: Gradient #1A1A2E → #2D2D44                      │
│                                                                │
│                    ✨ MARIAGE ✨                               │
│                                                                │
│                   ─────────────                               │
│                                                                │
│                    Jean & Marie                               │
│                                                                │
│                   ─────────────                               │
│                                                                │
│              Nous avons l'honneur                             │
│               de vous inviter à                                │
│            célébrer notre union                                │
│                                                                │
│              📅 Samedi 15 Août 2026                            │
│              🕐 à 14 heures                                    │
│                                                                │
│              📍 Salle des Fêtes                               │
│                 Kolwezi, RDC                                  │
│                                                                │
│              [Voir sur Google Maps]                           │
│                                                                │
│                   ─────────────                               │
│                                                                │
│     [ ✅ Je serai présent ]  [ ❌ Je ne viendrai pas ]        │
│                                                                │
│   Text color: #FFFFFF ou #D4AF37                              │
│   Font: Playfair Display                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                      TEMPLATE: MODERNE                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Background: #FFFFFF avec accents géométriques               │
│                                                                │
│   ┌──────────┐                              ┌──────────┐      │
│   │    ◆◆◆   │                              │   ◆◆◆    │      │
│   └──────────┘                              └──────────┘      │
│                                                                │
│                    MARIAGE                                     │
│                                                                │
│                     Jean                                        │
│                   &                                            │
│                    Marie                                       │
│                                                                │
│              ─────────────────                                │
│                                                                │
│              15 AOÛT 2026                                      │
│              14H00                                             │
│              SALLE DES FÊTES, KOLWEZI                          │
│                                                                │
│   [ ✅ Je serai présent ]  [ ❌ Je ne viendrai pas ]        │
│                                                                │
│   Text color: #1A1A2E, accents #D4AF37                        │
│   Font: Inter (headings Playfair Display)                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Icônes

### 6.1 Source
**Phosphor Icons** (licence MIT, cohérent, complet)

```
https://phosphoricons.com/
```

### 6.2 Usage
- Import SVG inline ou via composant
- Taille standard: 24px
- Stroke-width: 1.5px
- Couleur: inherit (hérite du parent)

### 6.3 Icônes Principales

```
Navigation:     ← → ↑ ↓          chevron-left, chevron-right
                ↩                arrow-counter-clockwise
                
Événement:      🎉                party-popper
                💍                heart
                🎂                birthday-cake
                👶                baby
                🎓                graduation-cap
                
Temps:          📅                calendar
                🕐                clock
                
Lieu:           📍                map-pin
                🗺️               map
                
Utilisateur:    👤                user
                👥                users
                
Actions:        ✏️                pencil-simple
                🗑️                trash
                👁                eye
                📋                clipboard
                🔗                link
                
Social:         💬                chat-circle
                📤                share-network
                
Statut:         ✅                check
                ❌                x
                ⏳                hourglass
                
Divers:         📷                camera
                🌟                star
                ✨                sparkle
```

---

## 7. États et Animations

### 7.1 États des Composants

```
┌────────────────────────────────────────────────────────────────┐
│                      ÉTATS STANDARDS                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Default → Hover → Active → Disabled → Loading               │
│                                                                │
│   Default:    État normal                                      │
│   Hover:      Survol utilisateur (cursor: pointer)           │
│   Active:     Clic enfoncé                                    │
│   Disabled:   Non interactif (opacity: 0.5)                   │
│   Loading:    En cours (spinner ou skeleton)                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 Animations

```
┌────────────────────────────────────────────────────────────────┐
│                      TRANSITIONS & ANIMATIONS                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Timing:                                                     │
│   - Micro (bouton hover):     150ms ease-out                  │
│   - Standard (cards):         250ms ease-out                  │
│   - Complex (modals):         300ms ease-in-out               │
│                                                                │
│   Hover Effects:                                                 │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Buttons: transform translateY(-2px)                  │   │
│   │ Cards:    transform translateY(-4px) + shadow        │   │
│   │ Links:    color shift to gold                        │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                                │
│   Page Transitions:                                            │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Fade + slide up: opacity 0→1, translateY 20→0       │   │
│   │ Duration: 300ms                                       │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                                │
│   Skeleton Loading:                                            │
│   ┌──────────────────────────────────────────────────────┐   │
│   │ Background: gradient shimmer left → right            │   │
│   │ Duration: 1.5s infinite                              │   │
│   │ Color: #E8E0D8 → #F8F4F0 → #E8E0D8                    │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 7.3 Feedback Toast

```
┌────────────────────────────────────────────────────────────────┐
│                         TOAST                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Position: bottom-center, 24px from bottom                   │
│   Background: #1A1A2E (dark)                                  │
│   Text: #FFFFFF                                               │
│   Border-radius: 12px                                         │
│   Padding: 16px 24px                                           │
│   Shadow: 0 8px 30px rgba(0,0,0,0.2)                          │
│   Duration: 4 seconds auto-dismiss                            │
│                                                                │
│   Success: icône ✓ verte                                      │
│   Error:   icône ✗ rouge                                      │
│   Info:    icône ⓘ bleue                                      │
│                                                                │
│   Animation: slide-up + fade-in                               │
│   Dismiss: slide-down + fade-out                              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 8. Responsive Breakpoints

```
┌────────────────────────────────────────────────────────────────┐
│                      BREAKPOINTS                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Mobile first approach:                                       │
│                                                                │
│   sm:  640px   ─ Tablet portrait                              │
│   md:  768px   ─ Tablet landscape                             │
│   lg:  1024px  ─ Desktop                                      │
│   xl:  1280px  ─ Large desktop                                │
│                                                                │
│   Usage:                                                       │
│   @media (min-width: 640px) { ... }                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Adaptations Mobile → Desktop

| Élément | Mobile | Desktop |
|---------|--------|---------|
| Grid colonnes | 1 | 2-3 |
| Padding page | 16px | 32-64px |
| Taille boutons | Full width | Auto |
| Navigation | Bottom ou hamburger | Sidebar ou top |
| Images | Optimisées, lazy | Preload hero |

---

## 9. Accessibilité

### 9.1 Contraste

```
Rapport minimum 4.5:1 pour le texte normal
Rapport minimum 3:1 pour le texte large

✓ #1A1A2E sur #FFFFFF = 16.1:1
✓ #D4AF37 sur #1A1A2E = 7.2:1
✓ #6B5B4F sur #FFFFFF = 6.2:1
```

### 9.2 Focus States

```
Tous les éléments interactifs doivent avoir:
- Outline: 2px solid #D4AF37
- outline-offset: 2px
- visible sur :focus-visible
```

### 9.3 Aria Labels

```
Inputs:        <input aria-label="Nom de l'événement" ...>
Buttons:       <button aria-label="Fermer le modal" ...>
Images:        <img alt="Photo de couple" ...>
Decorative:    aria-hidden="true"
```

---

*Design System — Invitia v1.0*
