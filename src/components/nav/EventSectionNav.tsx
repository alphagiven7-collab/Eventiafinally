import Link from 'next/link';

const items = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'edit', label: 'Personnalisation' },
  { id: 'guests', label: 'Invités' },
  { id: 'results', label: 'Résultats' },
] as const;

export function EventSectionNav({
  slug,
  eventId,
  title,
  active,
}: {
  slug: string;
  eventId: string;
  title?: string;
  active: (typeof items)[number]['id'];
}) {
  const href = {
    overview: '/dashboard',
    edit: `/create/${slug}/edit`,
    guests: `/dashboard/invites?event=${eventId}`,
    results: `/dashboard/invites?event=${eventId}&tab=rsvps`,
  };

  return (
    <div className="mb-4">
      {title && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">Événement : {title}</p>
      )}
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Sections de l'événement">
        {items.map((item) => (
          <Link
            key={item.id}
            href={href[item.id]}
            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold ${
              active === item.id
                ? 'bg-violet-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
