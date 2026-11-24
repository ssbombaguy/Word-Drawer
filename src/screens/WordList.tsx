import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CAT_LABEL, norm } from '../data';
import { speakWord } from '../feedback';
import { useStore } from '../store';
import { C, F, R } from '../theme';
import { Ionicons, LevelDots, Nav, Pill, T, TopBar } from '../ui';

export default function WordList({ nav }: { nav: Nav }) {
  const { pool, state } = useStore();
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const n = norm(q);
    if (!n) return pool;
    return pool.filter((w) => norm(w.word).includes(n) || w.ka.includes(q.trim()));
  }, [pool, q]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <View style={{ paddingHorizontal: 18, paddingTop: 18, gap: 14 }}>
        <TopBar title="Word List" onBack={() => nav({ name: 'home' })} right={<Pill icon="albums" text={`${rows.length}`} color={C.violet} />} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 14 }}>
          <Ionicons name="search" size={18} color={C.faint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search English or Georgian"
            placeholderTextColor={C.faint}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ flex: 1, paddingVertical: 14, fontSize: 16, fontFamily: F.body, color: C.text }}
          />
          {q ? (
            <Pressable onPress={() => setQ('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={C.faint} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(w) => w.key}
        contentContainerStyle={{ padding: 18, gap: 10, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<T style={{ color: C.sub, textAlign: 'center', marginTop: 24 }}>Nothing matches “{q}”.</T>}
        renderItem={({ item: w }) => (
          <Pressable
            onPress={() => speakWord(w.word)}
            accessibilityRole="button"
            accessibilityHint="Plays the pronunciation"
            style={({ pressed }) => ({
              backgroundColor: pressed ? C.cardHi : C.card,
              borderRadius: R.md,
              borderWidth: 1,
              borderColor: C.line,
              padding: 14,
              gap: 6,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T style={{ flex: 1, fontFamily: F.bold, fontSize: 16 }}>{w.word}</T>
              <LevelDots b={state.prog[w.key]?.b ?? 0} />
              <Ionicons name="volume-medium" size={18} color={C.teal} />
            </View>
            <T style={{ fontFamily: F.ka, fontSize: 14, lineHeight: 22, color: C.sub }}>{w.ka}</T>
            <T style={{ fontSize: 12, color: C.faint }}>
              Unit {w.unit} · {w.pos || CAT_LABEL[w.cat]}{w.root ? ` · from “${w.root}”` : ''}
            </T>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
