"use client";

import { useEffect, useState } from "react";
import { Settings, ShieldAlert, Save, Info, AlertCircle, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [contamination, setContamination] = useState(0.10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("http://localhost:8000/api/settings");
        if (res.ok) {
          const data = await res.json();
          setContamination(data.contamination_rate || 0.10);
        } else {
          throw new Error("Gagal memuat pengaturan");
        }
      } catch (err) {
        console.log("Backend offline, using offline fallback settings", err);
        setIsDemoMode(true);
        const saved = localStorage.getItem("holicindo_offline_contamination");
        if (saved) {
          setContamination(parseFloat(saved));
        }
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:8000/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contamination_rate: contamination }),
      });

      if (res.ok) {
        setSuccess("Pengaturan berhasil disimpan ke database!");
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Gagal memperbarui pengaturan.");
      }
    } catch (err) {
      console.log("Backend offline, saving settings to localStorage", err);
      localStorage.setItem("holicindo_offline_contamination", contamination.toString());
      setSuccess("Pengaturan berhasil diperbarui secara lokal (Mode Demo).");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] flex-col space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Memuat pengaturan...</p>
      </div>
    );
  }

  // Menentukan tingkat sensitivitas berdasarkan persentase
  const getSensitivityText = (val: number) => {
    if (val <= 0.03) return { label: "Sangat Rendah (Sangat Selektif)", color: "text-emerald-400", desc: "Hanya deviasi ekstrim yang akan dianggap anomali. Jumlah deteksi akan sangat sedikit." };
    if (val <= 0.08) return { label: "Rendah (Selektif)", color: "text-sky-400", desc: "Menyaring deviasi minor, memfokuskan deteksi pada penyimpangan proses yang signifikan." };
    if (val <= 0.15) return { label: "Sedang (Rekomendasi)", color: "text-indigo-400", desc: "Pengaturan standar yang seimbang untuk mendeteksi anomali urutan dan durasi umum." };
    if (val <= 0.25) return { label: "Tinggi (Sensitif)", color: "text-amber-400", desc: "Penyimpangan waktu atau jeda kecil akan langsung ditandai sebagai anomali. Cocok untuk produk presisi tinggi." };
    return { label: "Sangat Tinggi (Sangat Sensitif)", color: "text-rose-400", desc: "Hampir setiap variasi proses kecil akan ditandai. Tingkat false-positive mungkin tinggi." };
  };

  const sensitivity = getSensitivityText(contamination);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">Pengaturan Algoritma AI</h2>
          <p className="text-sm text-slate-400 mt-1">
            Konfigurasi tingkat sensitivitas Isolation Forest untuk mendeteksi anomali proses produksi.
          </p>
        </div>
        {isDemoMode && (
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-xs font-semibold uppercase tracking-wider">
            Mode Demo
          </div>
        )}
      </div>

      {/* Main Settings Card */}
      <div className="card-sky glass-panel p-8 rounded-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl"></div>

        <form onSubmit={handleSaveSettings} className="space-y-8">
          {/* Contamination Rate Setting */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-slate-200">
                Contamination Rate (Tingkat Kontaminasi)
              </label>
              <span className="text-lg font-extrabold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-xl">
                {(contamination * 100).toFixed(0)}%
              </span>
            </div>

            <input
              type="range"
              min="0.01"
              max="0.40"
              step="0.01"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>0.01 (1% - Kurang Sensitif)</span>
              <span>0.40 (40% - Sangat Sensitif)</span>
            </div>
          </div>

          {/* Dinamis Feedback Sensitivitas */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tingkat Sensitivitas Aktif:</p>
            <p className={`text-base font-extrabold ${sensitivity.color}`}>
              {sensitivity.label}
            </p>
            <p className="text-sm text-slate-300 leading-relaxed font-semibold">
              {sensitivity.desc}
            </p>
          </div>

          {/* Edukasi Konsep Isolation Forest */}
          <div className="p-5 bg-sky-500/5 border border-sky-500/10 rounded-2xl flex items-start space-x-4">
            <Info className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-sky-300">Bagaimana Parameter Ini Mempengaruhi AI?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Di dalam metode <strong>Isolation Forest</strong>, <em>Contamination Rate</em> adalah proporsi anomali yang diperkirakan ada di dalam dataset (default 10%). 
                AI menggunakan persentase ini untuk menarik garis ambang batas (*threshold*). Jika data baru memiliki skor di luar batas ini, data tersebut otomatis diisolasi sebagai anomali.
              </p>
            </div>
          </div>

          {/* Success / Error Feedback */}
          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-start space-x-3 text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-semibold">{success}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-start space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-100 font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50 disabled:scale-100 text-sm flex items-center justify-center space-x-2"
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Simpan Pengaturan</span>
          </button>
        </form>
      </div>
    </div>
  );
}
