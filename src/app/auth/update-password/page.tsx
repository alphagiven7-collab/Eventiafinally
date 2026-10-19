'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/providers/auth-provider';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { updatePassword } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await updatePassword(password);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-gray-950 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-light text-gray-900 dark:text-white">Nouveau mot de passe</h1>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          {!authLoading && !user ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ouvrez le lien reçu par email pour choisir un nouveau mot de passe.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8 caractères minimum"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Enregistrement...' : <>Enregistrer <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
