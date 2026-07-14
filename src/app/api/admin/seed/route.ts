import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/admin/seed
 * Crée ou promeut un utilisateur en super_admin
 * Protégé par une clé secrète ADMIN_SEED_KEY définie dans .env.local
 * 
 * Body: { email: string, secret: string }
 * 
 * Utilisation :
 *   curl -X POST https://invitia.vercel.app/api/admin/seed \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"admin@exemple.com","secret":"SUPER_SECRET_KEY"}'
 */
export async function POST(request: Request) {
  try {
    const { email, secret } = await request.json();

    // Vérifier la clé secrète
    const adminSeedKey = process.env.ADMIN_SEED_KEY;
    if (!adminSeedKey) {
      return NextResponse.json(
        { error: 'ADMIN_SEED_KEY non configurée. Ajoutez-la dans .env.local' },
        { status: 500 }
      );
    }

    if (!secret || secret !== adminSeedKey) {
      return NextResponse.json(
        { error: 'Clé secrète invalide' },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const { supabase } = await createClient();

    // Vérifier si l'utilisateur existe dans auth.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: `Utilisateur ${email} introuvable. Créez d'abord un compte via /auth/register, puis réessayez.` },
        { status: 404 }
      );
    }

    // L'utilisateur existe déjà, le promouvoir super_admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'super_admin', updated_at: new Date().toISOString() })
      .eq('email', email);

    if (updateError) {
      return NextResponse.json(
        { error: `Erreur promotion: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Mettre à jour admin_users
    await supabase
      .from('admin_users')
      .upsert({
        user_id: user.id,
        role: 'super_admin',
      });

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${email} promu super_admin avec succès`,
      user: { id: user.id, email, role: 'super_admin' }
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}