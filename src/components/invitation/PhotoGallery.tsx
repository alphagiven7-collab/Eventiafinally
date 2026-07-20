'use client';

import { useState, useRef, useEffect } from 'react';
import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoGalleryProps {
  event: EventWithSettings;
}

export default function PhotoGallery({ event }: PhotoGalleryProps) {
  const identity = getEventIdentity(event.type);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Récupérer les photos : bestPhotos d'abord, puis fallback Unsplash
  const photos: string[] =
    event.bestPhotos && event.bestPhotos.length > 0
      ? event.bestPhotos
      : event.sections?.gallery !== false
        ? [
            event.branding?.welcomeImage ||
              'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
            event.branding?.heroImage ||
              'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80',
            'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80',
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80',
          ].filter(Boolean)
        : [];

  if (photos.length === 0) return null;

  // Défilement horizontal fluide
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const amount = direction === 'left' ? -280 : 280;
    scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Intersection Observer pour animations au scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setVisibleItems((prev) => new Set(prev).add(index));
          }
        });
      },
      { threshold: 0.2 }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  const observeElement = (el: Element | null) => {
    if (el && observerRef.current) observerRef.current.observe(el);
  };

  return (
    <section className="px-4 mt-6">
      {/* En-tête de section */}
      <div className="text-center mb-4">
        <h3
          className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-xl md:text-2xl mb-1`}
          style={{ color: identity.palette.text }}
        >
          {event.type === 'wedding' ? 'Notre histoire en images' : 'Galerie photos'}
        </h3>
        <div className="w-10 h-[2px] mx-auto rounded-full" style={{ backgroundColor: identity.palette.primary, opacity: 0.5 }} />
      </div>

      {/* Grille de photos principale — 2 colonnes sur mobile */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {photos.slice(0, 4).map((photo, index) => (
          <button
            key={index}
            data-index={index}
            ref={observeElement}
            onClick={() => setSelectedIndex(index)}
            className={`relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md transition-all duration-700 cursor-pointer ${
              visibleItems.has(index)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
            {/* Overlay au hover */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300" />
            {/* Subtle gradient bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
          </button>
        ))}
      </div>

      {/* Carrousel horizontal — pour les photos supplémentaires */}
      {photos.length > 4 && (
        <div className="relative group">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Défiler vers la gauche"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: identity.palette.text }} />
          </button>
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-1 pb-2"
          >
            {photos.slice(4).map((photo, index) => (
              <button
                key={index + 4}
                onClick={() => setSelectedIndex(index + 4)}
                className="flex-shrink-0 w-36 h-44 rounded-2xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-300"
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 5}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Défiler vers la droite"
          >
            <ChevronRight className="w-4 h-4" style={{ color: identity.palette.text }} />
          </button>
        </div>
      )}

      {/* Indice tactile */}
      <p className="text-[10px] text-center mt-2 mb-4" style={{ color: identity.palette.textMuted }}>
        Touchez une photo pour l'agrandir
      </p>

      {/* Lightbox plein écran — immersive */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ backgroundColor: identity.palette.background }}
          onClick={() => setSelectedIndex(null)}
        >
          {/* Bouton fermer */}
          <button
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center hover:bg-black/50 transition"
            onClick={() => setSelectedIndex(null)}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation */}
          {selectedIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center hover:bg-black/50 transition"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex - 1);
              }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {selectedIndex < photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center hover:bg-black/50 transition"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex + 1);
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Image */}
          <div className="relative w-full max-w-2xl max-h-[80vh]">
            <img
              src={photos[selectedIndex]}
              alt={`Photo ${selectedIndex + 1}`}
              className="w-full h-full object-contain rounded-2xl shadow-2xl animate-scale-in"
            />
          </div>

          {/* Compteur */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/40 backdrop-blur text-white text-xs">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </section>
  );
}