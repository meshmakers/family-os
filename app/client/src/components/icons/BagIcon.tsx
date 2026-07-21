interface Props { size: number; color: string; }

export default function BagIcon({ size, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="18" height="13" rx="2"/>
      <path d="M8 9V7a4 4 0 0 1 8 0v2"/>
      <line x1="12" y1="13" x2="12" y2="17"/>
      <line x1="10" y1="15" x2="14" y2="15"/>
    </svg>
  );
}
