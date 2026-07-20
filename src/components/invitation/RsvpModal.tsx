'use client';

import { useState } from 'react';
import { EventWithSettings } from '@/types';
import { Check, X as XIcon } from 'lucide-react';
import { Modal } from '@/components/ui';
import { submitRsvp } from '@/lib/services/eventService';

interface RsvpModalProps {
  event: EventWithSettings;
  isOpen: boolean;
  onClose: () => void;
}

export default function RsvpModal({ event, isOpen, onClose }: RsvpModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    adults: 1,
    children: 0,
    message: '',
    confirmed: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setIsSubmitting(true);
    setError('');

    // Essayer Supabase d'abord, puis fallback localStorage
    let success = false;
    try {
      const result = await submitRsvp(event.id, {
        guestName: formData.name.trim(),
        guests: formData.adults + formData.children,
        message: formData.message || undefined,
      });
      success = result.success;
      if (!success) setError(result.error || 'Erreur lors de l\'envoi');
    } catch {
      // Fallback localStorage
      const rsvps = JSON.parse(localStorage.getItem('invitia_rsvps') || '[]');
      rsvps.push({
        eventId: event.id,
        slug: event.slug,
        name: formData.name.trim(),
        adults: formData.adults,
        children: formData.children,
        message: formData.message,
        date: new Date().toISOString(),
      });
      localStorage.setItem('invitia_rsvps', JSON.stringify(rsvps));
      success = true;
    }

    if (success) {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({ name: '', email: '', phone: '', adults: 1, children: 0, message: '', confirmed: true });
      }, 2000);
    }
    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmer ma présence">
      {submitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Merci !</h4>
          <p className="text-sm text-gray-600">Votre réponse a été enregistrée.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Votre nom"
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adultes</label>
              <input
                type="number" min="1" max="10"
                value={formData.adults}
                onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enfants</label>
              <input
                type="number" min="0" max="10"
                value={formData.children}
                onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Un message..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}