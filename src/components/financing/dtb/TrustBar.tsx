'use client';

const items = [
  { icon: 'shield', label: 'Bank-grade secure' },
  { icon: 'check', label: 'No collateral needed' },
  { icon: 'check', label: 'Direct to school' },
];

export function TrustBar() {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs text-secondary"
        >
          {item.icon === 'shield' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
