'use client';

import Link from 'next/link';

export default function AdminAccess({
  onRetry,
}: {
  email?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Eventia</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">Accès réservé</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          Cet espace est réservé à l’équipe Eventia.
        </p>
        <div className="mt-6 grid gap-2">
          <Link
            href="/dashboard"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-bold text-white hover:bg-violet-700"
          >
            Retour à mes mariages
          </Link>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-12 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
