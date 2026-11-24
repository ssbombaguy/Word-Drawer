import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { LESSONS, UNIT_THEME, UNIT_WORDS, isSpellable } from '../data';
import { CROWN_AT, TEST_UNLOCK, progressOf, useStore } from '../store';
import { C, F, G, Grad, R, unitGrad } from '../theme';
import { Card, IconName, Ionicons, LinearGradient, Nav, ProgressBar, Ring, Screen, T, TopBar } from '../ui';

export default function Unit({ nav, unit }: { nav: Nav; unit: number }) {
  const { state } = useStore();
  const [now] = useState(() => Date.now());
  const words = useMemo(() => UNIT_WORDS[unit] ?? [], [unit]);
  const lessons = useMemo(() => LESSONS.filter((l) => l.unit === unit), [unit]);
  const p = progressOf(words, state.prog, now);
  const grad = unitGrad(unit);
  const best = state.unitBest[unit];
  const crowned = best != null && best >= CROWN_AT;
  const testOpen = p.seen >= Math.ceil(words.length * TEST_UNLOCK);
  const scope = { kind: 'unit' as const, unit };

  // First lesson that still has unseen or due cards is the suggested next step.
  const nextLesson = lessons.find((l) => {
    const lp = progressOf(l.words, state.prog, now);
    return lp.seen < lp.total || lp.due > 0;
  });

  const games: { key: 'cards' | 'quiz' | 'match' | 'spell'; label: string; icon: IconName; grad: Grad; ok: boolean }[] = [
    { key: 'cards', label: 'Cards', icon: 'albums', grad: G.violet, ok: words.length >= 1 },
    { key: 'quiz', label: 'Quiz', icon: 'flash', grad: G.amber, ok: words.length >= 1 },
    { key: 'match', label: 'Match', icon: 'grid', grad: G.teal, ok: words.length >= 6 },
    { key: 'spell', label: 'Spell', icon: 'create', grad: G.coral, ok: words.some(isSpellable) },
  ];

  return (
    <Screen>
      <TopBar title={`Unit ${unit}`} sub={UNIT_THEME[unit]} onBack={() => nav({ name: 'home' })} />

      {/* Summary */}
      <LinearGradient colors={['#231C52', '#1A1540']} style={{ borderRadius: R.lg, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 18, borderWidth: 1, borderColor: C.line }}>
        <Ring value={p.mastery} size={104} stroke={11} colors={grad} track={C.line}>
          <T style={{ fontFamily: F.display, fontSize: 24 }}>{Math.round(p.mastery * 100)}%</T>
        </Ring>
        <View style={{ flex: 1, gap: 6 }}>
          <T style={{ fontFamily: F.bold, fontSize: 16 }}>{p.learned} of {p.total} learned</T>
          <T style={{ color: C.sub, fontSize: 13 }}>
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} · {p.due ? `${p.due} due now` : 'nothing due'}
          </T>
          {crowned ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trophy" size={16} color={C.amber} />
              <T style={{ color: C.amber, fontFamily: F.bold, fontSize: 13 }}>Crowned · best {best}%</T>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      {/* Lessons */}
      <View style={{ gap: 10 }}>
        <T style={{ fontFamily: F.display, fontSize: 20 }}>Lessons</T>
        {lessons.map((l, i) => {
          const lp = progressOf(l.words, state.prog, now);
          const done = lp.learned === lp.total;
          const isNext = nextLesson?.id === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => nav({ name: 'cards', scope: { kind: 'lesson', id: l.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Lesson ${i + 1}, ${l.title}, ${lp.learned} of ${lp.total} learned`}
              style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
            >
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderColor: isNext ? grad[0] : C.line, borderWidth: isNext ? 2 : 1 }}>
                <View style={{ width: 46, height: 46, borderRadius: 23, overflow: 'hidden' }}>
                  {done ? (
                    <LinearGradient colors={G.good} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cardHi }}>
                      <T style={{ fontFamily: F.display, fontSize: 18, color: grad[0] }}>{i + 1}</T>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <T style={{ flex: 1, fontFamily: F.bold, fontSize: 15 }} numberOfLines={2}>{l.title}</T>
                    {isNext ? (
                      <View style={{ backgroundColor: grad[0] + '30', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <T style={{ color: grad[0], fontFamily: F.bold, fontSize: 11 }}>UP NEXT</T>
                      </View>
                    ) : null}
                  </View>
                  <ProgressBar value={lp.mastery} grad={done ? G.good : grad} height={7} />
                  <T style={{ color: C.faint, fontSize: 12 }}>
                    {lp.total} cards · {lp.learned} learned{lp.due ? ` · ${lp.due} due` : ''}
                  </T>
                </View>
                <Ionicons name="play-circle" size={30} color={grad[0]} />
              </Card>
            </Pressable>
          );
        })}
      </View>

      {/* Practise the whole unit */}
      <View style={{ gap: 10 }}>
        <T style={{ fontFamily: F.display, fontSize: 20 }}>Practise all of Unit {unit}</T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {games.map((g) => (
            <Pressable
              key={g.key}
              disabled={!g.ok}
              onPress={() => nav({ name: g.key, scope })}
              accessibilityRole="button"
              accessibilityLabel={`${g.label} for unit ${unit}`}
              style={({ pressed }) => ({ flex: 1, opacity: g.ok ? 1 : 0.35, transform: [{ scale: pressed ? 0.95 : 1 }] })}
            >
              <LinearGradient colors={g.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: R.md, paddingVertical: 14, alignItems: 'center', gap: 6 }}>
                <Ionicons name={g.icon} size={22} color="#FFFFFF" />
                <T style={{ fontFamily: F.bold, fontSize: 13, color: '#FFFFFF' }}>{g.label}</T>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Unit test */}
      <Pressable
        disabled={!testOpen}
        onPress={() => nav({ name: 'quiz', scope, test: true })}
        accessibilityRole="button"
        accessibilityLabel={testOpen ? `Unit ${unit} test` : `Unit ${unit} test, locked`}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
      >
        <LinearGradient
          colors={testOpen ? G.amber : [C.card, C.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: R.lg, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: testOpen ? 0 : 1, borderColor: C.line }}
        >
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: testOpen ? 'rgba(255,255,255,0.25)' : C.cardHi, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={testOpen ? 'trophy' : 'lock-closed'} size={26} color={testOpen ? '#FFFFFF' : C.faint} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T style={{ fontFamily: F.display, fontSize: 18, color: testOpen ? '#FFFFFF' : C.sub }}>Unit Test</T>
            <T style={{ fontSize: 13, color: testOpen ? 'rgba(255,255,255,0.9)' : C.faint }}>
              {testOpen
                ? best != null
                  ? `Best ${best}% · ${crowned ? 'crown earned' : `score ${CROWN_AT}% for the crown`}`
                  : `Score ${CROWN_AT}% or more to earn the crown`
                : `Study ${Math.ceil(words.length * TEST_UNLOCK) - p.seen} more cards to unlock`}
            </T>
          </View>
          {testOpen ? <Ionicons name="chevron-forward" size={22} color="#FFFFFF" /> : null}
        </LinearGradient>
      </Pressable>
    </Screen>
  );
}
