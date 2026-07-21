interface Props { size: number; color: string; }

export default function BikeIcon({ size, color }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 20" fill="none"
      stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4.5" cy="14.5" r="4"/>
      <circle cx="19.5" cy="14.5" r="4"/>
      <path d="M4.5 14.5 L9 7 L14 7 L19.5 14.5"/>
      <path d="M14 7 L16 4 L19 4"/>
      <path d="M9 7 L12 14.5"/>
      <rect x="21" y="11" width="5" height="4" rx="1"/>
      <path d="M23 11 L23 9 L25 9"/>
      <path d="M21 13 L19.5 14.5"/>
    </svg>
  );
}
