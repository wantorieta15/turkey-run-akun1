// Kalkun Kabur — render.js
// Semua gambar digambar di canvas dari kode: kalkun, petani, oven, pisau,
// halaman pertanian saat senja, daun jatuh, debu, HUD, dan semua layar.
// Tanpa satu pun aset unduhan.

import { GROUND_Y, PALETTE, RUN, TURKEY, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';
export const SCREEN_PAUSED = 'paused';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align, weight, outline) {
  ctx.font = `${weight || 'bold'} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align || 'center';
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineWidth = Math.max(3, size / 8);
    ctx.strokeStyle = outline;
    ctx.lineJoin = 'round';
    ctx.strokeText(str, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.clouds = [
      { x: 80, y: 70, s: 1.1 },
      { x: 420, y: 110, s: 0.8 },
      { x: 700, y: 60, s: 1.3 },
      { x: 880, y: 140, s: 0.7 },
    ];
  }

  fit() {
    const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
    const width = Math.floor(VIEW.width * scale);
    const height = Math.floor(VIEW.height * scale);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.width = VIEW.width;
    this.canvas.height = VIEW.height;
  }

  drawSky(world, time) {
    const ctx = this.ctx;
    const sky = world.stage.sky;
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    gradient.addColorStop(0, sky[0]);
    gradient.addColorStop(0.55, sky[1]);
    gradient.addColorStop(1, sky[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    // Matahari senja dengan lingkaran cahaya.
    const sunX = 770;
    const sunY = 150;
    const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 130);
    glow.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
    glow.addColorStop(0.35, 'rgba(255, 190, 90, 0.45)');
    glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 140, sunY - 140, 280, 280);
    ctx.fillStyle = '#ffdf8a';
    ellipse(ctx, sunX, sunY, 44, 44);
    ctx.fillStyle = '#fff3c4';
    ellipse(ctx, sunX, sunY, 34, 34);

    // Awan bergerak pelan.
    ctx.fillStyle = 'rgba(255, 225, 200, 0.75)';
    for (const cloud of this.clouds) {
      const cx = ((cloud.x + time * 6) % 1100) - 70;
      ellipse(ctx, cx, cloud.y, 52 * cloud.s, 15 * cloud.s);
      ellipse(ctx, cx + 34 * cloud.s, cloud.y + 6, 36 * cloud.s, 12 * cloud.s);
      ellipse(ctx, cx - 34 * cloud.s, cloud.y + 7, 30 * cloud.s, 11 * cloud.s);
    }
  }

  drawBackdrop(world) {
    const ctx = this.ctx;
    const offset = (world.distance * RUN.pixelsPerMetre * 0.25) % 480;
    // Siluet pepohonan dan gudang di kejauhan.
    ctx.fillStyle = 'rgba(74, 32, 54, 0.55)';
    for (let i = -1; i < 3; i += 1) {
      const bx = i * 480 + 480 - offset;
      // Gudang.
      ctx.fillRect(bx, GROUND_Y - 130, 150, 130);
      ctx.beginPath();
      ctx.moveTo(bx - 12, GROUND_Y - 130);
      ctx.lineTo(bx + 75, GROUND_Y - 172);
      ctx.lineTo(bx + 162, GROUND_Y - 130);
      ctx.closePath();
      ctx.fill();
      // Pohon.
      ellipse(ctx, bx + 230, GROUND_Y - 120, 46, 58);
      ctx.fillRect(bx + 222, GROUND_Y - 80, 16, 80);
      ellipse(ctx, bx + 330, GROUND_Y - 108, 38, 46);
      ctx.fillRect(bx + 324, GROUND_Y - 76, 12, 76);
    }
    // Pagar kayu berderet.
    ctx.fillStyle = '#6e4423';
    const fenceOff = (world.distance * RUN.pixelsPerMetre) % 96;
    for (let x = -fenceOff; x < VIEW.width + 96; x += 96) {
      ctx.fillRect(x, GROUND_Y - 58, 8, 58);
      ctx.fillRect(x + 48, GROUND_Y - 58, 8, 58);
    }
    ctx.fillRect(0, GROUND_Y - 52, VIEW.width, 6);
    ctx.fillRect(0, GROUND_Y - 32, VIEW.width, 6);
  }

  drawGround(world) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW.height);
    gradient.addColorStop(0, '#b06a2e');
    gradient.addColorStop(1, '#7a3f16');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, GROUND_Y, VIEW.width, VIEW.height - GROUND_Y);
    // Rumput dan labu di tanah.
    ctx.fillStyle = '#8a5a24';
    const off = (world.distance * RUN.pixelsPerMetre) % 120;
    for (let x = -off; x < VIEW.width + 120; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 12);
      ctx.lineTo(x + 6, GROUND_Y - 4);
      ctx.lineTo(x + 12, GROUND_Y + 12);
      ctx.closePath();
      ctx.fill();
      ellipse(ctx, x + 62, GROUND_Y + 34, 12, 8);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, GROUND_Y, VIEW.width, 4);
  }

  drawLeaves(world) {
    const ctx = this.ctx;
    for (const leaf of world.leaves) {
      ctx.save();
      ctx.translate(leaf.x + Math.sin(leaf.sway) * 10, leaf.y);
      ctx.rotate(Math.sin(leaf.sway) * 0.8);
      ctx.fillStyle = leaf.color;
      ellipse(ctx, 0, 0, leaf.size, leaf.size * 0.55);
      ctx.restore();
    }
  }

  drawDust(world) {
    const ctx = this.ctx;
    for (const dust of world.dust) {
      ctx.globalAlpha = Math.max(0, dust.life / dust.max) * 0.55;
      ctx.fillStyle = '#e8c99a';
      ellipse(ctx, dust.x, dust.y, dust.size, dust.size * 0.7);
    }
    ctx.globalAlpha = 1;
    for (const puff of world.smoke) {
      ctx.globalAlpha = Math.max(0, puff.life / puff.max) * 0.4;
      ctx.fillStyle = '#d8d2c8';
      ellipse(ctx, puff.x, puff.y, puff.size, puff.size * 0.8);
    }
    ctx.globalAlpha = 1;
  }

  drawTurkey(world) {
    const ctx = this.ctx;
    const p = world.player;
    const cx = p.x + p.width / 2;
    const feetY = p.y + p.height;
    const squash = p.squash > 0 ? 1 - p.squash * 0.12 : 1;
    const blink = p.invulnerable > 0 && Math.floor(world.time * 12) % 2 === 0;
    if (blink) return;
    ctx.save();
    ctx.translate(cx, feetY);
    ctx.scale(1, squash);
    const legSwing = p.onGround ? Math.sin(p.runCycle * 6) * 9 : 4;
    // Kaki berlari.
    ctx.strokeStyle = '#f2a541';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-6 + legSwing, 0);
    ctx.moveTo(6, -8);
    ctx.lineTo(6 - legSwing, 0);
    ctx.stroke();
    // Kipas ekor.
    const tailColors = [PALETTE.tailA, PALETTE.tailB, PALETTE.tailC, PALETTE.tailB, PALETTE.tailA];
    for (let i = 0; i < 5; i += 1) {
      const angle = -Math.PI / 2 + (i - 2) * 0.42;
      ctx.save();
      ctx.translate(-24, -30);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = tailColors[i];
      ellipse(ctx, 0, -20, 9, 22);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ellipse(ctx, 0, -26, 4, 8);
      ctx.restore();
    }
    // Badan.
    ctx.fillStyle = PALETTE.turkeyBody;
    ellipse(ctx, 0, -26, 26, 24);
    ctx.fillStyle = PALETTE.turkeyDark;
    ellipse(ctx, -4, -18, 18, 14);
    // Sayap.
    ctx.fillStyle = PALETTE.turkeyWing;
    ctx.save();
    ctx.translate(-2, -28);
    ctx.rotate(p.onGround ? Math.sin(p.runCycle * 6) * 0.35 : -0.9);
    ellipse(ctx, 0, 0, 15, 9);
    ctx.restore();
    // Leher + kepala.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.fillRect(12, -52, 10, 26);
    ellipse(ctx, 18, -54, 11, 10);
    // Pial merah + paruh.
    ctx.fillStyle = PALETTE.wattle;
    ellipse(ctx, 24, -46, 4, 7);
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(26, -56);
    ctx.lineTo(38, -52);
    ctx.lineTo(26, -49);
    ctx.closePath();
    ctx.fill();
    // Mata.
    ctx.fillStyle = '#1d1d1d';
    ellipse(ctx, 20, -57, 2.4, 2.4);
    ctx.fillStyle = '#ffffff';
    ellipse(ctx, 21, -58, 0.9, 0.9);
    // Perisai bulu emas.
    if (world.shield > 0) {
      ctx.globalAlpha = 0.45 + Math.sin(world.time * 8) * 0.15;
      ctx.strokeStyle = '#ffd23e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -28, 40, 36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawFarmer(world) {
    const ctx = this.ctx;
    const gap = world.gap;
    // Celah visual dipadatkan (0,55x) supaya petani selalu terbaca di layar
    // sebagai pengejar; meter HUD yang menunjukkan celah sebenarnya.
    const fx = world.player.x - Math.max(34, gap * 0.55);
    if (fx < -140) return;
    const feetY = GROUND_Y;
    const cycle = world.time * 9;
    const legSwing = Math.sin(cycle) * 12;
    const near = gap < 120;
    ctx.save();
    ctx.translate(fx, feetY);
    if (near && Math.floor(world.time * 6) % 2 === 0) {
      ctx.globalAlpha = 0.92;
    }
    // Kaki.
    ctx.strokeStyle = '#2f4d7a';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, -34);
    ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, -34);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();
    // Badan + overall.
    ctx.fillStyle = PALETTE.farmerOveralls;
    roundRect(ctx, -16, -78, 32, 46, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerShirt;
    roundRect(ctx, -16, -78, 32, 16, 8);
    ctx.fill();
    // Lengan terulur ke depan + garpu rumput.
    ctx.strokeStyle = PALETTE.farmerSkin;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(10, -70);
    ctx.lineTo(30, -58);
    ctx.stroke();
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(28, -60);
    ctx.lineTo(52, -96);
    ctx.stroke();
    ctx.strokeStyle = '#cfd6de';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(52 + i * 5, -96);
      ctx.lineTo(56 + i * 6, -112);
      ctx.stroke();
    }
    // Kepala + topi jerami.
    ctx.fillStyle = PALETTE.farmerSkin;
    ellipse(ctx, 2, -90, 13, 13);
    ctx.fillStyle = PALETTE.farmerHat;
    ellipse(ctx, 2, -100, 20, 6);
    ellipse(ctx, 2, -104, 11, 7);
    // Mata marah + kumis.
    ctx.fillStyle = '#1d1d1d';
    ellipse(ctx, 8, -92, 2, 2);
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(4, -82);
    ctx.lineTo(14, -82);
    ctx.stroke();
    ctx.restore();

    if (near) {
      text(ctx, '!', fx + 6, GROUND_Y - 128, 34, '#ffdf3e', 'center', '900', '#7a1e00');
    }
  }

  drawObstacles(world) {
    const ctx = this.ctx;
    for (const obstacle of world.obstacles) {
      if (obstacle.kind === 'oven') {
        // Oven: kotak hitam, pintu api, cerobong berasap.
        ctx.fillStyle = PALETTE.ovenBody;
        roundRect(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 6);
        ctx.fill();
        ctx.fillStyle = '#1a1a1e';
        ctx.fillRect(obstacle.x + obstacle.width - 20, obstacle.y - 16, 12, 16);
        const flicker = 0.75 + Math.sin(world.time * 11 + obstacle.x) * 0.25;
        ctx.fillStyle = `rgba(255, 122, 26, ${flicker})`;
        roundRect(ctx, obstacle.x + 12, obstacle.y + 18, obstacle.width - 24, 30, 5);
        ctx.fill();
        ctx.fillStyle = '#ffd23e';
        ellipse(ctx, obstacle.x + obstacle.width / 2, obstacle.y + 33, 10, 7);
        ctx.fillStyle = '#8a8f98';
        ctx.fillRect(obstacle.x + 8, obstacle.y + 52, obstacle.width - 16, 4);
        text(ctx, 'OVEN', obstacle.x + obstacle.width / 2, obstacle.y + 8, 10, '#ffb37a', 'center', '900');
      } else if (obstacle.kind === 'fence') {
        ctx.fillStyle = '#7a4a21';
        ctx.fillRect(obstacle.x, obstacle.y, 5, obstacle.height);
        ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y, 5, obstacle.height);
        ctx.fillRect(obstacle.x, obstacle.y + 8, obstacle.width, 6);
        ctx.fillRect(obstacle.x, obstacle.y + 26, obstacle.width, 6);
        ctx.fillStyle = '#a9713a';
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y);
        ctx.lineTo(obstacle.x + 5, obstacle.y - 7);
        ctx.lineTo(obstacle.x + 10, obstacle.y);
        ctx.closePath();
        ctx.fill();
      } else if (obstacle.kind === 'hay') {
        ctx.fillStyle = '#d9a441';
        ellipse(ctx, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 30, 23);
        ctx.strokeStyle = '#a87a24';
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i += 1) {
          ctx.beginPath();
          ctx.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 30 - Math.abs(i) * 4, 23 - Math.abs(i) * 5, 0, -0.6, 0.6);
          ctx.stroke();
        }
        ctx.fillStyle = '#c94f2e';
        ellipse(ctx, obstacle.x + obstacle.width / 2, obstacle.y + 4, 8, 5);
      } else if (obstacle.kind === 'knife') {
        // Pisau ukir menggantung pada tali, berayun pelan.
        const sway = Math.sin(obstacle.swing) * 8;
        const kx = obstacle.x + sway;
        ctx.strokeStyle = '#3a2a18';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width / 2, 0);
        ctx.lineTo(kx + obstacle.width / 2, obstacle.y + 4);
        ctx.stroke();
        ctx.save();
        ctx.translate(kx + obstacle.width / 2, obstacle.y + obstacle.height / 2);
        ctx.rotate(Math.sin(obstacle.swing) * 0.16);
        ctx.fillStyle = PALETTE.knifeHandle;
        roundRect(ctx, -obstacle.width / 2, -7, 26, 14, 4);
        ctx.fill();
        ctx.fillStyle = PALETTE.knifeBlade;
        ctx.beginPath();
        ctx.moveTo(-obstacle.width / 2 + 24, -8);
        ctx.lineTo(obstacle.width / 2 - 8, -8);
        ctx.lineTo(obstacle.width / 2, 0);
        ctx.lineTo(obstacle.width / 2 - 8, 8);
        ctx.lineTo(-obstacle.width / 2 + 24, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillRect(-obstacle.width / 2 + 30, -5, 30, 2);
        ctx.restore();
      }
    }
  }

  drawPickups(world) {
    const ctx = this.ctx;
    for (const pickup of world.pickups) {
      const bob = Math.sin(pickup.bob) * 4;
      if (pickup.kind === 'corn') {
        ctx.fillStyle = '#3e7a2e';
        ellipse(ctx, pickup.x + 15, pickup.y + 6 + bob, 12, 5);
        ctx.fillStyle = PALETTE.cornYellow;
        roundRect(ctx, pickup.x + 4, pickup.y + 8 + bob, 22, 26, 9);
        ctx.fill();
        ctx.fillStyle = '#e8a33d';
        for (let row = 0; row < 3; row += 1) {
          for (let col = 0; col < 3; col += 1) {
            ellipse(ctx, pickup.x + 9 + col * 6, pickup.y + 14 + row * 8 + bob, 2, 2.6);
          }
        }
      } else if (pickup.kind === 'pumpkin') {
        ctx.fillStyle = '#e8702a';
        ellipse(ctx, pickup.x + 20, pickup.y + 20 + bob, 19, 15);
        ctx.strokeStyle = '#b84d12';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(pickup.x + 20, pickup.y + 20 + bob, 11, 15, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#3e7a2e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pickup.x + 20, pickup.y + 6 + bob);
        ctx.lineTo(pickup.x + 24, pickup.y - 2 + bob);
        ctx.stroke();
      } else {
        // Bulu emas: perisai sekali pakai.
        ctx.save();
        ctx.translate(pickup.x + 17, pickup.y + 15 + bob);
        ctx.rotate(Math.sin(pickup.bob) * 0.3);
        ctx.fillStyle = '#ffd23e';
        ellipse(ctx, 0, 0, 15, 7);
        ctx.fillStyle = '#fff3c4';
        ellipse(ctx, -4, -2, 8, 4);
        ctx.restore();
      }
    }
  }

  drawHud(world, screen) {
    const ctx = this.ctx;
    // Panel atas tembus pandang.
    ctx.fillStyle = 'rgba(30, 12, 8, 0.55)';
    roundRect(ctx, 12, 10, VIEW.width - 24, 58, 12);
    ctx.fill();
    text(ctx, `SKOR ${world.score}`, 28, 40, 26, '#ffe9b0', 'left', '900', '#4a1e00');
    text(ctx, `${Math.floor(world.distance)} m / ${RUN.escapeDistance} m`, VIEW.width / 2, 32, 22, '#ffffff', 'center', '900', '#4a1e00');
    text(ctx, world.stage.name, VIEW.width / 2, 56, 13, '#ffcf7a', 'center', '700');
    // Nyawa: hati.
    for (let i = 0; i < RUN.startLives; i += 1) {
      const x = VIEW.width - 44 - i * 34;
      const alive = i < world.lives;
      ctx.fillStyle = alive ? '#ff4d6d' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(x, 46);
      ctx.bezierCurveTo(x - 11, 34, x - 22, 42, x - 11, 52);
      ctx.bezierCurveTo(x - 4, 56, x, 58, x, 58);
      ctx.bezierCurveTo(x, 58, x + 4, 56, x + 11, 52);
      ctx.bezierCurveTo(x + 22, 42, x + 11, 34, x, 46);
      ctx.fill();
    }
    text(ctx, `JAGUNG ${world.corn}`, VIEW.width - 170, 40, 16, '#ffd23e', 'right', '800', '#4a1e00');
    // Meter jarak petani.
    const meterW = 220;
    const meterX = 28;
    const meterY = 82;
    ctx.fillStyle = 'rgba(30, 12, 8, 0.55)';
    roundRect(ctx, meterX - 8, meterY - 8, meterW + 16, 30, 8);
    ctx.fill();
    text(ctx, 'PETANI', meterX, meterY + 7, 12, '#ffb37a', 'left', '800');
    const ratio = Math.max(0, Math.min(1, world.gap / RUN.maxGap));
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, meterX + 62, meterY, meterW - 62, 12, 6);
    ctx.fill();
    ctx.fillStyle = ratio > 0.45 ? '#7ddc5a' : ratio > 0.22 ? '#ffb13e' : '#ff4d3d';
    roundRect(ctx, meterX + 62, meterY, (meterW - 62) * ratio, 12, 6);
    ctx.fill();
    if (world.shield > 0) {
      text(ctx, `PERISAI ${Math.ceil(world.shield)} dtk`, meterX + meterW + 16, meterY + 7, 13, '#ffd23e', 'left', '800', '#4a1e00');
    }
    // Kecepatan + jarak tersisa di kanan bawah.
    if (screen === SCREEN_PLAY) {
      text(ctx, `KECEPATAN ${Math.round(world.speed)} px/dtk`, VIEW.width - 24, VIEW.height - 22, 14, 'rgba(255,255,255,0.85)', 'right', '700', 'rgba(0,0,0,0.4)');
    }
    // Pesan tengah layar.
    if (world.messageTimer > 0) {
      const alpha = Math.min(1, world.messageTimer);
      ctx.globalAlpha = alpha;
      text(ctx, world.message, VIEW.width / 2, 132, 26, '#ffe9b0', 'center', '900', '#7a1e00');
      ctx.globalAlpha = 1;
    }
    if (world.surgeFlash > 0 && Math.floor(world.time * 8) % 2 === 0) {
      text(ctx, 'PETANI MENDEKAT!', VIEW.width / 2, 168, 22, '#ff5a3d', 'center', '900', '#fff');
    }
  }

  drawTitle(world, best) {
    this.drawWorld(world);
    ctxDim(this.ctx, 0.45);
    const ctx = this.ctx;
    text(ctx, 'KALKUN KABUR!', VIEW.width / 2, 118, 64, '#ffe9b0', 'center', '900', '#7a1e00');
    text(ctx, 'Kabur dari Thanksgiving — lari sejauh 1500 m sebelum petani menangkapmu!', VIEW.width / 2, 168, 19, '#ffffff', 'center', '700', 'rgba(60,20,0,0.9)');
    text(ctx, 'Lompati oven, pagar & jerami  •  Menunduklah di bawah pisau ukir  •  Pungut jagung', VIEW.width / 2, 198, 16, '#ffd9a0', 'center', '700');
    // Kartu kontrol.
    ctx.fillStyle = 'rgba(30, 12, 8, 0.6)';
    roundRect(ctx, VIEW.width / 2 - 250, 228, 500, 92, 14);
    ctx.fill();
    text(ctx, 'SPASI / ↑ / KLIK  —  LOMPAT', VIEW.width / 2, 254, 18, '#ffffff', 'center', '800');
    text(ctx, '↓ / S  —  MENUNDUK', VIEW.width / 2, 282, 18, '#ffffff', 'center', '800');
    text(ctx, 'P jeda  •  M suara  •  R ulang', VIEW.width / 2, 308, 15, '#ffcf7a', 'center', '700');
    if (best > 0) text(ctx, `SKOR TERBAIK: ${best}`, VIEW.width / 2, 348, 18, '#ffd23e', 'center', '900', '#4a1e00');
    const pulse = 0.65 + Math.sin(world.time * 4) * 0.35;
    ctx.globalAlpha = pulse;
    text(ctx, 'TEKAN ENTER ATAU KLIK UNTUK LARI', VIEW.width / 2, 396, 24, '#ffffff', 'center', '900', '#7a1e00');
    ctx.globalAlpha = 1;
    text(ctx, 'Kalkun orisinal • Gambar & suara dibuat dari kode • Tanpa aset unduhan', VIEW.width / 2, 470, 13, 'rgba(255,255,255,0.75)', 'center', '700');
  }

  drawEnd(world, best, escaped) {
    this.drawWorld(world);
    ctxDim(this.ctx, 0.55);
    const ctx = this.ctx;
    if (escaped) {
      text(ctx, 'LOLOS!', VIEW.width / 2, 108, 58, '#ffe9b0', 'center', '900', '#2e5a00');
      text(ctx, 'Kalkun bebas! Thanksgiving tahun ini tanpa kalkun panggang.', VIEW.width / 2, 158, 19, '#ffffff', 'center', '700', 'rgba(40,60,0,0.9)');
    } else {
      text(ctx, 'TERTANGKAP!', VIEW.width / 2, 108, 58, '#ffb3a0', 'center', '900', '#5a0e00');
      text(ctx, 'Petani berhasil menangkap kalkun… Thanksgiving tetap jalan.', VIEW.width / 2, 158, 19, '#ffffff', 'center', '700', 'rgba(60,10,0,0.9)');
    }
    // Kartu statistik.
    ctx.fillStyle = 'rgba(30, 12, 8, 0.65)';
    roundRect(ctx, VIEW.width / 2 - 230, 190, 460, 132, 14);
    ctx.fill();
    text(ctx, `SKOR AKHIR  ${world.score}`, VIEW.width / 2, 216, 24, '#ffe9b0', 'center', '900');
    text(ctx, `Jarak  ${Math.floor(world.distance)} m   •   Jagung  ${world.corn}   •   Waktu  ${world.time.toFixed(1)} dtk`, VIEW.width / 2, 252, 17, '#ffffff', 'center', '700');
    text(ctx, `Babak tercapai: ${world.stage.name}`, VIEW.width / 2, 282, 16, '#ffcf7a', 'center', '700');
    if (world.score >= best && world.score > 0) {
      text(ctx, '★ SKOR TERBAIK BARU! ★', VIEW.width / 2, 308, 17, '#ffd23e', 'center', '900', '#4a1e00');
    }
    const pulse = 0.65 + Math.sin(world.time * 4) * 0.35;
    ctx.globalAlpha = pulse;
    text(ctx, 'TEKAN R ATAU KLIK UNTUK BERLARI LAGI', VIEW.width / 2, 372, 22, '#ffffff', 'center', '900', '#7a1e00');
    ctx.globalAlpha = 1;
  }

  drawPaused() {
    ctxDim(this.ctx, 0.5);
    text(this.ctx, 'JEDA', VIEW.width / 2, 230, 52, '#ffffff', 'center', '900', '#4a1e00');
    text(this.ctx, 'Tekan P untuk lanjut  •  R untuk mulai dari awal', VIEW.width / 2, 282, 18, '#ffcf7a', 'center', '700');
  }

  drawWorld(world) {
    this.drawSky(world, world.time);
    this.drawBackdrop(world);
    this.drawGround(world);
    this.drawLeaves(world);
    this.drawObstacles(world);
    this.drawPickups(world);
    this.drawDust(world);
    this.drawTurkey(world);
    this.drawFarmer(world);
  }

  draw(screen, world, best) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    if (screen === SCREEN_TITLE) {
      this.drawTitle(world, best);
      return;
    }
    if (screen === SCREEN_OVER) {
      this.drawEnd(world, best, false);
      return;
    }
    if (screen === SCREEN_ESCAPED) {
      this.drawEnd(world, best, true);
      return;
    }
    this.drawWorld(world);
    this.drawHud(world, screen);
    if (screen === SCREEN_PAUSED) this.drawPaused();
  }
}

function ctxDim(ctx, alpha) {
  ctx.fillStyle = `rgba(20, 8, 4, ${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}
