-- RANCANGAN DATABASE SQL UNTUK SUPABASE
-- Silakan salin dan jalankan query ini di SQL Editor Supabase kamu.

-- 1. Tabel Profil Pengguna (untuk menyimpan detail tambahan supervisor)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'supervisor' CHECK (role IN ('admin', 'supervisor', 'operator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aktifkan Row Level Security (RLS) di Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Buat policy agar pengguna bisa melihat data profil mereka sendiri
CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Allow users to update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. Tabel Batch Produksi (Production Batches)
CREATE TABLE IF NOT EXISTS public.production_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    contamination_rate_used FLOAT,
    anomaly_count INT DEFAULT 0,
    total_steps INT DEFAULT 0
);

-- Aktifkan RLS di Production Batches
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;

-- Policy untuk Production Batches (Akses penuh untuk pengguna terautentikasi)
CREATE POLICY "Enable read for all authenticated users" 
ON public.production_batches FOR SELECT 
USING (true);

CREATE POLICY "Enable write access for authenticated users" 
ON public.production_batches FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" 
ON public.production_batches FOR DELETE 
USING (true);

-- 3. Tabel Detail Log Produksi (Production Logs)
CREATE TABLE IF NOT EXISTS public.production_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.production_batches(id) ON DELETE CASCADE,
    product_code VARCHAR(50) NOT NULL,
    process_code VARCHAR(50) NOT NULL,
    process_name VARCHAR(100) NOT NULL,
    work_station VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INT NOT NULL,
    gap_seconds INT,
    sequence_order INT NOT NULL,
    anomaly_score FLOAT,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT
);

-- Aktifkan RLS di Production Logs
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;

-- Policy untuk Production Logs
CREATE POLICY "Enable read logs for all authenticated users" 
ON public.production_logs FOR SELECT 
USING (true);

CREATE POLICY "Enable insert logs for authenticated users" 
ON public.production_logs FOR INSERT 
WITH CHECK (true);

-- 4. Tabel Pengaturan Sistem (System Settings)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id SERIAL PRIMARY KEY,
    contamination_rate FLOAT DEFAULT 0.10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Isi nilai awal pengaturan sistem
INSERT INTO public.system_settings (contamination_rate) VALUES (0.10);

-- Aktifkan RLS di System Settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy untuk System Settings
CREATE POLICY "Enable read settings for everyone" 
ON public.system_settings FOR SELECT 
USING (true);

CREATE POLICY "Enable insert/update settings for authenticated users" 
ON public.system_settings FOR INSERT 
WITH CHECK (true);

-- MEMBUAT TRIGGER OTOMATIS SAAT USER MENDAFTAR (Supabase Auth -> Public Profiles)
-- Fungsi ini akan otomatis menyalin data dari auth.users ke public.profiles saat user melakukan sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Supervisor Baru'),
    'supervisor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat trigger setelah insert user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
