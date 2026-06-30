import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/api";
import { pushConfigured, sendToUser } from "@/lib/push";

/** Fire a sample notification to the current user's devices. */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  if (!pushConfigured()) {
    return NextResponse.json(
      { error: "Push belum dikonfigurasi di server" },
      { status: 503 },
    );
  }

  const res = await sendToUser(user.id, {
    title: "Pengingat aktif! 🔔",
    body: "Beginilah notifikasi Jurnal Emas akan muncul di HP-mu. 💛",
    url: "/catatan",
    tag: "test",
  });

  if (res.sent === 0) {
    return NextResponse.json(
      { error: "Tidak ada perangkat aktif. Aktifkan dulu di perangkat ini." },
      { status: 404 },
    );
  }
  return NextResponse.json(res);
}
