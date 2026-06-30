import {
  BookHeart,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  LineChart,
  Settings,
  Sparkles,
  Target,
  ClipboardList,
  Baby,
} from "lucide-react";

// Ordered by how often a parent uses each — daily-use features up top, setup &
// occasional ones at the bottom.
export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jurnal", href: "/journal", icon: BookHeart },
  { label: "Catatan si Kecil", href: "/catatan", icon: ClipboardList },
  { label: "Tumbuh Kembang", href: "/growth", icon: LineChart },
  { label: "Goal & Milestone", href: "/goals", icon: Target },
  { label: "Pendamping AI", href: "/coach", icon: Sparkles },
  { label: "Laporan", href: "/reports", icon: FileText },
  { label: "Profil Anak", href: "/children", icon: Baby },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

// Bottom-bar primaries (4 most-used). The 5th slot is a "Lainnya" button that
// opens the full drawer (same list as the sidebar) — see MobileNav.
export const mobileNavItems = [
  { label: "Beranda", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jurnal", href: "/journal", icon: BookHeart },
  { label: "Catatan", href: "/catatan", icon: ClipboardList },
  { label: "Milestone", href: "/goals", icon: Target },
];

export { CalendarCheck };
