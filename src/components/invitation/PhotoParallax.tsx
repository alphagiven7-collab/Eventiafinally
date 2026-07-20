'use client';

import { useEffect, useRef, useState } from 'react';

interface PhotoParallaxProps {
  src: string;
  alt?: string;
  height?: string;
  overlayColor?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
}

/**
 * PhotoParallax — Effet de profondeur subtil au scroll
 * L'image bouge plus lentement que le contenu, créant une sensation 3D élégante
 */
export default function PhotoParallax({
  src,
  alt = '',
  height = '60vh',
  overlayColor = '#000',
  overlayOpacity = 0.3,
  children,
}: PhotoParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Visible quand le container est dans le viewport
      setIsVisible(rect.top < windowHeight && rect.bottom > 0);

      // Calcul du décalage parallaxe
      const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
      setOffset(scrollProgress * 60 - 30); // -30px à +30px
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ height }}
    >
      {/* Image avec parallaxe */}
      <div
        className="absolute inset-0 transition-transform duration-1000 ease-out"
        style={{
          transform: `translateY(${offset}px) scale(1.1)`,
          opacity: isVisible ? 1 : 0.3,
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          style={{ willChange: 'transform' }}
          loading="lazy"
        />
        {/* Overlay gradiant */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, ${overlayColor}${Math.round(overlayOpacity * 0.5 * 255).toString(16).padStart(2, '0')}, ${overlayColor}${Math.round(overlayOpacity * 255).toString(16).padStart(2, '0')})`,
          }}
        />
      </div>

      {/* Contenu par-dessus */}
      {children && (
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          {children}
        </div>
      )}
    </div>
  );
}