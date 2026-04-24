"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Bell,
  LogOut,
  Settings,
  Dumbbell,
} from "lucide-react";
import { api, clearTokens, getStoredUser } from "@/lib/api";

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/auth/login");
      return;
    }
    if (stored.tipo_usuario !== "treinador") {
      router.replace("/hoje");
      return;
    }
    setUser(stored);

    api.dashboard
      .alertas({ apenasNaoLidos: true })
      .then((r: any) => setAlertCount((r.data ?? []).length))
      .catch(() => setAlertCount(0));
  }, [router]);

  function logout() {
    clearTokens();
    router.push("/auth/login");
  }

  const navItems = [
    { href: "/trainer/dashboard", label: "Esquadrão", icon: LayoutDashboard },
    { href: "/trainer/exercicios", label: "Exercícios", icon: Dumbbell },
    {
      href: "/trainer/alertas",
      label: "Alertas",
      icon: Bell,
      badge: alertCount,
    },
    { href: "/trainer/settings", label: "Configurações", icon: Settings },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar for desktop / top bar for mobile */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <img src="/logo.svg" alt="Logo" className="h-8" />
          <div className="flex items-center gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative p-2 rounded-xl ${pathname.startsWith(item.href) ? "text-cyan bg-cyan/10" : "text-dim hover:text-text"}`}
              >
                <item.icon className="w-5 h-5" />
                {item.badge ? (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red text-bg text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </Link>
            ))}
            <button onClick={logout} className="p-2 text-dim hover:text-red">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-56 bg-card border-r border-border z-40">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <img src="/logo.svg" alt="Logo" className="h-10" />
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${pathname.startsWith(item.href) ? "bg-cyan/10 text-cyan" : "text-dim hover:text-text hover:bg-border/50"}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.badge ? (
                <span className="ml-auto bg-red text-bg text-[9px] font-bold rounded-full px-1.5 py-0.5">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="text-xs text-dim truncate">{user.nome}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-dim hover:text-red mt-2"
          >
            <LogOut className="w-3 h-3" /> Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pt-14 lg:pt-0 lg:pl-56 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
