// Direction: a dark, glowing game board. Every mode owns a vivid gradient,
// type is a chunky grotesque for headlines and a friendly sans for text.
export const C = {
  bg: '#0E0B1E',
  bg2: '#151130',
  card: '#1C1740',
  cardHi: '#27205A',
  line: '#322A66',
  text: '#F5F3FF',
  sub: '#B3ADDB',
  faint: '#7A73A8',
  violet: '#8B5CF6',
  amber: '#FBBF24',
  teal: '#2DD4BF',
  coral: '#FF6B81',
  good: '#4ADE80',
  goodBg: '#123826',
  bad: '#FB7185',
  badBg: '#3D1424',
  flame: '#FF8A3D',
};

export type Grad = readonly [string, string];
export const G = {
  violet: ['#A78BFA', '#6D28D9'] as Grad,
  amber: ['#FCD34D', '#F97316'] as Grad,
  teal: ['#5EEAD4', '#0EA5E9'] as Grad,
  coral: ['#FF8FA3', '#E11D48'] as Grad,
  good: ['#86EFAC', '#16A34A'] as Grad,
  bad: ['#FDA4AF', '#E11D48'] as Grad,
  hero: ['#7C3AED', '#4338CA'] as Grad,
};

const UNIT_GRADS: Grad[] = [G.violet, G.teal, G.amber, G.coral];
/** Each unit keeps its own colour on the path. */
export function unitGrad(unit: number): Grad {
  return UNIT_GRADS[Math.floor(unit / 2) % UNIT_GRADS.length];
}

export const F = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayMid: 'BricolageGrotesque_600SemiBold',
  body: 'PlusJakartaSans_500Medium',
  bold: 'PlusJakartaSans_700Bold',
  ka: 'NotoSansGeorgian_500Medium',
  kaBold: 'NotoSansGeorgian_700Bold',
};

export const R = { sm: 12, md: 18, lg: 26 };
