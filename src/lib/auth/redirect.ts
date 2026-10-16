/** Chemin interne après connexion. Refuse les URLs externes. */
export function safeNextPath(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://')) return fallback;
  return value;
}

export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (normalized.includes('email not confirmed')) return 'Confirmez votre email avant de vous connecter.';
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'Cet email est déjà utilisé.';
  }
  if (normalized.includes('password')) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (normalized.includes('rate limit')) return 'Trop de tentatives. Réessayez dans quelques minutes.';
  return message;
}
