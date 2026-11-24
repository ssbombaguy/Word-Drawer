import React from 'react';
import { View } from 'react-native';
import { DAILY_GOAL, currentStreak, todayXP, useStore } from '../store';
import { C, F, G } from '../theme';
import { Btn, Card, Confetti, Ionicons, LinearGradient, Nav, Pop, ProgressBar, ResultData, Screen, T } from '../ui';

export default function Results({ nav, data }: { nav: Nav; data: ResultData }) {
  const { state } = useStore();
  const today = todayXP(state);
  const streak = currentStreak(state);
  const goalHit = today >= DAILY_GOAL;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Screen>
        <View style={{ alignItems: 'center', gap: 14, paddingTop: 24 }}>
          <Pop>
            <LinearGradient colors={data.great ? G.amber : G.violet} style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={data.crown ? 'trophy' : data.great ? 'star' : 'ribbon'} size={56} color="#FFFFFF" />
            </LinearGradient>
            {data.crown ? (
              <T style={{ color: C.amber, fontFamily: F.bold, textAlign: 'center', marginTop: 10 }}>Gold crown earned · +50 bonus XP</T>
            ) : null}
          </Pop>
          <T style={{ color: C.sub, fontFamily: F.bold }}>{data.title}</T>
          <T style={{ fontFamily: F.display, fontSize: 34, textAlign: 'center' }}>{data.headline}</T>
          <Pop>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(251,191,36,0.15)', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 }}>
              <Ionicons name="flash" size={22} color={C.amber} />
              <T style={{ fontFamily: F.display, fontSize: 24, color: C.amber }}>+{data.xp} XP</T>
            </View>
          </Pop>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {data.stats.map(([k, v]) => (
            <Card key={k} style={{ flex: 1, padding: 14, alignItems: 'center', gap: 4 }}>
              <T style={{ fontFamily: F.display, fontSize: 24 }}>{v}</T>
              <T style={{ color: C.sub, fontSize: 12, textAlign: 'center' }}>{k}</T>
            </Card>
          ))}
        </View>

        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="flame" size={20} color={C.flame} />
              <T style={{ fontFamily: F.bold }}>{streak} day streak</T>
            </View>
            <T style={{ color: goalHit ? C.good : C.sub, fontFamily: F.bold, fontSize: 13 }}>
              {goalHit ? 'Daily goal done' : `${today}/${DAILY_GOAL} XP today`}
            </T>
          </View>
          <ProgressBar value={today / DAILY_GOAL} grad={goalHit ? G.good : G.amber} />
        </Card>

        <View style={{ gap: 10, marginTop: 4 }}>
          <Btn label={data.crown ? 'Try again' : 'Play again'} icon="refresh" onPress={() => nav(data.again)} />
          {data.unit != null ? (
            <Btn label={`Back to Unit ${data.unit}`} icon="layers" kind="ghost" onPress={() => nav({ name: 'unit', unit: data.unit as number })} />
          ) : null}
          <Btn label="Home" icon="home" kind="ghost" onPress={() => nav({ name: 'home' })} />
        </View>
      </Screen>
      <Confetti count={data.great ? 60 : 30} />
    </View>
  );
}
