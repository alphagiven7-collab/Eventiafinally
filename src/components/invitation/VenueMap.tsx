'use client';

import { EventWithSettings } from '@/types';

interface VenueMapProps {
  event: EventWithSettings;
}

export default function VenueMap({ event }: VenueMapProps) {
  if (!event.lat || !event.lng) return null;

  const mapUrl = `https://www.google.com/maps/embed?pb=${encodeURIComponent(JSON.stringify({
    latitude: parseFloat(event.lat),
    longitude: parseFloat(event.lng),
    title: event.location
  }))}`;

  return (
    <section className="px-4 mt-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <h3 className="font-serif text-2xl text-gray-900 text-center mb-6">
            {event.venueDetails?.title || 'Lieu de réception'}
          </h3>
          
          {/* Map container avec coins arrondis et ombre */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            {/* Placeholder pour la carte Google Maps */}
            <div className="aspect-video bg-gradient-to-br from-emerald-100 to-pink-100 flex items-center justify-center">
              <div className="text-center p-8">
                <svg className="w-16 h-16 text-emerald-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <p className="font-serif text-lg text-gray-800 mb-2">
                  {event.location}
                </p>
                {event.address && (
                  <p className="text-sm text-gray-600 font-sans">
                    {event.address}
                  </p>
                )}
              </div>
            </div>

            {/* Badge avec icône GPS */}
            <div className="absolute top-4 right-4 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span className="text-xs font-medium text-gray-800">GPS</span>
            </div>
          </div>

          {/* Coordonnées GPS */}
          <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-pink-50 rounded-xl">
            <p className="text-xs text-gray-600 font-sans text-center">
              📍 Latitude: {event.lat}, Longitude: {event.lng}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}