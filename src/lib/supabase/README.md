# Composants UI - Invitia

## Installation

Les composants sont prêts à l'emploi et importés depuis `@/components/ui`.

## Composants disponibles

### Button
```tsx
import { Button } from '@/components/ui';

// Variantes
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="whatsapp">WhatsApp</Button>
<Button variant="success">Success</Button>
<Button variant="danger">Danger</Button>
<Button variant="ghost">Ghost</Button>

// Tailles
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// États
<Button isLoading>Chargement...</Button>
<Button disabled>Désactivé</Button>
```

### Input
```tsx
import { Input } from '@/components/ui';

<Input 
  label="Email" 
  placeholder="votre@email.com"
  error="Email invalide"
  required
/>
```

### Textarea
```tsx
import { Textarea } from '@/components/ui';

<Textarea 
  label="Message" 
  placeholder="Votre message..."
  hint="Maximum 1000 caractères"
/>
```

### Select
```tsx
import { Select } from '@/components/ui';

<Select 
  label="Pays"
  options={[
    { value: 'cd', label: 'RDC' },
    { value: 'fr', label: 'France' },
  ]}
  placeholder="Sélectionnez..."
/>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

## Personnalisation

Les composants utilisent les classes Tailwind et les variables CSS définies dans `globals.css`.

### Couleurs disponibles

- `primary` - #1A1A2E
- `gold` - #D4AF37
- `cream` - #F8F4F0
- `sand` - #E8E0D8
- `earth` - #6B5B4F
- `success` - #2ECC71
- `danger` - #E74C3C
- `warning` - #F39C12
- `whatsapp` - #25D366
