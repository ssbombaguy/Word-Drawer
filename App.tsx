import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Flashcards from './src/screens/Flashcards';
import Home from './src/screens/Home';
import Match from './src/screens/Match';
import Quiz from './src/screens/Quiz';
import Results from './src/screens/Results';
import Spell from './src/screens/Spell';
import WordList from './src/screens/WordList';
import { StoreProvider, useStore } from './src/store';
import { C } from './src/theme';
import Unit from './src/screens/Unit';
import { prepareSpeech } from './src/feedback';
import { Route, backRoute } from './src/ui';

function Router() {
  const { ready } = useStore();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  // Each visit gets a fresh key so "Another round" starts a new session.
  const [visit, setVisit] = useState(0);
  const nav = (r: Route) => {
    setRoute(r);
    setVisit((v) => v + 1);
  };

  useEffect(() => {
    prepareSpeech();
  }, []);

  // Android back: games return to their unit (or home), a unit returns home.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name === 'home') return false;
      if (route.name === 'cards' || route.name === 'quiz' || route.name === 'match' || route.name === 'spell') nav(backRoute(route.scope));
      else if (route.name === 'results' && route.data.unit != null) nav({ name: 'unit', unit: route.data.unit });
      else nav({ name: 'home' });
      return true;
    });
    return () => sub.remove();
  }, [route]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.violet} />
      </View>
    );
  }

  switch (route.name) {
    case 'unit':
      return <Unit key={visit} nav={nav} unit={route.unit} />;
    case 'cards':
      return <Flashcards key={visit} nav={nav} scope={route.scope} />;
    case 'quiz':
      return <Quiz key={visit} nav={nav} scope={route.scope} test={route.test} />;
    case 'match':
      return <Match key={visit} nav={nav} scope={route.scope} />;
    case 'spell':
      return <Spell key={visit} nav={nav} scope={route.scope} />;
    case 'list':
      return <WordList key={visit} nav={nav} />;
    case 'results':
      return <Results key={visit} nav={nav} data={route.data} />;
    default:
      return <Home key={visit} nav={nav} />;
  }
}

export default function App() {
  // Load only the font files the app uses (the packages' index pulls in every weight).
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_800ExtraBold: require('@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf'),
    BricolageGrotesque_600SemiBold: require('@expo-google-fonts/bricolage-grotesque/600SemiBold/BricolageGrotesque_600SemiBold.ttf'),
    PlusJakartaSans_500Medium: require('@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf'),
    PlusJakartaSans_700Bold: require('@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf'),
    NotoSansGeorgian_500Medium: require('@expo-google-fonts/noto-sans-georgian/500Medium/NotoSansGeorgian_500Medium.ttf'),
    NotoSansGeorgian_700Bold: require('@expo-google-fonts/noto-sans-georgian/700Bold/NotoSansGeorgian_700Bold.ttf'),
  });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <SafeAreaProvider style={{ backgroundColor: C.bg }}>
      <StoreProvider>
        <StatusBar style="light" />
        <Router />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
