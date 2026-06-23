/**
 * Minimal mailer. Uses the Resend REST API when RESEND_API_KEY is set; otherwise
 * it logs the message (and any link) to the server console so flows like password
 * reset remain fully usable in development without a provider.
 *
 * No SDK dependency — just fetch. Relative-import-safe (used by lib/auth.ts which
 * the tsx seed scripts import).
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const FROM = process.env.EMAIL_FROM ?? "Jurnal Emas Si Kecil <no-reply@jurnalemas.com>";

export function mailerConfigured() {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<{ ok: boolean; skipped?: boolean }> {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    // Dev fallback: surface the email so the developer can act on it.
    console.log(
      `\n📧 [mailer:dev] RESEND_API_KEY belum diset — email tidak terkirim.\n   To: ${to}\n   Subject: ${subject}\n   ${text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500)}\n`,
    );
    return { ok: true, skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[mailer] Resend gagal (${res.status}): ${body}`);
    return { ok: false };
  }
  return { ok: true };
}

/** Branded wrapper so all transactional emails look consistent. */
export function emailLayout(title: string, bodyHtml: string) {
  return `
  <div style="font-family:'Segoe UI',system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1A1A2E">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <div style="width:36px;height:36px;background:#C9A227;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px">✨</div>
      <strong style="font-size:15px">Jurnal Emas Si Kecil</strong>
    </div>
    <h2 style="font-size:18px;margin:0 0 12px">${title}</h2>
    <div style="font-size:14px;line-height:1.6;color:#374151">${bodyHtml}</div>
    <p style="font-size:11px;color:#9CA3AF;margin-top:28px">Email otomatis — mohon tidak dibalas. Jika Anda tidak meminta ini, abaikan saja.</p>
  </div>`;
}

export function resetPasswordEmail(name: string, url: string) {
  return emailLayout(
    "Atur Ulang Kata Sandi",
    `<p>Halo ${name || "Bunda/Ayah"},</p>
     <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Klik tombol di bawah (berlaku 1 jam):</p>
     <p style="margin:20px 0"><a href="${url}" style="background:#C9A227;color:#1A1A2E;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;display:inline-block">Atur Ulang Sandi</a></p>
     <p style="font-size:12px;color:#6B7280">Atau salin tautan ini: <br>${url}</p>`,
  );
}

export function verifyEmail(name: string, url: string) {
  return emailLayout(
    "Verifikasi Email Anda",
    `<p>Halo ${name || "Bunda/Ayah"},</p>
     <p>Terima kasih sudah mendaftar. Verifikasi email Anda dengan menekan tombol di bawah:</p>
     <p style="margin:20px 0"><a href="${url}" style="background:#C9A227;color:#1A1A2E;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;display:inline-block">Verifikasi Email</a></p>
     <p style="font-size:12px;color:#6B7280">Atau salin tautan ini: <br>${url}</p>`,
  );
}
