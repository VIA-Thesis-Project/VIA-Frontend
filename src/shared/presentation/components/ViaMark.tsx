type ViaMarkProps = {
  size?: number;
};

/**
 * Brand mark for VIA, combining parcel furrows, viability path, and agricultural growth.
 */
export function ViaMark({ size = 36 }: ViaMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="VIA">
      <rect width="64" height="64" rx="16" fill="#064e3b" />
      <path d="M17 44C23 31 34 20 48 15" fill="none" stroke="#a7f3d0" strokeWidth="5" strokeLinecap="round" />
      <path d="M20 48C27 36 36 28 47 24" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 20C27 11 42 12 48 25C35 24 25 30 18 42C13 34 12 26 18 20Z" fill="#ecfdf5" />
      <path d="M23 27C29 24 35 22 43 22" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
      <circle cx="49" cy="15" r="4" fill="#fbbf24" />
      <circle cx="20" cy="48" r="3" fill="#fbbf24" />
    </svg>
  );
}
