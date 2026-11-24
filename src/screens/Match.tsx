import React, { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { Scope, Word, norm, scopeLabel, scopeUnit, scopeWords, shuffle } from '../data';
import { buzz } from '../feedback';
import { useStore } from '../store';
import { C, F, G, R } from '../theme';
import { Ionicons, Nav, Pill, ProgressBar, Screen, T, TopBar, backRoute } from '../ui';

const PAIRS = 6;

/** Six entries whose English and short Georgian are all distinct. */
function pickPairs(pool: Word[]): Word[] {
  const out: Word[] = [];
  const en = new Set<string>();
  const ka = new Set<string>();
  for (const w of shuffle(pool)) {
    const e = norm(w.word);
    const k = norm(w.kaShort);
    if (en.has(e) || ka.has(k)) continue;
    en.add(e);
    ka.add(k);
    out.push(w);
    if (out.length === PAIRS) break;
  }
  return out;
}

export default function Match({ nav, scope }: { nav: Nav; scope?: Scope }) {
  const { state, pool, addXP, setBestMatch } = useStore();
  const [pairs] = useState(() => pickPairs(scopeWords(scope, pool)));
  const [left] = useState(() => shuffle(pairs));
  const [right] = useState(() => shuffle(pairs));
  const [selL, setSelL] = useState<string | null>(null);
  const [selR, setSelR] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<[string, string] | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [start] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [shake] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(t);
  }, [start]);

  const finish = (mistakes: number) => {
    const sec = Math.max(1, elapsed);
    const isBest = state.bestMatch == null || sec < state.bestMatch;
    setBestMatch(sec);
    const xp = Math.max(10, 40 - mistakes * 5) + (sec <= 30 ? 10 : 0);
    addXP(xp);
    nav({
      name: 'results',
      data: {
        title: 'Match Up',
        headline: isBest ? 'New record!' : mistakes === 0 ? 'Clean sweep!' : 'All matched!',
        stats: [
          ['Time', `${sec}s`],
          ['Mistakes', `${mistakes}`],
          ['Record', `${isBest ? sec : state.bestMatch}s`],
        ],
        xp,
        again: { name: 'match', scope },
        great: isBest || mistakes === 0,
        unit: scopeUnit(scope),
      },
    });
  };

  const pick = (side: 'L' | 'R', key: string) => {
    buzz.tap();
    const l = side === 'L' ? (selL === key ? null : key) : selL;
    const r = side === 'R' ? (selR === key ? null : key) : selR;
    setSelL(l);
    setSelR(r);
    if (!l || !r) return;
    if (l === r) {
      buzz.good();
      const nextDone = new Set(done).add(l);
      setDone(nextDone);
      setSelL(null);
      setSelR(null);
      if (nextDone.size === pairs.length) finish(mistakes);
      return;
    }
    buzz.bad();
    setMistakes(mistakes + 1);
    setWrong([l, r]);
    Animated.sequence([10, -10, 7, -7, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true }))).start(() => {
      setWrong(null);
      setSelL(null);
      setSelR(null);
    });
  };

  const tile = (w: Word, side: 'L' | 'R') => {
    const matched = done.has(w.key);
    const sel = side === 'L' ? selL === w.key : selR === w.key;
    const isWrong = wrong != null && (side === 'L' ? wrong[0] === w.key : wrong[1] === w.key);
    const bg = matched ? C.goodBg : isWrong ? C.badBg : sel ? C.cardHi : C.card;
    const border = matched ? C.good : isWrong ? C.bad : sel ? C.teal : C.line;
    return (
      <Animated.View key={w.key + side} style={{ transform: [{ translateX: isWrong ? shake : 0 }, { scale: matched ? 0.96 : 1 }], opacity: matched ? 0.5 : 1 }}>
        <Pressable
          disabled={matched || wrong != null}
          onPress={() => pick(side, w.key)}
          accessibilityRole="button"
          accessibilityState={{ selected: sel, disabled: matched }}
          style={({ pressed }) => ({
            minHeight: 72,
            justifyContent: 'center',
            backgroundColor: bg,
            borderColor: border,
            borderWidth: 2,
            borderRadius: R.md,
            padding: 12,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          })}
        >
          {matched ? (
            <View style={{ position: 'absolute', top: 6, right: 6 }}>
              <Ionicons name="checkmark-circle" size={16} color={C.good} />
            </View>
          ) : null}
          {side === 'L' ? (
            <T style={{ fontFamily: F.bold, fontSize: 14 }} numberOfLines={3}>{w.word}</T>
          ) : (
            <T style={{ fontFamily: F.ka, fontSize: 13, lineHeight: 21 }} numberOfLines={3}>{w.kaShort}</T>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Screen>
      <TopBar title="Match Up" sub={scopeLabel(scope)} onBack={() => nav(backRoute(scope))} right={<Pill icon="stopwatch" text={`${elapsed}s`} color={C.teal} />} />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T style={{ fontFamily: F.bold, color: C.sub }}>{done.size} of {pairs.length} matched</T>
          <T style={{ fontFamily: F.bold, color: mistakes ? C.bad : C.sub }}>{mistakes} {mistakes === 1 ? 'miss' : 'misses'}</T>
        </View>
        <ProgressBar value={done.size / pairs.length} grad={G.teal} />
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 10 }}>{left.map((w) => tile(w, 'L'))}</View>
        <View style={{ flex: 1, gap: 10 }}>{right.map((w) => tile(w, 'R'))}</View>
      </View>
      <T style={{ color: C.faint, textAlign: 'center', fontSize: 13 }}>
        Tap a word, then its meaning.{state.bestMatch ? ` Record: ${state.bestMatch}s` : ''}
      </T>
    </Screen>
  );
}
