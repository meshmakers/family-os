import { useState } from 'react';
import { useFamilyStore } from '../../store/useFamilyStore';
import type { Person, TaskType } from '../../types';

const QUICK_ICONS = ['📅', '🏥', '🎂', '✈️', '🏫', '💊', '🎉', '🛠️', '🐾', '⚽'];

export default function AddTaskForm() {
  const [title,     setTitle]     = useState('');
  const [person,    setPerson]    = useState<Person>('mama');
  const [taskType,  setTaskType]  = useState<TaskType>('once');
  const [date,      setDate]      = useState('');
  const [recurDays, setRecurDays] = useState(7);
  const [pts,       setPts]       = useState(10);
  const [icon,      setIcon]      = useState('');

  const names   = useFamilyStore(s => s.names);
  const addTask = useFamilyStore(s => s.addTask);

  function handleAdd() {
    if (!title.trim()) return;
    addTask({
      title:     title.trim(),
      person,
      type:      taskType,
      pts:       Math.max(0, pts),
      date:      taskType === 'date'  ? date      : null,
      recurDays: taskType === 'recur' ? recurDays : null,
      icon:      taskType === 'date' && icon ? icon : undefined,
    });
    setTitle('');
    setIcon('');
  }

  return (
    <div className="add-form">
      <div className="form-hd">✨ Neue Aufgabe</div>
      <div className="form-row">
        <input
          type="text" value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Aufgabe eingeben..."
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
      </div>
      <div className="p-row">
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
      <div className="form-row">
        <select value={taskType} onChange={e => setTaskType(e.target.value as TaskType)}>
          <option value="once">Einmalig</option>
          <option value="date">Datum</option>
          <option value="recur">Wiederkehrend</option>
        </select>
      </div>
      {taskType === 'date' && (
        <>
          <div className="form-row">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-row icon-picker-row">
            <span className="icon-picker-lbl">Icon (optional):</span>
            <div className="icon-picker">
              {QUICK_ICONS.map(e => (
                <button
                  key={e}
                  className={`icon-opt ${icon === e ? 'selected' : ''}`}
                  onClick={() => setIcon(prev => prev === e ? '' : e)}
                >
                  {e}
                </button>
              ))}
              <input
                type="text" className="icon-custom" maxLength={2}
                value={QUICK_ICONS.includes(icon) ? '' : icon}
                onChange={e => setIcon(e.target.value)}
                placeholder="…"
              />
            </div>
          </div>
        </>
      )}
      {taskType === 'recur' && (
        <div className="recrow">
          Alle{' '}
          <input type="number" className="rec-input" value={recurDays} min={1} max={365}
            onChange={e => setRecurDays(parseInt(e.target.value) || 7)} />
          {' '}Tage wiederholen
        </div>
      )}
      <div className="pts-row">
        <label>Punkte:</label>
        <input type="number" className="pts-input" value={pts} min={0} max={999}
          onChange={e => setPts(parseInt(e.target.value) || 0)} />
        <span style={{ color: 'var(--text-soft)', fontSize: 11 }}>
          ℹ Punkte werden bei Erledigung vergeben
        </span>
      </div>
      <button className="btn-main" onClick={handleAdd}>+ Hinzufügen</button>
    </div>
  );
}
