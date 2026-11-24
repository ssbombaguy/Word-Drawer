import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

/*
 * Audio note: on Android, expo-speech builds the locale with
 * Locale.Builder().setLanguage(options.language), which only accepts a bare
 * language code. "en-GB" is rejected and it silently falls back to the phone's
 * own language (Georgian here, which has no voice), so nothing plays.
 * We pass "en" and pick an installed English voice by name instead.
 */
let voiceId: string | undefined;
let voiceLookup: Promise<void> | null = null;

function rank(v: Speech.Voice): number {
  const lang = v.language.replace('_', '-').toLowerCase();
  const id = v.identifier.toLowerCase();
  let s = 0;
  if (lang === 'en-gb') s += 100;
  else if (lang === 'en-us') s += 60;
  else if (lang.startsWith('en')) s += 30;
  else return -1;
  if (!id.includes('network')) s += 20; // works offline
  if (v.quality === Speech.VoiceQuality.Enhanced) s += 5;
  return s;
}

function findVoice(): Promise<void> {
  if (!voiceLookup) {
    voiceLookup = Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const best = voices.map((v) => [rank(v), v] as const).filter(([r]) => r >= 0).sort((a, b) => b[0] - a[0])[0];
        voiceId = best?.[1].identifier;
      })
      .catch(() => {
        voiceLookup = null; // try again next time
      });
  }
  return voiceLookup;
}

/**
 * Warm up at app start. Google's engine loads the voice model on its first
 * request (about 4 s on a Redmi Note 9), so we send one muted utterance now
 * and the first real tap plays straight away.
 */
export function prepareSpeech() {
  findVoice().then(() => {
    Speech.speak('a', { language: 'en', voice: voiceId, volume: 0 });
  });
}

/** Read an entry aloud in English, expanding "sb"/"sth". */
export async function speakWord(word: string) {
  const text = word
    .replace(/\bsb\b/gi, 'somebody')
    .replace(/\bsth\b/gi, 'something')
    .replace(/[()]/g, '')
    .replace(/\s*\/\s*/g, ', ');
  await findVoice();
  Speech.stop();
  Speech.speak(text, { language: 'en', voice: voiceId, rate: 0.9 });
}

export const buzz = {
  tap: () => Haptics.selectionAsync().catch(() => {}),
  good: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  bad: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};
