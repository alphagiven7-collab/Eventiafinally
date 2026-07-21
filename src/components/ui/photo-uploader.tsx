'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

// ============================================
// PhotoUploader — Drag & Drop, compression WebP, prévisualisation
// Usage mobile & desktop, pas d'URL à manipuler
// ============================================

interface PhotoUploaderProps {
  onPhotosChange: (photos: string[]) => void;
  existingPhotos?: string[];
  maxPhotos?: number;
  label?: string;
}

export default function PhotoUploader({
  onPhotosChange,
  existingPhotos = [],
  maxPhotos = 20,
  label = 'Ajouter des photos',
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compresser et convertir en WebP base64 (local-first, pas besoin de Supabase Storage pour la v1)
  const compressAndConvert = async (file: File): Promise<string> => {
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.8,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
    } catch {
      // Fallback : si la compression échoue, utiliser le fichier original
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (fileArray.length === 0) return;
      if (photos.length + fileArray.length > maxPhotos) {
        alert(`Maximum ${maxPhotos} photos autorisées.`);
        return;
      }

      setUploading(true);
      const newPhotos: string[] = [];

      for (const file of fileArray) {
        const dataUrl = await compressAndConvert(file);
        newPhotos.push(dataUrl);
      }

      const updated = [...photos, ...newPhotos];
      setPhotos(updated);
      onPhotosChange(updated);
      setUploading(false);
    },
    [photos, maxPhotos, onPhotosChange]
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
    setPhotos(updated);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} ({photos.length}/{maxPhotos})
      </label>

      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 ${
          dragOver
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 scale-[1.01]'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Compression en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Touchez pour ajouter des photos
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                JPG, PNG, HEIC • Max {maxPhotos}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Prévisualisation */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                aria-label={`Supprimer la photo ${index + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-0.5 left-0.5 px-1.5 py-0.5 bg-black/60 text-white text-[9px] rounded-full backdrop-blur-sm">
                  Couv.
                </span>
              )}
            </div>
          ))}
          {photos.length < maxPhotos && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-0.5 text-gray-400 dark:text-gray-500 hover:border-emerald-400 hover:text-emerald-500 transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px]">Ajouter</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}