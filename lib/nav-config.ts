import {
  LayoutDashboard,
  HandCoins,
  Users,
  WalletCards,
  Receipt,
  Building2,
  GraduationCap,
  BarChart3,
  FileText,
  UsersRound,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    label: "MAIN",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "FINANCE",
    items: [
      { title: "Donations", href: "/donations", icon: HandCoins },
      { title: "Donors", href: "/donors", icon: Users },
      { title: "Funds", href: "/funds", icon: WalletCards },
      { title: "Expenses", href: "/expenses", icon: Receipt },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { title: "Construction", href: "/construction", icon: Building2 },
      { title: "Madrasa", href: "/madrasa", icon: GraduationCap },
    ],
  },
  {
    label: "REPORTS",
    items: [
      { title: "Reports", href: "/reports", icon: BarChart3 },
      { title: "Receipts", href: "/receipts", icon: FileText },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { title: "Users", href: "/users", icon: UsersRound },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function getPageTitle(pathname: string): string {
  for (const section of navigation) {
    for (const item of section.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.title;
      }
    }
  }
  return "Dashboard";
}
