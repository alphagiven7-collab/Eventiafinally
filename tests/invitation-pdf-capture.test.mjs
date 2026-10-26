import assert from 'node:assert/strict';
import { test } from 'node:test';
import { invitationPdfCaptureCss, invitationPdfPageCss, INVITATION_PDF_WIDTH } from '../src/lib/invitation/pdf-capture.ts';

test('PDF capture CSS shares a fixed page width and prevents animated photo overflow', () => {
  assert.equal(INVITATION_PDF_WIDTH, 448);
  assert.match(invitationPdfPageCss(), /@page\s*\{\s*size:\s*448px auto/);
  assert.match(invitationPdfPageCss(), /width:\s*448px/);

  const css = invitationPdfCaptureCss();
  assert.match(css, /#main-view\s*\{[^}]*width:\s*448px !important/s);
  assert.match(css, /\.gallery-flow-track\s*\{[^}]*display:\s*grid !important/s);
  assert.match(css, /\.gallery-flow-group\s*\{\s*display:\s*contents !important/s);
  assert.match(css, /\.dress-marquee-track\s*\{[^}]*animation:\s*none !important/s);
});

test('PDF capture CSS uses a caller-supplied width consistently', () => {
  assert.match(invitationPdfPageCss(512), /width:\s*512px/);
  assert.match(invitationPdfCaptureCss(512), /#main-view\s*\{[^}]*width:\s*512px !important/s);
});
