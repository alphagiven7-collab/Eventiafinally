'use client';

import { useState, useRef } from 'react';
import { EventWithSettings } from '@/types';

interface MusicPlayerProps {
  event: EventWithSettings;
}

export default function MusicPlayer({ event }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(event.ambiance?.volume || 0.35);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (!event.ambiance?.musicUrl) return null;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value) / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <section className="px-4 mt-8 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="font-serif text-2xl text-gray-900 text-center mb-6">
          Musique ambiante
        </h3>

        {/* Visualiseur audio décoratif */}
        <div className="flex items-end justify-center gap-1 h-16 mb-6">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-emerald-500 to-pink-500 rounded-full transition-all duration-300"
              style={{
                height: isPlaying ? `${Math.random() * 100}%` : '20%',
                animation: isPlaying ? 'pulse 0.5s ease-in-out infinite' : 'none',
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-pink-500 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Écouter'}
          </button>
        </div>

        {/* Volume slider avec style */}
        <div className="mt-4">
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={handleVolumeChange}
            className="w-full h-2 bg-gradient-to-r from-emerald-100 to-pink-100 rounded-full appearance-none cursor-pointer accent-emerald-600"
          />
        </div>

        <audio
          ref={audioRef}
          src={event.ambiance.musicUrl}
          loop
          className="hidden"
        />
      </div>
    </section>
  );
}