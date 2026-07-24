"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      // Panggil backend API
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("app_token", data.token);
        localStorage.setItem("app_user", JSON.stringify(data.user));
        router.push("/");
      } else {
        const errData = await res.json();
        setError(errData.detail || "Username atau password salah.");
      }
    } catch (err) {
      console.log("Backend offline, trying offline fallback...", err);
      // Fallback offline (untuk testing instan)
      if (username === "admin" && (password === "admin123" || password === "adminholicindo")) {
        localStorage.setItem("app_token", "mock-offline-token");
        localStorage.setItem(
          "app_user",
          JSON.stringify({
            username: "admin",
            name: "Administrator (Demo)",
            role: "admin",
          })
        );
        setInfo("Koneksi API offline. Masuk menggunakan mode demo offline.");
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setError("Username atau password salah (Verifikasi Offline).");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#090d16] px-4">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

      <div className="w-full max-w-md p-8 glass-panel rounded-3xl border border-slate-800 shadow-2xl relative">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-sky-500/10 rounded-2xl border border-sky-500/20 mb-4 animate-bounce">
            <ShieldAlert className="w-10 h-10 text-sky-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 text-center tracking-tight">SISTEM DETEKSI ANOMALI</h2>
          <p className="text-xs text-sky-400 font-medium mt-1 text-center">
            Urutan & Waktu Proses Produksi (Isolation Forest)
          </p>
        </div>

        {/* Info & Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start space-x-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {info && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start space-x-3 text-amber-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{info}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-100 font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50 disabled:scale-100 text-sm flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <span>Masuk Sistem</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <p>© 2026 <strong className="text-slate-400">Riecka Mutiara</strong> (NPM: 2113211110)</p>
          <p className="text-[11px] text-slate-600">Teknik Informatika - Universitas Sangga Buana YPKP</p>
          <p className="pt-2 text-slate-600 text-[11px]">Akun Demo: admin / admin123</p>
        </div>
      </div>
    </div>
  );
}
