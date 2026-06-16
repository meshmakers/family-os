import { useFamilyStore } from '../store/useFamilyStore';
import { MONTHS } from '../utils/dates';
import FamilyIcon from './icons/FamilyIcon';

interface Props { onSettings: () => void; }

export default function TopBar({ onSettings }: Props) {
  const names = useFamilyStore(s => s.names);
  const now   = new Date();
  const dateLabel = `${now.getDate()}. ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="topbar">
      <div className="logo">
        <div className="logo-icon">
          <FamilyIcon />
        </div>
        <div>
          <div className="logo-name">FamilyFlow</div>
          <div className="logo-date">{dateLabel}</div>
        </div>
      </div>
      <div className="topright">
        <div className="avatar av-mama" title={names.mama}>
          {names.mama.charAt(0).toUpperCase()}
        </div>
        <div className="avatar av-papa" title={names.papa}>
          {names.papa.charAt(0).toUpperCase()}
        </div>
        <button className="icon-btn" onClick={onSettings} title="Einstellungen">&#9881;</button>
      </div>
    </div>
  );
}
