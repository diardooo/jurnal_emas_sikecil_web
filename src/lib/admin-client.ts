/** Thin client for the admin-only /api/admin/* route handlers (cookie auth). */

async function http<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(res.status === 403 ? "Akses admin diperlukan" : "Belum login");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Request gagal (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const qs = (params?: Record<string, string | undefined>) => {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export interface AdminUser {
  id: string; name: string; email: string; phone: string | null;
  role: string; status: "active" | "suspended"; image: string | null;
  createdAt: string; kids: number; plan: "free" | "premium";
  planStatus: string | null; expiresAt: string | null;
}

export interface AdminChild {
  id: string; name: string; gender: string; dob: string; color: string;
  birthWeight: number | null; birthHeight: number | null; createdAt: string;
  userId: string; parentName: string; parentEmail: string; parentPhone: string | null;
}

export interface AdminStats {
  totalUsers: number; suspended: number; premium: number; totalChildren: number;
  newThisWeek: number; milestonesAchieved: number; tasksDone: number; mrr: number;
  activeNow: number; active24h: number; active7d: number;
  planDistribution: { plan: string; count: number }[];
  growthByMonth: { month: string; count: number }[];
  contentCounts: { milestones: number; immunizations: number; teeth: number; sleep: number };
  moduleUsage: { module: string; users: number; pct: number }[];
  activation: { step: string; users: number; pct: number }[];
  revenueByMonth: { month: string; revenue: number; count: number }[];
}

export interface NotificationHistory {
  title: string; type: string; date: string; body: string;
  recipients: number; read: number; openRate: number;
}

export interface RolePermission {
  id: string; feature: string; sortOrder: number;
  freeEnabled: boolean; premiumEnabled: boolean;
}

export interface DiscountCode {
  id: string; code: string; type: "percent" | "fixed"; value: number;
  description: string; maxUsage: number | null; usedCount: number;
  expiresAt: string | null; active: boolean; createdAt: string;
}

export interface AdminMe {
  id: string; name: string; email: string; role: string;
}

export interface SubscriptionRow {
  id: string; plan: string; status: string; startedAt: string;
  expiresAt: string | null; paymentId: string | null;
  userId: string; userName: string; userEmail: string;
}

export interface RefMilestone {
  id: string; domain: string; title: string; description: string;
  ageMinMonths: number; ageMaxMonths: number; isCritical: boolean; reference: string;
}
export interface RefImmunization {
  id: string; vaccine: string; ageLabel: string; ageMonths: number;
  doses: string; mandatory: boolean; note: string;
}
export interface RefTooth {
  id: string; name: string; position: string; eruptAgeLabel: string;
  sheddAgeLabel: string; count: number;
}
export interface RefSleep {
  id: string; groupName: string; ageLabel: string; totalLabel: string;
  nightLabel: string; napLabel: string; note: string;
}

export const adminApi = {
  // Identity probe (auth gate)
  me: () => http<AdminMe>("GET", "/api/admin/me"),

  // Users
  users: (f?: { q?: string; plan?: string; status?: string }) =>
    http<AdminUser[]>("GET", `/api/admin/users${qs(f)}`),
  createUser: (body: { name: string; email: string; password: string; phone?: string; plan?: string }) =>
    http<{ id: string }>("POST", "/api/admin/users", body),
  updateUser: (id: string, body: Partial<AdminUser> & { plan?: string }) =>
    http<AdminUser>("PATCH", `/api/admin/users/${id}`, body),
  deleteUser: (id: string) => http<{ ok: true }>("DELETE", `/api/admin/users/${id}`),
  bulkUsers: (ids: string[], action: "suspend" | "activate" | "delete") =>
    http<{ ok: true; affected: number }>("POST", "/api/admin/users/bulk", { ids, action }),

  // Children
  children: (f?: { userId?: string; q?: string }) =>
    http<AdminChild[]>("GET", `/api/admin/children${qs(f)}`),

  // Subscriptions + stats
  subscriptions: (f?: { plan?: string; status?: string }) =>
    http<SubscriptionRow[]>("GET", `/api/admin/subscriptions${qs(f)}`),
  stats: () => http<AdminStats>("GET", "/api/admin/stats"),

  // Role matrix
  roles: () => http<RolePermission[]>("GET", "/api/admin/roles"),
  saveRoles: (rows: { id: string; freeEnabled?: boolean; premiumEnabled?: boolean }[]) =>
    http<RolePermission[]>("PUT", "/api/admin/roles", rows),

  // Discounts
  discounts: () => http<DiscountCode[]>("GET", "/api/admin/discounts"),
  createDiscount: (body: Partial<DiscountCode>) =>
    http<DiscountCode>("POST", "/api/admin/discounts", body),
  updateDiscount: (id: string, body: Partial<DiscountCode>) =>
    http<DiscountCode>("PATCH", `/api/admin/discounts/${id}`, body),
  deleteDiscount: (id: string) => http<{ ok: true }>("DELETE", `/api/admin/discounts/${id}`),

  // Content catalogs
  content: <T = unknown>(kind: "milestones" | "immunizations" | "teeth" | "sleep") =>
    http<T[]>("GET", `/api/admin/content/${kind}`),
  createContent: <T = unknown>(kind: string, body: unknown) =>
    http<T>("POST", `/api/admin/content/${kind}`, body),
  updateContent: <T = unknown>(kind: string, id: string, body: unknown) =>
    http<T>("PATCH", `/api/admin/content/${kind}/${id}`, body),
  deleteContent: (kind: string, id: string) =>
    http<{ ok: true }>("DELETE", `/api/admin/content/${kind}/${id}`),

  // Broadcast + settings
  broadcast: (body: { title: string; body: string; type?: string; target: string; ids?: string[] }) =>
    http<{ ok: true; sent: number; recipients: { id: string; name: string; phone: string | null }[] }>(
      "POST", "/api/admin/broadcast", body,
    ),
  notifications: () => http<NotificationHistory[]>("GET", "/api/admin/notifications"),
  settings: () => http<Record<string, string>>("GET", "/api/admin/settings"),
  saveSettings: (body: Record<string, string>) =>
    http<Record<string, string>>("PUT", "/api/admin/settings", body),
};
