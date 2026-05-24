<template>
  <article class="page">
    <h2>About &amp; Credits</h2>

    <h3>Game engine</h3>
    <p><a href="https://github.com/profectus-engine/Profectus" target="_blank" rel="noopener">Profectus</a> by Acamaeda &amp; contributors. MIT-licensed.</p>

    <h3>Math libraries</h3>
    <p><a href="https://github.com/Patashu/break_eternity.js" target="_blank" rel="noopener">break_eternity.js</a> for big-number math. MIT-licensed.</p>

    <h3>Save compression</h3>
    <p><a href="https://github.com/pieroxy/lz-string" target="_blank" rel="noopener">lz-string</a>. MIT-licensed.</p>

    <h3>Technique taxonomy</h3>
    <p>The six manipulation techniques (Impersonation, Emotion, Polarization, Conspiracy, Discrediting, Trolling) are adapted from the <a href="https://inoculation.science/inoculation-games/bad-news/" target="_blank" rel="noopener"><em>Bad News</em></a> research by Jon Roozenbeek &amp; Sander van der Linden at the University of Cambridge / DROG. Published in <a href="https://www.nature.com/articles/s41599-019-0279-9" target="_blank" rel="noopener">Humanities and Social Sciences Communications, 2019</a>.</p>

    <h3>Source material</h3>
    <p>Historical examples are drawn from peer-reviewed and reputable secondary sources; every codex entry carries its own citation.</p>

    <h3>Typography</h3>
    <p>Cinzel, EB Garamond, UnifrakturMaguntia, Playfair Display, Old Standard TT, Rye, Bebas Neue, Oswald, Inter, Anton, IBM Plex Sans — all via <a href="https://fonts.google.com" target="_blank" rel="noopener">Google Fonts</a>.</p>

    <h3>Content as a template</h3>
    <p>Each era is a drop-in bundle under <code>src/content/eras/</code> — five JSON files (era, theme, ticker, copy, events) plus markdown codex entries. The engine auto-discovers eras via <code>import.meta.glob</code>; adding a new historical sweep requires no edits to engine code, only to the content directory. This game can be forked into a completely different idle-clicker by swapping the content layer.</p>

    <p class="version">Version 0.1.0</p>
  </article>
</template>

<style scoped>
.page {
  margin: 0;
  padding: 22px 22px 80px;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  background: var(--bg);
  color: var(--text-strong);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
  font-size: 14px;
  line-height: 1.65;
}
.page h2 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 4px 0 20px;
  padding: 0;
  color: var(--text-strong);
}
.page h3 {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 22px 0 6px;
  padding: 0;
  color: var(--text-muted);
}
.page p {
  margin: 0 0 10px;
  padding: 0;
  color: var(--text-strong);
}
.page a {
  color: var(--accent-text);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--accent-text) 40%, transparent);
  transition: color 120ms ease, border-color 120ms ease;
}
.page a:hover {
  color: var(--accent-hover);
  border-bottom-color: var(--accent-hover);
}
.page code {
  font-family: 'JetBrains Mono', 'Menlo', monospace;
  font-size: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 1px 6px;
}
.version {
  color: var(--text-faint);
  margin-top: 28px;
  font-size: 11px;
}
</style>
