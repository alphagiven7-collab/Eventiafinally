'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthActions } from '@/providers/auth-provider';
import { Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    const result = await requestPasswordReset(email);
    if (result?.error) setError(result.error);
    else setInfo('Si un compte existe pour cet email, un lien de réinitialisation vient d\'être envoyé.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] dark:bg-gray-950 px-4">
      <div className="relative z-10 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-light text-gray-900 dark:text-white">Mot de passe oublié</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Nous envoyons un lien de réinitialisation</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            {info && <p className="text-sm text-amber-800 dark:text-amber-200">{info}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vous@exemple.com"
                  className="w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-400 outline-none transition"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Envoi...' : <>Envoyer le lien <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/auth/login" className="text-amber-600 dark:text-amber-400 font-medium">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
