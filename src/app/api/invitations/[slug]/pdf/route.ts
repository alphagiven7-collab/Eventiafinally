import chromium from '@sparticuz/chromium';
import puppeteer, { type Page } from 'puppeteer-core';
import { NextResponse } from 'next/server';
import { invitationPdfCaptureCss, invitationPdfPageCss, INVITATION_PDF_WIDTH } from '@/lib/invitation/pdf-capture';
import { optimizeInvitationPhotos } from '@/lib/invitation/pdf-image-optimization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

let browserPromise: ReturnType<typeof puppeteer.launch> | null = null;

async function getBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    if (browser.connected) return browser;
    browserPromise = null;
  }

  browserPromise = puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: INVITATION_PDF_WIDTH, height: 900, deviceScaleFactor: 1 },
    executablePath: await executablePath(),
    headless: true,
  });
  try {
    return await browserPromise;
  } catch (error) {
    browserPromise = null;
    throw error;
  }
}

function safeFilename(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'invitation';
}

async function executablePath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    return chromium.executablePath();
  }
  return '/usr/bin/chromium';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const requestUrl = new URL(request.url);
  const invitationUrl = new URL(`/e/${encodeURIComponent(slug)}`, requestUrl.origin);

  for (const key of ['token', 'guest']) {
    const value = requestUrl.searchParams.get(key);
    if (value) invitationUrl.searchParams.set(key, value);
  }

  const theme = requestUrl.searchParams.get('theme') === 'dark' ? 'dark' : 'light';
  invitationUrl.searchParams.set('pdf', '1');

  let page: Page | null = null;
  const timings: Record<string, number> = {};
  const requestStarted = performance.now();
  try {
    let stageStarted = performance.now();
    const browser = await getBrowser();
    timings.browser = performance.now() - stageStarted;
    page = await browser.newPage();
    await page.setViewport({ width: INVITATION_PDF_WIDTH, height: 900, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument((savedTheme) => {
      localStorage.setItem('invitia_theme', savedTheme);
      localStorage.setItem('theme', savedTheme);
    }, theme);
    stageStarted = performance.now();
    await page.goto(invitationUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.emulateMediaType('screen');
    await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>('.invitation-experience-host');
      const root = host?.shadowRoot?.querySelector<HTMLElement>('.invitation-experience-root');
      if (!root) return;
      root.classList.add('pdf-capture');
      root.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
        image.loading = 'eager';
        image.decoding = 'sync';
      });
      root.querySelectorAll<HTMLElement>('*').forEach((element) => {
        element.style.contentVisibility = 'visible';
        element.style.containIntrinsicSize = 'auto';
      });
    });
    await page.waitForFunction(() => {
      const host = document.querySelector<HTMLElement>('.invitation-experience-host');
      const root = host?.shadowRoot?.querySelector<HTMLElement>('.invitation-experience-root');
      const main = root?.querySelector<HTMLElement>('#main-view');
      return Boolean(main && main.scrollHeight > 200);
    }, { timeout: 30000 });
    timings.page = performance.now() - stageStarted;
    stageStarted = performance.now();
    await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>('.invitation-experience-host');
      const root = host?.shadowRoot?.querySelector<HTMLElement>('.invitation-experience-root');
      if (!root) return;
      const images = Array.from(root.querySelectorAll<HTMLImageElement>('img')).filter((image) => {
        const bounds = image.getBoundingClientRect();
        const style = getComputedStyle(image);
        return bounds.width > 0 && bounds.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });
      return Promise.race([
        Promise.all(images.map((image) => image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          }))),
        new Promise<void>((resolve) => setTimeout(resolve, 1200)),
      ]);
    });
    timings.images = performance.now() - stageStarted;
    stageStarted = performance.now();
    const invitationRoot = await page.evaluateHandle(() => {
      const host = document.querySelector<HTMLElement>('.invitation-experience-host');
      const root = host?.shadowRoot?.querySelector<HTMLElement>('.invitation-experience-root');
      if (!root) throw new Error('Le conteneur de l’invitation est introuvable.');
      return root;
    });
    const imageOptimization = await page.evaluate(optimizeInvitationPhotos, invitationRoot);
    await invitationRoot.dispose();
    if (imageOptimization.failed > 0) {
      console.warn('Certaines photos de l’invitation n’ont pas pu être optimisées.', {
        slug,
        failed: imageOptimization.failed,
      });
    }
    timings.optimize = performance.now() - stageStarted;
    stageStarted = performance.now();
    await page.addStyleTag({
      content: invitationPdfPageCss(INVITATION_PDF_WIDTH),
    });
    const widths = await page.evaluate(async ({ invitationWidth, captureCss }) => {
      await document.fonts.ready;
      const host = document.querySelector<HTMLElement>('.invitation-experience-host');
      const root = host?.shadowRoot?.querySelector<HTMLElement>('.invitation-experience-root');
      const main = root?.querySelector<HTMLElement>('#main-view');
      if (!host || !root || !main) {
        throw new Error('Le conteneur de l’invitation est introuvable.');
      }
      root.classList.toggle('pdf-capture', true);
      const style = document.createElement('style');
      style.textContent = captureCss;
      root.append(style);
      for (const element of [host, root, main]) {
        element.style.setProperty('box-sizing', 'border-box', 'important');
        element.style.setProperty('width', `${invitationWidth}px`, 'important');
        element.style.setProperty('min-width', `${invitationWidth}px`, 'important');
        element.style.setProperty('max-width', `${invitationWidth}px`, 'important');
      }
      main.style.setProperty('margin', '0', 'important');
      return {
        host: host.getBoundingClientRect().width,
        root: root.getBoundingClientRect().width,
        main: main.getBoundingClientRect().width,
        documentScroll: document.documentElement.scrollWidth,
        mainScroll: main.scrollWidth,
      };
    }, {
      invitationWidth: INVITATION_PDF_WIDTH,
      captureCss: invitationPdfCaptureCss(INVITATION_PDF_WIDTH),
    });
    if (Object.values(widths).some((width) => Math.abs(width - INVITATION_PDF_WIDTH) > 0.5)) {
      throw new Error(`Dimensions d’invitation incorrectes : ${JSON.stringify(widths)} px; page et contenu attendus à ${INVITATION_PDF_WIDTH} px.`);
    }
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const title = await page.title();
    const height = await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>('.invitation-experience-host');
      const root = host?.shadowRoot?.querySelector<HTMLElement>('.invitation-experience-root');
      const main = root?.querySelector<HTMLElement>('#main-view');
      if (!host || !root || !main) {
        throw new Error('Le conteneur de l’invitation est introuvable.');
      }
      const contentHeight = Math.max(1, main.scrollHeight);
      for (const element of [document.documentElement, document.body, host, root, main]) {
        element.style.setProperty('height', `${contentHeight}px`, 'important');
      }
      for (const element of [document.documentElement, document.body]) {
        element.style.setProperty('overflow', 'hidden', 'important');
      }
      return contentHeight;
    });
    const pdf = await page.pdf({
      width: `${INVITATION_PDF_WIDTH}px`,
      height: `${height}px`,
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });
    timings.render = performance.now() - stageStarted;
    if (imageOptimization.objectUrls.length > 0) {
      await page.evaluate((urls) => urls.forEach((url) => URL.revokeObjectURL(url)), imageOptimization.objectUrls);
    }
    const filename = `${safeFilename(title.replace(/\s*[|\-–—].*$/, '').trim())}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
        'Server-Timing': [
          `browser;dur=${timings.browser.toFixed(1)}`,
          `page;dur=${timings.page.toFixed(1)}`,
          `images;dur=${timings.images.toFixed(1)}`,
          `optimize;dur=${timings.optimize.toFixed(1)}`,
          `render;dur=${timings.render.toFixed(1)}`,
          `total;dur=${(performance.now() - requestStarted).toFixed(1)}`,
        ].join(', '),
      },
    });
  } catch (error) {
    console.error('Invitation PDF generation failed:', error);
    const message = error instanceof Error ? error.message : 'Erreur Chromium inconnue.';
    return NextResponse.json({ error: `Génération PDF impossible : ${message}` }, { status: 500 });
  } finally {
    await page?.close();
  }
}
