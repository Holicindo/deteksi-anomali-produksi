"use client";

import { useEffect, useState } from "react";
import { 
  History, 
  Search, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Hourglass,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HelpCircle
} from "lucide-react";

interface Batch {
  id: string;
  batch_name: string;
  uploaded_at: string;
  status: string;
  contamination_rate_used: number;
  anomaly_count: number;
  total_steps: number;
}

interface Log {
  id: string;
  batch_id: string;
  product_code: string;
  process_code: string;
  process_name: string;
  work_station: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  gap_seconds: number;
  sequence_order: number;
  anomaly_score: number;
  is_anomaly: boolean;
  anomaly_reason: string;
}

// DEFAULT MOCK BATCHES (jika backend offline)
const defaultMockBatches: Batch[] = [
  { id: "batch-7", batch_name: "BATCH-HL-007", uploaded_at: "2026-07-23T10:15:00Z", status: "completed", contamination_rate_used: 0.10, anomaly_count: 2, total_steps: 5 },
  { id: "batch-6", batch_name: "BATCH-HL-006", uploaded_at: "2026-07-22T16:45:00Z", status: "completed", contamination_rate_used: 0.10, anomaly_count: 3, total_steps: 5 },
  { id: "batch-5", batch_name: "BATCH-HL-005", uploaded_at: "2026-07-22T09:00:00Z", status: "completed", contamination_rate_used: 0.10, anomaly_count: 0, total_steps: 5 }
];

// DEFAULT MOCK LOGS (jika backend offline)
const defaultMockLogs: Record<string, Log[]> = {
  "batch-7": [
    { id: "log-7-1", batch_id: "batch-7", product_code: "HL-COOL-01", process_code: "P01", process_name: "Pemotongan Pipa", work_station: "Stasiun Cutting", start_time: "2026-07-23T10:00:00Z", end_time: "2026-07-23T10:10:00Z", duration_seconds: 600, gap_seconds: 0, sequence_order: 1, anomaly_score: 0.21, is_anomaly: false, anomaly_reason: "-" },
    { id: "log-7-2", batch_id: "batch-7", product_code: "HL-COOL-01", process_code: "P02", process_name: "Pembengkokan Pipa", work_station: "Stasiun Bending", start_time: "2026-07-23T10:11:00Z", end_time: "2026-07-23T10:25:00Z", duration_seconds: 840, gap_seconds: 60, sequence_order: 2, anomaly_score: 0.18, is_anomaly: false, anomaly_reason: "-" },
    { id: "log-7-3", batch_id: "batch-7", product_code: "HL-COOL-01", process_code: "P03", process_name: "Pengelasan Sambungan", work_station: "Stasiun Welding", start_time: "2026-07-23T10:28:00Z", end_time: "2026-07-23T14:45:00Z", duration_seconds: 15420, gap_seconds: 180, sequence_order: 3, anomaly_score: 0.85, is_anomaly: true, anomaly_reason: "Durasi pengerjaan terlalu lama (melebihi batas 1.5 jam)" },
    { id: "log-7-4", batch_id: "batch-7", product_code: "HL-COOL-01", process_code: "P04", process_name: "Uji Kebocoran", work_station: "Stasiun Leak Test", start_time: "2026-07-23T14:47:00Z", end_time: "2026-07-23T15:02:00Z", duration_seconds: 900, gap_seconds: 120, sequence_order: 4, anomaly_score: 0.28, is_anomaly: false, anomaly_reason: "-" },
    { id: "log-7-5", batch_id: "batch-7", product_code: "HL-COOL-01", process_code: "P05", process_name: "Finishing & Packing", work_station: "Stasiun Packing", start_time: "2026-07-23T15:03:00Z", end_time: "2026-07-23T15:20:00Z", duration_seconds: 1020, gap_seconds: 60, sequence_order: 5, anomaly_score: 0.72, is_anomaly: true, anomaly_reason: "Pola kombinasi urutan & waktu tidak wajar" }
  ],
  "batch-6": [
    { id: "log-6-1", batch_id: "batch-6", product_code: "HL-COOL-02", process_code: "P01", process_name: "Pemotongan Pipa", work_station: "Stasiun Cutting", start_time: "2026-07-22T16:00:00Z", end_time: "2026-07-22T16:12:00Z", duration_seconds: 720, gap_seconds: 0, sequence_order: 1, anomaly_score: 0.25, is_anomaly: false, anomaly_reason: "-" },
    { id: "log-6-2", batch_id: "batch-6", product_code: "HL-COOL-02", process_code: "P03", process_name: "Pengelasan Sambungan", work_station: "Stasiun Welding", start_time: "2026-07-22T16:14:00Z", end_time: "2026-07-22T16:30:00Z", duration_seconds: 960, gap_seconds: 120, sequence_order: 2, anomaly_score: 0.79, is_anomaly: true, anomaly_reason: "Urutan aktivitas tidak sesuai standar (Melompati P02)" },
    { id: "log-6-3", batch_id: "batch-6", product_code: "HL-COOL-02", process_code: "P02", process_name: "Pembengkokan Pipa", work_station: "Stasiun Bending", start_time: "2026-07-22T16:32:00Z", end_time: "2026-07-22T16:44:00Z", duration_seconds: 720, gap_seconds: 120, sequence_order: 3, anomaly_score: 0.74, is_anomaly: true, anomaly_reason: "Urutan aktivitas tidak sesuai standar (P02 setelah P03)" },
    { id: "log-6-4", batch_id: "batch-6", product_code: "HL-COOL-02", process_code: "P04", process_name: "Uji Kebocoran", work_station: "Stasiun Leak Test", start_time: "2026-07-22T16:46:00Z", end_time: "2026-07-22T16:58:00Z", duration_seconds: 720, gap_seconds: 120, sequence_order: 4, anomaly_score: 0.22, is_anomaly: false, anomaly_reason: "-" },
    { id: "log-6-5", batch_id: "batch-6", product_code: "HL-COOL-02", process_code: "P05", process_name: "Finishing & Packing", work_station: "Stasiun Packing", start_time: "2026-07-22T17:00:00Z", end_time: "2026-07-22T21:30:00Z", duration_seconds: 16200, gap_seconds: 120, sequence_order: 5, anomaly_score: 0.88, is_anomaly: true, anomaly_reason: "Durasi pengerjaan terlalu lama (idle di packing)" }
  ],
  "batch-5": [
    { id: "log-5-1", batch_id: "batch-5", product_code: "HL-COOL-03", process_code: "P01", process_name: "Pemotongan Pipa", work_station: "Stasiun Cutting", start_time: "2026-07-22T08:00:00Z", end_time: "2026-07-22T08:11:00Z", duration_seconds: 660, gap_seconds: 0, sequence_order: 1, anomaly_score: 0.15, is_anomaly: false, anomaly_reason: "-" },
    { id: "log-5-2", batch_id: "batch-5", product_code: "HL-COOL-03", process_code: "P02", process_name: "Pembengkokan Pipa", work_station: "Stasiun Bending", start_time: "2026-07-22T08:13:00Z", end_time: "2026-07-22T08:24:00Z", duration_seconds: 660, gap_seconds: 120, sequence_order: 2, anomaly_score: 0.12, is_anomaly: false, anomaly_reason: "-" },
    { id: "log-5-3", batch_id: "batch-5", product_code: "HL-COOL-03", process_code: "P03", process_name: "Pengelasan Sambungan", work_station: "Stasiun Welding", start_time: "2026-07-22T08:26:00Z", end_time: "2026-07-22T08:50:00Z", duration_seconds: 1440, gap_seconds: 120, sequence_order: 3, anomaly_score: 0.16, is_anomaly: false, anomaly_reason: "-" },
    { id: "log-5-4", batch_id: "batch-5", product_code: "HL-COOL-03", process_code: "P04", process_name: "Uji Kebocoran", work_station: "Stasiun Leak Test", start_time: "2026-07-22T08:52:00Z", end_time: "2026-07-22T09:05:00Z", duration_seconds: 780, gap_seconds: 120, sequence_order: 4, anomaly_score: 0.14, is_anomaly: false, anomaly_reason: "-" },
    { id: "log-5-5", batch_id: "batch-5", product_code: "HL-COOL-03", process_code: "P05", process_name: "Finishing & Packing", work_station: "Stasiun Packing", start_time: "2026-07-22T09:06:00Z", end_time: "2026-07-22T09:25:00Z", duration_seconds: 1140, gap_seconds: 60, sequence_order: 5, anomaly_score: 0.18, is_anomaly: false, anomaly_reason: "-" }
  ]
};

export default function HistoryPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batchDetails, setBatchDetails] = useState<Log[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Ambil daftar batch
  const fetchBatches = async (autoSelectFirst = true) => {
    setLoadingList(true);
    try {
      const res = await fetch("http://localhost:8000/api/batches");
      if (res.ok) {
        const data = await res.json();
        
        // Gabungkan dengan data custom di localStorage (jika ada)
        const customBatchesStr = localStorage.getItem("holicindo_custom_batches") || "[]";
        const customBatches = JSON.parse(customBatchesStr);
        
        const merged = [...customBatches, ...data];
        
        if (merged.length > 0) {
          setBatches(merged);
          if (autoSelectFirst && merged.length > 0) {
            setSelectedBatchId(merged[0].id);
          }
        } else {
          // Fallback ke default mock
          setBatches(defaultMockBatches);
          if (autoSelectFirst) setSelectedBatchId(defaultMockBatches[0].id);
        }
      } else {
        throw new Error("Gagal mengambil dari API");
      }
    } catch (err) {
      console.log("Backend offline, loading mock & custom local batches", err);
      setIsDemoMode(true);
      
      const customBatchesStr = localStorage.getItem("holicindo_custom_batches") || "[]";
      const customBatches = JSON.parse(customBatchesStr);
      const merged = [...customBatches, ...defaultMockBatches];
      
      setBatches(merged);
      if (autoSelectFirst && merged.length > 0) {
        setSelectedBatchId(merged[0].id);
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Ambil detail log saat batch_id berubah
  useEffect(() => {
    if (!selectedBatchId) return;

    const fetchLogs = async () => {
      setLoadingDetails(true);
      setExpandedLogId(null);
      
      // 1. Cek dulu apakah batch_id ini milik custom batch di localStorage
      const customLogsStr = localStorage.getItem("holicindo_custom_logs") || "{}";
      const customLogs = JSON.parse(customLogsStr);
      
      if (customLogs[selectedBatchId]) {
        setBatchDetails(customLogs[selectedBatchId]);
        setLoadingDetails(false);
        return;
      }

      // 2. Cek apakah milik default mock data
      if (defaultMockLogs[selectedBatchId]) {
        setBatchDetails(defaultMockLogs[selectedBatchId]);
        setLoadingDetails(false);
        return;
      }

      // 3. Jika bukan keduanya, tarik dari backend API
      try {
        const res = await fetch(`http://localhost:8000/api/batches/${selectedBatchId}`);
        if (res.ok) {
          const data = await res.json();
          setBatchDetails(data.logs || []);
        } else {
          setBatchDetails([]);
        }
      } catch (err) {
        console.log("Error fetching from backend, loading fallback empty logs", err);
        setBatchDetails([]);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchLogs();
  }, [selectedBatchId]);

  // Hapus Batch
  const handleDeleteBatch = async (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus data batch ini beserta seluruh log-nya?")) return;

    try {
      // 1. Hapus dari database via API
      const res = await fetch(`http://localhost:8000/api/batches/${batchId}`, {
        method: "DELETE"
      });

      // 2. Hapus dari localStorage jika ada di sana
      const customBatchesStr = localStorage.getItem("holicindo_custom_batches") || "[]";
      let customBatches = JSON.parse(customBatchesStr);
      customBatches = customBatches.filter((b: any) => b.id !== batchId);
      localStorage.setItem("holicindo_custom_batches", JSON.stringify(customBatches));

      const customLogsStr = localStorage.getItem("holicindo_custom_logs") || "{}";
      const customLogs = JSON.parse(customLogsStr);
      if (customLogs[batchId]) {
        delete customLogs[batchId];
        localStorage.setItem("holicindo_custom_logs", JSON.stringify(customLogs));
      }

      // Refresh list
      alert("Batch berhasil dihapus.");
      fetchBatches(selectedBatchId === batchId);
    } catch (err) {
      alert("Gagal menghapus batch.");
    }
  };

  // Format durasi detik ke menit/detik
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}d`;
    return `${mins}m ${secs}d`;
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  
  // Filter batch berdasarkan search query
  const filteredBatches = batches.filter(b => 
    b.batch_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">Riwayat & Hasil Deteksi Anomali</h2>
        <p className="text-sm text-slate-400 mt-1">
          Daftar batch log produksi beserta status klasifikasi anomali Isolation Forest.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: Daftar Batch */}
        <div className="glass-panel rounded-3xl p-6 h-[75vh] flex flex-col">
          {/* Pencarian */}
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari nama batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 text-sm"
            />
          </div>

          {/* List Item */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingList ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
                <span className="text-xs text-slate-500">Memuat data batch...</span>
              </div>
            ) : filteredBatches.map((batch) => {
              const isSelected = batch.id === selectedBatchId;
              const hasAnomaly = batch.anomaly_count > 0;

              return (
                <div
                  key={batch.id}
                  onClick={() => setSelectedBatchId(batch.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                    isSelected
                      ? "bg-sky-500/15 border-sky-400/40 shadow-[0_0_16px_rgba(14,165,233,0.15)]"
                      : "bg-[rgba(9,15,31,0.5)] border-sky-500/8 hover:border-sky-500/20 hover:bg-sky-500/5"
                  }`}
                >
                  <div className="space-y-1.5 overflow-hidden pr-2">
                    <h4 className="text-sm font-semibold text-slate-200 truncate">{batch.batch_name}</h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span>{batch.total_steps} Langkah</span>
                      <span>•</span>
                      <span>{formatDate(batch.uploaded_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0">
                    {hasAnomaly ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{batch.anomaly_count}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Ok</span>
                      </span>
                    )}

                    <button
                      onClick={(e) => handleDeleteBatch(batch.id, e)}
                      className="p-1.5 bg-slate-900 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/30 text-slate-500 hover:text-red-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {!loadingList && filteredBatches.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">
                Tidak ada data batch ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: Detail Log Batch Terpilih */}
        <div className="glass-panel rounded-3xl p-6 h-[75vh] lg:col-span-2 flex flex-col">
          {selectedBatch ? (
            <>
              {/* Header Informasi Batch */}
              <div className="pb-5 border-b border-sky-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-200">{selectedBatch.batch_name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Diunggah pada {formatDate(selectedBatch.uploaded_at)} • Sensitivitas Model: {selectedBatch.contamination_rate_used * 100}%
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <div className="px-4 py-2 bg-[rgba(9,15,31,0.7)] border border-sky-500/15 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Langkah</p>
                    <p className="text-base font-bold text-slate-200 mt-0.5">{selectedBatch.total_steps}</p>
                  </div>
                  <div className={`px-4 py-2 border rounded-2xl text-center ${
                    selectedBatch.anomaly_count > 0 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider">Langkah Anomali</p>
                    <p className="text-base font-bold mt-0.5">{selectedBatch.anomaly_count}</p>
                  </div>
                </div>
              </div>

              {/* Tabel Logs */}
              <div className="flex-1 overflow-y-auto mt-4 pr-1">
                {/* Keterangan Skala Skor Isolation Forest */}
                <div className="mb-4 px-4 py-3 bg-sky-500/5 border border-sky-500/10 rounded-xl flex items-start space-x-3">
                  <span className="text-sky-400 mt-0.5 shrink-0 text-base">ℹ</span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    <strong className="text-sky-400">Skor Anomali Isolation Forest:</strong>{" "}
                    Nilai mendekati <strong className="text-rose-400">1.0</strong> = sangat menyimpang (anomali kuat) —
                    mendekati <strong className="text-emerald-400">0.0</strong> = sesuai pola normal.
                    Threshold aktif: <strong className="text-slate-300">{selectedBatch.contamination_rate_used * 100}%</strong> contamination rate.
                  </p>
                </div>
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
                    <span className="text-xs text-slate-500">Menganalisis data log langkah...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header Tabel Mini */}
                    <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <div className="col-span-1 text-center">No</div>
                      <div className="col-span-4">Proses / Stasiun</div>
                      <div className="col-span-2 text-right">Durasi</div>
                      <div className="col-span-2 text-right">Jeda</div>
                      <div className="col-span-2 text-center">Skor AI</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Baris Logs */}
                    {batchDetails.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const hasAnomaly = log.is_anomaly;

                      return (
                        <div key={log.id} className="space-y-1">
                          <div
                            onClick={() => {
                              if (hasAnomaly) {
                                setExpandedLogId(isExpanded ? null : log.id);
                              }
                            }}
                            className={`grid grid-cols-12 items-center px-4 py-3 border rounded-xl transition-all duration-150 ${
                              hasAnomaly 
                                ? isExpanded
                                  ? "border-red-500 bg-red-500/10 cursor-pointer shadow-md shadow-red-500/5" 
                                  : "border-red-500/25 hover:border-red-500/45 bg-red-500/5 cursor-pointer"
                                : "bg-[rgba(9,15,31,0.5)] border-sky-500/8 hover:border-sky-500/18"
                            }`}
                          >
                            {/* Sequence */}
                            <div className="col-span-1 text-center font-bold text-slate-400 text-sm">
                              {log.sequence_order}
                            </div>

                            {/* Name & Station */}
                            <div className="col-span-4 overflow-hidden">
                              <p className="text-sm font-semibold text-slate-200 truncate">{log.process_name}</p>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{log.work_station} ({log.product_code})</p>
                            </div>

                            {/* Durasi */}
                            <div className="col-span-2 text-right font-medium text-slate-300 text-sm flex flex-col justify-center items-end pr-2">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>{formatDuration(log.duration_seconds)}</span>
                              </span>
                            </div>

                            {/* Jeda */}
                            <div className="col-span-2 text-right font-medium text-slate-300 text-sm flex flex-col justify-center items-end pr-2">
                              {log.sequence_order === 1 ? (
                                <span className="text-xs text-slate-650 font-bold uppercase tracking-wider">Awal</span>
                              ) : (
                                <span className="flex items-center space-x-1">
                                  <Hourglass className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{formatDuration(log.gap_seconds)}</span>
                                </span>
                              )}
                            </div>

                            {/* Anomaly Score */}
                            <div className="col-span-2 text-center flex flex-col items-center justify-center">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                hasAnomaly 
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}>
                                {log.anomaly_score.toFixed(3)}
                              </span>
                            </div>

                            {/* Icon Arrow */}
                            <div className="col-span-1 text-center flex justify-center">
                              {hasAnomaly && (
                                isExpanded ? <ChevronUp className="w-4 h-4 text-red-400" /> : <ChevronDown className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                          </div>

                          {/* Detail Penjelasan Anomali (Expanded) */}
                          {hasAnomaly && isExpanded && (
                            <div className="mx-4 p-4 bg-red-500/10 border-x border-b border-red-500/30 rounded-b-2xl -mt-2 animate-fadeIn text-xs text-red-200">
                              <p className="font-bold flex items-center space-x-1.5 text-red-400">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Analisis Penyebab Anomali (Isolation Forest + Rule Engine):</span>
                              </p>
                              <p className="mt-2 pl-5 leading-relaxed font-semibold">
                                {log.anomaly_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
              <HelpCircle className="w-16 h-16 text-slate-700" />
              <div className="text-center">
                <h4 className="text-lg font-bold text-slate-400">Pilih Batch Produksi</h4>
                <p className="text-xs text-slate-500 mt-1">Pilih salah satu batch di sebelah kiri untuk melihat log aktivitas secara detail.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
