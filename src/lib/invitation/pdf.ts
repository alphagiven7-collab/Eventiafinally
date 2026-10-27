import { EventWithSettings } from '@/types';
import { mountInvitationForCapture } from '@/components/invitation/InvitationExperience';
import { INVITATION_PDF_WIDTH } from '@/lib/invitation/pdf-capture';
import { invitationPdfFilename, invitationsZipFilename } from '@/lib/invitation/pdf-names';

export type InvitationPdfGuest = {
  id?: string;
  token?: string;
  name?: string;
  table?: string;
};

export type InvitationPdfFailure = {
  name: string;
  reason: string;
};

const MAX_PDF_EDGE = 14000;
const IMAGE_WAIT_MS = 6000;
const FONT_WAIT_MS = 4000;
const SLICE_TIMEOUT_MS = 40000;
const PDF_ZIP_CONCURRENCY = 3;
const PDF_SLICE_JPEG_QUALITY = 0.97;

type QrOverlay = {
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function captureQrOverlay(root: HTMLElement, main: HTMLElement): QrOverlay | null {
  const image = root.querySelector<HTMLImageElement>('#checkin-qr');
  if (!image?.complete || image.naturalWidth === 0 || !image.src.startsWith('data:image/')) return null;
  const style = getComputedStyle(image);
  if (style.display === 'none' || style.visibility === 'hidden') return null;

  const imageRect = image.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  if (imageRect.width === 0 || imageRect.height === 0) return null;

  return {
    dataUrl: image.src,
    x: imageRect.left - mainRect.left,
    y: imageRect.top - mainRect.top,
    width: imageRect.width,
    height: imageRect.height,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => { window.clearTimeout(timer); resolve(value); },
      (error) => { window.clearTimeout(timer); reject(error); },
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function fetchInvitationWebPdf(
  slug: string,
  guest?: InvitationPdfGuest | null,
): Promise<{ blob: Blob; filename: string }> {
  const url = new URL(`/api/invitations/${encodeURIComponent(slug)}/pdf`, window.location.origin);
  const current = new URL(window.location.href);
  for (const key of ['token', 'guest']) {
    const value = current.searchParams.get(key);
    if (value) url.searchParams.set(key, value);
  }
  if (guest?.token) url.searchParams.set('token', guest.token);
  let dark = document.documentElement.classList.contains('dark');
  try {
    dark = dark || localStorage.getItem('invitia_theme') === 'dark' || localStorage.getItem('theme') === 'dark';
  } catch {
    /* stockage indisponible */
  }
  url.searchParams.set('theme', dark ? 'dark' : 'light');

  const response = await fetch(url);
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(payload?.error || 'Le PDF n’a pas pu être généré.');
  }
  const disposition = response.headers.get('content-disposition') || '';
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `${slug}.pdf`;
  return { blob: await response.blob(), filename };
}

export async function downloadInvitationWebPdf(slug: string) {
  const result = await fetchInvitationWebPdf(slug);
  downloadBlob(result.blob, result.filename);
}

function canvasHeightLimit() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  return coarse ? 4096 : 8192;
}

function captureScale(limit: number) {
  const preferred = window.matchMedia?.('(pointer: coarse)').matches ? 1.25 : 1.75;
  const maxScale = Math.max(1, Math.floor((limit - 32) / 900));
  return Math.min(preferred, maxScale);
}

async function settleImages(root: ParentNode) {
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map((img) => {
    const source = img.getAttribute('src');
    if (!source) return Promise.resolve();
    img.loading = 'eager';
    img.decoding = 'sync';
    if (!source.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
      img.src = source;
    }
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      window.setTimeout(done, IMAGE_WAIT_MS);
    });
  }));
  const fonts = (root.ownerDocument ?? document).fonts;
  if (fonts?.ready) {
    await Promise.race([
      fonts.ready,
      new Promise<void>((resolve) => window.setTimeout(resolve, FONT_WAIT_MS)),
    ]);
  }
}

function inlineHero(root: HTMLElement) {
  const hero = root.querySelector('.hero-bg') as HTMLElement | null;
  if (!hero) return;
  const variable = getComputedStyle(root).getPropertyValue('--hero-image-url').trim();
  if (!variable) return;
  hero.style.backgroundImage = `linear-gradient(180deg, rgba(15, 10, 20, 0.45) 0%, rgba(15, 10, 20, 0.78) 100%), ${variable}`;
  hero.style.backgroundSize = 'cover';
  hero.style.backgroundPosition = getComputedStyle(root).getPropertyValue('--cover-position').trim() || '50% 50%';
}


const COLOR_PROPS = [
  'color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color',
  'border-left-color', 'outline-color', 'text-decoration-color', 'fill', 'stroke',
  'box-shadow', 'text-shadow',
];

// html2canvas ne comprend pas color(srgb …), que le navigateur renvoie pour color-mix().
function flattenModernColors(root: HTMLElement) {
  const view = root.ownerDocument.defaultView;
  if (!view) return;
  const probe = root.ownerDocument.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  const toRgb = (value: string) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000';
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  };
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  for (const node of nodes) {
    const computed = view.getComputedStyle(node);
    for (const prop of COLOR_PROPS) {
      const value = computed.getPropertyValue(prop);
      if (!value || !value.includes('color(')) continue;
      const fixed = value.replace(/color\([^)]*\)/g, (match) => toRgb(match));
      node.style.setProperty(prop, fixed, 'important');
    }
  }
}

// Une illustration SVG est rendue comme une image à part : currentColor y serait noir sans cette couleur explicite.
function inlineSvgColors(root: HTMLElement) {
  const view = root.ownerDocument.defaultView;
  if (!view) return;
  root.querySelectorAll<SVGElement>('svg').forEach((svg) => {
    const color = view.getComputedStyle(svg).color;
    if (color) svg.style.color = color;
  });
}

function assertGuest(root: HTMLElement, guest?: InvitationPdfGuest | null) {
  const name = guest?.name?.trim();
  if (name) {
    const shown = root.querySelector('#display-guest-name')?.textContent?.trim();
    if (shown !== name) {
      throw new Error('Le nom inscrit sur l’invitation ne correspond pas à cet invité.');
    }
  }
  const table = guest?.table?.trim() ?? '';
  const tableLine = root.querySelector('#guest-table-line') as HTMLElement | null;
  const visible = Boolean(tableLine && tableLine.style.display !== 'none' && tableLine.textContent?.trim());
  if (table) {
    if (!visible || !tableLine?.textContent?.includes(table)) {
      throw new Error('La table inscrite sur l’invitation ne correspond pas à cet invité.');
    }
  } else if (visible) {
    throw new Error('Une table a été ajoutée alors qu’aucune n’est enregistrée pour cet invité.');
  }
}

async function captureSlices(main: HTMLElement) {
  const { default: html2canvas } = await import('html2canvas');
  const limit = canvasHeightLimit();
  const scale = captureScale(limit);
  const sliceCss = Math.max(600, Math.floor((limit - 48) / scale));
  const total = Math.ceil(main.scrollHeight);
  if (total < 40) throw new Error('L’invitation est vide.');

  const frame = main.ownerDocument.defaultView?.frameElement as HTMLIFrameElement | null;
  const viewport = main.ownerDocument.getElementById('pdf-slice-window');
  const mover = main.ownerDocument.getElementById('pdf-slice-mover');
  if (!frame || !viewport || !mover) throw new Error('La préparation du PDF a échoué.');

  const slices: { canvas: HTMLCanvasElement; cssHeight: number }[] = [];
  try {
    for (let offset = 0; offset < total; offset += sliceCss) {
      const cssHeight = Math.min(sliceCss, total - offset);
      frame.style.height = `${cssHeight}px`;
      viewport.style.height = `${cssHeight}px`;
      mover.style.marginTop = `-${offset}px`;
      const canvas = await withTimeout(html2canvas(viewport, {
        imageTimeout: 8000,
        ignoreElements: (element) => ['IFRAME', 'VIDEO', 'AUDIO'].includes(element.tagName),
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#fafafa',
        width: INVITATION_PDF_WIDTH,
        height: cssHeight,
        windowWidth: INVITATION_PDF_WIDTH,
        windowHeight: cssHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        logging: false,
      }), SLICE_TIMEOUT_MS, 'Le PDF met trop de temps à se créer. Réessayez avec une meilleure connexion.');
      slices.push({ canvas, cssHeight });
    }
    return { slices, total };
  } catch (error) {
    slices.forEach((slice) => {
      slice.canvas.width = 1;
      slice.canvas.height = 1;
    });
    throw error;
  }
}

export async function generateInvitationPdf(
  event: EventWithSettings,
  guest?: InvitationPdfGuest | null,
): Promise<{ blob: Blob; filename: string }> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = `position:fixed;left:0;top:0;transform:translateX(-160vw);width:${INVITATION_PDF_WIDTH}px;height:800px;border:0;background:#fafafa;`;
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) {
    iframe.remove();
    throw new Error('Le navigateur n’a pas pu préparer le PDF.');
  }
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap"></head><body style="margin:0;background:#fafafa;width:${INVITATION_PDF_WIDTH}px;"><div id="pdf-slice-window" style="width:${INVITATION_PDF_WIDTH}px;overflow:hidden;background:#fafafa;"><div id="pdf-slice-mover"></div></div></body></html>`);
  doc.close();

  const stylesheet = doc.querySelector('link[rel="stylesheet"]');
  if (stylesheet) {
    await new Promise<void>((resolve) => {
      stylesheet.addEventListener('load', () => resolve(), { once: true });
      stylesheet.addEventListener('error', () => resolve(), { once: true });
      window.setTimeout(resolve, FONT_WAIT_MS);
    });
  }

  const mover = doc.getElementById('pdf-slice-mover');
  const viewport = doc.getElementById('pdf-slice-window');
  if (!mover || !viewport) {
    iframe.remove();
    throw new Error('Le navigateur n’a pas pu préparer le PDF.');
  }

  const mounted = mountInvitationForCapture(mover, event, {
    name: guest?.name,
    table: guest?.table,
  });

  try {
    mounted.root.querySelectorAll('iframe, video').forEach((node) => node.remove());
    viewport.style.height = 'auto';
    viewport.style.overflow = 'visible';
    iframe.style.height = '4000px';
    await settleImages(mounted.root);
    inlineHero(mounted.root);
    flattenModernColors(mounted.root);
    inlineSvgColors(mounted.root);
    assertGuest(mounted.root, guest);
    viewport.style.overflow = 'hidden';
    iframe.style.height = '800px';
    if (mounted.main.scrollHeight < 40) throw new Error('L’invitation est vide.');

    const qrOverlay = captureQrOverlay(mounted.root, mounted.main);
    const { slices, total } = await captureSlices(mounted.main);
    const fit = total > MAX_PDF_EDGE ? MAX_PDF_EDGE / total : 1;
    const pageWidth = INVITATION_PDF_WIDTH * fit;
    const pageHeight = total * fit;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      unit: 'px',
      format: [pageWidth, pageHeight],
      orientation: pageHeight >= pageWidth ? 'portrait' : 'landscape',
      hotfixes: ['px_scaling'],
      compress: true,
    });
    let cursor = 0;
    for (const slice of slices) {
      const image = slice.canvas.toDataURL('image/jpeg', PDF_SLICE_JPEG_QUALITY);
      const height = slice.cssHeight * fit;
      pdf.addImage(image, 'JPEG', 0, cursor, pageWidth, height, undefined, 'FAST');
      cursor += height;
      slice.canvas.width = 1;
      slice.canvas.height = 1;
    }
    if (qrOverlay) {
      pdf.addImage(
        qrOverlay.dataUrl,
        'PNG',
        qrOverlay.x * fit,
        qrOverlay.y * fit,
        qrOverlay.width * fit,
        qrOverlay.height * fit,
      );
    }
    if (pdf.getNumberOfPages() !== 1) {
      throw new Error('Le PDF devait tenir sur une seule page.');
    }
    const filename = invitationPdfFilename(event.title || 'Evenement', guest?.name, new Map());
    return { blob: pdf.output('blob'), filename };
  } finally {
    mounted.destroy();
    iframe.remove();
  }
}

export async function generateInvitationsZip(
  event: EventWithSettings,
  guests: InvitationPdfGuest[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ blob: Blob; filename: string; failures: InvitationPdfFailure[] }> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const used = new Map<string, number>();
  const total = guests.length;
  const failures: (InvitationPdfFailure | undefined)[] = new Array(total);
  const filenames = guests.map((guest) =>
    invitationPdfFilename(event.title || 'Evenement', guest.name, used),
  );
  let made = 0;
  let completed = 0;
  let nextIndex = 0;
  onProgress?.(0, total);

  const worker = async () => {
    while (nextIndex < guests.length) {
      const index = nextIndex;
      nextIndex += 1;
      const guest = guests[index];
      const label = guest.name?.trim() || `Invité ${index + 1}`;
      try {
        const guestInput = {
          id: guest.id,
          token: guest.token,
          name: guest.name?.trim() || '',
          table: guest.table,
        };
        const result = event.is_published && event.slug
          ? await fetchInvitationWebPdf(event.slug, guestInput)
          : await generateInvitationPdf(event, guestInput);
        zip.file(filenames[index], result.blob);
        made += 1;
      } catch (error) {
        failures[index] = {
          name: label,
          reason: error instanceof Error ? error.message : 'La génération a échoué.',
        };
      }
      completed += 1;
      onProgress?.(completed, total);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(PDF_ZIP_CONCURRENCY, guests.length) }, () => worker()),
  );
  const reportedFailures = failures.filter((failure): failure is InvitationPdfFailure => Boolean(failure));

  if (reportedFailures.length > 0 || made !== guests.length) {
    return { blob: new Blob(), filename: invitationsZipFilename(event.title || 'Evenement'), failures: reportedFailures };
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  return { blob, filename: invitationsZipFilename(event.title || 'Evenement'), failures: reportedFailures };
}
