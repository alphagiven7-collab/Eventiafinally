'use client';

import { useState, useRef } from 'react';
import { EventWithSettings } from '@/types';
import { getEventIdentity } from '@/constants/design-language';

interface MusicPlayerProps {
  event: EventWithSettings;
}

export default function MusicPlayer({ event }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(event.ambiance?.volume || 0.35);
  const audioRef = useRef<HTMLAudioElement>(null);
  const identity = getEventIdentity(event.type);

  if (!event.ambiance?.musicUrl) return null;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="px-4 mt-6 animate-reveal-up">
      <div
        className="rounded-3xl shadow-sm border p-6 md:p-8"
        style={{ backgroundColor: identity.palette.surface, borderColor: identity.palette.border }}
      >
        <h3 className={`${identity.typography.headingClass} ${identity.typography.headingWeight} text-xl md:text-2xl text-center mb-5`} style={{ color: identity.palette.text }}>
          Musique ambiante
        </h3>

        <div className="flex items-end justify-center gap-1 h-16 mb-5">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full transition-all duration-300"
              style={{
                height: isPlaying ? `${Math.random() * 100}%` : '20%',
                background: `linear-gradient(to top, ${identity.palette.primary}, ${identity.palette.accent})`,
                animation: isPlaying ? 'pulse 0.5s ease-in-out infinite' : 'none',
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        <button
          onClick={togglePlay}
          className="flex-1 w-full text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 active:scale-95"
          style={{ background: `linear-gradient(to right, ${identity.palette.primary}, ${identity.palette.accent})` }}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Écouter'}
        </button>

        <div className="mt-4">
          <input
            type="range" min="0" max="100" value={volume * 100}
            onChange={(e) => {
              const v = parseInt(e.target.value) / 100;
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: identity.palette.primary }}
          />
        </div>

        <audio ref={audioRef} src={event.ambiance.musicUrl} loop className="hidden" />
      </div>
    </section>
  );
}