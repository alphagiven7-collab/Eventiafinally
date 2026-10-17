'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import QRScanner from '@/components/checkin/QRScanner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { isSupabaseReady } from '@/config/supabase';
import { createClient } from '@/lib/supabase/client';
import { lookupGuestByToken, PublicGuest, submitGuestRsvp, tokenFromInviteLink } from '@/lib/guests/store';

export default function CheckInPage() {
  return (
    <ProtectedRoute>
      <CheckInContent />
    </ProtectedRoute>
  );
}

function CheckInContent() {
  const [inputMode, setInputMode] = useState<'scan' | 'manual'>('scan');
  const [tokenInput, setTokenInput] = useState('');
  const [checkinResult, setCheckinResult] = useState<{
    success: boolean;
    guest?: PublicGuest;
    message?: string;
  } | null>(null);
  const [scanning, setScanning] = useState(false);

  const confirmArrival = async (raw: string) => {
    const token = tokenFromInviteLink(raw);
    if (!token || !isSupabaseReady()) {
      setCheckinResult({ success: false, message: 'Invité introuvable. Le lien doit venir de la liste enregistrée.' });
      return;
    }
    const guest = await lookupGuestByToken(createClient(), token);
    if (!guest) {
      setCheckinResult({ success: false, message: 'Token invalide ou invité non trouvé' });
      return;
    }
    await submitGuestRsvp(createClient(), { token: guest.token, status: 'confirmed', adults: guest.adults, children: guest.children });
    setCheckinResult({ success: true, guest });
    setTimeout(() => setCheckinResult(null), 3000);
  };

  const handleManualCheckin = () => {
    if (!tokenInput.trim()) return;
    void confirmArrival(tokenInput);
    setTokenInput('');
  };

  const handleScanSuccess = (decodedText: string) => {
    setScanning(false);
    void confirmArrival(decodedText);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4">
        <h1 className="text-xl font-bold text-center">Check-in des invités</h1>
        <p className="text-sm text-center opacity-90">Mariage Josue & Divine</p>
      </header>

      <main className="flex-1 p-4 max-w-md mx-auto w-full">
        {/* Mode selection */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setInputMode('scan')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              inputMode === 'scan' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-600'
            }`}
          >
            Scanner QR
          </button>
          <button
            onClick={() => setInputMode('manual')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              inputMode === 'manual' 
                ? 'bg-emerald-600 text-white' 
                : 'text-gray-600'
            }`}
          >
            Saisie manuelle
          </button>
        </div>

        {/* Scanner view */}
        {inputMode === 'scan' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="relative aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
              {scanning ? (
                <QRScanner onScanSuccess={handleScanSuccess} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Appuyez sur démarrer pour scanner</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setScanning(true)}
              disabled={scanning}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {scanning ? 'Scan en cours...' : 'Démarrer le scan'}
            </button>
          </div>
        )}

        {/* Manual input */}
        {inputMode === 'manual' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token de l'invité
                </label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Entrez le token..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                onClick={handleManualCheckin}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                Valider la présence
              </button>
            </div>
          </div>
        )}

        {/* Result popup */}
        {checkinResult && (
          <div className={`fixed top-20 left-4 right-4 p-4 rounded-xl shadow-lg z-50 ${
            checkinResult.success ? 'bg-emerald-100' : 'bg-rose-100'
          }`}>
            <div className="flex items-center gap-3">
              {checkinResult.success ? (
                <Check className="w-6 h-6 text-emerald-600" />
              ) : (
                <X className="w-6 h-6 text-rose-600" />
              )}
              <div>
                {checkinResult.guest ? (
                  <>
                    <p className="font-semibold text-gray-900">{checkinResult.guest.name}</p>
                    <p className="text-sm text-gray-600">Présent(e) enregistré(e)</p>
                  </>
                ) : (
                  <p className="font-semibold text-gray-900">{checkinResult.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}