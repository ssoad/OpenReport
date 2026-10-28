import { rgb, RGB } from 'pdf-lib';

export function hexToRgb(hex?: string): RGB {
  if (!hex) return rgb(0, 0, 0);

  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }

  if (clean.length !== 6) {
    return rgb(0, 0, 0);
  }

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  return rgb(
    isNaN(r) ? 0 : r,
    isNaN(g) ? 0 : g,
    isNaN(b) ? 0 : b
  );
}
