// Kalkun Kabur — config.js
// Semua angka penyeimbang dan palet musim gugur dalam satu tempat, supaya
// penyetelan permainan tidak tersebar di file lain.

export const VIEW = { width: 960, height: 540 };
export const GROUND_Y = 470;

export const TURKEY = {
  x: 210,
  width: 62,
  height: 50,
  duckHeight: 30,
  jumpVelocity: -907,
  gravity: 2100,
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
};

// Jarak (meter) tiap babak dan namanya.
export const STAGES = [
  { from: 0, name: 'HALAMAN PERTANIAN', sky: ['#ff9a3c', '#ff6b35', '#7a2e4d'] },
  { from: 400, name: 'GUDANG JERAMI', sky: ['#e2622b', '#a03a54', '#3d1e42'] },
  { from: 900, name: 'DAPUR THANKSGIVING', sky: ['#c94f2e', '#6e2a4e', '#241533'] },
];

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
};
