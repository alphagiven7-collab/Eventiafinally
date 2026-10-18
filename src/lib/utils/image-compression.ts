/**
 * Utilitaire de compression et redimensionnement d'images côté client via Canvas.
 * Convertit automatiquement les photos en WebP (avec repli JPEG sur les navigateurs
 * ne supportant pas l'encodage WebP) afin que les images soient légères, rapides à
 * enregistrer dans Supabase et immédiatement visibles sur l'invitation.
 */

export interface ImageConvertOptions {
  maxWidthOrHeight?: number;
  quality?: number;
  maxBytes?: number;
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  const webp = canvas.toDataURL('image/webp', quality);
  if (webp.startsWith('data:image/webp')) {
    return webp;
  }
  return canvas.toDataURL('image/jpeg', quality);
}

export async function compressImageFile(
  file: File,
  options: ImageConvertOptions = {}
): Promise<string> {
  const maxDim = options.maxWidthOrHeight ?? 1100;
  const initialQuality = options.quality ?? 0.78;
  const maxBytes = options.maxBytes ?? 180 * 1024;

  try {
    const img = await loadImage(file);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = initialQuality;
    let dataUrl = canvasToDataUrl(canvas, quality);

    // Si l'image dépasse encore le budget, abaisser progressivement la qualité ou la taille
    while (dataUrl.length * 0.75 > maxBytes && quality > 0.45) {
      quality = Math.round((quality - 0.1) * 100) / 100;
      dataUrl = canvasToDataUrl(canvas, quality);
    }

    if (dataUrl.length * 0.75 > maxBytes && canvas.width > 640) {
      const scale = 0.75;
      const smaller = document.createElement('canvas');
      smaller.width = Math.max(1, Math.round(canvas.width * scale));
      smaller.height = Math.max(1, Math.round(canvas.height * scale));
      const sctx = smaller.getContext('2d');
      if (sctx) {
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = 'high';
        sctx.drawImage(canvas, 0, 0, smaller.width, smaller.height);
        dataUrl = canvasToDataUrl(smaller, Math.max(0.55, quality));
      }
    }

    return dataUrl;
  } catch {
    // Repli avec browser-image-compression si disponible
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.18,
        maxWidthOrHeight: maxDim,
        useWebWorker: false,
        fileType: 'image/webp',
        initialQuality,
      });
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
    } catch {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
}

export function formatDataUrlSize(dataUrl: string): string {
  if (!dataUrl || !dataUrl.startsWith('data:')) return '';
  const bytes = Math.round((dataUrl.length * 3) / 4);
  if (bytes < 1024) return `${bytes} o`;
  return `${Math.round(bytes / 1024)} Ko`;
}
