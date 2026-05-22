import type { Theme } from '../content/schema';

/**
 * Riso CSS variable names paired with the theme.json field that overrides
 * each. When an era's theme provides a value, applyTheme writes it to :root;
 * when it doesn't, the property is removed so the global default from
 * buttons.css applies. This lets each era have its own button palette.
 */
const RISO_VAR_MAP: Array<[string, keyof NonNullable<Theme['riso']>]> = [
  ['--riso-primary-bg',     'primary_bg'],
  ['--riso-primary-shadow', 'primary_shadow'],
  ['--riso-primary-text',   'primary_text'],
  ['--riso-secondary-bg',     'secondary_bg'],
  ['--riso-secondary-shadow', 'secondary_shadow'],
  ['--riso-secondary-text',   'secondary_text'],
  ['--riso-upgrade-bg',     'upgrade_bg'],
  ['--riso-upgrade-shadow', 'upgrade_shadow'],
  ['--riso-upgrade-text',   'upgrade_text'],
  ['--riso-bulk-on-bg',     'bulk_on_bg'],
  ['--riso-bulk-on-shadow', 'bulk_on_shadow'],
  ['--riso-bulk-on-text',   'bulk_on_text'],
];

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.style.setProperty('--theme-background', theme.palette.background);
  root.style.setProperty('--theme-surface', theme.palette.surface);
  root.style.setProperty('--theme-text', theme.palette.text);
  root.style.setProperty('--theme-muted', theme.palette.muted);
  root.style.setProperty('--theme-accent', theme.palette.accent);
  root.style.setProperty('--theme-border', theme.palette.border);
  root.style.setProperty('--theme-font-masthead', theme.fonts.masthead);
  root.style.setProperty('--theme-font-body', theme.fonts.body);

  // Riso button overrides — set when provided, otherwise remove so the
  // global default from src/ui/buttons.css applies.
  const riso = theme.riso ?? {};
  for (const [cssVar, key] of RISO_VAR_MAP) {
    const value = riso[key];
    if (value) root.style.setProperty(cssVar, value);
    else root.style.removeProperty(cssVar);
  }

  // Load (or replace) the Google Fonts stylesheet.
  if (theme.fonts.google_fonts_url) {
    const existingId = 'theme-google-fonts';
    const existing = document.getElementById(existingId) as HTMLLinkElement | null;
    if (existing && existing.href === theme.fonts.google_fonts_url) {
      // Already loaded, do nothing.
    } else {
      if (existing) existing.remove();
      const link = document.createElement('link');
      link.id = existingId;
      link.rel = 'stylesheet';
      link.href = theme.fonts.google_fonts_url;
      document.head.appendChild(link);
    }
  }

  // Sync body bg/color so safe-area insets pad to the theme background.
  document.body.style.background = theme.palette.background;
  document.body.style.color = theme.palette.text;
}
