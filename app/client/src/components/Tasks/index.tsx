import { useFamilyStore } from '../../store/useFamilyStore';
import AddTaskForm from './AddTaskForm';
import TaskRow from '../ui/TaskRow';

export default function TaskList() {
  const tasks      = useFamilyStore(s => s.tasks);
  const names      = useFamilyStore(s => s.names);
  const toggleTask = useFamilyStore(s => s.toggleTask);
  const delTask    = useFamilyStore(s => s.delTask);

  return (
    <>
      <AddTaskForm />
      <div className="sec-label">📋 Alle Aufgaben</div>
      <div className="card">
        {tasks.length === 0
          ? <div className="empty">Noch keine Aufgaben. Füge deine erste Aufgabe hinzu!</div>
          : tasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              names={names}
              showDelete
              onToggle={toggleTask}
              onDelete={delTask}
            />
          ))
        }
      </div>
    </>
  );
}
