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
    { title: "Pijat bayi lembut", detail: "Pijat ringan di kaki dan perut searah jarum jam — memperkuat bonding dan melancarkan pencernaan.", domain: "Sensorik" },
    { title: "Gantung benda warna cerah", detail: "Gantung mainan warna kontras (hitam-putih atau merah-kuning) di atas agar matanya berlatih fokus.", domain: "Kognitif" },
    { title: "Ceritakan aktivitasnya", detail: "Saat ganti popok atau mandi, ceritakan setiap langkahnya — otak bayi merekam nada dan ritme suara.", domain: "Bahasa & Komunikasi" },
  ],
  "3-6": [
    { title: "Raih mainan", detail: "Gantung mainan warna cerah, dorong ia mengulurkan tangan.", domain: "Motorik Halus" },
    { title: "Main cermin", detail: "Ajak bermain di depan cermin, tunjuk 'ini Adik'.", domain: "Kognitif" },
    { title: "Cilukba", detail: "Main cilukba untuk melatih object permanence & tawa.", domain: "Sosial-Emosional" },
    { title: "Kenalkan suara alam", detail: "Dengarkan suara burung, air mengalir, atau musik klasik pelan — memperkaya peta sensorik otaknya.", domain: "Sensorik" },
    { title: "Latih duduk bersandar", detail: "Dudukkan ia bersandar di bantal berbentuk U agar otot punggung mulai terlatih.", domain: "Motorik Kasar" },
    { title: "Eksplorasi tekstur aman", detail: "Biarkan tangannya menyentuh kain lembut, karet teether, atau permukaan berbeda — merangsang jalur sensorik.", domain: "Sensorik" },
  ],
  "6-9": [
    { title: "Pindah tangan", detail: "Beri benda aman, biarkan ia memindahkannya antar tangan.", domain: "Motorik Halus" },
    { title: "Tirukan suku kata", detail: "Ulangi 'ba-ba', 'da-da' bergantian dengannya.", domain: "Bahasa & Komunikasi" },
    { title: "Sembunyikan mainan", detail: "Tutup sebagian mainan dengan kain, ajak ia mencarinya.", domain: "Kognitif" },
    { title: "Latih melambai 'dadah'", detail: "Setiap kali ada yang datang/pergi, pegang tangannya dan lambaikan — gerakan sosial ini akan ia tiru sendiri.", domain: "Sosial-Emosional" },
    { title: "Sebut nama benda di sekitar", detail: "Tunjuk sendok, gelas, buku, dan sebut namanya berulang — kosakata pasif mulai terbentuk di usia ini.", domain: "Bahasa & Komunikasi" },
    { title: "Dorong merangkak dengan mainan", detail: "Letakkan mainan favoritnya selangkah lebih jauh agar ia termotivasi bergerak maju.", domain: "Motorik Kasar" },
  ],
  "9-12": [
    { title: "Latih jepitan jari", detail: "Sediakan potongan makanan lunak untuk dijepit ibu jari & telunjuk.", domain: "Motorik Halus" },
    { title: "Tunjuk & sebut", detail: "Tunjuk benda di sekitar dan sebut namanya berulang.", domain: "Bahasa & Komunikasi" },
    { title: "Dadah & tepuk tangan", detail: "Latih melambai 'dadah' dan tepuk tangan bersama.", domain: "Sosial-Emosional" },
    { title: "Masukkan kubus ke kotak", detail: "Beri kotak berlubang dan balok kecil — melatih koordinasi tangan-mata dan konsep 'masuk/keluar'.", domain: "Kognitif" },
    { title: "Buku warna & bentuk", detail: "Tunjukkan buku interaktif dengan warna cerah dan teks singkat — anak usia ini menyerap lebih dari yang tampak.", domain: "Kognitif" },
    { title: "Latih naik-turun aman", detail: "Bantu ia naik dan turun dari sofa pendek atau bantal susun — melatih keberanian dan kesadaran tubuh.", domain: "Motorik Kasar" },
  ],
  "12-18": [
    { title: "Tumpuk 2 balok", detail: "Ajak menumpuk dua balok bersama, beri tepuk tangan.", domain: "Motorik Halus" },
    { title: "Buku bergambar", detail: "Baca buku 1 kata/halaman, minta ia menunjuk gambar.", domain: "Bahasa & Komunikasi" },
    { title: "Jalan di tekstur", detail: "Ajak berjalan di rumput/pasir sambil dipegangi.", domain: "Motorik Kasar" },
    { title: "Mencoret dengan krayon besar", detail: "Sediakan kertas A4 dan krayon tebal — biarkan ia mencoret bebas untuk melatih genggaman dan kreativitas awal.", domain: "Motorik Halus" },
    { title: "Tuang-menuang saat mandi", detail: "Berikan cangkir dan ember kecil saat mandi — bermain tuang air melatih koordinasi dan sebab-akibat.", domain: "Kognitif" },
    { title: "Puzzle 2–3 keping", detail: "Kenalkan puzzle kayu sederhana berbentuk lingkaran atau persegi — membangun kesabaran dan problem-solving.", domain: "Kognitif" },
  ],
  "18-24": [
    { title: "Coret bebas", detail: "Beri krayon besar & kertas, biarkan ia mencoret sesuka hati.", domain: "Motorik Halus" },
    { title: "Sambung dua kata", detail: "Contohkan frasa 'mau susu?', beri jeda agar ia menirukan.", domain: "Bahasa & Komunikasi" },
    { title: "Bantu beres mainan", detail: "Ajak memasukkan mainan ke kotak sambil bernyanyi.", domain: "Sosial-Emosional" },
    { title: "Sortir warna bersama", detail: "Kelompokkan mainan atau baju berdasarkan warna merah, biru, kuning — dasar klasifikasi kognitif.", domain: "Kognitif" },
    { title: "Cerita bergambar interaktif", detail: "Bacakan buku bergambar dan minta ia menunjuk karakter atau benda yang disebutkan.", domain: "Bahasa & Komunikasi" },
    { title: "Main masak-masakan", detail: "Gunakan mainan dapur atau peralatan aman — bermain peran memacu imajinasi dan keterampilan sosial.", domain: "Sosial-Emosional" },
  ],
  "24-36": [
    { title: "Lompat dua kaki", detail: "Main lompat di tempat dengan kedua kaki.", domain: "Motorik Kasar" },
    { title: "Tunjuk bagian tubuh", detail: "Tanya 'mana hidung?' dan tunjuk bersama.", domain: "Kognitif" },
    { title: "Main pura-pura", detail: "Pura-pura menyuapi boneka untuk melatih imajinasi.", domain: "Sosial-Emosional" },
    { title: "Berhitung benda nyata", detail: "Hitung buah, mainan, atau sendok 1–3 sambil menyentuhnya — menghubungkan angka dengan jumlah konkrit.", domain: "Kognitif" },
    { title: "Bermain plastisin / playdough", detail: "Uleni, pipihkan, dan bentuk playdough — sangat baik untuk motorik halus dan ekspresi kreatif.", domain: "Motorik Halus" },
    { title: "Latih berpakaian sendiri", detail: "Ajak melepas dan memakai kaos tanpa kancing — membangun kemandirian dan koordinasi.", domain: "Sosial-Emosional" },
  ],
  "36-48": [
    { title: "Gambar lingkaran", detail: "Contohkan menggambar lingkaran, minta ia meniru.", domain: "Motorik Halus" },
    { title: "Cerita giliran", detail: "Tanya 'tadi main apa?' dan dengarkan ceritanya.", domain: "Bahasa & Komunikasi" },
    { title: "Warna & berhitung", detail: "Hitung mainan 1–5 dan sebut warnanya sambil bermain.", domain: "Kognitif" },
    { title: "Eksperimen warna air", detail: "Campur air dengan pewarna makanan di gelas — amati hasilnya bersama, ajukan pertanyaan 'kenapa jadi hijau?'", domain: "Kognitif" },
    { title: "Buku cerita buatan sendiri", detail: "Buat buku kecil dari kertas lipat, isi bersama dengan gambar & cerita si Kecil — memperkuat narasi.", domain: "Bahasa & Komunikasi" },
    { title: "Origami sederhana", detail: "Lipat kertas jadi dua, empat, atau bentuk sederhana seperti kapal — melatih presisi dan mengikuti instruksi.", domain: "Motorik Halus" },
  ],
  "48-60": [
    { title: "Lompat satu kaki", detail: "Main engklek sederhana, lompat dengan satu kaki.", domain: "Motorik Kasar" },
    { title: "Gambar orang", detail: "Minta menggambar 'ayah/ibu' dengan kepala & badan.", domain: "Motorik Halus" },
    { title: "Cerita berurutan", detail: "Minta ia menceritakan kegiatan tadi secara urut.", domain: "Bahasa & Komunikasi" },
    { title: "Teka-teki huruf awal", detail: "Buat kartu bergambar, tanya 'kata ini mulai dengan huruf apa?' — fondasi literasi sebelum belajar membaca.", domain: "Kognitif" },
    { title: "Bantu memasak sederhana", detail: "Libatkan dalam mengaduk adonan, menakar bahan, atau menghias kue — melatih matematika dan tanggung jawab.", domain: "Kognitif" },
    { title: "Permainan kata tebak-tebakan", detail: "Deskripsikan benda tanpa menyebut namanya, minta ia menebak — merangsang kemampuan berpikir abstrak.", domain: "Bahasa & Komunikasi" },
  ],
  "60-72": [
    { title: "Tulis nama", detail: "Latih menyalin huruf-huruf namanya sendiri.", domain: "Motorik Halus" },
    { title: "Tebak huruf", detail: "Tebak huruf awal dari nama benda di rumah.", domain: "Kognitif" },
    { title: "Keseimbangan", detail: "Lomba berdiri satu kaki, hitung sampai 6 detik.", domain: "Motorik Kasar" },
    { title: "Jurnal bergambar anak", detail: "Ajak menggambar atau menulis kejadian hari ini di buku khusus — membangun kebiasaan refleksi dini.", domain: "Bahasa & Komunikasi" },
    { title: "Berhitung sambil bermain belanja", detail: "Bermain peran jual-beli dengan koin mainan — belajar penjumlahan dasar dalam konteks nyata yang menyenangkan.", domain: "Kognitif" },
    { title: "Membaca bersama nyaring", detail: "Bergantian membaca kata-kata sederhana dari buku bergambar — tunjukkan kata sambil membaca untuk menghubungkan tulisan & makna.", domain: "Kognitif" },
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
