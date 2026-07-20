'use client';

import { useState, useEffect } from 'react';

function getCountdown(targetDate: string) {
  const target = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    isPast: false,
  };
}

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdown(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (countdown.isPast) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <p className="font-serif text-3xl text-gray-800 mb-2">
          L'événement a eu lieu
        </p>
        <p className="text-gray-600 font-sans">
          Merci d'avoir participé !
        </p>
      </div>
    );
  }

  const timeUnits = [
    { label: 'Jours', value: Number.isNaN(countdown.days) ? 0 : countdown.days },
    { label: 'Heures', value: Number.isNaN(countdown.hours) ? 0 : countdown.hours },
    { label: 'Minutes', value: Number.isNaN(countdown.minutes) ? 0 : countdown.minutes },
    { label: 'Secondes', value: Number.isNaN(countdown.seconds) ? 0 : countdown.seconds },
  ];

  return (
    <div className="animate-fade-in">
      <p className="text-center font-serif text-xl md:text-2xl text-gray-800 mb-6">
        Plus que...
      </p>
      
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {timeUnits.map((unit) => (
          <div
            key={unit.label}
            className="relative p-3 sm:p-4 rounded-2xl border shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-emerald-50 to-white border-emerald-100"
          >
            <div className="text-center">
              <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-rose-500 bg-clip-text text-transparent">
                {unit.value}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 sm:mt-2 font-medium">
                {unit.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}