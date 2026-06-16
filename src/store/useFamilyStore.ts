import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Task, ShopCategory, DayAssignment, StickerDef, Person } from '../types';

export const STICKER_DEFS: StickerDef[] = [
  { id: 's1', icon: '⭐', label: 'Erste Aufgabe',  check: s => s.tasks.filter(t => t.done).length >= 1 },
  { id: 's2', icon: '🔥', label: '10 erledigt',    check: s => s.tasks.filter(t => t.done).length >= 10 },
  { id: 's3', icon: '💪', label: '25 erledigt',    check: s => s.tasks.filter(t => t.done).length >= 25 },
  { id: 's4', icon: '👑', label: '50 erledigt',    check: s => s.tasks.filter(t => t.done).length >= 50 },
  { id: 's5', icon: '🛒', label: 'Erstes Einkauf', check: s => s.shopping.filter(x => x.done).length >= 1 },
  { id: 's6', icon: '🌟', label: '100 Punkte',     check: s => (s.scores.mama + s.scores.papa) >= 100 },
  { id: 's7', icon: '🏆', label: '500 Punkte',     check: s => (s.scores.mama + s.scores.papa) >= 500 },
  { id: 's8', icon: '🎉', label: 'Team-Arbeit',    check: s => s.tasks.filter(t => t.done && t.person === 'both').length >= 3 },
];

const DEFAULT_STATE: AppState = {
  tasks: [],
  shopping: [],
  names: { mama: 'Mama', papa: 'Papa' },
  days: {},
  scores: { mama: 0, papa: 0 },
  cats: [
    { id: 'c1', name: 'KiGa Bringen',   icon: 'bike' },
    { id: 'c2', name: 'KiGa Abholen',   icon: 'bike' },
    { id: 'c3', name: 'Schule Abholen', icon: 'bag'  },
  ],
  earned: [],
  pendingToasts: [],
  notes: [],
};

function findNewStickers(state: AppState): StickerDef[] {
  const earnedSet = new Set(state.earned);
  return STICKER_DEFS.filter(def => !earnedSet.has(def.id) && def.check(state));
}

interface FamilyStore extends AppState {
  addTask: (t: Omit<Task, 'id' | 'done'>) => void;
  toggleTask: (id: number, completedBy?: 'mama' | 'papa') => void;
  delTask: (id: number) => void;
  addShopItem: (name: string, cat: ShopCategory) => void;
  toggleShop: (id: number) => void;
  delShop: (id: number) => void;
  clearDoneShop: () => void;
  setCat: (dk: string, catId: string, val: DayAssignment) => void;
  setCatName: (i: number, name: string) => void;
  setCatIcon: (i: number, icon: string) => void;
  saveNames: (mama: string, papa: string) => void;
  shiftToast: () => void;
  tickRecurring: () => void;
  addNote: (text: string, person: Person) => void;
  delNote: (id: number) => void;
}

export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      addTask: (t) => set(state => ({
        tasks: [...state.tasks, { ...t, id: Date.now(), done: false }],
      })),

      tickRecurring: () => set(state => {
        const today = new Date().toISOString().split('T')[0];
        const tasks = state.tasks.map(t => {
          if (t.type !== 'recur' || !t.done || !t.lastCompleted || !t.recurDays) return t;
          const due = new Date(t.lastCompleted + 'T12:00:00');
          due.setDate(due.getDate() + t.recurDays);
          const dueStr = due.toISOString().split('T')[0];
          if (dueStr <= today) return { ...t, done: false };
          return t;
        });
        return { tasks };
      }),

      toggleTask: (id, completedBy) => set(state => {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return {};
        const wasDone = task.done;
        const today = new Date().toISOString().split('T')[0];
        const tasks = state.tasks.map(t =>
          t.id === id
            ? {
                ...t,
                done: !t.done,
                completedBy: !wasDone ? completedBy : undefined,
                lastCompleted: !wasDone && t.type === 'recur' ? today : t.lastCompleted,
              }
            : t
        );

        let { mama, papa } = state.scores;
        const toasts: string[] = [];

        // For 'both' tasks: use completedBy if provided, else split
        const scorer = task.person === 'both' ? (completedBy ?? null) : task.person;

        if (!wasDone && task.pts > 0) {
          if (scorer === 'mama')      mama += task.pts;
          else if (scorer === 'papa') papa += task.pts;
          else { mama += Math.floor(task.pts / 2); papa += Math.floor(task.pts / 2); }
          toasts.push(`+${task.pts} Punkte! 🎉`);
        } else if (wasDone && task.pts > 0) {
          // Deduct from whoever got the points
          const deductFrom = task.person === 'both' ? (task.completedBy ?? null) : task.person;
          if (deductFrom === 'mama')      mama = Math.max(0, mama - task.pts);
          else if (deductFrom === 'papa') papa = Math.max(0, papa - task.pts);
          else {
            mama = Math.max(0, mama - Math.floor(task.pts / 2));
            papa = Math.max(0, papa - Math.floor(task.pts / 2));
          }
        }

        const scores = { mama, papa };
        const newStickers = findNewStickers({ ...state, tasks, scores });
        newStickers.forEach(def => toasts.push(`Abzeichen: ${def.icon} ${def.label}!`));

        return {
          tasks,
          scores,
          earned: [...state.earned, ...newStickers.map(d => d.id)],
          pendingToasts: [...state.pendingToasts, ...toasts],
        };
      }),

      delTask: (id) => set(state => ({ tasks: state.tasks.filter(t => t.id !== id) })),

      addShopItem: (name, cat) => set(state => ({
        shopping: [...state.shopping, { id: Date.now(), name, cat, done: false }],
      })),

      toggleShop: (id) => set(state => {
        const shopping = state.shopping.map(i => i.id === id ? { ...i, done: !i.done } : i);
        const newStickers = findNewStickers({ ...state, shopping });
        const toasts = newStickers.map(def => `Abzeichen: ${def.icon} ${def.label}!`);
        return {
          shopping,
          earned: [...state.earned, ...newStickers.map(d => d.id)],
          pendingToasts: [...state.pendingToasts, ...toasts],
        };
      }),

      delShop: (id) => set(state => ({ shopping: state.shopping.filter(i => i.id !== id) })),
      clearDoneShop: () => set(state => ({ shopping: state.shopping.filter(i => !i.done) })),

      setCat: (dk, catId, val) => set(state => ({
        days: { ...state.days, [dk]: { ...(state.days[dk] || {}), [catId]: val } },
      })),

      setCatName: (i, name) => set(state => {
        const cats = [...state.cats];
        cats[i] = { ...cats[i], name };
        return { cats };
      }),

      setCatIcon: (i, icon) => set(state => {
        const cats = [...state.cats];
        cats[i] = { ...cats[i], icon };
        return { cats };
      }),

      saveNames: (mama, papa) => set({ names: { mama: mama || 'Mama', papa: papa || 'Papa' } }),

      shiftToast: () => set(state => ({ pendingToasts: state.pendingToasts.slice(1) })),

      addNote: (text, person) => set(state => ({
        notes: [...state.notes, { id: Date.now(), text, person }],
      })),
      delNote: (id) => set(state => ({ notes: state.notes.filter(n => n.id !== id) })),
    }),
    {
      name: 'familyflow_v4',
      partialize: (state) => ({
        tasks:    state.tasks,
        shopping: state.shopping,
        names:    state.names,
        days:     state.days,
        scores:   state.scores,
        cats:     state.cats,
        earned:   state.earned,
        notes:    state.notes,
      }),
    }
  )
);
