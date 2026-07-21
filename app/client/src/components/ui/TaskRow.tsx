import { useState } from 'react';
import type { Task, Names } from '../../types';

interface Props {
  task: Task;
  names: Names;
  showDelete?: boolean;
  onToggle: (id: string, completedBy?: 'mama' | 'papa') => void;
  onDelete?: (id: string) => void;
}

function pBadge(person: string, names: Names) {
  if (person === 'mama') return <span className="badge bm">{names.mama}</span>;
  if (person === 'papa') return <span className="badge bp">{names.papa}</span>;
  return <span className="badge bb">Beide</span>;
}

export default function TaskRow({ task, names, showDelete, onToggle, onDelete }: Props) {
  const [askWho, setAskWho] = useState(false);

  function handleCheck() {
    if (task.done) {
      onToggle(task.id);
      return;
    }
    if (task.person === 'both' && task.pts > 0) {
      setAskWho(true);
    } else {
      onToggle(task.id);
    }
  }

  function handleWho(who: 'mama' | 'papa') {
    setAskWho(false);
    onToggle(task.id, who);
  }

  return (
    <div>
      <div className="task-item">
        <input
          type="checkbox"
          className="task-check"
          checked={task.done}
          onChange={handleCheck}
        />
        {task.icon && <span className="task-icon">{task.icon}</span>}
        <span className={`task-lbl ${task.done ? 'done' : ''}`}>{task.title}</span>
        {pBadge(task.person, names)}
        {task.type === 'date' && task.date && (
          <span className="task-dt">
            {(() => { const [,m,d] = task.date.split('-'); return `${d}.${m}.`; })()}
          </span>
        )}
        {task.type === 'recur' && <span className="badge br">alle {task.recurDays}d</span>}
        {task.pts > 0 && <span className="pts-badge">+{task.pts} Pkt</span>}
        {showDelete && onDelete && (
          <button className="del-btn" onClick={() => onDelete(task.id)} title="Löschen">🗑</button>
        )}
      </div>

      {askWho && (
        <div className="who-picker">
          <span className="who-picker-lbl">Wer hat's erledigt?</span>
          <button className="who-btn mama" onClick={() => handleWho('mama')}>
            {names.mama}
          </button>
          <button className="who-btn papa" onClick={() => handleWho('papa')}>
            {names.papa}
          </button>
          <button className="who-btn cancel" onClick={() => setAskWho(false)}>✕</button>
        </div>
      )}
    </div>
  );
}
