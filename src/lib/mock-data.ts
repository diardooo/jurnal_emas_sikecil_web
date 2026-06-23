import type {
  AgePhaseId,
  AppNotification,
  Child,
  Goal,
  GrowthRecord,
  Habit,
  Immunization,
  Milestone,
  SleepLog,
  Task,
  ToothRecord,
  TodoItem,
} from "./types";

/** Deterministic pseudo-random history generator (avoids hydration mismatch). */
function genHistory(seed: number, density: number): boolean[] {
  const arr: boolean[] = [];
  let x = seed;
  for (let i = 0; i < 84; i++) {
    x = (x * 9301 + 49297) % 233280;
    arr.push(x / 233280 < density);
  }
  return arr;
}

export const mockChildren: Child[] = [
  {
    id: "c1",
    name: "Bintang",
    dob: "2025-09-10",
    gender: "L",
    photoUrl: "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Bintang",
    birthWeight: 3.2,
    birthHeight: 49,
    color: "#C9A227",
  },
  {
    id: "c2",
    name: "Sania",
    dob: "2022-03-22",
    gender: "P",
    photoUrl: "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Sania",
    birthWeight: 3.0,
    birthHeight: 48,
    color: "#7BA05B",
  },
];

export const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Jadwal imunisasi DPT-HB-Hib lanjutan",
    description: "Booking ke Puskesmas Kelurahan, bawa buku KIA.",
    priority: "tinggi",
    category: "Kesehatan Anak",
    dueDate: "2026-06-22",
    status: "todo",
    childId: "c1",
  },
  {
    id: "t2",
    title: "Beli bahan MPASI minggu ini",
    description: "Alpukat, ubi, ayam kampung, brokoli.",
    priority: "sedang",
    category: "Nutrisi",
    dueDate: "2026-06-20",
    status: "progress",
    childId: "c1",
  },
  {
    id: "t3",
    title: "Sesi tummy time pagi",
    priority: "rendah",
    category: "Stimulasi",
    dueDate: "2026-06-19",
    status: "done",
    childId: "c1",
    isRecurring: true,
  },
  {
    id: "t4",
    title: "Daftar ulang PAUD Sania",
    description: "Lengkapi formulir + fotokopi KK.",
    priority: "tinggi",
    category: "Administrasi",
    dueDate: "2026-06-25",
    status: "todo",
    childId: "c2",
  },
  {
    id: "t5",
    title: "Baca buku cerita bergambar",
    priority: "sedang",
    category: "Stimulasi",
    dueDate: "2026-06-19",
    status: "progress",
    childId: "c2",
    isRecurring: true,
  },
  {
    id: "t6",
    title: "Kontrol gigi pertama Sania",
    priority: "sedang",
    category: "Kesehatan Anak",
    dueDate: "2026-07-01",
    status: "todo",
    childId: "c2",
  },
  {
    id: "t7",
    title: "Timbang berat & ukur tinggi badan",
    priority: "rendah",
    category: "Kesehatan Anak",
    dueDate: "2026-06-18",
    status: "done",
    childId: "c1",
  },
];

export const mockTodos: TodoItem[] = [
  { id: "d1", title: "Berjemur pagi 15 menit", category: "Rutinitas Pagi", done: true, childId: "c1" },
  { id: "d2", title: "ASI / susu pagi", category: "Rutinitas Pagi", done: true, childId: "c1" },
  { id: "d3", title: "Stimulasi suara & ekspresi wajah", category: "Siang", done: false, childId: "c1" },
  { id: "d4", title: "MPASI siang (puree)", category: "Siang", done: false, childId: "c1" },
  { id: "d5", title: "Pijat bayi sebelum tidur", category: "Malam", done: false, childId: "c1" },
  { id: "d6", title: "Bacakan dongeng 10 menit", category: "Malam", done: false, childId: "c1" },
  { id: "d7", title: "Cek jadwal posyandu bulan ini", category: "Jadwal Anak", done: false, childId: "c1" },
  { id: "d8", title: "Sikat gigi pagi mandiri", category: "Rutinitas Pagi", done: true, childId: "c2" },
  { id: "d9", title: "Latihan menggambar bentuk", category: "Siang", done: false, childId: "c2" },
];

export const mockHabits: Habit[] = [
  {
    id: "h1",
    name: "Bacakan buku 15 menit",
    description: "Membangun kosakata & ikatan emosional.",
    category: "Stimulasi Harian",
    targetPerWeek: 7,
    streak: 12,
    reminderTime: "19:30",
    history: genHistory(7, 0.82),
    childId: "c1",
  },
  {
    id: "h2",
    name: "Tummy time 3x sehari",
    category: "Stimulasi Harian",
    targetPerWeek: 7,
    streak: 5,
    reminderTime: "08:00",
    history: genHistory(13, 0.7),
    childId: "c1",
  },
  {
    id: "h3",
    name: "MPASI sayur & protein",
    category: "Nutrisi Anak",
    targetPerWeek: 7,
    streak: 9,
    reminderTime: "12:00",
    history: genHistory(21, 0.9),
    childId: "c1",
  },
  {
    id: "h4",
    name: "Rutinitas tidur jam 20.00",
    category: "Rutinitas Tidur",
    targetPerWeek: 7,
    streak: 3,
    reminderTime: "20:00",
    history: genHistory(33, 0.6),
    childId: "c2",
  },
  {
    id: "h5",
    name: "Olahraga orang tua 20 menit",
    category: "Perkembangan Orang Tua",
    targetPerWeek: 4,
    streak: 2,
    reminderTime: "06:00",
    history: genHistory(41, 0.5),
  },
];

/** Age phases per IDAI/KPSP checkpoints, used to group milestones. */
export const agePhases: {
  id: AgePhaseId;
  label: string;
  minM: number;
  maxM: number;
}[] = [
  { id: "0-3", label: "0–3 bulan", minM: 0, maxM: 3 },
  { id: "3-6", label: "3–6 bulan", minM: 3, maxM: 6 },
  { id: "6-9", label: "6–9 bulan", minM: 6, maxM: 9 },
  { id: "9-12", label: "9–12 bulan", minM: 9, maxM: 12 },
  { id: "12-18", label: "12–18 bulan", minM: 12, maxM: 18 },
  { id: "18-24", label: "18–24 bulan", minM: 18, maxM: 24 },
  { id: "24-36", label: "2–3 tahun", minM: 24, maxM: 36 },
  { id: "36-48", label: "3–4 tahun", minM: 36, maxM: 48 },
  { id: "48-60", label: "4–5 tahun", minM: 48, maxM: 60 },
  { id: "60-72", label: "5–6 tahun", minM: 60, maxM: 72 },
];

export function phaseOf(ageMinMonths: number): AgePhaseId {
  const p = agePhases.find(
    (ph) => ageMinMonths >= ph.minM && ageMinMonths < ph.maxM,
  );
  return (p?.id ?? "60-72") as AgePhaseId;
}

/** Milestone database 0–6 tahun, mengacu WHO Motor Milestones, Denver II & KPSP/IDAI.
 *  Status di sini mencerminkan progres anak aktif (Bintang ~9 bln) untuk demo. */
export const mockMilestones: Milestone[] = [
  // 0–3 bulan
  { id: "m01", title: "Mengangkat kepala saat tengkurap", description: "Mengangkat kepala sebentar ketika diposisikan tengkurap.", domain: "Motorik Kasar", ageMinMonths: 1, ageMaxMonths: 3, isCritical: true, status: "bisa", achievedAt: "2025-11-05" },
  { id: "m02", title: "Menggenggam refleks", description: "Tangan menggenggam benda yang menyentuh telapak.", domain: "Motorik Halus", ageMinMonths: 0, ageMaxMonths: 2, isCritical: false, status: "bisa", achievedAt: "2025-09-20" },
  { id: "m03", title: "Menatap wajah & mengikuti gerak", description: "Memandang wajah dan mengikuti objek bergerak dengan mata.", domain: "Kognitif", ageMinMonths: 1, ageMaxMonths: 3, isCritical: false, status: "bisa", achievedAt: "2025-11-10" },
  { id: "m04", title: "Bersuara 'ooh/aah' (cooing)", description: "Mengeluarkan suara vokal selain menangis.", domain: "Bahasa & Komunikasi", ageMinMonths: 1, ageMaxMonths: 3, isCritical: false, status: "bisa", achievedAt: "2025-11-25" },
  { id: "m05", title: "Senyum sosial", description: "Tersenyum sebagai respons terhadap interaksi.", domain: "Sosial-Emosional", ageMinMonths: 1, ageMaxMonths: 3, isCritical: true, status: "bisa", achievedAt: "2025-11-30" },
  { id: "m06", title: "Menoleh ke arah suara", description: "Bereaksi dan menoleh ke sumber bunyi.", domain: "Sensorik", ageMinMonths: 0, ageMaxMonths: 3, isCritical: false, status: "bisa", achievedAt: "2025-10-15" },

  // 3–6 bulan
  { id: "m07", title: "Tengkurap & mendongak 90°", description: "Mengangkat kepala dan dada bertumpu pada lengan.", domain: "Motorik Kasar", ageMinMonths: 3, ageMaxMonths: 6, isCritical: true, status: "bisa", achievedAt: "2025-12-20" },
  { id: "m08", title: "Berguling", description: "Berguling dari telentang ke tengkurap dan sebaliknya.", domain: "Motorik Kasar", ageMinMonths: 4, ageMaxMonths: 6, isCritical: false, status: "bisa", achievedAt: "2026-01-30" },
  { id: "m09", title: "Meraih & menggenggam mainan", description: "Mengulurkan tangan dan menggenggam benda dengan sengaja.", domain: "Motorik Halus", ageMinMonths: 3, ageMaxMonths: 6, isCritical: false, status: "bisa", achievedAt: "2026-02-05" },
  { id: "m10", title: "Tertawa keras", description: "Tertawa lepas saat diajak bermain.", domain: "Bahasa & Komunikasi", ageMinMonths: 3, ageMaxMonths: 6, isCritical: false, status: "bisa", achievedAt: "2026-01-15" },
  { id: "m11", title: "Mengenali wajah familiar", description: "Menunjukkan respons berbeda pada orang yang dikenal.", domain: "Kognitif", ageMinMonths: 4, ageMaxMonths: 6, isCritical: false, status: "bisa", achievedAt: "2026-02-10" },
  { id: "m12", title: "Merespons tekstur berbeda", description: "Tertarik menyentuh dan merasakan berbagai tekstur.", domain: "Sensorik", ageMinMonths: 4, ageMaxMonths: 6, isCritical: false, status: "bisa", achievedAt: "2026-02-20" },
  { id: "m13", title: "Siap MPASI", description: "Refleks menjulurkan lidah berkurang, tertarik pada makanan.", domain: "Nutrisi & Pertumbuhan", ageMinMonths: 4, ageMaxMonths: 6, isCritical: true, status: "bisa", achievedAt: "2026-03-15", hasPhoto: true },

  // 6–9 bulan
  { id: "m14", title: "Duduk tanpa bantuan", description: "Duduk stabil tanpa disangga beberapa menit.", domain: "Motorik Kasar", ageMinMonths: 6, ageMaxMonths: 9, isCritical: true, status: "dicoba" },
  { id: "m15", title: "Memindahkan benda antar tangan", description: "Memindahkan mainan dari satu tangan ke tangan lain.", domain: "Motorik Halus", ageMinMonths: 6, ageMaxMonths: 9, isCritical: false, status: "bisa", achievedAt: "2026-04-10", hasPhoto: true },
  { id: "m16", title: "Mengoceh konsonan (ba-ba, da-da)", description: "Mengeluarkan suara berulang dengan konsonan.", domain: "Bahasa & Komunikasi", ageMinMonths: 6, ageMaxMonths: 9, isCritical: true, status: "bisa", achievedAt: "2026-03-05", note: "Sering bilang 'dadada' saat melihat ayah." },
  { id: "m17", title: "Mencari benda disembunyikan", description: "Mulai memahami objek tetap ada walau tak terlihat.", domain: "Kognitif", ageMinMonths: 6, ageMaxMonths: 9, isCritical: false, status: "dicoba" },
  { id: "m18", title: "Cemas terhadap orang asing", description: "Menunjukkan kewaspadaan pada orang baru.", domain: "Sosial-Emosional", ageMinMonths: 7, ageMaxMonths: 9, isCritical: false, status: "dicoba" },
  { id: "m19", title: "Makan finger food", description: "Memegang dan memakan potongan makanan lunak sendiri.", domain: "Nutrisi & Pertumbuhan", ageMinMonths: 7, ageMaxMonths: 9, isCritical: false, status: "dicoba" },

  // 9–12 bulan
  { id: "m20", title: "Merangkak", description: "Bergerak maju dengan tangan dan lutut.", domain: "Motorik Kasar", ageMinMonths: 9, ageMaxMonths: 12, isCritical: true, status: "dicoba" },
  { id: "m21", title: "Berdiri berpegangan", description: "Menarik badan untuk berdiri sambil berpegangan.", domain: "Motorik Kasar", ageMinMonths: 9, ageMaxMonths: 12, isCritical: false, status: "belum" },
  { id: "m22", title: "Menjepit benda kecil (pincer grasp)", description: "Mengambil benda kecil dengan ibu jari & telunjuk.", domain: "Motorik Halus", ageMinMonths: 9, ageMaxMonths: 12, isCritical: false, status: "dicoba" },
  { id: "m23", title: "Mengucap 'mama/papa' bermakna", description: "Menggunakan kata pertama dengan arti.", domain: "Bahasa & Komunikasi", ageMinMonths: 10, ageMaxMonths: 12, isCritical: true, status: "belum" },
  { id: "m24", title: "Melambai & tepuk tangan", description: "Meniru gerakan sosial seperti dadah dan tepuk tangan.", domain: "Sosial-Emosional", ageMinMonths: 9, ageMaxMonths: 12, isCritical: false, status: "belum" },

  // 12–18 bulan
  { id: "m25", title: "Berjalan sendiri", description: "Melangkah beberapa langkah tanpa bantuan.", domain: "Motorik Kasar", ageMinMonths: 12, ageMaxMonths: 18, isCritical: true, status: "belum" },
  { id: "m26", title: "Menumpuk 2 balok", description: "Menyusun dua balok ke atas.", domain: "Motorik Halus", ageMinMonths: 12, ageMaxMonths: 18, isCritical: false, status: "belum" },
  { id: "m27", title: "Mengucap 3–6 kata", description: "Kosakata bertambah beberapa kata bermakna.", domain: "Bahasa & Komunikasi", ageMinMonths: 12, ageMaxMonths: 18, isCritical: true, status: "belum" },
  { id: "m28", title: "Menunjuk yang diinginkan", description: "Menggunakan jari menunjuk untuk berkomunikasi.", domain: "Kognitif", ageMinMonths: 12, ageMaxMonths: 18, isCritical: false, status: "belum" },
  { id: "m29", title: "Minum dari gelas", description: "Minum dari gelas dengan sedikit bantuan.", domain: "Nutrisi & Pertumbuhan", ageMinMonths: 12, ageMaxMonths: 18, isCritical: false, status: "belum" },

  // 18–24 bulan
  { id: "m30", title: "Berlari & naik tangga", description: "Berlari dan menaiki tangga dengan berpegangan.", domain: "Motorik Kasar", ageMinMonths: 18, ageMaxMonths: 24, isCritical: false, status: "belum" },
  { id: "m31", title: "Mencoret-coret", description: "Memegang krayon dan membuat coretan.", domain: "Motorik Halus", ageMinMonths: 18, ageMaxMonths: 24, isCritical: false, status: "belum" },
  { id: "m32", title: "Merangkai 2 kata", description: "Menggabungkan dua kata, mis. 'mau susu'.", domain: "Bahasa & Komunikasi", ageMinMonths: 18, ageMaxMonths: 24, isCritical: true, status: "belum" },
  { id: "m33", title: "Bermain pura-pura", description: "Meniru aktivitas sehari-hari dalam permainan.", domain: "Sosial-Emosional", ageMinMonths: 18, ageMaxMonths: 24, isCritical: false, status: "belum" },

  // 2–3 tahun
  { id: "m34", title: "Melompat dengan dua kaki", description: "Melompat di tempat dengan kedua kaki.", domain: "Motorik Kasar", ageMinMonths: 24, ageMaxMonths: 36, isCritical: false, status: "belum" },
  { id: "m35", title: "Menyusun 6 balok", description: "Membangun menara dari beberapa balok.", domain: "Motorik Halus", ageMinMonths: 24, ageMaxMonths: 36, isCritical: false, status: "belum" },
  { id: "m36", title: "Kalimat 3 kata", description: "Berbicara dalam kalimat pendek 3 kata.", domain: "Bahasa & Komunikasi", ageMinMonths: 24, ageMaxMonths: 36, isCritical: true, status: "belum" },
  { id: "m37", title: "Mengenal bagian tubuh", description: "Menunjuk minimal 6 bagian tubuh saat diminta.", domain: "Kognitif", ageMinMonths: 24, ageMaxMonths: 36, isCritical: false, status: "belum" },
  { id: "m38", title: "Mulai toilet training", description: "Memberi tahu saat ingin BAK/BAB.", domain: "Sosial-Emosional", ageMinMonths: 24, ageMaxMonths: 36, isCritical: false, status: "belum" },

  // 3–4 tahun
  { id: "m39", title: "Mengayuh sepeda roda tiga", description: "Mengendarai sepeda roda tiga.", domain: "Motorik Kasar", ageMinMonths: 36, ageMaxMonths: 48, isCritical: false, status: "belum" },
  { id: "m40", title: "Menggambar lingkaran", description: "Meniru gambar lingkaran.", domain: "Motorik Halus", ageMinMonths: 36, ageMaxMonths: 48, isCritical: false, status: "belum" },
  { id: "m41", title: "Bicara dipahami orang lain", description: "Ucapan dapat dimengerti oleh orang asing.", domain: "Bahasa & Komunikasi", ageMinMonths: 36, ageMaxMonths: 48, isCritical: true, status: "belum" },
  { id: "m42", title: "Bermain bergiliran", description: "Bermain bersama teman dengan bergiliran.", domain: "Sosial-Emosional", ageMinMonths: 36, ageMaxMonths: 48, isCritical: false, status: "belum" },

  // 4–5 tahun
  { id: "m43", title: "Melompat dengan satu kaki", description: "Berdiri & melompat dengan satu kaki.", domain: "Motorik Kasar", ageMinMonths: 48, ageMaxMonths: 60, isCritical: false, status: "belum" },
  { id: "m44", title: "Menggambar orang (3 bagian)", description: "Menggambar manusia dengan beberapa bagian tubuh.", domain: "Motorik Halus", ageMinMonths: 48, ageMaxMonths: 60, isCritical: false, status: "belum" },
  { id: "m45", title: "Bercerita sederhana", description: "Menceritakan kejadian dengan urutan.", domain: "Bahasa & Komunikasi", ageMinMonths: 48, ageMaxMonths: 60, isCritical: false, status: "belum" },
  { id: "m46", title: "Mengenal warna & angka", description: "Menyebut beberapa warna dan berhitung 1–10.", domain: "Kognitif", ageMinMonths: 48, ageMaxMonths: 60, isCritical: false, status: "belum" },

  // 5–6 tahun
  { id: "m47", title: "Berdiri 1 kaki ≥6 detik", description: "Menjaga keseimbangan satu kaki cukup lama.", domain: "Motorik Kasar", ageMinMonths: 60, ageMaxMonths: 72, isCritical: false, status: "belum" },
  { id: "m48", title: "Menulis namanya", description: "Menyalin/menulis huruf namanya.", domain: "Motorik Halus", ageMinMonths: 60, ageMaxMonths: 72, isCritical: false, status: "belum" },
  { id: "m49", title: "Mengenal huruf A–Z", description: "Mengenali sebagian besar huruf.", domain: "Kognitif", ageMinMonths: 60, ageMaxMonths: 72, isCritical: true, status: "belum" },
  { id: "m50", title: "Memakai baju sendiri", description: "Berpakaian mandiri termasuk kancing.", domain: "Sosial-Emosional", ageMinMonths: 60, ageMaxMonths: 72, isCritical: false, status: "belum" },
];

export const mockSleepLogs: Record<string, SleepLog[]> = {
  c1: [
    { id: "s1", date: "2026-06-15", nightHours: 10, napHours: 3.5, childId: "c1" },
    { id: "s2", date: "2026-06-16", nightHours: 9.5, napHours: 4, childId: "c1" },
    { id: "s3", date: "2026-06-17", nightHours: 10.5, napHours: 3, childId: "c1" },
    { id: "s4", date: "2026-06-18", nightHours: 11, napHours: 2.5, childId: "c1" },
  ],
  c2: [
    { id: "s5", date: "2026-06-17", nightHours: 9, napHours: 2, childId: "c2" },
    { id: "s6", date: "2026-06-18", nightHours: 9.5, napHours: 1.5, childId: "c2" },
  ],
};

export const mockGoals: Goal[] = [
  {
    id: "g1",
    title: "Lancar makan finger food",
    description: "Bintang mampu makan sendiri makanan potongan kecil.",
    domain: "Nutrisi & Pertumbuhan",
    progress: 60,
    targetDate: "2026-08-01",
    subGoals: [
      { id: "g1s1", title: "Kenalkan 5 jenis finger food", done: true },
      { id: "g1s2", title: "Bisa menggenggam makanan", done: true },
      { id: "g1s3", title: "Mengunyah tanpa tersedak", done: false },
      { id: "g1s4", title: "Makan mandiri 1 porsi penuh", done: false },
    ],
  },
  {
    id: "g2",
    title: "Baca 1 buku parenting / bulan",
    description: "Goal pribadi orang tua untuk meningkatkan wawasan.",
    domain: "Perkembangan Orang Tua",
    progress: 50,
    targetDate: "2026-12-31",
    subGoals: [
      { id: "g2s1", title: "Bulan Juni: 'Montessori di Rumah'", done: true },
      { id: "g2s2", title: "Bulan Juli", done: false },
    ],
  },
  {
    id: "g3",
    title: "Sania siap masuk SD",
    description: "Persiapan kognitif & kemandirian menjelang sekolah.",
    domain: "Kognitif",
    progress: 35,
    targetDate: "2027-07-01",
    subGoals: [
      { id: "g3s1", title: "Mengenal huruf A-Z", done: true },
      { id: "g3s2", title: "Berhitung 1-20", done: false },
      { id: "g3s3", title: "Memakai baju sendiri", done: true },
      { id: "g3s4", title: "Fokus aktivitas 15 menit", done: false },
    ],
  },
];

export const mockGrowth: Record<string, GrowthRecord[]> = {
  c1: [
    { ageMonths: 0, weight: 3.2, height: 49, headCirc: 34.5 },
    { ageMonths: 1, weight: 4.3, height: 53, headCirc: 37.0 },
    { ageMonths: 2, weight: 5.4, height: 57, headCirc: 39.0 },
    { ageMonths: 3, weight: 6.2, height: 60, headCirc: 40.5 },
    { ageMonths: 4, weight: 6.9, height: 62, headCirc: 41.5 },
    { ageMonths: 5, weight: 7.4, height: 64, headCirc: 42.3 },
    { ageMonths: 6, weight: 7.9, height: 66, headCirc: 43.2 },
    { ageMonths: 7, weight: 8.3, height: 68, headCirc: 43.8 },
    { ageMonths: 8, weight: 8.6, height: 69, headCirc: 44.3 },
    { ageMonths: 9, weight: 8.9, height: 71, headCirc: 44.8 },
  ],
  c2: [
    { ageMonths: 12, weight: 9.6, height: 75, headCirc: 46.0 },
    { ageMonths: 18, weight: 11.0, height: 82, headCirc: 47.2 },
    { ageMonths: 24, weight: 12.2, height: 87, headCirc: 48.0 },
    { ageMonths: 30, weight: 13.3, height: 91, headCirc: 48.6 },
    { ageMonths: 36, weight: 14.3, height: 96, headCirc: 49.1 },
    { ageMonths: 42, weight: 15.4, height: 100, headCirc: 49.5 },
    { ageMonths: 48, weight: 16.5, height: 104, headCirc: 49.8 },
  ],
};

/** Approximate WHO reference bands (p3 / median / p97) by age in months.
 *  Used to draw the "rentang normal WHO" area on growth charts. */
export const whoReference = {
  weight: [
    { ageMonths: 0, p3: 2.5, p50: 3.3, p97: 4.4 },
    { ageMonths: 3, p3: 5.0, p50: 6.4, p97: 8.0 },
    { ageMonths: 6, p3: 6.4, p50: 7.9, p97: 9.8 },
    { ageMonths: 9, p3: 7.1, p50: 8.9, p97: 11.0 },
    { ageMonths: 12, p3: 7.7, p50: 9.6, p97: 12.0 },
    { ageMonths: 18, p3: 8.8, p50: 10.9, p97: 13.7 },
    { ageMonths: 24, p3: 9.7, p50: 12.2, p97: 15.3 },
    { ageMonths: 36, p3: 11.3, p50: 14.3, p97: 18.3 },
    { ageMonths: 48, p3: 12.7, p50: 16.3, p97: 21.2 },
    { ageMonths: 60, p3: 14.1, p50: 18.3, p97: 24.2 },
  ],
  height: [
    { ageMonths: 0, p3: 46.1, p50: 49.9, p97: 53.7 },
    { ageMonths: 3, p3: 57.3, p50: 61.4, p97: 65.5 },
    { ageMonths: 6, p3: 63.3, p50: 67.6, p97: 71.9 },
    { ageMonths: 9, p3: 67.5, p50: 72.0, p97: 76.5 },
    { ageMonths: 12, p3: 71.0, p50: 75.7, p97: 80.5 },
    { ageMonths: 18, p3: 76.9, p50: 82.3, p97: 87.7 },
    { ageMonths: 24, p3: 81.7, p50: 87.8, p97: 93.9 },
    { ageMonths: 36, p3: 88.7, p50: 96.1, p97: 103.5 },
    { ageMonths: 48, p3: 94.9, p50: 103.3, p97: 111.7 },
    { ageMonths: 60, p3: 100.7, p50: 110.0, p97: 119.2 },
  ],
  headCirc: [
    { ageMonths: 0, p3: 32.1, p50: 34.5, p97: 36.9 },
    { ageMonths: 3, p3: 38.1, p50: 40.5, p97: 42.9 },
    { ageMonths: 6, p3: 41.0, p50: 43.3, p97: 45.6 },
    { ageMonths: 9, p3: 42.7, p50: 45.0, p97: 47.3 },
    { ageMonths: 12, p3: 43.8, p50: 46.1, p97: 48.4 },
    { ageMonths: 24, p3: 45.7, p50: 48.0, p97: 50.3 },
    { ageMonths: 36, p3: 46.9, p50: 49.1, p97: 51.4 },
    { ageMonths: 48, p3: 47.6, p50: 49.8, p97: 52.1 },
    { ageMonths: 60, p3: 48.1, p50: 50.4, p97: 52.7 },
  ],
} as const;

/** IDAI-style immunization schedule (per child, demo data). */
export const mockImmunizations: Record<string, Immunization[]> = {
  c1: [
    { id: "i1", vaccine: "Hepatitis B (HB-0)", ageLabel: "0 bulan", ageMonths: 0, status: "selesai", date: "2025-09-11" },
    { id: "i2", vaccine: "BCG & Polio 1 (OPV)", ageLabel: "1 bulan", ageMonths: 1, status: "selesai", date: "2025-10-12" },
    { id: "i3", vaccine: "DPT-HB-Hib 1, Polio 2 & PCV 1", ageLabel: "2 bulan", ageMonths: 2, status: "selesai", date: "2025-11-14" },
    { id: "i9", vaccine: "Rotavirus 1", ageLabel: "2 bulan", ageMonths: 2, status: "selesai", date: "2025-11-14" },
    { id: "i4", vaccine: "DPT-HB-Hib 2, Polio 3 & PCV 2", ageLabel: "3 bulan", ageMonths: 3, status: "selesai", date: "2025-12-13" },
    { id: "i5", vaccine: "DPT-HB-Hib 3, Polio 4 (IPV) & Rotavirus 2", ageLabel: "4 bulan", ageMonths: 4, status: "selesai", date: "2026-01-15" },
    { id: "i10", vaccine: "PCV 3", ageLabel: "6 bulan", ageMonths: 6, status: "selesai", date: "2026-03-14" },
    { id: "i11", vaccine: "Influenza (tahunan)", ageLabel: "6 bulan", ageMonths: 6, status: "selesai", date: "2026-03-14" },
    { id: "i6", vaccine: "Campak Rubella (MR 1)", ageLabel: "9 bulan", ageMonths: 9, status: "dijadwalkan", date: "2026-06-22" },
    { id: "i12", vaccine: "Japanese Encephalitis (JE)", ageLabel: "10 bulan", ageMonths: 10, status: "akan-datang" },
    { id: "i7", vaccine: "DPT-HB-Hib 4 & Polio 5 (lanjutan)", ageLabel: "18 bulan", ageMonths: 18, status: "akan-datang" },
    { id: "i8", vaccine: "Campak Rubella (MR 2)", ageLabel: "18 bulan", ageMonths: 18, status: "akan-datang" },
    { id: "i13", vaccine: "Hepatitis A (2 dosis)", ageLabel: "24 bulan", ageMonths: 24, status: "akan-datang" },
    { id: "i14", vaccine: "Varisela (cacar air)", ageLabel: "24 bulan", ageMonths: 24, status: "akan-datang" },
  ],
  c2: [
    { id: "j1", vaccine: "DPT-HB-Hib lanjutan", ageLabel: "18 bulan", ageMonths: 18, status: "selesai", date: "2023-09-25" },
    { id: "j2", vaccine: "Campak Rubella (MR 2)", ageLabel: "18 bulan", ageMonths: 18, status: "selesai", date: "2023-09-25" },
    { id: "j3", vaccine: "DPT & Polio booster", ageLabel: "5 tahun", ageMonths: 60, status: "akan-datang" },
  ],
};

/** Primary teeth (gigi susu) eruption tracking. */
export const mockTeeth: Record<string, ToothRecord[]> = {
  c1: [
    { id: "g1", name: "Gigi seri tengah bawah", typicalAgeLabel: "6–10 bln", erupted: true, date: "2026-04-02" },
    { id: "g2", name: "Gigi seri tengah atas", typicalAgeLabel: "8–12 bln", erupted: false },
    { id: "g3", name: "Gigi seri samping atas", typicalAgeLabel: "9–13 bln", erupted: false },
    { id: "g4", name: "Gigi seri samping bawah", typicalAgeLabel: "10–16 bln", erupted: false },
    { id: "g5", name: "Gigi geraham pertama", typicalAgeLabel: "13–19 bln", erupted: false },
    { id: "g6", name: "Gigi taring atas", typicalAgeLabel: "16–22 bln", erupted: false },
    { id: "g7", name: "Gigi taring bawah", typicalAgeLabel: "17–23 bln", erupted: false },
    { id: "g8", name: "Gigi geraham kedua", typicalAgeLabel: "23–33 bln", erupted: false },
  ],
  c2: [
    { id: "k1", name: "Gigi seri tengah bawah", typicalAgeLabel: "6–10 bln", erupted: true, date: "2022-12-01" },
    { id: "k2", name: "Gigi seri tengah atas", typicalAgeLabel: "8–12 bln", erupted: true, date: "2023-01-15" },
    { id: "k3", name: "Gigi seri samping atas", typicalAgeLabel: "9–13 bln", erupted: true },
    { id: "k4", name: "Gigi seri samping bawah", typicalAgeLabel: "10–16 bln", erupted: true },
    { id: "k5", name: "Gigi geraham pertama", typicalAgeLabel: "13–19 bln", erupted: true },
    { id: "k6", name: "Gigi taring atas", typicalAgeLabel: "16–22 bln", erupted: true },
    { id: "k7", name: "Gigi taring bawah", typicalAgeLabel: "17–23 bln", erupted: true },
    { id: "k8", name: "Gigi geraham kedua", typicalAgeLabel: "23–33 bln", erupted: false },
  ],
};

/** WHO-recommended ideal sleep duration by age. */
export const sleepIdeal = [
  { range: "0–3 bulan", hours: "14–17 jam" },
  { range: "4–11 bulan", hours: "12–15 jam" },
  { range: "1–2 tahun", hours: "11–14 jam" },
  { range: "3–5 tahun", hours: "10–13 jam" },
];

export const mockNotifications: AppNotification[] = [
  { id: "n1", type: "imunisasi", title: "Imunisasi DPT-HB-Hib", body: "Bintang dijadwalkan imunisasi lanjutan dalam 3 hari.", date: "2026-06-22", read: false },
  { id: "n2", type: "posyandu", title: "Posyandu bulan ini", body: "Jangan lupa penimbangan rutin di Posyandu Melati.", date: "2026-06-24", read: false },
  { id: "n3", type: "milestone", title: "Milestone baru relevan", body: "Di usia ini, coba stimulasi 'merangkak' untuk Bintang.", date: "2026-06-19", read: false },
  { id: "n4", type: "habit", title: "Pengingat kebiasaan", body: "Waktunya 'Bacakan buku 15 menit' malam ini.", date: "2026-06-19", read: true },
  { id: "n5", type: "task", title: "Deadline mendekat", body: "'Daftar ulang PAUD Sania' jatuh tempo 25 Jun.", date: "2026-06-19", read: true },
];

export const taskCategories = [
  "Kesehatan Anak",
  "Stimulasi",
  "Nutrisi",
  "Administrasi",
  "Lain-lain",
] as const;

export const habitCategories = [
  "Nutrisi Anak",
  "Stimulasi Harian",
  "Kesehatan Keluarga",
  "Rutinitas Tidur",
  "Perkembangan Orang Tua",
] as const;

export const milestoneDomains = [
  "Motorik Kasar",
  "Motorik Halus",
  "Kognitif",
  "Bahasa & Komunikasi",
  "Sosial-Emosional",
  "Sensorik",
  "Nutrisi & Pertumbuhan",
] as const;
