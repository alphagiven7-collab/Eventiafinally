import sharp from 'sharp';

/** JPEG que WhatsApp accepte. Une image déjà légère est renvoyée telle quelle. */
export async function toShareJpeg(bytes: Buffer, sourceType: string): Promise<Buffer> {
  const jpeg = /jpe?g/i.test(sourceType);
  if (jpeg && bytes.byteLength > 0 && bytes.byteLength <= 180_000) return bytes;
  return sharp(bytes, { failOn: 'none', animated: false, limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}
