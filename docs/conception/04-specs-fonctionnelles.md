# 📋 SPÉCIFICATIONS FONCTIONNELLES — Invitia

Détail complet des fonctionnalités MVP.

---

## F1: Création d'Événement

### 1.1 Description
Permettre à un utilisateur de créer un nouvel événement en remplissant un formulaire structuré.

### 1.2 Champs du formulaire

| Champ | Type | Obligatoire | Validation | Description |
|-------|------|-------------|------------|-------------|
| `title` | text | ✅ | 3-100 caractères | Nom de l'événement |
| `eventType` | select | ✅ | Enum | wedding, birthday, baby_shower, graduation |
| `eventDate` | date | ✅ | ≥ Aujourd'hui | Date de l'événement |
| `eventTime` | time | ❌ | Format HH:mm | Heure de début |
| `location` | text | ✅ | 3-200 caractères | Lieu en texte |
| `description` | textarea | ❌ | Max 1000 caractères | Description/_MESSAGE |
| `coverImage` | file | ❌ | JPG/PNG/WebP, max 5MB | Photo de couverture |

### 1.3 Règles fonctionnelles

1. **Slug automatique**: Généré depuis le titre (ex: "Mariage de Jean" → `mariage-de-jean-abc123`)
2. **Sauvegarde automatique**: Toutes les 30 secondes en brouillon
3. **États possibles**: `draft` (brouillon), `published` (publié)

### 1.4 Comportements

| Action | Comportement |
|--------|--------------|
| Changement de type | Réinitialise le template si incompatible |
| Upload image | Affiche preview immédiate, compresse côté client |
| Soumission | Validation → Création slug unique → Sauvegarde → Redirect preview |

### 1.5 Gestion d'erreurs

| Erreur | Message utilisateur |
|--------|---------------------|
| Titre vide | "Le nom de l'événement est requis" |
| Date passée | "La date doit être dans le futur" |
| Lieu vide | "Le lieu est requis" |
| Image trop grande | "L'image ne doit pas dépasser 5 Mo" |
| Type de fichier invalide | "Formats acceptés: JPG, PNG, WebP" |

---

## F2: Sélection de Template

### 2.1 Description
Permettre à l'utilisateur de choisir un modèle visuel pour son invitation parmi 5 templates prédéfinis.

### 2.2 Templates disponibles (MVP)

| ID | Nom | Catégorie | Adapté pour |
|----|-----|-----------|-------------|
| `elegant` | ÉLÉGANT | classic | Mariages, diplômes |
| `modern` | MODERNE | contemporary | Anniversaires, baby showers |
| `floral` | FLORAL | nature | Mariages, baby showers |
| `nature` | NATURE | minimal | Tous类型 |
| `minimal` | MINIMAL | minimal | Tous类型 |

### 2.3 Structure d'un Template

```typescript
interface Template {
  id: string;
  name: string;
  slug: string;
  category: 'classic' | 'contemporary' | 'nature' | 'minimal';
  thumbnail: string; // URL miniature
  layout: {
    header: { align: 'center' | 'left' };
    background: string; // URL ou gradient CSS
    showCover: boolean;
    showCountdown: boolean;
    showMap: boolean;
    showRSVP: boolean;
  };
  fonts: {
    heading: string;
    body: string;
  };
  colors: {
    primary: string;
    accent: string;
    text: string;
  };
}
```

### 2.4 Comportements

| Action | Comportement |
|--------|--------------|
| Clic sur template | Marque comme sélectionné, mise à jour preview |
| Template incompatible | Désactivé avec message "Non disponible pour ce type" |
| Changement template | Preview se met à jour instantanément |

---

## F3: Page d'Événement (Publique)

### 3.1 Description
Page publiqueconsultable par tous les invités via un lien unique, affichant toutes les informations de l'événement.

### 3.2 URL
```
/e/[slug]
Exemples:
- /e/mariage-jean-marie-2026
- /e/anniversaire-marie-30ans
```

### 3.3 Contenu de la page

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  [Image de couverture ou background du template]             │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  [Type d'événement]                                           │
│  💍 MARIAGE                                                  │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  [Titre de l'événement]                                       │
│  Jean & Marie                                                │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  [Message de l'organisateur]                                 │
│  Nous avons l'honneur de vous inviter à célébrer...          │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  [Informations clés]                                          │
│  📅 Samedi 15 Août 2026                                      │
│  🕐 à 14 heures                                              │
│                                                              │
│  [Carte/Map]                                                 │
│  📍 Salle des Fêtes, Kolwezi                                 │
│  [📍 Voir sur Google Maps]                                   │
│                                                              │
│  [Compte à rebours]                                          │
│  ⏳ Plus que 45 jours                                         │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  [Section RSVP]                                              │
│  Confirmez votre présence:                                   │
│                                                              │
│  [ ✅ Je serai présent(e) ]                                  │
│  [ ❌ Je ne pourrai pas venir ]                             │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│                                                              │
│  [Pied de page Invitia]                                      │
│  Créé avec Invitia • [Lien vers site]                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 Composants dynamiques

| Élément | Affichage conditionnel |
|---------|------------------------|
| Image couverture | Si `coverImage` existe |
| Compte à rebours | Si `eventDate` est dans le futur |
| Carte Maps | Si `location` existe |
| RSVP | Si `template.layout.showRSVP` est true |
| Message | Si `description` n'est pas vide |

### 3.5 Intégration Google Maps

```typescript
// Construction de l'URL embed
const mapsUrl = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(location)}`;
```

---

## F4: RSVP (Confirmations de présence)

### 4.1 Description
Permettre aux invités de confirmer ou décliner leur participation à l'événement.

### 4.2 Types de réponse

| Status | Action | Label bouton |
|--------|--------|--------------|
| `attending` | Je serai présent(e) | "✅ Je serai présent(e)" |
| `not_attending` | Je ne pourrai pas venir | "❌ Je ne pourrai pas venir" |

### 4.3 Formulaire RSVP

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              Confirmez votre présence                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Votre nom *                                        │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │                                                │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  Votre téléphone (optionnel)                         │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │                                                │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  Message (optionnel)                                 │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │ Félicitations ! Nous avons hâte d'y être...   │ │   │
│  │  │                                                │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│                                                              │
│  [ ✅ Je serai présent(e) ]                                  │
│                                                              │
│  [ ❌ Je ne pourrai pas venir ]                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Flux RSVP

```
Invité ouvre la page /e/[slug]
         │
         ▼
Affichage formulaire RSVP
         │
         ▼
Invité remplit ses informations
         │
         ▼
Invité clique sur un bouton RSVP
         │
         ▼
Création/Mise à jour du Guest
         │
         ▼
Création/Mise à jour du RSVP
         │
         ▼
Affichage message de confirmation
         │
         ▼
Option: Inviter à partager sur WhatsApp
```

### 4.5 États du RSVP

| État | Affichage |
|------|-----------|
| Pending (pas encore répondu) | Formulaire RSVP visible |
| Attending (confirmé) | "✅ Merci ! Vous avez confirmé votre présence" |
| Not attending (décliné) | "Merci pour votre réponse. Nous sommes désolés." |

### 4.6 Règles

1. **Un invité = une réponse**: Si même nom+événement existe, mettre à jour
2. **Sans identification**: Invité peut répondre sans créer de compte
3. **Optionnel**: RSVP n'est jamais obligatoire pour voir la page

---

## F5: Partage WhatsApp

### 5.1 Description
Permettre le partage de l'invitation en un clic vers WhatsApp avec un message pré-rempli.

### 5.2 URL WhatsApp

```typescript
const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

// Message par défaut:
const defaultMessage = `🎉 Vous êtes invité(e) !

${event.title}
📅 ${formatDate(event.eventDate)}
🕐 ${event.eventTime || 'Heure à confirmer'}
📍 ${event.location}

Cliquez ici pour voir les détails et confirmer votre présence:
${eventUrl}

 Envoyé via Invitia`;
```

### 5.3 Bouton de partage

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  💬 PARTAGER SUR WHATSAPP                                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Style:
- Background: #25D366 (WhatsApp Green)
- Text: #FFFFFF, SemiBold
- Border-radius: 12px
- Full width sur mobile
- Icône WhatsApp à gauche
```

### 5.4 Deep Link (mobile)

```typescript
// Sur mobile, ouvre directement WhatsApp
const whatsappDeepLink = `whatsapp://send?text=${encodeURIComponent(message)}`;

// Sur desktop, ouvre web.whatsapp.com
const whatsappWebLink = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
```

---

## F6: Tableau de Bord

### 6.1 Description
Espace privé de l'organisateur pour visualiser et gérer ses événements.

### 6.2 URL
```
/dashboard
```

### 6.3 Contenu

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo Invitia]              [🔔 Notifications] [👤 Marie ▼]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Bonjour, Marie 👋                                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  🎉 Mariage de Jean et Marie                        │  │
│  │                                                      │  │
│  │  📅 15 Août 2026 • 👁 150 vues                      │  │
│  │                                                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │ ✅ 90    │  │ ❌ 20    │  │ ⏳ 40    │          │  │
│  │  │ Viennent │  │ Viennent │  │ En att.  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ 👁 Voir l'invitation                        │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                      │  │
│  │  ┌─────────────────┐  ┌─────────────────┐           │  │
│  │  │ ✏️ Modifier     │  │ 📋 Copier le lien│           │  │
│  │  └─────────────────┘  └─────────────────┘           │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  + Créer un nouvel événement                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.4 Statistiques affichées

| Métrique | Source | Calcul |
|----------|--------|--------|
| Vues | `events.view_count` | Compteur incrémenté à chaque visite |
| Confirmations | `COUNT(rsvp WHERE status = 'attending')` | Requête base |
| Déclins | `COUNT(rsvp WHERE status = 'not_attending')` | Requête base |
| En attente | `total - confirmations - déclins` | Calcul |

### 6.5 Actions disponibles

| Action | Description |
|--------|-------------|
| Voir l'invitation | Ouvre `/e/[slug]` dans un nouvel onglet |
| Modifier | Ouvre `/events/[id]/edit` |
| Copier le lien | Copie `/e/[slug]` dans le presse-papier |
| Supprimer | Supprime l'événement (confirmation requise) |

---

## F7: Authentification

### 7.1 Description
Système d'inscription et connexion pour sauvegarder les événements.

### 7.2 Flux d'authentification

```
┌──────────────────────────────────────────────────────────────┐
│                      INSCRIPTION                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Créer votre compte                                   │   │
│  │                                                      │   │
│  │  Nom complet                                          │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │ Marie Kabongo                                  │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  Email                                               │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │ marie@example.com                              │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  Mot de passe                                        │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │ ••••••••••                                     │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  Confirmer le mot de passe                           │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │ ••••••••••                                     │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [ CRÉER MON COMPTE ]                                        │
│                                                              │
│  Déjà un compte ? [Se connecter]                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Validation

| Champ | Règles |
|-------|--------|
| Nom | 2-100 caractères |
| Email | Format email valide, unique |
| Mot de passe | Minimum 8 caractères |

### 7.4 Règles UX importantes

1. **Inscription après création**: L'utilisateur crée d'abord son événement, puis on lui propose de créer un compte pour le sauvegarder
2. **Connexion optionnelle**: L'événement reste accessible même sans compte (via le lien)
3. **Session persistante**: Utilisation de cookies HTTP-only

---

## F8: Gestion des Invités (Dashboard)

### 8.1 Liste des invités

```
┌──────────────────────────────────────────────────────────────┐
│  Participants                                    90/150     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 👤 Jean-Pierre Kabongo    ✅ Confirmé               │   │
│  │    Message: "Comptez sur nous !"}                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 👤 Marie Muteba            ❌ Décliné                 │   │
│  │    Message: "Malheureusement..."                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 👤 Thomas Ngalula          ⏳ En attente             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 👤 Aimé Mukeba             ⏳ En attente             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Filtres: [Tous ▼] [Confirmés ▼] [Déclinés ▼] [En att. ▼] │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Ajout manuel d'invité

```
┌──────────────────────────────────────────────────────────────┐
│  + Ajouter un invité                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Nom *                    Téléphone                          │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │                  │    │                  │               │
│  └──────────────────┘    └──────────────────┘               │
│                                                              │
│  Email                                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [ AJOUTER ]                                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Notes d'Implémentation

### Ordre de priorité

1. F1: Création d'événement (core)
2. F3: Page d'événement publique (affichage)
3. F4: RSVP (interaction clé)
4. F2: Templates (personnalisation)
5. F5: Partage WhatsApp (viralité)
6. F6: Tableau de bord (suivi)
7. F7: Authentification (persistance)
8. F8: Gestion invités (extras)

### Critères de validation

Chaque fonctionnalité est validée quand:
- ✅ Code complet et fonctionnel
- ✅ Tests unitaires écrits
- ✅ Responsive sur mobile
- ✅ Accessible (ARIA, contraste)
- ✅ Performance acceptable (< 3s de chargement)

---

*Spécifications fonctionnelles — Invitia v1.0*
