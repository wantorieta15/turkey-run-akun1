// Kalkun Kabur — world.js (REVISI BESAR Akun 1)
// Aturan permainan: kalkun berlari ke kanan, petani mengejar dari kiri,
// rintangan (oven, pagar, jerami, pisau ukir) harus dilompati atau
// ditundukki, jagung dipungut, tiga babak makin cepat sampai 1500 m.
//
// Yang berubah dari builder:
// - Lompatan pemaaf: coyote time + buffer lompat (lihat config.js). Tekan
//   lompat sepersekian detik sebelum mendarat tetap melompat; tekan sesaat
//   setelah kaki meninggalkan tanah tetap melompat. Ini yang paling terasa
//   bagi pemain manusia; autopilot tidak terpengaruh.
// - BUG DIPERBAIKI: setelah menunduk lalu berdiri, posisi y kalkun tidak
//   dikembalikan ke tanah — kalkun tenggelam 20 px ke dalam tanah sampai
//   lompat berikutnya, dan hitbox-nya ikut tenggelam sehingga pagar/oven
//   bisa menabrak kalkun yang sebenarnya sudah berdiri. Sekarang setiap
//   langkah, kalau kalkun di tanah, y selalu dijepit ke GROUND_Y - height.
// - Celah pasangan 340 px, jeda antar pola 1,05-1,35 detik laju, tekanan
//   petani dilunakkan (lihat config.js). Jaminan pola: jarak diukur dari
//   rintangan TERAKHIR pola sebelumnya, dan pola ganda keduanya hanya
//   pagar/jerami (tidak pernah oven/pisau) supaya selalu bisa dilompati.
// - Event lompat baru (EVENT_JUMP) supaya main.js bisa membunyikan suara
//   lompat tepat saat kalkun meninggalkan tanah.

import { GROUND_Y, OBSTACLES, PICKUPS, RUN, STAGES, TURKEY } from './config.js';
import { chance, makeRng, pick, range } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_STAGE = 4;
export const EVENT_CAUGHT = 8;
export const EVENT_ESCAPED = 16;
export const EVENT_SURGE = 32;
export const EVENT_JUMP = 64;

const STEP = 1 / 60;

function makeTurkey() {
  return {
    x: TURKEY.x,
    y: GROUND_Y - TURKEY.height,
    vy: 0,
    width: TURKEY.width,
    height: TURKEY.height,
    onGround: true,
    ducking: false,
    invulnerable: 0,
    runCycle: 0,
    squash: 0,
    // Jendela pengampunan input: diisi saat tombol lompat ditekan, dipakai
    // saat kalkun mendarat; diisi saat kalkun meninggalkan tanah (coyote).
    jumpBuffer: 0,
    coyote: 0,
  };
}

export class World {
  constructor(seed) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.reset();
  }

  reset() {
    this.rng = makeRng(this.seed);
    this.player = makeTurkey();
    this.distance = 0;
    this.score = 0;
    this.lives = RUN.startLives;
    this.corn = 0;
    this.pumpkins = 0;
    this.feathers = 0;
    this.gap = RUN.startGap;
    this.shield = 0;
    this.time = 0;
    this.stageIndex = 0;
    this.over = false;
    this.escaped = false;
    this.caught = false;
    this.surgeTimer = 11;
    this.surgeFlash = 0;
    this.obstacles = [];
    this.pickups = [];
    this.leaves = [];
    this.dust = [];
    this.smoke = [];
    this.nextSpawnX = 980;
    this.spawnGap = 300;
    this.message = '';
    this.messageTimer = 0;
    this.speedLines = 0;
    for (let i = 0; i < 26; i += 1) {
      this.leaves.push({
        x: this.rng() * 960,
        y: this.rng() * 540,
        size: range(this.rng, 7, 14),
        sway: range(this.rng, 0, Math.PI * 2),
        fall: range(this.rng, 18, 42),
        color: pick(this.rng, ['#e8702a', '#f2b134', '#c94f2e']),
      });
    }
  }

  get speed() {
    const ramp = Math.min(RUN.maxSpeed, RUN.baseSpeed + this.distance * RUN.speedPerMetre);
    return ramp + this.stageIndex * 14;
  }

  get stage() {
    return STAGES[this.stageIndex];
  }

  stageFor(distance) {
    let index = 0;
    for (let i = 0; i < STAGES.length; i += 1) {
      if (distance >= STAGES[i].from) index = i;
    }
    return index;
  }

  say(text, seconds) {
    this.message = text;
    this.messageTimer = seconds;
  }

  spawnPattern(x) {
    const stage = this.stageIndex;
    const roll = this.rng();
    let kind = 'fence';
    if (roll < 0.30) kind = 'oven';
    else if (roll < 0.52) kind = 'hay';
    else if (roll < 0.78) kind = 'fence';
    else kind = 'knife';
    // Babak dapur: oven lebih sering, pisau lebih sering.
    if (stage === 2 && roll < 0.48) kind = 'oven';
    if (stage === 2 && roll >= 0.78) kind = 'knife';

    const spec = OBSTACLES[kind];
    const obstacle = { kind, x, width: spec.width, height: spec.height, passed: false, swing: this.rng() * Math.PI * 2 };
    if (kind === 'knife') {
      // Pisau menggantung setinggi kepala kalkun yang berdiri (bawah bilah
      // ~40 px di atas tanah): berdiri = kena, menunduk = aman.
      obstacle.y = GROUND_Y - 58;
    } else {
      obstacle.y = GROUND_Y - spec.height;
    }
    this.obstacles.push(obstacle);
    let rightEdge = x + spec.width;

    // Kadang sepasang rintangan dengan celah 340 px: cukup untuk mendarat
    // lalu lompat lagi, bahkan pada kecepatan tertinggi — lompatan
    // menempuh ~396 px di kecepatan maks, jadi kalkun mendarat ~249 px
    // setelah tepi depan rintangan pertama dan masih punya ~165 px untuk
    // lompat lagi sebelum rintangan kedua.
    // Rintangan kedua SELALU pagar/jerami (pendek), tidak pernah oven/pisau,
    // supaya pasangan ini tidak pernah mustahil.
    if (chance(this.rng, stage === 0 ? 0.18 : 0.30)) {
      const secondKind = pick(this.rng, ['fence', 'hay']);
      const second = OBSTACLES[secondKind];
      this.obstacles.push({
        kind: secondKind,
        x: x + spec.width + RUN.pairGap,
        y: GROUND_Y - second.height,
        width: second.width,
        height: second.height,
        passed: false,
        swing: 0,
      });
      rightEdge = x + spec.width + RUN.pairGap + second.width;
    }

    // Jagung di jalur: di tanah, atau di busur lompatan di atas rintangan.
    if (chance(this.rng, 0.62)) {
      const high = chance(this.rng, 0.45);
      this.pickups.push({
        kind: 'corn',
        x: x + spec.width / 2 - 15,
        y: high ? GROUND_Y - 168 : GROUND_Y - 44,
        width: PICKUPS.corn.width,
        height: PICKUPS.corn.height,
        taken: false,
        bob: this.rng() * Math.PI * 2,
      });
    }
    if (chance(this.rng, 0.10)) {
      this.pickups.push({
        kind: 'pumpkin',
        x: x + 240,
        y: GROUND_Y - PICKUPS.pumpkin.height,
        width: PICKUPS.pumpkin.width,
        height: PICKUPS.pumpkin.height,
        taken: false,
        bob: 0,
      });
    }
    if (chance(this.rng, 0.08)) {
      this.pickups.push({
        kind: 'feather',
        x: x + 130,
        y: GROUND_Y - 150,
        width: PICKUPS.feather.width,
        height: PICKUPS.feather.height,
        taken: false,
        bob: this.rng() * Math.PI * 2,
      });
    }
    return rightEdge;
  }

  step(dt, input) {
    if (this.over) return EVENT_NONE;
    let events = EVENT_NONE;
    this.time += dt;
    const speed = this.speed;
    const dx = speed * dt;
    this.distance += dx / RUN.pixelsPerMetre;
    this.score = Math.floor(this.distance) + this.corn * PICKUPS.corn.score
      + this.pumpkins * PICKUPS.pumpkin.score + this.feathers * PICKUPS.feather.score
      + this.stageIndex * 200;

    // Babak naik.
    const stageIndex = this.stageFor(this.distance);
    if (stageIndex !== this.stageIndex) {
      this.stageIndex = stageIndex;
      events |= EVENT_STAGE;
      this.say(`BABAK ${stageIndex + 1}: ${STAGES[stageIndex].name} — MAKIN CEPAT!`, 2.4);
    }

    // Petani mengejar: celah menyusut pelan kalau tidak ada yang
    // memperbaikinya; lari bersih dan pungutan membesarkannya lagi.
    this.gap -= RUN.gapDecayPerSecond * dt;
    if (this.gap > RUN.maxGap) this.gap = RUN.maxGap;

    // Serbuan petani berkala: peringatan lalu celah mengecil.
    this.surgeTimer -= dt;
    if (this.surgeTimer <= 0) {
      this.surgeTimer = range(this.rng, 12, 16);
      this.gap -= RUN.surgeGap;
      this.surgeFlash = 1.4;
      this.say('PETANI MENDEKAT! LARI!', 1.4);
      events |= EVENT_SURGE;
    }
    if (this.surgeFlash > 0) this.surgeFlash -= dt;
    if (this.messageTimer > 0) this.messageTimer -= dt;

    // Fisika kalkun.
    const p = this.player;
    p.runCycle += dt * (speed / 26);
    if (p.squash > 0) p.squash -= dt * 3;
    if (p.invulnerable > 0) p.invulnerable -= dt;
    if (this.shield > 0) this.shield -= dt;

    // Buffer lompat: tekanan yang datang sesaat sebelum mendarat disimpan
    // dan dipakai begitu kaki menyentuh tanah.
    if (input.jump) p.jumpBuffer = TURKEY.jumpBufferSeconds;
    else if (p.jumpBuffer > 0) p.jumpBuffer -= dt;
    if (p.onGround) p.coyote = TURKEY.coyoteSeconds;
    else if (p.coyote > 0) p.coyote -= dt;

    const wantDuck = input.duck && p.onGround;
    p.ducking = wantDuck;
    p.height = wantDuck ? TURKEY.duckHeight : TURKEY.height;
    // PERBAIKAN BUG (revisi): kalau di tanah, kaki SELALU di garis tanah.
    // Sebelumnya, setelah menunduk lalu berdiri, y tetap di posisi menunduk
    // (tenggelam 20 px) sampai lompat berikutnya — gambar dan hitbox salah.
    if (p.onGround) p.y = GROUND_Y - p.height;

    // Lompat dari tanah, atau dari coyote time, atau dari buffer yang
    // ditekan sesaat sebelum mendarat. Tidak bisa lompat sambil menunduk.
    if ((p.jumpBuffer > 0 && p.coyote > 0) && !wantDuck) {
      p.vy = TURKEY.jumpVelocity;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuffer = 0;
      events |= EVENT_JUMP;
    }
    if (!p.onGround) {
      p.vy += TURKEY.gravity * dt;
      p.y += p.vy * dt;
      if (p.y >= GROUND_Y - p.height) {
        p.y = GROUND_Y - p.height;
        p.vy = 0;
        p.onGround = true;
        p.squash = 1;
        this.puff(p.x + 20, GROUND_Y, 5);
      }
    }
    if (p.onGround && this.time % 0.24 < dt) this.puff(p.x + 8, GROUND_Y, 2);

    // Rintangan bergerak ke kiri; yang terlewati menambah celah petani.
    for (const obstacle of this.obstacles) {
      obstacle.x -= dx;
      obstacle.swing += dt * 2.2;
      if (!obstacle.passed && obstacle.x + obstacle.width < p.x) {
        obstacle.passed = true;
        this.gap = Math.min(RUN.maxGap, this.gap + 6);
      }
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > -120);

    // Spawn pola berikutnya. Jarak diukur dari rintangan TERAKHIR pola
    // sebelumnya (termasuk gandaannya), bukan dari awal pola — supaya dua
    // pola tidak pernah bertumpuk dan selalu ada ruang mendarat.
    // Jaraknya berbasis WAKTU (1,05–1,35 detik laju), bukan piksel, supaya
    // lompatan yang makin jauh pada kecepatan tinggi tetap mendarat di
    // antara rintangan, bukan di atas rintangan berikutnya.
    this.nextSpawnX -= dx;
    if (this.nextSpawnX < 960) {
      const gapSeconds = range(this.rng, RUN.spawnGapSecondsMin, RUN.spawnGapSecondsMax) - this.stageIndex * 0.03;
      const gapPx = Math.max(RUN.pairGap, this.speed * gapSeconds);
      const rightEdge = this.spawnPattern(960 + 60);
      this.nextSpawnX = 960 + (rightEdge - (960 + 60)) + gapPx;
    }

    for (const pickup of this.pickups) {
      pickup.x -= dx;
      pickup.bob += dt * 3;
    }
    this.pickups = this.pickups.filter((u) => u.x + u.width > -60 && !u.taken);

    // Tabrakan dengan rintangan. Kotak kalkun dipersempit 12 px tiap sisi
    // supaya lompatan yang nyaris sempurna tetap terasa adil.
    const pBox = { x: p.x + 12, y: p.y + 4, w: p.width - 24, h: p.height - 6 };
    for (const obstacle of this.obstacles) {
      const oBox = { x: obstacle.x + 4, y: obstacle.y + 4, w: obstacle.width - 8, h: obstacle.height - 6 };
      if (obstacle.kind === 'knife') {
        // Pisau menggantung setinggi kepala: aman bila menunduk.
        oBox.y = obstacle.y + 6;
        oBox.h = 12;
      }
      const hit = pBox.x < oBox.x + oBox.w && pBox.x + pBox.w > oBox.x
        && pBox.y < oBox.y + oBox.h && pBox.y + pBox.h > oBox.y;
      if (hit && p.invulnerable <= 0) {
        if (this.shield > 0) {
          this.shield = 0;
          p.invulnerable = 1.2;
          this.say('BULU EMAS MENAHAN SERANGAN!', 1.6);
          events |= EVENT_HIT;
        } else {
          this.lives -= 1;
          p.invulnerable = 1.4;
          this.gap -= RUN.hitGap;
          events |= EVENT_HIT;
          this.say(obstacle.kind === 'oven' ? 'ADUH! OVEN PANAS!' : obstacle.kind === 'knife' ? 'AWAS PISAU UKIR!' : 'TERSANDUNG!', 1.4);
          if (this.lives <= 0) {
            this.finishCaught();
            return events | EVENT_CAUGHT;
          }
        }
      }
    }

    // Pungut jagung / labu / bulu.
    for (const pickup of this.pickups) {
      const hit = pBox.x < pickup.x + pickup.width && pBox.x + pBox.w > pickup.x
        && pBox.y < pickup.y + pickup.height && pBox.y + pBox.h > pickup.y;
      if (hit && !pickup.taken) {
        pickup.taken = true;
        events |= EVENT_PICKUP;
        if (pickup.kind === 'corn') {
          this.corn += 1;
          this.gap = Math.min(RUN.maxGap, this.gap + 12);
        } else if (pickup.kind === 'pumpkin') {
          this.pumpkins += 1;
          if (this.lives < RUN.startLives) this.lives += 1;
          this.say('LABU! +1 NYAWA', 1.6);
        } else {
          this.feathers += 1;
          this.shield = 8;
          this.say('BULU EMAS! KEBAL 8 DETIK', 1.8);
        }
      }
    }

    // Petani menangkap kalkun.
    if (this.gap <= RUN.catchGap) {
      this.finishCaught();
      return events | EVENT_CAUGHT;
    }

    // Lolos!
    if (this.distance >= RUN.escapeDistance) {
      this.over = true;
      this.escaped = true;
      this.score += 500;
      return events | EVENT_ESCAPED;
    }

    this.updateAmbience(dt, dx);
    return events;
  }

  finishCaught() {
    this.over = true;
    this.caught = true;
    this.lives = 0;
  }

  puff(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      this.dust.push({
        x: x + range(this.rng, -8, 8),
        y: y - range(this.rng, 0, 6),
        vx: range(this.rng, -30, -8),
        vy: range(this.rng, -34, -6),
        life: range(this.rng, 0.3, 0.6),
        max: 0.6,
        size: range(this.rng, 3, 7),
      });
    }
  }

  updateAmbience(dt, dx) {
    for (const leaf of this.leaves) {
      leaf.x -= dx * 0.35 + 12 * dt;
      leaf.y += leaf.fall * dt;
      leaf.sway += dt * 2;
      if (leaf.y > 540) {
        leaf.y = -12;
        leaf.x = range(this.rng, 0, 960);
      }
      if (leaf.x < -20) leaf.x = 980;
    }
    for (const dust of this.dust) {
      dust.x += dust.vx * dt;
      dust.y += dust.vy * dt;
      dust.life -= dt;
    }
    this.dust = this.dust.filter((d) => d.life > 0);
    // Asap cerobong oven yang sedang terlihat.
    if (this.rng() < dt * 6) {
      const oven = this.obstacles.find((o) => o.kind === 'oven' && o.x > 0 && o.x < 960);
      if (oven) {
        this.smoke.push({
          x: oven.x + oven.width - 14,
          y: oven.y - 6,
          vy: -26,
          life: 1.4,
          max: 1.4,
          size: 6,
        });
      }
    }
    for (const puff of this.smoke) {
      puff.y += puff.vy * dt;
      puff.x -= dx * 0.5;
      puff.life -= dt;
      puff.size += 6 * dt;
    }
    this.smoke = this.smoke.filter((s) => s.life > 0);
  }
}

export { STEP };
