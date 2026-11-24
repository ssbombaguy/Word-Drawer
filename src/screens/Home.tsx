import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CAT_LABEL, CAT_ORDER, UNITS, UNIT_THEME, UNIT_WORDS, wordOfDay } from '../data';
import { CROWN_AT, DAILY_GOAL, currentStreak, dayStr, progressOf, todayXP, useStore } from '../store';
import { C, F, G, Grad, R, unitGrad } from '../theme';
import { Btn, Card, Chip, IconName, Ionicons, Label, LinearGradient, Nav, Pill, Ring, SpeakBtn, T, Tag } from '../ui';

type ModeKey = 'cards' | 'quiz' | 'match' | 'spell';

export default function Home({ nav }: { nav: Nav }) {
  const { state, pool, updateSettings, resetProgress } = useStore();
  const { units, cats } = state.settings;
  const [deckOpen, setDeckOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [now] = useState(() => Date.now());
  const wod = wordOfDay(dayStr());
  const streak = currentStreak(state);
  const today = todayXP(state);
  const left = Math.max(0, DAILY_GOAL - today);

  const stats = useMemo(() => {
    let fresh = 0, learning = 0, mastered = 0, due = 0;
    for (const w of pool) {
      const p = state.prog[w.key];
      if (!p) fresh++;
      else if (p.b >= 5) mastered++;
      else learning++;
      if (p && p.due <= now) due++;
    }
    return { fresh, learning, mastered, due };
  }, [pool, state.prog, now]);

  const deckName =
    (units.length ? [...units].sort((a, b) => a - b).map((u) => `U${u}`).join(', ') : 'All units') +
    ' · ' +
    (cats.length ? cats.map((c) => CAT_LABEL[c]).join(', ') : 'All types');

  const modes: { key: ModeKey; title: string; sub: string; icon: IconName; grad: Grad; min: number }[] = [
    { key: 'cards', title: 'Flashcards', sub: stats.due ? `${stats.due} due` : `${stats.fresh} new`, icon: 'albums', grad: G.violet, min: 1 },
    { key: 'quiz', title: 'Speed Quiz', sub: '10 questions', icon: 'flash', grad: G.amber, min: 4 },
    { key: 'match', title: 'Match Up', sub: state.bestMatch ? `Best ${state.bestMatch}s` : '6 pairs', icon: 'grid', grad: G.teal, min: 6 },
    { key: 'spell', title: 'Spell It', sub: 'Type the word', icon: 'create', grad: G.coral, min: 4 },
  ];

  const total = Math.max(1, pool.length);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 18, gap: 20, paddingBottom: 48 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ flexShrink: 1 }}>
            <T style={{ color: C.sub, fontSize: 14 }}>გამარჯობა!</T>
            <T style={{ fontFamily: F.display, fontSize: 28 }}>Word Drawer</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pill icon="flame" text={`${streak}`} color={C.flame} />
            <Pill icon="flash" text={`${state.xp}`} color={C.amber} />
          </View>
        </View>

        {/* Hero: daily goal */}
        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: R.lg, padding: 20, gap: 18, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <T style={{ color: 'rgba(255,255,255,0.75)', fontFamily: F.bold, fontSize: 13 }}>DAILY GOAL</T>
              <T style={{ fontFamily: F.display, fontSize: 30 }}>
                {today}
                <T style={{ fontFamily: F.displayMid, fontSize: 18, color: 'rgba(255,255,255,0.7)' }}> / {DAILY_GOAL} XP</T>
              </T>
              <T style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                {left ? `${left} XP to go. You've got this.` : 'Goal smashed! Keep the streak alive.'}
              </T>
            </View>
            <Ring value={today / DAILY_GOAL}>
              <Ionicons name={left ? 'trophy-outline' : 'trophy'} size={30} color="#FDE68A" />
            </Ring>
          </View>
          <Btn
            label={stats.due ? `Continue · ${stats.due} due` : 'Start learning'}
            icon="play"
            kind="white"
            onPress={() => nav({ name: 'cards' })}
            disabled={!pool.length}
          />
        </LinearGradient>

        {/* Units path */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <T style={{ fontFamily: F.display, fontSize: 20 }}>Units</T>
            <T style={{ color: C.sub, fontSize: 13 }}>
              {UNITS.filter((u) => (state.unitBest[u] ?? 0) >= CROWN_AT).length}/{UNITS.length} crowned
            </T>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {UNITS.map((u) => {
              const up = progressOf(UNIT_WORDS[u], state.prog, now);
              const crowned = (state.unitBest[u] ?? 0) >= CROWN_AT;
              const grad = unitGrad(u);
              return (
                <Pressable
                  key={u}
                  onPress={() => nav({ name: 'unit', unit: u })}
                  accessibilityRole="button"
                  accessibilityLabel={`Unit ${u}, ${UNIT_THEME[u]}, ${Math.round(up.mastery * 100)} percent`}
                  style={({ pressed }) => ({ width: '31%', transform: [{ scale: pressed ? 0.95 : 1 }] })}
                >
                  <Card style={{ paddingVertical: 12, paddingHorizontal: 6, borderRadius: R.md, alignItems: 'center', gap: 6, borderColor: crowned ? C.amber : C.line }}>
                    {crowned ? (
                      <View style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Ionicons name="trophy" size={14} color={C.amber} />
                      </View>
                    ) : up.due ? (
                      <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: C.coral, borderRadius: 999, minWidth: 18, height: 18, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' }}>
                        <T style={{ fontFamily: F.bold, fontSize: 10, color: '#FFFFFF' }}>{up.due}</T>
                      </View>
                    ) : null}
                    <Ring value={up.mastery} size={58} stroke={6} colors={grad} track={C.line}>
                      <T style={{ fontFamily: F.display, fontSize: 19 }}>{u}</T>
                    </Ring>
                    <T
                      style={{ fontFamily: F.bold, fontSize: 11, lineHeight: 15, textAlign: 'center', color: C.sub, minHeight: 30 }}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      textBreakStrategy="simple"
                    >
                      {UNIT_THEME[u]}
                    </T>
                    <T style={{ fontSize: 11, color: C.faint }}>
                      {UNIT_WORDS[u].length} {UNIT_WORDS[u].length === 1 ? 'card' : 'cards'}
                    </T>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Deck */}
        <Pressable onPress={() => setDeckOpen(true)} accessibilityRole="button" accessibilityLabel="Change deck">
          <Card style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Label>Mixed practice deck · {pool.length} cards</Label>
                <T style={{ fontFamily: F.bold, fontSize: 15 }} numberOfLines={1}>{deckName}</T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <T style={{ color: C.violet, fontFamily: F.bold, fontSize: 14 }}>Change</T>
                <Ionicons name="chevron-forward" size={16} color={C.violet} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', height: 12, borderRadius: 999, overflow: 'hidden', backgroundColor: C.bg2 }}>
              <View style={{ flex: stats.mastered / total, backgroundColor: C.good }} />
              <View style={{ flex: stats.learning / total, backgroundColor: C.violet }} />
              <View style={{ flex: stats.fresh / total, backgroundColor: C.line }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Legend color={C.good} label="Mastered" n={stats.mastered} />
              <Legend color={C.violet} label="Learning" n={stats.learning} />
              <Legend color={C.line} label="New" n={stats.fresh} />
            </View>
          </Card>
        </Pressable>

        {/* Modes */}
        <View style={{ gap: 12 }}>
          <T style={{ fontFamily: F.display, fontSize: 20 }}>Quick play · your deck</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {modes.map((m) => {
              const off = pool.length < m.min;
              return (
                <Pressable
                  key={m.key}
                  disabled={off}
                  onPress={() => nav({ name: m.key })}
                  accessibilityRole="button"
                  accessibilityLabel={m.title}
                  style={({ pressed }) => ({ width: '48%', flexGrow: 1, opacity: off ? 0.4 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] })}
                >
                  <LinearGradient colors={m.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: R.lg, padding: 16, height: 150, justifyContent: 'space-between', overflow: 'hidden' }}>
                    <View style={{ position: 'absolute', right: -18, bottom: -18, opacity: 0.18 }}>
                      <Ionicons name={m.icon} size={110} color="#FFFFFF" />
                    </View>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={m.icon} size={24} color="#FFFFFF" />
                    </View>
                    <View>
                      <T style={{ fontFamily: F.display, fontSize: 19, color: '#FFFFFF' }}>{m.title}</T>
                      <T style={{ fontFamily: F.bold, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{off ? `Needs ${m.min}+ cards` : m.sub}</T>
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Word of the day */}
        <Card style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tag text="Word of the day" color={C.amber} />
            <SpeakBtn word={wod.word} size={40} />
          </View>
          <T style={{ fontFamily: F.display, fontSize: 26 }}>{wod.word}</T>
          <T style={{ fontFamily: F.ka, fontSize: 16, lineHeight: 26, color: C.sub }}>{wod.ka}</T>
          <T style={{ color: C.faint, fontSize: 13 }}>Unit {wod.unit} · {wod.pos || CAT_LABEL[wod.cat]}</T>
        </Card>

        {/* Word list */}
        <Pressable onPress={() => nav({ name: 'list' })} accessibilityRole="button">
          {({ pressed }) => (
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: pressed ? C.cardHi : C.card }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.cardHi, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="book" size={22} color={C.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontFamily: F.bold, fontSize: 16 }}>Word list</T>
                <T style={{ color: C.sub, fontSize: 13 }}>Search all {pool.length} entries and hear them</T>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.faint} />
            </Card>
          )}
        </Pressable>

        <View style={{ alignItems: 'center' }}>
          {confirmReset ? (
            <View style={{ flexDirection: 'row', gap: 20 }}>
              <Pressable onPress={() => { resetProgress(); setConfirmReset(false); }}>
                <T style={{ color: C.bad, fontFamily: F.bold }}>Yes, erase everything</T>
              </Pressable>
              <Pressable onPress={() => setConfirmReset(false)}>
                <T style={{ color: C.sub }}>Cancel</T>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setConfirmReset(true)} hitSlop={10}>
              <T style={{ color: C.faint, fontSize: 13 }}>Reset progress</T>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Deck picker sheet */}
      <Modal visible={deckOpen} transparent animationType="slide" onRequestClose={() => setDeckOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(5,3,15,0.6)' }} onPress={() => setDeckOpen(false)} accessibilityLabel="Close deck picker" />
        <View style={{ backgroundColor: C.bg2, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 36, gap: 14, borderWidth: 1, borderColor: C.line }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: C.line }} />
          <T style={{ fontFamily: F.display, fontSize: 22 }}>Choose your deck</T>
          <Label>Units</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="All" active={!units.length} onPress={() => updateSettings({ units: [] })} />
            {UNITS.map((u) => (
              <Chip key={u} label={`Unit ${u}`} active={units.includes(u)} onPress={() => updateSettings({ units: units.includes(u) ? units.filter((x) => x !== u) : [...units, u] })} />
            ))}
          </View>
          <Label style={{ marginTop: 6 }}>Types</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="All" active={!cats.length} onPress={() => updateSettings({ cats: [] })} />
            {CAT_ORDER.map((c) => (
              <Chip key={c} label={CAT_LABEL[c]} active={cats.includes(c)} onPress={() => updateSettings({ cats: cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c] })} />
            ))}
          </View>
          <Btn label={`Done · ${pool.length} cards`} onPress={() => setDeckOpen(false)} style={{ marginTop: 8 }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Legend({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <T style={{ color: C.sub, fontSize: 13 }}>
        {label} <T style={{ fontFamily: F.bold, fontSize: 13 }}>{n}</T>
      </T>
    </View>
  );
}
