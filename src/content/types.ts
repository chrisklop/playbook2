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
  // Era 4 — Propaganda State 1914-1945
  | 'big-lie'
  | 'atrocity-calibration'
  | 'monumental-aesthetic'
  | 'black-propaganda'
  | 'photographic-falsification'
  | 'manufactured-event'
  // Era 5 — Talk Radio & Cable 1987-1999
  | 'talk-radio-outrage'
  | 'drudge-drop'
  | 'false-balance'
  | 'evangelical-alliance'
  | 'victim-grievance'
  | 'cable-news-panel'
  // Era 6 — Forever War & The Birther Years 2000-2014
  | 'chain-email'
  | 'wmd-packaging'
  | 'swift-boating'
  | 'chalkboard-conspiracy'
  | 'birtherism'
  | 'truther-seeding'
  // Era 7 — MAGA & The Firehose 2015-2023
  | 'alternative-facts'
  | 'qanon-seeding'
  | 'replacement-theory'
  | 'troll-farm'
  | 'election-denial'
  | 'evangelical-partnership'
  // Era 8 — Synthetic Reality 2024+
  | 'deepfake-generation'
  | 'ai-content-farm'
  | 'platform-chaos'
  | 'synthetic-intimacy'
  | 'llm-disinformation'
  | 'algorithmic-amplification';

export const ALL_TECHNIQUES: readonly TechniqueId[] = [
  'impersonation', 'emotion', 'polarization',
  'conspiracy', 'discrediting', 'trolling',
  'big-lie', 'atrocity-calibration', 'monumental-aesthetic',
  'black-propaganda', 'photographic-falsification', 'manufactured-event',
  'talk-radio-outrage', 'drudge-drop', 'false-balance',
  'evangelical-alliance', 'victim-grievance', 'cable-news-panel',
  'chain-email', 'wmd-packaging', 'swift-boating',
  'chalkboard-conspiracy', 'birtherism', 'truther-seeding',
  'alternative-facts', 'qanon-seeding', 'replacement-theory',
  'troll-farm', 'election-denial', 'evangelical-partnership',
  'deepfake-generation', 'ai-content-farm', 'platform-chaos',
  'synthetic-intimacy', 'llm-disinformation', 'algorithmic-amplification',
] as const;

export type ResourceId = 'rumor' | 'reach' | 'cred' | 'memetic_inheritance';
