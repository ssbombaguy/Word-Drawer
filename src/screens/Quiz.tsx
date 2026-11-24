import React, { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { CAT_LABEL, Scope, Word, makeOptions, sample, scopeLabel, scopeUnit, scopeWords } from '../data';
import { buzz } from '../feedback';
import { CROWN_AT, useStore } from '../store';
import { C, F, R } from '../theme';
import { Btn, Card, Chip, Ionicons, Nav, Pill, Pop, Screen, SpeakBtn, T, Tag, TopBar, backRoute } from '../ui';

const COUNT = 10;
const TEST_COUNT = 15;
const SECONDS = 12;

type Q = { w: Word; dir: 'en' | 'ka'; opts: Word[] };

export default function Quiz({ nav, scope, test }: { nav: Nav; scope?: Scope; test?: boolean }) {
  const { state, pool, grade, addXP, updateSettings, setUnitBest } = useStore();
  const { quizDir, timed } = state.settings;
  const unit = scopeUnit(scope);
  const [qs] = useState<Q[]>(() =>
    sample(scopeWords(scope, pool), test ? TEST_COUNT : COUNT).map((w) => {
      const dir = quizDir === 'mix' ? (Math.random() < 0.5 ? 'en' : 'ka') : quizDir;
      return { w, dir, opts: makeOptions(w, dir === 'en' ? 'ka' : 'word') };
    }),
  );
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<string | null>(null); // option key, or 'timeout'
  const [run, setRun] = useState({ score: 0, combo: 0, best: 0, correct: 0 });
  const [timer] = useState(() => new Animated.Value(1));
  const q = qs[qi];
  const mult = 1 + Math.min(2, Math.floor(run.combo / 3));

  const choose = useCallback(
    (key: string) => {
      if (picked) return;
      timer.stopAnimation();
      setPicked(key);
      const ok = key === q.w.key;
      grade(q.w.key, ok);
      if (ok) {
        buzz.good();
        setRun((r) => {
          const combo = r.combo + 1;
          return { score: r.score + 10 * (1 + Math.min(2, Math.floor(r.combo / 3))), combo, best: Math.max(r.best, combo), correct: r.correct + 1 };
        });
      } else {
        buzz.bad();
        setRun((r) => ({ ...r, combo: 0 }));
      }
    },
    [picked, q, grade, timer],
  );

  useEffect(() => {
    timer.setValue(1);
    if (!timed) return;
    const anim = Animated.timing(timer, { toValue: 0, duration: SECONDS * 1000, easing: Easing.linear, useNativeDriver: false });
    anim.start(({ finished }) => {
      if (finished) choose('timeout');
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, timed]);

  const next = () => {
    if (qi + 1 >= qs.length) {
      const pct = Math.round((run.correct / qs.length) * 100);
      if (test && unit != null) {
        const prevBest = state.unitBest[unit];
        const crown = pct >= CROWN_AT;
        const firstCrown = crown && (prevBest == null || prevBest < CROWN_AT);
        setUnitBest(unit, pct);
        const xp = Math.round(run.score / 2) + (firstCrown ? 50 : 0);
        addXP(xp);
        nav({
          name: 'results',
          data: {
            title: `Unit ${unit} Test`,
            headline: firstCrown ? 'Unit crowned!' : crown ? 'Crown kept!' : `${CROWN_AT}% for the crown`,
            stats: [
              ['Score', `${pct}%`],
              ['Correct', `${run.correct}/${qs.length}`],
              ['Best', `${Math.max(pct, prevBest ?? 0)}%`],
            ],
            xp,
            again: { name: 'quiz', scope, test: true },
            great: crown,
            crown: firstCrown,
            unit,
          },
        });
        return;
      }
      const xp = Math.round(run.score / 2);
      addXP(xp);
      nav({
        name: 'results',
        data: {
          title: 'Speed Quiz',
          headline: run.correct === qs.length ? 'Flawless!' : run.correct >= qs.length * 0.7 ? 'Great job!' : 'Keep going!',
          stats: [
            ['Correct', `${run.correct}/${qs.length}`],
            ['Score', `${run.score}`],
            ['Best combo', `×${run.best}`],
          ],
          xp,
          again: { name: 'quiz', scope },
          great: run.correct >= qs.length * 0.8,
          unit,
        },
      });
      return;
    }
    setPicked(null);
    setQi(qi + 1);
  };

  useEffect(() => {
    if (picked && picked === q.w.key) {
      const t = setTimeout(next, 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked]);

  if (!q) return null;
  const dirLabel = { en: 'EN → KA', ka: 'KA → EN', mix: 'Mixed' }[quizDir];
  const cycleDir = () => updateSettings({ quizDir: quizDir === 'mix' ? 'en' : quizDir === 'en' ? 'ka' : 'mix' });
  const wrong = picked != null && picked !== q.w.key;

  return (
    <Screen>
      <TopBar
        title={test ? 'Unit Test' : 'Speed Quiz'}
        sub={scopeLabel(scope)}
        onBack={() => nav(backRoute(scope))}
        right={<Chip label={dirLabel} active={false} onPress={cycleDir} />}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T style={{ fontFamily: F.bold, color: C.sub }}>Question {qi + 1} of {qs.length}</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {run.combo >= 3 ? (
            <Pop key={`combo-${mult}`}>
              <Pill icon="flame" text={`×${mult}`} color={C.flame} />
            </Pop>
          ) : null}
          <Pill icon="star" text={`${run.score}`} color={C.amber} />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ height: 10, borderRadius: 999, backgroundColor: C.bg2, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: '100%',
              borderRadius: 999,
              width: timer.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: timer.interpolate({ inputRange: [0, 0.3, 1], outputRange: [C.bad, C.amber, C.teal] }),
            }}
          />
        </View>
        <Pressable onPress={() => updateSettings({ timed: !timed })} hitSlop={8} style={{ alignSelf: 'flex-end', flexDirection: 'row', gap: 4, alignItems: 'center' }}>
          <Ionicons name={timed ? 'timer-outline' : 'cafe-outline'} size={14} color={C.faint} />
          <T style={{ color: C.faint, fontSize: 12 }}>{timed ? `${SECONDS}s timer · tap to relax` : 'Relaxed · tap for timer'}</T>
        </Pressable>
      </View>

      <Card style={{ gap: 12, minHeight: 150, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Tag text={q.dir === 'en' ? 'What does it mean?' : 'Which word is it?'} color={C.amber} />
          <Tag text={CAT_LABEL[q.w.cat]} color={C.sub} />
        </View>
        {q.dir === 'en' ? (
          <>
            <T style={{ fontFamily: F.display, fontSize: 32 }}>{q.w.word}</T>
            {q.w.pos ? <T style={{ color: C.sub }}>{q.w.pos}</T> : null}
          </>
        ) : (
          <T style={{ fontFamily: F.kaBold, fontSize: 21, lineHeight: 34 }}>{q.w.ka}</T>
        )}
      </Card>

      <View style={{ gap: 10 }}>
        {q.opts.map((o, idx) => {
          const isRight = o.key === q.w.key;
          const isPicked = o.key === picked;
          const reveal = picked != null;
          const state = reveal && isRight ? 'right' : reveal && isPicked ? 'wrong' : 'idle';
          const bg = state === 'right' ? C.goodBg : state === 'wrong' ? C.badBg : C.card;
          const border = state === 'right' ? C.good : state === 'wrong' ? C.bad : C.line;
          const badge = state === 'right' ? C.good : state === 'wrong' ? C.bad : C.cardHi;
          return (
            <Pressable
              key={o.key}
              onPress={() => choose(o.key)}
              disabled={reveal}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: bg,
                borderColor: border,
                borderWidth: 2,
                borderRadius: R.md,
                padding: 14,
                flexDirection: 'row',
                gap: 14,
                alignItems: 'center',
                transform: [{ scale: pressed ? 0.98 : 1 }],
                opacity: reveal && state === 'idle' ? 0.55 : 1,
              })}
            >
              <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: badge, alignItems: 'center', justifyContent: 'center' }}>
                {state === 'idle' ? (
                  <T style={{ fontFamily: F.display, fontSize: 15 }}>{'ABCD'[idx]}</T>
                ) : (
                  <Ionicons name={state === 'right' ? 'checkmark' : 'close'} size={20} color={C.bg} />
                )}
              </View>
              {q.dir === 'en' ? (
                <T style={{ flex: 1, fontFamily: F.ka, fontSize: 15, lineHeight: 24 }}>{o.ka}</T>
              ) : (
                <T style={{ flex: 1, fontFamily: F.bold, fontSize: 16 }}>{o.word}</T>
              )}
            </Pressable>
          );
        })}
      </View>

      {wrong ? (
        <Pop style={{ gap: 12 }}>
          <T style={{ color: C.bad, fontFamily: F.bold, textAlign: 'center', fontSize: 15 }}>
            {picked === 'timeout' ? "Time's up!" : 'Not this time.'} It was “{q.w.word}”.
          </T>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <SpeakBtn word={q.w.word} size={56} />
            <Btn label={qi + 1 >= qs.length ? 'See results' : 'Next'} icon="arrow-forward" onPress={next} style={{ flex: 1 }} />
          </View>
        </Pop>
      ) : null}
    </Screen>
  );
}
