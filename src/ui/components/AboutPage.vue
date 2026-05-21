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
    <p>Cinzel, EB Garamond, UnifrakturMaguntia, Playfair Display, Old Standard TT, Rye, Bebas Neue, Oswald, Inter — all via <a href="https://fonts.google.com" target="_blank" rel="noopener">Google Fonts</a>.</p>

    <p class="version">Version 0.1.0</p>
  </article>
</template>

<style scoped>
.page {
  margin: 0;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  color: var(--theme-text, #2a2218);
  font-family: var(--theme-font-body, -apple-system, sans-serif);
  font-size: 13px;
  line-height: 1.6;
}
.page h2 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 18px;
  margin: 8px 0 16px;
  padding: 0;
}
.page h3 {
  font-family: var(--theme-font-masthead, -apple-system, sans-serif);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 16px 0 4px;
  padding: 0;
  opacity: 0.7;
}
.page p {
  margin: 0 0 8px;
  padding: 0;
}
.page a {
  color: var(--theme-accent, #2a2218);
}
.version {
  opacity: 0.5;
  margin-top: 24px;
  font-size: 11px;
}
</style>
