import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/marketing/legal-shell";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Jurnal Emas Si Kecil",
  description: "Bagaimana Jurnal Emas Si Kecil mengumpulkan, menyimpan, dan melindungi data Anda dan anak Anda.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Kebijakan Privasi" updated="28 Juni 2026">
      <p>
        Jurnal Emas Si Kecil (&quot;kami&quot;) menghormati privasi Anda. Halaman ini menjelaskan
        data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak Anda. Aplikasi ini
        dibuat untuk membantu orang tua memantau tumbuh kembang anak — kami memperlakukan data
        anak dengan kehati-hatian khusus.
      </p>

      <LegalSection title="1. Data yang kami kumpulkan">
        <p>• <strong>Data akun:</strong> nama, email, dan (opsional) nomor WhatsApp serta foto profil.</p>
        <p>• <strong>Data anak:</strong> nama, tanggal lahir, jenis kelamin, pengukuran pertumbuhan (berat, tinggi, lingkar kepala), milestone, imunisasi, gigi, pola tidur, catatan jurnal, dan foto yang Anda unggah.</p>
        <p>• <strong>Data teknis:</strong> sesi login untuk menjaga keamanan akun.</p>
      </LegalSection>

      <LegalSection title="2. Bagaimana data digunakan">
        <p>Data dipakai hanya untuk menjalankan fitur aplikasi: menampilkan grafik pertumbuhan berstandar WHO, mendeteksi keterlambatan milestone, mengirim pengingat, serta menjawab pertanyaan melalui Pendamping AI berdasarkan data anak Anda sendiri.</p>
      </LegalSection>

      <LegalSection title="3. Layanan pihak ketiga">
        <p>• <strong>Penyimpanan database</strong> (Neon) — data tersimpan terenkripsi saat transit (TLS) dan saat disimpan (at rest).</p>
        <p>• <strong>Penyimpanan foto</strong> (Cloudinary) — foto yang Anda unggah disimpan di CDN aman.</p>
        <p>• <strong>Pendamping AI</strong> (Google Gemini) — saat Anda bertanya, ringkasan data anak dikirim ke layanan AI hanya untuk menghasilkan jawaban; tidak digunakan untuk melatih model.</p>
        <p>• <strong>Pembayaran</strong> (Midtrans) — pemrosesan pembayaran ditangani Midtrans. Kami <strong>tidak</strong> menyimpan data kartu/kredensial pembayaran Anda.</p>
        <p>• <strong>Email</strong> (Resend) — untuk email reset kata sandi & notifikasi penting.</p>
      </LegalSection>

      <LegalSection title="4. Berbagi laporan">
        <p>Tautan laporan yang Anda buat bersifat read-only, memiliki masa berlaku, dan hanya berisi data perkembangan anak (tanpa info kontak/akun). Bagikan hanya kepada pihak tepercaya seperti dokter/nakes.</p>
      </LegalSection>

      <LegalSection title="5. Hak Anda">
        <p>Anda dapat melihat dan memperbarui data kapan saja dari dalam aplikasi. Menghapus akun akan menghapus seluruh data anak yang terkait secara permanen (cascade). Hubungi kami bila perlu bantuan.</p>
      </LegalSection>

      <LegalSection title="6. Bukan nasihat medis">
        <p>Informasi dalam aplikasi (termasuk Pendamping AI) bersifat edukatif dan bukan diagnosis. Untuk kekhawatiran kesehatan, konsultasikan ke dokter anak, bidan, atau Posyandu.</p>
      </LegalSection>

      <LegalSection title="7. Kontak">
        <p>Pertanyaan seputar privasi? Email kami di <a className="font-semibold text-gold-700 hover:underline" href="mailto:halo@jurnalemas.com">halo@jurnalemas.com</a>.</p>
      </LegalSection>
    </LegalShell>
  );
}
