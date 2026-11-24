import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Cat, Word, WORDS, shuffle } from './data';

const KEY = 'wordDrawer.v1';

/** Leitner box: 0 = never seen, 1–5 = learning, 5 = mastered. */
export type Prog = { b: number; due: number; r: number; w: number };

export type Settings = {
  units: number[]; // empty = all
  cats: Cat[]; // empty = all
  cardDir: 'en' | 'ka';
  quizDir: 'en' | 'ka' | 'mix';
  timed: boolean;
};

export type State = {
  prog: Record<string, Prog>;
  xp: number;
  streak: { count: number; last: string };
  daily: { date: string; xp: number };
  bestMatch: number | null; // seconds
  /** Best Unit Test score per unit, 0–100. 80+ earns the crown. */
  unitBest: Record<string, number>;
  settings: Settings;
};

export const CROWN_AT = 80;
/** Share of a unit's cards you must have studied before its test opens. */
export const TEST_UNLOCK = 0.5;

/** Mastery (0–1), how many studied, learned (box 2+), due and total for a list of words. */
export function progressOf(words: Word[], prog: Record<string, Prog>, now: number) {
  let sum = 0, seen = 0, learned = 0, due = 0;
  for (const w of words) {
    const p = prog[w.key];
    if (!p) continue;
    seen++;
    sum += p.b;
    if (p.b >= 2) learned++;
    if (p.due <= now) due++;
  }
  const total = words.length;
  return { mastery: total ? sum / (5 * total) : 0, seen, learned, due, total };
}

const initial: State = {
  prog: {},
  xp: 0,
  streak: { count: 0, last: '' },
  daily: { date: '', xp: 0 },
  bestMatch: null,
  unitBest: {},
  settings: { units: [], cats: [], cardDir: 'en', quizDir: 'mix', timed: true },
};

const MIN = 60_000;
const DAY = 86_400_000;
/** When a card in each box comes back. */
const INTERVALS = [0, 10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY];
export const DAILY_GOAL = 60;

export function dayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayStr(d);
}

export function currentStreak(s: State): number {
  return s.streak.last === dayStr() || s.streak.last === yesterdayStr() ? s.streak.count : 0;
}
export function todayXP(s: State): number {
  return s.daily.date === dayStr() ? s.daily.xp : 0;
}

/** Due cards first, then new ones, then the soonest-due as extra practice. */
export function pickSession(pool: Word[], prog: Record<string, Prog>, n: number): Word[] {
  const now = Date.now();
  const due = pool.filter((w) => prog[w.key] && prog[w.key].due <= now).sort((a, b) => prog[a.key].due - prog[b.key].due);
  const fresh = shuffle(pool.filter((w) => !prog[w.key]));
  const later = pool.filter((w) => prog[w.key] && prog[w.key].due > now).sort((a, b) => prog[a.key].due - prog[b.key].due);
  return shuffle([...due, ...fresh, ...later].slice(0, n));
}

type Ctx = {
  state: State;
  ready: boolean;
  pool: Word[];
  grade: (key: string, ok: boolean) => void;
  addXP: (n: number) => void;
  updateSettings: (p: Partial<Settings>) => void;
  setBestMatch: (sec: number) => void;
  setUnitBest: (unit: number, pct: number) => void;
  resetProgress: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => {
        if (!s) return;
        const p = JSON.parse(s) as Partial<State>;
        setState({ ...initial, ...p, unitBest: p.unitBest ?? {}, settings: { ...initial.settings, ...(p.settings ?? {}) } });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Save shortly after each change, and immediately when the app goes to background.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {}), 500);
    return () => clearTimeout(t);
  }, [state, ready]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active' && ready) AsyncStorage.setItem(KEY, JSON.stringify(latest.current)).catch(() => {});
    });
    return () => sub.remove();
  }, [ready]);

  const grade = useCallback((key: string, ok: boolean) => {
    setState((s) => {
      const p = s.prog[key];
      const b = ok ? Math.min(5, (p?.b ?? 0) + 1) : 1;
      const next: Prog = { b, due: Date.now() + INTERVALS[b], r: (p?.r ?? 0) + (ok ? 1 : 0), w: (p?.w ?? 0) + (ok ? 0 : 1) };
      return { ...s, prog: { ...s.prog, [key]: next } };
    });
  }, []);

  const addXP = useCallback((n: number) => {
    setState((s) => {
      const today = dayStr();
      const streak = s.streak.last === today ? s.streak : { count: s.streak.last === yesterdayStr() ? s.streak.count + 1 : 1, last: today };
      const daily = s.daily.date === today ? { date: today, xp: s.daily.xp + n } : { date: today, xp: n };
      return { ...s, xp: s.xp + n, streak, daily };
    });
  }, []);

  const updateSettings = useCallback((p: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...p } }));
  }, []);

  const setBestMatch = useCallback((sec: number) => {
    setState((s) => (s.bestMatch == null || sec < s.bestMatch ? { ...s, bestMatch: sec } : s));
  }, []);

  const setUnitBest = useCallback((unit: number, pct: number) => {
    setState((s) => ((s.unitBest[unit] ?? -1) >= pct ? s : { ...s, unitBest: { ...s.unitBest, [unit]: pct } }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((s) => ({ ...initial, settings: s.settings }));
  }, []);

  const { units, cats } = state.settings;
  const pool = useMemo(
    () => WORDS.filter((w) => (!units.length || units.includes(w.unit)) && (!cats.length || cats.includes(w.cat))),
    [units, cats],
  );

  const value = useMemo(
    () => ({ state, ready, pool, grade, addXP, updateSettings, setBestMatch, setUnitBest, resetProgress }),
    [state, ready, pool, grade, addXP, updateSettings, setBestMatch, setUnitBest, resetProgress],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore must be used inside StoreProvider');
  return c;
}
