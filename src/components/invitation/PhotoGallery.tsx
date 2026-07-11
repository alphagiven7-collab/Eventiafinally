'use client';

import { useState } from 'react';
import { EventWithSettings } from '@/types';
import Image from 'next/image';

interface PhotoGalleryProps {
  event: EventWithSettings;
}

export default function PhotoGallery({ event }: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const photos = event.sections?.gallery !== false ? [
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
  ] : [];

  if (photos.length === 0) return null;

  return (
    <section className="px-4 mt-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <h3 className="font-serif text-2xl text-gray-900 text-center p-6 md:p-8 pb-4">
          Les plus beaux souvenirs
        </h3>

        {/* Grille de photos avec design premium */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {photos.slice(0, 4).map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className="relative h-32 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-md"
            >
              <Image
                src={photo}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Marquee défilant avec animation */}
        <div className="relative h-24 overflow-hidden mt-2">
          <div className="flex gap-2 animate-marquee">
            {photos.map((photo, index) => (
              <div key={index} className="flex-shrink-0 w-32 h-24 relative">
                <Image
                  src={photo}
                  alt={`Souvenir ${index + 1}`}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-4 pb-2 font-sans">
          Touchez pour agrandir
        </p>
      </div>

      {/* Lightbox avec overlay */}
      {selectedImage !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white text-3xl hover:scale-110 transition-transform"
            onClick={() => setSelectedImage(null)}
          >
            ✕
          </button>
          <div className="relative w-full max-w-3xl aspect-[4/3]">
            <Image
              src={photos[selectedImage]}
              alt="Photo agrandie"
              fill
              className="object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </section>
  );
}