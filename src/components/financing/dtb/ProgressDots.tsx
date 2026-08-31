'use client';

interface ProgressDotsProps {
  current: number;
  total?: number;
}

export function ProgressDots({ current, total = 6 }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-200 ${
            i < current
              ? 'w-2 bg-green-500'
              : i === current
              ? 'w-6 bg-foreground'
              : 'w-2 bg-border'
          }`}
        />
      ))}
      <span className="ml-auto text-xs text-tertiary">Step {current + 1} of {total}</span>
    </div>
  );
}
