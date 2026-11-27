// Kalkun Kabur! — entry main.ts (Node 22, stdlib only).
// Menyerahkan game ke /output: menyalin game/ dan screenshots/ dari repo ini
// lalu menulis /output/dossier.json dengan library make.fun yang di-vendor,
// supaya juri bisa membangun ulang dossier yang sama dari file yang sama.
// Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Batas scorer: hanya text_max_bytes yang membentuk byte dossier; sisanya
// menolak entri yang akan ditolak scorer (lebih dari 4 screenshot atau satu
// di atas 256 KiB; lebih dari 993 file di game/ atau 48 MiB file game, atau
// path di bawah game/ di atas 1000 byte).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
