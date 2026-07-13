'use client';

import { useState } from 'react';
import { migrateEventToSupabase, needsMigration } from '@/lib/utils/migrateToSupabase';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface MigrationPanelProps {
  eventId: string;
  eventName: string;
}

export default function MigrationPanel({ eventId, eventName }: MigrationPanelProps) {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const needsMigrate = needsMigration(eventId);

  const handleMigration = async () => {
    setMigrating(true);
    setResult(null);

    try {
      const migrationResult = await migrateEventToSupabase(eventId);
      
      setResult({
        success: true,
        message: 'Migration réussie !',
        details: migrationResult
      });
    } catch (error) {
      console.error('Erreur migration:', error);
      setResult({
        success: false,
        message: 'Erreur lors de la migration',
        details: error
      });
    } finally {
      setMigrating(false);
    }
  };

  if (!needsMigrate) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900">Données déjà synchronisées</h3>
            <p className="text-sm text-blue-700 mt-1">
              Les données de "{eventName}" sont déjà dans Supabase.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 mt-1" />
        <div>
          <h3 className="font-semibold text-amber-900">Migration nécessaire</h3>
          <p className="text-sm text-amber-700 mt-1">
            Des données locales existent pour "{eventName}". 
            Voulez-vous les migrer vers Supabase ?
          </p>
        </div>
      </div>

      <button
        onClick={handleMigration}
        disabled={migrating}
        className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {migrating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Migration en cours...
          </>
        ) : (
          'Migrer vers Supabase'
        )}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.success ? 'bg-emerald-100' : 'bg-rose-100'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{result.message}</p>
              
              {result.details && (
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <p>✓ {result.details.guests.success} invités migrés</p>
                  {result.details.guests.failed > 0 && (
                    <p className="text-rose-600">✗ {result.details.guests.failed} invités échoués</p>
                  )}
                  <p>✓ {result.details.checkins.success} check-ins migrés</p>
                  {result.details.checkins.failed > 0 && (
                    <p className="text-rose-600">✗ {result.details.checkins.failed} check-ins échoués</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}