import { useState } from 'react';
import { useFamilyStore } from '../../store/useFamilyStore';
import RenderIcon from '../icons/RenderIcon';

const ALL_ICONS = ['bag', 'bike', 'school', 'car', 'cook', 'shop', 'heart', 'star', 'clock', 'run', 'music', 'paw', 'ball', 'swim'];
const ICON_LABELS: Record<string, string> = {
  bag:'Tasche', bike:'Fahrrad', school:'Schule', car:'Auto', cook:'Kochen',
  shop:'Einkauf', heart:'Herz', star:'Stern', clock:'Zeit', run:'Laufen',
  music:'Musik', paw:'Tier', ball:'Sport', swim:'Schwimmen',
};

interface Props { onClose: () => void; }

export default function SettingsModal({ onClose }: Props) {
  const names      = useFamilyStore(s => s.names);
  const cats       = useFamilyStore(s => s.cats);
  const saveNames  = useFamilyStore(s => s.saveNames);
  const setCatName = useFamilyStore(s => s.setCatName);
  const setCatIcon = useFamilyStore(s => s.setCatIcon);

  const [mama, setMama] = useState(names.mama);
  const [papa, setPapa] = useState(names.papa);

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-hd">⚙ Einstellungen</div>

        <div className="settings-section">Personen</div>
        <div className="settings-row">
          <label>Person 1</label>
          <input type="text" value={mama} onChange={e => setMama(e.target.value)}
            placeholder="z.B. Mama" style={{ flex: 1 }} />
        </div>
        <div className="settings-row">
          <label>Person 2</label>
          <input type="text" value={papa} onChange={e => setPapa(e.target.value)}
            placeholder="z.B. Papa" style={{ flex: 1 }} />
        </div>

        <div className="settings-section">Tages-Kategorien</div>
        {cats.map((c, i) => (
          <div key={c.id} className="cat-edit-row">
            <input
              type="text" value={c.name}
              onChange={e => setCatName(i, e.target.value)}
              style={{ width: '100%', marginBottom: 6, borderColor: 'var(--pink-mid)' }}
            />
            <div className="icon-pick">
              {ALL_ICONS.map(ic => (
                <div
                  key={ic}
                  className={`ip ${c.icon === ic ? 'sel' : ''}`}
                  onClick={() => setCatIcon(i, ic)}
                  title={ICON_LABELS[ic] || ic}
                >
                  <RenderIcon id={ic} size={16} color={c.icon === ic ? '#7a2d52' : '#b08898'} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn-main" onClick={() => { saveNames(mama, papa); onClose(); }}>
            Speichern
          </button>
          <button className="btn-ghost" onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}
