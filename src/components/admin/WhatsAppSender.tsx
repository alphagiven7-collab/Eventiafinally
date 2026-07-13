'use client';

import { useState } from 'react';
import { Guest, EventWithSettings, GuestStatus } from '@/types';
import { X, Send, MessageCircle, Copy } from 'lucide-react';

interface WhatsAppSenderProps {
  guests: Guest[];
  onClose: () => void;
  event?: EventWithSettings;
}

export default function WhatsAppSender({ guests, onClose, event }: WhatsAppSenderProps) {
  const [messageTemplate, setMessageTemplate] = useState(
    `Bonjour {prenom}, vous êtes invité(e) au {event}. Découvrez votre invitation : {lien}`
  );
  const [selectedStatus, setSelectedStatus] = useState<GuestStatus | 'all'>('all');
  const [generatedLinks, setGeneratedLinks] = useState<Array<{guest: Guest; link: string}>>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateLink = (guest: Guest): string => {
    if (!event) return '';
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || '';
    return `${baseUrl}/e/${event.slug}?guest=${encodeURIComponent(guest.token)}`;
  };

  const handleGenerateLinks = () => {
    const filtered = guests.filter(g => selectedStatus === 'all' || g.status === selectedStatus);
    const links = filtered.map(guest => ({
      guest,
      link: generateLink(guest)
    }));
    setGeneratedLinks(links);
  };

  const handleCopyLink = (link: string, index: number) => {
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const openWhatsApp = (phone: string, link: string) => {
    const message = encodeURIComponent(messageTemplate
      .replace('{prenom}', phone ? phone.split(' ')[0] : 'Invité')
      .replace('{event}', event?.title || '')
      .replace('{lien}', link)
    );
    const cleanedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanedPhone}?text=${message}`, '_blank');
  };

  const filteredGuests = guests.filter(g => selectedStatus === 'all' || g.status === selectedStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Envoyer via WhatsApp</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par statut
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="all">Tous les invités</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmés</option>
              <option value="declined">Déclinés</option>
            </select>
          </div>

          {/* Template de message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message personnalisé
            </label>
            <textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={3}
              placeholder="Écrivez votre message..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Variables disponibles : {'{prenom}'}, {'{event}'}, {'{lien}'}
            </p>
          </div>

          {/* Bouton génération */}
          <button
            onClick={handleGenerateLinks}
            disabled={filteredGuests.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Générer les liens ({filteredGuests.length} invités)
          </button>

          {/* Liste des liens générés */}
          {generatedLinks.length > 0 && (
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Invité</th>
                    <th className="px-3 py-2 text-left">Téléphone</th>
                    <th className="px-3 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedLinks.map((item, index) => (
                    <tr key={item.guest.id} className="border-t">
                      <td className="px-3 py-2">{item.guest.name}</td>
                      <td className="px-3 py-2">{item.guest.phone || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleCopyLink(item.link, index)}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title="Copier le lien"
                          >
                            {copiedIndex === index ? (
                              <span className="text-emerald-600 text-xs">Copié!</span>
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                          {item.guest.phone && (
                            <button
                              onClick={() => openWhatsApp(item.guest.phone!, item.link)}
                              className="p-1.5 rounded hover:bg-green-100"
                              title="Envoyer via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4 text-green-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}