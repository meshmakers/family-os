import { useState, useEffect } from 'react';
import { useFamilyStore } from '../../store/useFamilyStore';
import type { Task } from '../../types';
import { todayStr } from '../../utils/dates';

type Urgency = 'overdue' | 'today' | 'tomorrow';

interface Reminder {
  task: Task;
  urgency: Urgency;
  daysOverdue: number;
}

const MESSAGES: Record<Urgency, { emoji: string; texts: string[] }> = {
  overdue: {
    emoji: '🦥',
    texts: [
      'Das Faultier schaut schon enttäuscht…',
      'Diese Aufgabe wartet sehr, sehr geduldig.',
      'Schläft die Aufgabe noch? Nein — sie wartet.',
      'Selbst die Schildkröte ist schneller.',
    ],
  },
  today: {
    emoji: '⏰',
    texts: [
      'Heute! Jetzt! Sofort!',
      'Die Uhr tickt laut und deutlich.',
      'Kein Entkommen mehr — heute ist der Tag.',
      'Der Wecker läutet NUR für dich.',
    ],
  },
  tomorrow: {
    emoji: '🫠',
    texts: [
      'Morgen lugt diese Aufgabe um die Ecke.',
      'Vielleicht doch heute schon anfangen?',
      'Der nächste Sonnenaufgang bringt die Deadline.',
      'Noch 24 Stunden… tick, tack.',
    ],
  },
};

function pickText(urgency: Urgency, taskId: number): string {
  const list = MESSAGES[urgency].texts;
  return list[taskId % list.length];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function buildReminders(tasks: Task[]): Reminder[] {
  const today    = todayStr();
  const tomorrow = addDays(today, 1);
  const result: Reminder[] = [];

  tasks.forEach(t => {
    // Date tasks: overdue / today / tomorrow
    if (t.type === 'date' && t.date && !t.done) {
      if (t.date < today) {
        const daysOverdue = Math.floor((Date.now() - new Date(t.date + 'T12:00:00').getTime()) / 86400000);
        result.push({ task: t, urgency: 'overdue', daysOverdue });
      } else if (t.date === today) {
        result.push({ task: t, urgency: 'today', daysOverdue: 0 });
      } else if (t.date === tomorrow) {
        result.push({ task: t, urgency: 'tomorrow', daysOverdue: 0 });
      }
    }

    // Recurring tasks: remind when due (today/overdue) AND the day after
    if (t.type === 'recur' && t.recurDays) {
      const dueDate = t.lastCompleted ? addDays(t.lastCompleted, t.recurDays) : null;
      if (!dueDate) {
        // Never completed — always show as due today
        if (!t.done) result.push({ task: t, urgency: 'today', daysOverdue: 0 });
      } else {
        // Due date known — show reminder on due day and 1 day after
        const dayAfterDue = addDays(dueDate, 1);
        if (dueDate < today) {
          const daysOverdue = Math.floor((Date.now() - new Date(dueDate + 'T12:00:00').getTime()) / 86400000);
          result.push({ task: t, urgency: 'overdue', daysOverdue });
        } else if (dueDate === today || dayAfterDue === today) {
          result.push({ task: t, urgency: 'today', daysOverdue: 0 });
        } else if (dueDate === tomorrow) {
          result.push({ task: t, urgency: 'tomorrow', daysOverdue: 0 });
        }
      }
    }
  });

  // Sort: overdue first (most days), then today, then tomorrow
  return result.sort((a, b) => {
    const order = { overdue: 0, today: 1, tomorrow: 2 };
    if (order[a.urgency] !== order[b.urgency]) return order[a.urgency] - order[b.urgency];
    return b.daysOverdue - a.daysOverdue;
  });
}

export default function ReminderPopup() {
  const tasks      = useFamilyStore(s => s.tasks);
  const toggleTask = useFamilyStore(s => s.toggleTask);

  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [index,     setIndex]     = useState(0);
  const [visible,   setVisible]   = useState(false);

  const reminders = buildReminders(tasks).filter(r => !dismissed.has(r.task.id));

  useEffect(() => {
    if (reminders.length > 0) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [reminders.length]);

  if (!visible || reminders.length === 0) return null;

  const current = reminders[Math.min(index, reminders.length - 1)];
  if (!current) return null;

  const { task, urgency, daysOverdue } = current;
  const { emoji } = MESSAGES[urgency];
  const text = pickText(urgency, task.id);

  const tagLabel = urgency === 'overdue'
    ? `${daysOverdue} Tag${daysOverdue !== 1 ? 'e' : ''} überfällig`
    : urgency === 'today' ? 'Heute fällig!'
    : 'Morgen fällig';

  function dismiss() {
    setDismissed(prev => new Set([...prev, task.id]));
    setIndex(0);
  }

  function markDone() {
    toggleTask(task.id);
    dismiss();
  }

  return (
    <div className="reminder-overlay" onClick={e => e.target === e.currentTarget && dismiss()}>
      <div className="reminder-box">
        <div className={`reminder-emoji reminder-emoji-${urgency}`}>{emoji}</div>
        <div className={`reminder-tag reminder-tag-${urgency}`}>{tagLabel}</div>
        <div className="reminder-title">{task.title}</div>
        <div className="reminder-text">{text}</div>

        {reminders.length > 1 && (
          <div className="reminder-count">
            {index + 1} / {reminders.length} Erinnerungen
          </div>
        )}

        <div className="reminder-btns">
          <button className="btn-main" onClick={markDone}>✓ Erledigt!</button>
          {reminders.length > 1 && index < reminders.length - 1
            ? <button className="btn-ghost" onClick={() => setIndex(i => i + 1)}>Nächste →</button>
            : <button className="btn-ghost" onClick={dismiss}>Später</button>
          }
        </div>
      </div>
    </div>
  );
}
