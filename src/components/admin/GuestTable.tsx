'use client';

import { Guest, GuestStatus } from '@/types';
import { Search, Edit, Trash2, Check, X } from 'lucide-react';
import { useState } from 'react';

interface GuestTableProps {
  guests: Guest[];
  onEdit: (guest: Guest) => void;
  onDelete: (guestId: string) => void;
  onStatusChange: (guestId: string, status: GuestStatus) => void;
}

export default function GuestTable({ guests, onEdit, onDelete, onStatusChange }: GuestTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | GuestStatus>('all');

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.phone?.includes(searchTerm) ||
                         guest.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || guest.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: GuestStatus) => {
    const styles = {
      confirmed: 'bg-emerald-100 text-emerald-700',
      declined: 'bg-rose-100 text-rose-700',
      pending: 'bg-amber-100 text-amber-700'
    };
    const labels = {
      confirmed: 'Confirmé',
      declined: 'Décliné',
      pending: 'En attente'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header avec filtres */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un invité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="declined">Décliné</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Téléphone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Email</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Pers.</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredGuests.map((guest) => (
              <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{guest.name}</p>
                    {guest.group && (
                      <p className="text-xs text-gray-500">{guest.group}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                  {guest.phone || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                  {guest.email || '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  {getStatusBadge(guest.status)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {guest.adults}A / {guest.children}E
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => onStatusChange(guest.id, 'confirmed')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        guest.status === 'confirmed' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                      title="Confirmer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onStatusChange(guest.id, 'declined')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        guest.status === 'declined' 
                          ? 'bg-rose-100 text-rose-700' 
                          : 'text-gray-400 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                      title="Décliner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(guest)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(guest.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredGuests.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'Aucun invité ne correspond à vos filtres' 
              : 'Aucun invité pour cet événement'}
          </p>
        </div>
      )}
    </div>
  );
}