// FamilyOS API client — talks to the tenant-scoped Mesh Adapter HTTP API.
// The app server proxies /api/* to the adapter in production; the Vite dev
// server does the same via its proxy config.
//
// Wire contract (see ../../test/dataflow-test.yaml):
// - Enum values are WRITTEN as CK enum names ("Mama", "Recurring", "Drugstore",
//   "None") and READ back as integer enum keys (0/1/2).
// - Date day-keys are sent as YYYY-MM-DD but come back re-formatted (the
//   adapter's JSON body parse turns date-looking strings into DateTime) —
//   normalizeDateKey() maps any format back to YYYY-MM-DD.
// - The earned-sticker set stores the sentinel "~" instead of an empty array
//   (the pipeline layer cannot write empty arrays); readers filter it.
import type { AppState, DayAssignment, DaysMap, Person, ShopCategory, ShopItem, PinNote, Task, TaskType, Category } from './types';

const PERSON_TO_API: Record<Person, string> = { mama: 'Mama', papa: 'Papa', both: 'Both' };
const PERSON_FROM_KEY: Person[] = ['mama', 'papa', 'both'];
const TYPE_TO_API: Record<TaskType, string> = { date: 'Date', recur: 'Recurring', once: 'Once' };
const TYPE_FROM_KEY: TaskType[] = ['date', 'recur', 'once'];
const SHOPCAT_TO_API: Record<ShopCategory, string> = { food: 'Food', drog: 'Drugstore', misc: 'Misc' };
const SHOPCAT_FROM_KEY: ShopCategory[] = ['food', 'drog', 'misc'];
const DAY_TO_API: Record<DayAssignment, string> = { none: 'None', mama: 'Mama', papa: 'Papa' };
const DAY_FROM_KEY: DayAssignment[] = ['none', 'mama', 'papa'];

const STICKER_SENTINEL = '~';

export function todayKey(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function normalizeDateKey(v: string | null | undefined): string | null {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> HTTP ${res.status}`);
  const data = (await res.json()) as T & { error?: string };
  if (data && typeof data === 'object' && data.error) throw new Error(data.error);
  return data;
}

export type ServerState = Pick<AppState, 'tasks' | 'shopping' | 'names' | 'days' | 'scores' | 'cats' | 'earned' | 'notes'>;

export async function fetchState(): Promise<ServerState> {
  interface RawState {
    household?: { mamaName?: string; papaName?: string; mamaScore?: number; papaScore?: number; earned?: string[] };
    cats?: { id: string; name: string; icon: string }[];
    tasks?: Record<string, unknown>[];
    shopping?: Record<string, unknown>[];
    notes?: Record<string, unknown>[];
    days?: { dateKey?: string; categoryId?: string; assignment?: number }[];
  }
  const s = await request<RawState>('GET', '/state');

  const tasks: Task[] = (s.tasks ?? []).map(t => ({
    id: String(t.id),
    title: String(t.title ?? ''),
    person: PERSON_FROM_KEY[Number(t.person)] ?? 'mama',
    done: !!t.done,
    type: TYPE_FROM_KEY[Number(t.type)] ?? 'once',
    pts: Number(t.pts ?? 0),
    date: normalizeDateKey(t.date as string),
    recurDays: Number(t.recurDays ?? 0) || null,
    completedBy: t.completedBy === 'Mama' ? 'mama' : t.completedBy === 'Papa' ? 'papa' : undefined,
    icon: (t.icon as string) || undefined,
    lastCompleted: normalizeDateKey(t.lastCompleted as string) ?? undefined,
  }));

  const shopping: ShopItem[] = (s.shopping ?? []).map(i => ({
    id: String(i.id),
    name: String(i.name ?? ''),
    cat: SHOPCAT_FROM_KEY[Number(i.cat)] ?? 'misc',
    done: !!i.done,
  }));

  const notes: PinNote[] = (s.notes ?? []).map(n => ({
    id: String(n.id),
    text: String(n.text ?? ''),
    person: PERSON_FROM_KEY[Number(n.person)] ?? 'both',
  }));

  const cats: Category[] = (s.cats ?? [])
    .map(c => ({ id: c.id, name: c.name, icon: c.icon }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const days: DaysMap = {};
  for (const d of s.days ?? []) {
    const key = normalizeDateKey(d.dateKey);
    if (!key || !d.categoryId) continue;
    const a = DAY_FROM_KEY[Number(d.assignment)] ?? 'none';
    if (a === 'none') continue;
    (days[key] ??= {})[d.categoryId] = a;
  }

  return {
    tasks, shopping, notes, cats, days,
    earned: (s.household?.earned ?? []).filter(x => x !== STICKER_SENTINEL),
    names: { mama: s.household?.mamaName || 'Mama', papa: s.household?.papaName || 'Papa' },
    scores: { mama: s.household?.mamaScore ?? 0, papa: s.household?.papaScore ?? 0 },
  };
}

export async function createTask(t: Omit<Task, 'id' | 'done'>): Promise<string> {
  const r = await request<{ id: string }>('POST', '/tasks', {
    title: t.title,
    person: PERSON_TO_API[t.person],
    type: TYPE_TO_API[t.type],
    pts: t.pts,
    date: t.date ?? '',
    recurDays: t.recurDays ?? 0,
    icon: t.icon ?? '',
  });
  return r.id;
}

export function toggleTask(id: string, completedBy?: 'mama' | 'papa') {
  return request<{ done: boolean; mamaScore: number; papaScore: number }>('POST', '/tasks/toggle', {
    id,
    completedBy: completedBy ? PERSON_TO_API[completedBy] : '',
    today: todayKey(),
  });
}

export function resetTask(id: string) {
  return request<{ ok: boolean }>('POST', '/tasks/reset', { id });
}

export function deleteTask(id: string) {
  return request<{ ok: boolean }>('DELETE', `/tasks?id=${id}`);
}

export async function createShopItem(name: string, cat: ShopCategory): Promise<string> {
  const r = await request<{ id: string }>('POST', '/shopping', { name, cat: SHOPCAT_TO_API[cat] });
  return r.id;
}

export function toggleShopItem(id: string) {
  return request<{ done: boolean }>('POST', '/shopping/toggle', { id });
}

export function deleteShopItem(id: string) {
  return request<{ ok: boolean }>('DELETE', `/shopping?id=${id}`);
}

export function clearDoneShopping() {
  return request<{ ok: boolean }>('POST', '/shopping/clear-done');
}

export async function createNote(text: string, person: Person): Promise<string> {
  const r = await request<{ id: string }>('POST', '/notes', { text, person: PERSON_TO_API[person] });
  return r.id;
}

export function deleteNote(id: string) {
  return request<{ ok: boolean }>('DELETE', `/notes?id=${id}`);
}

export function setDay(dateKey: string, categoryId: string, assignment: DayAssignment) {
  return request<{ ok: boolean }>('POST', '/days', { dateKey, categoryId, assignment: DAY_TO_API[assignment] });
}

export function saveNames(mama: string, papa: string) {
  return request<{ ok: boolean }>('POST', '/household/names', { mama, papa });
}

export function saveStickers(earned: string[]) {
  return request<{ ok: boolean }>('POST', '/household/stickers', { earned, count: earned.length });
}

export function renameCat(id: string, name: string) {
  return request<{ ok: boolean }>('POST', '/cats/name', { id, name });
}

export function setCatIcon(id: string, icon: string) {
  return request<{ ok: boolean }>('POST', '/cats/icon', { id, icon });
}
