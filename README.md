# Teardown-galleri

Publika 3D-simulatorer byggda med [teardown](https://github.com/Mannix-create/teardown), publicerade med GitHub Pages:
https://mannix-create.github.io/teardown-gallery/

## Lägga till en simulator

```bash
node scripts/add-sim.mjs <sim.html> <bild.png> --slug <namn> --title "<Titel>" --text "<En rad>"
```

Skriptet kopierar sidan till `sims/<namn>/index.html`, gör ett delningskort på 1200×630 (kräver ffmpeg), lägger in
Open Graph-taggar och uppdaterar `gallery.json`. Commit och push, så är sidan ute efter någon minut.

Allt i det här repot är publikt.
