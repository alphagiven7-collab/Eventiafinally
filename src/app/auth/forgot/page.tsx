'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthActions } from '@/providers/auth-provider';
import { Mail, ArrowRight } from 'lucide-react';
import { AuthFrame } from '@/components/auth/AuthFrame';

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
    else setInfo('Si un compte existe pour cet e-mail, le lien pour choisir un nouveau mot de passe vient d’être envoyé.');
    setLoading(false);
  };

  return (
    <AuthFrame title="Mot de passe oublié" text="Indiquez votre e-mail. Nous envoyons le lien pour en choisir un nouveau." art="login">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {info && <p className="text-sm text-amber-800 dark:text-amber-200">{info}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
              className="w-full pl-11 pr-4 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-400 outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-violet-600 text-white rounded-2xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Envoi...' : <>Envoyer le lien <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/auth/login" className="text-violet-700 dark:text-violet-300 font-medium">Retour à la connexion</Link>
      </p>
    </AuthFrame>
  );
}
