# Kalkun Kabur! — Turkey Escape Game

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/wantorieta15/turkey-run-akun1/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/wantorieta15/turkey-run-akun1/reward.svg)](https://make.fun/c/turkey-run-game-01)

Game lari kabur 2D orisinal untuk kompetisi **Make the best turkey escape game**
(`turkey-run-game-01`) di make.fun. Dibangun oleh **@walta-exchange** (Akun 1).

## Fantasi

Tiga hari sebelum Thanksgiving, seekor kalkun sadar ia akan jadi santapan.
Ia kabur dari halaman pertanian saat senja — dikejar petani bergarpu rumput,
melompati oven panas, pagar dan tumpukan jerami, menunduk di bawah pisau ukir
yang berayun. Tiga babak makin cepat: Halaman Pertanian, Gudang Jerami, lalu
Dapur Thanksgiving. Bertahan sejauh 1500 meter dan kalkun bebas — tertangkap
petani atau kehabisan nyawa, dan makan malam tetap jalan.

## Cara main

Buka `game/index.html` di desktop Chrome — langsung main, tanpa instalasi,
tanpa network.

| Kontrol | Aksi |
|---|---|
| Spasi / ↑ / W / klik | Lompat (lewati oven, pagar, jerami) |
| ↓ / S | Menunduk (lewati pisau ukir yang menggantung) |
| P | Jeda |
| R | Mulai ulang |
| M | Bisukan suara |
| Enter | Mulai / main lagi |

Petani mengejar dari kiri — meter "PETANI" di HUD menunjukkan seberapa dekat
ia. Menabrak rintangan mengurangi nyawa sekaligus mendekatkan petani; memungut
jagung menjauhkannya lagi. Labu memberi +1 nyawa, bulu emas memberi perisai
8 detik.

## Teknologi

- Canvas 2D murni, tanpa library dan tanpa aset unduhan: kalkun, petani,
  oven, pisau, langit senja, daun jatuh dan debu semuanya digambar dari kode
- Suara disintesis WebAudio: gobble kalkun, lompatan, benturan, alarm petani,
  jingle menang/kalah
- RNG ber-seed: pola rintangan bisa diulang; adegan screenshot dimainkan
  dengan autopilot dari aturan asli (`?shot=title|play|caught|escaped&seed=7`)
- Struktur berkas satu tugas per berkas: `config`, `random`, `audio`,
  `input`, `world` (aturan + AI petani), `render` (semua gambar + HUD),
  `shots` (adegan), `main` (loop)

## Uji lokal

```sh
node serve.ts
# buka http://localhost:8080 di desktop Chrome
```

Serahkan entrinya (di luar grader, `MAKEFUN_OUTPUT_DIR` menggantikan `/output`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
