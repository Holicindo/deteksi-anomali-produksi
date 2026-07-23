# SCRIPT UNTUK MENJALANKAN FRONTEND DAN BACKEND BERSAMAAN (WINDOWS POWERSHELL)
# Jalankan script ini dari terminal PowerShell kamu di dalam folder proyek.

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "         MENJALANKAN SISTEM DETEKSI ANOMALI PT HOLICINDO        " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Jalankan FastAPI Python Backend di terminal baru
Write-Host "[1/2] Menjalankan API Backend Python (FastAPI + Uvicorn)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Memulai FastAPI Backend...' -ForegroundColor Green; cd backend; .\venv\Scripts\activate; uvicorn main:app --reload --port 8000"

# 2. Jalankan Next.js Frontend di terminal baru
Write-Host "[2/2] Menjalankan Frontend Next.js..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Memulai Next.js Dev Server...' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "-----------------------------------------------------------------" -ForegroundColor Green
Write-Host "Sistem berhasil dijalankan!" -ForegroundColor Green
Write-Host "-> Frontend Web:  http://localhost:3000" -ForegroundColor White
Write-Host "-> API Docs:      http://localhost:8000/docs (Swagger UI)" -ForegroundColor White
Write-Host "-----------------------------------------------------------------" -ForegroundColor Green
Write-Host ""
Write-Host "Jendela kontrol ini bisa ditutup. Terminal frontend & backend akan tetap berjalan di background." -ForegroundColor Gray
