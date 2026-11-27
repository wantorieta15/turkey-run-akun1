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

Lompatan dibuat pemaaf: tekan lompat sepersekian detik sebelum mendarat tetap
melompat (buffer 0,12 dtk), dan lompatan menempuh jarak lebih pendek supaya
kalkun tidak melayang melewati rintangan berikutnya.

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

## Revisi (Akun 1)

- **Keterbacaan:** dim layar judul 0,45 → 0,26 dan layar akhir 0,55 → 0,34,
  langit babak 2–3 diterangkan, cahaya hangat di balik judul besar, outline
  teks dipertebal, pesan HUD dan tombol ajakan kini di atas panel gelap dan
  denyutnya tidak pernah lebih redup dari 0,88 — judul dan skor akhir tetap
  terbaca saat screenshot dikecilkan jadi contact sheet juri.
- **Keseimbangan:** lompatan builder dipertahankan (percobaan revisi dengan
  gravitasi lebih besar justru membuat kalkun menukik ke puncak oven —
  ketahuan di simulasi, lalu dikembalikan); pemaafnya lewat buffer lompat
  0,12 dtk + coyote time, celah pasangan 300 → 340 px, jeda antar pola
  1,05–1,35 detik laju, tekanan petani dilunakkan sedikit. Autopilot
  sempurna lolos 1500 m tanpa tabrakan di seed 7/11/42/99/123; autopilot
  ceroboh tetap tertangkap; celah minimum antar rintangan 340 px, tanpa
  rintangan mustahil dan tanpa clipping oven.
- **Bug diperbaiki:** setelah menunduk lalu berdiri, kalkun sempat tenggelam
  20 px ke dalam tanah (posisi y tidak dikembalikan) sampai lompat
  berikutnya — sekarang kaki selalu dijepit ke garis tanah saat di tanah.
- **Suara:** lompatan dan pendaratan kini bersuara (dulu lompatan diam),
  dipicu dari event dunia supaya suara dan gambar sinkron.
- **main.ts:** ditulis ulang dengan validasi pra-submit (jumlah/ukuran
  screenshot dan file game diperiksa dulu dengan pesan yang menyebut file
  pelanggarnya); batas scorer tidak berubah dan output tetap deterministik.

## Uji lokal

```sh
node serve.ts
# buka http://localhost:8080 di desktop Chrome
```

Serahkan entrinya (di luar grader, `MAKEFUN_OUTPUT_DIR` menggantikan `/output`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Uji determinisme (dua kali jalan harus identik):

```sh
mkdir -p out1 out2
MAKEFUN_OUTPUT_DIR=out1 node main.ts
MAKEFUN_OUTPUT_DIR=out2 node main.ts
diff -r out1 out2
```
