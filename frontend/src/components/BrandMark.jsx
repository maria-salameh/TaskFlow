// Logo TaskFlow : une case cochée au surligneur
export default function BrandMark({ size = 28 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path
        d="M9 16.5l4.5 4.5L23 11"
        fill="none"
        stroke="var(--marker)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
