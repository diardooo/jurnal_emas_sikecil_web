"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same-origin in the browser; falls back to env for SSR/tests.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
