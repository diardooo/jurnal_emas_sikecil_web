import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/marketing/legal-shell";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — Jurnal Emas Si Kecil",
  description: "Ketentuan penggunaan layanan Jurnal Emas Si Kecil.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Syarat & Ketentuan" updated="28 Juni 2026">
      <p>
        Dengan menggunakan Jurnal Emas Si Kecil, Anda menyetujui ketentuan berikut. Mohon dibaca
        sebelum membuat akun.
      </p>

      <LegalSection title="1. Layanan">
        <p>Jurnal Emas Si Kecil adalah alat bantu pemantauan tumbuh kembang anak (0–6 tahun) untuk orang tua. Layanan disediakan &quot;sebagaimana adanya&quot; dan dapat berkembang seiring waktu.</p>
      </LegalSection>

      <LegalSection title="2. Akun & tanggung jawab">
        <p>Anda bertanggung jawab menjaga kerahasiaan akun dan keakuratan data yang dimasukkan. Gunakan layanan sesuai hukum yang berlaku dan untuk anak yang menjadi tanggung jawab Anda.</p>
      </LegalSection>

      <LegalSection title="3. Bukan layanan medis">
        <p>Konten, grafik, deteksi red flag, dan Pendamping AI bersifat edukatif — <strong>bukan diagnosis atau pengganti tenaga kesehatan</strong>. Keputusan medis tetap perlu konsultasi ke dokter anak/bidan/Posyandu.</p>
      </LegalSection>

      <LegalSection title="4. Paket & pembayaran">
        <p>Paket Gratis tersedia selamanya dengan batasan tertentu. Paket Premium adalah <strong>pembayaran sekali bayar</strong> (bulanan/tahunan) dan <strong>tidak diperpanjang otomatis</strong> — akses premium aktif hingga tanggal berakhir, lalu kembali ke Gratis kecuali Anda memperpanjang. Pembayaran diproses oleh Midtrans.</p>
      </LegalSection>

      <LegalSection title="5. Pengembalian dana">
        <p>Karena akses premium aktif segera setelah pembayaran terkonfirmasi, pembelian umumnya bersifat final. Bila terjadi kesalahan transaksi, hubungi kami untuk ditinjau.</p>
      </LegalSection>

      <LegalSection title="6. Batasan tanggung jawab">
        <p>Sepanjang diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan layanan. Anda menggunakan layanan atas pertimbangan sendiri.</p>
      </LegalSection>

      <LegalSection title="7. Perubahan ketentuan">
        <p>Kami dapat memperbarui ketentuan ini sewaktu-waktu. Perubahan penting akan diberitahukan melalui aplikasi atau email.</p>
      </LegalSection>

      <LegalSection title="8. Kontak">
        <p>Pertanyaan? Email kami di <a className="font-semibold text-gold-700 hover:underline" href="mailto:halo@jurnalemas.com">halo@jurnalemas.com</a>.</p>
      </LegalSection>
    </LegalShell>
  );
}
