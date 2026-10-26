import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const INVITATION_WIDTH = 448;

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

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: INVITATION_WIDTH, height: 900, deviceScaleFactor: 1 },
      executablePath: await executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.evaluateOnNewDocument((savedTheme) => {
      localStorage.setItem('invitia_theme', savedTheme);
      localStorage.setItem('theme', savedTheme);
    }, theme);
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
    await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>('.invitation-experience-host');
      const root = host?.shadowRoot?.querySelector<HTMLElement>('.invitation-experience-root');
      if (!root) return;
      const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
      return Promise.race([
        Promise.all(images.map((image) => image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          }))),
        new Promise<void>((resolve) => setTimeout(resolve, 12000)),
      ]);
    });
    await page.addStyleTag({
      content: `
        @page { size: 448px auto !important; margin: 0 !important; }
        html, body { margin: 0 !important; padding: 0 !important; width: 448px !important; min-width: 448px !important; background: #fafafa !important; }
        .invitation-experience-host { display: block !important; width: 448px !important; max-width: 448px !important; margin: 0 !important; padding: 0 !important; }
      `,
    });
    await page.evaluate(async () => {
      await document.fonts.ready;
      const host = document.querySelector<HTMLElement>('.invitation-experience-host');
      const root = host?.shadowRoot?.querySelector<HTMLElement>('.invitation-experience-root');
      if (!root) return;
      root.classList.toggle('pdf-capture', true);
      const style = document.createElement('style');
      style.textContent = `
        @page { size: 448px auto; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; width: 448px !important; background: #fafafa !important; }
        #app-floating-tools, #offline-invitation-bar, audio, .inv-modal, #welcome-gate, .gallery-lightbox { display: none !important; }
        #main-view { width: 448px !important; max-width: 448px !important; min-height: 0 !important; height: auto !important; margin: 0 !important; box-shadow: none !important; overflow: visible !important; }
        section[id], img { content-visibility: visible !important; contain-intrinsic-size: none !important; }
        .gallery-tile img, .dress-marquee-track img { object-fit: contain !important; background: #f3f4f6 !important; }
        .gallery-flow, .dress-marquee-wrapper { overflow: visible !important; }
        .gallery-flow-track, .dress-marquee-track { animation: none !important; transform: none !important; }
        section, .surface-card, .invitation-card, .gallery-mosaic, .dress-code-card { break-inside: avoid; }
      `;
      root.append(style);
    });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const title = await page.title();
    const height = await page.evaluate(() => {
      const host = document.querySelector<HTMLElement>('.invitation-experience-host');
      const main = host?.shadowRoot?.querySelector<HTMLElement>('#main-view');
      return Math.max(1, main?.scrollHeight || 1);
    });
    const pdf = await page.pdf({
      width: `${INVITATION_WIDTH}px`,
      height: `${height}px`,
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });
    const filename = `${safeFilename(title.replace(/\s*[|\-–—].*$/, '').trim())}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Invitation PDF generation failed:', error);
    const message = error instanceof Error ? error.message : 'Erreur Chromium inconnue.';
    return NextResponse.json({ error: `Génération PDF impossible : ${message}` }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
