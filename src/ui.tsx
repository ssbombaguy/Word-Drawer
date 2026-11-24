import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, ScrollView, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGrad } from 'react-native-svg';
import { Scope, scopeUnit } from './data';
import { speakWord } from './feedback';
import { C, F, G, Grad, R } from './theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type ResultData = {
  title: string;
  headline: string;
  stats: [string, string][];
  xp: number;
  again: Route;
  great: boolean;
  crown?: boolean;
  unit?: number | null;
};
export type GameName = 'cards' | 'quiz' | 'match' | 'spell';
export type Route =
  | { name: 'home' }
  | { name: 'list' }
  | { name: 'unit'; unit: number }
  | { name: GameName; scope?: Scope; test?: boolean }
  | { name: 'results'; data: ResultData };
export type Nav = (r: Route) => void;

/** Where "back" goes from a game: the unit it came from, or home. */
export function backRoute(scope?: Scope): Route {
  const u = scopeUnit(scope);
  return u == null ? { name: 'home' } : { name: 'unit', unit: u };
}

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right', 'bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 18, gap: 18 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function T({ children, style, ...rest }: React.ComponentProps<typeof Text>) {
  return (
    <Text {...rest} style={[{ fontFamily: F.body, color: C.text, fontSize: 15 }, style]}>
      {children}
    </Text>
  );
}

export function IconBtn({ icon, onPress, label, color = C.text, size = 44 }: { icon: IconName; onPress: () => void; label: string; color?: string; size?: number }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pressed ? C.cardHi : C.card,
        borderWidth: 1,
        borderColor: C.line,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Ionicons name={icon} size={size * 0.48} color={color} />
    </Pressable>
  );
}

export function TopBar({ title, sub, onBack, right }: { title: string; sub?: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <IconBtn icon="chevron-back" onPress={onBack} label="Back" />
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: F.display, fontSize: 22 }} numberOfLines={1}>
          {title}
        </T>
        {sub ? (
          <T style={{ color: C.sub, fontSize: 12, fontFamily: F.bold }} numberOfLines={1}>
            {sub}
          </T>
        ) : null}
      </View>
      {right}
    </View>
  );
}

type BtnKind = 'primary' | 'good' | 'bad' | 'ghost' | 'white';
export function Btn({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: BtnKind;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const grad: Grad | null = kind === 'primary' ? G.violet : kind === 'good' ? G.good : kind === 'bad' ? G.bad : null;
  const fg = kind === 'white' ? '#1E1645' : C.text;
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, paddingHorizontal: 20 }}>
      {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <T style={{ fontFamily: F.bold, fontSize: 16, color: fg }}>{label}</T>
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        { borderRadius: R.md, overflow: 'hidden', opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
        kind === 'ghost' && { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
        kind === 'white' && { backgroundColor: '#FFFFFF' },
        style,
      ]}
    >
      {grad ? (
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? C.violet : C.line,
        backgroundColor: active ? C.violet : C.card,
      }}
    >
      <T style={{ fontFamily: F.bold, fontSize: 13, color: active ? '#FFFFFF' : C.sub }}>{label}</T>
    </Pressable>
  );
}

export function Pill({ icon, text, color, onPress }: { icon: IconName; text: string; color: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: C.line }}
    >
      <Ionicons name={icon} size={16} color={color} />
      <T style={{ fontFamily: F.bold, fontSize: 14 }}>{text}</T>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: C.card, borderRadius: R.lg, borderWidth: 1, borderColor: C.line, padding: 20 }, style]}>{children}</View>;
}

export function Label({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <T style={[{ fontFamily: F.bold, fontSize: 12, letterSpacing: 0.8, color: C.faint, textTransform: 'uppercase' }, style]}>{children}</T>;
}

export function Tag({ text, color = C.violet }: { text: string; color?: string }) {
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: color + '26', borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 }}>
      <T style={{ fontFamily: F.bold, fontSize: 12, color }}>{text}</T>
    </View>
  );
}

export function ProgressBar({ value, grad = G.violet, height = 10 }: { value: number; grad?: Grad; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, borderRadius: 999, backgroundColor: C.bg2, overflow: 'hidden' }}>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${pct}%`, height: '100%', borderRadius: 999 }} />
    </View>
  );
}

/** Circular progress ring for the daily goal. */
export function Ring({
  value,
  size = 96,
  stroke = 10,
  colors = ['#FDE68A', '#F97316'],
  track = 'rgba(255,255,255,0.18)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  colors?: Grad;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const id = `ring${colors[0].replace('#', '')}${colors[1].replace('#', '')}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgGrad id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </SvgGrad>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ * (1 - v)}
        />
      </Svg>
      {children}
    </View>
  );
}

export function SpeakBtn({ word, size = 44 }: { word: string; size?: number }) {
  return <IconBtn icon="volume-high" onPress={() => speakWord(word)} label={`Pronounce ${word}`} color={C.teal} size={size} />;
}

/** Five dots showing a card's level (Leitner box). */
export function LevelDots({ b }: { b: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={b ? `Level ${b} of 5` : 'New'}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i <= b ? (b === 5 ? C.good : C.violet) : C.line }} />
      ))}
    </View>
  );
}

const CONFETTI = ['#A78BFA', '#FBBF24', '#2DD4BF', '#FF6B81', '#4ADE80', '#FFFFFF'];
/** A one-shot confetti burst from the top of the screen. */
export function Confetti({ count = 42 }: { count?: number }) {
  const { width, height } = Dimensions.get('window');
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      v: new Animated.Value(0),
      x: Math.random() * width,
      drift: (Math.random() - 0.5) * 160,
      fall: height * (0.45 + Math.random() * 0.5),
      spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
      size: 6 + Math.random() * 8,
      color: CONFETTI[i % CONFETTI.length],
      delay: Math.random() * 300,
      round: Math.random() < 0.3,
    })),
  );
  useEffect(() => {
    Animated.parallel(
      pieces.map((p) => Animated.timing(p.v, { toValue: 1, duration: 1800 + Math.random() * 900, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: true })),
    ).start();
  }, [pieces]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -20,
            left: p.x,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            borderRadius: p.round ? p.size / 2 : 2,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.fall] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Springs in from small on mount — for scores, badges, combos. */
export function Pop({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(v, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
  }, [v]);
  return <Animated.View style={[{ opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }, style]}>{children}</Animated.View>;
}

export { Ionicons, LinearGradient };
