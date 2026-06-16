import { useState } from 'react';
import { useFamilyStore } from '../../store/useFamilyStore';
import type { Person } from '../../types';

const ROTATIONS = ['-2.8deg', '1.6deg', '-1.2deg', '2.4deg', '-3.1deg', '1.1deg', '2.9deg'];

const NOTE_BG: Record<Person, string>  = { mama: '#fff0f6', papa: '#eff6ff', both: '#fffde7' };
const PIN_CLR: Record<Person, string>  = { mama: '#e8285a', papa: '#1565c0', both: '#f57c00' };

export default function Pinboard() {
  const notes   = useFamilyStore(s => s.notes);
  const names   = useFamilyStore(s => s.names);
  const addNote = useFamilyStore(s => s.addNote);
  const delNote = useFamilyStore(s => s.delNote);

  const [text,   setText]   = useState('');
  const [person, setPerson] = useState<Person>('mama');

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addNote(trimmed, person);
    setText('');
  }

  const authorLabel = (p: Person) =>
    p === 'mama' ? names.mama : p === 'papa' ? names.papa : `${names.mama} & ${names.papa}`;

  return (
    <div className="card">
      <div className="card-hd">📌 Pinnwand</div>

      <div className="pinboard">
        {notes.length === 0 && (
          <p className="pin-empty">Noch keine Notizen – heft eine an!</p>
        )}
        <div className="pin-notes">
          {notes.map((note, i) => (
            <div
              key={note.id}
              className="pin-note"
              style={{
                '--note-bg':  NOTE_BG[note.person],
                '--pin-clr':  PIN_CLR[note.person],
                '--rot':      ROTATIONS[i % ROTATIONS.length],
              } as React.CSSProperties}
            >
              {/* Thumbtack */}
              <div className="thumbtack" aria-hidden="true" />

              {/* Delete */}
              <button className="pin-del" onClick={() => delNote(note.id)} title="Entfernen">×</button>

              <p className="pin-text">{note.text}</p>
              <span className="pin-author">— {authorLabel(note.person)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add form */}
      <div className="pin-add">
        <div className="p-row" style={{ marginBottom: 8 }}>
          {(['mama', 'papa', 'both'] as const).map(p => (
            <button
              key={p}
              className={`pb ${p} ${person === p ? 'on' : ''}`}
              onClick={() => setPerson(p)}
            >
              {p === 'both' ? '👥 Beide' : `👤 ${p === 'mama' ? names.mama : names.papa}`}
            </button>
          ))}
        </div>
        <div className="pin-input-row">
          <input
            type="text" value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Kurze Notiz..."
          />
          <button className="btn-main pin-btn" onClick={handleAdd}>📌 Anheften</button>
        </div>
      </div>
    </div>
  );
}
