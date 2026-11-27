// Kalkun Kabur — shots.js
// Adegan untuk ?shot=title|play|caught|escaped. Tiap adegan memainkan
// aturan asli maju dari dunia baru dengan langkah tetap dan autopilot
// sederhana, jadi tiap frame adalah sesuatu yang benar-benar bisa terjadi
// dalam permainan, dan seed yang sama selalu memberi frame yang sama.

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
 */
export function autopilot(world, skill) {
  const player = world.player;
  const px = player.x + player.width;
  let nearest = null;
  let nearestDist = Infinity;
  for (const obstacle of world.obstacles) {
    const dist = obstacle.x - px;
    if (dist < -10) continue;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = obstacle;
    }
  }
  const input = { jump: false, duck: false };
  if (!nearest) return input;
  const speed = world.speed;
  // skill 1 = gesit (lompat tepat waktu, menunduk awal); skill 0 = panik
  // (lompat dan menunduk jauh terlambat) sehingga cepat kehabisan nyawa.
  const jumpLead = speed * (skill >= 1 ? 0.32 : 0.02);
  const duckLead = speed * (skill >= 1 ? 0.55 : 0.05);
  if (nearest.kind === 'knife') {
    if (nearestDist < duckLead && player.onGround) input.duck = true;
    return input;
  }
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
