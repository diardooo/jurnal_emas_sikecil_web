import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "../db";
import { account, session, user, verification } from "../db/schema/auth";
import { resetPasswordEmail, sendEmail } from "./mailer";

const hasGoogle =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  appName: "Jurnal Emas Si Kecil",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  user: {
    additionalFields: {
      phone: { type: "string", required: false },
      // Server-managed; never set from the signup/client side.
      role: { type: "string", required: false, input: false },
      status: { type: "string", required: false, input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    // Email verification is off for the MVP/demo; flip on with a mailer.
    requireEmailVerification: false,
    // "Lupa sandi" — sends a reset link via the mailer (logs to console if no
    // RESEND_API_KEY, so the flow is testable in dev too).
    sendResetPassword: async ({ user: u, url }) => {
      await sendEmail({
        to: u.email,
        subject: "Atur ulang kata sandi — Jurnal Emas Si Kecil",
        html: resetPasswordEmail(u.name, url),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days (PRD "remember me")
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  ...(hasGoogle
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        },
      }
    : {}),
  // Must be last so cookies are set on Next.js server actions/route handlers.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
