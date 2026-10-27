export type InvitationPhotoOptimizationResult = {
  optimizedImages: number;
  optimizedBackgrounds: number;
  skipped: number;
  failed: number;
  objectUrls: string[];
};

export async function optimizeInvitationPhotos(root: HTMLElement): Promise<InvitationPhotoOptimizationResult> {
  const JPEG_QUALITY = 0.94;
  const MIN_SOURCE_BYTES = 64 * 1024;
  const MIN_SAVING_RATIO = 0.85;
  const MAX_IMAGE_PIXELS = 16_000_000;
  const result: InvitationPhotoOptimizationResult = {
    optimizedImages: 0,
    optimizedBackgrounds: 0,
    skipped: 0,
    failed: 0,
    objectUrls: [],
  };
  const optimizedSources = new Map<string, Promise<string | null>>();
  const getOptimizedSource = (source: string): Promise<string | null> => {
    const cached = optimizedSources.get(source);
    if (cached) return cached;

    const operation = (async () => {
      try {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Chargement de la photo impossible (${response.status}).`);
        const original = await response.blob();
        if (
          original.size < MIN_SOURCE_BYTES ||
          !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(original.type)
        ) {
          result.skipped += 1;
          return null;
        }

        const bitmap = await createImageBitmap(original);
        if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
          bitmap.close();
          result.skipped += 1;
          return null;
        }

        const canvas = root.ownerDocument.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          bitmap.close();
          throw new Error('Le navigateur ne peut pas traiter cette photo.');
        }
        context.drawImage(bitmap, 0, 0);
        bitmap.close();

        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let alpha = 3; alpha < pixels.length; alpha += 4) {
          if (pixels[alpha] !== 255) {
            canvas.width = 1;
            canvas.height = 1;
            result.skipped += 1;
            return null;
          }
        }

        const compressed = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
        });
        canvas.width = 1;
        canvas.height = 1;
        if (!compressed) throw new Error('La compression de cette photo a échoué.');
        if (compressed.size > original.size * MIN_SAVING_RATIO) {
          result.skipped += 1;
          return null;
        }

        const optimizedUrl = URL.createObjectURL(compressed);
        result.objectUrls.push(optimizedUrl);
        return optimizedUrl;
      } catch {
        result.failed += 1;
        return null;
      }
    })();

    optimizedSources.set(source, operation);
    return operation;
  };

  const photoImages = Array.from(root.querySelectorAll<HTMLImageElement>(
    'img:not(#checkin-qr):not(#gps-image):not(#map-image):not(#paper-motif-left):not(#paper-motif-right)',
  ));
  const imageSources = photoImages
    .filter((image) => image.naturalWidth > 0)
    .map((image) => image.currentSrc || image.src)
    .filter(Boolean);

  const backgrounds = Array.from(root.querySelectorAll<HTMLElement>('.hero-bg, .card-photo-bg'));
  const urlPattern = /url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g;
  const backgroundSources = backgrounds.flatMap((element) => {
    const backgroundImage = getComputedStyle(element).backgroundImage;
    return Array.from(backgroundImage.matchAll(urlPattern), (match) =>
      (match[1] || match[2] || match[3] || '').trim(),
    ).filter(Boolean);
  });
  const sources = [...new Set([...imageSources, ...backgroundSources])];
  let nextSource = 0;
  await Promise.all(Array.from({ length: Math.min(3, sources.length) }, async () => {
    while (nextSource < sources.length) {
      const source = sources[nextSource];
      nextSource += 1;
      await getOptimizedSource(source);
    }
  }));

  for (const image of photoImages) {
    const source = image.currentSrc || image.src;
    if (!source || image.naturalWidth === 0) continue;
    const optimizedUrl = await optimizedSources.get(source);
    if (!optimizedUrl) continue;
    image.removeAttribute('srcset');
    image.src = optimizedUrl;
    result.optimizedImages += 1;
  }

  for (const element of backgrounds) {
    const backgroundImage = getComputedStyle(element).backgroundImage;
    const matches = Array.from(backgroundImage.matchAll(urlPattern));
    let optimizedBackground = backgroundImage;
    for (const match of matches) {
      const source = (match[1] || match[2] || match[3] || '').trim();
      if (!source) continue;
      const optimizedUrl = await optimizedSources.get(source);
      if (!optimizedUrl) continue;
      optimizedBackground = optimizedBackground.replace(match[0], `url("${optimizedUrl}")`);
      result.optimizedBackgrounds += 1;
    }
    if (optimizedBackground !== backgroundImage) {
      element.style.backgroundImage = optimizedBackground;
    }
  }

  return result;
}
