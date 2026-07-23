import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
import uuid
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Import detektor anomali kita
from anomaly_detector import preprocess_and_detect

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Inisialisasi Supabase Client (jika ada credentials)
supabase_client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client, Client
        supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Successfully connected to Supabase!")
    except Exception as e:
        print(f"Error connecting to Supabase: {e}. Fallback to In-Memory storage.")
else:
    print("Supabase credentials not found. Using In-Memory fallback storage for testing.")

# In-Memory Storage Fallback (untuk testing lokal tanpa database)
in_memory_batches = []
in_memory_logs = {}
in_memory_settings = {"contamination_rate": 0.10}

app = FastAPI(
    title="PT Holicindo Anomaly Detection API",
    description="API untuk mendeteksi anomali urutan dan waktu proses produksi menggunakan Isolation Forest",
    version="1.0.0"
)

# Aktifkan CORS agar Next.js di frontend bisa memanggil backend ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SettingsUpdate(BaseModel):
    contamination_rate: float

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(payload: LoginRequest):
    if payload.username == "admin" and payload.password == "adminholicindo":
        return {
            "status": "success",
            "token": "mock-jwt-token-for-holicindo-admin",
            "user": {
                "username": "admin",
                "name": "Administrator Holicindo",
                "role": "admin"
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Username atau password salah")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "PT Holicindo Anomaly Detection API is running.",
        "database_connected": supabase_client is not None
    }

# 1. API: Dapatkan Nilai Pengaturan (Contamination Rate)
@app.get("/api/settings")
def get_settings():
    if supabase_client:
        try:
            res = supabase_client.table("system_settings").select("*").order("id", desc=True).limit(1).execute()
            if res.data:
                return res.data[0]
            # Jika belum ada data di tabel
            return {"contamination_rate": 0.10}
        except Exception as e:
            return {"error": str(e), "contamination_rate": 0.10}
    else:
        return in_memory_settings

# 2. API: Simpan Nilai Pengaturan Baru
@app.post("/api/settings")
def update_settings(payload: SettingsUpdate):
    if payload.contamination_rate <= 0 or payload.contamination_rate > 0.5:
        raise HTTPException(status_code=400, detail="Contamination rate harus di antara 0 dan 0.5")
    
    if supabase_client:
        try:
            res = supabase_client.table("system_settings").insert({
                "contamination_rate": payload.contamination_rate
            }).execute()
            return {"message": "Pengaturan berhasil diperbarui", "data": res.data[0]}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal menyimpan ke Supabase: {str(e)}")
    else:
        in_memory_settings["contamination_rate"] = payload.contamination_rate
        return {"message": "Pengaturan berhasil diperbarui (In-Memory)", "data": in_memory_settings}

# 3. API: Unggah File Log Produksi dan Jalankan AI Deteksi
@app.post("/api/upload")
async def upload_production_log(
    batch_name: str = Form(...),
    file: UploadFile = File(...)
):
    # Baca file upload (.csv atau .xlsx)
    contents = await file.read()
    filename = file.filename.lower()
    
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Format file harus .csv atau .xlsx")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file: {str(e)}")

    # Validasi kolom yang dibutuhkan
    required_cols = ['product_code', 'process_code', 'process_name', 'work_station', 'start_time', 'end_time']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400, 
            detail=f"Kolom file tidak sesuai. Kolom kurang: {', '.join(missing_cols)}"
        )

    # Ambil nilai contamination_rate terbaru
    settings = get_settings()
    contamination = settings.get("contamination_rate", 0.10)

    # Jalankan Preprocessing dan Isolation Forest
    try:
        result_df = preprocess_and_detect(df, contamination=contamination)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menjalankan algoritma AI: {str(e)}")

    # Hitung ringkasan batch
    total_steps = len(result_df)
    anomaly_count = int(result_df['is_anomaly'].sum())
    
    batch_id = str(uuid.uuid4())
    
    # 4. Simpan Hasil Deteksi ke Database (Supabase atau In-Memory)
    if supabase_client:
        try:
            # A. Buat Batch Baru
            batch_data = {
                "id": batch_id,
                "batch_name": batch_name,
                "status": "completed",
                "contamination_rate_used": contamination,
                "anomaly_count": anomaly_count,
                "total_steps": total_steps
            }
            supabase_client.table("production_batches").insert(batch_data).execute()
            
            # B. Buat Log Deteksi
            logs_to_insert = []
            for _, row in result_df.iterrows():
                logs_to_insert.append({
                    "batch_id": batch_id,
                    "product_code": row['product_code'],
                    "process_code": row['process_code'],
                    "process_name": row['process_name'],
                    "work_station": row['work_station'],
                    "start_time": row['start_time'].isoformat(),
                    "end_time": row['end_time'].isoformat(),
                    "duration_seconds": int(row['duration_seconds']),
                    "gap_seconds": int(row['gap_seconds']),
                    "sequence_order": int(row['sequence_order']),
                    "anomaly_score": float(row['anomaly_score']),
                    "is_anomaly": bool(row['is_anomaly']),
                    "anomaly_reason": row['anomaly_reason']
                })
                
            # Insert log sekaligus (bulk insert)
            supabase_client.table("production_logs").insert(logs_to_insert).execute()
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal menyimpan ke database Supabase: {str(e)}")
    else:
        # In-Memory Simpan
        batch_data = {
            "id": batch_id,
            "batch_name": batch_name,
            "uploaded_at": pd.Timestamp.now().isoformat(),
            "status": "completed",
            "contamination_rate_used": contamination,
            "anomaly_count": anomaly_count,
            "total_steps": total_steps
        }
        in_memory_batches.append(batch_data)
        
        logs_to_insert = []
        for _, row in result_df.iterrows():
            logs_to_insert.append({
                "id": str(uuid.uuid4()),
                "batch_id": batch_id,
                "product_code": row['product_code'],
                "process_code": row['process_code'],
                "process_name": row['process_name'],
                "work_station": row['work_station'],
                "start_time": row['start_time'].isoformat(),
                "end_time": row['end_time'].isoformat(),
                "duration_seconds": int(row['duration_seconds']),
                "gap_seconds": int(row['gap_seconds']),
                "sequence_order": int(row['sequence_order']),
                "anomaly_score": float(row['anomaly_score']),
                "is_anomaly": bool(row['is_anomaly']),
                "anomaly_reason": row['anomaly_reason']
            })
        in_memory_logs[batch_id] = logs_to_insert

    return {
        "message": "File berhasil diunggah dan dianalisis.",
        "batch_id": batch_id,
        "batch_name": batch_name,
        "total_steps": total_steps,
        "anomaly_count": anomaly_count
    }

# 4. API: Dapatkan Daftar Semua Batch
@app.get("/api/batches")
def get_batches():
    if supabase_client:
        try:
            res = supabase_client.table("production_batches").select("*").order("uploaded_at", desc=True).execute()
            return res.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Sort in_memory_batches by uploaded_at desc
        return sorted(in_memory_batches, key=lambda x: x.get("uploaded_at", ""), reverse=True)

# 5. API: Dapatkan Detail Log dalam Satu Batch
@app.get("/api/batches/{batch_id}")
def get_batch_detail(batch_id: str):
    if supabase_client:
        try:
            # Ambil detail batch
            batch_res = supabase_client.table("production_batches").select("*").eq("id", batch_id).execute()
            if not batch_res.data:
                raise HTTPException(status_code=404, detail="Batch tidak ditemukan")
                
            # Ambil log dalam batch tersebut, urutkan berdasarkan sequence_order
            logs_res = supabase_client.table("production_logs").select("*").eq("batch_id", batch_id).order("sequence_order").execute()
            
            return {
                "batch": batch_res.data[0],
                "logs": logs_res.data
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Cari di in-memory
        batch = next((b for b in in_memory_batches if b["id"] == batch_id), None)
        if not batch:
            raise HTTPException(status_code=404, detail="Batch tidak ditemukan")
        logs = in_memory_logs.get(batch_id, [])
        return {
            "batch": batch,
            "logs": logs
        }

# 6. API: Hapus Batch
@app.delete("/api/batches/{batch_id}")
def delete_batch(batch_id: str):
    if supabase_client:
        try:
            # Hapus batch (akan otomatis men-cascade hapus log karena ON DELETE CASCADE)
            supabase_client.table("production_batches").delete().eq("id", batch_id).execute()
            return {"message": "Batch berhasil dihapus"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        global in_memory_batches
        in_memory_batches = [b for b in in_memory_batches if b["id"] != batch_id]
        if batch_id in in_memory_logs:
            del in_memory_logs[batch_id]
        return {"message": "Batch berhasil dihapus (In-Memory)"}

# 7. API: Ringkasan Dashboard (Statistik & Visualisasi)
@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    batches = get_batches()
    
    total_batches = len(batches)
    total_anomalies = sum(b.get("anomaly_count", 0) for b in batches)
    total_steps = sum(b.get("total_steps", 0) for b in batches)
    
    # Kumpulkan data log untuk analisis lebih mendalam
    all_logs = []
    if supabase_client:
        try:
            res = supabase_client.table("production_logs").select("work_station, is_anomaly, duration_seconds, process_name").execute()
            all_logs = res.data
        except Exception as e:
            print(f"Error fetching dashboard detail: {e}")
    else:
        for b_id, logs in in_memory_logs.items():
            all_logs.extend(logs)
            
    # Analisis Stasiun Kerja Bermasalah
    station_anomalies = {}
    process_durations = {}
    
    for log in all_logs:
        station = log.get("work_station", "Unknown")
        process = log.get("process_name", "Unknown")
        is_anom = log.get("is_anomaly", False)
        duration = log.get("duration_seconds", 0)
        
        # Hitung jumlah anomali per stasiun
        if is_anom:
            station_anomalies[station] = station_anomalies.get(station, 0) + 1
            
        # Kumpulkan durasi per proses
        if process not in process_durations:
            process_durations[process] = []
        process_durations[process].append(duration)
        
    # Urutkan stasiun paling bermasalah
    sorted_station_anomalies = [
        {"station": k, "anomalies": v} for k, v in sorted(station_anomalies.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Hitung rata-rata durasi per proses
    average_process_durations = []
    for proc, durs in process_durations.items():
        if durs:
            average_process_durations.append({
                "process_name": proc,
                "average_duration_minutes": round(sum(durs) / len(durs) / 60, 2)
            })
            
    # Hitung persentase anomali
    anomaly_percentage = round((total_anomalies / total_steps * 100), 2) if total_steps > 0 else 0
            
    return {
        "total_batches": total_batches,
        "total_anomalies": total_anomalies,
        "total_steps": total_steps,
        "anomaly_percentage": anomaly_percentage,
        "high_risk_stations": sorted_station_anomalies[:5], # Top 5 stasiun bermasalah
        "average_process_durations": average_process_durations,
        "batches_summary": [
            {
                "batch_name": b.get("batch_name"),
                "total_steps": b.get("total_steps"),
                "anomaly_count": b.get("anomaly_count"),
                "uploaded_at": b.get("uploaded_at")
            } for b in batches[:10] # 10 batch terbaru
        ]
    }
