/** Thin client for the protected /api/* route handlers (same-origin, cookie auth). */

async function http<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    // Session expired — bounce to login.
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Request gagal (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiGet = <T>(resource: string) => http<T>("GET", `/api/${resource}`);
export const apiPost = <T>(resource: string, body: unknown) =>
  http<T>("POST", `/api/${resource}`, body);
export const apiPatch = <T>(resource: string, id: string, body: unknown) =>
  http<T>("PATCH", `/api/${resource}/${id}`, body);
export const apiDelete = (resource: string, id: string) =>
  http<void>("DELETE", `/api/${resource}/${id}`);

export interface MeResponse {
  user: { id: string; name: string; email: string; image?: string | null };
  plan: "free" | "premium";
  subscription: { id: string; plan: string } | null;
}
export const getMe = () => apiGet<MeResponse>("me");

/** Group a flat child-scoped array into Record<childId, T[]>. */
export function groupByChild<T extends { childId?: string | null }>(
  rows: T[],
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const r of rows) {
    if (!r.childId) continue;
    (out[r.childId] ??= []).push(r);
  }
  return out;
}
