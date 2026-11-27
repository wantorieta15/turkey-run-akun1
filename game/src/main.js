// Kalkun Kabur — main.js (REVISI Akun 1)
// Loop permainan: layar judul -> bermain -> tertangkap / lolos -> ulang.
// Langkah dunia tetap 1/60 detik; ?shot=title|play|caught|escaped&seed=N
// menampilkan satu adegan jadi untuk screenshot (lihat shots.js).
//
// Revisi: suara lompat kini berbunyi tepat saat kalkun meninggalkan tanah
// (event EVENT_JUMP baru dari world.js — dulu lompatan tidak bersuara sama
// sekali), dan suara mendarat berbunyi saat kaki menyentuh tanah lagi.
// Keduanya dideteksi dari transisi keadaan, bukan dari tombol, supaya
// suara dan gambar selalu sinkron — termasuk lompatan dari buffer yang
// ditekan sesaat sebelum mendarat.

import { Input } from './input.js';
import { Renderer, SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { SoundBank } from './audio.js';
import { EVENT_CAUGHT, EVENT_ESCAPED, EVENT_HIT, EVENT_JUMP, EVENT_PICKUP, EVENT_STAGE, EVENT_SURGE, STEP, World } from './world.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = new Renderer(canvas);
const sounds = new SoundBank();
const params = new URLSearchParams(window.location.search);
const seed = Number.parseInt(params.get('seed') || '7', 10) || 7;

const world = new World(seed);
let screen = SCREEN_TITLE;
let best = 0;
let paused = false;
let accumulator = 0;
let lastTime = performance.now();

const input = new Input(canvas, () => {
  sounds.unlock();
  if (screen === SCREEN_TITLE) startGame();
  else if (screen === SCREEN_OVER || screen === SCREEN_ESCAPED) restart();
});

function announce(message) {
  status.textContent = message;
}

function startGame() {
  world.reset();
  screen = SCREEN_PLAY;
  sounds.gobble();
  announce('Kalkun berlari! Lompati rintangan, hindari pisau, jangan sampai tertangkap.');
}

function restart() {
  world.reset();
  screen = SCREEN_PLAY;
  sounds.gobble();
  announce('Lari lagi!');
}

function endGame(escaped) {
  screen = escaped ? SCREEN_ESCAPED : SCREEN_OVER;
  if (world.score > best) best = world.score;
  if (escaped) {
    sounds.win();
    announce(`Lolos! Skor akhir ${world.score}.`);
  } else {
    sounds.lose();
    announce(`Tertangkap! Skor akhir ${world.score}. Tekan R untuk mencoba lagi.`);
  }
}

function handleEvents(events) {
  if (events & EVENT_JUMP) sounds.jump();
  if (events & EVENT_HIT) {
    sounds.thud();
    announce(`Terkena! Nyawa tersisa ${world.lives}.`);
  }
  if (events & EVENT_PICKUP) sounds.pickup();
  if (events & EVENT_STAGE) {
    sounds.stageUp();
    announce(`Babak ${world.stageIndex + 1}: ${world.stage.name}.`);
  }
  if (events & EVENT_SURGE) sounds.alarm();
  if (events & EVENT_CAUGHT) endGame(false);
  if (events & EVENT_ESCAPED) endGame(true);
}

function stepFrame(dt) {
  if (screen !== SCREEN_PLAY || paused) return;
  accumulator += Math.min(dt, 0.1);
  while (accumulator >= STEP) {
    accumulator -= STEP;
    const wasOnGround = world.player.onGround;
    const inputState = { jump: input.consumeJump(), duck: input.duckHeld };
    const events = world.step(STEP, inputState);
    // Mendarat: kaki menyentuh tanah setelah sempat di udara.
    if (!wasOnGround && world.player.onGround) sounds.land();
    handleEvents(events);
    if (world.over) break;
  }
}

function onKeyDown(event) {
  if (event.code === 'Enter') {
    sounds.unlock();
    if (screen === SCREEN_TITLE) startGame();
    else if (screen === SCREEN_OVER || screen === SCREEN_ESCAPED) restart();
  }
  if (event.code === 'KeyR') {
    if (screen !== SCREEN_TITLE) restart();
  }
  if (event.code === 'KeyP') {
    if (screen === SCREEN_PLAY) {
      paused = !paused;
      screen = paused ? SCREEN_PAUSED : SCREEN_PLAY;
      announce(paused ? 'Jeda.' : 'Lanjut!');
    }
  }
  if (event.code === 'KeyM') {
    const muted = sounds.toggleMute();
    announce(muted ? 'Suara mati.' : 'Suara hidup.');
  }
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('resize', () => renderer.fit());
renderer.fit();

function frame(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  input.consumeAny();
  stepFrame(dt);
  renderer.draw(paused ? SCREEN_PAUSED : screen, world, best);
  requestAnimationFrame(frame);
}

// Mode adegan untuk screenshot: jalankan aturan asli lalu gambar satu frame.
const shot = params.get('shot');
if (shot) {
  const staged = stageShot(shot, world);
  screen = staged.screen;
  best = staged.best;
  renderer.draw(screen, world, best);
} else {
  requestAnimationFrame(frame);
}
