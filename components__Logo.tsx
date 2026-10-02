// CodePair mark: two code brackets facing each other, a dot where they meet.
export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="logo" aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path className="logo-a2" d="M20 12 8 24l12 12" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path className="logo-a1" d="M28 12l12 12-12 12" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle className="logo-dot" cx="24" cy="24" r="3.5" />
      </svg>
    </span>
  );
}
