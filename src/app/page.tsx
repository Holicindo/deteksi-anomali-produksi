"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  ShieldAlert, 
  Activity, 
  Layers, 
  Settings, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight
} from "lucide-react";

interface DashboardSummary {
  total_batches: number;
  total_anomalies: number;
  total_steps: number;
  anomaly_percentage: number;
  high_risk_stations: { station: string; anomalies: number }[];
  average_process_durations: { process_name: string; average_duration_minutes: number }[];
  batches_summary: {
    batch_name: string;
    total_steps: number;
    anomaly_count: number;
    uploaded_at: string;
  }[];
}

// MOCK DATA jika backend offline
const mockSummary: DashboardSummary = {
  total_batches: 8,
  total_anomalies: 12,
  total_steps: 124,
  anomaly_percentage: 9.68,
  high_risk_stations: [
    { station: "Stasiun Perakitan Utama", anomalies: 5 },
    { station: "Stasiun Quality Control", anomalies: 3 },
    { station: "Stasiun Pengemasan", anomalies: 2 },
    { station: "Stasiun Uji Kelistrikan", anomalies: 2 }
  ],
  average_process_durations: [
    { process_name: "Pemotongan Bahan", average_duration_minutes: 12.5 },
    { process_name: "Perakitan Rangka", average_duration_minutes: 45.2 },
    { process_name: "Instalasi Kelistrikan", average_duration_minutes: 30.8 },
    { process_name: "Uji Kelayakan (QC)", average_duration_minutes: 15.0 },
    { process_name: "Finishing & Packing", average_duration_minutes: 20.1 }
  ],
  batches_summary: [
    { batch_name: "BATCH-HL-008", total_steps: 16, anomaly_count: 0, uploaded_at: "2026-07-23T14:30:00Z" },
    { batch_name: "BATCH-HL-007", total_steps: 16, anomaly_count: 2, uploaded_at: "2026-07-23T10:15:00Z" },
    { batch_name: "BATCH-HL-006", total_steps: 15, anomaly_count: 3, uploaded_at: "2026-07-22T16:45:00Z" },
    { batch_name: "BATCH-HL-005", total_steps: 16, anomaly_count: 0, uploaded_at: "2026-07-22T09:00:00Z" },
    { batch_name: "BATCH-HL-004", total_steps: 15, anomaly_count: 1, uploaded_at: "2026-07-21T15:20:00Z" }
  ]
};

const COLORS = ['#38bdf8', '#818cf8', '#fb7185', '#34d399', '#fbbf24'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(mockSummary);
  const [contamination, setContamination] = useState(0.10);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Dashboard Summary
        const summaryRes = await fetch("http://localhost:8000/api/dashboard/summary");
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          // Jika tidak ada data batch sama sekali, pakai mock agar dashboard tidak kosong melompong
          if (summaryData.total_batches > 0) {
            setSummary(summaryData);
          } else {
            setSummary(mockSummary);
            setIsDemoMode(true);
          }
        } else {
          setIsDemoMode(true);
        }

        // Fetch Settings
        const settingsRes = await fetch("http://localhost:8000/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setContamination(settingsData.contamination_rate || 0.10);
        }
      } catch (err) {
        console.log("Backend offline, using local mock summary data", err);
        setIsDemoMode(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] flex-col space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-400 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400 font-medium">Memuat dashboard...</p>
      </div>
    );
  }

  // Format tanggal lokalisasi
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Pie chart data
  const pieData = [
    { name: "Normal", value: summary.total_steps - summary.total_anomalies },
    { name: "Anomali", value: summary.total_anomalies }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">Dashboard Ringkasan</h2>
          <p className="text-sm text-slate-400 mt-1">
            Status pengawasan anomali proses produksi PT Holicindo terkini.
          </p>
        </div>
        
        {isDemoMode && (
          <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
            <span>Mode Demo (API Offline)</span>
          </div>
        )}
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Batch */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Batch Log</span>
            <div className="p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-100">{summary.total_batches}</h3>
          <p className="text-xs text-slate-400 mt-2 flex items-center">
            <span>Daftar log yang diunggah</span>
          </p>
        </div>

        {/* Total Anomali */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kasus Anomali</span>
            <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-100">{summary.total_anomalies}</h3>
          <p className="text-xs text-rose-400 mt-2 flex items-center">
            <span>Terdeteksi di semua tahapan</span>
          </p>
        </div>

        {/* Persentase Anomali */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rasio Penyimpangan</span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-100">{summary.anomaly_percentage}%</h3>
          <p className="text-xs text-slate-400 mt-2">
            <span>Dari total {summary.total_steps} langkah proses</span>
          </p>
        </div>

        {/* Sensitivitas AI */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sensitivitas AI</span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-100">{contamination * 100}%</h3>
          <p className="text-xs text-slate-400 mt-2">
            <span>Parameter Contamination Rate</span>
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Rata-rata Durasi Proses */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <span>Rata-rata Durasi Proses Produksi (Menit)</span>
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.average_process_durations}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="process_name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px", color: "#f8fafc" }}
                  itemStyle={{ color: "#38bdf8" }}
                />
                <Bar dataKey="average_duration_minutes" fill="url(#colorDuration)" radius={[8, 8, 0, 0]}>
                  {summary.average_process_durations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Komposisi Normal vs Anomali */}
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>Kondisi Hasil Deteksi</span>
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#1e293b" stroke="rgba(255,255,255,0.05)" /> {/* Normal */}
                  <Cell fill="#fb7185" stroke="rgba(255,255,255,0.05)" /> {/* Anomali */}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                />
                <Legend formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <p className="text-xs text-slate-400">
              Sebanyak <strong className="text-rose-400">{summary.total_anomalies}</strong> aktivitas diidentifikasi memiliki deviasi pola.
            </p>
          </div>
        </div>
      </div>

      {/* High Risk Stations & Recent Batches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stasiun Kerja Paling Berisiko */}
        <div className="glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>Stasiun Kerja Rentan Anomali</span>
          </h3>
          <div className="space-y-4">
            {summary.high_risk_stations.map((item, index) => (
              <div key={item.station} className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-sm text-amber-400">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-300">{item.station}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
                    {item.anomalies} anomali
                  </span>
                </div>
              </div>
            ))}
            {summary.high_risk_stations.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                Tidak ada data stasiun berisiko
              </div>
            )}
          </div>
        </div>

        {/* Batch Baru Diunggah */}
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-200">Riwayat Unggahan Terbaru</h3>
            <Link href="/history" className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1 transition-all">
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {summary.batches_summary.map((batch) => (
              <div key={batch.batch_name} className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl hover:border-slate-700/60 transition-all duration-200 group">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{batch.batch_name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(batch.uploaded_at)}</p>
                </div>
                <div className="flex items-center space-x-4">
                  {batch.anomaly_count > 0 ? (
                    <span className="text-xs font-semibold px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{batch.anomaly_count} Anomali</span>
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center space-x-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Bersih</span>
                    </span>
                  )}
                  <Link href="/history" className="p-1.5 bg-slate-800/50 group-hover:bg-sky-500/10 rounded-lg border border-slate-700 group-hover:border-sky-500/30 text-slate-400 group-hover:text-sky-400 transition-all">
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
