export type EraId = string & { __brand: 'EraId' };
export type GeneratorId = string & { __brand: 'GeneratorId' };
export type CodexId = string & { __brand: 'CodexId' };

export type TechniqueId =
  // Era 1-3 baseline (Antiquity through Penny Press)
  | 'impersonation'
  | 'emotion'
  | 'polarization'
  | 'conspiracy'
  | 'discrediting'
  | 'trolling'
  // Era 4+ additions (Propaganda State 1914-1945 and beyond)
  | 'big-lie'
  | 'atrocity-calibration'
  | 'monumental-aesthetic'
  | 'black-propaganda'
  | 'photographic-falsification'
  | 'manufactured-event';

export const ALL_TECHNIQUES: readonly TechniqueId[] = [
  'impersonation', 'emotion', 'polarization',
  'conspiracy', 'discrediting', 'trolling',
  'big-lie', 'atrocity-calibration', 'monumental-aesthetic',
  'black-propaganda', 'photographic-falsification', 'manufactured-event',
] as const;

export type ResourceId = 'rumor' | 'reach' | 'cred' | 'memetic_inheritance';
