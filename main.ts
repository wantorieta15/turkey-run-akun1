// Kalkun Kabur! — entry main.ts (Node 22, stdlib only).
// REVISI BESAR Akun 1: struktur yang sama, ditulis ulang dengan langkah
// yang bernama dan validasi pra-submit, supaya kegagalan ketahuan sebelum
// dossier dibangun — bukan sesudah submit ditolak scorer.
//
// Menyerahkan game ke /output: menyalin game/ dan screenshots/ dari repo
// ini lalu menulis /output/dossier.json dengan library make.fun yang
// di-vendor, supaya juri bisa membangun ulang dossier yang sama dari file
// yang sama. Di luar grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Jaminan determinisme: tidak ada stempel waktu, tidak ada angka acak, dan
// tidak ada urutan yang bergantung pada filesystem di dalam file yang
// diserahkan. Dua kali jalan ke direktori berbeda harus menghasilkan isi
// yang identik (diff -r kosong) — itu yang diuji reviser sebelum commit.
//
// Batas scorer (JANGAN diubah tanpa membaca ulang aturan bounty): hanya
// text_max_bytes yang membentuk byte dossier; sisanya menolak entri yang
// akan ditolak scorer (lebih dari 4 screenshot atau satu di atas 256 KiB;
// lebih dari 993 file di game/ atau 48 MiB file game, atau path di bawah
// game/ di atas 1000 byte). Validasi di bawah memeriksa batas yang sama
// LEBIH DULU, dengan pesan yang menyebut file pelanggarnya, supaya
// penyebab penolakan langsung terlihat.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Batas yang sama dengan yang dipakai buildDossier — satu tempat, supaya
// validasi dan dossier tidak pernah berbeda pendapat.
const LIMITS = {
  textMaxBytes: 163840,
  screenshotsMax: 4,
  screenshotMaxBytes: 262144,
  gameMaxFiles: 993,
  gameMaxBytes: 50331648,
  gamePathMaxBytes: 1000,
};

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  throw new Error(`main.ts: ${message}`);
}

// Hitung semua file di bawah satu direktori (rekursif), lengkap dengan
// ukuran dan panjang path relatifnya — dipakai validasi game/ dan
// screenshots/ sebelum apa pun disalin.
function listFiles(root, relative = '') {
  const found = [];
  for (const name of readdirSync(join(root, relative), { withFileTypes: true })) {
    const rel = relative ? `${relative}/${name.name}` : name.name;
    if (name.isDirectory()) found.push(...listFiles(root, rel));
    else if (name.isFile()) found.push({ rel, bytes: statSync(join(root, rel)).size });
  }
  return found;
}

function validateGame(gameDir) {
  if (!existsSync(gameDir)) fail(`game/ tidak ditemukan di ${gameDir}`);
  const files = listFiles(gameDir);
  if (files.length > LIMITS.gameMaxFiles) {
    fail(`game/ berisi ${files.length} file, batas scorer ${LIMITS.gameMaxFiles}`);
  }
  const total = files.reduce((sum, file) => sum + file.bytes, 0);
  if (total > LIMITS.gameMaxBytes) {
    fail(`game/ berukuran ${total} byte, batas scorer ${LIMITS.gameMaxBytes}`);
  }
  const tooLong = files.filter((file) => Buffer.byteLength(`game/${file.rel}`) > LIMITS.gamePathMaxBytes);
  if (tooLong.length > 0) {
    fail(`path game/ terlalu panjang (> ${LIMITS.gamePathMaxBytes} byte): ${tooLong[0].rel}`);
  }
  if (!files.some((file) => file.rel === 'index.html')) fail('game/index.html tidak ditemukan');
  if (!files.some((file) => file.rel === 'src/main.js')) fail('game/src/main.js tidak ditemukan');
  return { files: files.length, bytes: total };
}

function validateScreenshots(shotsDir) {
  if (!existsSync(shotsDir)) fail(`screenshots/ tidak ditemukan di ${shotsDir}`);
  const files = listFiles(shotsDir).filter((file) => /\.(jpg|jpeg|png)$/i.test(file.rel));
  if (files.length === 0) fail('screenshots/ kosong — juri butuh 1-4 screenshot');
  if (files.length > LIMITS.screenshotsMax) {
    fail(`screenshots/ berisi ${files.length} gambar, batas scorer ${LIMITS.screenshotsMax}`);
  }
  const tooBig = files.filter((file) => file.bytes > LIMITS.screenshotMaxBytes);
  if (tooBig.length > 0) {
    fail(`screenshot ${tooBig[0].rel} berukuran ${tooBig[0].bytes} byte, batas ${LIMITS.screenshotMaxBytes}`);
  }
  return { files: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0) };
}

function copyEntry(gameDir, shotsDir) {
  mkdirSync(out, { recursive: true });
  cpSync(gameDir, join(out, 'game'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });
}

function writeDossier() {
  const dossier = buildDossier(out, {
    text_max_bytes: LIMITS.textMaxBytes,
    screenshots: { max: LIMITS.screenshotsMax, max_bytes: LIMITS.screenshotMaxBytes },
    game_max_files: LIMITS.gameMaxFiles,
    game_max_bytes: LIMITS.gameMaxBytes,
    game_path_max_bytes: LIMITS.gamePathMaxBytes,
  });
  writeFileSync(join(out, 'dossier.json'), dossier);
  return Buffer.byteLength(dossier);
}

function main() {
  const gameDir = join(here, 'game');
  const shotsDir = join(here, 'screenshots');
  // Validasi dulu, salin sesudahnya: direktori output tidak pernah berisi
  // setengah entri dari jalan yang gagal di tengah.
  const game = validateGame(gameDir);
  const shots = validateScreenshots(shotsDir);
  copyEntry(gameDir, shotsDir);
  const dossierBytes = writeDossier();
  console.log(
    `Kalkun Kabur! diserahkan ke ${out}: game/ ${game.files} file (${game.bytes} byte), ` +
    `screenshots/ ${shots.files} gambar (${shots.bytes} byte), dossier.json ${dossierBytes} byte.`,
  );
}

main();
