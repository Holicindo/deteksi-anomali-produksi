import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import LabelEncoder
import datetime

def preprocess_and_detect(df: pd.DataFrame, contamination: float = 0.1) -> pd.DataFrame:
    """
    Memproses data log produksi dan mendeteksi anomali menggunakan Isolation Forest.
    
    Dataframe input minimal harus memiliki kolom:
    - product_code (Kode Produk)
    - process_code (Kode Proses)
    - process_name (Nama Proses)
    - work_station (Stasiun Kerja)
    - start_time (Waktu Mulai, string/datetime)
    - end_time (Waktu Selesai, string/datetime)
    """
    
    # 1. Konversi kolom waktu ke datetime
    df['start_time'] = pd.to_datetime(df['start_time'])
    df['end_time'] = pd.to_datetime(df['end_time'])
    
    # Urutkan berdasarkan waktu mulai untuk mempermudah perhitungan jeda dan urutan
    df = df.sort_values(by=['start_time']).reset_index(drop=True)
    
    # 2. Hitung Fitur Waktu dan Urutan
    df['duration_seconds'] = (df['end_time'] - df['start_time']).dt.total_seconds().astype(int)
    
    # Hitung Jeda (gap) antarproses dalam batch yang sama
    df['gap_seconds'] = 0
    for i in range(1, len(df)):
        gap = (df.loc[i, 'start_time'] - df.loc[i-1, 'end_time']).total_seconds()
        df.loc[i, 'gap_seconds'] = max(0, int(gap))
        
    # Tambahkan urutan langkah (sequence_order)
    df['sequence_order'] = range(1, len(df) + 1)
    
    # 3. Encoding Fitur Kategorikal ke Numerik untuk Algoritma
    le_process = LabelEncoder()
    le_station = LabelEncoder()
    
    # Pastikan data bertipe string sebelum di-encode
    df['process_code_encoded'] = le_process.fit_transform(df['process_code'].astype(str))
    df['work_station_encoded'] = le_station.fit_transform(df['work_station'].astype(str))
    
    # 4. Fitur yang akan dimasukkan ke model Isolation Forest
    features = ['sequence_order', 'process_code_encoded', 'work_station_encoded', 'duration_seconds', 'gap_seconds']
    X = df[features].values
    
    # 5. Inisialisasi dan Latih Model Isolation Forest
    model = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=100
    )
    
    # Latih dan prediksi
    # predict() mengembalikan 1 untuk normal, -1 untuk anomali
    predictions = model.fit_predict(X)
    
    # score_samples() mengembalikan nilai negatif dari skor anomali asli. 
    # Kita kalikan -1 agar bernilai positif (0 s.d 1) di mana mendekati 1 adalah anomali
    raw_scores = -model.score_samples(X)
    
    df['anomaly_score'] = np.round(raw_scores, 4)
    df['is_anomaly'] = predictions == -1
    
    # 6. Analisis Penyebab Anomali (Rule-Based Explainer) — Sesuai BAB II skripsi
    # Hitung statistik baseline dari seluruh data untuk menentukan batas wajar
    mean_duration = df['duration_seconds'].mean()
    std_duration  = df['duration_seconds'].std() if df['duration_seconds'].std() > 0 else 1

    mean_gap = df['gap_seconds'].mean()
    std_gap  = df['gap_seconds'].std() if df['gap_seconds'].std() > 0 else 1

    # Batas wajar: mean ± 1.5 * std  (threshold konservatif)
    threshold_duration_high = mean_duration + 1.5 * std_duration
    threshold_duration_low  = max(30, mean_duration - 1.5 * std_duration)   # minimal 30 detik
    threshold_gap_high      = mean_gap + 1.5 * std_gap

    # Tentukan urutan proses yang paling umum (sebagai "urutan normal")
    # Gunakan mode sequence_order per process_code
    normal_order = (
        df.groupby('process_code')['sequence_order']
        .agg(lambda x: int(x.mode().iloc[0]))
        .to_dict()
    )

    # Susun daftar process_code yang seharusnya muncul (berdasarkan seluruh data)
    all_process_codes = df['process_code'].unique().tolist()

    reasons = []
    for idx, row in df.iterrows():
        if not row['is_anomaly']:
            reasons.append("-")
            continue

        reason_parts = []

        # ── A. Anomali DURASI ────────────────────────────────────────────────
        if row['duration_seconds'] > threshold_duration_high:
            lebih = round((row['duration_seconds'] - mean_duration) / 60, 1)
            reason_parts.append(
                f"Durasi pengerjaan terlalu lama (+{lebih} menit dari rata-rata)"
            )
        elif row['duration_seconds'] < threshold_duration_low:
            kurang = round((mean_duration - row['duration_seconds']) / 60, 1)
            reason_parts.append(
                f"Durasi pengerjaan terlalu singkat (-{kurang} menit dari rata-rata)"
            )

        # ── B. Anomali JEDA (idle time) ──────────────────────────────────────
        if row['gap_seconds'] > threshold_gap_high and row['sequence_order'] > 1:
            idle_menit = round(row['gap_seconds'] / 60, 1)
            reason_parts.append(
                f"Jeda antarproses tidak wajar ({idle_menit} menit idle sebelum proses ini)"
            )

        # ── C. Anomali URUTAN — proses di luar posisi normal ─────────────────
        expected_order = normal_order.get(row['process_code'])
        if expected_order is not None and abs(row['sequence_order'] - expected_order) >= 2:
            reason_parts.append(
                f"Urutan proses tidak sesuai standar "
                f"(posisi ke-{int(row['sequence_order'])}, seharusnya ke-{expected_order})"
            )

        # ── D. Anomali URUTAN — proses muncul setelah proses yang seharusnya lebih akhir
        if idx > 0:
            prev_code  = df.loc[idx - 1, 'process_code']
            curr_code  = row['process_code']
            prev_idx_in_all = all_process_codes.index(prev_code) if prev_code in all_process_codes else -1
            curr_idx_in_all = all_process_codes.index(curr_code) if curr_code in all_process_codes else -1
            if prev_idx_in_all > curr_idx_in_all >= 0:
                reason_parts.append(
                    f"Urutan aktivitas terbalik: {curr_code} muncul setelah {prev_code} "
                    f"(urutan mundur/proses tertukar)"
                )

        # ── E. Fallback: pola kombinasi tidak wajar ──────────────────────────
        if not reason_parts:
            reason_parts.append(
                "Pola kombinasi urutan & waktu tidak wajar "
                f"(skor anomali: {row['anomaly_score']:.3f})"
            )

        reasons.append("; ".join(reason_parts))
            
    df['anomaly_reason'] = reasons
    
    # Hapus kolom temporer encoder agar tidak membingungkan saat masuk ke DB
    df = df.drop(columns=['process_code_encoded', 'work_station_encoded'])
    
    return df
