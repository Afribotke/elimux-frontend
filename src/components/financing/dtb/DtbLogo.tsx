'use client';

import Image from 'next/image';

interface DtbLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function DtbLogo({ width = 120, height = 40, className = '' }: DtbLogoProps) {
  return (
    <Image
      src="/dtb-logo.png"
      alt="Diamond Trust Bank"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain' }}
      priority
    />
  );
}
