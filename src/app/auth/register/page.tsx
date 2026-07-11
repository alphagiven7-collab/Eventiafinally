'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { Eye, EyeOff, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRequirements = [
    { met: password.length >= 8, text: 'Au moins 8 caractères' },
    { met: /[A-Z]/.test(password), text: 'Une majuscule' },
    { met: /[0-9]/.test(password), text: 'Un chiffre' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);

    // Simulate auth - en production, utiliser Supabase Auth
    await new Promise(resolve => setTimeout(resolve, 1000));

    router.push('/dashboard');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl">🎉</span>
          <span className="font-display text-2xl font-bold text-primary">Invitia</span>
        </Link>

        <Card>
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold text-primary mb-2">
              Créer un compte
            </h1>
            <p className="text-earth">
              Rejoignez Invitia et organisez vos événements
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Nom complet"
              type="text"
              placeholder="Marie Kabongo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-earth hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {password && (
              <div className="space-y-1">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm ${req.met ? 'text-success' : 'text-earth'}`}>
                    <Check className={`w-4 h-4 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                    <span>{req.text}</span>
                  </div>
                ))}
              </div>
            )}

            <Input
              label="Confirmer le mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="text-sm text-earth">
              En créant un compte, vous acceptez nos{' '}
              <Link href="/terms" className="text-gold hover:underline">conditions d'utilisation</Link>
              {' '}et notre{' '}
              <Link href="/privacy" className="text-gold hover:underline">politique de confidentialité</Link>.
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
              Créer mon compte
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-earth">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="text-gold font-semibold hover:underline">
              Se connecter
            </Link>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-earth hover:text-primary transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
