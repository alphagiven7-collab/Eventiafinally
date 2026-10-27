export type InvitationPhotoOptimizationResult = {
  optimizedImages: number;
  optimizedBackgrounds: number;
  skipped: number;
  failed: number;
  originalBytes: number;
  optimizedBytes: number;
  objectUrls: string[];
};

export type InvitationPhotoDisplayTarget = {
  width: number;
  height: number;
  fit: 'cover' | 'contain';
};

export const INVITATION_PDF_PHOTO_PIXEL_RATIO = 1.25;

type PhotoSourceTask = {
  source: string;
  matteColor?: string;
  displayTargets: InvitationPhotoDisplayTarget[];
};

export function invitationPhotoOutputSize(
  sourceWidth: number,
  sourceHeight: number,
  displayTargets: InvitationPhotoDisplayTarget[],
  pixelRatio = INVITATION_PDF_PHOTO_PIXEL_RATIO,
) {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    displayTargets.length === 0 ||
    pixelRatio <= 0
  ) {
    return { width: sourceWidth, height: sourceHeight };
  }

  const scale = Math.min(1, Math.max(...displayTargets.map((target) => {
    const targetWidth = Math.max(1, target.width * pixelRatio);
    const targetHeight = Math.max(1, target.height * pixelRatio);
    return target.fit === 'cover'
      ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
      : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  })));

  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}

export async function optimizeInvitationPhotos(
  root: HTMLElement,
  pixelRatio: number,
): Promise<InvitationPhotoOptimizationResult> {
  const view = root.ownerDocument.defaultView;
  if (!view) throw new Error('Le navigateur ne peut pas lire les styles de l’invitation.');
  const getStyle = (element: Element) => view.getComputedStyle(element);
  const getOutputSize = (
    sourceWidth: number,
    sourceHeight: number,
    displayTargets: InvitationPhotoDisplayTarget[],
  ) => {
    const scale = Math.min(1, Math.max(...displayTargets.map((target) => {
      const targetWidth = Math.max(1, target.width * pixelRatio);
      const targetHeight = Math.max(1, target.height * pixelRatio);
      return target.fit === 'cover'
        ? Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight)
        : Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    })));
    return {
      width: Math.max(1, Math.round(sourceWidth * scale)),
      height: Math.max(1, Math.round(sourceHeight * scale)),
    };
  };
  const JPEG_QUALITY = 0.8;
  const WEBP_QUALITY = 0.84;
  const MIN_SOURCE_BYTES = 64 * 1024;
  const MAX_OUTPUT_RATIO = 1;
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
  const getOptimizedSource = (task: PhotoSourceTask): Promise<string | null> => {
    const { source, matteColor, displayTargets } = task;
    const cacheKey = `${source}\n${matteColor || 'preserve-alpha'}`;
    const cached = optimizedSources.get(cacheKey);
    if (cached) return cached;

    const operation = (async () => {
      try {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Chargement de la photo impossible (${response.status}).`);
        const original = await response.blob();
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(original.type)) {
          result.skipped += 1;
          return null;
        }

        const bitmap = await createImageBitmap(original);
        if (bitmap.width * bitmap.height > MAX_IMAGE_PIXELS) {
          bitmap.close();
          result.skipped += 1;
          return null;
        }
        const outputSize = getOutputSize(bitmap.width, bitmap.height, displayTargets);
        if (
          (bitmap.width === outputSize.width && bitmap.height === outputSize.height && original.size < MIN_SOURCE_BYTES)
        ) {
          bitmap.close();
          result.skipped += 1;
          return null;
        }

        const canvas = root.ownerDocument.createElement('canvas');
        canvas.width = outputSize.width;
        canvas.height = outputSize.height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          bitmap.close();
          throw new Error('Le navigateur ne peut pas traiter cette photo.');
        }
        if (matteColor) {
          context.fillStyle = matteColor;
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(bitmap, 0, 0, outputSize.width, outputSize.height);
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
          compressed.size >= original.size * MAX_OUTPUT_RATIO
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
  )).filter((image) => {
    const bounds = image.getBoundingClientRect();
    const style = getStyle(image);
    return bounds.width > 0 && bounds.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  });
  const matteColors = new Map(
    photoImages.map((image) => {
      let ancestor = image.parentElement;
      while (ancestor && root.contains(ancestor)) {
        const color = getStyle(ancestor).backgroundColor;
        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          return [image.currentSrc || image.src, color] as const;
        }
        if (ancestor === root) break;
        ancestor = ancestor.parentElement;
      }
      return [image.currentSrc || image.src, '#fafafa'] as const;
    }),
  );

  const backgrounds = Array.from(root.querySelectorAll<HTMLElement>('*')).filter((element) => {
    const style = getStyle(element);
    const bounds = element.getBoundingClientRect();
    return style.backgroundImage.includes('url(') &&
      bounds.width > 0 &&
      bounds.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden';
  });
  const urlPattern = /url\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/g;
  const sourceTasks = new Map<string, PhotoSourceTask>();
  const addSourceTarget = (
    source: string,
    matteColor: string | undefined,
    target: InvitationPhotoDisplayTarget,
  ) => {
    const cacheKey = `${source}\n${matteColor || 'preserve-alpha'}`;
    const task = sourceTasks.get(cacheKey) || { source, matteColor, displayTargets: [] };
    task.displayTargets.push(target);
    sourceTasks.set(cacheKey, task);
  };

  photoImages.forEach((image) => {
    const source = image.currentSrc || image.src;
    if (!source) return;
    const bounds = image.getBoundingClientRect();
    const fit = getStyle(image).objectFit === 'cover' ? 'cover' : 'contain';
    addSourceTarget(source, matteColors.get(source), {
      width: bounds.width,
      height: bounds.height,
      fit,
    });
  });

  backgrounds.forEach((element) => {
    const backgroundImage = getStyle(element).backgroundImage;
    const style = getStyle(element);
    const bounds = element.getBoundingClientRect();
    const fit = style.backgroundSize.split(',').some((size) => size.trim().startsWith('cover'))
      ? 'cover'
      : 'contain';
    for (const match of backgroundImage.matchAll(urlPattern)) {
      const source = (match[1] || match[2] || match[3] || '').trim();
      if (source) addSourceTarget(source, undefined, {
        width: bounds.width,
        height: bounds.height,
        fit,
      });
    }
  });

  let nextSource = 0;
  const tasks = Array.from(sourceTasks.values());
  await Promise.all(Array.from({ length: Math.min(3, tasks.length) }, async () => {
    while (nextSource < tasks.length) {
      const task = tasks[nextSource];
      nextSource += 1;
      await getOptimizedSource(task);
    }
  }));

  await Promise.all(photoImages.map(async (image) => {
    const source = image.currentSrc || image.src;
    if (!source) return;
    const cacheKey = `${source}\n${matteColors.get(source) || 'preserve-alpha'}`;
    const optimizedUrl = await optimizedSources.get(cacheKey);
    if (!optimizedUrl) return;
    image.removeAttribute('srcset');
    image.src = optimizedUrl;
    try {
      await image.decode();
      result.optimizedImages += 1;
    } catch {
      image.src = source;
      result.failed += 1;
    }
  }));

  for (const element of backgrounds) {
    const backgroundImage = getStyle(element).backgroundImage;
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
