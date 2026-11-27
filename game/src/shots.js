// Kalkun Kabur — shots.js (REVISI Akun 1)
// Adegan untuk ?shot=title|play|caught|escaped. Tiap adegan memainkan
// aturan asli maju dari dunia baru dengan langkah tetap dan autopilot
// sederhana, jadi tiap frame adalah sesuatu yang benar-benar bisa terjadi
// dalam permainan, dan seed yang sama selalu memberi frame yang sama.
//
// Revisi: autopilot menyesuaikan celah pasangan 340 px dan jeda antar pola
// yang lebih lega — lompat mulai 0,32 detik sebelum rintangan (balistik
// builder yang terbukti: waktu di udara 0,86 dtk), supaya kalkun mendarat
// tepat setelah rintangan dan tidak melayang ke rintangan berikutnya.

import { EVENT_CAUGHT, EVENT_ESCAPED, STEP, World } from './world.js';
import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { GROUND_Y, RUN, TURKEY } from './config.js';

const TITLE_SECONDS = 4;
const PLAY_SECONDS = 24;
const END_LIMIT_SECONDS = 900;
const SAMPLE = 1 / 30;

/**
 * Autopilot: lihat rintangan terdekat di depan. Oven/pagar/jerami dilompati
 * saat sudah cukup dekat; pisau ditundukki. `skill` 1 = sempurna (lompat
 * tepat waktu), 0 = ceroboh (sering terlambat) sehingga akhirnya tertangkap.
 *
 * Lompatan builder menempuh ~396 px di kecepatan maks: lead
 * 0,32 detik menempatkan lepas landas ~147 px sebelum rintangan, kalkun
 * mendarat ~249 px setelah tepi depan rintangan — jauh sebelum rintangan
 * pasangan (celah 340 px) dan jauh sebelum pola berikutnya.
 *
 * Pisau didahulukan dan diukur dari EKOR bilahnya: menunduk bertahan
 * sampai ekor bilah (96 px lebar) lewat depan kalkun. Builder mengukur
 * dari ujung depan dan lolos hanya karena bug "tenggelam" membuat hitbox
 * tetap rendah setelah menunduk; setelah bug itu diperbaiki di world.js,
 * autopilot yang berhenti menunduk di ujung depan akan tertabrak ekor
 * bilah (terbukti di simulasi: tumpang tindih 1,5 px, nyawa hilang).
 */
export function autopilot(world, skill) {
  const player = world.player;
  const px = player.x + player.width;
  const speed = world.speed;
  // skill 1 = gesit (lompat tepat waktu, menunduk awal); skill 0 = panik
  // (lompat dan menunduk jauh terlambat) sehingga cepat kehabisan nyawa.
  // Buffer lompat 0,12 dtk di world.js membuat autopilot makin stabil:
  // tekanan yang datang sepersekian detik sebelum mendarat tetap jalan.
  const jumpLead = speed * (skill >= 1 ? 0.32 : 0.02);
  const duckLead = speed * (skill >= 1 ? 0.55 : 0.05);
  const input = { jump: false, duck: false };
  // Pisau dulu: selama ekor bilah belum lewat dan ujung bilah sudah dalam
  // jangkauan menunduk, tetap menunduk — rintangan lompat di belakangnya
  // masih jauh (pola berikutnya >= 340 px setelah pisau), jadi tidak ada
  // konflik antara menunduk dan melompat.
  // "Lewat" diukur dari HITBOX, bukan dari gambar: bilah baru aman kalau
  // tepi kanan kotak bilah sudah di kiri kotak kalkun (x+12). Mengukur
  // dari ujung depan gambar kalkun (x+62) membuat autopilot berdiri saat
  // bilah masih ~30 px di atas kepala — tabrakan ekor bilah (terbukti
  // di simulasi, dua kali).
  for (const obstacle of world.obstacles) {
    if (obstacle.kind !== 'knife') continue;
    const tailClear = obstacle.x + obstacle.width - 4 - (player.x + 12);
    if (tailClear <= 0) continue;
    if (obstacle.x - px < duckLead) {
      if (player.onGround) input.duck = true;
      return input;
    }
  }
  // Rintangan lompat terdekat (oven/pagar/jerami).
  let nearest = null;
  let nearestDist = Infinity;
  for (const obstacle of world.obstacles) {
    if (obstacle.kind === 'knife') continue;
    const dist = obstacle.x - px;
    if (dist < -10) continue;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = obstacle;
    }
  }
  if (!nearest) return input;
  if (player.onGround && nearestDist < jumpLead) input.jump = true;
  return input;
}

function runFor(world, seconds, skill) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const events = world.step(STEP, autopilot(world, skill));
    if (events & (EVENT_CAUGHT | EVENT_ESCAPED)) break;
  }
}

/**
 * Atur `world` ke adegan yang diminta dan kembalikan layar yang digambar
 * di atasnya beserta skor terbaik untuk ditampilkan.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'title' || !name) {
    // Latar judul: kalkun berlari bersih 4 detik dengan autopilot, supaya
    // adegan di balik layar judul hidup dan tidak berakhir tertangkap.
    for (let i = 0; i < TITLE_SECONDS / STEP; i += 1) {
      world.step(STEP, autopilot(world, 1));
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runFor(world, PLAY_SECONDS, 1);
    return { screen: SCREEN_PLAY, best: world.score };
  }
  if (name === 'caught') {
    // Pilot ceroboh: menabrak rintangan sampai nyawa habis / tertangkap.
    runFor(world, END_LIMIT_SECONDS, 0);
    return { screen: world.escaped ? SCREEN_ESCAPED : SCREEN_OVER, best: world.score };
  }
  if (name === 'escaped') {
    runFor(world, END_LIMIT_SECONDS, 1);
    return { screen: world.escaped ? SCREEN_ESCAPED : SCREEN_OVER, best: world.score };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
