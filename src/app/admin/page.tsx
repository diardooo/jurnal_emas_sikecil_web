"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Users, CreditCard, Sprout, Bell, TrendingUp,
  Settings, LogOut, Search, RefreshCw, Download, Plus, Eye,
  Pencil, Ban, X, Megaphone, AlertCircle, CheckCircle2, Clock,
  Wifi, WifiOff, Baby, Syringe, Smile, Moon, ShieldCheck,
  MessageCircle, Tag, Trash2, Check, Loader2, Lock,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { MILESTONE_DOMAINS } from "@/lib/types";
import {
  adminApi,
  type AdminUser, type AdminChild, type AdminStats, type AdminMe,
  type RolePermission, type DiscountCode, type SubscriptionRow,
  type RefMilestone, type RefImmunization, type RefTooth, type RefSleep,
} from "@/lib/admin-client";

// ── PALETTE
const G = { gold: "#C9A227", goldLight: "#F0C84A", dark: "#1A1A2E", bg: "#F4F6FA", green: "#10B981", red: "#EF4444", blue: "#3B82F6", orange: "#F59E0B", purple: "#8B5CF6", wa: "#25D366" };

// ── HELPERS
const PALETTE = ["#3B82F6", "#C9A227", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#0EA5E9", "#EC4899", "#14B8A6", "#6366F1"];
const colorOf = (key: string) => PALETTE[key.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
};
const shortMonth = (ym: string) => {
  const m = Number(ym.split("-")[1]);
  return MONTHS_ID[(m - 1 + 12) % 12] ?? ym;
};
const ageFromDob = (dob?: string) => {
  if (!dob) return "—";
  const b = new Date(dob), now = new Date();
  let m = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) m--;
  if (m < 0) return "—";
  return m < 24 ? `${m} bln` : `${Math.floor(m / 12)} thn`;
};
const planLabel = (plan: string) => (plan === "premium" ? "⭐ Premium" : "Free");
const waLink = (phone: string, text?: string) =>
  `https://wa.me/62${phone.replace(/^0/, "").replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Build a CSV from objects and trigger a browser download (Excel-friendly, UTF-8 BOM). */
function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Tiny data-fetching hook: runs `fn` on mount + on demand. */
function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return fn()
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat data"))
      .finally(() => setLoading(false));
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}

// ── PRIMITIVES
function Badge({ children, type = "gray" }: { children: React.ReactNode; type?: "green" | "gold" | "gray" | "red" | "blue" | "purple" | "orange" }) {
  const styles: Record<string, string> = {
    green: "bg-[rgba(16,185,129,0.12)] text-[#10B981]",
    gold: "bg-[rgba(201,162,39,0.15)] text-[#8B6914]",
    gray: "bg-gray-100 text-gray-500",
    red: "bg-[rgba(239,68,68,0.12)] text-[#EF4444]",
    blue: "bg-[rgba(59,130,246,0.12)] text-[#3B82F6]",
    purple: "bg-[rgba(139,92,246,0.12)] text-[#8B5CF6]",
    orange: "bg-[rgba(245,158,11,0.12)] text-[#F59E0B]",
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${styles[type]}`}>{children}</span>;
}

function StatCard({ label, value, icon, change, up = true }: { label: string; value: string; icon: string; change: string; up?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 font-medium">{label}</div>
          <div className="text-2xl font-extrabold text-[#1A1A2E] mt-0.5">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-lg">{icon}</div>
      </div>
      <div className={`text-xs font-semibold flex items-center gap-1 ${up ? "text-[#10B981]" : "text-[#EF4444]"}`}>{up ? "▲" : "▼"} {change}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] ${className}`}>{children}</div>;
}
function CardHeader({ title, meta, children }: { title: string; meta?: string; children?: React.ReactNode }) {
  return (
    <div className="px-5 pt-4 pb-0 flex items-center justify-between">
      <div><h3 className="text-sm font-bold text-[#1A1A2E]">{title}</h3>{meta && <p className="text-xs text-gray-400">{meta}</p>}</div>
      {children}
    </div>
  );
}
function IconBtn({ onClick, danger, title, children }: { onClick: () => void; danger?: boolean; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className={`w-7 h-7 rounded-md border flex items-center justify-center text-xs transition-colors ${danger ? "border-gray-200 hover:bg-[rgba(239,68,68,0.12)] hover:border-[rgba(239,68,68,0.3)]" : "border-gray-200 bg-white hover:bg-gray-50"}`}>{children}</button>
  );
}
function WaBtn({ phone, text, title = "Chat WhatsApp" }: { phone: string; text?: string; title?: string }) {
  return (
    <a href={waLink(phone, text)} target="_blank" rel="noopener noreferrer" title={title}
      className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-[#25D366] hover:bg-[rgba(37,211,102,0.12)] hover:border-[rgba(37,211,102,0.3)] transition-colors"><MessageCircle size={12} /></a>
  );
}
function AvatarCircle({ name, color, size = "sm" }: { name: string; color: string; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-14 h-14 text-xl" : "w-8 h-8 text-xs";
  return <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`} style={{ background: color }}>{(name?.[0] ?? "?").toUpperCase()}</div>;
}
function Modal({ id, title, open, onClose, children, footer, width = "540px" }: { id: string; title: string; open: boolean; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl" id={id} style={{ width }}>
        <div className="px-6 pt-5 pb-0 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1A1A2E]">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50"><X size={14} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 pb-5 flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}
function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>{children}</div>;
}
function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1A1A2E] outline-none focus:border-[#C9A227] transition-colors ${className}`} {...props} />;
}
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1A1A2E] outline-none bg-white focus:border-[#C9A227]" {...props}>{children}</select>;
}
function BtnPrimary({ onClick, children, disabled }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg text-sm font-semibold cursor-pointer bg-[#C9A227] text-[#1A1A2E] hover:bg-[#F0C84A] transition-colors border-0 disabled:opacity-50 disabled:cursor-not-allowed">{children}</button>;
}
function BtnGhost({ onClick, children, className = "" }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return <button onClick={onClick} className={`inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg text-sm font-semibold cursor-pointer bg-transparent text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors ${className}`}>{children}</button>;
}
function BtnWa({ href, onClick, children }: { href?: string; onClick?: () => void; children: React.ReactNode }) {
  const cls = "inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg text-sm font-semibold cursor-pointer bg-[#25D366] text-white hover:bg-[#1EBE5A] transition-colors border-0";
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}
function Toggle({ checked, onChange }: { checked: boolean; onChange?: () => void }) {
  return (
    <label className="relative w-9 h-5 flex-shrink-0 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="opacity-0 w-0 h-0 peer" />
      <span className="absolute inset-0 rounded-full bg-gray-300 peer-checked:bg-[#C9A227] transition-colors after:content-[''] after:absolute after:w-3.5 after:h-3.5 after:bg-white after:rounded-full after:bottom-[3px] after:left-[3px] after:transition-transform peer-checked:after:translate-x-4" />
    </label>
  );
}
function PageHead({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div><h2 className="text-base font-bold">{title}</h2><p className="text-sm text-gray-400">{sub}</p></div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2.5 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 whitespace-nowrap">{children}</th>;
}
function Spinner({ label = "Memuat data…" }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm"><Loader2 size={16} className="animate-spin" /> {label}</div>;
}
function ErrorState({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle size={22} className="text-[#EF4444]" />
      <div className="text-sm text-gray-500">{msg}</div>
      <BtnGhost onClick={onRetry}><RefreshCw size={13} /> Coba lagi</BtnGhost>
    </div>
  );
}
/** Wraps a useAsync result with loading / error fallbacks. */
function Async<T>({ state, children }: { state: { data: T | null; loading: boolean; error: string | null; reload: () => void }; children: (data: T) => React.ReactNode }) {
  if (state.loading && !state.data) return <Spinner />;
  if (state.error) return <ErrorState msg={state.error} onRetry={state.reload} />;
  if (!state.data) return <Spinner />;
  return <>{children(state.data)}</>;
}

// ── PAGE: OVERVIEW
function PageOverview({ setActivePage, refreshSignal }: { setActivePage: (p: PageId) => void; refreshSignal: number }) {
  const stats = useAsync(() => adminApi.stats(), [refreshSignal]);
  const users = useAsync(() => adminApi.users(), [refreshSignal]);
  const [synced, setSynced] = useState<Date | null>(null);
  useEffect(() => { if (stats.data) setSynced(new Date()); }, [stats.data]);
  const refresh = () => { stats.reload(); users.reload(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">Ringkasan performa platform — data langsung dari database</p>
        <div className="flex items-center gap-3">
          {synced && <span className="text-[11px] text-gray-400">Diperbarui {synced.toLocaleTimeString("id-ID")}</span>}
          <BtnGhost onClick={refresh}><RefreshCw size={13} className={stats.loading ? "animate-spin" : ""} /> Refresh</BtnGhost>
        </div>
      </div>

      <Async state={stats}>
        {(s) => (
          <>
            <div className="grid grid-cols-5 gap-4 mb-6">
              <StatCard label="Total User" value={s.totalUsers.toLocaleString("id-ID")} icon="👥" change={`+${s.newThisWeek} minggu ini`} up />
              <StatCard label="User Aktif" value={s.active7d.toLocaleString("id-ID")} icon="🟢" change={`${s.activeNow} online · ${s.active24h} hari ini`} up />
              <StatCard label="User Premium" value={s.premium.toLocaleString("id-ID")} icon="⭐" change={s.totalUsers ? `${Math.round((s.premium / s.totalUsers) * 100)}% konversi` : "—"} up />
              <StatCard label="Total Anak" value={s.totalChildren.toLocaleString("id-ID")} icon="👶" change="Profil terdaftar" up />
              <StatCard label="Milestone Tercapai" value={s.milestonesAchieved.toLocaleString("id-ID")} icon="🌱" change={`${s.tasksDone} task selesai`} up />
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-4 mb-6">
              <Card>
                <CardHeader title="📈 User Baru per Bulan" meta="Dari created_at user" />
                <div className="p-5 pt-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={s.growthByMonth.map((r) => ({ month: shortMonth(r.month), "User Baru": r.count }))} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="User Baru" stroke={G.gold} strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card>
                <CardHeader title="🥧 Distribusi Plan" />
                <div className="p-5 pt-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={s.planDistribution.map((p) => ({ name: p.plan === "premium" ? "Premium" : "Free", value: p.count }))} dataKey="value" cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                        {s.planDistribution.map((p, i) => <Cell key={i} fill={p.plan === "premium" ? G.gold : G.dark} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}
      </Async>

      <Card className="overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <h3 className="text-sm font-bold">🆕 User Terbaru</h3>
          <BtnGhost onClick={() => setActivePage("users")}>Lihat Semua →</BtnGhost>
        </div>
        <Async state={users}>
          {(list) => (
            <table className="w-full border-collapse">
              <thead><tr>{["User", "Registrasi", "Anak", "Plan", "Status"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {list.slice(0, 5).map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><AvatarCircle name={u.name} color={colorOf(u.id)} /><div><div className="text-sm font-semibold">{u.name}</div><div className="text-[11px] text-gray-400">{u.email}</div></div></div></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-sm">{u.kids} anak</td>
                    <td className="px-4 py-3"><Badge type={u.plan === "premium" ? "gold" : "gray"}>{planLabel(u.plan)}</Badge></td>
                    <td className="px-4 py-3"><Badge type={u.status === "active" ? "green" : "red"}>{u.status === "active" ? "● Aktif" : "⊘ Suspended"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Async>
      </Card>
    </div>
  );
}

// ── PAGE: USERS
function PageUsers({ showToast, openModal }: { showToast: (m: string) => void; openModal: (id: string, payload?: unknown) => void }) {
  const users = useAsync(() => adminApi.users(), []);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const all = users.data ?? [];
  const filtered = useMemo(() => all.filter((u) => {
    const q = search.toLowerCase();
    const mq = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phone ?? "").includes(q);
    const mp = !filterPlan || u.plan === filterPlan;
    const ms = !filterStatus || u.status === filterStatus;
    return mq && mp && ms;
  }), [all, search, filterPlan, filterStatus]);

  const allChecked = filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const toggleAll = () => setSelected((p) => { const n = new Set(p); allChecked ? filtered.forEach((u) => n.delete(u.id)) : filtered.forEach((u) => n.add(u.id)); return n; });
  const toggleOne = (id: string) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectedUsers = all.filter((u) => selected.has(u.id));

  const runBulk = async (action: "suspend" | "activate" | "delete") => {
    if (action === "delete" && !confirm(`Hapus ${selected.size} user terpilih secara permanen? Semua data mereka ikut terhapus. (Akun admin/superadmin tidak akan terhapus.)`)) return;
    setBusy(true);
    try { const r = await adminApi.bulkUsers(Array.from(selected), action); const verb = action === "suspend" ? "disuspend" : action === "activate" ? "diaktifkan" : "dihapus"; showToast(`✅ ${r.affected} user ${verb}`); setSelected(new Set()); await users.reload(); }
    catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); }
    finally { setBusy(false); }
  };
  const delUser = async (u: AdminUser) => {
    if (!confirm(`Hapus ${u.name} (${u.email}) secara permanen? Semua datanya ikut terhapus.`)) return;
    try { await adminApi.deleteUser(u.id); showToast(`🗑 ${u.name} dihapus`); setSelected((p) => { const n = new Set(p); n.delete(u.id); return n; }); await users.reload(); }
    catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); }
  };
  const toggleStatus = async (u: AdminUser) => {
    try { await adminApi.updateUser(u.id, { status: u.status === "active" ? "suspended" : "active" }); showToast(`⚠️ ${u.name} ${u.status === "active" ? "disuspend" : "diaktifkan"}`); await users.reload(); }
    catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); }
  };

  return (
    <div>
      <PageHead title="Manajemen User" sub="Kelola semua akun pengguna — data langsung dari DB">
        <BtnGhost onClick={() => { downloadCsv(`users-${Date.now()}.csv`, filtered.map((u) => ({ id: u.id, nama: u.name, email: u.email, phone: u.phone ?? "", role: u.role, status: u.status, plan: u.plan, anak: u.kids, bergabung: u.createdAt }))); showToast(`📤 ${filtered.length} user diexport`); }}><Download size={14} /> Export CSV</BtnGhost>
        <BtnPrimary onClick={() => openModal("add-user", users.reload)}><Plus size={14} /> Tambah User</BtnPrimary>
      </PageHead>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[[all.length, "Total User", ""], [all.filter((u) => u.plan === "premium").length, "User Premium", "gold"], [all.filter((u) => u.status === "suspended").length, "User Suspended", "red"]].map(([v, l, t]) => (
          <div key={l as string} className="bg-white rounded-xl p-4 shadow-[0_1px_4px_rgba(0,0,0,0.08)] text-center">
            <div className="text-2xl font-extrabold" style={{ color: t === "gold" ? G.gold : t === "red" ? G.red : G.dark }}>{v as number}</div>
            <div className="text-xs text-gray-400 mt-0.5">{l as string}</div>
          </div>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2.5 bg-[#1A1A2E] text-white rounded-xl px-4 py-2.5 mb-3">
          <span className="text-sm font-semibold">{selected.size} dipilih</span>
          <div className="flex-1" />
          <BtnWa onClick={() => openModal("wa-broadcast", selectedUsers.filter((u) => u.phone))}><MessageCircle size={14} /> Broadcast WhatsApp</BtnWa>
          <button disabled={busy} onClick={() => runBulk("activate")} className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-sm font-semibold bg-[rgba(16,185,129,0.2)] text-[#34D399] hover:bg-[rgba(16,185,129,0.3)] disabled:opacity-50"><Check size={14} /> Aktifkan</button>
          <button disabled={busy} onClick={() => runBulk("suspend")} className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-sm font-semibold bg-[rgba(239,68,68,0.2)] text-[#F87171] hover:bg-[rgba(239,68,68,0.3)] disabled:opacity-50"><Ban size={14} /> Suspend</button>
          <button disabled={busy} onClick={() => runBulk("delete")} className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-sm font-semibold bg-[rgba(239,68,68,0.85)] text-white hover:bg-[#EF4444] disabled:opacity-50"><Trash2 size={14} /> Hapus</button>
          <button onClick={() => setSelected(new Set())} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10"><X size={14} /></button>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-2.5 border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-[7px] flex-1 min-w-[180px]">
            <Search size={14} className="text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, email, no. HP..." className="border-0 bg-transparent text-sm text-[#1A1A2E] outline-none flex-1 placeholder:text-gray-400" />
          </div>
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="px-2.5 py-[7px] border border-gray-200 rounded-lg text-sm bg-white outline-none cursor-pointer"><option value="">Semua Plan</option><option value="premium">Premium</option><option value="free">Free</option></select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-2.5 py-[7px] border border-gray-200 rounded-lg text-sm bg-white outline-none cursor-pointer"><option value="">Semua Status</option><option value="active">Aktif</option><option value="suspended">Suspended</option></select>
          <IconBtn onClick={users.reload} title="Refresh"><RefreshCw size={13} /></IconBtn>
        </div>
        {users.loading && !users.data ? <Spinner /> : users.error ? <ErrorState msg={users.error} onRetry={users.reload} /> : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-2.5 bg-gray-50 border-b border-gray-100"><input type="checkbox" className="rounded cursor-pointer accent-[#C9A227]" checked={allChecked} onChange={toggleAll} /></th>
                {["User", "Kontak", "Bergabung", "Anak", "Plan", "Status", "Aksi"].map((h) => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">Tidak ada user ditemukan</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50/50 border-b border-gray-100 last:border-0 ${selected.has(u.id) ? "bg-[rgba(201,162,39,0.06)]" : ""}`}>
                  <td className="px-4 py-3"><input type="checkbox" className="rounded cursor-pointer accent-[#C9A227]" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><AvatarCircle name={u.name} color={colorOf(u.id)} /><div><div className="text-sm font-semibold flex items-center gap-1.5">{u.name}{u.role !== "user" && <Badge type="purple">{u.role}</Badge>}</div><div className="text-[11px] text-gray-400">{u.email}</div></div></div></td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-sm font-semibold">{u.kids}</td>
                  <td className="px-4 py-3"><Badge type={u.plan === "premium" ? "gold" : "gray"}>{planLabel(u.plan)}</Badge></td>
                  <td className="px-4 py-3"><Badge type={u.status === "active" ? "green" : "red"}>{u.status === "active" ? "● Aktif" : "⊘ Suspended"}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <IconBtn onClick={() => openModal("user-detail", u)} title="Detail"><Eye size={12} /></IconBtn>
                      <IconBtn onClick={() => openModal("edit-user", { user: u, reload: users.reload })} title="Edit"><Pencil size={12} /></IconBtn>
                      {u.phone && <WaBtn phone={u.phone} text={`Halo ${u.name}, dari tim Jurnal Emas Si Kecil 👋`} />}
                      <IconBtn onClick={() => toggleStatus(u)} danger title="Suspend/Aktifkan"><Ban size={12} /></IconBtn>
                      {u.role !== "superadmin" && <IconBtn onClick={() => delUser(u)} danger title="Hapus permanen"><Trash2 size={12} /></IconBtn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">Menampilkan {filtered.length} dari {all.length} user</div>
      </Card>
    </div>
  );
}

// ── PAGE: CHILDREN
function PageChildren({ showToast }: { showToast: (m: string) => void }) {
  const children = useAsync(() => adminApi.children(), []);
  const [search, setSearch] = useState("");

  const all = children.data ?? [];
  const filtered = useMemo(() => all.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.parentName.toLowerCase().includes(q);
  }), [all, search]);

  return (
    <div>
      <PageHead title="Data Anak per User" sub="Profil anak yang tertaut ke tiap akun orang tua">
        <BtnGhost onClick={() => { downloadCsv(`anak-${Date.now()}.csv`, filtered.map((c) => ({ id: c.id, nama: c.name, gender: c.gender, lahir: c.dob, usia: ageFromDob(c.dob), orangtua: c.parentName, email_ortu: c.parentEmail, hp_ortu: c.parentPhone ?? "" }))); showToast(`📤 ${filtered.length} data anak diexport`); }}><Download size={14} /> Export</BtnGhost>
      </PageHead>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[[all.length, "Total Anak", ""], [all.filter((c) => c.gender === "L").length, "Laki-laki", "blue"], [all.filter((c) => c.gender === "P").length, "Perempuan", "purple"]].map(([v, l, t]) => (
          <div key={l as string} className="bg-white rounded-xl px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <div className="text-xs text-gray-400">{l as string}</div>
            <div className="text-xl font-extrabold mt-0.5" style={{ color: t === "blue" ? G.blue : t === "purple" ? G.purple : G.dark }}>{v as number}</div>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 flex items-center gap-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-[7px] max-w-[260px] flex-1">
            <Search size={14} className="text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama anak / orang tua..." className="border-0 bg-transparent text-sm outline-none flex-1 placeholder:text-gray-400" />
          </div>
          <IconBtn onClick={children.reload} title="Refresh"><RefreshCw size={13} /></IconBtn>
        </div>
        {children.loading && !children.data ? <Spinner /> : children.error ? <ErrorState msg={children.error} onRetry={children.reload} /> : (
          <table className="w-full border-collapse">
            <thead><tr>{["Anak", "Orang Tua", "Tgl Lahir", "Usia", "BB / TB Lahir", "Aksi"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Tidak ada data anak</td></tr> : filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: c.color || colorOf(c.id) }}>{c.gender === "L" ? "♂" : "♀"}</div><div><div className="text-sm font-semibold">{c.name}</div><div className="text-[11px] text-gray-400">{c.gender === "L" ? "Laki-laki" : "Perempuan"}</div></div></div></td>
                  <td className="px-4 py-3"><div className="text-sm font-medium">{c.parentName}</div><div className="text-[11px] text-gray-400">{c.parentEmail}</div></td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(c.dob)}</td>
                  <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">{ageFromDob(c.dob)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{c.birthWeight ? `${c.birthWeight} kg` : "—"} / {c.birthHeight ? `${c.birthHeight} cm` : "—"}</td>
                  <td className="px-4 py-3">{c.parentPhone ? <WaBtn phone={c.parentPhone} text={`Halo ${c.parentName}, terkait data ${c.name} di Jurnal Emas 👋`} /> : <span className="text-[11px] text-gray-300">no HP -</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── PAGE: SUBSCRIPTIONS
function PageSubscriptions({ showToast }: { showToast: (m: string) => void }) {
  const subs = useAsync(() => adminApi.subscriptions(), []);
  const all = subs.data ?? [];
  const premium = all.filter((s) => s.plan === "premium").length;

  return (
    <div>
      <PageHead title="Manajemen Subscription" sub="Semua record langganan tertaut ke user">
        <BtnGhost onClick={() => { downloadCsv(`langganan-${Date.now()}.csv`, all.map((s) => ({ id: s.id, user: s.userName, email: s.userEmail, plan: s.plan, status: s.status, mulai: s.startedAt, berakhir: s.expiresAt ?? "", payment_id: s.paymentId ?? "" }))); showToast(`📤 ${all.length} langganan diexport`); }}><Download size={14} /> Export</BtnGhost>
      </PageHead>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Langganan" value={String(all.length)} icon="💳" change="Record di DB" up />
        <StatCard label="Premium Aktif" value={String(premium)} icon="⭐" change={`${all.length - premium} free`} up />
        <StatCard label="Integrasi Midtrans" value="—" icon="🔌" change="Belum aktif (kolom DB saja)" up={false} />
      </div>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between"><h3 className="text-sm font-bold">Daftar Subscription</h3><IconBtn onClick={subs.reload} title="Refresh"><RefreshCw size={13} /></IconBtn></div>
        {subs.loading && !subs.data ? <Spinner /> : subs.error ? <ErrorState msg={subs.error} onRetry={subs.reload} /> : (
          <table className="w-full border-collapse">
            <thead><tr>{["User", "Plan", "Status", "Mulai", "Berakhir", "Payment ID"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {all.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Belum ada langganan</td></tr> : all.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><AvatarCircle name={s.userName} color={colorOf(s.userId)} /><div><div className="text-sm font-medium">{s.userName}</div><div className="text-[11px] text-gray-400">{s.userEmail}</div></div></div></td>
                  <td className="px-4 py-3"><Badge type={s.plan === "premium" ? "gold" : "gray"}>{planLabel(s.plan)}</Badge></td>
                  <td className="px-4 py-3"><Badge type={s.status === "active" ? "green" : "red"}>{s.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(s.startedAt)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(s.expiresAt)}</td>
                  <td className="px-4 py-3 text-[11px] text-gray-400 font-mono">{s.paymentId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── PAGE: MILESTONES
function PageMilestones({ showToast, openModal }: { showToast: (m: string) => void; openModal: (id: string, payload?: unknown) => void }) {
  const data = useAsync(() => adminApi.content<RefMilestone>("milestones"), []);
  const del = async (id: string) => { if (!confirm("Hapus milestone ini?")) return; try { await adminApi.deleteContent("milestones", id); showToast("🗑 Milestone dihapus"); await data.reload(); } catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); } };

  return (
    <div>
      <PageHead title="Database Milestone" sub="Konten referensi milestone (WHO & IDAI) — tabel ref_milestones">
        <BtnPrimary onClick={() => openModal("add-content", { kind: "milestones", reload: data.reload })}><Plus size={14} /> Tambah Milestone</BtnPrimary>
      </PageHead>
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"><Sprout size={15} className="text-[#10B981]" /><h3 className="text-sm font-bold">Master Milestone</h3><div className="flex-1" /><IconBtn onClick={data.reload} title="Refresh"><RefreshCw size={13} /></IconBtn></div>
        <Async state={data}>
          {(rows) => (
            <table className="w-full border-collapse">
              <thead><tr>{["Domain", "Usia (bln)", "Judul", "Kritis?", "Referensi", "Aksi"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Belum ada data</td></tr> : rows.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3"><Badge type="blue">{m.domain}</Badge></td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{m.ageMinMonths}–{m.ageMaxMonths}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{m.title}</td>
                    <td className="px-4 py-3"><Badge type={m.isCritical ? "red" : "gray"}>{m.isCritical ? "⚠ Kritis" : "Normal"}</Badge></td>
                    <td className="px-4 py-3 text-[11px] text-gray-400">{m.reference || "—"}</td>
                    <td className="px-4 py-3"><div className="flex gap-1.5"><IconBtn onClick={() => openModal("edit-content", { kind: "milestones", item: m, reload: data.reload })} title="Edit"><Pencil size={11} /></IconBtn><IconBtn onClick={() => del(m.id)} danger><Trash2 size={11} /></IconBtn></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Async>
      </Card>
    </div>
  );
}

// ── PAGE: IMUNISASI
function PageImunisasi({ showToast, openModal }: { showToast: (m: string) => void; openModal: (id: string, payload?: unknown) => void }) {
  const data = useAsync(() => adminApi.content<RefImmunization>("immunizations"), []);
  const del = async (id: string) => { if (!confirm("Hapus vaksin ini?")) return; try { await adminApi.deleteContent("immunizations", id); showToast("🗑 Vaksin dihapus"); await data.reload(); } catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); } };

  return (
    <div>
      <PageHead title="Konten Imunisasi" sub="Jadwal imunisasi (acuan IDAI) — tabel ref_immunizations">
        <BtnPrimary onClick={() => openModal("add-content", { kind: "immunizations", reload: data.reload })}><Plus size={14} /> Tambah Vaksin</BtnPrimary>
      </PageHead>
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"><Syringe size={15} className="text-[#EF4444]" /><h3 className="text-sm font-bold">Master Imunisasi</h3><div className="flex-1" /><IconBtn onClick={data.reload} title="Refresh"><RefreshCw size={13} /></IconBtn></div>
        <Async state={data}>
          {(rows) => (
            <table className="w-full border-collapse">
              <thead><tr>{["Vaksin", "Usia", "Dosis", "Tipe", "Keterangan", "Aksi"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Belum ada data</td></tr> : rows.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-semibold">{v.vaccine}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{v.ageLabel}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{v.doses}</td>
                    <td className="px-4 py-3"><Badge type={v.mandatory ? "green" : "orange"}>{v.mandatory ? "Wajib" : "Anjuran"}</Badge></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{v.note}</td>
                    <td className="px-4 py-3"><div className="flex gap-1.5"><IconBtn onClick={() => openModal("edit-content", { kind: "immunizations", item: v, reload: data.reload })} title="Edit"><Pencil size={11} /></IconBtn><IconBtn onClick={() => del(v.id)} danger><Trash2 size={11} /></IconBtn></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Async>
      </Card>
    </div>
  );
}

// ── PAGE: GIGI
function PageGigi({ showToast, openModal }: { showToast: (m: string) => void; openModal: (id: string, payload?: unknown) => void }) {
  const data = useAsync(() => adminApi.content<RefTooth>("teeth"), []);
  const del = async (id: string) => { if (!confirm("Hapus data gigi ini?")) return; try { await adminApi.deleteContent("teeth", id); showToast("🗑 Data gigi dihapus"); await data.reload(); } catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); } };

  return (
    <div>
      <PageHead title="Konten Gigi Susu" sub="Urutan tumbuh & tanggal gigi susu — tabel ref_teeth">
        <BtnPrimary onClick={() => openModal("add-content", { kind: "teeth", reload: data.reload })}><Plus size={14} /> Tambah Gigi</BtnPrimary>
      </PageHead>
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"><Smile size={15} className="text-[#3B82F6]" /><h3 className="text-sm font-bold">Master Gigi Susu</h3><div className="flex-1" /><IconBtn onClick={data.reload} title="Refresh"><RefreshCw size={13} /></IconBtn></div>
        <Async state={data}>
          {(rows) => (
            <table className="w-full border-collapse">
              <thead><tr>{["Gigi", "Posisi", "Usia Tumbuh", "Usia Tanggal", "Jumlah", "Aksi"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Belum ada data</td></tr> : rows.map((g) => (
                  <tr key={g.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-semibold">{g.name}</td>
                    <td className="px-4 py-3"><Badge type={g.position.includes("atas") ? "blue" : "purple"}>{g.position}</Badge></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{g.eruptAgeLabel}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{g.sheddAgeLabel}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{g.count}</td>
                    <td className="px-4 py-3"><div className="flex gap-1.5"><IconBtn onClick={() => openModal("edit-content", { kind: "teeth", item: g, reload: data.reload })} title="Edit"><Pencil size={11} /></IconBtn><IconBtn onClick={() => del(g.id)} danger><Trash2 size={11} /></IconBtn></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Async>
      </Card>
    </div>
  );
}

// ── PAGE: TIDUR
function PageTidur({ showToast, openModal }: { showToast: (m: string) => void; openModal: (id: string, payload?: unknown) => void }) {
  const data = useAsync(() => adminApi.content<RefSleep>("sleep"), []);
  const del = async (id: string) => { if (!confirm("Hapus panduan ini?")) return; try { await adminApi.deleteContent("sleep", id); showToast("🗑 Panduan dihapus"); await data.reload(); } catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); } };

  return (
    <div>
      <PageHead title="Konten Jadwal Tidur" sub="Rekomendasi durasi tidur per usia (NSF) — tabel ref_sleep">
        <BtnPrimary onClick={() => openModal("add-content", { kind: "sleep", reload: data.reload })}><Plus size={14} /> Tambah Panduan</BtnPrimary>
      </PageHead>
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"><Moon size={15} className="text-[#8B5CF6]" /><h3 className="text-sm font-bold">Master Jadwal Tidur</h3><div className="flex-1" /><IconBtn onClick={data.reload} title="Refresh"><RefreshCw size={13} /></IconBtn></div>
        <Async state={data}>
          {(rows) => (
            <table className="w-full border-collapse">
              <thead><tr>{["Kelompok", "Usia", "Total/Hari", "Malam", "Siang", "Catatan", "Aksi"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {rows.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Belum ada data</td></tr> : rows.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-semibold">{t.groupName}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{t.ageLabel}</td>
                    <td className="px-4 py-3"><Badge type="purple">{t.totalLabel}</Badge></td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{t.nightLabel}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{t.napLabel}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{t.note}</td>
                    <td className="px-4 py-3"><div className="flex gap-1.5"><IconBtn onClick={() => openModal("edit-content", { kind: "sleep", item: t, reload: data.reload })} title="Edit"><Pencil size={11} /></IconBtn><IconBtn onClick={() => del(t.id)} danger><Trash2 size={11} /></IconBtn></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Async>
      </Card>
    </div>
  );
}

// ── PAGE: ROLES
function PageRoles({ showToast }: { showToast: (m: string) => void }) {
  const data = useAsync(() => adminApi.roles(), []);
  const [rows, setRows] = useState<RolePermission[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data.data) setRows(data.data); }, [data.data]);

  const toggle = (id: string, key: "freeEnabled" | "premiumEnabled") => setRows((p) => p.map((r) => r.id === id ? { ...r, [key]: !r[key] } : r));
  const save = async () => {
    setSaving(true);
    try { const saved = await adminApi.saveRoles(rows.map((r) => ({ id: r.id, freeEnabled: r.freeEnabled, premiumEnabled: r.premiumEnabled }))); setRows(saved); data.setData(saved); showToast("✅ Pengaturan akses role disimpan"); }
    catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); }
    finally { setSaving(false); }
  };

  const freeCount = rows.filter((r) => r.freeEnabled).length;
  const premiumCount = rows.filter((r) => r.premiumEnabled).length;

  return (
    <div>
      <PageHead title="Manajemen Role & Akses" sub="Atur fitur/menu yang bisa diakses tiap role — tabel role_permissions">
        <BtnPrimary onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Simpan Perubahan</BtnPrimary>
      </PageHead>

      {data.loading && !data.data ? <Spinner /> : data.error ? <ErrorState msg={data.error} onRetry={data.reload} /> : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-white rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border-l-4 border-gray-300">
              <div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="text-base font-bold">Free</span><Badge type="gray">Gratis</Badge></div><div className="text-xs text-gray-400 mt-1">Rp 0 / selamanya</div></div><div className="text-right"><div className="text-2xl font-extrabold">{freeCount}<span className="text-sm text-gray-400">/{rows.length}</span></div><div className="text-[11px] text-gray-400">fitur aktif</div></div></div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.08)] border-l-4 border-[#C9A227]">
              <div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="text-base font-bold">Premium</span><Badge type="gold">⭐ Berbayar</Badge></div><div className="text-xs text-gray-400 mt-1">Rp 49rb/bln · Rp 399rb/thn</div></div><div className="text-right"><div className="text-2xl font-extrabold text-[#C9A227]">{premiumCount}<span className="text-sm text-gray-400">/{rows.length}</span></div><div className="text-[11px] text-gray-400">fitur aktif</div></div></div>
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"><ShieldCheck size={15} className="text-[#C9A227]" /><h3 className="text-sm font-bold">Matriks Hak Akses Fitur</h3></div>
            <table className="w-full border-collapse">
              <thead><tr><Th>Fitur / Menu</Th><th className="px-4 py-2.5 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">Free</th><th className="px-4 py-2.5 text-center text-[11px] font-bold text-[#C9A227] uppercase tracking-wider bg-[rgba(201,162,39,0.06)] border-b border-gray-100">Premium</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-medium">{r.feature}</td>
                    <td className="px-4 py-3 text-center"><div className="flex justify-center"><Toggle checked={r.freeEnabled} onChange={() => toggle(r.id, "freeEnabled")} /></div></td>
                    <td className="px-4 py-3 text-center bg-[rgba(201,162,39,0.03)]"><div className="flex justify-center"><Toggle checked={r.premiumEnabled} onChange={() => toggle(r.id, "premiumEnabled")} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-[11px] text-gray-400 mt-3">💡 Tersimpan ke tabel role_permissions. Klik “Simpan Perubahan” untuk persist.</p>
        </>
      )}
    </div>
  );
}

// ── PAGE: NOTIFICATIONS
function PageNotifications({ openModal }: { openModal: (id: string, payload?: unknown) => void }) {
  const history = useAsync(() => adminApi.notifications(), []);
  return (
    <div>
      <PageHead title="Manajemen Notifikasi" sub="Broadcast in-app (live, tertulis ke tabel notifications) + WhatsApp">
        <BtnWa onClick={() => openModal("wa-broadcast", [])}><MessageCircle size={14} /> Broadcast WhatsApp</BtnWa>
        <BtnPrimary onClick={() => openModal("broadcast")}><Megaphone size={14} /> Kirim Broadcast</BtnPrimary>
      </PageHead>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">Riwayat Broadcast</h3>
        <IconBtn onClick={history.reload} title="Refresh"><RefreshCw size={13} /></IconBtn>
      </div>

      {history.loading && !history.data ? <Spinner /> : history.error ? <ErrorState msg={history.error} onRetry={history.reload} /> : (history.data ?? []).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          Belum ada notifikasi terkirim. Klik “Kirim Broadcast” untuk mengirim yang pertama.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(history.data ?? []).map((n, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3.5 items-start shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 bg-[rgba(201,162,39,0.12)]">📢</div>
              <div className="flex-1">
                <div className="text-sm font-bold">{n.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">✅ {fmtDate(n.date)} · Terkirim ke {n.recipients} user · Dibaca {n.read} ({n.openRate}%) · Tipe: {n.type}</div>
                <div className="text-xs text-[#1A1A2E] mt-1.5">{n.body}</div>
              </div>
              <Badge type="green"><CheckCircle2 size={9} /> Terkirim</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PAGE: ANALYTICS
function PageAnalytics({ refreshSignal }: { refreshSignal: number }) {
  const stats = useAsync(() => adminApi.stats(), [refreshSignal]);
  const [synced, setSynced] = useState<Date | null>(null);
  useEffect(() => { if (stats.data) setSynced(new Date()); }, [stats.data]);

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-bold mb-1">Analytics & Insights</h2>
          <p className="text-sm text-gray-400">Agregat nyata dari database</p>
        </div>
        <div className="flex items-center gap-3">
          {synced && <span className="text-[11px] text-gray-400">Diperbarui {synced.toLocaleTimeString("id-ID")}</span>}
          <BtnGhost onClick={stats.reload}><RefreshCw size={13} className={stats.loading ? "animate-spin" : ""} /> Refresh</BtnGhost>
        </div>
      </div>
      <Async state={stats}>
        {(s) => (
          <>
          <div className="grid grid-cols-5 gap-4 mb-6">
            <StatCard label="Total User" value={s.totalUsers.toLocaleString("id-ID")} icon="👥" change={`+${s.newThisWeek} minggu ini`} up />
            <StatCard label="User Aktif (7 hari)" value={s.active7d.toLocaleString("id-ID")} icon="🟢" change={`${s.activeNow} online · ${s.active24h} hari ini`} up />
            <StatCard label="MRR (estimasi)" value={`Rp ${s.mrr.toLocaleString("id-ID")}`} icon="💰" change={`${s.premium} premium × harga bln`} up />
            <StatCard label="Milestone Tercapai" value={s.milestonesAchieved.toLocaleString("id-ID")} icon="🌱" change={`${s.tasksDone} task selesai`} up />
            <StatCard label="Konten Referensi" value={String(s.contentCounts.milestones + s.contentCounts.immunizations + s.contentCounts.teeth + s.contentCounts.sleep)} icon="📚" change={`${s.contentCounts.milestones} milestone · ${s.contentCounts.immunizations} vaksin`} up />
          </div>
          <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader title="🚀 Funnel Aktivasi" meta="· % dari total user" />
          <div className="p-5 pt-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={s.activation} layout="vertical" margin={{ top: 5, right: 36, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} /><YAxis dataKey="step" type="category" tick={{ fontSize: 11 }} width={120} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number, _n, p) => [`${v}% · ${(p?.payload as { users: number }).users.toLocaleString("id-ID")} user`, "Capai"]} />
                <Bar dataKey="pct" name="Capai" radius={[0, 4, 4, 0]}>{s.activation.map((_, i) => <Cell key={i} fill={`rgba(201,162,39,${1 - i * 0.16})`} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="🏆 Modul Paling Digunakan" meta="· % user dgn data" />
          <div className="p-5 pt-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={s.moduleUsage} layout="vertical" margin={{ top: 5, right: 36, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} /><YAxis dataKey="module" type="category" tick={{ fontSize: 11 }} width={120} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number, _n, p) => [`${v}% · ${(p?.payload as { users: number }).users.toLocaleString("id-ID")} user`, "Adopsi"]} />
                <Bar dataKey="pct" name="Adopsi" radius={[0, 4, 4, 0]}>{s.moduleUsage.map((_, i) => <Cell key={i} fill={i === 0 ? G.dark : i < 3 ? G.gold : `rgba(201,162,39,${0.7 - i * 0.07})`} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="col-span-2">
          <CardHeader title="💳 Revenue Bulanan" meta="· nyata dari transaksi Midtrans terbayar" />
          <div className="p-5 pt-3">
            {s.revenueByMonth.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">Belum ada transaksi terbayar.</div>
            ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={s.revenueByMonth.map((r) => ({ ...r, label: shortMonth(r.month) }))} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}k`} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number, _n, p) => [`Rp ${v.toLocaleString("id-ID")} · ${(p?.payload as { count: number }).count} transaksi`, "Revenue"]} />
                <Bar dataKey="revenue" name="Revenue" radius={[3, 3, 0, 0]}>{s.revenueByMonth.map((d, i) => <Cell key={i} fill={d.revenue > 0 ? G.gold : "rgba(201,162,39,0.4)"} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </Card>
          </div>
          </>
        )}
      </Async>
    </div>
  );
}

// ── PAGE: SETTINGS (+ discounts, live)
function PageSettings({ showToast }: { showToast: (m: string) => void }) {
  const settings = useAsync(() => adminApi.settings(), []);
  const discounts = useAsync(() => adminApi.discounts(), []);
  const [form, setForm] = useState<Record<string, string>>({});
  const [savingS, setSavingS] = useState(false);
  useEffect(() => { if (settings.data) setForm(settings.data); }, [settings.data]);
  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const saveSettings = async () => {
    setSavingS(true);
    try { const s = await adminApi.saveSettings(form); setForm(s); settings.setData(s); showToast("✅ Pengaturan disimpan"); }
    catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); }
    finally { setSavingS(false); }
  };

  // discount add
  const [code, setCode] = useState(""); const [dtype, setDtype] = useState<"percent" | "fixed">("percent"); const [dval, setDval] = useState("");
  const addDiscount = async () => {
    if (!code.trim() || !dval.trim()) { showToast("⚠️ Isi kode & nilai diskon"); return; }
    try { await adminApi.createDiscount({ code: code.toUpperCase().replace(/\s/g, ""), type: dtype, value: Number(dval), description: "Kode baru" }); setCode(""); setDval(""); showToast("✅ Kode diskon ditambahkan"); await discounts.reload(); }
    catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); }
  };
  const toggleDiscount = async (d: DiscountCode) => { try { await adminApi.updateDiscount(d.id, { active: !d.active }); await discounts.reload(); } catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); } };
  const removeDiscount = async (id: string) => { try { await adminApi.deleteDiscount(id); showToast("🗑 Kode dihapus"); await discounts.reload(); } catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); } };

  const integrations = [
    { name: "Midtrans Payment", desc: "Belum diimplementasi", warn: false },
    { name: "Cloudinary CDN", desc: "Upload foto belum aktif", warn: false },
    { name: "Resend Email", desc: "Mailer belum dikonfigurasi", warn: false },
    { name: "Google OAuth", desc: "Config ada, credential kosong", warn: true },
    { name: "WhatsApp Business API", desc: "Broadcast via wa.me (manual)", warn: true },
  ];

  return (
    <div>
      <h2 className="text-base font-bold mb-1">Pengaturan Sistem</h2>
      <p className="text-sm text-gray-400 mb-5">Tersimpan ke tabel platform_settings & discount_codes</p>

      {settings.loading && !settings.data ? <Spinner /> : settings.error ? <ErrorState msg={settings.error} onRetry={settings.reload} /> : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5">
            <h4 className="text-sm font-bold mb-3.5 flex items-center gap-2"><Settings size={14} /> Pengaturan Umum</h4>
            <FormGroup label="Nama Platform"><Input value={form.platform_name ?? ""} onChange={(e) => setF("platform_name", e.target.value)} /></FormGroup>
            <FormGroup label="URL Platform"><Input value={form.platform_url ?? ""} onChange={(e) => setF("platform_url", e.target.value)} /></FormGroup>
            <FormGroup label="Email Support"><Input value={form.support_email ?? ""} onChange={(e) => setF("support_email", e.target.value)} /></FormGroup>
            <FormGroup label="WhatsApp Admin (CS)"><Input value={form.admin_whatsapp ?? ""} onChange={(e) => setF("admin_whatsapp", e.target.value)} /></FormGroup>
            <BtnPrimary onClick={saveSettings} disabled={savingS}>{savingS ? <Loader2 size={14} className="animate-spin" /> : null} Simpan Perubahan</BtnPrimary>
          </div>

          <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5">
            <h4 className="text-sm font-bold mb-3.5 flex items-center gap-2"><CreditCard size={14} /> Harga & Trial</h4>
            <FormGroup label="Harga Bulanan (Rp)"><Input type="number" value={form.price_monthly ?? ""} onChange={(e) => setF("price_monthly", e.target.value)} /></FormGroup>
            <FormGroup label="Harga Tahunan (Rp)"><Input type="number" value={form.price_yearly ?? ""} onChange={(e) => setF("price_yearly", e.target.value)} /></FormGroup>
            <FormGroup label="Durasi Free Trial (hari)"><Input type="number" value={form.trial_days ?? ""} onChange={(e) => setF("trial_days", e.target.value)} /></FormGroup>
            <div className="flex items-center justify-between py-2"><div><div className="text-sm font-medium">Mode Free Trial</div><div className="text-[11px] text-gray-400">Izinkan coba Premium gratis</div></div><Toggle checked={form.trial_enabled === "true"} onChange={() => setF("trial_enabled", form.trial_enabled === "true" ? "false" : "true")} /></div>
          </div>

          {/* Discounts */}
          <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5 col-span-2">
            <h4 className="text-sm font-bold mb-3.5 flex items-center gap-2"><Tag size={14} className="text-[#C9A227]" /> Kode Diskon / Promo</h4>
            <div className="flex items-end gap-2 mb-4 flex-wrap">
              <div className="flex-1 min-w-[140px]"><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kode</label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="cth: HEMAT30" /></div>
              <div className="w-[140px]"><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tipe</label><Select value={dtype} onChange={(e) => setDtype(e.target.value as "percent" | "fixed")}><option value="percent">Persen (%)</option><option value="fixed">Nominal (Rp)</option></Select></div>
              <div className="w-[140px]"><label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nilai</label><Input type="number" value={dval} onChange={(e) => setDval(e.target.value)} placeholder={dtype === "percent" ? "30" : "20000"} /></div>
              <BtnPrimary onClick={addDiscount}><Plus size={14} /> Tambah Kode</BtnPrimary>
            </div>
            {discounts.loading && !discounts.data ? <Spinner /> : discounts.error ? <ErrorState msg={discounts.error} onRetry={discounts.reload} /> : (
              <div className="border border-gray-100 rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead><tr>{["Kode", "Diskon", "Deskripsi", "Penggunaan", "Berlaku s/d", "Status", "Aksi"].map((h) => <Th key={h}>{h}</Th>)}</tr></thead>
                  <tbody>
                    {(discounts.data ?? []).map((d) => (
                      <tr key={d.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-2.5"><span className="font-mono text-xs font-bold bg-[rgba(201,162,39,0.12)] text-[#8B6914] px-2 py-1 rounded">{d.code}</span></td>
                        <td className="px-4 py-2.5 text-sm font-bold">{d.type === "percent" ? `${d.value}%` : `Rp ${d.value.toLocaleString("id-ID")}`}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{d.description}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">{d.usedCount} / {d.maxUsage ?? "∞"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">{fmtDate(d.expiresAt)}</td>
                        <td className="px-4 py-2.5"><Badge type={d.active ? "green" : "gray"}>{d.active ? "Aktif" : "Nonaktif"}</Badge></td>
                        <td className="px-4 py-2.5"><div className="flex items-center gap-1.5"><Toggle checked={d.active} onChange={() => toggleDiscount(d)} /><IconBtn onClick={() => removeDiscount(d.id)} danger title="Hapus"><Trash2 size={11} /></IconBtn></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.08)] p-5 col-span-2">
            <h4 className="text-sm font-bold mb-3.5 flex items-center gap-2"><Wifi size={14} /> Integrasi API <span className="ml-1 text-[10px] font-normal text-gray-400">(status sebenarnya)</span></h4>
            <div className="grid grid-cols-2 gap-x-6">
              {integrations.map((item) => (
                <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-100"><div><div className="text-sm font-medium">{item.name}</div><div className="text-[11px] text-gray-400">{item.desc}</div></div>{item.warn ? <Badge type="orange"><AlertCircle size={9} /> Perlu Konfigurasi</Badge> : <Badge type="red"><WifiOff size={9} /> Belum aktif</Badge>}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MODALS
function ModalUserDetail({ user, onClose, showToast }: { user: AdminUser; onClose: () => void; showToast: (m: string) => void }) {
  const kids = useAsync(() => adminApi.children({ userId: user.id }), [user.id]);
  return (
    <Modal id="modal-user-detail" title="Detail User" open onClose={onClose}
      footer={<>{user.phone && <BtnWa href={waLink(user.phone, `Halo ${user.name} 👋`)}><MessageCircle size={14} /> Chat WA</BtnWa>}<BtnGhost onClick={() => { showToast("📧 (mock) reset password"); onClose(); }}>🔑 Reset Password</BtnGhost><BtnPrimary onClick={onClose}>Tutup</BtnPrimary></>}>
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
        <AvatarCircle name={user.name} color={colorOf(user.id)} size="lg" />
        <div>
          <div className="text-base font-extrabold">{user.name}</div>
          <div className="text-sm text-gray-400">{user.email}</div>
          <div className="text-xs text-gray-400 mt-0.5">📱 {user.phone ?? "—"}</div>
          <div className="flex gap-1.5 mt-1.5"><Badge type={user.plan === "premium" ? "gold" : "gray"}>{planLabel(user.plan)}</Badge><Badge type={user.status === "active" ? "green" : "red"}>{user.status === "active" ? "● Aktif" : "⊘ Suspended"}</Badge>{user.role !== "user" && <Badge type="purple">{user.role}</Badge>}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {[["Bergabung", fmtDate(user.createdAt)], ["Jumlah Anak", `${user.kids}`], ["Plan Status", user.planStatus ?? "—"], ["Expired", fmtDate(user.expiresAt)]].map(([k, v]) => (
          <div key={k}><div className="text-[10px] text-gray-400 font-semibold uppercase mb-0.5">{k}</div><div className="text-sm font-semibold">{v}</div></div>
        ))}
      </div>
      <hr className="border-gray-100 my-3" />
      <div className="text-[11px] font-semibold text-gray-400 mb-2">DATA ANAK</div>
      {kids.loading ? <div className="text-xs text-gray-400 py-2">Memuat…</div> : (kids.data ?? []).length === 0 ? <div className="text-xs text-gray-400 py-2">Belum ada anak terdaftar</div> : (
        <div className="flex flex-col gap-2">
          {(kids.data ?? []).map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: c.color || colorOf(c.id) }}>{c.gender === "L" ? "♂" : "♀"}</div>
              <div className="flex-1"><div className="text-sm font-semibold">{c.name}</div><div className="text-[11px] text-gray-400">{ageFromDob(c.dob)} · lahir {fmtDate(c.dob)}</div></div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function ModalEditUser({ user, reload, onClose, showToast }: { user: AdminUser; reload: () => Promise<void> | void; onClose: () => void; showToast: (m: string) => void }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone ?? "", status: user.status, plan: user.plan, role: user.role });
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const save = async () => {
    setSaving(true);
    try { await adminApi.updateUser(user.id, { name: form.name, email: form.email, phone: form.phone, status: form.status, plan: form.plan, role: form.role }); showToast(`✅ Data ${form.name} diperbarui`); await reload(); onClose(); }
    catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); setSaving(false); }
  };
  return (
    <Modal id="modal-edit-user" title="✏️ Edit User" open onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : null} Simpan Perubahan</BtnPrimary></>}>
      <div className="flex items-center gap-3 mb-4"><AvatarCircle name={form.name} color={colorOf(user.id)} size="lg" /><div className="text-xs text-gray-400">ID #{user.id.slice(0, 8)} · Bergabung {fmtDate(user.createdAt)}</div></div>
      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Nama Lengkap"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} /></FormGroup>
        <FormGroup label="Email"><Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} /></FormGroup>
        <FormGroup label="Nomor HP / WhatsApp"><Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="08xx-xxxx-xxxx" /></FormGroup>
        <FormGroup label="Plan"><Select value={form.plan} onChange={(e) => set({ plan: e.target.value as AdminUser["plan"] })}><option value="free">Free</option><option value="premium">Premium</option></Select></FormGroup>
        <FormGroup label="Status Akun"><Select value={form.status} onChange={(e) => set({ status: e.target.value as AdminUser["status"] })}><option value="active">Aktif</option><option value="suspended">Suspended</option></Select></FormGroup>
        <FormGroup label="Role"><Select value={form.role} onChange={(e) => set({ role: e.target.value })}><option value="user">User</option><option value="admin">Admin</option><option value="superadmin">Super Admin</option></Select></FormGroup>
      </div>
      {form.phone && <div className="flex items-center gap-2 bg-[rgba(37,211,102,0.08)] border border-[rgba(37,211,102,0.2)] rounded-lg px-3 py-2.5"><MessageCircle size={15} className="text-[#25D366]" /><span className="text-xs text-gray-500 flex-1">Hubungi user via WhatsApp</span><BtnWa href={waLink(form.phone, `Halo ${form.name} 👋`)}>Buka Chat</BtnWa></div>}
    </Modal>
  );
}

function ModalAddUser({ reload, onClose, showToast }: { reload: () => Promise<void> | void; onClose: () => void; showToast: (m: string) => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", plan: "free" });
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const save = async () => {
    if (!form.name || !form.email || !form.password) { showToast("⚠️ Nama, email, password wajib"); return; }
    setSaving(true);
    try { await adminApi.createUser(form); showToast("✅ User berhasil ditambahkan"); await reload(); onClose(); }
    catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); setSaving(false); }
  };
  return (
    <Modal id="modal-add-user" title="➕ Tambah User Manual" open onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : null} Simpan User</BtnPrimary></>}>
      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Nama Lengkap"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="cth: Siti Rahayu" /></FormGroup>
        <FormGroup label="Email"><Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="email@gmail.com" /></FormGroup>
        <FormGroup label="Password Sementara"><Input type="password" value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder="Min. 8 karakter" /></FormGroup>
        <FormGroup label="Nomor HP / WhatsApp"><Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="08xx-xxxx-xxxx" /></FormGroup>
      </div>
      <FormGroup label="Plan Subscription"><Select value={form.plan} onChange={(e) => set({ plan: e.target.value })}><option value="free">Free</option><option value="premium">Premium</option></Select></FormGroup>
    </Modal>
  );
}

const CONTENT_FIELDS: Record<string, { key: string; label: string; type?: string; full?: boolean; options?: readonly string[] }[]> = {
  milestones: [
    { key: "title", label: "Judul Milestone", full: true }, { key: "domain", label: "Domain", options: MILESTONE_DOMAINS }, { key: "reference", label: "Referensi" },
    { key: "ageMinMonths", label: "Usia Min (bln)", type: "number" }, { key: "ageMaxMonths", label: "Usia Maks (bln)", type: "number" },
  ],
  immunizations: [
    { key: "vaccine", label: "Nama Vaksin", full: true }, { key: "ageLabel", label: "Usia Pemberian" }, { key: "doses", label: "Dosis" },
    { key: "ageMonths", label: "Usia (bln)", type: "number" }, { key: "note", label: "Keterangan", full: true },
  ],
  teeth: [
    { key: "name", label: "Nama Gigi", full: true }, { key: "position", label: "Posisi" }, { key: "eruptAgeLabel", label: "Usia Tumbuh" },
    { key: "sheddAgeLabel", label: "Usia Tanggal" }, { key: "count", label: "Jumlah", type: "number" },
  ],
  sleep: [
    { key: "groupName", label: "Kelompok Usia", full: true }, { key: "ageLabel", label: "Rentang Usia" }, { key: "totalLabel", label: "Total/Hari" },
    { key: "nightLabel", label: "Tidur Malam" }, { key: "napLabel", label: "Tidur Siang" }, { key: "note", label: "Catatan", full: true },
  ],
};
const CONTENT_TITLE: Record<string, string> = { milestones: "Milestone", immunizations: "Vaksin", teeth: "Gigi Susu", sleep: "Panduan Tidur" };

function ModalAddContent({ kind, item, reload, onClose, showToast }: { kind: string; item?: Record<string, unknown> & { id?: string }; reload: () => Promise<void> | void; onClose: () => void; showToast: (m: string) => void }) {
  const fields = CONTENT_FIELDS[kind] ?? [];
  const editing = !!item?.id;
  const initial = (): Record<string, string> => {
    const o: Record<string, string> = {};
    if (item) for (const f of fields) if (item[f.key] != null) o[f.key] = String(item[f.key]);
    return o;
  };
  const [form, setForm] = useState<Record<string, string>>(initial);
  const [crit, setCrit] = useState(item?.isCritical === true);
  const [mand, setMand] = useState(item ? item.mandatory === true : true);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    const first = fields[0];
    if (!form[first.key]?.trim()) { showToast(`⚠️ Isi ${first.label}`); return; }
    const body: Record<string, unknown> = { ...form };
    for (const f of fields) if (f.type === "number" && body[f.key] != null) body[f.key] = Number(body[f.key]) || 0;
    if (kind === "milestones") body.isCritical = crit;
    if (kind === "immunizations") body.mandatory = mand;
    setSaving(true);
    try {
      if (editing) await adminApi.updateContent(kind, item!.id!, body);
      else await adminApi.createContent(kind, body);
      showToast(`✅ ${CONTENT_TITLE[kind]} ${editing ? "diperbarui" : "ditambahkan"}`);
      await reload();
      onClose();
    } catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); setSaving(false); }
  };
  return (
    <Modal id="modal-add-content" title={`${editing ? "✏️ Edit" : "➕ Tambah"} ${CONTENT_TITLE[kind]}`} open onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={save} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : null} Simpan</BtnPrimary></>}>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key} className={f.full ? "col-span-2" : ""}>
            <FormGroup label={f.label}>
              {f.options ? (
                <Select value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}>
                  <option value="" disabled>Pilih {f.label}</option>
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
              ) : (
                <Input type={f.type ?? "text"} value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              )}
            </FormGroup>
          </div>
        ))}
      </div>
      {kind === "milestones" && <div className="flex items-center justify-between"><span className="text-sm font-medium">Milestone Kritis (red flag)</span><Toggle checked={crit} onChange={() => setCrit((c) => !c)} /></div>}
      {kind === "immunizations" && <div className="flex items-center justify-between"><span className="text-sm font-medium">Wajib (program pemerintah)</span><Toggle checked={mand} onChange={() => setMand((c) => !c)} /></div>}
    </Modal>
  );
}

function ModalBroadcast({ onClose, showToast }: { onClose: () => void; showToast: (m: string) => void }) {
  const [form, setForm] = useState({ title: "", body: "", type: "Informasi Umum", target: "all" });
  const [sending, setSending] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const send = async () => {
    if (!form.title || !form.body) { showToast("⚠️ Judul & isi pesan wajib"); return; }
    setSending(true);
    try { const r = await adminApi.broadcast({ title: form.title, body: form.body, type: form.type, target: form.target }); showToast(`📢 Broadcast terkirim ke ${r.sent} user`); onClose(); }
    catch (e) { showToast(`⚠️ ${e instanceof Error ? e.message : "Gagal"}`); setSending(false); }
  };
  return (
    <Modal id="modal-broadcast" title="📢 Kirim Broadcast Notifikasi" open onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>Batal</BtnGhost><BtnPrimary onClick={send} disabled={sending}>{sending ? <Loader2 size={14} className="animate-spin" /> : null} Kirim Broadcast</BtnPrimary></>}>
      <div className="grid grid-cols-2 gap-3">
        <FormGroup label="Tipe Notifikasi"><Select value={form.type} onChange={(e) => set({ type: e.target.value })}><option>Informasi Umum</option><option>Promo / Penawaran</option><option>Update Fitur</option><option>Konten Parenting</option><option>Imunisasi</option></Select></FormGroup>
        <FormGroup label="Target Penerima"><Select value={form.target} onChange={(e) => set({ target: e.target.value })}><option value="all">Semua User</option><option value="free">User Free saja</option><option value="premium">User Premium saja</option></Select></FormGroup>
      </div>
      <FormGroup label="Judul Notifikasi"><Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="cth: Update Fitur Baru" /></FormGroup>
      <FormGroup label="Isi Pesan"><textarea value={form.body} onChange={(e) => set({ body: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#C9A227] resize-none" rows={4} placeholder="Tulis pesan notifikasi..." /></FormGroup>
    </Modal>
  );
}

function ModalWaBroadcast({ recipients, onClose, showToast }: { recipients: AdminUser[]; onClose: () => void; showToast: (m: string) => void }) {
  // When opened with no preselected recipients, load all users with a phone.
  const all = useAsync(() => (recipients.length > 0 ? Promise.resolve(recipients) : adminApi.users()), []);
  const [message, setMessage] = useState("Halo {nama}! 👋 Ada kabar baik dari Jurnal Emas Si Kecil ✨");
  const list = (all.data ?? []).filter((u) => u.phone);
  const personalized = (u: AdminUser) => message.replace(/\{nama\}/g, u.name);

  return (
    <Modal id="modal-wa-broadcast" title="💬 Broadcast WhatsApp" open onClose={onClose} width="600px"
      footer={<><BtnGhost onClick={onClose}>Tutup</BtnGhost><BtnPrimary onClick={() => showToast(`💬 ${list.length} chat siap dibuka`)}>Selesai</BtnPrimary></>}>
      <div className="flex items-center gap-2 bg-[rgba(37,211,102,0.08)] border border-[rgba(37,211,102,0.2)] rounded-lg px-3 py-2.5 mb-4">
        <MessageCircle size={16} className="text-[#25D366]" /><span className="text-xs text-gray-600">Broadcast ke <b>{list.length} user</b> via <code className="bg-white px-1 rounded">wa.me</code>. Tiap baris membuka chat dengan pesan terisi.</span>
      </div>
      <FormGroup label="Template Pesan (gunakan {nama})"><textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#C9A227] resize-none" rows={3} /></FormGroup>
      {all.loading ? <Spinner label="Memuat penerima…" /> : (
        <>
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Penerima ({list.length})</div>
          <div className="border border-gray-100 rounded-lg max-h-[260px] overflow-y-auto">
            {list.length === 0 ? <div className="text-xs text-gray-400 text-center py-6">Tidak ada user dengan nomor HP</div> : list.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                <AvatarCircle name={u.name} color={colorOf(u.id)} />
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{u.name}</div><div className="text-[11px] text-gray-400">{u.phone}</div></div>
                <BtnWa href={waLink(u.phone!, personalized(u))}><MessageCircle size={13} /> Chat</BtnWa>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

// ── TOAST
function Toast({ msg }: { msg: string }) {
  return <div className="fixed bottom-6 right-6 bg-[#1A1A2E] text-white px-4 py-3 rounded-xl text-sm font-medium z-[999] flex items-center gap-2 shadow-xl">{msg}</div>;
}

// ── SIDEBAR
type PageId = "overview" | "users" | "children" | "subscriptions" | "milestones" | "imunisasi" | "gigi" | "tidur" | "notifications" | "analytics" | "roles" | "settings";
const NAV_ITEMS: { id: PageId; label: string; icon: React.ReactNode; group: "utama" | "konten" | "sistem" }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={15} />, group: "utama" },
  { id: "users", label: "Manajemen User", icon: <Users size={15} />, group: "utama" },
  { id: "children", label: "Data Anak", icon: <Baby size={15} />, group: "utama" },
  { id: "subscriptions", label: "Subscription", icon: <CreditCard size={15} />, group: "utama" },
  { id: "milestones", label: "Database Milestone", icon: <Sprout size={15} />, group: "konten" },
  { id: "imunisasi", label: "Imunisasi", icon: <Syringe size={15} />, group: "konten" },
  { id: "gigi", label: "Gigi Susu", icon: <Smile size={15} />, group: "konten" },
  { id: "tidur", label: "Jadwal Tidur", icon: <Moon size={15} />, group: "konten" },
  { id: "notifications", label: "Notifikasi", icon: <Bell size={15} />, group: "konten" },
  { id: "analytics", label: "Analytics", icon: <TrendingUp size={15} />, group: "sistem" },
  { id: "roles", label: "Manajemen Role", icon: <ShieldCheck size={15} />, group: "sistem" },
  { id: "settings", label: "Pengaturan", icon: <Settings size={15} />, group: "sistem" },
];

function AdminSidebar({ activePage, setActivePage, me, onSignOut }: { activePage: PageId; setActivePage: (p: PageId) => void; me: AdminMe; onSignOut: () => void }) {
  const groups: { key: "utama" | "konten" | "sistem"; label: string }[] = [{ key: "utama", label: "Utama" }, { key: "konten", label: "Konten" }, { key: "sistem", label: "Sistem" }];
  return (
    <nav className="w-[250px] bg-[#1A1A2E] text-white fixed top-0 left-0 h-screen flex flex-col z-[100] overflow-y-auto">
      <div className="px-5 py-6 border-b border-white/[0.08]"><div className="flex items-center gap-2.5"><div className="w-9 h-9 bg-[#C9A227] rounded-lg flex items-center justify-center text-lg font-bold text-[#1A1A2E] flex-shrink-0">✨</div><div><div className="text-[13px] font-bold leading-tight">Jurnal Emas Si Kecil</div><div className="text-[10px] text-white/40">Admin Panel v1.0</div></div></div></div>
      <div className="mx-5 my-3 bg-[rgba(201,162,39,0.15)] border border-[rgba(201,162,39,0.3)] rounded-md py-1.5 text-center text-[11px] text-[#C9A227] font-semibold">🔐 {me.role === "superadmin" ? "Super Admin" : "Admin"}</div>
      <div className="flex-1 py-1">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="px-5 py-1.5 mt-1 text-[10px] font-bold text-white/30 uppercase tracking-widest">{g.label}</div>
            {NAV_ITEMS.filter((i) => i.group === g.key).map((item) => (
              <button key={item.id} onClick={() => setActivePage(item.id)} className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-[13.5px] font-medium transition-colors relative text-left ${activePage === item.id ? "bg-[rgba(201,162,39,0.15)] text-[#C9A227]" : "text-white/60 hover:bg-white/[0.06] hover:text-white"}`}>
                {activePage === item.id && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#C9A227] rounded-r" />}
                <span className="w-5 flex justify-center">{item.icon}</span><span className="flex-1">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-white/[0.08] flex items-center gap-2.5">
        <div className="w-8 h-8 bg-[#C9A227] rounded-full flex items-center justify-center text-sm font-bold text-[#1A1A2E]">{me.name[0]?.toUpperCase()}</div>
        <div className="flex-1 min-w-0"><div className="text-xs font-semibold truncate">{me.name}</div><div className="text-[10px] text-white/40">{me.email}</div></div>
        <button onClick={onSignOut} title="Keluar"><LogOut size={14} className="text-white/30 cursor-pointer hover:text-white/60 transition-colors" /></button>
      </div>
    </nav>
  );
}

const PAGE_LABELS: Record<PageId, string> = {
  overview: "Overview", users: "Manajemen User", children: "Data Anak", subscriptions: "Subscription",
  milestones: "Database Milestone", imunisasi: "Imunisasi", gigi: "Gigi Susu", tidur: "Jadwal Tidur",
  notifications: "Notifikasi", analytics: "Analytics", roles: "Manajemen Role", settings: "Pengaturan",
};

function AdminTopbar({ activePage, setActivePage, onRefresh }: { activePage: PageId; setActivePage: (p: PageId) => void; onRefresh: () => void }) {
  return (
    <div className="bg-white border-b border-gray-200 px-7 h-[60px] flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3"><h1 className="text-[17px] font-bold text-[#1A1A2E]">{PAGE_LABELS[activePage]}</h1><span className="text-xs text-gray-400">Dashboard / {PAGE_LABELS[activePage]}</span></div>
      <div className="flex items-center gap-3">
        <button onClick={() => setActivePage("notifications")} className="relative p-2 border border-gray-200 rounded-lg bg-white flex items-center hover:bg-gray-50"><Bell size={15} className="text-gray-500" /><span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" /></button>
        <BtnPrimary onClick={onRefresh}><RefreshCw size={13} /> Refresh</BtnPrimary>
      </div>
    </div>
  );
}

// ── ADMIN LOGIN (Better Auth)
function AdminLogin({ denied, onSuccess }: { denied: boolean; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErr(null);
    const { error } = await signIn.email({ email, password });
    if (error) { setErr(error.message ?? "Email atau kata sandi salah"); setLoading(false); return; }
    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A2E] p-4" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-full p-7">
        <div className="flex items-center gap-2.5 mb-5"><div className="w-10 h-10 bg-[#C9A227] rounded-lg flex items-center justify-center text-lg font-bold text-[#1A1A2E]">✨</div><div><div className="text-sm font-bold text-[#1A1A2E]">Jurnal Emas — Admin</div><div className="text-[11px] text-gray-400">Masuk untuk mengelola platform</div></div></div>

        {denied && <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#EF4444] text-xs rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2"><Lock size={13} /> Akun ini bukan admin. Masuk dengan akun admin.</div>}
        {err && <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#EF4444] text-xs rounded-lg px-3 py-2.5 mb-4">{err}</div>}

        <form onSubmit={submit}>
          <FormGroup label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@jurnalemas.com" required /></FormGroup>
          <FormGroup label="Kata Sandi"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></FormGroup>
          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold bg-[#C9A227] text-[#1A1A2E] hover:bg-[#F0C84A] transition-colors disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />} {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>
        <p className="text-[11px] text-gray-400 text-center mt-4">Demo: admin@jurnalemas.com / admin12345</p>
      </div>
    </div>
  );
}

// ── ADMIN SHELL (authenticated)
type ModalState =
  | { id: "user-detail"; user: AdminUser }
  | { id: "edit-user"; user: AdminUser; reload: () => Promise<void> | void }
  | { id: "add-user"; reload: () => Promise<void> | void }
  | { id: "add-content"; kind: string; item?: Record<string, unknown> & { id?: string }; reload: () => Promise<void> | void }
  | { id: "broadcast" }
  | { id: "wa-broadcast"; recipients: AdminUser[] }
  | null;

function AdminShell({ me, onSignOut }: { me: AdminMe; onSignOut: () => void }) {
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const handleRefresh = () => { setRefreshSignal((n) => n + 1); showToast("🔄 Memuat ulang data…"); };
  const closeModal = () => setModal(null);
  const openModal = (id: string, payload?: unknown) => {
    if (id === "user-detail") setModal({ id: "user-detail", user: payload as AdminUser });
    else if (id === "edit-user") { const p = payload as { user: AdminUser; reload: () => Promise<void> | void }; setModal({ id: "edit-user", user: p.user, reload: p.reload }); }
    else if (id === "add-user") setModal({ id: "add-user", reload: payload as () => Promise<void> | void });
    else if (id === "add-content") { const p = payload as { kind: string; reload: () => Promise<void> | void }; setModal({ id: "add-content", kind: p.kind, reload: p.reload }); }
    else if (id === "edit-content") { const p = payload as { kind: string; item: Record<string, unknown> & { id?: string }; reload: () => Promise<void> | void }; setModal({ id: "add-content", kind: p.kind, item: p.item, reload: p.reload }); }
    else if (id === "broadcast") setModal({ id: "broadcast" });
    else if (id === "wa-broadcast") setModal({ id: "wa-broadcast", recipients: (payload as AdminUser[]) ?? [] });
  };

  return (
    <div className="flex min-h-screen text-[#1A1A2E]" style={{ background: "#F4F6FA", fontSize: 14, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} me={me} onSignOut={onSignOut} />
      <main className="ml-[250px] flex-1 flex flex-col min-h-screen">
        <AdminTopbar activePage={activePage} setActivePage={setActivePage} onRefresh={handleRefresh} />
        <div className="p-7 flex-1">
          {activePage === "overview" && <PageOverview setActivePage={setActivePage} refreshSignal={refreshSignal} />}
          {activePage === "users" && <PageUsers showToast={showToast} openModal={openModal} />}
          {activePage === "children" && <PageChildren showToast={showToast} />}
          {activePage === "subscriptions" && <PageSubscriptions showToast={showToast} />}
          {activePage === "milestones" && <PageMilestones showToast={showToast} openModal={openModal} />}
          {activePage === "imunisasi" && <PageImunisasi showToast={showToast} openModal={openModal} />}
          {activePage === "gigi" && <PageGigi showToast={showToast} openModal={openModal} />}
          {activePage === "tidur" && <PageTidur showToast={showToast} openModal={openModal} />}
          {activePage === "notifications" && <PageNotifications openModal={openModal} />}
          {activePage === "analytics" && <PageAnalytics refreshSignal={refreshSignal} />}
          {activePage === "roles" && <PageRoles showToast={showToast} />}
          {activePage === "settings" && <PageSettings showToast={showToast} />}
        </div>
      </main>

      {modal?.id === "user-detail" && <ModalUserDetail user={modal.user} onClose={closeModal} showToast={showToast} />}
      {modal?.id === "edit-user" && <ModalEditUser user={modal.user} reload={modal.reload} onClose={closeModal} showToast={showToast} />}
      {modal?.id === "add-user" && <ModalAddUser reload={modal.reload} onClose={closeModal} showToast={showToast} />}
      {modal?.id === "add-content" && <ModalAddContent kind={modal.kind} item={modal.item} reload={modal.reload} onClose={closeModal} showToast={showToast} />}
      {modal?.id === "broadcast" && <ModalBroadcast onClose={closeModal} showToast={showToast} />}
      {modal?.id === "wa-broadcast" && <ModalWaBroadcast recipients={modal.recipients} onClose={closeModal} showToast={showToast} />}

      {toast && <Toast msg={toast} />}
    </div>
  );
}

// ── ROOT: auth gate
export default function AdminDashboard() {
  const { data: session, isPending } = useSession();
  const [me, setMe] = useState<AdminMe | null>(null);
  const [checking, setChecking] = useState(true);
  const [denied, setDenied] = useState(false);

  const verify = useCallback(() => {
    setChecking(true);
    adminApi.me()
      .then((m) => { setMe(m); setDenied(false); })
      .catch(() => { setMe(null); setDenied(true); })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!session) { setMe(null); setDenied(false); setChecking(false); return; }
    verify();
  }, [isPending, session, verify]);

  const handleSignOut = async () => { await signOut(); setMe(null); setDenied(false); };

  if (isPending || checking) {
    return <div className="min-h-screen flex items-center justify-center bg-[#1A1A2E] text-white/70 gap-2 text-sm"><Loader2 size={18} className="animate-spin" /> Memuat…</div>;
  }
  if (!me) return <AdminLogin denied={denied} onSuccess={verify} />;
  return <AdminShell me={me} onSignOut={handleSignOut} />;
}
