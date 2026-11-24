import raw from './vocabulary.json';

export type Cat = 'voc' | 'phr' | 'col' | 'idm' | 'wf';

export interface Word {
  key: string;
  word: string;
  ka: string;
  /** First meaning only, for small tiles. */
  kaShort: string;
  cat: Cat;
  /** Part of speech, spelled out (only for plain vocabulary). */
  pos: string;
  unit: number;
  /** Root word for word-formation entries, e.g. "assume". */
  root: string;
}

type RawEntry = { word: string; translation_ka: string; context_or_note: string };

export const CAT_LABEL: Record<Cat, string> = {
  voc: 'Word',
  phr: 'Phrasal verb',
  col: 'Collocation',
  idm: 'Idiom',
  wf: 'Word formation',
};

export const CAT_ORDER: Cat[] = ['voc', 'phr', 'col', 'idm', 'wf'];

const POS: Record<string, string> = {
  v: 'verb',
  n: 'noun',
  adj: 'adjective',
  adv: 'adverb',
  'n phr': 'noun phrase',
};

function parse(e: RawEntry, i: number, seen: Set<string>): Word {
  const note = e.context_or_note ?? '';
  const unit = Number((note.match(/Unit\s+(\d+)/i) ?? [])[1] ?? 0);
  const parts = note.split(' - ').map((s) => s.trim());
  const head = (parts[0] ?? '').toLowerCase();
  let cat: Cat = 'voc';
  let pos = '';
  let root = '';
  if (head.startsWith('word formation')) {
    cat = 'wf';
    root = parts[1] && !/unit/i.test(parts[1]) ? parts[1] : '';
  } else if (head.startsWith('phrasal')) cat = 'phr';
  else if (head.startsWith('collocation')) cat = 'col';
  else if (head.startsWith('idiom')) cat = 'idm';
  else {
    pos = head
      .split(',')
      .map((p) => POS[p.trim()] ?? p.trim())
      .join(' · ');
  }
  let key = `${unit}:${e.word}`;
  if (seen.has(key)) key = `${key}#${i}`;
  seen.add(key);
  const ka = e.translation_ka.trim();
  const kaShort = ka.split(/[;,]/)[0].trim();
  return { key, word: e.word.trim(), ka, kaShort, cat, pos, unit, root };
}

const seen = new Set<string>();
export const WORDS: Word[] = (raw as RawEntry[]).map((e, i) => parse(e, i, seen));
export const UNITS: number[] = [...new Set(WORDS.map((w) => w.unit))].sort((a, b) => a - b);
export const BY_KEY: Record<string, Word> = Object.fromEntries(WORDS.map((w) => [w.key, w]));

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** Lowercase, strip accents (Naïve → naive), collapse spaces. */
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Entries simple enough to type from memory: no slashes, brackets or "sb/sth". */
export function isSpellable(w: Word): boolean {
  const n = norm(w.word);
  return /^[a-z' -]+$/.test(n) && n.length <= 24 && !/\b(sb|sth)\b/.test(n);
}

/** Three wrong answers of the same type where possible, plus the right one, shuffled. */
export function makeOptions(target: Word, field: 'ka' | 'word'): Word[] {
  const differs = (w: Word) => w.key !== target.key && norm(w[field]) !== norm(target[field]);
  let pool = WORDS.filter((w) => w.cat === target.cat && differs(w));
  if (pool.length < 3) pool = WORDS.filter(differs);
  return shuffle([target, ...sample(pool, 3)]);
}

// ---------- Units & lessons ----------

/** Short theme labels, worked out from each unit's words (not the book's official titles). */
export const UNIT_THEME: Record<number, string> = {
  2: 'Thinking & learning',
  4: 'Change & technology',
  6: 'Time',
  8: 'Movement & travel',
  10: 'Communication',
  12: 'Nature & chance',
  14: 'Quantity & money',
  16: 'Materials & shape',
  18: 'Health & medicine',
  20: 'Society & power',
  22: 'Bonus word',
  24: 'Links & relationships',
  26: 'Wants & needs',
};

const CAT_PLURAL: Record<Cat, string> = {
  voc: 'Vocabulary',
  phr: 'Phrasal verbs',
  col: 'Collocations',
  idm: 'Idioms',
  wf: 'Word formation',
};

export interface Lesson {
  id: string;
  unit: number;
  title: string;
  words: Word[];
}

const LESSON_MAX = 18;

/** Split each unit into short lessons by type, as the book groups them. */
function buildLessons(): Lesson[] {
  const out: Lesson[] = [];
  for (const u of UNITS) {
    const ws = WORDS.filter((w) => w.unit === u);
    if (ws.length <= 15) {
      out.push({ id: `u${u}-1`, unit: u, title: ws.length === 1 ? 'Bonus word' : 'All words', words: ws });
      continue;
    }
    const groups: { title: string; words: Word[] }[] = [];
    for (const c of CAT_ORDER) {
      const g = ws.filter((w) => w.cat === c);
      if (!g.length) continue;
      const last = groups[groups.length - 1];
      if (g.length < 6 && last && last.words.length + g.length <= 22) {
        last.title += ` & ${CAT_PLURAL[c]}`;
        last.words.push(...g);
        continue;
      }
      const n = Math.ceil(g.length / LESSON_MAX);
      const size = Math.ceil(g.length / n);
      for (let i = 0; i < n; i++) {
        groups.push({ title: n > 1 ? `${CAT_PLURAL[c]} ${i + 1}` : CAT_PLURAL[c], words: g.slice(i * size, (i + 1) * size) });
      }
    }
    groups.forEach((g, i) => out.push({ id: `u${u}-${i + 1}`, unit: u, title: g.title, words: g.words }));
  }
  return out;
}

export const LESSONS: Lesson[] = buildLessons();
export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export const UNIT_WORDS: Record<number, Word[]> = Object.fromEntries(UNITS.map((u) => [u, WORDS.filter((w) => w.unit === u)]));

/** What a game session draws from. */
export type Scope = { kind: 'all' } | { kind: 'unit'; unit: number } | { kind: 'lesson'; id: string };

export function scopeWords(scope: Scope | undefined, pool: Word[]): Word[] {
  if (!scope || scope.kind === 'all') return pool;
  if (scope.kind === 'unit') return UNIT_WORDS[scope.unit] ?? [];
  return LESSON_BY_ID[scope.id]?.words ?? [];
}

export function scopeLabel(scope: Scope | undefined): string {
  if (!scope || scope.kind === 'all') return 'Your deck';
  if (scope.kind === 'unit') return `Unit ${scope.unit}`;
  const l = LESSON_BY_ID[scope.id];
  return l ? `Unit ${l.unit} · ${l.title}` : 'Lesson';
}

export function scopeUnit(scope: Scope | undefined): number | null {
  if (!scope || scope.kind === 'all') return null;
  return scope.kind === 'unit' ? scope.unit : (LESSON_BY_ID[scope.id]?.unit ?? null);
}

/** Word of the day: same for everyone on a given date. */
export function wordOfDay(date: string): Word {
  let h = 0;
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return WORDS[h % WORDS.length];
}
