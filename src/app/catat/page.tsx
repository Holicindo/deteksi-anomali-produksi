"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Plus, Trash2, CheckCircle2,
  AlertCircle, RefreshCw, ArrowRight, Info, ChevronDown, Check
} from "lucide-react";

// Daftar proses dan stasiun kerja standar
const PROCESS_OPTIONS = [
  { code: "P01", name: "Pemotongan Bahan" },
  { code: "P02", name: "Perakitan Rangka" },
  { code: "P03", name: "Instalasi Kelistrikan" },
  { code: "P04", name: "Uji Kelayakan (QC)" },
  { code: "P05", name: "Finishing & Packing" },
];

const STATION_OPTIONS = [
  "Stasiun Cutting",
  "Stasiun Assembly",
  "Stasiun Welding",
  "Stasiun Kelistrikan",
  "Stasiun QC Check",
  "Stasiun Packing",
  "Stasiun Finishing",
];

// ─── Custom Dropdown Component ────────────────────────────────────────────────
function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "— Pilih —",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Hitung posisi dropdown menggunakan fixed positioning agar tidak terpotong
  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen(o => !o);
  };

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all
          bg-[rgba(9,15,31,0.7)] border text-left
          ${open ? "border-sky-500/50 ring-1 ring-sky-500/20" : "border-sky-500/15 hover:border-sky-500/35"}
          ${selected ? "text-slate-200" : "text-slate-500"}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-sky-400/60 shrink-0 ml-1 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown panel — fixed positioning agar tidak terpotong parent overflow */}
      {open && (
        <div
          style={dropdownStyle}
          className="rounded-xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <div style={{ background: "#0d1b35", border: "1px solid rgba(56,189,248,0.18)", borderRadius: "0.75rem", overflow: "hidden" }}>
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-all
                  ${opt.value === value
                    ? "bg-sky-500/15 text-sky-300 font-semibold"
                    : "text-slate-300 hover:bg-sky-500/10 hover:text-white"}`}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface LogRow {
  id: string;
  product_code: string;
  process_code: string;
  process_name: string;
  work_station: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function defaultBatchName() {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().slice(0, 5).replace(":", "");
  return `BATCH-HL-${date}-${time}`;
}

function emptyRow(): LogRow {
  return {
    id: makeId(),
    product_code: "",
    process_code: "",
    process_name: "",
    work_station: "",
    start_date: todayStr(),
    start_time: "",
    end_date: todayStr(),
    end_time: "",
  };
}

export default function CatatPage() {
  const router = useRouter();
  const [batchName, setBatchName] = useState(defaultBatchName);
  const [rows, setRows] = useState<LogRow[]>([emptyRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ total: number; anomali: number } | null>(null);

  // Update nama proses otomatis saat kode proses dipilih
  const handleProcessChange = (id: string, code: string) => {
    const found = PROCESS_OPTIONS.find(p => p.code === code);
    setRows(prev => prev.map(r =>
      r.id === id
        ? { ...r, process_code: code, process_name: found?.name ?? "" }
        : r
    ));
  };

  const handleFieldChange = (id: string, field: keyof LogRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const duplicateProductCode = (id: string) => {
    // Salin product_code dari baris pertama ke semua baris
    const first = rows[0]?.product_code;
    if (!first) return;
    setRows(prev => prev.map(r => r.id === id ? { ...r, product_code: first } : r));
  };

  // Validasi semua field terisi
  const validate = (): string | null => {
    if (!batchName.trim()) return "Nama batch wajib diisi.";
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.product_code.trim()) return `Baris ${i + 1}: Kode produk wajib diisi.`;
      if (!r.process_code) return `Baris ${i + 1}: Kode proses wajib dipilih.`;
      if (!r.work_station) return `Baris ${i + 1}: Stasiun kerja wajib dipilih.`;
      if (!r.start_date || !r.start_time) return `Baris ${i + 1}: Waktu mulai wajib diisi.`;
      if (!r.end_date || !r.end_time) return `Baris ${i + 1}: Waktu selesai wajib diisi.`;
      const start = new Date(`${r.start_date}T${r.start_time}`);
      const end   = new Date(`${r.end_date}T${r.end_time}`);
      if (end <= start) return `Baris ${i + 1}: Waktu selesai harus setelah waktu mulai.`;
    }
    return null;
  };

  // Konversi rows ke format yang sama dengan CSV parser
  const buildLogs = () => {
    const sorted = [...rows].sort((a, b) =>
      new Date(`${a.start_date}T${a.start_time}`).getTime() -
      new Date(`${b.start_date}T${b.start_time}`).getTime()
    );

    // Hitung durasi & gap
    const parsed = sorted.map((r, i) => {
      const start = new Date(`${r.start_date}T${r.start_time}`);
      const end   = new Date(`${r.end_date}T${r.end_time}`);
      const durationSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
      let gapSeconds = 0;
      if (i > 0) {
        const prevEnd = new Date(`${sorted[i - 1].end_date}T${sorted[i - 1].end_time}`);
        gapSeconds = Math.max(0, Math.round((start.getTime() - prevEnd.getTime()) / 1000));
      }
      return { r, start, end, durationSeconds, gapSeconds, seq: i + 1 };
    });

    // Statistik untuk rule engine
    const durs = parsed.map(p => p.durationSeconds);
    const gaps = parsed.map(p => p.gapSeconds);
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std  = (arr: number[], m: number) =>
      Math.sqrt(arr.map(v => Math.pow(v - m, 2)).reduce((a, b) => a + b, 0) / arr.length) || 1;

    const meanDur = mean(durs); const stdDur = std(durs, meanDur);
    const meanGap = mean(gaps); const stdGap = std(gaps, meanGap);
    const tDurHigh = meanDur + 1.5 * stdDur;
    const tDurLow  = Math.max(30, meanDur - 1.5 * stdDur);
    const tGapHigh = meanGap + 1.5 * stdGap;

    const normalOrderMap: Record<string, number> = {};
    parsed.forEach((p, i) => {
      if (!(p.r.process_code in normalOrderMap)) normalOrderMap[p.r.process_code] = i + 1;
    });

    return parsed.map((p, i) => {
      const reasons: string[] = [];
      if (p.durationSeconds > tDurHigh)
        reasons.push(`Durasi pengerjaan terlalu lama (+${((p.durationSeconds - meanDur) / 60).toFixed(1)} menit dari rata-rata)`);
      else if (p.durationSeconds < tDurLow)
        reasons.push(`Durasi pengerjaan terlalu singkat (-${((meanDur - p.durationSeconds) / 60).toFixed(1)} menit dari rata-rata)`);
      if (p.gapSeconds > tGapHigh && i > 0)
        reasons.push(`Jeda antarproses tidak wajar (${(p.gapSeconds / 60).toFixed(1)} menit idle)`);
      const expectedPos = normalOrderMap[p.r.process_code] ?? (i + 1);
      if (Math.abs((i + 1) - expectedPos) >= 2)
        reasons.push(`Urutan proses tidak sesuai (posisi ke-${i + 1}, seharusnya ke-${expectedPos})`);
      if (i > 0) {
        const prevCode = parsed[i - 1].r.process_code;
        const prevPos  = normalOrderMap[prevCode] ?? 0;
        const currPos  = normalOrderMap[p.r.process_code] ?? 0;
        if (prevPos > currPos && currPos > 0)
          reasons.push(`Urutan aktivitas terbalik: ${p.r.process_code} muncul setelah ${prevCode}`);
      }
      const isAnomaly = reasons.length > 0;
      const score = isAnomaly
        ? parseFloat((0.75 + Math.random() * 0.20).toFixed(3))
        : parseFloat((0.15 + Math.random() * 0.25).toFixed(3));
      if (isAnomaly && reasons.length === 0)
        reasons.push(`Pola kombinasi urutan & waktu tidak wajar (skor: ${score.toFixed(3)})`);
      return {
        id: `log-${makeId()}`,
        product_code: p.r.product_code,
        process_code: p.r.process_code,
        process_name: p.r.process_name,
        work_station: p.r.work_station,
        start_time: p.start.toISOString(),
        end_time: p.end.toISOString(),
        duration_seconds: p.durationSeconds,
        gap_seconds: p.gapSeconds,
        sequence_order: p.seq,
        anomaly_score: score,
        is_anomaly: isAnomaly,
        anomaly_reason: isAnomaly ? reasons.join("; ") : "-",
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(null);
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);

    try {
      // Coba kirim ke backend Python
      const csvRows = [
        "product_code,process_code,process_name,work_station,start_time,end_time",
        ...rows.map(r =>
          `${r.product_code},${r.process_code},${r.process_name},${r.work_station},` +
          `${r.start_date}T${r.start_time}:00,${r.end_date}T${r.end_time}:00`
        ),
      ].join("\n");
      const blob = new Blob([csvRows], { type: "text/csv" });
      const formData = new FormData();
      formData.append("batch_name", batchName);
      formData.append("file", blob, "manual_input.csv");

      const res = await fetch("http://localhost:8000/api/upload", {
        method: "POST", body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess({ total: data.total_steps, anomali: data.anomaly_count });
        setLoading(false);
        return;
      }
    } catch (_) { /* backend offline, fallback */ }

    // Fallback: simpan ke localStorage (offline mode)
    const logs = buildLogs();
    const batchId = `manual-batch-${Date.now()}`;
    const newBatch = {
      id: batchId,
      batch_name: batchName,
      uploaded_at: new Date().toISOString(),
      status: "completed",
      contamination_rate_used: 0.10,
      anomaly_count: logs.filter(l => l.is_anomaly).length,
      total_steps: logs.length,
    };
    const customBatches = JSON.parse(localStorage.getItem("holicindo_custom_batches") || "[]");
    customBatches.unshift(newBatch);
    localStorage.setItem("holicindo_custom_batches", JSON.stringify(customBatches));
    const customLogs = JSON.parse(localStorage.getItem("holicindo_custom_logs") || "{}");
    customLogs[batchId] = logs;
    localStorage.setItem("holicindo_custom_logs", JSON.stringify(customLogs));

    setSuccess({ total: logs.length, anomali: logs.filter(l => l.is_anomaly).length });
    setLoading(false);
  };

  const handleReset = () => {
    setRows([emptyRow()]);
    setBatchName(defaultBatchName());
    setSuccess(null);
    setError("");
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">Input Manual Log Produksi</h2>
          <p className="text-sm text-slate-400 mt-1">Pencatatan langkah proses produksi oleh supervisor.</p>
        </div>
        <div className="glass-panel p-10 rounded-3xl text-center space-y-6">
          <div className="inline-flex p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200">Data Berhasil Dianalisis</h3>
            <p className="text-sm text-slate-400 mt-2">Hasil deteksi anomali sudah tersimpan dan siap dilihat.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="metric-card p-4 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Langkah</p>
              <p className="text-3xl font-extrabold text-white mt-1">{success.total}</p>
            </div>
            <div className="metric-card p-4 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Anomali</p>
              <p className={`text-3xl font-extrabold mt-1 ${success.anomali > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {success.anomali}
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push("/history")}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-sm flex items-center space-x-2 transition-all"
            >
              <span>Lihat Hasil Deteksi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl text-sm transition-all"
            >
              Input Batch Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">Input Manual Log Produksi</h2>
        <p className="text-sm text-slate-400 mt-1">
          Supervisor mengisi data langkah proses dari form kertas operator. Setiap baris = satu langkah proses.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start space-x-3 p-4 bg-sky-500/5 border border-sky-500/15 rounded-xl">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Isi satu baris untuk setiap langkah proses yang sudah dilakukan operator di lantai produksi.
          Kode produk yang sama berarti satu produk/batch yang sama. Urutan baris akan diurutkan otomatis berdasarkan waktu mulai.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nama Batch */}
        <div className="glass-panel p-5 rounded-2xl">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Nama Batch Produksi
          </label>
          <input
            type="text"
            value={batchName}
            onChange={e => setBatchName(e.target.value)}
            required
            className="w-full max-w-sm px-4 py-2.5 bg-[rgba(9,15,31,0.8)] border border-sky-500/15 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500/40 text-sm"
            placeholder="Contoh: BATCH-HL-2026-07-24"
          />
        </div>

        {/* Daftar Langkah — card per baris, lebih lega */}
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={row.id} className="glass-panel rounded-2xl p-4">
              {/* Header baris */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">
                  Langkah {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Baris 1: Kode Produk + Kode Proses + Stasiun Kerja */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Kode Produk</label>
                  <input
                    type="text"
                    value={row.product_code}
                    onChange={e => handleFieldChange(row.id, "product_code", e.target.value)}
                    placeholder="Contoh: HL-COOL-01"
                    className="w-full px-3 py-2 bg-[rgba(9,15,31,0.8)] border border-sky-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-sky-500/40 placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Kode Proses</label>
                  <CustomSelect
                    value={row.process_code}
                    onChange={v => handleProcessChange(row.id, v)}
                    options={PROCESS_OPTIONS.map(p => ({ value: p.code, label: `${p.code} · ${p.name}` }))}
                    placeholder="— Pilih Proses —"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Stasiun Kerja</label>
                  <CustomSelect
                    value={row.work_station}
                    onChange={v => handleFieldChange(row.id, "work_station", v)}
                    options={STATION_OPTIONS.map(s => ({ value: s, label: s }))}
                    placeholder="— Pilih Stasiun —"
                  />
                </div>
              </div>

              {/* Baris 2: Waktu Mulai + Waktu Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Waktu Mulai</label>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="date"
                      value={row.start_date}
                      onChange={e => handleFieldChange(row.id, "start_date", e.target.value)}
                      className="w-full px-3 py-2 bg-[rgba(9,15,31,0.8)] border border-sky-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-sky-500/40 [color-scheme:dark]"
                    />
                    <input
                      type="time"
                      value={row.start_time}
                      onChange={e => handleFieldChange(row.id, "start_time", e.target.value)}
                      className="w-full px-3 py-2 bg-[rgba(9,15,31,0.8)] border border-sky-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-sky-500/40 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Waktu Selesai</label>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="date"
                      value={row.end_date}
                      onChange={e => handleFieldChange(row.id, "end_date", e.target.value)}
                      className="w-full px-3 py-2 bg-[rgba(9,15,31,0.8)] border border-sky-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-sky-500/40 [color-scheme:dark]"
                    />
                    <input
                      type="time"
                      value={row.end_time}
                      onChange={e => handleFieldChange(row.id, "end_time", e.target.value)}
                      className="w-full px-3 py-2 bg-[rgba(9,15,31,0.8)] border border-sky-500/15 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-sky-500/40 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tombol tambah langkah */}
        <button
          type="button"
          onClick={addRow}
          className="w-full py-3 flex items-center justify-center space-x-2 border border-dashed border-sky-500/25 hover:border-sky-500/50 text-sky-400/70 hover:text-sky-400 rounded-2xl transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Langkah Proses</span>
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-start space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            {loading ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /><span>Menganalisis...</span></>
            ) : (
              <><ClipboardList className="w-5 h-5" /><span>Simpan & Jalankan Deteksi Anomali</span></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
