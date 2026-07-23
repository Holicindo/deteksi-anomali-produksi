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
    
    # 6. Analisis Penyebab Anomali (Rule-Based Explainer)
    # Kami menghitung rata-rata & standar deviasi dari data keseluruhan untuk menentukan batasan
    mean_duration = df['duration_seconds'].mean()
    std_duration = df['duration_seconds'].std() if df['duration_seconds'].std() > 0 else 1
    
    mean_gap = df['gap_seconds'].mean()
    std_gap = df['gap_seconds'].std() if df['gap_seconds'].std() > 0 else 1
    
    # Cek urutan normal yang paling sering muncul
    # Kita petakan urutan normal setiap process_code berdasarkan data terbanyak
    normal_sequences = df.groupby('process_code')['sequence_order'].agg(lambda x: x.value_counts().index[0]).to_dict()
    
    reasons = []
    for idx, row in df.iterrows():
        if row['is_anomaly']:
            reason_parts = []
            
            # Cek apakah durasi terlalu lama/cepat
            if row['duration_seconds'] > (mean_duration + 1.5 * std_duration):
                reason_parts.append("Durasi pengerjaan terlalu lama")
            elif row['duration_seconds'] < max(5, mean_duration - 1.5 * std_duration):
                reason_parts.append("Durasi pengerjaan terlalu singkat")
                
            # Cek apakah jeda terlalu lama
            if row['gap_seconds'] > (mean_gap + 1.5 * std_gap):
                reason_parts.append("Jeda antarproses terlalu lama (idle)")
                
            # Cek apakah urutannya aneh dibanding data mayoritas
            expected_order = normal_sequences.get(row['process_code'], row['sequence_order'])
            if abs(row['sequence_order'] - expected_order) > 1:
                reason_parts.append("Urutan aktivitas tidak sesuai standar")
                
            if not reason_parts:
                reason_parts.append("Pola kombinasi urutan & waktu tidak wajar")
                
            reasons.append("; ".join(reason_parts))
        else:
            reasons.append("-")
            
    df['anomaly_reason'] = reasons
    
    # Hapus kolom temporer encoder agar tidak membingungkan saat masuk ke DB
    df = df.drop(columns=['process_code_encoded', 'work_station_encoded'])
    
    return df
