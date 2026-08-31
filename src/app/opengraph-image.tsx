import { ImageResponse } from 'next/og';
import { BrandOgCard, OG_SIZE, OG_ALT } from '@/lib/og/brand-card';

export const runtime = 'edge';
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(<BrandOgCard />, { ...size });
}
