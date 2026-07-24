"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  Settings, 
  LogOut, 
  ShieldAlert 
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
    { name: "Unggah Log", href: "/upload", icon: Upload },
    { name: "Riwayat & Deteksi", href: "/history", icon: History },
    { name: "Pengaturan", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 fixed inset-y-0 left-0 glass-panel border-r border-slate-800 flex flex-col justify-between z-30">
      <div>
        {/* Logo / Title */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-sky-500/20 rounded-lg border border-sky-500/30">
            <ShieldAlert className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 leading-tight">Deteksi Anomali</h1>
            <p className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">Isolation Forest AI</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-sky-500/20 text-sky-300 border-l-4 border-sky-500 font-medium"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-sky-300" : "text-slate-400"}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-xl mb-3 border border-slate-800">
          <div className="overflow-hidden">
            <p className="text-xs text-slate-400">Masuk sebagai</p>
            <p className="text-sm font-semibold text-slate-200 truncate">{adminName}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition-all duration-200 text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Aplikasi</span>
        </button>
      </div>
    </aside>
  );
}
