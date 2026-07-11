import { NextResponse } from 'next/server';
import { EventWithSettings } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // Charger depuis le filesystem
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), 'public', 'data', 'events', `${slug}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const event = JSON.parse(fileContent) as EventWithSettings;
      
      return NextResponse.json(event);
    } catch (fileError) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in /api/events/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}