/**
 * The first-login product walkthrough. Steps are walked in order; the engine
 * (components/app/product-tour.tsx) navigates to `href`, optionally opens the
 * `tab` (clicks `[data-tour-tab]`) so its content is visible, then spotlights
 * the element matching `selector`. A step with no `selector` (or whose anchor
 * isn't found) renders as a centered card, so the tour never gets stuck.
 *
 * Ordering follows the parent's real journey: orient on the dashboard (its key
 * sections) → the flagship AI companion → daily logging → growth (each tab) →
 * the standout milestone tracker (each tab) → task views → routine tabs →
 * reports → child profiles → upgrade. Premium touchpoints are flagged.
 */
export type TourStep = {
  /** Navigate here before showing the step (omit to stay on the current page). */
  href?: string;
  /** `[data-tour="…"]` value to spotlight. Omit for a centered card. */
  selector?: string;
  /** `[data-tour-tab="…"]` value to click first, revealing that tab's content. */
  tab?: string;
  title: string;
  body: string;
  /** Tags the step as a paid-feature touchpoint (shows a "Fitur Emas" chip). */
  premium?: boolean;
};

export const tourSteps: TourStep[] = [
  {
    title: "Selamat datang di Jurnal Emas Si Kecil 👋",
    body: "Satu aplikasi untuk memantau, mencatat, dan menstimulasi tumbuh kembang si Kecil 0–6 tahun. Yuk kenali fitur utamanya — tur akan membuka tiap bagian untukmu. Bisa dilewati kapan saja.",
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

  // ---- Tumbuh Kembang: open each tab ----
  {
    href: "/growth",
    selector: "growth-panel",
    tab: "growth-pertumbuhan",
    title: "Tumbuh Kembang › Pertumbuhan",
    body: "Catat berat & tinggi badan dan lihat posisinya pada kurva pertumbuhan WHO. Membantu mendeteksi dini bila pertumbuhan perlu perhatian.",
  },
  {
    href: "/growth",
    selector: "growth-panel",
    tab: "growth-imunisasi",
    title: "Tumbuh Kembang › Imunisasi",
    body: "Jadwal lengkap imunisasi sesuai usia beserta riwayatnya. Tandai yang sudah diberikan; yang akan datang muncul sebagai pengingat.",
  },
  {
    href: "/growth",
    selector: "growth-panel",
    tab: "growth-gigi",
    title: "Tumbuh Kembang › Gigi",
    body: "Pantau urutan tumbuh gigi susu si Kecil — tandai gigi yang sudah muncul satu per satu.",
  },
  {
    href: "/growth",
    selector: "growth-panel",
    tab: "growth-tidur",
    title: "Tumbuh Kembang › Tidur",
    body: "Catat pola tidur untuk memahami kualitas istirahat si Kecil dan membangun rutinitas tidur yang sehat.",
  },

  // ---- Goal & Milestone: open each tab ----
  {
    href: "/goals",
    selector: "goals-panel",
    tab: "goals-milestone",
    title: "Milestone Anak 🌟 — unggulan",
    body: "Daftar capaian perkembangan 0–6 tahun mengacu WHO, IDAI (KPSP) & Denver II. Tandai tiap milestone: Belum, Sedang Dicoba, atau Sudah Bisa. Foto momen milestone tersedia di Emas.",
    premium: true,
  },
  {
    href: "/goals",
    selector: "goals-panel",
    tab: "goals-ide",
    title: "Ide Stimulasi → Rutinitas",
    body: "Aktivitas stimulasi siap pakai sesuai usia. Tiap kartu punya tombol 'Tambah ke Rutinitas' — sekali ketuk, ide itu masuk ke Rutinitas › Kebiasaan & Konsistensi dengan tanda 'Ide Aplikasi' agar mudah dipantau harian.",
  },
  {
    href: "/goals",
    selector: "goals-panel",
    tab: "goals-goal",
    title: "Goal Orang Tua",
    body: "Buat target pribadimu sebagai orang tua dan pecah jadi langkah-langkah kecil yang bisa kamu centang dan pantau progresnya.",
  },

  // ---- Task Manager: open each view ----
  {
    href: "/tasks",
    selector: "task-panel",
    tab: "task-list",
    title: "Task Manager › List",
    body: "Tampilan daftar yang ringkas — cara tercepat melihat dan menyelesaikan task satu per satu.",
  },
  {
    href: "/tasks",
    selector: "task-panel",
    tab: "task-kanban",
    title: "Task Manager › Kanban",
    body: "Papan kolom berdasarkan status. Geser task antar kolom untuk memantau progres secara visual.",
  },
  {
    href: "/tasks",
    selector: "task-panel",
    tab: "task-calendar",
    title: "Task Manager › Kalender",
    body: "Lihat task tersusun berdasarkan tanggal — pas untuk merencanakan agenda harian si Kecil.",
  },

  // ---- Rutinitas: open each tab ----
  {
    href: "/routines",
    selector: "routines-panel",
    tab: "routines-today",
    title: "Rutinitas › Hari Ini",
    body: "Checklist harian yang otomatis disegarkan tiap pagi. Centang aktivitas rutin si Kecil sepanjang hari.",
  },
  {
    href: "/routines",
    selector: "routines-panel",
    tab: "routines-habits",
    title: "Rutinitas › Kebiasaan & Konsistensi",
    body: "Lacak kebiasaan jangka panjang dengan peta konsistensi 4 minggu. Ide Stimulasi yang kamu tambahkan dari halaman Milestone muncul di sini dengan tanda 'Ide Aplikasi'.",
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
