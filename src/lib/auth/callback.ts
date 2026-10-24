import type { SupabaseClient } from '@supabase/supabase-js';

type CallbackAuth = Pick<SupabaseClient['auth'], 'initialize' | 'getSession'>;

export async function finishBrowserSignIn(auth: CallbackAuth): Promise<{ error: string | null }> {
  try {
    // createBrowserClient traite déjà le code PKCE à l’initialisation.
    // Attendre cette opération partagée évite de consommer le code deux fois,
    // y compris lorsque React relance l’effet en développement.
    const initialization = await auth.initialize();
    const { data, error } = await auth.getSession();
    if (!error && data.session) return { error: null };

    const cause = initialization.error || error;
    if (cause?.code === 'otp_expired') {
      return { error: 'Ce lien de connexion est invalide ou a expiré. Reconnectez-vous pour continuer.' };
    }
    return { error: 'La connexion n’a pas abouti. Réessayez depuis la page de connexion.' };
  } catch {
    return { error: 'Connexion impossible pour le moment. Vérifiez votre connexion internet et réessayez.' };
  }
}
