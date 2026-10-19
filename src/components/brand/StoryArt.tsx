export function StoryArt({
  name,
  alt,
  className = '',
}: {
  name: 'wedding' | 'photos' | 'customize' | 'share' | 'calendar' | 'guests' | 'login' | 'welcome' | 'envelope';
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={`/storyset/${name}.png`}
      alt={alt}
      className={className}
    />
  );
}

export function StoryCredit({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] text-gray-500 dark:text-gray-400 ${className}`}>
      Illustrations par{' '}
      <a href="https://storyset.com/illustration/wedding/amico" className="underline" target="_blank" rel="noreferrer">
        Storyset
      </a>
    </p>
  );
}
