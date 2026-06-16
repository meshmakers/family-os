import BagIcon from './BagIcon';
import BikeIcon from './BikeIcon';

const EMOJI_ICONS: Record<string, string> = {
  school: '🏫', car: '🚗', cook: '👨‍🍳', shop: '🛍️',
  heart: '❤️', star: '⭐', clock: '⏰', run: '🏃',
  music: '🎵', paw: '🐾', ball: '⚽', swim: '🏊',
};

interface Props { id: string; size: number; color: string; }

export default function RenderIcon({ id, size, color }: Props) {
  if (id === 'bag')  return <BagIcon  size={size} color={color} />;
  if (id === 'bike') return <BikeIcon size={size} color={color} />;
  if (EMOJI_ICONS[id]) return <span style={{ fontSize: size - 2 }}>{EMOJI_ICONS[id]}</span>;
  return <span>📌</span>;
}
