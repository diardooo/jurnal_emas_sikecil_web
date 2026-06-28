import { phaseOf } from "./mock-data";
import type { AgePhaseId, MilestoneDomain } from "./types";

/**
 * Curated, home-doable, age-appropriate stimulation ideas (UNICEF Play & Learn /
 * CDC milestone tips, Indonesian context, no expensive toys). One is surfaced
 * daily by the dashboard ritual card; this list is the reusable seed for the
 * fuller recommendation engine (a later milestone) — keep it the single source.
 */
export interface DailyActivity {
  title: string;
  detail: string;
  domain: MilestoneDomain;
}

export const ACTIVITIES: Record<AgePhaseId, DailyActivity[]> = {
  "0-3": [
    { title: "Tummy time 2 menit", detail: "Tengkurapkan saat ia terjaga untuk menguatkan otot leher.", domain: "Motorik Kasar" },
    { title: "Tatap & tirukan", detail: "Dari jarak 20–30 cm, tatap matanya dan tirukan ekspresinya.", domain: "Sosial-Emosional" },
    { title: "Ngobrol & beri jeda", detail: "Ajak bicara pelan, beri jeda agar ia 'menjawab' dengan suara.", domain: "Bahasa & Komunikasi" },
  ],
  "3-6": [
    { title: "Raih mainan", detail: "Gantung mainan warna cerah, dorong ia mengulurkan tangan.", domain: "Motorik Halus" },
    { title: "Main cermin", detail: "Ajak bermain di depan cermin, tunjuk 'ini Adik'.", domain: "Kognitif" },
    { title: "Cilukba", detail: "Main cilukba untuk melatih object permanence & tawa.", domain: "Sosial-Emosional" },
  ],
  "6-9": [
    { title: "Pindah tangan", detail: "Beri benda aman, biarkan ia memindahkannya antar tangan.", domain: "Motorik Halus" },
    { title: "Tirukan suku kata", detail: "Ulangi 'ba-ba', 'da-da' bergantian dengannya.", domain: "Bahasa & Komunikasi" },
    { title: "Sembunyikan mainan", detail: "Tutup sebagian mainan dengan kain, ajak ia mencarinya.", domain: "Kognitif" },
  ],
  "9-12": [
    { title: "Latih jepitan jari", detail: "Sediakan potongan makanan lunak untuk dijepit ibu jari & telunjuk.", domain: "Motorik Halus" },
    { title: "Tunjuk & sebut", detail: "Tunjuk benda di sekitar dan sebut namanya berulang.", domain: "Bahasa & Komunikasi" },
    { title: "Dadah & tepuk tangan", detail: "Latih melambai 'dadah' dan tepuk tangan bersama.", domain: "Sosial-Emosional" },
  ],
  "12-18": [
    { title: "Tumpuk 2 balok", detail: "Ajak menumpuk dua balok bersama, beri tepuk tangan.", domain: "Motorik Halus" },
    { title: "Buku bergambar", detail: "Baca buku 1 kata/halaman, minta ia menunjuk gambar.", domain: "Bahasa & Komunikasi" },
    { title: "Jalan di tekstur", detail: "Ajak berjalan di rumput/pasir sambil dipegangi.", domain: "Motorik Kasar" },
  ],
  "18-24": [
    { title: "Coret bebas", detail: "Beri krayon besar & kertas, biarkan ia mencoret sesuka hati.", domain: "Motorik Halus" },
    { title: "Sambung dua kata", detail: "Contohkan frasa 'mau susu?', beri jeda agar ia menirukan.", domain: "Bahasa & Komunikasi" },
    { title: "Bantu beres mainan", detail: "Ajak memasukkan mainan ke kotak sambil bernyanyi.", domain: "Sosial-Emosional" },
  ],
  "24-36": [
    { title: "Lompat dua kaki", detail: "Main lompat di tempat dengan kedua kaki.", domain: "Motorik Kasar" },
    { title: "Tunjuk bagian tubuh", detail: "Tanya 'mana hidung?' dan tunjuk bersama.", domain: "Kognitif" },
    { title: "Main pura-pura", detail: "Pura-pura menyuapi boneka untuk melatih imajinasi.", domain: "Sosial-Emosional" },
  ],
  "36-48": [
    { title: "Gambar lingkaran", detail: "Contohkan menggambar lingkaran, minta ia meniru.", domain: "Motorik Halus" },
    { title: "Cerita giliran", detail: "Tanya 'tadi main apa?' dan dengarkan ceritanya.", domain: "Bahasa & Komunikasi" },
    { title: "Warna & berhitung", detail: "Hitung mainan 1–5 dan sebut warnanya sambil bermain.", domain: "Kognitif" },
  ],
  "48-60": [
    { title: "Lompat satu kaki", detail: "Main engklek sederhana, lompat dengan satu kaki.", domain: "Motorik Kasar" },
    { title: "Gambar orang", detail: "Minta menggambar 'ayah/ibu' dengan kepala & badan.", domain: "Motorik Halus" },
    { title: "Cerita berurutan", detail: "Minta ia menceritakan kegiatan tadi secara urut.", domain: "Bahasa & Komunikasi" },
  ],
  "60-72": [
    { title: "Tulis nama", detail: "Latih menyalin huruf-huruf namanya sendiri.", domain: "Motorik Halus" },
    { title: "Tebak huruf", detail: "Tebak huruf awal dari nama benda di rumah.", domain: "Kognitif" },
    { title: "Keseimbangan", detail: "Lomba berdiri satu kaki, hitung sampai 6 detik.", domain: "Motorik Kasar" },
  ],
};

/**
 * Deterministically pick today's activity for a child of `ageMonths`.
 * `daySeed` (day-of-epoch) rotates the suggestion daily but keeps it stable
 * within a day. It defaults to today's seed — computed inside this function (not
 * at the call site) so callers stay pure during render. Pass an explicit seed
 * in tests.
 */
export function dailyActivity(
  ageMonths: number,
  daySeed: number = Math.floor(Date.now() / 86_400_000),
): DailyActivity {
  const list = ACTIVITIES[phaseOf(ageMonths)];
  return list[((daySeed % list.length) + list.length) % list.length];
}

/** All stimulation ideas for a child's current age phase. */
export function activitiesForAge(ageMonths: number): DailyActivity[] {
  return ACTIVITIES[phaseOf(ageMonths)];
}
