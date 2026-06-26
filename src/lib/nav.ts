import {
  BookHeart,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  LineChart,
  Repeat,
  Settings,
  Sparkles,
  Target,
  ClipboardList,
  Baby,
} from "lucide-react";

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Pendamping AI", href: "/coach", icon: Sparkles },
  { label: "Jurnal", href: "/journal", icon: BookHeart },
  { label: "Tumbuh Kembang", href: "/growth", icon: LineChart },
  { label: "Goal & Milestone", href: "/goals", icon: Target },
  { label: "Task Manager", href: "/tasks", icon: ClipboardList },
  { label: "Rutinitas", href: "/routines", icon: Repeat },
  { label: "Profil Anak", href: "/children", icon: Baby },
  { label: "Laporan", href: "/reports", icon: FileText },
  { label: "Pengaturan", href: "/settings", icon: Settings },
];

export const mobileNavItems = [
  { label: "Beranda", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tumbuh", href: "/growth", icon: LineChart },
  { label: "Milestone", href: "/goals", icon: Target },
  { label: "Task", href: "/tasks", icon: ClipboardList },
  { label: "Rutinitas", href: "/routines", icon: Repeat },
];

export { CalendarCheck };
