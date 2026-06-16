import { useFamilyStore } from '../../store/useFamilyStore';
import RenderIcon from '../icons/RenderIcon';
import type { DayAssignment } from '../../types';
import { DN, MONTHS } from '../../utils/dates';

interface Props {
  dk: string;
  onClose: () => void;
}

export default function DayPopup({ dk, onClose }: Props) {
  const cats   = useFamilyStore(s => s.cats);
  const days   = useFamilyStore(s => s.days);
  const names  = useFamilyStore(s => s.names);
  const setCat = useFamilyStore(s => s.setCat);

  const dd      = days[dk] || {};
  const dateObj = new Date(dk + 'T12:00:00');
  const label   = `${DN[dateObj.getDay()]}, ${dateObj.getDate()}. ${MONTHS[dateObj.getMonth()]}`;

  const btns: { v: DayAssignment; cls: string; lbl: string }[] = [
    { v: 'mama', cls: 'mama', lbl: names.mama },
    { v: 'papa', cls: 'papa', lbl: names.papa },
    { v: 'none', cls: 'none', lbl: '–'        },
  ];

  return (
    <div className="popup-box">
      <div className="popup-title">
        <span>📅 {label}</span>
        <button className="del-btn" onClick={onClose} title="Schließen">✕</button>
      </div>
      {cats.map(c => {
        const cur     = (dd[c.id] || 'none') as DayAssignment;
        const bgColor = cur === 'mama' ? '#E8A0BF' : cur === 'papa' ? '#B5D4F4' : 'rgba(0,0,0,0.05)';
        const icColor = cur === 'mama' ? '#7a2d52' : cur === 'papa' ? '#0C447C' : '#b08898';
        return (
          <div key={c.id} className="cat-row">
            <div className="cat-icon-wrap" style={{ background: bgColor }}>
              <RenderIcon id={c.icon} size={16} color={icColor} />
            </div>
            <div className="cat-name">{c.name}</div>
            <div className="person-toggle">
              {btns.map(b => (
                <button
                  key={b.v}
                  className={`pt-btn ${b.cls} ${cur === b.v ? 'on' : ''}`}
                  onClick={() => setCat(dk, c.id, b.v)}
                >
                  {b.lbl}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
