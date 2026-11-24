import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native';
import { CAT_LABEL, Scope, isSpellable, norm, sample, scopeLabel, scopeUnit, scopeWords } from '../data';
import { buzz } from '../feedback';
import { useStore } from '../store';
import { C, F, G, R } from '../theme';
import { Btn, Card, Nav, Pill, Pop, ProgressBar, Screen, SpeakBtn, T, Tag, TopBar, backRoute } from '../ui';

const ROUNDS = 10;

export default function Spell({ nav, scope }: { nav: Nav; scope?: Scope }) {
  const { pool, grade, addXP } = useStore();
  const spellable = useMemo(() => scopeWords(scope, pool).filter(isSpellable), [scope, pool]);
  const back = () => nav(backRoute(scope));
  const [words] = useState(() => sample(spellable, ROUNDS));
  const [ri, setRi] = useState(0);
  const [input, setInput] = useState('');
  const [hints, setHints] = useState(0);
  const [status, setStatus] = useState<'ask' | 'right' | 'wrong'>('ask');
  const [tally, setTally] = useState({ right: 0, xp: 0 });
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const w = words[ri];

  if (!w) {
    return (
      <Screen>
        <TopBar title="Spell It" sub={scopeLabel(scope)} onBack={back} />
        <Card>
          <T style={{ color: C.sub, lineHeight: 22 }}>
            This deck only has phrases with slashes or brackets, which are hard to type. Add plain words or more units in “Your deck”.
          </T>
        </Card>
      </Screen>
    );
  }

  const target = norm(w.word);
  const typed = norm(input).replace(/ /g, '');
  const letterCount = target.replace(/ /g, '').length;
  // One slot per letter: shows hints, your typing, or the answer once checked.
  let li = 0;
  const slots = target.split('').map((ch, idx) => {
    if (ch === ' ') return { key: idx, space: true, ch: '', kind: 'empty' as const };
    const n = li++;
    if (status !== 'ask') return { key: idx, space: false, ch, kind: status === 'right' ? ('right' as const) : ('answer' as const) };
    if (n < hints) return { key: idx, space: false, ch, kind: 'hint' as const };
    const t = typed[n];
    return { key: idx, space: false, ch: t ?? '', kind: t ? ('typed' as const) : ('empty' as const) };
  });

  const check = () => {
    if (status !== 'ask' || !input.trim()) return;
    const ok = norm(input) === target;
    grade(w.key, ok);
    if (ok) {
      buzz.good();
      setTally((t) => ({ right: t.right + 1, xp: t.xp + Math.max(5, 15 - hints * 4) }));
      setStatus('right');
    } else {
      buzz.bad();
      setStatus('wrong');
    }
  };

  const giveUp = () => {
    grade(w.key, false);
    buzz.bad();
    setStatus('wrong');
  };

  const next = () => {
    if (ri + 1 >= words.length) {
      addXP(tally.xp);
      nav({
        name: 'results',
        data: {
          title: 'Spell It',
          headline: tally.right === words.length ? 'Spot on!' : tally.right >= words.length * 0.7 ? 'Well spelt!' : 'Practice makes perfect',
          stats: [['Spelt right', `${tally.right}/${words.length}`]],
          xp: tally.xp,
          again: { name: 'spell', scope },
          great: tally.right >= words.length * 0.8,
          unit: scopeUnit(scope),
        },
      });
      return;
    }
    setRi(ri + 1);
    setInput('');
    setHints(0);
    setStatus('ask');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const slotSize = letterCount > 12 ? 24 : 32;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <TopBar title="Spell It" sub={scopeLabel(scope)} onBack={back} right={<Pill icon="flash" text={`+${tally.xp}`} color={C.amber} />} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={ri / words.length} grad={G.coral} />
          </View>
          <T style={{ fontFamily: F.bold, color: C.sub, fontSize: 13 }}>{ri + 1}/{words.length}</T>
        </View>

        <Card style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Tag text={w.pos || CAT_LABEL[w.cat]} color={C.coral} />
            <Tag text={`Unit ${w.unit}`} color={C.sub} />
          </View>
          <T style={{ fontFamily: F.kaBold, fontSize: 22, lineHeight: 36 }}>{w.ka}</T>

          {/* Letter slots — tap to focus the keyboard */}
          <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel={`${letterCount} letters`}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
              {slots.map((s) =>
                s.space ? (
                  <View key={s.key} style={{ width: slotSize / 2 }} />
                ) : (
                  <View
                    key={s.key}
                    style={{
                      width: slotSize,
                      height: slotSize + 8,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: s.kind === 'right' ? C.goodBg : s.kind === 'answer' ? C.badBg : s.kind === 'hint' ? 'rgba(251,191,36,0.18)' : C.bg2,
                      borderWidth: 2,
                      borderColor: s.kind === 'right' ? C.good : s.kind === 'answer' ? C.bad : s.kind === 'hint' ? C.amber : s.kind === 'typed' ? C.violet : C.line,
                    }}
                  >
                    <T style={{ fontFamily: F.display, fontSize: slotSize * 0.55, color: s.kind === 'hint' ? C.amber : C.text }}>{s.ch.toUpperCase()}</T>
                  </View>
                ),
              )}
            </View>
          </Pressable>
          <T style={{ color: C.faint, fontSize: 13 }}>{letterCount} letters</T>
        </Card>

        <TextInput
          ref={inputRef}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={status === 'ask' ? check : next}
          editable={status === 'ask'}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          returnKeyType="done"
          placeholder="Type the English word…"
          placeholderTextColor={C.faint}
          style={{
            backgroundColor: C.card,
            borderWidth: 2,
            borderColor: status === 'right' ? C.good : status === 'wrong' ? C.bad : C.line,
            borderRadius: R.md,
            padding: 16,
            fontSize: 18,
            fontFamily: F.bold,
            color: C.text,
          }}
        />

        {status === 'ask' ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Btn label="Hint" icon="bulb" kind="ghost" onPress={() => setHints((h) => Math.min(letterCount, h + 1))} disabled={hints >= letterCount} style={{ flex: 1 }} />
              <Btn label="Check" icon="checkmark" onPress={check} disabled={!input.trim()} style={{ flex: 2 }} />
            </View>
            <Pressable onPress={giveUp} hitSlop={8} style={{ alignSelf: 'center' }}>
              <T style={{ color: C.faint, fontSize: 14 }}>{"I don't know this one"}</T>
            </Pressable>
          </View>
        ) : (
          <Pop style={{ gap: 12 }}>
            <T style={{ color: status === 'right' ? C.good : C.bad, fontFamily: F.display, textAlign: 'center', fontSize: 20 }}>
              {status === 'right' ? (hints ? 'Correct!' : 'Correct, no hints!') : `It's “${w.word}”`}
            </T>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <SpeakBtn word={w.word} size={56} />
              <Btn label={ri + 1 >= words.length ? 'See results' : 'Next word'} icon="arrow-forward" kind={status === 'right' ? 'good' : 'primary'} onPress={next} style={{ flex: 1 }} />
            </View>
          </Pop>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
