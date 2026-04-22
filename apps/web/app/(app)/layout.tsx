"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, TrendingUp, ClipboardList, User } from "lucide-react";
import { getStoredUser } from "@/lib/api";

const tabs = [
  { href: "/hoje", label: "Hoje", icon: LayoutDashboard },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/protocolo", label: "Protocolo", icon: ClipboardList },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <img src="/logo.svg" alt="Logo" className="h-6" />
          <span className="text-xs text-dim">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-4">{children}</main>

      {/* Bottom navigation */}
      <nav className="bottom-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`nav-item ${active ? "active" : ""}`}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
