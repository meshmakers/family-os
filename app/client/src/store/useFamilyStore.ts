import { create } from 'zustand';
import type { AppState, Task, ShopCategory, DayAssignment, StickerDef, Person } from '../types';
import * as api from '../api';

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
  cats: [],
  earned: [],
  pendingToasts: [],
  notes: [],
};

function findNewStickers(state: AppState): StickerDef[] {
  const earnedSet = new Set(state.earned);
  return STICKER_DEFS.filter(def => !earnedSet.has(def.id) && def.check(state));
}

// Fire-and-forget sync to the mesh backend: local state updates optimistically,
// a failed call surfaces as a toast instead of blocking the UI.
function sync(p: Promise<unknown>) {
  p.catch(err => {
    console.error('[familyos] sync failed', err);
    useFamilyStore.setState(s => ({ pendingToasts: [...s.pendingToasts, 'Sync fehlgeschlagen ⚠️'] }));
  });
}

// The settings modal fires a rename per keystroke — debounce the network call.
const renameTimers: Record<string, ReturnType<typeof setTimeout>> = {};
function debouncedRenameCat(id: string, name: string) {
  clearTimeout(renameTimers[id]);
  renameTimers[id] = setTimeout(() => sync(api.renameCat(id, name)), 600);
}

interface FamilyStore extends AppState {
  hydrate: () => Promise<void>;
  addTask: (t: Omit<Task, 'id' | 'done'>) => void;
  toggleTask: (id: string, completedBy?: 'mama' | 'papa') => void;
  delTask: (id: string) => void;
  addShopItem: (name: string, cat: ShopCategory) => void;
  toggleShop: (id: string) => void;
  delShop: (id: string) => void;
  clearDoneShop: () => void;
  setCat: (dk: string, catId: string, val: DayAssignment) => void;
  setCatName: (i: number, name: string) => void;
  setCatIcon: (i: number, icon: string) => void;
  saveNames: (mama: string, papa: string) => void;
  shiftToast: () => void;
  tickRecurring: () => void;
  addNote: (text: string, person: Person) => void;
  delNote: (id: string) => void;
}

export const useFamilyStore = create<FamilyStore>()((set, get) => ({
  ...DEFAULT_STATE,

  hydrate: async () => {
    try {
      const s = await api.fetchState();
      set(s);
    } catch (err) {
      console.error('[familyos] failed to load state', err);
      set(state => ({ pendingToasts: [...state.pendingToasts, 'Backend nicht erreichbar ⚠️'] }));
    }
  },

  addTask: (t) => {
    api.createTask(t).then(
      id => set(state => ({ tasks: [...state.tasks, { ...t, id, done: false }] })),
      err => {
        console.error('[familyos] sync failed', err);
        set(state => ({ pendingToasts: [...state.pendingToasts, 'Sync fehlgeschlagen ⚠️'] }));
      },
    );
  },

  tickRecurring: () => set(state => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = state.tasks.map(t => {
      if (t.type !== 'recur' || !t.done || !t.lastCompleted || !t.recurDays) return t;
      const due = new Date(t.lastCompleted + 'T12:00:00');
      due.setDate(due.getDate() + t.recurDays);
      const dueStr = due.toISOString().split('T')[0];
      if (dueStr <= today) {
        sync(api.resetTask(t.id));
        return { ...t, done: false };
      }
      return t;
    });
    return { tasks };
  }),

  toggleTask: (id, completedBy) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;

    // The backend books the points authoritatively; reconcile scores when the
    // response lands (values match the local computation below).
    sync(api.toggleTask(id, completedBy).then(r =>
      set({ scores: { mama: r.mamaScore, papa: r.papaScore } })));

    set(state => {
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

      const earned = [...state.earned, ...newStickers.map(d => d.id)];
      if (newStickers.length > 0) sync(api.saveStickers(earned));

      return {
        tasks,
        scores,
        earned,
        pendingToasts: [...state.pendingToasts, ...toasts],
      };
    });
  },

  delTask: (id) => {
    sync(api.deleteTask(id));
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  addShopItem: (name, cat) => {
    api.createShopItem(name, cat).then(
      id => set(state => ({ shopping: [...state.shopping, { id, name, cat, done: false }] })),
      err => {
        console.error('[familyos] sync failed', err);
        set(state => ({ pendingToasts: [...state.pendingToasts, 'Sync fehlgeschlagen ⚠️'] }));
      },
    );
  },

  toggleShop: (id) => {
    sync(api.toggleShopItem(id));
    set(state => {
      const shopping = state.shopping.map(i => i.id === id ? { ...i, done: !i.done } : i);
      const newStickers = findNewStickers({ ...state, shopping });
      const toasts = newStickers.map(def => `Abzeichen: ${def.icon} ${def.label}!`);
      const earned = [...state.earned, ...newStickers.map(d => d.id)];
      if (newStickers.length > 0) sync(api.saveStickers(earned));
      return {
        shopping,
        earned,
        pendingToasts: [...state.pendingToasts, ...toasts],
      };
    });
  },

  delShop: (id) => {
    sync(api.deleteShopItem(id));
    set(state => ({ shopping: state.shopping.filter(i => i.id !== id) }));
  },

  clearDoneShop: () => {
    sync(api.clearDoneShopping());
    set(state => ({ shopping: state.shopping.filter(i => !i.done) }));
  },

  setCat: (dk, catId, val) => {
    sync(api.setDay(dk, catId, val));
    set(state => ({
      days: { ...state.days, [dk]: { ...(state.days[dk] || {}), [catId]: val } },
    }));
  },

  setCatName: (i, name) => set(state => {
    const cats = [...state.cats];
    cats[i] = { ...cats[i], name };
    debouncedRenameCat(cats[i].id, name);
    return { cats };
  }),

  setCatIcon: (i, icon) => set(state => {
    const cats = [...state.cats];
    cats[i] = { ...cats[i], icon };
    sync(api.setCatIcon(cats[i].id, icon));
    return { cats };
  }),

  saveNames: (mama, papa) => {
    const names = { mama: mama || 'Mama', papa: papa || 'Papa' };
    sync(api.saveNames(names.mama, names.papa));
    set({ names });
  },

  shiftToast: () => set(state => ({ pendingToasts: state.pendingToasts.slice(1) })),

  addNote: (text, person) => {
    api.createNote(text, person).then(
      id => set(state => ({ notes: [...state.notes, { id, text, person }] })),
      err => {
        console.error('[familyos] sync failed', err);
        set(state => ({ pendingToasts: [...state.pendingToasts, 'Sync fehlgeschlagen ⚠️'] }));
      },
    );
  },

  delNote: (id) => {
    sync(api.deleteNote(id));
    set(state => ({ notes: state.notes.filter(n => n.id !== id) }));
  },
}));
