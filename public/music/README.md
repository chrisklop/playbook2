# Background music

Drop one MP3 here named **`playbook-loop.mp3`** and it will play on a continuous
loop in the background of the game. The audio module loads it from
`/playbook2/music/playbook-loop.mp3` on production (or `/music/playbook-loop.mp3`
in local dev) — the path is computed automatically from Vite's `BASE_URL`.

## Recommended specs

| Field          | Recommendation                                     |
| -------------- | -------------------------------------------------- |
| **Length**     | **90 – 180 seconds (1:30 – 3:00).** Sweet spot is ~2:00. Shorter loops feel repetitive within a 20-min session; longer ones bloat the bundle without adding much variety since players hear the same patch every visit. |
| **Format**     | MP3, 44.1 kHz stereo, 128 kbps CBR. Universally supported, ~1.5 MB at 2 minutes. OGG also works if you'd rather (`playbook-loop.ogg`), but MP3 is the safer single-file default. |
| **Seamless loop** | The first and last 100ms of audio must match perfectly so there's no audible click at the loop point. Easiest method: end the track on silence (~500ms tail fading to digital zero) and start it from silence. Or crossfade the last bar into the first. |
| **Volume**     | Master to roughly **-12 LUFS** (or peak around -3 dBFS). The game plays it at 20% gain by default, so a quieter master leaves headroom — louder masters force users to reach for the mute toggle. |
| **Mood**       | Era-agnostic. The track plays under every era, so it can't be too obviously tied to any one period. Ambient / textural / minor-key works well for a game about disinformation. |

## What happens if no file is here

The game tries to load `playbook-loop.mp3`, fails silently (the music module
catches the autoplay-block promise rejection), and the player gets the
sound-effect chimes but no background track. So you can ship without music
and the game still works.

## Per-era music (future option)

If you eventually want one track per era, ping me and I'll wire
`state.ts` to swap the loaded URL on prestige. For now it's one global track.
