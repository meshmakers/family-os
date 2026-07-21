import { useFamilyStore } from '../../store/useFamilyStore';
import TaskRow from '../ui/TaskRow';

export default function UpcomingTasks() {
  const tasks      = useFamilyStore(s => s.tasks);
  const names      = useFamilyStore(s => s.names);
  const toggleTask = useFamilyStore(s => s.toggleTask);

  const open = tasks.filter(t => !t.done);

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-hd">✅ Aufgaben</div>
      {open.length === 0
        ? <div className="empty">Alles erledigt ✨</div>
        : open.slice(0, 5).map(t => (
          <TaskRow key={t.id} task={t} names={names} onToggle={toggleTask} />
        ))
      }
      {open.length > 5 && (
        <div style={{ fontSize: 11, color: 'var(--text-soft)', paddingTop: 6 }}>
          +{open.length - 5} weitere…
        </div>
      )}
    </div>
  );
}
