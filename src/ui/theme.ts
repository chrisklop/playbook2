import type { Theme } from '../content/schema';

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
