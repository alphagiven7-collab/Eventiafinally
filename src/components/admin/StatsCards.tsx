'use client';

interface StatsCardsProps {
  stats: {
    total: number;
    confirmed: number;
    declined: number;
    pending: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total invités',
      value: stats.total,
      color: 'from-blue-500 to-indigo-600',
      icon: '👥',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Confirmés',
      value: stats.confirmed,
      color: 'from-emerald-500 to-green-600',
      icon: '✅',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      label: 'Déclinés',
      value: stats.declined,
      color: 'from-rose-500 to-red-600',
      icon: '❌',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600'
    },
    {
      label: 'En attente',
      value: stats.pending,
      color: 'from-amber-500 to-orange-600',
      icon: '⏳',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bgColor} rounded-2xl p-6 border border-gray-200 transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">{card.icon}</span>
            <span className={`text-3xl font-bold ${card.textColor}`}>
              {card.value}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-700">{card.label}</p>
          {stats.total > 0 && (
            <div className="mt-2">
              <div className="w-full bg-white rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${card.color}`}
                  style={{ 
                    width: `${(card.value / stats.total) * 100}%` 
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {Math.round((card.value / stats.total) * 100)}% du total
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}