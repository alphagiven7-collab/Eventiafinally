'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  symbol: string;
  rotation: number;
  rotationSpeed: number;
}

/**
 * DecorativeParticles — Particules animées élégantes
 * Utilisation : <DecorativeParticles color="#D4AF37" symbols={['💍', '🤍']} count={15} />
 */
interface DecorativeParticlesProps {
  color?: string;
  symbols?: string[];
  count?: number;
  speed?: number;
}

export default function DecorativeParticles({
  color = '#D4AF37',
  symbols = ['✨'],
  count = 12,
  speed = 0.3,
}: DecorativeParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 12 + Math.random() * 16,
          speedX: (Math.random() - 0.5) * speed,
          speedY: -(0.3 + Math.random() * speed),
          opacity: 0.15 + Math.random() * 0.35,
          color,
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Wrap around
        if (p.y < -50) { p.y = canvas.height + 50; p.x = Math.random() * canvas.width; }
        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = `${p.size}px serif`;
        ctx.fillText(p.symbol, -p.size / 2, p.size / 2);
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    init();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [color, symbols, count, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}