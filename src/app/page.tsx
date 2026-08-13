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
  Legend,
  LabelList
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
  ArrowUpRight,
  ClipboardList,
  Upload,
  History
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 max-w-7xl mx-auto">
      {/* Top Welcome Panel */}
      <div className="col-span-1 lg:col-span-12 order-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">Dashboard Ringkasan</h2>
          <p className="text-sm text-slate-400 mt-1">
            Status pengawasan anomali proses produksi terkini.
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
      <div className="col-span-1 lg:col-span-12 order-3 lg:order-2 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Batch */}
        <div className="metric-card p-4 md:p-6 w-full">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Total Batch</span>
            <div className="p-2 md:p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Layers className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <h3 className="text-2xl md:text-4xl font-extrabold text-white">{summary.total_batches}</h3>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">Log diunggah</p>
        </div>

        {/* Total Anomali */}
        <div className="metric-card p-4 md:p-6 w-full">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Kasus Anomali</span>
            <div className="p-2 md:p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <h3 className="text-2xl md:text-4xl font-extrabold text-white">{summary.total_anomalies}</h3>
          <p className="text-[10px] md:text-xs text-rose-400 mt-1 md:mt-2">Terdeteksi</p>
        </div>

        {/* Persentase Anomali */}
        <div className="metric-card p-4 md:p-6 w-full">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Penyimpangan</span>
            <div className="p-2 md:p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Activity className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <h3 className="text-2xl md:text-4xl font-extrabold text-white">{summary.anomaly_percentage}%</h3>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">Dari {summary.total_steps} langkah</p>
        </div>

        {/* Sensitivitas AI */}
        <div className="metric-card p-4 md:p-6 w-full">
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Sensitivitas AI</span>
            <div className="p-2 md:p-2.5 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400">
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
          <h3 className="text-2xl md:text-4xl font-extrabold text-white">{contamination * 100}%</h3>
          <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2">Contamination Rate</p>
        </div>
      </div>

      {/* Chart 1: Rata-rata Durasi Proses */}
      <div className="col-span-1 lg:col-span-8 order-4 lg:order-3 glass-panel p-6 rounded-3xl">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <span>Rata-rata Durasi Proses Produksi (Menit)</span>
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.average_process_durations} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(56,189,248,0.10)" />
                <XAxis
                  dataKey="process_name"
                  stroke="rgba(148,163,184,0.5)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(56,189,248,0.20)", strokeWidth: 1 }}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  stroke="rgba(148,163,184,0.3)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(v) => `${v}m`}
                  width={36}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(56,189,248,0.05)' }}
                  contentStyle={{ backgroundColor: "#0d1b35", borderColor: "rgba(56,189,248,0.2)", borderRadius: "12px", color: "#f8fafc" }}
                  itemStyle={{ color: "#38bdf8" }}
                  formatter={(value: any) => [`${value} menit`, "Durasi"]}
                />
                <Bar dataKey="average_duration_minutes" fill="url(#colorDuration)" radius={[6, 6, 0, 0]} barSize={70}>
                  <LabelList dataKey="average_duration_minutes" position="top" fill="#e2e8f0" fontSize={12} fontWeight="bold" />
                </Bar>
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      {/* Chart 2: Komposisi Normal vs Anomali */}
      <div className="col-span-1 lg:col-span-4 order-2 lg:order-4 glass-panel p-5 md:p-6 rounded-3xl flex justify-between items-center">
        {/* Left Info */}
        <div className="flex flex-col space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-wide">Deteksi</h3>
          <p className="text-sm font-medium">
            <span className="text-rose-400">{summary.total_anomalies} Anomali</span> <span className="text-slate-500">dari {summary.total_steps}</span>
          </p>
          <div className="pt-2">
            <span className="inline-block px-3.5 py-1.5 bg-slate-800/80 rounded-xl text-xs text-slate-300 font-semibold border border-slate-700/50">
              {summary.total_steps - summary.total_anomalies} Normal
            </span>
          </div>
        </div>

        {/* Right Chart */}
        <div className="h-28 w-28 md:h-32 md:w-32 relative shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius="75%"
                outerRadius="100%"
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
                cornerRadius={10}
              >
                <Cell fill="#1e2d45" /> {/* Normal - Background abu gelap */}
                <Cell fill="#fb7185" /> {/* Anomali - Aktif warna Rose */}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl md:text-2xl font-bold text-white tracking-tighter">
              {summary.total_steps > 0 ? Math.round((summary.total_anomalies / summary.total_steps) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
      {/* Stasiun Kerja Paling Berisiko */}
      <div className="col-span-1 lg:col-span-6 order-5 glass-panel p-6 rounded-3xl">
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
      <div className="col-span-1 lg:col-span-6 order-6 glass-panel p-6 rounded-3xl">
        <div className="flex justify-between items-start sm:items-center mb-5 gap-4">
          <h3 className="text-lg font-bold text-slate-200 leading-tight">Riwayat Unggahan Terbaru</h3>
          <Link href="/history" className="shrink-0 text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1 transition-all mt-1 sm:mt-0 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20">
            <span>Lihat Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
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
  );
}
