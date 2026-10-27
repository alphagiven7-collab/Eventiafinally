export type InvitationPhotoOptimizationResult = {
  optimizedImages: number;
  optimizedBackgrounds: number;
  skipped: number;
  failed: number;
  originalBytes: number;
  optimizedBytes: number;
  objectUrls: string[];
};

export async function optimizeInvitationPhotos(root: HTMLElement): Promise<InvitationPhotoOptimizationResult> {
  const JPEG_QUALITY = 0.92;
  const WEBP_QUALITY = 0.94;
  const MIN_SOURCE_BYTES = 64 * 1024;
  const MIN_SAVING_RATIO = 0.98;
  const MAX_IMAGE_PIXELS = 16_000_000;
  const result: InvitationPhotoOptimizationResult = {
    optimizedImages: 0,
    optimizedBackgrounds: 0,
    skipped: 0,
    failed: 0,
    originalBytes: 0,
    optimizedBytes: 0,
    objectUrls: [],
  };
  const optimizedSources = new Map<string, Promise<string | null>>();
  const getOptimizedSource = (source: string, matteColor?: string): Promise<string | null> => {
    const cacheKey = `${source}\n${matteColor || 'preserve-alpha'}`;
    const cached = optimizedSources.get(cacheKey);
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
        if (matteColor) {
          context.fillStyle = matteColor;
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(bitmap, 0, 0);
        bitmap.close();

        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let hasTransparency = false;
        for (let alpha = 3; alpha < pixels.length; alpha += 4) {
          if (pixels[alpha] !== 255) {
            hasTransparency = true;
            break;
          }
        }

        const compressed = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(
            resolve,
            hasTransparency ? 'image/webp' : 'image/jpeg',
            hasTransparency ? WEBP_QUALITY : JPEG_QUALITY,
          );
        });
        canvas.width = 1;
        canvas.height = 1;
        if (!compressed) throw new Error('La compression de cette photo a échoué.');
        if (
          (hasTransparency && compressed.type !== 'image/webp') ||
          compressed.size > original.size * MIN_SAVING_RATIO
        ) {
          result.skipped += 1;
          return null;
        }

        const optimizedUrl = URL.createObjectURL(compressed);
        result.objectUrls.push(optimizedUrl);
        result.originalBytes += original.size;
        result.optimizedBytes += compressed.size;
        return optimizedUrl;
      } catch {
        result.failed += 1;
        return null;
      }
    })();

    optimizedSources.set(cacheKey, operation);
    return operation;
  };

  const photoImages = Array.from(root.querySelectorAll<HTMLImageElement>(
    'img:not(#checkin-qr):not(#gps-image):not(#map-image):not(#paper-motif-left):not(#paper-motif-right)',
  ));
  const imageSources = photoImages
    .filter((image) => image.naturalWidth > 0)
    .map((image) => image.currentSrc || image.src)
    .filter(Boolean);
  const matteColors = new Map(
    photoImages.map((image) => {
      let ancestor = image.parentElement;
      while (ancestor && root.contains(ancestor)) {
        const color = getComputedStyle(ancestor).backgroundColor;
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          return [image.currentSrc || image.src, color] as const;
        }
        if (ancestor === root) break;
        ancestor = ancestor.parentElement;
      }
      return [image.currentSrc || image.src, '#fafafa'] as const;
    }),
  );

  const backgrounds = Array.from(root.querySelectorAll<HTMLElement>('.hero-bg, .card-photo-bg'));
  const urlPattern = /url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g;
  const backgroundSources = backgrounds.flatMap((element) => {
    const backgroundImage = getComputedStyle(element).backgroundImage;
    return Array.from(backgroundImage.matchAll(urlPattern), (match) =>
      (match[1] || match[2] || match[3] || '').trim(),
    ).filter(Boolean);
  });
  const sourceTasks: { source: string; matteColor?: string }[] = [
    ...imageSources.map((source) => ({ source, matteColor: matteColors.get(source) })),
    ...backgroundSources.map((source) => ({ source, matteColor: undefined })),
  ].filter((task, index, tasks) =>
    tasks.findIndex((candidate) =>
      candidate.source === task.source && candidate.matteColor === task.matteColor,
    ) === index,
  );
  let nextSource = 0;
  await Promise.all(Array.from({ length: Math.min(3, sourceTasks.length) }, async () => {
    while (nextSource < sourceTasks.length) {
      const task = sourceTasks[nextSource];
      nextSource += 1;
      await getOptimizedSource(task.source, task.matteColor);
    }
  }));

  for (const image of photoImages) {
    const source = image.currentSrc || image.src;
    if (!source || image.naturalWidth === 0) continue;
    const cacheKey = `${source}\n${matteColors.get(source) || 'preserve-alpha'}`;
    const optimizedUrl = await optimizedSources.get(cacheKey);
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
      const optimizedUrl = await optimizedSources.get(`${source}\npreserve-alpha`);
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
