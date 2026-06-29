/**
 * The first-login product walkthrough. Steps are walked in order; the engine
 * (components/app/product-tour.tsx) navigates to `href` first, then spotlights
 * the element matching `selector`. A step with no `selector` (or whose anchor
 * isn't found) renders as a centered card, so the tour never gets stuck.
 *
 * Ordering follows the parent's real journey: orient on the dashboard (its key
 * sections) → the flagship AI companion → daily logging → growth (with its four
 * tabs) → the standout milestone tracker (its tabs) → task views → routine tabs
 * → reports → child profiles → upgrade. Premium touchpoints are flagged so users
 * know what unlocks with Emas.
 */
export type TourStep = {
  /** Navigate here before showing the step (omit to stay on the current page). */
  href?: string;
  /** `[data-tour="…"]` value to spotlight. Omit for a centered card. */
  selector?: string;
  title: string;
  body: string;
  /** Tags the step as a paid-feature touchpoint (shows a "Fitur Emas" chip). */
  premium?: boolean;
};

export const tourSteps: TourStep[] = [
  {
    title: "Selamat datang di Jurnal Emas Si Kecil 👋",
    body: "Satu aplikasi untuk memantau, mencatat, dan menstimulasi tumbuh kembang si Kecil 0–6 tahun. Yuk kenali fitur utamanya dalam ±2 menit — bisa dilewati kapan saja.",
  },

  // ---- Dashboard: orient on each key section ----
  {
    href: "/dashboard",
    selector: "dashboard-hero",
    title: "Beranda — sapaan harianmu",
    body: "Menampilkan anak yang sedang aktif beserta usianya, dan 'hari beruntun' (streak) — jumlah hari kamu konsisten mencatat. Ganti anak aktif lewat tombol profil di menu samping.",
  },
  {
    href: "/dashboard",
    selector: "dashboard-ritual",
    title: "Momen Hari Ini",
    body: "Satu ide stimulasi singkat sesuai usia si Kecil yang berganti tiap hari, plus kenangan jurnal yang muncul kembali untuk dinikmati. Cukup 2 menit untuk memulai hari.",
  },
  {
    href: "/dashboard",
    selector: "dashboard-stats",
    title: "Ringkasan cepat",
    body: "Kartu angka penting — task, milestone, pertumbuhan, dan lainnya. Ketuk kartunya untuk langsung melompat ke halaman terkait.",
  },
  {
    href: "/dashboard",
    selector: "dashboard-today",
    title: "Task hari ini & pengingat",
    body: "Daftar task yang perlu diselesaikan hari ini dan pengingat prioritas seperti jadwal imunisasi berikutnya — semua dalam satu pandangan.",
  },

  // ---- Flagship + daily logging ----
  {
    href: "/coach",
    selector: "page-header",
    title: "Pendamping AI ✨ — fitur andalan",
    body: "Tanya apa pun seputar pengasuhan dan dapatkan jawaban yang menyesuaikan usia & data si Kecil. Paket gratis punya batas pertanyaan per hari; Emas memberi kuota jauh lebih besar.",
    premium: true,
  },
  {
    href: "/journal",
    selector: "page-header",
    title: "Jurnal — abadikan momen",
    body: "Catat cerita, perasaan, dan perkembangan harian si Kecil. Lampiran foto kenangan tersedia di paket Emas.",
    premium: true,
  },

  // ---- Growth, with its four tabs ----
  {
    href: "/growth",
    selector: "growth-tabs",
    title: "Tumbuh Kembang — 4 pemantauan",
    body: "Empat tab dalam satu halaman: Pertumbuhan (berat & tinggi vs kurva WHO), Imunisasi (jadwal & riwayat), Gigi (urutan tumbuh gigi), dan Tidur (pola istirahat). Ketuk tiap tab untuk mencatat & melihat grafiknya.",
  },

  // ---- Standout: milestone tracker, with its tabs ----
  {
    href: "/goals",
    selector: "goals-tabs",
    title: "Goal & Milestone 🌟 — unggulan",
    body: "Tiga tab: Milestone Anak (acuan WHO, IDAI & Denver II), Ide Stimulasi (aktivitas siap pakai), dan Goal Orang Tua (target pribadimu). Foto momen milestone tersedia di Emas.",
    premium: true,
  },
  {
    href: "/goals",
    selector: "goals-tabs",
    title: "Ide Stimulasi → Rutinitas",
    body: "Di tab 'Ide Stimulasi', tiap aktivitas punya tombol 'Tambah ke Rutinitas'. Sekali ketuk, ide itu masuk ke Rutinitas › Kebiasaan & Konsistensi dengan tanda 'Ide Aplikasi' agar mudah kamu pantau tiap hari.",
  },

  // ---- Task views ----
  {
    href: "/tasks",
    selector: "task-views",
    title: "Task Manager — 3 tampilan",
    body: "Lihat task dengan cara favoritmu: List (daftar ringkas), Kanban (geser antar kolom status), dan Kalender (lihat berdasarkan tanggal). Pilih tab yang paling pas dengan caramu bekerja.",
  },

  // ---- Routine tabs ----
  {
    href: "/routines",
    selector: "routines-tabs",
    title: "Rutinitas — 2 tab",
    body: "Tab 'Hari Ini' berisi checklist yang segar tiap pagi. Tab 'Kebiasaan & Konsistensi' melacak habit jangka panjang dengan peta konsistensi 4 minggu — termasuk Ide Stimulasi yang kamu tambahkan dari halaman Milestone.",
  },

  // ---- Reports, profiles, upgrade ----
  {
    href: "/reports",
    selector: "page-header",
    title: "Laporan — rekap siap dibawa",
    body: "Rangkuman tumbuh kembang yang rapi untuk dibawa ke posyandu atau dokter. Ekspor PDF dan bagikan lewat tautan khusus tersedia di paket Emas.",
    premium: true,
  },
  {
    href: "/children",
    selector: "page-header",
    title: "Profil Anak — kelola data si Kecil",
    body: "Ubah data, foto, dan informasi anak. Punya lebih dari satu anak? Tambah hingga 5 profil dengan paket Emas.",
    premium: true,
  },
  {
    href: "/settings?tab=billing",
    selector: "page-header",
    title: "Upgrade ke Emas 👑",
    body: "Buka semua fitur premium: kuota AI besar, foto milestone & jurnal, ekspor laporan, dan anak tanpa batas. Kamu bisa mulai kapan pun dari halaman ini.",
    premium: true,
  },
  {
    title: "Kamu siap! 🎉",
    body: "Mulai dari hal kecil hari ini — catat satu momen atau tandai satu milestone. Ingin mengulang tur ini? Buka Pengaturan › Akun › 'Tur Aplikasi' kapan saja.",
  },
];
