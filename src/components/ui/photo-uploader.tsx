'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImageFile, formatDataUrlSize } from '@/lib/utils/image-compression';

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

  useEffect(() => {
    setPhotos(existingPhotos);
  }, [existingPhotos]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
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

      for (const file of selectedFiles) {
        const dataUrl = await compressImageFile(file, {
          maxWidthOrHeight: 900,
          quality: 0.7,
          maxBytes: 70 * 1024,
        });
        newPhotos.push(dataUrl);
      }

      const updated = [...photos, ...newPhotos];
      setPhotos(updated);
      onPhotosChange(updated);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
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
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {photos.map((photo, index) => {
            const sizeLabel = formatDataUrlSize(photo);
            return (
              <div
                key={index}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(index);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition shadow"
                  aria-label={`Supprimer la photo ${index + 1}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1 pointer-events-none">
                  {index === 0 ? (
                    <span className="px-1.5 py-0.5 bg-rose-600/90 text-white text-[9px] font-medium rounded-md">
                      Principale
                    </span>
                  ) : (
                    <span />
                  )}
                  {sizeLabel && (
                    <span className="px-1.5 py-0.5 bg-black/60 text-white text-[9px] rounded-md">
                      {sizeLabel}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
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
