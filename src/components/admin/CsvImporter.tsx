'use client';

import { useState } from 'react';
import { Guest } from '@/types';
import { X, Upload, FileText } from 'lucide-react';

interface CsvImporterProps {
  onImport: (guests: Guest[]) => void;
  onClose: () => void;
}

export default function CsvImporter({ onImport, onClose }: CsvImporterProps) {
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState<Guest[]>([]);
  const [error, setError] = useState('');

  const parseCSV = (csvText: string): Guest[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    // Délimiteur détecté (virgule ou point-virgule)
    const delimiter = lines[0].includes(';') ? ';' : ',';
    
    // Parser l'en-tête
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    
    const guests: Guest[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim());
      
      const guest: Guest = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
        event_id: '',
        name: values[headers.indexOf('nom')] || values[headers.indexOf('name')] || '',
        phone: values[headers.indexOf('téléphone')] || values[headers.indexOf('phone')] || '',
        email: values[headers.indexOf('email')] || '',
        group: values[headers.indexOf('groupe')] || values[headers.indexOf('group')] || '',
        status: 'pending',
        adults: parseInt(values[headers.indexOf('adultes')] || values[headers.indexOf('adults')]) || 1,
        children: parseInt(values[headers.indexOf('enfants')] || values[headers.indexOf('children')]) || 0,
        table_number: values[headers.indexOf('table')] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      };

      if (guest.name) {
        guests.push(guest);
      }
    }

    return guests;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      try {
        const guests = parseCSV(content);
        setPreview(guests);
        setError('');
      } catch (err) {
        setError('Erreur lors de la lecture du fichier CSV');
        setPreview([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (preview.length > 0) {
      onImport(preview);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Importer des invités (CSV)</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Format attendu :</h4>
            <p className="text-sm text-blue-700 mb-2">
              Votre fichier CSV doit contenir les colonnes suivantes :
            </p>
            <code className="text-xs bg-white p-2 rounded block">
              nom,téléphone,email,groupe,adultes,enfants,table
            </code>
            <p className="text-xs text-blue-600 mt-2">
              Exemple : Jean Dupont,+33612345678,jean@email.com,Famille,2,1,Table 5
            </p>
          </div>

          {/* Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Cliquez pour choisir un fichier CSV
              </span>
              <span className="text-xs text-gray-500">
                .csv jusqu'à 5MB
              </span>
            </label>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Aperçu ({preview.length} invités)
              </h4>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Nom</th>
                      <th className="px-3 py-2 text-left">Téléphone</th>
                      <th className="px-3 py-2 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((guest) => (
                      <tr key={guest.id} className="border-t">
                        <td className="px-3 py-2">{guest.name}</td>
                        <td className="px-3 py-2">{guest.phone || '-'}</td>
                        <td className="px-3 py-2">{guest.email || '-'}</td>
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-center text-gray-500">
                          ... et {preview.length - 10} autres invités
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleImport}
              disabled={preview.length === 0}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Importer {preview.length} invités
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}