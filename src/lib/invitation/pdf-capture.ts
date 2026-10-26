export const INVITATION_PDF_WIDTH = 448;

export function invitationPdfPageCss(width: number = INVITATION_PDF_WIDTH) {
  return `
    @page { size: ${width}px auto !important; margin: 0 !important; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: ${width}px !important;
      min-width: ${width}px !important;
      background: #fafafa !important;
    }
    .invitation-experience-host {
      display: block !important;
      width: ${width}px !important;
      max-width: ${width}px !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `;
}

export function invitationPdfCaptureCss(width: number = INVITATION_PDF_WIDTH) {
  return `
    .invitation-experience-root.pdf-capture #app-floating-tools,
    .invitation-experience-root.pdf-capture #offline-invitation-bar,
    .invitation-experience-root.pdf-capture audio,
    .invitation-experience-root.pdf-capture .inv-modal,
    .invitation-experience-root.pdf-capture #welcome-gate,
    .invitation-experience-root.pdf-capture .gallery-lightbox { display: none !important; }
    .invitation-experience-root.pdf-capture,
    .invitation-experience-root.pdf-capture * {
      animation: none !important;
      transition: none !important;
      content-visibility: visible !important;
      contain-intrinsic-size: none !important;
    }
    .invitation-experience-root.pdf-capture .gallery-tile img,
    .invitation-experience-root.pdf-capture .dress-marquee-track img {
      object-fit: contain !important;
      background: #f3f4f6;
    }
    .invitation-experience-root.pdf-capture #main-view {
      box-sizing: border-box !important;
      width: ${width}px !important;
      min-width: ${width}px !important;
      max-width: ${width}px !important;
      min-height: 0 !important;
      height: auto !important;
      overflow: visible !important;
      box-shadow: none !important;
      margin: 0 !important;
    }
    .invitation-experience-root.pdf-capture .hero-bg {
      height: 500px !important;
      min-height: 500px !important;
    }
    .invitation-experience-root.pdf-capture[data-template="fairepart"] .hero-bg {
      height: 220px !important;
      min-height: 180px !important;
    }
    .invitation-experience-root.pdf-capture .gallery-flow {
      overflow: visible !important;
      -webkit-mask-image: none !important;
      mask-image: none !important;
    }
    .invitation-experience-root.pdf-capture .gallery-flow-track {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      width: auto !important;
      transform: none !important;
      animation: none !important;
    }
    .invitation-experience-root.pdf-capture .gallery-flow-group {
      display: contents !important;
    }
    .invitation-experience-root.pdf-capture .gallery-flow-tile {
      width: 100% !important;
      height: 104px !important;
      min-width: 0 !important;
      box-shadow: none !important;
    }
    .invitation-experience-root.pdf-capture .dress-marquee-track {
      animation: none !important;
      transform: none !important;
    }
    .invitation-experience-root.pdf-capture section,
    .invitation-experience-root.pdf-capture .surface-card,
    .invitation-experience-root.pdf-capture .invitation-card,
    .invitation-experience-root.pdf-capture .gallery-mosaic,
    .invitation-experience-root.pdf-capture .dress-code-card {
      break-inside: avoid;
    }
  `;
}
