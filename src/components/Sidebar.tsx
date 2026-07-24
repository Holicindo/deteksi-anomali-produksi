"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  Settings, 
  LogOut, 
  ShieldAlert,
  ClipboardList
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const userStr = localStorage.getItem("app_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setAdminName(user.name || "Administrator");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("app_token");
    localStorage.removeItem("app_user");
    router.push("/login");
  };

  // Jika di halaman login, jangan tampilkan sidebar
  if (pathname === "/login") return null;

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Catat Log Manual", href: "/catat", icon: ClipboardList },
    { name: "Unggah Log", href: "/upload", icon: Upload },
    { name: "Riwayat & Deteksi", href: "/history", icon: History },
    { name: "Pengaturan", href: "/settings", icon: Settings },
  ];

  return (
    <aside
      className="w-64 flex flex-col justify-between z-30 relative shrink-0"
      style={{
        background: "#060d1a",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div>
        {/* Logo / Title */}
        <div className="px-7 pt-8 pb-2 flex items-center space-x-3">
          <div className="p-2 bg-sky-500/15 rounded-xl border border-sky-500/20">
            <ShieldAlert className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-tight tracking-wide">Deteksi Anomali</h1>
            <p className="text-[10px] text-sky-400 font-semibold tracking-widest uppercase mt-0.5">CONFIGURE WITH AI</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-4 mt-8 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-5 py-3.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? "text-white font-semibold border border-sky-500/20 bg-gradient-to-r from-sky-500/15 to-transparent shadow-[0_0_12px_rgba(14,165,233,0.08)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? "text-sky-400" : "text-slate-500"}`}
                />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="px-4 pb-6 space-y-2">
        {/* Divider */}
        <div className="h-px mx-2 mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* User Card */}
        <div
          className="flex items-center space-x-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20">
            <span className="text-white text-sm font-bold">{adminName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Welcome,</p>
            <p className="text-sm font-semibold text-slate-200 truncate">{adminName}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-full transition-all duration-200 text-sm font-medium text-slate-400 hover:text-white"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)"
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Aplikasi</span>
        </button>
      </div>
    </aside>
  );
}
