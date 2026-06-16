import { useState } from 'react';
import { useFamilyStore, STICKER_DEFS } from '../../store/useFamilyStore';

function getLevel(pts: number) {
  if (pts >= 500) return 5;
  if (pts >= 200) return 4;
  if (pts >= 100) return 3;
  if (pts >= 50)  return 2;
  return 1;
}

export default function GamePanel() {
  const [open, setOpen] = useState(false);
  const names  = useFamilyStore(s => s.names);
  const scores = useFamilyStore(s => s.scores);
  const earned = useFamilyStore(s => s.earned);

  const { mama: m, papa: p } = scores;
  const total     = m + p || 1;
  const mamaW     = Math.round((m / total) * 100);
  const earnedSet = new Set(earned);
  const earnedCount = earned.length;

  return (
    <div className="game-panel">
      <div
        className="game-hd"
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', userSelect: 'none', marginBottom: open ? 10 : 0 }}
      >
        &#127942; Familien-Score
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--pink-dark)', fontWeight: 700 }}>
            <span style={{ color: 'var(--pink-dark)' }}>{m}</span>
            <span style={{ color: 'var(--text-soft)', fontWeight: 400, margin: '0 4px' }}>vs</span>
            <span style={{ color: 'var(--blue-dark)' }}>{p}</span>
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-soft)', fontWeight: 400 }}>
            {earnedCount}/{STICKER_DEFS.length} ✦
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <>
          <div className="score-duel">
            <div className="score-person">
              <div className="score-name">{names.mama}</div>
              <div className="score-pts mama">{m}</div>
              <div style={{ fontSize: 10, color: 'var(--text-soft)' }}>Level {getLevel(m)}</div>
            </div>
            <div className="score-vs">VS</div>
            <div className="score-person">
              <div className="score-name">{names.papa}</div>
              <div className="score-pts papa">{p}</div>
              <div style={{ fontSize: 10, color: 'var(--text-soft)' }}>Level {getLevel(p)}</div>
            </div>
          </div>
          <div className="duel-bar-wrap">
            <div className="duel-mama" style={{ width: `${mamaW}%` }} />
            <div className="duel-papa" />
          </div>
          <div className="stickers-hd">&#127384; Abzeichen</div>
          <div className="stickers-grid">
            {STICKER_DEFS.map(def => {
              const isEarned = earnedSet.has(def.id);
              return (
                <div key={def.id} className={`sticker ${isEarned ? 'earned' : 'locked'}`} title={def.label}>
                  <div className="sticker-icon">{isEarned ? def.icon : '🔒'}</div>
                  <div className="sticker-lbl">{def.label}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
