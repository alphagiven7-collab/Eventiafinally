'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { compressImageFile, formatDataUrlSize } from '@/lib/utils/image-compression';

interface PhotoUploaderProps {
  onPhotosChange: (photos: string[]) => void;
  existingPhotos?: string[];
  maxPhotos?: number;
  label?: string;
  onUseAsCover?: (photo: string) => void;
  coverPhoto?: string;
}

export default function PhotoUploader({
  onPhotosChange,
  existingPhotos = [],
  maxPhotos = 20,
  label = 'Ajouter des photos',
  onUseAsCover,
  coverPhoto,
}: PhotoUploaderProps) {
  const photos = existingPhotos;
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (uploading) return;
      setError('');
      const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(heic|heif|jpg|jpeg|png|webp)$/i.test(f.name));
      if (fileArray.length === 0) return;
      const remaining = maxPhotos - photos.length;
      if (remaining <= 0) {
        alert(`Maximum ${maxPhotos} photos autorisées.`);
        return;
      }
      const selectedFiles = fileArray.slice(0, remaining);

      setUploading(true);
      const newPhotos: string[] = [];

      try {
      for (const file of selectedFiles) {
        const dataUrl = await compressImageFile(file, {
          maxWidthOrHeight: 900,
          quality: 0.7,
          maxBytes: 70 * 1024,
        });
        newPhotos.push(dataUrl);
      }

      const updated = [...photos, ...newPhotos];
      onPhotosChange(updated);
      } catch {
        setError('Cette photo n’a pas pu être ajoutée. Réessayez avec un autre fichier.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [photos, maxPhotos, onPhotosChange, uploading]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  const movePhoto = (index: number, direction: number) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const updated = [...photos];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          {label} ({photos.length}/{maxPhotos})
        </label>
        {photos.length > 0 && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            Optimisées automatiquement
          </span>
        )}
      </div>

      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-label={label}
        aria-disabled={uploading}
        onKeyDown={(e) => { if (!uploading && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fileInputRef.current?.click(); } }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 scale-[1.01]'
            : 'border-gray-200 dark:border-gray-600 bg-gray-50/70 dark:bg-gray-800/50 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="w-7 h-7 text-blue-600 dark:text-blue-300 animate-spin" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Conversion et réduction des photos...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Touchez pour ajouter vos photos
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                Redimensionnées et converties automatiquement • Max {maxPhotos}
              </p>
            </div>
          </div>
        )}
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={`${index}-${photo.slice(-32)}`} className="min-w-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                <button type="button" disabled={uploading} onClick={() => removePhoto(index)} aria-label={`Supprimer la photo ${index + 1}`} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-50">
                  <X className="w-4 h-4" />
                </button>
                <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-1 text-[10px] text-white">{index + 1}</span>
              </div>
              <div className="space-y-1 p-2">
                <div className="flex items-center justify-between gap-1">
                  <button type="button" disabled={uploading || index === 0} onClick={() => movePhoto(index, -1)} aria-label={`Avancer la photo ${index + 1}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-violet-600 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
                  <span className="text-[10px] text-gray-500">{formatDataUrlSize(photo)}</span>
                  <button type="button" disabled={uploading || index === photos.length - 1} onClick={() => movePhoto(index, 1)} aria-label={`Reculer la photo ${index + 1}`} className="flex h-10 w-10 items-center justify-center rounded-lg text-violet-600 disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
                </div>
                {onUseAsCover && <button type="button" disabled={uploading || photo === coverPhoto} onClick={() => onUseAsCover(photo)} className="min-h-10 w-full rounded-lg bg-violet-50 px-2 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-200 disabled:opacity-60">{photo === coverPhoto ? 'Photo de couverture' : 'Utiliser comme couverture'}</button>}
              </div>
            </div>
          ))}
          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => { if (!uploading) fileInputRef.current?.click(); }}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:border-rose-400 hover:text-rose-500 transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px] font-medium">Ajouter</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
