/**
 * Generator-id → Lucide icon component map.
 *
 * Each generator in src/content/eras/*\/era.json still carries an `icon`
 * field with an emoji fallback. When a Lucide mapping exists here,
 * GeneratorCard renders the SVG icon instead — sharper, theme-coloured,
 * and visually coherent with the rest of the modern web.
 *
 * Add a new mapping by importing the Lucide component and entering it
 * keyed by the generator's id. Generators not in this map continue to
 * render their emoji fallback, so this is a strict-improvement layer.
 *
 * Icon picks aim for legibility at 32px and a tonal match for the
 * action the generator represents.
 */
import {
  // Era 1 — Antiquity
  MessagesSquare, ScrollText, Swords, Eye, Coins,
  // Era 2 — Printing Press
  Newspaper, FileText, ImageIcon, Feather, Flame, BookOpen,
  // Era 3 — Penny Press
  Pencil, Megaphone, Antenna, Camera, Pill, UserX,
  // Era 4 — Propaganda State
  Mic, Flag, Skull, Film, Radio, Satellite,
  // Era 5 — Talk Radio & Cable
  Phone, Square, Mic2, Church, Landmark, Tv2,
  // Era 6 — Forever War
  Mail, Wrench, Ship, Brush, FileSignature, Briefcase,
  // Era 7 — MAGA Firehose
  Tag, HelpCircle, Bot, Crown, Users,
  // Era 8 — Synthetic Reality
  VenetianMask, BadgeCheck, UserSquare2, Brain, Globe,
  type LucideIcon,
} from '@lucide/vue';

export const GENERATOR_ICONS: Record<string, LucideIcon> = {
  // Era 1 — Antiquity
  'spread-rumor': MessagesSquare,
  'forge-naru-tablet': ScrollText,
  'smear-rival': Swords,
  'hire-sykophant': Eye,
  'bronze-coin-mint': Coins,

  // Era 2 — Printing Press
  'compose-broadside': Newspaper,
  'print-pamphlet': FileText,
  'commission-woodcut': ImageIcon,
  'forge-decree': Feather,
  'witch-pamphlet': Flame,
  'newsbook-press': BookOpen,

  // Era 3 — Penny Press
  'set-headline': Pencil,
  'manufactured-scoop': Megaphone,
  'wire-service-plant': Antenna,
  'halftone-engraving': Camera,
  'patent-medicine-ad': Pill,
  'okhrana-forgery': UserX,

  // Era 4 — Propaganda State
  'four-minute-speech': Mic,
  'war-bonds-poster': Flag,
  'atrocity-pamphlet': Skull,
  'newsreel-cinema': Film,
  'big-lie-broadcast': Radio,
  'black-flag-radio': Satellite,

  // Era 5 — Talk Radio & Cable
  'place-talk-radio-caller': Phone,
  'run-drudge-splash': Square,
  'book-sunday-panel': Mic2,
  'convene-christian-coalition': Church,
  'boost-senate-hopeful': Landmark,
  'launch-cable-channel': Tv2,

  // Era 6 — Forever War & The Birther Years
  'forward-chain-email': Mail,
  'plant-wmd-source': Wrench,
  'swift-boat-press-conf': Ship,
  'glenn-beck-segment': Brush,
  'birther-petition': FileSignature,
  'cable-pundit-bench': Briefcase,

  // Era 7 — MAGA & The Firehose
  'pin-a-nickname': Tag,
  'drop-qanon-cryptic': HelpCircle,
  'air-tucker-monologue': Mic2,
  'deploy-troll-farm': Bot,
  'boost-presidential-candidate': Crown,
  'stage-mega-rally': Users,

  // Era 8 — Synthetic Reality
  'generate-deepfake': VenetianMask,
  'ai-news-farm': Newspaper,
  'buy-verified-checkmark': BadgeCheck,
  'synthetic-influencer': UserSquare2,
  'bespoke-disinfo-llm': Brain,
  'acquire-platform': Globe,
};
