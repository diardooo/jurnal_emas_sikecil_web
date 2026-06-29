/**
 * The first-login product walkthrough. Steps are walked in order; the engine
 * (components/app/product-tour.tsx) navigates to `href` first, then spotlights
 * the element matching `selector`. A step with no `selector` (or whose anchor
 * isn't found) renders as a centered card, so the tour never gets stuck.
 *
 * Ordering follows the parent's real journey: orient on the dashboard → the
 * flagship AI companion → daily logging (journal, growth) → the standout
 * milestone tracker → routines → reports → child profiles → upgrade. Premium
 * touchpoints are flagged so users know what unlocks with Emas.
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
    body: "Satu aplikasi untuk memantau, mencatat, dan menstimulasi tumbuh kembang si Kecil 0–6 tahun. Yuk kenali fitur utamanya dalam ±1 menit — bisa dilewati kapan saja.",
  },
  {
    href: "/dashboard",
    selector: "dashboard-hero",
    title: "Beranda — pusat harianmu",
    body: "Ringkasan anak aktif, rentetan hari konsisten (streak), dan 'Momen Hari Ini'. Di sinilah kamu mulai setiap hari. Anak aktif bisa diganti lewat tombol profil di menu samping.",
  },
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
    body: "Catat cerita, perasaan, dan perkembangan harian. Lampiran foto kenangan tersedia di paket Emas.",
    premium: true,
  },
  {
    href: "/growth",
    selector: "page-header",
    title: "Tumbuh Kembang — pantau kurva",
    body: "Catat berat & tinggi, lihat posisinya terhadap kurva pertumbuhan WHO. Membantu mendeteksi dini bila pertumbuhan perlu perhatian.",
  },
  {
    href: "/goals",
    selector: "page-header",
    title: "Goal & Milestone 🌟 — unggulan",
    body: "Daftar milestone 0–6 tahun mengacu WHO, IDAI (KPSP) & Denver II. Ada 'Ide Stimulasi' siap pakai yang bisa langsung ditambahkan ke rutinitas. Foto momen milestone tersedia di Emas.",
    premium: true,
  },
  {
    href: "/routines",
    selector: "page-header",
    title: "Rutinitas — kebiasaan & konsistensi",
    body: "Checklist harian yang segar tiap pagi, plus habit tracker dengan peta konsistensi 4 minggu. Stimulasi yang kamu tambahkan dari Ide Stimulasi muncul di sini.",
  },
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
