import React, { useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { CAT_LABEL, Scope, Word, scopeLabel, scopeUnit, scopeWords } from '../data';
import { buzz } from '../feedback';
import { pickSession, useStore } from '../store';
import { C, F, R } from '../theme';
import { Btn, Chip, Ionicons, LinearGradient, Nav, ProgressBar, Screen, SpeakBtn, T, Tag, TopBar, backRoute } from '../ui';

const SIZE = 15;
const CARD_H = 400;

export default function Flashcards({ nav, scope }: { nav: Nav; scope?: Scope }) {
  const { state, pool, grade, addXP, updateSettings } = useStore();
  // A lesson is studied whole; bigger sets are served 15 at a time.
  const [deck] = useState(() => {
    const words = scopeWords(scope, pool);
    return pickSession(words, state.prog, scope?.kind === 'lesson' ? words.length : SIZE);
  });
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState({ known: 0, again: 0, xp: 0 });
  const [flip] = useState(() => new Animated.Value(0));
  const dir = state.settings.cardDir;
  const w = deck[i];

  const doFlip = () => {
    buzz.tap();
    Animated.spring(flip, { toValue: flipped ? 0 : 180, friction: 8, tension: 60, useNativeDriver: true }).start();
    setFlipped(!flipped);
  };

  const answer = (ok: boolean) => {
    grade(w.key, ok);
    if (ok) buzz.good();
    else buzz.bad();
    const next = { known: tally.known + (ok ? 1 : 0), again: tally.again + (ok ? 0 : 1), xp: tally.xp + (ok ? 5 : 1) };
    setTally(next);
    if (i + 1 >= deck.length) {
      addXP(next.xp);
      nav({
        name: 'results',
        data: {
          title: 'Flashcards',
          headline: next.again === 0 ? 'Perfect round!' : next.known >= next.again ? 'Nice work!' : 'Good practice!',
          stats: [
            ['Knew it', `${next.known}`],
            ['Review again', `${next.again}`],
          ],
          xp: next.xp,
          again: { name: 'cards', scope },
          great: next.again === 0,
          unit: scopeUnit(scope),
        },
      });
      return;
    }
    flip.setValue(0);
    setFlipped(false);
    setI(i + 1);
  };

  if (!w) return null;

  const frontRot = flip.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRot = flip.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });
  const frontOp = flip.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [1, 1, 0, 0] });
  const backOp = flip.interpolate({ inputRange: [0, 89, 90, 180], outputRange: [0, 0, 1, 1] });
  const face = { position: 'absolute' as const, top: 0, left: 0, right: 0, height: CARD_H, backfaceVisibility: 'hidden' as const };

  return (
    <Screen>
      <TopBar
        title="Flashcards"
        sub={scopeLabel(scope)}
        onBack={() => nav(backRoute(scope))}
        right={<Chip label={dir === 'en' ? 'EN → KA' : 'KA → EN'} active={false} onPress={() => updateSettings({ cardDir: dir === 'en' ? 'ka' : 'en' })} />}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <ProgressBar value={(i + (flipped ? 0.5 : 0)) / deck.length} />
        </View>
        <T style={{ fontFamily: F.bold, color: C.sub, fontSize: 13 }}>{i + 1}/{deck.length}</T>
      </View>

      <Pressable onPress={doFlip} accessibilityRole="button" accessibilityLabel={flipped ? 'Answer side. Tap to flip back.' : 'Tap to see the answer.'}>
        <View style={{ height: CARD_H }}>
          {/* Only the visible side takes touches, so its speaker button works and the hidden side can't steal the tap. */}
          <Animated.View
            pointerEvents={flipped ? 'none' : 'auto'}
            style={[face, { opacity: frontOp, transform: [{ perspective: 1200 }, { rotateY: frontRot }] }]}
          >
            <Face w={w} side={dir === 'en' ? 'en' : 'ka'} hint="Tap to reveal" />
          </Animated.View>
          <Animated.View
            pointerEvents={flipped ? 'auto' : 'none'}
            style={[face, { opacity: backOp, transform: [{ perspective: 1200 }, { rotateY: backRot }] }]}
          >
            <Face w={w} side={dir === 'en' ? 'ka' : 'en'} answer />
          </Animated.View>
        </View>
      </Pressable>

      {flipped ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Btn label="Again" icon="refresh" kind="bad" onPress={() => answer(false)} style={{ flex: 1 }} />
          <Btn label="Got it" icon="checkmark" kind="good" onPress={() => answer(true)} style={{ flex: 1 }} />
        </View>
      ) : (
        <Btn label="Show answer" icon="eye" onPress={doFlip} />
      )}
      <T style={{ textAlign: 'center', color: C.faint, fontSize: 13 }}>+{tally.xp} XP this round</T>
    </Screen>
  );
}

function Face({ w, side, hint, answer }: { w: Word; side: 'en' | 'ka'; hint?: string; answer?: boolean }) {
  return (
    <View style={{ flex: 1, borderRadius: R.lg + 4, overflow: 'hidden', borderWidth: 1, borderColor: answer ? C.violet : C.line, backgroundColor: C.card }}>
      <LinearGradient
        colors={answer ? ['rgba(139,92,246,0.35)', 'rgba(28,23,64,0)'] : ['rgba(45,212,191,0.18)', 'rgba(28,23,64,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 18 }}>
        <Tag text={CAT_LABEL[w.cat]} color={C.teal} />
        <Tag text={`Unit ${w.unit}`} color={C.sub} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 }}>
        {side === 'en' ? (
          <>
            <T style={{ fontFamily: F.display, fontSize: 36, textAlign: 'center' }} adjustsFontSizeToFit numberOfLines={4}>
              {w.word}
            </T>
            {w.pos ? <T style={{ color: C.sub, fontSize: 15 }}>{w.pos}</T> : null}
            <SpeakBtn word={w.word} />
          </>
        ) : (
          <>
            <T style={{ fontFamily: F.kaBold, fontSize: 24, lineHeight: 38, textAlign: 'center' }} adjustsFontSizeToFit numberOfLines={6}>
              {w.ka}
            </T>
            {answer ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <T style={{ color: C.sub, fontFamily: F.bold, fontSize: 16, flexShrink: 1 }}>{w.word}</T>
                <SpeakBtn word={w.word} size={38} />
              </View>
            ) : null}
          </>
        )}
        {answer && w.root ? <T style={{ color: C.faint, fontSize: 13 }}>Word family: {w.root}</T> : null}
      </View>
      {hint ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingBottom: 18 }}>
          <Ionicons name="hand-left-outline" size={14} color={C.faint} />
          <T style={{ color: C.faint, fontSize: 13 }}>{hint}</T>
        </View>
      ) : (
        <View style={{ height: 18 }} />
      )}
    </View>
  );
}
