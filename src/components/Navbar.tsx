"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderGit2, Calendar, FileText, HardDrive, LogOut } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    { label: "Overview", href: "/", icon: Calendar },
    { label: "Repositories", href: "/repos", icon: FolderGit2 },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Storage", href: "/settings/storage", icon: HardDrive },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-sm text-zinc-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
            Workspace
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar
        </button>
      </div>
    </header>
  );
}
