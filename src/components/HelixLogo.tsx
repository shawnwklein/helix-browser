export function HelixLogo({
  spinning,
  size = 22,
}: {
  spinning?: boolean;
  size?: number;
}) {
  return (
    <svg
      className={`helix-mark${spinning ? " spin" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <path
        className="s1"
        d="M10 4c6 4 6 8 0 12s-6 8 0 12"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        className="s2"
        d="M22 4c-6 4-6 8 0 12s6 8 0 12"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="16" cy="10" r="1.35" fill="#F4EDE1" />
      <circle cx="16" cy="16" r="1.35" fill="#F4EDE1" />
      <circle cx="16" cy="22" r="1.35" fill="#F4EDE1" />
    </svg>
  );
}
