import { useState } from 'react';
import { Compass, Mountain, Timer } from 'lucide-react';
import type { TerrainType } from '../types/club.ts';

interface RouteImageProps {
  src: string;
  alt: string;
  terrain?: TerrainType;
  label?: string;
  className?: string;
}

export function RouteImage({
  src,
  alt,
  terrain = 'road',
  label,
  className = 'w-full h-full object-cover',
}: RouteImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    const Icon = terrain === 'trail' ? Mountain : terrain === 'track' ? Timer : Compass;
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1C2024] via-[#252A30] to-[#14171A] text-[#D8DAD5] p-6 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon className="w-7 h-7 text-[#D9411E]" aria-hidden="true" />
        <span className="font-display text-lg font-semibold tracking-wide text-center">
          {label || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
