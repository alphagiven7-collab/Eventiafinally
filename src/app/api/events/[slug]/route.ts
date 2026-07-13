import { NextResponse } from 'next/server';
import { EventWithSettings } from '@/types';
import { getEventBySlug } from '@/data/events';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Utiliser la fonction getEventBySlug (plus compatible avec Next.js 16)
    const event = getEventBySlug(slug);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(event);
  } catch (error) {
    console.error('Error in /api/events/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}