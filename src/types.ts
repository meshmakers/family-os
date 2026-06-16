export type Person = 'mama' | 'papa' | 'both';
export type TaskType = 'date' | 'recur' | 'once';
export type ShopCategory = 'food' | 'drog' | 'misc';
export type DayAssignment = 'mama' | 'papa' | 'none';

export interface Task {
  id: number;
  title: string;
  person: Person;
  done: boolean;
  type: TaskType;
  pts: number;
  date: string | null;
  recurDays: number | null;
  completedBy?: 'mama' | 'papa';
  icon?: string;
  lastCompleted?: string;
}

export interface ShopItem {
  id: number;
  name: string;
  cat: ShopCategory;
  done: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export type DayData = Record<string, DayAssignment>;
export type DaysMap = Record<string, DayData>;

export interface Scores {
  mama: number;
  papa: number;
}

export interface Names {
  mama: string;
  papa: string;
}

export interface PinNote {
  id: number;
  text: string;
  person: Person;
}

export interface AppState {
  tasks: Task[];
  shopping: ShopItem[];
  names: Names;
  days: DaysMap;
  scores: Scores;
  cats: Category[];
  earned: string[];
  pendingToasts: string[];
  notes: PinNote[];
}

export interface StickerDef {
  id: string;
  icon: string;
  label: string;
  check: (s: AppState) => boolean;
}
