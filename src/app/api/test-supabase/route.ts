import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { supabase } = await createClient();
    
    // Test simple : vérifier la connexion
    const { data, error } = await supabase
      .from('events')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({ 
        status: 'error', 
        message: error.message,
        hint: 'Vérifier les clés Supabase dans .env.local'
      });
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Connexion Supabase OK',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
    });
  } catch (err: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: err.message 
    });
  }
}