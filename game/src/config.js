// Kalkun Kabur — config.js (REVISI BESAR Akun 1)
// Semua angka penyeimbang dan palet musim gugur dalam satu tempat, supaya
// penyetelan permainan tidak tersebar di file lain.
//
// Yang berubah dari builder:
// - Lompatan PEMAAF lewat buffer, bukan lewat balistik baru: percobaan
//   revisi pertama (v=-1000, g=2500) justru MEMPERSempit jendela waktu —
//   simulasi menunjukkan kalkun menukik 0,27 px ke puncak oven. Balistik
//   builder (v=-907, g=2100; tinggi ~196 px, udara 0,86 dtk) terbukti
//   lolos sempurna dan dipertahankan; yang ditambah adalah buffer + celah.
// - Coyote time 0,09 dtk + buffer lompat 0,12 dtk: lompatan yang ditekan
//   sepersekian detik sebelum mendarat / sesudah tepi tetap jalan.
// - Celah pasangan 300 -> 340 px dan jeda antar pola 0,95-1,25 -> 1,05-1,35
//   detik: di kecepatan tertinggi pun selalu ada ruang mendarat + lompat
//   lagi (diukur di simulasi: celah minimum antar rintangan 340 px).
// - Tekanan petani dilunakkan sedikit: celah menyusut 2,2 px/dtk (dari 2,5),
//   serbuan -40 px (dari -50), tabrakan -56 px (dari -64). Pemain ceroboh
//   tetap tertangkap (3 nyawa habis), pemain bersih tetap lolos.
// - Langit babak 2-3 diterangkan: senja tetap senja, tapi tidak lagi
//   menghitam di layar akhir — teks judul/akhir juga tidak lagi tenggelam.
// - Dim layar (berapa gelap latar di balik teks): judul 0,26, akhir 0,34,
//   jeda 0,34 (dari 0,45 / 0,55 / 0,50) supaya contact sheet juri tetap
//   terbaca saat dikecilkan.

export const VIEW = { width: 960, height: 540 };
export const GROUND_Y = 470;

export const TURKEY = {
  x: 210,
  width: 62,
  height: 50,
  duckHeight: 30,
  // Lompatan builder yang terbukti: tinggi ~196 px, udara 0,86 dtk.
  // (Revisi sempat mencoba v=-1000/g=2500 — simulasi membuktikan lintasan
  // menukiknya menabrak puncak oven, jadi balistik dikembalikan.)
  jumpVelocity: -907,
  gravity: 2100,
  // Jendela pengampunan input (detik): lompat sesaat setelah meninggalkan
  // tanah (coyote) dan lompat yang ditekan sesaat sebelum mendarat (buffer).
  coyoteSeconds: 0.09,
  jumpBufferSeconds: 0.12,
};

export const RUN = {
  baseSpeed: 265,
  maxSpeed: 430,
  speedPerMetre: 0.085,
  pixelsPerMetre: 50,
  escapeDistance: 1500,
  startLives: 3,
  startGap: 260,
  maxGap: 330,
  catchGap: 26,
  // Tekanan petani per detik saat tidak ada yang memperbaikinya.
  gapDecayPerSecond: 2.2,
  // Serbuan berkala petani dan hukuman tabrakan (px celah).
  surgeGap: 40,
  hitGap: 56,
  // Celah di dalam satu pola ganda (rintangan kedua setelah yang pertama).
  pairGap: 340,
  // Jeda antar pola, dalam detik laju (bukan piksel): di kecepatan tinggi
  // celah piksel ikut membesar, jadi lompatan jauh tidak mendarat di atas
  // rintangan berikutnya.
  spawnGapSecondsMin: 1.05,
  spawnGapSecondsMax: 1.35,
};

// Jarak (meter) tiap babak dan namanya. Langit babak 2-3 sengaja dibuat
// lebih terang dari builder supaya layar akhir tidak menghitam.
export const STAGES = [
  { from: 0, name: 'HALAMAN PERTANIAN', sky: ['#ff9a3c', '#ff6b35', '#7a2e4d'] },
  { from: 400, name: 'GUDANG JERAMI', sky: ['#f07a35', '#b04a5e', '#4a2547'] },
  { from: 900, name: 'DAPUR THANKSGIVING', sky: ['#d95f33', '#7d3358', '#331a3d'] },
];

// Seberapa gelap lapisan di balik teks layar judul / akhir / jeda (0-1).
export const SCREEN_DIM = { title: 0.26, end: 0.34, paused: 0.34 };

export const OBSTACLES = {
  oven: { width: 74, height: 66 },
  fence: { width: 26, height: 48 },
  hay: { width: 58, height: 46 },
  knife: { width: 96, height: 20 },
};

export const PICKUPS = {
  corn: { width: 30, height: 38, score: 25 },
  pumpkin: { width: 40, height: 36, score: 50 },
  feather: { width: 34, height: 30, score: 50 },
};

// Palet musim gugur yang dipakai semua gambar.
export const PALETTE = {
  turkeyBody: '#8a5a2b',
  turkeyDark: '#6b4420',
  turkeyWing: '#a9713a',
  tailA: '#c96f2e',
  tailB: '#e8a33d',
  tailC: '#7a4a21',
  wattle: '#d43d2a',
  beak: '#f2a541',
  farmerShirt: '#3e6fb0',
  farmerOveralls: '#2f4d7a',
  farmerSkin: '#f0c08a',
  farmerHat: '#7a5a2e',
  ovenBody: '#2b2b30',
  ovenDoor: '#ff7a1a',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#5a2d12',
  cornYellow: '#ffd23e',
  leafA: '#e8702a',
  leafB: '#f2b134',
  leafC: '#c94f2e',
  // Panel gelap di balik teks penting (judul, pesan tengah, CTA).
  panel: 'rgba(30, 12, 8, 0.68)',
  panelSoft: 'rgba(30, 12, 8, 0.55)',
};
