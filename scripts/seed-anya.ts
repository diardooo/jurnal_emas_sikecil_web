/**
 * One-time seed: data tumbuh kembang Kyara Zivanya Adinegara
 * User: elmaarifah.ea@gmail.com
 *
 * Run: tsx scripts/seed-anya.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  children as childrenT,
  growthRecords,
  journalEntries,
  milestones as milestonesT,
  teeth as teethT,
} from "../src/db/schema/app";
import { user as userT } from "../src/db/schema/auth";

const TARGET_EMAIL = "elmaarifah.ea@gmail.com";

// DOB: 18 Desember 2024 (usia 1 thn saat 18 Des 2025)
const DOB = "2024-12-18";
const CHILD_NAME = "Kyara Zivanya Adinegara";

async function findUser(): Promise<string> {
  const [u] = await db
    .select({ id: userT.id })
    .from(userT)
    .where(eq(userT.email, TARGET_EMAIL))
    .limit(1);
  if (!u) throw new Error(`User ${TARGET_EMAIL} tidak ditemukan di database.`);
  return u.id;
}

async function ensureChild(userId: string): Promise<string> {
  const existing = await db
    .select({ id: childrenT.id })
    .from(childrenT)
    .where(eq(childrenT.userId, userId))
    .limit(10);

  const found = existing.find((c) => c.id); // we'll check by name below
  // Try to find by name
  const namedChildren = await db
    .select({ id: childrenT.id, name: childrenT.name })
    .from(childrenT)
    .where(eq(childrenT.userId, userId));
  const anya = namedChildren.find((c) =>
    c.name.toLowerCase().includes("kyara")
  );
  if (anya) {
    console.log(`  ✓ Anak "${anya.name}" sudah ada (id: ${anya.id})`);
    return anya.id;
  }

  const [inserted] = await db
    .insert(childrenT)
    .values({
      userId,
      name: CHILD_NAME,
      dob: DOB,
      gender: "P",
      color: "#F9A8D4", // pink sesuai sepeda
    })
    .returning({ id: childrenT.id });
  console.log(`  ✓ Anak "${CHILD_NAME}" dibuat (id: ${inserted.id})`);
  return inserted.id;
}

async function seedGrowth(userId: string, childId: string) {
  console.log("\n→ Memasukkan data pertumbuhan…");
  await db.insert(growthRecords).values([
    {
      userId,
      childId,
      ageMonths: 12,
      weight: 8.7,
      height: 72,
      headCirc: null,
      date: "2025-12-18",
      note: "Data tumbang usia 1 tahun",
    },
    {
      userId,
      childId,
      ageMonths: 18,
      weight: null,
      height: null,
      headCirc: 44.5,
      date: "2026-06-05",
      note: "Lingkar kepala dicatat 5 Juni 2026",
    },
  ]);
  console.log("  ✓ 2 data pertumbuhan ditambahkan");
}

async function seedTeeth(userId: string, childId: string) {
  console.log("\n→ Memasukkan data gigi…");
  await db.insert(teethT).values([
    {
      userId,
      childId,
      name: "Gigi seri tengah bawah",
      typicalAgeLabel: "6–10 bln",
      erupted: true,
      date: "2025-09-20",
    },
    {
      userId,
      childId,
      name: "Gigi seri tengah atas",
      typicalAgeLabel: "8–12 bln",
      erupted: true,
      date: "2025-12-01",
    },
    {
      userId,
      childId,
      name: "Gigi seri samping atas",
      typicalAgeLabel: "9–13 bln",
      erupted: true,
      date: "2026-02-28",
    },
    {
      userId,
      childId,
      name: "Gigi seri samping bawah",
      typicalAgeLabel: "10–16 bln",
      erupted: true,
      date: "2026-02-28",
    },
    {
      userId,
      childId,
      name: "Gigi geraham pertama",
      typicalAgeLabel: "13–19 bln",
      erupted: true,
      date: "2026-06-05",
    },
    {
      userId,
      childId,
      name: "Gigi taring atas",
      typicalAgeLabel: "16–22 bln",
      erupted: false,
      date: null,
    },
    {
      userId,
      childId,
      name: "Gigi taring bawah",
      typicalAgeLabel: "17–23 bln",
      erupted: false,
      date: null,
    },
    {
      userId,
      childId,
      name: "Gigi geraham kedua",
      typicalAgeLabel: "23–33 bln",
      erupted: false,
      date: null,
    },
  ]);
  console.log("  ✓ 8 data gigi ditambahkan (5 tumbuh, 3 belum)");
}

async function seedMilestones(userId: string, childId: string) {
  console.log("\n→ Memasukkan pencapaian perkembangan (milestones)…");
  await db.insert(milestonesT).values([
    {
      userId,
      childId,
      title: "Duduk mandiri pertama kali",
      description:
        "Di kamar omahe sayur, jam 9.50, Anya pertama kali bisa duduk sendiri tanpa dibantu.",
      domain: "Motorik",
      ageMinMonths: 8,
      ageMaxMonths: 10,
      status: "tercapai",
      achievedAt: new Date("2025-09-03T09:50:00"),
      note: "3 September 2025, jam 09.50 di kamar omahe sayur",
    },
    {
      userId,
      childId,
      title: "Merangkak 4 langkah dengan baik",
      description: "Anya bisa merangkak 4 langkah dengan gerakan yang baik.",
      domain: "Motorik",
      ageMinMonths: 9,
      ageMaxMonths: 12,
      status: "tercapai",
      achievedAt: new Date("2025-10-01"),
      note: "1 Oktober 2025",
    },
    {
      userId,
      childId,
      title: "Gigi pertama tumbuh",
      description: "Satu gigi di bagian depan tumbuh di akhir bulan ke-9 menuju bulan ke-10.",
      domain: "Fisik",
      ageMinMonths: 9,
      ageMaxMonths: 10,
      status: "tercapai",
      achievedAt: new Date("2025-09-20"),
      note: "Gigi seri tengah bawah, akhir bulan ke-9",
    },
    {
      userId,
      childId,
      title: "Pertama kali makan yogurt",
      description: "Anya sangat senang saat pertama kali mencicipi yogurt!",
      domain: "Sosial-Emosi",
      ageMinMonths: 12,
      ageMaxMonths: 12,
      status: "tercapai",
      achievedAt: new Date("2025-12-18"),
      note: "18 Desember 2025 — hari ulang tahun ke-1",
    },
    {
      userId,
      childId,
      title: "Pertama kali makan es krim",
      description: "Pertama kali Anya mencicipi es krim.",
      domain: "Sosial-Emosi",
      ageMinMonths: 13,
      ageMaxMonths: 13,
      status: "tercapai",
      achievedAt: new Date("2026-01-21"),
      note: "21 Januari 2026",
    },
    {
      userId,
      childId,
      title: "Mulai berjalan 2–4 langkah",
      description: "Anya mulai bisa berjalan 2–4 langkah di akhir Februari.",
      domain: "Motorik",
      ageMinMonths: 14,
      ageMaxMonths: 14,
      status: "tercapai",
      achievedAt: new Date("2026-02-28"),
      note: "Akhir Februari 2026",
    },
    {
      userId,
      childId,
      title: "Lancar berjalan",
      description: "Anya sudah lancar berjalan di usia 1 tahun 1 bulan.",
      domain: "Motorik",
      ageMinMonths: 13,
      ageMaxMonths: 14,
      status: "tercapai",
      achievedAt: new Date("2026-01-18"),
      note: "Usia 1 tahun 1 bulan",
    },
    {
      userId,
      childId,
      title: "Angkat tangan untuk berdoa & mulai bisa lari",
      description:
        "Anya mulai bisa mengangkat tangan saat berdoa dan mengucap amin. Juga mulai bisa berlari.",
      domain: "Sosial-Emosi",
      ageMinMonths: 14,
      ageMaxMonths: 14,
      status: "tercapai",
      achievedAt: new Date("2026-02-18"),
      note: "14 bulan",
    },
    {
      userId,
      childId,
      title: "Naik sepeda balance bike sendiri",
      description:
        "Anya bisa mengayuh sepeda balance bike 3 roda pink menggunakan 1 kaki karena kaki satunya belum sampai.",
      domain: "Motorik",
      ageMinMonths: 14,
      ageMaxMonths: 14,
      status: "tercapai",
      achievedAt: new Date("2026-02-18"),
      note: "1 tahun 2 bulan, sepeda balance bike 3 roda pink",
    },
    {
      userId,
      childId,
      title: "Bisa menerima dan menjalankan perintah",
      description:
        "Anya sudah bisa diperintah: ambilin hp, suruh tidur, sholat, cari cicak/nunjuk cicak.",
      domain: "Kognitif",
      ageMinMonths: 15,
      ageMaxMonths: 15,
      status: "tercapai",
      achievedAt: new Date("2026-03-18"),
      note: "15 bulan",
    },
    {
      userId,
      childId,
      title: "Menyebut nama sendiri",
      description: 'Anya bisa menyebut namanya sendiri dengan jelas: "Anya".',
      domain: "Bahasa",
      ageMinMonths: 15,
      ageMaxMonths: 15,
      status: "tercapai",
      achievedAt: new Date("2026-03-18"),
      note: "15 bulan",
    },
    {
      userId,
      childId,
      title: "Fase cerewet & aktif mengambil barang",
      description:
        "Anya mulai cerewet baget, suka mengambil barang dan mencoba menaikinya (buku, tas, tisu, dll) untuk melatih keseimbangan.",
      domain: "Sosial-Emosi",
      ageMinMonths: 15,
      ageMaxMonths: 15,
      status: "tercapai",
      achievedAt: new Date("2026-03-18"),
      note: "15 bulan",
    },
    {
      userId,
      childId,
      title: "Mengenali dan menyebut cicak",
      description:
        'Anya langsung nunjuk dan bilang "cak" setiap kali melihat cicak.',
      domain: "Bahasa",
      ageMinMonths: 15,
      ageMaxMonths: 15,
      status: "tercapai",
      achievedAt: new Date("2026-03-18"),
      note: "15 bulan — bilang 'cak' untuk cicak",
    },
  ]);
  console.log("  ✓ 13 pencapaian perkembangan ditambahkan");
}

async function seedJournal(userId: string, childId: string) {
  console.log("\n→ Memasukkan entri jurnal…");
  await db.insert(journalEntries).values([
    {
      userId,
      childId,
      date: "2025-09-03",
      mood: "bangga",
      title: "Anya pertama kali duduk mandiri!",
      body: "Hari ini jam 9.50 pagi, di kamar omahe sayur, Anya tiba-tiba duduk sendiri tanpa dibantu. Momen yang sangat membahagiakan!",
      tags: ["milestone", "motorik", "duduk"],
    },
    {
      userId,
      childId,
      date: "2025-10-01",
      mood: "bangga",
      title: "Anya merangkak 4 langkah!",
      body: "Anya berhasil merangkak 4 langkah dengan baik hari ini. Motoriknya semakin berkembang.",
      tags: ["milestone", "motorik", "merangkak"],
    },
    {
      userId,
      childId,
      date: "2025-12-18",
      mood: "senang",
      title: "Ultah ke-1 & pertama kali makan yogurt! 🎂",
      body: "Hari ini Anya genap 1 tahun! Pertama kali mencicipi yogurt dan senengggg banget. Di usia 1 tahun: berat 8,7 kg, tinggi 72 cm, punya 4 gigi. Kosakata: mama, papa, apa, apak, pak, mbak, mbah, abah, mamam. Masih sukanya nenen dan agak susah makan.",
      tags: ["ulang tahun", "milestone", "yogurt", "1 tahun"],
    },
    {
      userId,
      childId,
      date: "2026-01-21",
      mood: "senang",
      title: "Pertama kali makan es krim!",
      body: "Hari ini Anya untuk pertama kalinya mencicipi es krim. Ekspresinya lucu banget!",
      tags: ["MPASI", "pertama kali", "es krim"],
    },
    {
      userId,
      childId,
      date: "2026-02-28",
      mood: "bangga",
      title: "Anya mulai jalan 2–4 langkah & update perkembangan",
      body: "Akhir Februari: Anya sudah bisa jalan 2–4 langkah! Gigi bertambah — tumbuh 3 atas besar dan 2 kecil bawah. Di usia 1 tahun 2 bulan juga sudah bisa naik sepeda balance bike 3 roda pink — mengayuh pakai 1 kaki karena kaki satunya belum sampai tanah. Keren banget!",
      tags: ["motorik", "jalan", "gigi", "sepeda"],
    },
    {
      userId,
      childId,
      date: "2026-03-18",
      mood: "bangga",
      title: "Anya 15 bulan — banyak pencapaian baru!",
      body: "Di usia 15 bulan:\n- Cerewet baget!\n- Sudah bisa dikasih perintah (ambilin hp, suruh tidur, sholat, nyari cicak)\n- Bisa menyebut namanya sendiri 'Anya' dengan jelas\n- Kalau ada cicak langsung nunjuk sambil bilang 'cak'\n- Suka ambilin barang dan dinaikin untuk latihan keseimbangan\n- Total gigi sudah 7\n- 14 bulan: mulai bisa angkat tangan untuk berdoa dan amin, sudah bisa lari",
      tags: ["15 bulan", "bahasa", "kognitif", "gigi"],
    },
    {
      userId,
      childId,
      date: "2026-06-05",
      mood: "bangga",
      title: "Update Juni 2026 — gigi ke-9 & ukuran kepala",
      body: "Tgl 5 Juni 2026:\n- Gigi tumbuh 1 lagi di bagian belakang kanan → total sekarang 9 gigi! Ada beberapa yang masih mau tumbuh (2 gigi)\n- Lingkar kepala: 44,5 cm",
      tags: ["gigi", "pertumbuhan", "lingkar kepala"],
    },
  ]);
  console.log("  ✓ 7 entri jurnal ditambahkan");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL belum diisi di .env");
    process.exit(1);
  }

  console.log(`\n=== Seed data Anya (${TARGET_EMAIL}) ===\n`);

  console.log("→ Mencari user…");
  const userId = await findUser();
  console.log(`  ✓ User ditemukan (id: ${userId})`);

  console.log("→ Menyiapkan data anak…");
  const childId = await ensureChild(userId);

  await seedGrowth(userId, childId);
  await seedTeeth(userId, childId);
  await seedMilestones(userId, childId);
  await seedJournal(userId, childId);

  console.log("\n✅ Selesai! Semua data Anya berhasil dimasukkan.\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("✗ Error:", e.message);
  process.exit(1);
});
