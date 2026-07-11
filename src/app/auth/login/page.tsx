'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate auth - en production, utiliser Supabase Auth
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Pour la démo, accept any credentials
    if (email && password) {
      router.push('/dashboard');
    } else {
      setError('Veuillez remplir tous les champs');
    }
    
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
              Bon retour !
            </h1>
            <p className="text-earth">
              Connectez-vous à votre compte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">
                {error}
              </div>
            )}

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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-sand text-gold focus:ring-gold" />
                <span className="text-earth">Se souvenir de moi</span>
              </label>
              <Link href="/auth/forgot-password" className="text-gold hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-earth">
            Pas encore de compte ?{' '}
            <Link href="/auth/register" className="text-gold font-semibold hover:underline">
              Créer un compte
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
