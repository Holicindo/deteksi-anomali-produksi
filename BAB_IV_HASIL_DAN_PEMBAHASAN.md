# BAB IV
# HASIL DAN PEMBAHASAN

## 4.1 Hasil Penelitian Pendahuluan

### 4.1.1 Identifikasi Kebutuhan Sistem

Tahap penelitian pendahuluan dilakukan melalui observasi langsung dan wawancara dengan pihak PT Holicindo, khususnya bagian produksi dan quality control. Berdasarkan observasi yang dilakukan, diperoleh informasi bahwa proses produksi di PT Holicindo melibatkan beberapa tahapan kerja yang dilakukan secara berurutan dan berulang untuk setiap produk. Setiap tahapan memiliki standar waktu pengerjaan dan urutan aktivitas yang telah ditetapkan dalam prosedur operasional.

Dari hasil wawancara dengan supervisor produksi, teridentifikasi beberapa kondisi yang sering terjadi namun sulit dipantau secara manual, antara lain:

1. Proses yang tidak mengikuti urutan normal, misalnya tahapan finishing dikerjakan sebelum tahapan assembly
2. Proses yang terlewat atau tidak tercatat dalam sistem
3. Durasi proses yang terlalu lama dibandingkan standar waktu, mengindikasikan adanya hambatan atau keterlambatan
4. Durasi proses yang terlalu singkat, yang dapat mengindikasikan proses tidak berjalan lengkap
5. Jeda waktu antarproses yang tidak wajar, misalnya produk menunggu terlalu lama sebelum masuk ke tahapan berikutnya

Kondisi-kondisi tersebut apabila tidak terdeteksi dengan cepat dapat berdampak pada kualitas produk, efisiensi produksi, dan ketepatan waktu penyelesaian. Saat ini, pemantauan masih dilakukan secara manual melalui pengecekan berkala terhadap catatan produksi, sehingga penyimpangan seringkali baru diketahui setelah proses produksi selesai atau bahkan setelah produk sampai ke tahap inspeksi akhir.

Berdasarkan kondisi tersebut, teridentifikasi kebutuhan untuk membangun sistem yang dapat membantu mendeteksi anomali pada urutan dan waktu proses produksi secara lebih cepat dan informatif. Sistem yang diharapkan tidak hanya memberikan informasi apakah suatu data tergolong normal atau anomali, tetapi juga memberikan konteks mengenai jenis penyimpangan yang terjadi sehingga dapat membantu proses evaluasi dan pengambilan keputusan perbaikan.

Kebutuhan pengguna yang teridentifikasi mencakup:

1. Kemampuan mengunggah data proses produksi dalam format yang umum digunakan (CSV/Excel)
2. Proses deteksi anomali yang dapat berjalan secara otomatis tanpa memerlukan keahlian teknis machine learning
3. Tampilan hasil deteksi yang mudah dipahami dan dapat difilter berdasarkan jenis anomali
4. Informasi detail mengenai data yang terdeteksi anomali, termasuk perbandingan dengan kondisi normal
5. Kemampuan mengekspor hasil deteksi untuk keperluan dokumentasi dan pelaporan

### 4.1.2 Analisis Data Awal

Data proses produksi PT Holicindo berasal dari sistem pencatatan aktivitas produksi yang mencatat setiap tahapan kerja yang dilalui oleh produk. Berdasarkan analisis terhadap struktur data yang tersedia, setiap record aktivitas produksi memuat informasi sebagai berikut:

- **ID Produk/Batch**: identitas unik untuk setiap produk atau batch produksi
- **Kode Proses**: kode yang merepresentasikan jenis aktivitas atau tahapan kerja
- **Nama Proses**: deskripsi lengkap dari aktivitas yang dilakukan
- **Stasiun Kerja**: lokasi atau area kerja tempat proses dilakukan
- **Waktu Mulai**: timestamp saat proses dimulai
- **Waktu Selesai**: timestamp saat proses selesai
- **Operator**: petugas yang menangani proses
- **Shift**: periode kerja (pagi, siang, malam)

Contoh struktur data mentah yang diperoleh disajikan pada Tabel 4.1 berikut:

**Tabel 4.1 Contoh Struktur Data Proses Produksi PT Holicindo**

| ID_Produk | Kode_Proses | Nama_Proses | Stasiun_Kerja | Waktu_Mulai | Waktu_Selesai | Operator | Shift |
|-----------|-------------|-------------|---------------|-------------|---------------|----------|-------|
| P001 | A01 | Cutting Material | Station 1 | 2024-01-15 08:05:00 | 2024-01-15 08:50:00 | OP001 | Pagi |
| P001 | A02 | Assembly Part 1 | Station 2 | 2024-01-15 09:10:00 | 2024-01-15 09:45:00 | OP002 | Pagi |
| P001 | A03 | Quality Check 1 | Station 3 | 2024-01-15 10:00:00 | 2024-01-15 10:15:00 | OP003 | Pagi |
| P001 | A04 | Finishing | Station 4 | 2024-01-15 10:30:00 | 2024-01-15 11:15:00 | OP004 | Pagi |

Berdasarkan analisis terhadap data historis selama periode Oktober 2024 hingga Januari 2025, diperoleh total 4.876 record aktivitas produksi dari 342 batch produk. Volume data ini dinilai cukup untuk membentuk pola normal proses produksi.

Dari analisis awal terhadap data tersebut, teridentifikasi beberapa tantangan yang perlu ditangani dalam tahap preprocessing:

1. **Missing Value**: terdapat beberapa record dengan informasi waktu selesai yang kosong, diduga karena proses belum selesai atau kesalahan pencatatan
2. **Inkonsistensi Format Waktu**: sebagian data menggunakan format 24 jam, sebagian menggunakan format 12 jam dengan AM/PM
3. **Data Tidak Berurutan**: record tidak selalu tersimpan dalam urutan kronologis, sehingga perlu dilakukan sorting berdasarkan ID produk dan waktu mulai
4. **Duplikasi Data**: terdapat beberapa record yang tercatat dua kali akibat kesalahan input
5. **Data Tidak Lengkap**: beberapa produk tidak memiliki record untuk seluruh tahapan yang seharusnya dilalui

Meskipun terdapat tantangan tersebut, data dinilai layak untuk digunakan sebagai basis deteksi anomali karena mayoritas data memiliki informasi yang lengkap dan konsisten. Tantangan yang teridentifikasi dapat ditangani melalui tahap preprocessing yang sistematis.

### 4.1.3 Justifikasi Pemilihan Metode

Berdasarkan karakteristik data proses produksi dan kebutuhan sistem yang telah diidentifikasi, dilakukan evaluasi terhadap beberapa algoritma deteksi anomali.
Algoritma yang dipertimbangkan antara lain Local Outlier Factor (LOF), One-Class SVM, DBSCAN, dan Isolation Forest. Perbandingan karakteristik keempat algoritma disajikan pada Tabel 4.2 berikut:

**Tabel 4.2 Perbandingan Algoritma Deteksi Anomali**

| Aspek | LOF | One-Class SVM | DBSCAN | Isolation Forest |
|-------|-----|---------------|--------|------------------|
| Kebutuhan Label | Tidak perlu | Tidak perlu | Tidak perlu | Tidak perlu |
| Kompleksitas Komputasi | O(n²) | O(n²) hingga O(n³) | O(n log n) | O(n log n) |
| Scalability | Kurang baik | Kurang baik | Sedang | Baik |
| Sensitivitas Parameter | Tinggi | Tinggi | Sangat tinggi | Rendah |
| Performa pada Data Multivariat | Baik | Baik | Sedang | Sangat baik |
| Kemudahan Interpretasi | Sedang | Rendah | Sedang | Tinggi |

Berdasarkan perbandingan tersebut, Isolation Forest dipilih sebagai algoritma utama dalam penelitian ini dengan pertimbangan sebagai berikut:

1. **Tidak Memerlukan Label Lengkap**: Data proses produksi PT Holicindo tidak memiliki label normal dan anomali yang baku.
Sebagian besar record menggambarkan kondisi normal, sementara anomali bersifat sporadis dan tidak selalu terdokumentasi.

2. **Efisiensi Komputasi**: Dengan kompleksitas O(n log n), Isolation Forest dapat memproses data dalam jumlah besar dengan waktu yang relatif singkat. Hal ini penting mengingat data produksi akan terus bertambah seiring waktu.

3. **Scalability**: Isolation Forest memiliki kemampuan skalabilitas yang baik, sehingga dapat digunakan ketika volume data produksi meningkat di masa mendatang.

4. **Sensitivitas Parameter Rendah**: Dibandingkan algoritma lain, Isolation Forest memiliki sensitivitas yang lebih rendah terhadap pemilihan parameter. Parameter utama yang perlu disesuaikan hanya jumlah pohon (n_estimators) dan estimasi proporsi anomali (contamination).

5. **Performa pada Data Multivariat**: Data proses produksi memiliki beberapa fitur (durasi, jeda, urutan, stasiun kerja, shift), sehingga membutuhkan algoritma yang dapat menangani hubungan antarvariabel dengan baik.

6. **Kemudahan Interpretasi**: Isolation Forest menghasilkan anomaly score yang dapat diinterpretasikan sebagai tingkat kecenderungan suatu data menjadi anomali.
Score yang mendekati 1 mengindikasikan anomali kuat, sementara score mendekati 0 mengindikasikan data normal.

Selain pertimbangan teknis, pemilihan Isolation Forest juga didukung oleh penelitian terdahulu yang menunjukkan keberhasilan penerapan algoritma ini pada berbagai konteks industri, sebagaimana telah dibahas dalam Bab II. Penelitian Xu et al. (2023) menunjukkan bahwa Isolation Forest efektif untuk mendeteksi anomali pada data yang tidak memiliki label lengkap, sementara penelitian Auliana et al. (2026) membuktikan bahwa Isolation Forest dapat diimplementasikan dalam sistem berbasis web untuk deteksi anomali secara unsupervised.

Berdasarkan seluruh pertimbangan tersebut, Isolation Forest dinilai sebagai pilihan yang paling sesuai dengan karakteristik data proses produksi PT Holicindo dan kebutuhan sistem yang akan dibangun.

## 4.2 Hasil Desain Model

### 4.2.1 Hasil Pengumpulan Data

Pengumpulan data dilakukan dengan mengekstrak data dari sistem pencatatan produksi PT Holicindo untuk periode Oktober 2024 hingga Januari 2025.
Periode tersebut dipilih karena mencakup variasi kondisi produksi yang cukup beragam, termasuk periode normal, periode dengan volume produksi tinggi, dan periode dengan beberapa gangguan yang terdokumentasi. Data diekspor dalam format CSV dan mencakup seluruh record aktivitas produksi yang tercatat dalam sistem.

Hasil pengumpulan data menghasilkan file CSV dengan rincian sebagai berikut:

- **Periode data**: 1 Oktober 2024 - 31 Januari 2025 (4 bulan)
- **Total record awal**: 5.124 record aktivitas
- **Jumlah produk/batch**: 342 batch
- **Jumlah jenis proses**: 12 tahapan kerja standar
- **Jumlah stasiun kerja**: 8 stasiun
- **Jumlah operator**: 24 operator
- **Periode shift**: 3 shift (pagi, siang, malam)

Data yang terkumpul mencakup atribut ID_Produk, Kode_Proses, Nama_Proses, Stasiun_Kerja, Waktu_Mulai, Waktu_Selesai, Operator, dan Shift. Ukuran file data mentah adalah 1,2 MB dengan format CSV.

Sebelum dilakukan preprocessing, dilakukan inspeksi awal terhadap data untuk mengidentifikasi potensi masalah kualitas data.
Dari hasil inspeksi, ditemukan bahwa terdapat 248 record dengan missing value, 36 record terduplikasi, dan inkonsistensi format waktu pada 156 record. Masalah-masalah ini akan ditangani pada tahap preprocessing.

### 4.2.2 Hasil Preprocessing

Tahap preprocessing dilakukan untuk mengubah data mentah menjadi data yang siap digunakan untuk proses deteksi anomali. Preprocessing dilakukan melalui beberapa tahap sistematis yang akan dijelaskan sebagai berikut.

#### a) Pembersihan Data

**Penanganan Missing Value**

Missing value ditemukan terutama pada kolom Waktu_Selesai (184 record) dan kolom Operator (64 record). Untuk missing value pada kolom Waktu_Selesai, dilakukan verifikasi dengan melihat apakah record tersebut merupakan proses yang belum selesai atau kesalahan pencatatan. Record yang merupakan proses belum selesai (data paling baru) tetap dipertahankan dengan penanda khusus, sementara record dengan missing value yang tidak wajar dihapus dari dataset.

Untuk missing value pada kolom Operator, dilakukan imputasi dengan nilai "Unknown" karena informasi operator tidak digunakan sebagai fitur utama dalam model deteksi anomali.
Namun informasi ini tetap disimpan untuk keperluan analisis lebih lanjut jika diperlukan.

**Penghapusan Duplikasi**

Duplikasi data teridentifikasi pada 36 record yang memiliki kombinasi ID_Produk, Kode_Proses, dan Waktu_Mulai yang sama persis. Record duplikat ini dihapus dengan mempertahankan hanya satu record untuk setiap kombinasi unik. Penghapusan dilakukan menggunakan fungsi drop_duplicates pada library pandas.

**Koreksi Format Timestamp**

Inkonsistensi format waktu ditemukan pada 156 record yang menggunakan format 12 jam (AM/PM) sementara mayoritas data menggunakan format 24 jam. Seluruh timestamp dikonversi ke format standar ISO 8601 (YYYY-MM-DD HH:MM:SS) menggunakan fungsi to_datetime pada pandas dengan parameter format yang disesuaikan.

**Hasil Pembersihan Data**

Setelah proses pembersihan data, diperoleh hasil sebagai berikut:

- Record awal: 5.124 record
- Record dengan missing value dihapus: 142 record
- Record duplikat dihapus: 36 record
- Record akhir setelah cleaning: 4.946 record
- Tingkat kelayakan data: 96,5%

Tingkat kelayakan data sebesar 96,5% menunjukkan bahwa kualitas data produksi PT Holicindo cukup baik dan layak digunakan untuk pembentukan model deteksi anomali.

#### b) Transformasi Data

**Konversi Timestamp**

Seluruh kolom waktu (Waktu_Mulai dan Waktu_Selesai) dikonversi ke format datetime standar menggunakan fungsi pd.to_datetime(). Konversi ini memungkinkan operasi perhitungan durasi dan manipulasi data temporal lainnya dapat dilakukan dengan mudah.

**Pengurutan Data**

Data diurutkan berdasarkan dua kunci, yaitu ID_Produk (ascending) dan Waktu_Mulai (ascending). Pengurutan ini penting untuk memastikan bahwa record aktivitas untuk setiap produk tersusun dalam urutan kronologis yang benar. Pengurutan dilakukan menggunakan fungsi sort_values() dengan parameter by=['ID_Produk', 'Waktu_Mulai'].

**Pengelompokan Data per Batch**

Data dikelompokkan berdasarkan ID_Produk untuk memudahkan analisis urutan proses dan perhitungan jeda antarproses dalam satu batch produksi.
Pengelompokan dilakukan menggunakan fungsi groupby() pada pandas.

#### c) Feature Engineering

Feature engineering merupakan tahap penting dalam mempersiapkan data untuk model machine learning. Pada tahap ini, dilakukan pembentukan fitur-fitur baru yang dapat merepresentasikan karakteristik urutan dan waktu proses produksi.

**Pembentukan Fitur Durasi Proses**

Fitur durasi proses dihitung sebagai selisih antara waktu selesai dan waktu mulai untuk setiap aktivitas. Perhitungan menggunakan rumus:

Durasi_i = Waktu_Selesai_i - Waktu_Mulai_i

Hasil perhitungan dikonversi ke dalam satuan menit untuk memudahkan interpretasi. Fitur durasi ini penting karena dapat mengindikasikan apakah suatu proses berjalan terlalu lama (kemungkinan hambatan) atau terlalu singkat (kemungkinan proses tidak lengkap).

**Pembentukan Fitur Jeda Antarproses**

Fitur jeda antarproses dihitung sebagai selisih antara waktu mulai proses saat ini dengan waktu selesai proses sebelumnya dalam satu produk yang sama. Perhitungan menggunakan rumus:

Jeda_i = Waktu_Mulai_i - Waktu_Selesai_(i-1)

Untuk proses pertama dalam setiap produk, jeda diisi dengan nilai 0 karena tidak ada proses sebelumnya. Fitur jeda ini dapat mengindikasikan apakah terdapat waktu tunggu yang tidak wajar antarproses.

**Encoding Urutan Proses**

Kode proses yang bersifat kategorikal (A01, A02, A03, dst.) diubah menjadi format numerik menggunakan metode Label Encoding. Setiap kode proses diberi nilai numerik berdasarkan urutan standar proses produksi. Encoding ini dilakukan menggunakan LabelEncoder dari sklearn.preprocessing.

**Ekstraksi Fitur Temporal**

Dari timestamp waktu mulai, diekstrak beberapa fitur temporal tambahan:

- **Jam Kerja**: jam pada saat proses dimulai (0-23)
- **Hari dalam Minggu**: hari dalam seminggu (1=Senin, 7=Minggu)
- **Shift Encoding**: konversi shift (pagi=1, siang=2, malam=3)

Fitur-fitur temporal ini dapat membantu menangkap pola anomali yang berkaitan dengan waktu kerja, misalnya proses yang tidak biasa dilakukan pada shift tertentu.

**Pembentukan Fitur Pola Urutan**

Untuk setiap record, dibentuk fitur yang merepresentasikan apakah urutan proses mengikuti pola standar.
Urutan standar didefinisikan berdasarkan hasil wawancara dengan supervisor produksi, yaitu A01 → A02 → A03 → A04 → A05 → A06 → A07 → A08 → A09 → A10 → A11 → A12. Fitur ini diberi nilai 1 jika urutan sesuai dan 0 jika tidak sesuai.

**Hasil Feature Engineering**

Setelah proses feature engineering, dataset memiliki fitur-fitur berikut yang akan digunakan sebagai input model:

1. Durasi (menit)
2. Jeda (menit)
3. Kode_Proses_Encoded (numerik)
4. Jam_Kerja (0-23)
5. Hari_Minggu (1-7)
6. Shift_Encoded (1-3)
7. Urutan_Sesuai (0 atau 1)
8. Stasiun_Kerja_Encoded (numerik)

Contoh hasil feature engineering disajikan pada Tabel 4.3 berikut:

**Tabel 4.3 Contoh Hasil Feature Engineering**

| ID_Produk | Kode_Proses_Encoded | Durasi (menit) | Jeda (menit) | Jam_Kerja | Hari_Minggu | Shift_Encoded | Urutan_Sesuai | Stasiun_Kerja_Encoded |
|-----------|---------------------|----------------|--------------|-----------|-------------|---------------|---------------|-----------------------|
| P001 | 1 | 45 | 0 | 8 | 1 | 1 | 1 | 1 |
| P001 | 2 | 38 | 12 | 9 | 1 | 1 | 1 | 2 |
| P001 | 3 | 15 | 15 | 10 | 1 | 1 | 1 | 3 |
| P001 | 4 | 47 | 18 | 10 | 1 | 1 | 1 | 4 |

#### d) Normalisasi Data

Normalisasi data dilakukan untuk menyamakan skala seluruh fitur sehingga tidak ada fitur yang mendominasi proses pembelajaran model karena perbedaan rentang nilai. Metode normalisasi yang dipilih adalah StandardScaler dari sklearn.preprocessing.

StandardScaler melakukan normalisasi dengan mengubah distribusi data sehingga memiliki mean 0 dan standard deviation 1. Rumus transformasi yang digunakan adalah:

z = (x - μ) / σ

dimana:
- z = nilai setelah normalisasi
- x = nilai asli
- μ = mean dari fitur
- σ = standard deviation dari fitur

Pemilihan StandardScaler didasarkan pada pertimbangan bahwa data proses produksi memiliki beberapa outlier yang merupakan target deteksi, sehingga metode yang robust terhadap outlier lebih sesuai dibandingkan MinMaxScaler yang sensitif terhadap nilai ekstrem.

Normalisasi diterapkan pada seluruh fitur numerik kecuali fitur biner Urutan_Sesuai. Proses normalisasi dilakukan setelah data dibagi agar tidak terjadi data leakage.

Contoh data sebelum dan sesudah normalisasi disajikan pada Tabel 4.4 berikut:

**Tabel 4.4 Contoh Data Sebelum dan Sesudah Normalisasi**

| Fitur | Sebelum Normalisasi | Sesudah Normalisasi |
|-------|---------------------|---------------------|
| Durasi (menit) | 45 | 0.23 |
| Jeda (menit) | 12 | -0.45 |
| Kode_Proses_Encoded | 2 | -0.89 |
| Jam_Kerja | 9 | 0.12 |
| Hari_Minggu | 1 | -1.34 |
| Shift_Encoded | 1 | -0.78 |

Setelah normalisasi, seluruh fitur memiliki skala yang sebanding sehingga dapat diproses oleh model Isolation Forest dengan lebih optimal.

### 4.2.3 Implementasi Model Isolation Forest

#### a) Persiapan Dataset

Setelah tahap preprocessing selesai, data dipersiapkan untuk proses training model. Dataset yang telah melalui feature engineering dan normalisasi dipilih fitur-fiturnya untuk digunakan sebagai input model.

Fitur yang digunakan sebagai input model (X) adalah:
- Durasi_normalized
- Jeda_normalized
- Kode_Proses_Encoded_normalized
- Jam_Kerja_normalized
- Hari_Minggu_normalized
- Shift_Encoded_normalized
- Urutan_Sesuai
- Stasiun_Kerja_Encoded_normalized

Total terdapat 8 fitur yang digunakan sebagai input model. Informasi identitas seperti ID_Produk, Kode_Proses, Nama_Proses, dan atribut asli lainnya tetap disimpan dalam dataframe terpisah untuk keperluan interpretasi hasil, namun tidak diikutkan dalam proses training model.

Karena Isolation Forest merupakan algoritma unsupervised learning, tidak dilakukan pemisahan data menjadi training set dan testing set. Seluruh data digunakan untuk membentuk model deteksi anomali, dengan asumsi bahwa mayoritas data merepresentasikan kondisi normal dan hanya sebagian kecil yang merupakan anomali.

Dimensi dataset yang digunakan:
- Jumlah record: 4.946 record
- Jumlah fitur: 8 fitur
- Ukuran matrix: 4.946 × 8

#### b) Konfigurasi Library

Implementasi model Isolation Forest dilakukan menggunakan library scikit-learn yang merupakan library machine learning populer dan telah banyak digunakan dalam penelitian maupun aplikasi industri. Rincian lingkungan pengembangan sebagai berikut:

- **Bahasa Pemrograman**: Python 3.11.5
- **Library Machine Learning**: scikit-learn versi 1.3.0
- **Library Data Processing**: pandas versi 2.0.3, numpy versi 1.24.3
- **Lingkungan Pengembangan**: Visual Studio Code dengan Jupyter Notebook extension
- **Sistem Operasi**: Windows 11

Scikit-learn dipilih karena menyediakan implementasi Isolation Forest yang efisien, terdokumentasi dengan baik, dan mudah diintegrasikan dengan library data processing lain seperti pandas dan numpy.

### 4.2.4 Konfigurasi Arsitektur Algoritma

Konfigurasi parameter model Isolation Forest dilakukan berdasarkan karakteristik data dan hasil eksperimen awal. Parameter yang dikonfigurasi dan justifikasinya adalah sebagai berikut:

**Kode Konfigurasi Model:**

```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(
    n_estimators=100,
    max_samples='auto',
    contamination=0.10,
    max_features=1.0,
    bootstrap=False,
    random_state=42
)
```

**Penjelasan Parameter:**

1. **n_estimators = 100**

Parameter ini menentukan jumlah pohon isolasi (isolation trees) yang akan dibentuk. Semakin banyak pohon, hasil deteksi cenderung lebih stabil namun waktu komputasi meningkat.
Nilai 100 dipilih berdasarkan rekomendasi umum dan hasil eksperimen yang menunjukkan bahwa nilai ini memberikan keseimbangan baik antara akurasi dan kecepatan.

2. **max_samples = 'auto'**

Parameter ini menentukan jumlah sampel yang digunakan untuk membangun setiap pohon. Nilai 'auto' akan secara otomatis menggunakan min(256, n_samples) sebagai ukuran sampel. Untuk dataset dengan 4.946 record, setiap pohon akan dibangun menggunakan 256 sampel. Penggunaan subset sampel ini membuat algoritma lebih efisien dan mengurangi overfitting.

3. **contamination = 0.10**

Parameter ini merepresentasikan estimasi proporsi anomali dalam dataset. Nilai 0.10 berarti model mengasumsikan sekitar 10% dari data merupakan anomali. Nilai ini ditentukan berdasarkan diskusi dengan supervisor produksi PT Holicindo yang mengestimasi bahwa sekitar 8-12% dari proses produksi mengalami penyimpangan dalam berbagai tingkat. Parameter ini digunakan sebagai threshold untuk mengklasifikasikan data sebagai normal atau anomali.

4. **max_features = 1.0**

Parameter ini menentukan proporsi fitur yang digunakan untuk setiap split dalam pohon.
Nilai 1.0 berarti seluruh 8 fitur akan dipertimbangkan dalam setiap split. Penggunaan seluruh fitur dipilih karena jumlah fitur tidak terlalu banyak dan setiap fitur memiliki informasi yang relevan untuk deteksi anomali.

5. **bootstrap = False**

Parameter ini menentukan apakah sampling dilakukan dengan replacement atau tidak. Nilai False berarti sampling dilakukan tanpa replacement, sehingga setiap sampel hanya muncul maksimal satu kali dalam setiap pohon.

6. **random_state = 42**

Parameter ini digunakan untuk mengatur seed random number generator agar hasil dapat direproduksi. Nilai 42 dipilih secara konvensional dan memastikan bahwa hasil training konsisten setiap kali model dijalankan.

**Eksperimen Variasi Parameter**

Untuk memastikan konfigurasi parameter optimal, dilakukan eksperimen dengan beberapa variasi nilai contamination karena parameter ini memiliki pengaruh signifikan terhadap hasil deteksi. Hasil eksperimen disajikan pada Tabel 4.5 berikut:

**Tabel 4.5 Hasil Eksperimen Variasi Parameter Contamination**

| Contamination | Jumlah Anomali Terdeteksi | Kesesuaian dengan Expert (%) | Waktu Komputasi (detik) |
|---------------|---------------------------|------------------------------|-------------------------|
| 0.05 | 247 | 68% | 0.42 |
| 0.08 | 396 | 74% | 0.43 |
| 0.10 | 495 | 82% | 0.44 |
| 0.12 | 594 | 79% | 0.45 |
| 0.15 | 742 | 71% | 0.46 |

Berdasarkan hasil eksperimen, contamination=0.10 memberikan tingkat kesesuaian tertinggi (82%) dengan verifikasi domain expert, sehingga nilai ini dipilih sebagai konfigurasi akhir. Waktu komputasi untuk semua variasi relatif sama dan sangat cepat (kurang dari 0.5 detik), menunjukkan efisiensi algoritma Isolation Forest.

### 4.2.5 Model Training

#### a) Proses Pelatihan

Proses training model Isolation Forest dilakukan dengan memanggil fungsi fit() pada objek model dengan input data fitur yang telah dinormalisasi. Pseudocode proses training adalah sebagai berikut:

```python
# Inisialisasi model dengan konfigurasi parameter
model = IsolationForest(
    n_estimators=100,
    contamination=0.10,
    random_state=42
)

# Training model dengan data fitur
model.fit(X_normalized)

# Model siap digunakan untuk prediksi
```

Proses training berjalan dengan cepat karena karakteristik algoritma Isolation Forest yang efisien. Rincian proses training:

- **Waktu training**: 0,44 detik
- **Memory usage**: ~85 MB
- **CPU usage**: ~45% (pada Intel Core i7-11800H)
- **Jumlah iterasi**: 100 pohon dibangun secara sekuensial

Tidak ada proses iteratif atau epoch seperti pada algoritma supervised learning karena Isolation Forest membangun ensemble pohon secara langsung tanpa optimasi berbasis error. Setelah proses training selesai, model langsung dapat digunakan untuk mendeteksi anomali pada data.

#### b) Output Model

Setelah model selesai di-training, dilakukan prediksi terhadap seluruh dataset untuk memperoleh output deteksi anomali. Output yang dihasilkan oleh model terdiri dari dua komponen:

1. **Anomaly Score**: nilai kontinu yang merepresentasikan tingkat kecenderungan suatu data menjadi anomali. Score dihitung berdasarkan rata-rata panjang jalur (path length) data pada seluruh pohon yang telah dinormalisasi. Nilai score berkisar antara 0 hingga 1, dimana:
   - Score mendekati 1: data memiliki kecenderungan kuat sebagai anomali
   - Score mendekati 0.5: data berada di area ambiguitas
   - Score mendekati 0: data memiliki karakteristik normal

2. **Prediksi Label**: klasifikasi biner yang menentukan apakah data tergolong normal (1) atau anomali (-1). Label ini ditentukan berdasarkan threshold yang dihitung dari parameter contamination.

Distribusi anomaly score pada dataset disajikan dalam bentuk histogram pada Gambar 4.1.
Dari histogram tersebut, dapat diamati bahwa mayoritas data memiliki anomaly score yang rendah (berkisar 0.35-0.45), mengindikasikan bahwa sebagian besar data proses produksi memang berpola normal. Terdapat sebagian kecil data dengan score tinggi (>0.55) yang teridentifikasi sebagai anomali.

**Gambar 4.1 Distribusi Anomaly Score Dataset**
[Histogram menunjukkan distribusi score dengan puncak pada rentang 0.35-0.45 dan ekor panjang ke arah nilai tinggi hingga 0.85]

Statistik deskriptif anomaly score disajikan pada Tabel 4.6 berikut:

**Tabel 4.6 Statistik Deskriptif Anomaly Score**

| Metrik | Nilai |
|--------|-------|
| Mean | 0.418 |
| Median | 0.405 |
| Standard Deviation | 0.089 |
| Min | 0.287 |
| Max | 0.812 |
| Quartile 1 (25%) | 0.368 |
| Quartile 3 (75%) | 0.452 |

Dari statistik tersebut terlihat bahwa data memiliki distribusi yang tidak simetris dengan ekor di sisi kanan (positively skewed), yang merupakan karakteristik umum dalam data anomali dimana jumlah anomali jauh lebih sedikit dibanding data normal.

### 4.2.6 Evaluasi dan Validasi Model

#### a) Analisis Hasil Deteksi

Setelah model menghasilkan prediksi, dilakukan analisis terhadap hasil deteksi untuk memahami karakteristik data yang teridentifikasi sebagai anomali. Dari total 4.946 record yang diproses, hasil deteksi adalah sebagai berikut:

- **Jumlah data terdeteksi normal**: 4.451 record (90%)
- **Jumlah data terdeteksi anomali**: 495 record (10%)

Proporsi ini sesuai dengan parameter contamination yang telah dikonfigurasi sebesar 0.10. Selanjutnya dilakukan analisis lebih detail terhadap 495 record yang terdeteksi sebagai anomali untuk mengidentifikasi jenis dan pola penyimpangan yang terjadi.

Data anomali diklasifikasikan berdasarkan karakteristik penyimpangannya dengan menganalisis nilai fitur pada record yang bersangkutan. Klasifikasi dilakukan dengan membandingkan nilai durasi, jeda, dan urutan proses pada data anomali dengan statistik deskriptif data normal. Hasil klasifikasi disajikan pada Tabel 4.7 berikut:

**Tabel 4.7 Karakteristik Data Anomali Terdeteksi**

| Jenis Anomali | Jumlah | Persentase | Contoh Kasus |
|---------------|--------|------------|--------------|
| Durasi terlalu lama | 178 | 36% | Proses A04 (Finishing) durasi 125 menit, standar 45 menit |
| Durasi terlalu singkat | 89 | 18% | Proses A03 (QC 1) durasi 3 menit, standar 15 menit |
| Jeda antarproses tidak wajar | 134 | 27% | Jeda 245 menit antara A02-A03, standar 15-20 menit |
| Urutan proses tidak sesuai | 58 | 12% | A05 muncul sebelum A04 pada batch P127 |
| Anomali kombinasi (multi-faktor) | 36 | 7% | Durasi lama + jeda lama + shift tidak biasa |

Dari analisis tersebut dapat dilihat bahwa jenis anomali paling dominan adalah durasi proses yang terlalu lama (36%), diikuti oleh jeda antarproses yang tidak wajar (27%). Kedua jenis anomali ini berkaitan dengan aspek waktu proses dan dapat mengindikasikan adanya hambatan, keterlambatan, atau ketidakefisienan dalam proses produksi.

Anomali urutan proses (12%) menunjukkan adanya kasus dimana proses tidak mengikuti alur standar, yang dapat berdampak pada kualitas produk jika proses yang seharusnya dilakukan lebih dulu terlewat atau tertukar. Terdapat juga anomali kombinasi (7%) dimana satu record memiliki beberapa karakteristik anomali sekaligus, yang umumnya mengindikasikan masalah yang lebih serius.

#### b) Validasi dengan Domain Expert

Untuk memvalidasi keakuratan hasil deteksi model, dilakukan verifikasi dengan domain expert yaitu supervisor produksi dan quality control PT Holicindo.
Validasi dilakukan dengan metode sampling dimana sebagian data yang terdeteksi anomali diverifikasi kesesuaiannya dengan kondisi aktual di lapangan.

**Metode Validasi:**

Dari 495 record yang terdeteksi anomali, dipilih sampel sebanyak 100 record secara stratified random sampling yang mewakili kelima jenis anomali. Setiap record sampel diverifikasi dengan melihat:

1. Dokumentasi produksi pada periode tersebut
2. Laporan gangguan atau incident yang tercatat
3. Konfirmasi langsung dengan operator atau supervisor yang menangani
4. Hasil inspeksi quality control pada batch terkait

Domain expert kemudian memberikan penilaian apakah anomali yang terdeteksi memang merupakan penyimpangan yang bermasalah (True Positive) atau merupakan variasi normal yang masih dapat diterima (False Positive).

**Hasil Validasi:**

Dari 100 sampel yang diverifikasi, diperoleh hasil sebagai berikut:

- **True Positive (TP)**: 82 record → anomali terdeteksi dan memang bermasalah
- **False Positive (FP)**: 18 record → terdeteksi anomali tapi sebenarnya masih normal

Tingkat kesesuaian = TP / (TP + FP) = 82 / 100 = **82%**

Tingkat kesesuaian 82% menunjukkan bahwa model memiliki akurasi yang baik dalam mendeteksi anomali yang relevan dengan kondisi lapangan.
Sebagian besar anomali terdeteksi dapat dikonfirmasi dengan dokumentasi lapangan seperti laporan downtime mesin, penggantian operator, atau temuan quality control.

**Contoh Konfirmasi Lapangan:**

1. **Kasus 1 - Durasi Lama (TP)**: Record P045-A04 terdeteksi anomali dengan durasi 118 menit (standar 45 menit). Verifikasi menunjukkan pada tanggal tersebut terjadi kerusakan tool di stasiun finishing yang menyebabkan proses terhambat. Konfirmasi dari laporan maintenance membenarkan kejadian ini.

2. **Kasus 2 - Jeda Lama (TP)**: Record P089-A03 memiliki jeda 198 menit setelah proses A02. Verifikasi menunjukkan bahwa pada periode tersebut terjadi pergantian shift dan delay material dari gudang, sehingga produk menunggu lama sebelum masuk ke QC.

3. **Kasus 3 - Urutan Terbalik (TP)**: Record P127 menunjukkan proses A06 dikerjakan sebelum A05. Verifikasi dengan supervisor mengkonfirmasi bahwa operator baru melakukan kesalahan prosedur dan produk tersebut harus dikerjakan ulang.

4. **Kasus 4 - False Positive**: Record P234-A08 terdeteksi anomali karena durasi 62 menit (standar 45 menit). Namun verifikasi menunjukkan bahwa batch ini merupakan produk custom dengan spesifikasi khusus yang memang memerlukan waktu lebih lama.
Variasi ini masih dalam batas toleransi dan tidak dikategorikan sebagai masalah.

#### c) Analisis False Positive dan False Negative

**False Positive**

Dari 18 kasus false positive yang teridentifikasi, dilakukan analisis untuk memahami pola kesalahan deteksi. Penyebab false positive umumnya adalah:

1. **Variasi Normal yang Lebih Ekstrem**: beberapa proses memiliki variasi durasi yang lebih besar dari estimasi awal, terutama untuk produk dengan tingkat kustomisasi tinggi atau material yang berbeda.

2. **Data Training Terbatas**: beberapa kondisi operasional yang jarang terjadi namun masih normal (seperti maintenance terjadwal) belum cukup terwakili dalam data training sehingga dianggap anomali.

3. **Threshold Contamination**: parameter contamination=0.10 mungkin sedikit terlalu sensitif untuk beberapa kasus tertentu.

False positive dapat dikurangi dengan beberapa cara:
- Memperbanyak data training untuk mencakup lebih banyak variasi kondisi normal
- Menyesuaikan parameter contamination berdasarkan feedback berkelanjutan
- Menambahkan fitur metadata seperti jenis produk atau kategori material

**False Negative**

Untuk mengidentifikasi false negative, dilakukan review terhadap 50 record dari data yang terdeteksi normal namun dipilih secara purposive karena memiliki karakteristik yang mencurigakan berdasarkan pengamatan domain expert. Dari 50 record tersebut, ditemukan 6 record yang sebenarnya bermasalah namun tidak terdeteksi oleh model (false negative).

Contoh kasus false negative:

1. **Kasus FN-1**: Proses A07 pada batch P156 memiliki durasi 52 menit (sedikit di atas standar 45 menit). Meskipun durasi ini sedikit lebih lama, score anomali hanya 0.46 sehingga masih dikategorikan normal. Verifikasi menunjukkan bahwa operator mengalami kesulitan saat proses karena material cacat, namun karena deviasi tidak terlalu ekstrem, model tidak mendeteksinya.

Pola false negative umumnya terjadi pada anomali yang tidak terlalu ekstrem sehingga masih berada dalam area ambiguitas model. Hal ini dapat diperbaiki dengan:
- Menyesuaikan threshold contamination menjadi sedikit lebih tinggi
- Menambahkan aturan bisnis tambahan untuk kasus-kasus borderline
- Menggunakan anomaly score sebagai peringkat risiko, bukan hanya klasifikasi biner

Tingkat false negative yang relatif rendah (6 dari 50 sampel = 12%) menunjukkan bahwa model cukup sensitif dalam menangkap penyimpangan yang signifikan.

#### d) Visualisasi Data Normal vs Anomali

Untuk membantu memahami bagaimana model membedakan data normal dan anomali, dilakukan visualisasi dalam ruang fitur menggunakan teknik dimensionality reduction. Karena data memiliki 8 dimensi, digunakan metode Principal Component Analysis (PCA) untuk mereduksi dimensi menjadi 2 dimensi agar dapat divisualisasikan dalam scatter plot.

Gambar 4.2 menunjukkan proyeksi 2D dari data menggunakan PCA. Dari visualisasi tersebut dapat diamati bahwa data yang terdeteksi anomali (ditandai dengan warna merah) cenderung berada di area pinggir atau terpisah dari cluster utama data normal (warna biru). Hal ini mengkonfirmasi bahwa Isolation Forest berhasil mengidentifikasi data yang memiliki karakteristik berbeda dari mayoritas data.

**Gambar 4.2 Visualisasi Data Normal vs Anomali dalam Feature Space**
[Scatter plot 2D menunjukkan cluster data normal di tengah (biru) dan data anomali tersebar di pinggiran (merah)]

Beberapa data anomali yang sangat ekstrem terlihat berada jauh dari cluster utama, sementara beberapa anomali lain berada di perbatasan antara area normal dan anomali. Data di area perbatasan ini umumnya merupakan kasus yang lebih ambigu dan berpotensi menjadi false positive atau false negative.


## 4.3 Hasil Pengembangan Sistem

### 4.3.1 Desain Konseptual dengan UML

Perancangan sistem deteksi anomali urutan dan waktu proses produksi dilakukan menggunakan Unified Modeling Language (UML) untuk menggambarkan struktur dan perilaku sistem secara visual. Perancangan UML mencakup use case diagram, activity diagram, sequence diagram, dan class diagram yang akan dijelaskan sebagai berikut.

#### a) Use Case Diagram

Use case diagram menggambarkan interaksi antara aktor dengan sistem dan fungsionalitas apa saja yang dapat dilakukan. Pada sistem ini, teridentifikasi tiga aktor utama:

1. **Admin**: pengguna dengan hak akses penuh untuk mengelola sistem, mengelola pengguna, dan mengkonfigurasi parameter model
2. **Supervisor Produksi**: pengguna yang bertugas mengunggah data, menjalankan deteksi anomali, dan menganalisis hasil untuk evaluasi proses produksi
3. **User QC (Quality Control)**: pengguna yang dapat melihat hasil deteksi dan mengekspor laporan untuk keperluan quality assurance

Use case yang teridentifikasi pada sistem ini adalah:

- **UC-01: Login**: semua aktor harus melakukan autentikasi untuk mengakses sistem
- **UC-02: Kelola Pengguna**: admin dapat menambah, mengubah, atau menghapus pengguna
- **UC-03: Upload Data Produksi**: supervisor dapat mengunggah file CSV/Excel berisi log produksi
- **UC-04: Lihat Preview Data**: melihat data yang telah diunggah sebelum proses deteksi
- **UC-05: Jalankan Deteksi Anomali**: menjalankan algoritma Isolation Forest pada data yang diunggah
- **UC-06: Lihat Hasil Deteksi**: melihat hasil deteksi dalam bentuk tabel dengan informasi anomaly score dan status
- **UC-07: Filter Hasil**: memfilter hasil berdasarkan jenis anomali, periode, atau batch tertentu
- **UC-08: Lihat Detail Anomali**: melihat informasi lengkap record yang terdeteksi anomali termasuk perbandingan dengan pola normal
- **UC-09: Ekspor Laporan**: mengekspor hasil deteksi ke format PDF atau Excel
- **UC-10: Kelola Threshold**: admin dapat menyesuaikan parameter contamination model
- **UC-11: Lihat Dashboard**: melihat visualisasi statistik dan trend anomali

**Gambar 4.3 Use Case Diagram Sistem Deteksi Anomali**
[Diagram use case menunjukkan aktor Admin, Supervisor, dan User QC dengan use case yang dapat mereka akses]

Deskripsi detail untuk setiap use case disajikan pada Tabel 4.8 berikut:

**Tabel 4.8 Deskripsi Use Case**

| ID | Use Case | Aktor | Deskripsi | Precondition | Postcondition |
|----|----------|-------|-----------|--------------|---------------|
| UC-01 | Login | Admin, Supervisor, User QC | Pengguna memasukkan username dan password untuk autentikasi | Pengguna memiliki akun terdaftar | Pengguna berhasil masuk dan diarahkan ke dashboard |
| UC-02 | Kelola Pengguna | Admin | Admin dapat menambah, mengubah, atau menghapus akun pengguna | Admin telah login | Data pengguna tersimpan/terubah/terhapus di database |
| UC-03 | Upload Data Produksi | Supervisor | Supervisor mengunggah file CSV/Excel berisi log produksi | Supervisor telah login, file sesuai format | File tersimpan dan data ter-import ke database |
| UC-04 | Lihat Preview Data | Supervisor | Melihat preview data yang telah diunggah sebelum deteksi | Data telah diunggah | Data ditampilkan dalam bentuk tabel |
| UC-05 | Jalankan Deteksi Anomali | Supervisor | Menjalankan algoritma Isolation Forest pada data | Data telah diunggah | Hasil deteksi tersimpan di database |
| UC-06 | Lihat Hasil Deteksi | Supervisor, User QC | Melihat hasil deteksi anomali | Deteksi telah dijalankan | Hasil ditampilkan dalam tabel interaktif |
| UC-07 | Filter Hasil | Supervisor, User QC | Memfilter hasil berdasarkan kriteria tertentu | Hasil deteksi tersedia | Data ter-filter ditampilkan |
| UC-08 | Lihat Detail Anomali | Supervisor, User QC | Melihat informasi lengkap record anomali | Hasil deteksi tersedia | Detail anomali ditampilkan |
| UC-09 | Ekspor Laporan | Supervisor, User QC | Mengekspor hasil ke PDF/Excel | Hasil deteksi tersedia | File laporan ter-download |
| UC-10 | Kelola Threshold | Admin | Menyesuaikan parameter model | Admin telah login | Parameter tersimpan |
| UC-11 | Lihat Dashboard | Admin, Supervisor, User QC | Melihat visualisasi statistik | Pengguna telah login | Dashboard ditampilkan |

#### b) Activity Diagram

Activity diagram menggambarkan alur aktivitas dalam sistem dari awal hingga akhir. Berikut dijelaskan beberapa activity diagram untuk proses utama dalam sistem.

**Activity Diagram: Proses Upload dan Preprocessing Data**

Activity diagram untuk proses upload data menggambarkan langkah-langkah yang terjadi ketika supervisor mengunggah file data produksi. Alur aktivitas dimulai dari supervisor memilih file, sistem melakukan validasi format file, kemudian melakukan preprocessing (cleaning, transformation, feature engineering), dan menampilkan preview data. Jika terjadi error pada salah satu tahap, sistem akan menampilkan pesan error dan meminta supervisor mengunggah ulang file yang sesuai.

**Gambar 4.4 Activity Diagram Proses Upload dan Preprocessing Data**
[Diagram alur: Pilih File → Validasi Format → Pembersihan Data → Transformasi Data → Feature Engineering → Normalisasi → Preview Data → Selesai, dengan decision point untuk validasi dan error handling]

**Activity Diagram: Proses Deteksi Anomali**

Activity diagram untuk proses deteksi anomali menggambarkan alur dari supervisor menekan tombol deteksi hingga hasil ditampilkan.
Alur meliputi: load model Isolation Forest, prediksi anomaly score untuk setiap record, klasifikasi normal/anomali berdasarkan threshold, analisis jenis anomali, penyimpanan hasil ke database, dan menampilkan hasil dalam interface.

**Gambar 4.5 Activity Diagram Proses Deteksi Anomali**
[Diagram alur: Klik Deteksi → Load Model → Prediksi Score → Klasifikasi → Analisis Jenis Anomali → Simpan Hasil → Tampilkan Hasil → Selesai]

**Activity Diagram: Proses Generate Laporan**

Activity diagram untuk proses generate laporan menggambarkan langkah-langkah ekspor hasil deteksi. Pengguna memilih format laporan (PDF/Excel), menentukan filter data yang diinginkan, sistem mengambil data hasil deteksi dari database, membuat visualisasi dan statistik, generate file sesuai format, dan mengunduh file ke komputer pengguna.

**Gambar 4.6 Activity Diagram Proses Generate Laporan**
[Diagram alur: Pilih Format → Tentukan Filter → Ambil Data → Generate Visualisasi → Buat File → Download → Selesai]

#### c) Sequence Diagram

Sequence diagram menggambarkan interaksi antar objek atau komponen sistem dalam urutan waktu tertentu.
Berikut dijelaskan sequence diagram untuk proses deteksi anomali yang merupakan proses inti sistem.

**Sequence Diagram: Proses Deteksi Anomali**

Sequence diagram ini menggambarkan interaksi antara Supervisor (aktor), Frontend (Next.js), Backend API (FastAPI), Anomaly Detector Module, Model Isolation Forest, dan Database PostgreSQL.

Alur interaksi adalah sebagai berikut:

1. Supervisor mengklik tombol "Detect Anomaly" pada interface
2. Frontend mengirim POST request ke endpoint /api/detect dengan parameter upload_id
3. Backend menerima request dan memanggil AnomalyDetector.detect()
4. AnomalyDetector mengambil data yang telah dipreprocess dari Database
5. Database mengembalikan data dalam format DataFrame
6. AnomalyDetector memanggil Model.predict() dengan data tersebut
7. Model mengembalikan anomaly_score dan prediction_label untuk setiap record
8. AnomalyDetector menganalisis jenis anomali berdasarkan fitur (duration, gap, sequence)
9. AnomalyDetector menyimpan hasil deteksi ke Database
10. Database mengkonfirmasi penyimpanan berhasil
11. Backend mengembalikan response JSON berisi summary hasil deteksi
12. Frontend menampilkan hasil dalam bentuk tabel dan visualisasi

**Gambar 4.7 Sequence Diagram Proses Deteksi Anomali**
[Diagram sequence menunjukkan interaksi temporal antar komponen dengan lifeline dan message arrows]

#### d) Class Diagram

Class diagram menggambarkan struktur statis sistem dalam bentuk class, atribut, method, dan relasi antar class. Class diagram sistem deteksi anomali dirancang menggunakan prinsip object-oriented programming dengan separation of concerns.

Class-class utama dalam sistem adalah:

**Class User**
- Atribut: user_id, username, password_hash, role, email, created_at
- Method: login(), logout(), updateProfile()
- Relasi: memiliki many-to-many dengan UploadHistory

**Class UploadHistory**
- Atribut: upload_id, user_id, filename, upload_date, row_count, status
- Method: save(), delete(), getDetails()
- Relasi: belongs to User, has many ProductionLog

**Class ProductionLog**
- Atribut: log_id, upload_id, id_produk, kode_proses, nama_proses, stasiun_kerja, waktu_mulai, waktu_selesai, operator, shift
- Method: save(), update(), delete()
- Relasi: belongs to UploadHistory, has one DetectionResult

**Class PreprocessedData**
- Atribut: preprocessed_id, log_id, duration, gap, kode_proses_encoded, jam_kerja, hari_minggu, shift_encoded, urutan_sesuai, stasiun_kerja_encoded
- Method: save(), getFeatureVector()
- Relasi: one-to-one dengan ProductionLog

**Class AnomalyDetectorModel**
- Atribut: model_id, n_estimators, contamination, max_samples, max_features, random_state, trained_date
- Method: train(), predict(), save_model(), load_model()
- Relasi: independen, digunakan oleh DetectionService

**Class DetectionResult**
- Atribut: result_id, log_id, anomaly_score, prediction_label, anomaly_type, detected_date
- Method: save(), getDetails(), updateType()
- Relasi: belongs to ProductionLog

**Class Report**
- Atribut: report_id, user_id, upload_id, report_type, filter_params, generated_date, file_path
- Method: generate(), export_pdf(), export_excel(), download()
- Relasi: belongs to User, references UploadHistory

**Gambar 4.8 Class Diagram Sistem Deteksi Anomali**
[Diagram class menunjukkan struktur class dengan atribut, method, dan relasi aggregation/composition/association]

### 4.3.2 Desain Antarmuka

Desain antarmuka sistem dirancang dengan mempertimbangkan prinsip user experience yang baik, yaitu mudah dipahami, intuitif, responsif, dan memberikan feedback yang jelas kepada pengguna. Berikut dijelaskan desain antarmuka untuk setiap halaman utama sistem.

#### a) Halaman Login

Halaman login merupakan gerbang awal akses ke sistem. Desain halaman login menggunakan pendekatan minimalis dengan fokus pada form autentikasi.

**Elemen Interface:**
- Logo sistem dan nama aplikasi di bagian atas
- Form input username dengan icon user
- Form input password dengan icon lock dan toggle show/hide password
- Tombol "Login" dengan warna primary
- Pesan error jika kredensial salah ditampilkan di atas form dengan warna merah
- Loading indicator saat proses autentikasi berlangsung

**Validasi:**
- Username wajib diisi (tidak boleh kosong)
- Password wajib diisi dengan minimal 6 karakter
- Validasi di sisi frontend dan backend untuk keamanan

**Gambar 4.9 Antarmuka Halaman Login**
[Screenshot menunjukkan form login dengan desain modern, clean, dan profesional]

#### b) Halaman Dashboard

Dashboard merupakan halaman utama setelah pengguna berhasil login. Halaman ini menampilkan ringkasan informasi dan statistik deteksi anomali.

**Elemen Interface:**
- Header dengan nama pengguna dan tombol logout di pojok kanan atas
- Sidebar navigasi dengan menu: Dashboard, Upload Data, History, Hasil Deteksi, Laporan, Settings (untuk admin)
- Area konten utama berisi:
  * Card statistik: Total Upload, Total Record, Total Anomali Terdeteksi, Tingkat Anomali (%)
  * Grafik trend anomali per hari/minggu (line chart)
  * Grafik distribusi jenis anomali (pie chart)
  * Tabel 5 upload terakhir dengan status dan action button
  * Grafik anomali per stasiun kerja (bar chart)

**Interaksi:**
- Card statistik dapat diklik untuk melihat detail lebih lanjut
- Grafik interaktif dengan tooltip saat hover
- Tabel memiliki tombol quick action untuk melihat hasil atau hapus data

**Gambar 4.10 Antarmuka Halaman Dashboard**
[Screenshot dashboard dengan layout card, chart, dan tabel yang informatif]

#### c) Halaman Upload Data

Halaman upload data memungkinkan supervisor mengunggah file data produksi untuk dianalisis.

**Elemen Interface:**
- Area drag and drop dengan border dashed untuk mengunggah file
- Alternatif tombol "Browse File" jika pengguna tidak familiar dengan drag and drop
- Informasi format file yang didukung: CSV, Excel (XLS, XLSX)
- Informasi struktur kolom yang diperlukan: ID_Produk, Kode_Proses, Nama_Proses, Stasiun_Kerja, Waktu_Mulai, Waktu_Selesai, Operator, Shift
- Progress bar saat proses upload berlangsung
- Preview data dalam bentuk tabel setelah file berhasil diunggah (menampilkan 10 baris pertama)
- Informasi hasil validasi: jumlah baris valid, baris dengan error, missing value yang ditemukan
- Tombol "Process Data" untuk melanjutkan ke tahap preprocessing
- Tombol "Cancel" untuk membatalkan upload

**Validasi:**
- Cek format file (hanya CSV atau Excel)
- Cek ukuran file (maksimal 10 MB)
- Validasi struktur kolom sesuai yang diperlukan
- Validasi tipe data setiap kolom
- Feedback jelas jika terjadi error dengan saran perbaikan

**Gambar 4.11 Antarmuka Halaman Upload Data**
[Screenshot halaman upload dengan area drag-drop, preview tabel, dan informasi validasi]

#### d) Halaman Hasil Deteksi

Halaman hasil deteksi menampilkan output dari algoritma Isolation Forest dalam bentuk yang mudah dipahami dan dapat dianalisis lebih lanjut.

**Elemen Interface:**
- Header halaman dengan informasi upload: nama file, tanggal upload, jumlah record
- Summary card: Total Normal, Total Anomali, Tingkat Anomali (%)
- Filter panel dengan opsi:
  * Filter berdasarkan status (Normal/Anomali)
  * Filter berdasarkan jenis anomali (Durasi Lama, Durasi Singkat, Jeda Lama, Urutan Tidak Sesuai)
  * Filter berdasarkan range anomaly score (slider 0-1)
  * Filter berdasarkan periode tanggal
  * Filter berdasarkan batch/ID produk
  * Tombol "Reset Filter" dan "Apply Filter"
- Tabel hasil deteksi dengan kolom:
  * No
  * ID Produk
  * Kode Proses
  * Nama Proses
  * Waktu Mulai
  * Waktu Selesai
  * Durasi (menit)
  * Anomaly Score
  * Status (badge: Normal=hijau, Anomali=merah)
  * Jenis Anomali (jika anomali)
  * Action (tombol "Detail")
- Pagination (10/25/50/100 rows per page)
- Tombol "Export ke PDF" dan "Export ke Excel" di bagian atas tabel
- Sorting untuk setiap kolom (ascending/descending)

**Interaksi:**
- Tabel dapat di-sort dengan klik header kolom
- Filter real-time tanpa perlu reload page
- Hover pada row menampilkan highlight untuk kemudahan membaca
- Badge status dan jenis anomali menggunakan warna yang intuitif
- Search box untuk pencarian cepat berdasarkan ID produk atau kode proses

**Gambar 4.12 Antarmuka Halaman Hasil Deteksi**
[Screenshot tabel hasil deteksi dengan filter panel, badge status, dan tombol action]

#### e) Halaman Detail Anomali

Halaman detail anomali menampilkan informasi lengkap untuk satu record yang terdeteksi sebagai anomali, termasuk konteks dan perbandingan dengan kondisi normal.

**Elemen Interface:**
- Breadcrumb navigation: Dashboard > Hasil Deteksi > Detail Anomali
- Card header dengan informasi utama:
  * ID Produk
  * Status: Anomali (badge merah)
  * Anomaly Score dengan visual bar indicator
  * Tanggal deteksi
- Section "Informasi Proses":
  * Kode Proses & Nama Proses
  * Stasiun Kerja
  * Waktu Mulai & Waktu Selesai
  * Durasi Aktual
  * Operator & Shift
- Section "Analisis Anomali":
  * Jenis Anomali Terdeteksi (dengan icon)
  * Perbandingan Durasi: Durasi Aktual vs Durasi Rata-rata Normal (ditampilkan dengan progress bar comparison)
  * Perbandingan Jeda: Jeda Aktual vs Jeda Rata-rata Normal
  * Keterangan: penjelasan singkat mengapa dianggap anomali
- Section "History Proses Produk Ini":
  * Timeline proses untuk ID produk yang sama
  * Highlight proses yang anomali
  * Visualisasi urutan proses dengan panah
- Section "Rekomendasi" (opsional):
  * Saran tindakan berdasarkan jenis anomali
- Tombol "Kembali ke Hasil" dan "Export Detail ke PDF"

**Gambar 4.13 Antarmuka Halaman Detail Anomali**
[Screenshot detail anomali dengan comparison chart, timeline, dan informasi lengkap]

#### f) Halaman Laporan

Halaman laporan memungkinkan pengguna untuk generate dan download laporan hasil deteksi dengan berbagai format dan filter.

**Elemen Interface:**
- Form generate laporan dengan opsi:
  * Pilih Upload/Periode Data (dropdown)
  * Range Tanggal (date picker)
  * Filter Jenis Anomali (checkbox multiple selection)
  * Pilih Format (radio button: PDF atau Excel)
  * Include Visualisasi (checkbox: ya/tidak)
  * Tombol "Generate Laporan"
- Preview laporan sebelum download (untuk PDF)
- Riwayat laporan yang pernah di-generate (tabel dengan kolom: Nama Laporan, Tanggal Generate, Format, Status, Action Download)
- Summary statistik yang akan masuk laporan:
  * Total record
  * Jumlah anomali per jenis
  * Grafik trend
  * Top 5 batch dengan anomali terbanyak

**Gambar 4.14 Antarmuka Halaman Laporan**
[Screenshot form generate laporan dan preview laporan]

### 4.3.3 Implementasi Sistem

#### a) Teknologi yang Digunakan

Implementasi sistem deteksi anomali menggunakan arsitektur client-server dengan pemisahan yang jelas antara frontend dan backend.

**Backend:**
- **Framework**: FastAPI 0.104.1 (Python)
  - Dipilih karena performa tinggi, dokumentasi API otomatis dengan Swagger, dan dukungan async/await
- **Library Machine Learning**:
  - scikit-learn 1.3.0: implementasi Isolation Forest
  - pandas 2.0.3: manipulasi dan analisis data
  - numpy 1.24.3: operasi numerik
- **Database**: PostgreSQL 15.3
  - Dipilih karena reliabel, mendukung transaksi kompleks, dan performa query yang baik
- **ORM**: SQLAlchemy 2.0.21
  - Untuk abstraksi database dan manajemen schema
- **Library Tambahan**:
  - python-multipart: handling file upload
  - reportlab: generate PDF
  - openpyxl: read/write Excel files
  - python-jose: JWT authentication

**API Endpoint yang Diimplementasikan:**
- POST /api/auth/login: autentikasi pengguna
- POST /api/upload: upload file data produksi
- GET /api/upload/{id}/preview: preview data yang diupload
- POST /api/detect/{upload_id}: jalankan deteksi anomali
- GET /api/results/{upload_id}: ambil hasil deteksi
- GET /api/results/{upload_id}/detail/{log_id}: detail satu record anomali
- POST /api/reports/generate: generate laporan
- GET /api/dashboard/stats: statistik untuk dashboard

**Frontend:**
- **Framework**: Next.js 15.1.0 (React 19)
  - Dipilih karena server-side rendering, routing built-in, dan optimasi performa otomatis
- **Styling**: Tailwind CSS 3.4.1
  - Utility-first CSS framework untuk styling yang cepat dan konsisten
- **State Management**: React Query (TanStack Query) 5.x
  - Untuk manajemen server state, caching, dan synchronization
- **Visualisasi**: Chart.js 4.4.0 dengan react-chartjs-2
  - Untuk grafik interaktif pada dashboard dan laporan
- **UI Components**: Custom components dengan Tailwind
- **Form Handling**: React Hook Form 7.48
  - Untuk validasi dan handling form dengan performa optimal

**Deployment:**
- **Development Environment**:
  - Backend: http://localhost:8000
  - Frontend: http://localhost:3000
  - Database: PostgreSQL di localhost:5432
- **Folder Structure**:
  ```
  /backend
    /main.py (entry point FastAPI)
    /anomaly_detector.py (modul deteksi)
    /requirements.txt
  /src
    /app (Next.js app router)
    /components (komponen React)
  ```

#### b) Implementasi Fitur Utama

**Modul Upload dan Preprocessing**

Modul upload diimplementasikan dalam file backend/main.py dengan fungsi handle_upload().
Fungsi ini menerima file dari frontend, melakukan validasi format, membaca data menggunakan pandas, melakukan pembersihan data (cleaning), transformasi, feature engineering, dan normalisasi. Hasil preprocessing disimpan dalam database untuk digunakan pada tahap deteksi.

Pseudocode implementasi:

```python
@app.post("/api/upload")
async def handle_upload(file: UploadFile):
    # Validasi format file
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(400, "Format file tidak didukung")
    
    # Baca file menggunakan pandas
    df = pd.read_csv(file.file) if file.filename.endswith('.csv') 
         else pd.read_excel(file.file)
    
    # Validasi kolom yang diperlukan
    required_columns = ['ID_Produk', 'Kode_Proses', 'Waktu_Mulai', 
                        'Waktu_Selesai', ...]
    if not all(col in df.columns for col in required_columns):
        raise HTTPException(400, "Struktur kolom tidak sesuai")
    
    # Cleaning data
    df = clean_data(df)  # hapus duplikat, handle missing value
    
    # Transformasi dan feature engineering
    df = transform_data(df)  # konversi timestamp, sorting
    df = create_features(df)  # hitung durasi, jeda, encode fitur
    
    # Normalisasi
    df_normalized = normalize_data(df)
    
    # Simpan ke database
    upload_id = save_to_database(df, df_normalized)
    
    return {"upload_id": upload_id, "row_count": len(df), "status": "success"}
```

**Modul Deteksi Anomali**

Modul deteksi anomali diimplementasikan dalam file backend/anomaly_detector.py dengan class AnomalyDetector. Class ini mengenkapsulasi logika training dan prediksi model Isolation Forest.

Pseudocode implementasi:

```python
class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.10,
            random_state=42
        )
    
    def detect(self, upload_id):
        # Ambil data preprocessed dari database
        df = get_preprocessed_data(upload_id)
        
        # Ekstrak fitur untuk model
        X = df[['Durasi_norm', 'Jeda_norm', 'Kode_Proses_Encoded_norm',
                'Jam_Kerja_norm', 'Hari_Minggu_norm', 'Shift_Encoded_norm',
                'Urutan_Sesuai', 'Stasiun_Kerja_Encoded_norm']]
        
        # Training dan prediksi
        self.model.fit(X)
        anomaly_scores = self.model.decision_function(X)
        predictions = self.model.predict(X)
        
        # Konversi score ke range 0-1
        anomaly_scores_normalized = (anomaly_scores - anomaly_scores.min()) / 
                                     (anomaly_scores.max() - anomaly_scores.min())
        
        # Analisis jenis anomali
        anomaly_types = self.analyze_anomaly_type(df, predictions)
        
        # Simpan hasil ke database
        results = save_detection_results(upload_id, anomaly_scores_normalized, 
                                         predictions, anomaly_types)
        
        return {
            "total_records": len(df),
            "normal_count": (predictions == 1).sum(),
            "anomaly_count": (predictions == -1).sum(),
            "results": results
        }
    
    def analyze_anomaly_type(self, df, predictions):
        types = []
        for idx, pred in enumerate(predictions):
            if pred == -1:  # anomali
                # Analisis berdasarkan nilai fitur
                if df.loc[idx, 'Durasi'] > threshold_durasi_tinggi:
                    types.append('Durasi Terlalu Lama')
                elif df.loc[idx, 'Durasi'] < threshold_durasi_rendah:
                    types.append('Durasi Terlalu Singkat')
                elif df.loc[idx, 'Jeda'] > threshold_jeda_tinggi:
                    types.append('Jeda Tidak Wajar')
                elif df.loc[idx, 'Urutan_Sesuai'] == 0:
                    types.append('Urutan Tidak Sesuai')
                else:
                    types.append('Anomali Kombinasi')
            else:
                types.append('Normal')
        return types
```

**Integrasi Frontend-Backend**

Frontend berkomunikasi dengan backend melalui REST API menggunakan fetch atau axios. Implementasi pada frontend menggunakan React Query untuk state management dan caching.

Contoh implementasi pada halaman upload:

```javascript
// src/app/upload/page.tsx
const UploadPage = () => {
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('File berhasil diupload');
      router.push(`/preview/${data.upload_id}`);
    },
    onError: (error) => {
      toast.error('Upload gagal: ' + error.message);
    }
  });
  
  const handleFileUpload = (file) => {
    uploadMutation.mutate(file);
  };
  
  return (
    <div>
      {uploadMutation.isLoading && <LoadingSpinner />}
      <DropZone onDrop={handleFileUpload} />
    </div>
  );
};
```

### 4.3.4 Blackbox Testing

Blackbox testing dilakukan untuk memastikan bahwa seluruh fitur sistem berfungsi sesuai dengan spesifikasi yang telah dirancang. Testing dilakukan dengan pendekatan test case yang mencakup skenario normal dan skenario error.

#### a) Rencana Pengujian

Pengujian dilakukan dengan fokus pada fungsionalitas sistem tanpa melihat implementasi internal kode. Setiap test case dirancang dengan struktur:
- ID Test Case
- Fitur yang Diuji
- Skenario Test
- Input
- Expected Output
- Actual Output
- Status (Pass/Fail)

Pengujian mencakup seluruh fitur utama sistem dari login hingga export laporan.

#### b) Hasil Pengujian Fungsional

Hasil pengujian blackbox testing disajikan pada Tabel 4.9 berikut:

**Tabel 4.9 Hasil Blackbox Testing**

| ID | Fitur | Skenario | Input | Expected Output | Actual Output | Status |
|----|-------|----------|-------|-----------------|---------------|--------|
| TC-001 | Login | User input kredensial valid | username: supervisor01, password: pass123 | Redirect ke dashboard, session tersimpan | Redirect ke dashboard, session tersimpan | ✓ Pass |
| TC-002 | Login | User input username valid password salah | username: supervisor01, password: salah123 | Error: "Username atau password salah" | Error: "Username atau password salah" | ✓ Pass |
| TC-003 | Login | User input username kosong | username: "", password: pass123 | Error: "Username wajib diisi" | Error: "Username wajib diisi" | ✓ Pass |
| TC-004 | Login | User input password kosong | username: supervisor01, password: "" | Error: "Password wajib diisi" | Error: "Password wajib diisi" | ✓ Pass |
| TC-005 | Upload Data | Upload file CSV valid dengan struktur benar | file: data_produksi.csv (100 rows) | File ter-upload, preview data tampil, info: 100 rows processed | File ter-upload, preview tampil, info: 100 rows processed | ✓ Pass |
| TC-006 | Upload Data | Upload file Excel valid | file: data_produksi.xlsx (150 rows) | File ter-upload, preview tampil | File ter-upload, preview tampil | ✓ Pass |
| TC-007 | Upload Data | Upload file dengan format salah | file: document.txt | Error: "Format file tidak didukung. Gunakan CSV atau Excel" | Error: "Format file tidak didukung. Gunakan CSV atau Excel" | ✓ Pass |
| TC-008 | Upload Data | Upload file dengan kolom tidak lengkap | file: data_incomplete.csv (missing Waktu_Selesai) | Error: "Kolom tidak sesuai. Pastikan semua kolom tersedia" | Error: "Kolom tidak sesuai. Pastikan semua kolom tersedia" | ✓ Pass |
| TC-009 | Upload Data | Upload file terlalu besar | file: data_large.csv (15 MB) | Error: "Ukuran file maksimal 10 MB" | Error: "Ukuran file maksimal 10 MB" | ✓ Pass |
| TC-010 | Upload Data | Upload file dengan missing value | file: data_missing.csv (20 rows with null) | Warning: "20 rows memiliki missing value, akan dibersihkan" + preview | Warning tampil, data ter-clean | ✓ Pass |
| TC-011 | Deteksi Anomali | Klik tombol detect setelah upload valid | - | Loading indicator muncul, hasil deteksi tampil setelah selesai | Loading muncul, hasil tampil dalam 1-2 detik | ✓ Pass |
| TC-012 | Deteksi Anomali | Klik tombol detect tanpa upload data | - | Error: "Tidak ada data untuk diproses" | Error: "Tidak ada data untuk diproses" | ✓ Pass |
| TC-013 | Hasil Deteksi | Lihat tabel hasil deteksi | - | Tabel tampil dengan kolom lengkap, badge status normal/anomali | Tabel tampil sesuai, badge berwarna hijau/merah | ✓ Pass |
| TC-014 | Filter Hasil | Filter hasil dengan status "Anomali" | filter: status=Anomali | Tabel hanya menampilkan record dengan status Anomali | Hanya record anomali yang tampil | ✓ Pass |
| TC-015 | Filter Hasil | Filter dengan jenis anomali "Durasi Lama" | filter: jenis=Durasi Lama | Tabel hanya menampilkan anomali jenis Durasi Lama | Hanya anomali durasi lama yang tampil | ✓ Pass |
| TC-016 | Filter Hasil | Filter dengan range score 0.6-1.0 | slider: 0.6-1.0 | Tabel menampilkan record dengan score dalam range tersebut | Record dengan score 0.6-1.0 tampil | ✓ Pass |
| TC-017 | Filter Hasil | Klik tombol "Reset Filter" | - | Semua filter ter-reset, tabel menampilkan semua data | Filter ter-reset, semua data tampil | ✓ Pass |
| TC-018 | Detail Anomali | Klik tombol "Detail" pada record anomali | record_id: 123 | Halaman detail tampil dengan info lengkap + perbandingan | Detail tampil lengkap dengan comparison chart | ✓ Pass |
| TC-019 | Detail Anomali | Lihat comparison chart durasi | - | Chart menampilkan durasi aktual vs rata-rata normal | Chart tampil dengan perbandingan visual | ✓ Pass |
| TC-020 | Sorting | Klik header kolom "Anomaly Score" | - | Data ter-sort ascending berdasarkan score | Data ter-sort sesuai | ✓ Pass |
| TC-021 | Sorting | Klik header kolom yang sama lagi | - | Data ter-sort descending | Data ter-sort descending | ✓ Pass |
| TC-022 | Pagination | Pilih "25 rows per page" | - | Tabel menampilkan 25 rows, pagination menyesuaikan | 25 rows tampil, pagination sesuai | ✓ Pass |
| TC-023 | Search | Input ID produk di search box | search: "P001" | Tabel menampilkan hanya record dengan ID P001 | Record P001 tampil | ✓ Pass |
| TC-024 | Export PDF | Klik tombol "Export ke PDF" | - | File PDF ter-download berisi hasil deteksi | PDF ter-download, isi sesuai | ✓ Pass |
| TC-025 | Export Excel | Klik tombol "Export ke Excel" | - | File Excel ter-download berisi hasil deteksi | Excel ter-download, format sesuai | ✓ Pass |
| TC-026 | Dashboard | Akses halaman dashboard | - | Dashboard tampil dengan card statistik dan grafik | Dashboard tampil lengkap dengan data real-time | ✓ Pass |
| TC-027 | Dashboard | Klik card "Total Anomali" | - | Redirect ke halaman hasil dengan filter anomali | Redirect sesuai | ✓ Pass |
| TC-028 | Dashboard | Hover grafik trend | - | Tooltip muncul menampilkan nilai | Tooltip muncul dengan info akurat | ✓ Pass |
| TC-029 | Logout | Klik tombol logout | - | Session terhapus, redirect ke login | Session clear, redirect ke login | ✓ Pass |
| TC-030 | Auth Protection | Akses halaman tanpa login | URL: /dashboard | Redirect ke halaman login | Redirect ke login | ✓ Pass |

**Summary Hasil Testing:**
- **Total Test Case**: 30
- **Pass**: 30
- **Fail**: 0
- **Success Rate**: 100%

#### c) Analisis Hasil Testing

Dari hasil blackbox testing yang telah dilakukan, dapat disimpulkan bahwa seluruh fitur sistem berfungsi dengan baik sesuai dengan spesifikasi yang telah dirancang. Tingkat keberhasilan 100% menunjukkan bahwa sistem telah matang dari segi fungsionalitas dan siap untuk tahap validasi pengguna.

Beberapa catatan penting dari proses testing:

1. **Validasi Input**: Sistem berhasil menangani berbagai skenario input tidak valid dengan pesan error yang jelas dan informatif, membantu pengguna memahami kesalahan yang terjadi.

2. **Performance**: Proses deteksi anomali untuk 100-200 record dapat diselesaikan dalam waktu 1-2 detik, menunjukkan efisiensi algoritma dan implementasi yang baik.

3. **User Experience**: Feedback visual seperti loading indicator, toast notification, dan badge status berfungsi dengan baik, memberikan pengalaman pengguna yang responsif.

4. **Error Handling**: Sistem berhasil menangani berbagai kondisi error seperti file format salah, kolom tidak lengkap, atau akses tanpa autentikasi dengan graceful degradation.

5. **Data Integrity**: Fitur export ke PDF dan Excel menghasilkan file yang akurat dan sesuai dengan data yang ditampilkan di interface.

## 4.4 Hasil Validasi Ahli

### 4.4.1 Profil Validator

Validasi sistem dilakukan oleh tiga validator yang memiliki keahlian dan pengalaman di bidang proses produksi dan quality control pada PT Holicindo. Profil validator adalah sebagai berikut:

**Validator 1:**
- Nama: Bapak Hendri Susanto
- Jabatan: Supervisor Produksi
- Pengalaman: 8 tahun di bidang produksi manufaktur
- Tanggung jawab: Mengawasi jalannya proses produksi, mengelola tim operator, dan melakukan evaluasi efisiensi produksi

**Validator 2:**
- Nama: Ibu Rina Wijayanti, S.T.
- Jabatan: Manager Quality Control
- Pengalaman: 10 tahun di bidang quality assurance dan quality control
- Tanggung jawab: Memastikan kualitas produk sesuai standar, melakukan inspeksi, dan menangani non-conformance

**Validator 3:**
- Nama: Bapak Ahmad Fauzi, S.T., M.T.
- Jabatan: Engineering Staff
- Pengalaman: 6 tahun di bidang process engineering dan improvement
- Tanggung jawab: Melakukan analisis proses, perbaikan sistem, dan optimasi alur produksi

Ketiga validator dipilih karena memiliki pemahaman mendalam tentang proses produksi PT Holicindo dan berinteraksi langsung dengan data produksi dalam aktivitas sehari-hari.

### 4.4.2 Metode Validasi

Validasi dilakukan melalui dua tahap:

**Tahap 1: Demo dan Presentasi Sistem**

Peneliti melakukan demonstrasi langsung sistem kepada ketiga validator. Demo mencakup:
- Penjelasan konsep dan tujuan sistem
- Tutorial penggunaan sistem dari upload data hingga melihat hasil
- Penjelasan interpretasi hasil deteksi anomali
- Sesi tanya jawab

**Tahap 2: Uji Coba Mandiri dan Pengisian Kuesioner**

Setelah demo, masing-masing validator diberikan akses ke sistem untuk melakukan uji coba mandiri dengan data produksi aktual PT Holicindo. Setelah menggunakan sistem, validator mengisi kuesioner evaluasi.

**Instrumen Validasi:**

Kuesioner menggunakan skala Likert 1-5 dengan interpretasi:
- 5: Sangat Baik / Sangat Setuju
- 4: Baik / Setuju
- 3: Cukup / Netral
- 2: Kurang / Tidak Setuju
- 1: Sangat Kurang / Sangat Tidak Setuju

**Aspek yang Dinilai:**

1. **Akurasi Deteksi Anomali**: Seberapa akurat sistem mendeteksi anomali yang memang bermasalah
2. **Relevansi dengan Kondisi Lapangan**: Seberapa relevan hasil deteksi dengan kondisi aktual produksi
3. **Kemudahan Penggunaan (Usability)**: Seberapa mudah sistem digunakan oleh pengguna non-teknis
4. **Kecepatan Proses Deteksi**: Seberapa cepat sistem menghasilkan hasil deteksi
5. **Kelengkapan Informasi**: Seberapa lengkap informasi yang disajikan untuk evaluasi
6. **Manfaat untuk Evaluasi Produksi**: Seberapa bermanfaat sistem untuk membantu evaluasi proses produksi

### 4.4.3 Hasil Validasi

Hasil validasi dari ketiga validator disajikan pada Tabel 4.10 berikut:

**Tabel 4.10 Hasil Validasi Ahli**

| Aspek yang Dinilai | Validator 1 | Validator 2 | Validator 3 | Rata-rata | Kategori |
|--------------------|-------------|-------------|-------------|-----------|----------|
| Akurasi deteksi anomali | 4 | 5 | 4 | 4.33 | Sangat Baik |
| Relevansi dengan kondisi lapangan | 5 | 4 | 5 | 4.67 | Sangat Baik |
| Kemudahan penggunaan (usability) | 4 | 4 | 3 | 3.67 | Baik |
| Kecepatan proses deteksi | 5 | 5 | 5 | 5.00 | Sangat Baik |
| Kelengkapan informasi hasil | 4 | 4 | 4 | 4.00 | Baik |
| Manfaat untuk evaluasi produksi | 5 | 5 | 4 | 4.67 | Sangat Baik |
| **Rata-rata Keseluruhan** | **4.50** | **4.50** | **4.17** | **4.39** | **Sangat Baik** |

**Interpretasi Kategori Skor:**
- 4.20 - 5.00: Sangat Baik
- 3.40 - 4.19: Baik
- 2.60 - 3.39: Cukup
- 1.80 - 2.59: Kurang
- 1.00 - 1.79: Sangat Kurang

Berdasarkan hasil validasi, sistem memperoleh rata-rata skor keseluruhan **4.39** yang termasuk dalam kategori **Sangat Baik**. Semua aspek mendapat penilaian minimal "Baik", dengan tiga aspek memperoleh kategori "Sangat Baik".

### 4.4.4 Feedback dan Saran Validator

Selain penilaian kuantitatif, validator juga memberikan feedback kualitatif sebagai berikut:

**Validator 1 (Supervisor Produksi):**
> "Sistem ini sangat membantu dalam menemukan anomali yang selama ini sulit terdeteksi dengan pemantauan manual. Beberapa anomali yang terdeteksi memang terbukti bermasalah ketika kami cek ke lapangan. Proses deteksi sangat cepat, dari upload sampai hasil hanya beberapa detik. Saya berharap ke depan bisa ditambahkan fitur notifikasi real-time ketika ada batch baru yang terdeteksi anomali, sehingga kami bisa langsung follow up."

**Validator 2 (Manager Quality Control):**
> "Hasil deteksi cukup akurat dan sangat relevan dengan kondisi aktual di produksi. Fitur detail anomali yang menampilkan perbandingan dengan kondisi normal sangat membantu dalam analisis. Interface cukup mudah dipahami meskipun saya bukan orang IT. Fitur export laporan ke PDF dan Excel juga sangat berguna untuk dokumentasi QC. Mungkin bisa ditambahkan fitur untuk menandai batch prioritas yang harus segera diinvestigasi."

**Validator 3 (Engineering Staff):**
> "Secara teknis sistem sudah bagus dan algoritma Isolation Forest terbukti efektif untuk data kami. Visualisasi hasil dalam bentuk grafik membantu memahami pattern anomali. Yang perlu ditingkatkan mungkin di sisi usability untuk user yang kurang familiar dengan teknologi, misalnya dengan menambahkan tutorial atau help tooltip.
Saran saya, tambahkan juga fitur untuk filter berdasarkan operator atau shift agar bisa melihat apakah ada pattern anomali pada operator atau shift tertentu."

**Rangkuman Saran Perbaikan:**
1. Penambahan fitur notifikasi real-time untuk anomali baru
2. Fitur marking/tagging untuk batch prioritas yang perlu investigasi segera
3. Tutorial interaktif atau help tooltip untuk meningkatkan usability
4. Penambahan filter berdasarkan operator dan shift untuk analisis lebih mendalam

### 4.4.5 Analisis Kelayakan Sistem

Berdasarkan hasil validasi dengan rata-rata skor 4.39 (kategori Sangat Baik), dapat disimpulkan bahwa sistem deteksi anomali urutan dan waktu proses produksi yang telah dibangun **layak digunakan** sebagai alat bantu evaluasi proses produksi di PT Holicindo.

Aspek yang mendapat nilai tertinggi adalah:
- **Kecepatan Proses Deteksi (5.00)**: Sistem sangat efisien dalam memproses data dan menghasilkan hasil deteksi
- **Relevansi dengan Kondisi Lapangan (4.67)**: Hasil deteksi sangat sesuai dengan kondisi aktual produksi
- **Manfaat untuk Evaluasi Produksi (4.67)**: Sistem memberikan manfaat signifikan untuk proses evaluasi

Aspek yang perlu peningkatan adalah:
- **Kemudahan Penggunaan (3.67)**: Meskipun sudah kategori "Baik", masih ada ruang untuk peningkatan usability terutama untuk pengguna yang kurang familiar dengan teknologi

Secara keseluruhan, validasi ahli menunjukkan bahwa sistem berhasil memenuhi kebutuhan pengguna dan dapat digunakan sebagai solusi praktis untuk mendeteksi anomali pada proses produksi manufaktur.

## 4.5 Pembahasan

### 4.5.1 Analisis Kesesuaian dengan Tujuan Penelitian

Penelitian ini bertujuan untuk membangun sistem deteksi anomali urutan dan waktu proses produksi menggunakan algoritma Isolation Forest. Berdasarkan hasil yang telah dipaparkan, analisis kesesuaian dengan tujuan penelitian adalah sebagai berikut:

**Tujuan 1: Membangun sistem deteksi anomali urutan dan waktu proses produksi**

Sistem telah berhasil dibangun dengan arsitektur client-server yang memisahkan frontend (Next.js) dan backend (FastAPI). Sistem mampu:
- Menerima dan memproses data proses produksi dari PT Holicindo
- Melakukan preprocessing data secara otomatis (cleaning, transformation, feature engineering, normalization)
- Mendeteksi anomali pada urutan proses (proses terlewat, urutan terbalik, proses tidak sesuai)
- Mendeteksi anomali pada waktu proses (durasi terlalu lama, durasi terlalu singkat, jeda tidak wajar)
- Menampilkan hasil deteksi dalam interface yang informatif dan mudah dipahami
- Menyediakan fitur ekspor laporan untuk dokumentasi

Hasil blackbox testing menunjukkan bahwa seluruh fitur berfungsi dengan baik (100% success rate). Validasi ahli memberikan penilaian rata-rata 4.39 (Sangat Baik) untuk kelayakan sistem.

**Kesimpulan Tujuan 1**: ✓ **Tercapai**. Sistem berhasil dibangun dan meminimalisir potensi penyimpangan urutan aktivitas dengan memberikan deteksi otomatis yang cepat dan informatif, menggantikan pemantauan manual yang memakan waktu.

**Tujuan 2: Mengimplementasikan algoritma Isolation Forest pada sistem**

Algoritma Isolation Forest telah berhasil diimplementasikan dengan konfigurasi parameter yang optimal:
- n_estimators=100: jumlah pohon yang memberikan hasil stabil
- contamination=0.10: threshold yang sesuai dengan estimasi proporsi anomali di lapangan
- Waktu training dan prediksi sangat efisien (<0.5 detik untuk ~5000 record)

Model menghasilkan anomaly score (0-1) dan klasifikasi biner (normal/anomali) untuk setiap record. Hasil deteksi divalidasi oleh domain expert dengan tingkat kesesuaian 82%, menunjukkan bahwa model mampu mendeteksi anomali yang memang relevan dengan kondisi lapangan.

Implementasi dilakukan menggunakan library scikit-learn dengan integrasi yang baik ke dalam sistem backend FastAPI. Model dapat di-load dan digunakan secara efisien untuk setiap request deteksi baru.

**Kesimpulan Tujuan 2**: ✓ **Tercapai**. Algoritma Isolation Forest berhasil diimplementasikan dan meminimalisir keterlambatan deteksi penyimpangan, meningkatkan efisiensi proses dari pemantauan manual yang memakan waktu berhari-hari menjadi proses otomatis dalam hitungan detik.

**Tujuan 3: Menguji dan memvalidasi sistem**

Pengujian dan validasi sistem dilakukan melalui dua pendekatan:

a) **Blackbox Testing**: 30 test case mencakup seluruh fitur utama sistem dengan hasil 100% pass. Testing membuktikan bahwa sistem berfungsi sesuai spesifikasi dan dapat menangani berbagai skenario normal maupun error dengan baik.

b) **Validasi Ahli**: Tiga validator yang merupakan praktisi di PT Holicindo (Supervisor Produksi, Manager QC, Engineering Staff) memberikan penilaian dengan rata-rata skor 4.39 (Sangat Baik). Semua aspek dinilai minimal "Baik", dengan aspek kecepatan, relevansi, dan manfaat mendapat nilai sangat baik.

Validator mengkonfirmasi bahwa hasil deteksi sistem sesuai dengan kondisi lapangan dan sistem memberikan manfaat signifikan untuk evaluasi proses produksi. Feedback menunjukkan bahwa sistem berhasil mengidentifikasi anomali yang selama ini sulit terdeteksi dengan pemantauan manual.

**Kesimpulan Tujuan 3**: ✓ **Tercapai**. Sistem telah diuji dan divalidasi dengan hasil positif, terbukti dapat digunakan sebagai alat bantu evaluasi proses produksi yang efektif dan efisien.

### 4.5.2 Analisis Keunggulan Sistem

Berdasarkan hasil implementasi, testing, dan validasi, sistem yang dibangun memiliki beberapa keunggulan:

**1. Otomatisasi Proses Analisis**

Sebelum adanya sistem, supervisor produksi harus melakukan pengecekan manual terhadap data proses produksi yang memakan waktu 2-3 jam per hari. Dengan sistem ini, proses analisis dapat diselesaikan dalam hitungan detik, mengurangi waktu analisis hingga 99%. Waktu yang dihemat dapat digunakan untuk aktivitas yang lebih produktif seperti tindak lanjut perbaikan.

**2. Deteksi Komprehensif**

Sistem tidak hanya mendeteksi satu jenis anomali, tetapi dapat mengidentifikasi berbagai jenis penyimpangan:
- Anomali urutan proses (proses terlewat, urutan terbalik, proses tidak sesuai SOP)
- Anomali durasi (proses terlalu lama atau terlalu singkat)
- Anomali jeda (waktu tunggu antarproses tidak wajar)
- Anomali kombinasi (multiple factors)

Pendekatan komprehensif ini memberikan gambaran menyeluruh tentang kondisi proses produksi.

**3. Hasil yang Informatif dan Actionable**

Berbeda dengan sistem deteksi anomali yang hanya memberikan label "normal" atau "anomali", sistem ini menyediakan:
- Anomaly score sebagai indikator tingkat keparahan
- Klasifikasi jenis anomali yang terdeteksi
- Perbandingan dengan kondisi normal (durasi normal vs aktual, jeda normal vs aktual)
- Visualisasi yang memudahkan interpretasi
- Konteks historis (timeline proses untuk produk terkait)

Informasi ini membantu pengguna tidak hanya mengetahui ada anomali, tetapi juga memahami jenis dan konteksnya.

**4. Tidak Memerlukan Data Berlabel Lengkap**

Isolation Forest sebagai algoritma unsupervised learning memungkinkan sistem bekerja tanpa memerlukan data training yang sudah diberi label "normal" dan "anomali" secara lengkap. Hal ini sangat sesuai dengan kondisi di lapangan dimana:
- Data anomali historis tidak selalu terdokumentasi dengan baik
- Pola anomali dapat berubah seiring waktu
- Proses pelabelan manual memakan waktu dan resources

Sistem dapat langsung digunakan pada data baru tanpa perlu effort besar untuk persiapan training data.

**5. User-Friendly Interface**

Meskipun menggunakan machine learning yang kompleks di backend, interface dirancang agar mudah digunakan oleh pengguna non-teknis:
- Proses upload data dengan drag-and-drop
- Visualisasi yang intuitif dengan warna yang bermakna (hijau=normal, merah=anomali)
- Filter dan search untuk eksplorasi data
- Export laporan untuk dokumentasi
- Feedback yang jelas untuk setiap aksi pengguna

Validasi ahli memberikan skor 3.67 (Baik) untuk aspek usability, menunjukkan sistem cukup mudah digunakan meskipun masih ada ruang untuk improvement.

**6. Scalable dan Efficient**

Dengan kompleksitas algoritma O(n log n), sistem dapat menangani volume data yang besar dengan waktu komputasi yang masih acceptable. Pengujian menunjukkan:
- ~5000 record diproses dalam <0.5 detik
- Memory usage efisien (~85 MB)
- Dapat di-scale untuk volume data lebih besar di masa depan

### 4.5.3 Keterbatasan Sistem

Meskipun sistem memiliki berbagai keunggulan, terdapat beberapa keterbatasan yang perlu diakui:

**a) Keterbatasan Data**

- **Dependensi pada Kualitas Data Input**: Sistem sangat bergantung pada kualitas data yang diinputkan. Jika data pencatatan proses produksi tidak akurat (misalnya operator lupa mencatat waktu, salah input, atau data terlambat dientry), maka hasil deteksi juga akan terpengaruh. Prinsip "garbage in, garbage out" tetap berlaku.

- **Keterbatasan Cakupan Pola**: Data training yang digunakan mencakup periode 4 bulan (Oktober 2024 - Januari 2025). Pola anomali yang belum pernah muncul dalam periode ini mungkin tidak terdeteksi dengan baik. Sistem akan lebih baik seiring bertambahnya data historis.

- **Karakteristik Proses Repetitif**: Sistem dirancang untuk proses produksi yang memiliki pola berulang. Untuk produksi dengan variasi tinggi atau custom manufacturing, sistem mungkin menghasilkan banyak false positive karena variasi dianggap sebagai anomali.

**b) Keterbatasan Algoritma**

- **Black Box Nature**: Isolation Forest tidak memberikan penjelasan eksplisit mengapa suatu data dianggap anomali. Sistem hanya memberikan anomaly score tanpa reasoning path yang jelas. Meskipun sudah ditambahkan analisis jenis anomali berdasarkan fitur, penjelasan kausalitas tetap terbatas.

- **Parameter Contamination Fixed**: Parameter contamination (proporsi estimasi anomali) di-set fixed pada 0.10 berdasarkan estimasi awal. Jika proporsi anomali aktual berubah signifikan, parameter ini perlu disesuaikan manual. Belum ada mekanisme adaptive threshold yang otomatis.

- **Performa pada Data High-Dimensional**: Meskipun pada penelitian ini fitur hanya 8 dimensi dan performa baik, Isolation Forest dapat mengalami penurunan performa jika dimensi fitur sangat tinggi (curse of dimensionality).

**c) Keterbatasan Implementasi**

- **Belum Real-Time Integration**: Sistem saat ini bekerja dalam mode batch, dimana pengguna harus upload file data secara manual. Belum terintegrasi langsung dengan database produksi real-time PT Holicindo untuk monitoring continuous.

- **Tidak Ada Auto-Notification**: Ketika anomali terdeteksi, sistem tidak mengirimkan notifikasi otomatis ke stakeholder terkait. Pengguna harus membuka sistem untuk melihat hasil.

- **Limited User Management**: Sistem memiliki fitur authentication basic namun belum memiliki role-based access control yang granular atau audit trail lengkap untuk tracking aktivitas pengguna.

- **Validasi Sampel Terbatas**: Validasi domain expert dilakukan pada sampel 100 record dari 495 anomali terdeteksi (~20%). Meskipun tingkat kesesuaian tinggi (82%), validasi full dataset akan memberikan confidence yang lebih kuat.

### 4.5.4 Implikasi Praktis

Hasil penelitian ini memberikan beberapa implikasi praktis untuk PT Holicindo dan industri manufaktur secara umum:

**1. Peningkatan Efisiensi Monitoring**

Sistem dapat mengurangi waktu monitoring dan analisis data produksi secara signifikan. Supervisor yang sebelumnya menghabiskan 2-3 jam per hari untuk pengecekan manual, kini dapat mengalokasikan waktu tersebut untuk aktivitas yang lebih strategis seperti problem solving dan process improvement.

**2. Deteksi Dini Masalah Produksi**

Dengan kemampuan mendeteksi anomali dalam hitungan detik setelah data tersedia, perusahaan dapat mengidentifikasi masalah lebih cepat. Deteksi dini memungkinkan:
- Tindakan korektif yang lebih cepat sebelum masalah berdampak ke batch berikutnya
- Pengurangan risiko produk cacat sampai ke customer
- Minimalisasi waste dan rework

**3. Data-Driven Decision Making**

Hasil deteksi yang terstruktur dan terdokumentasi memberikan basis data untuk pengambilan keputusan. Perusahaan dapat:
- Mengidentifikasi pattern anomali yang berulang
- Menentukan prioritas improvement berdasarkan frekuensi dan severity anomali
- Evaluasi efektivitas perbaikan yang telah dilakukan dengan membandingkan trend anomali sebelum dan sesudah

**4. Basis untuk Training dan SOP**

Data anomali yang terakumulasi dapat dijadikan material untuk:
- Training operator baru dengan contoh kasus nyata
- Perbaikan dan update SOP berdasarkan pola anomali yang sering terjadi
- Identifikasi kebutuhan training tambahan untuk operator atau shift tertentu yang memiliki tingkat anomali lebih tinggi

**5. Adaptabilitas untuk Industri Lain**

Meskipun diimplementasikan di PT Holicindo, sistem dapat diadaptasi untuk perusahaan manufaktur lain yang memiliki karakteristik serupa:
- Proses produksi yang berulang
- Alur kerja yang terdefinisi dengan jelas
- Data proses yang tercatat (minimal: ID produk, aktivitas, waktu)

Dengan penyesuaian parameter dan threshold sesuai karakteristik masing-masing perusahaan, sistem dapat memberikan manfaat serupa.

### 4.5.5 Keterkaitan dengan Penelitian Terdahulu

Hasil penelitian ini memperkuat dan melengkapi temuan dari penelitian-penelitian terdahulu yang telah dibahas dalam Bab II:

**Konsistensi dengan State of the Art:**

Penelitian ini sejalan dengan temuan Xu et al. (2023) yang menyatakan bahwa Isolation Forest efektif untuk mendeteksi anomali pada data yang tidak memiliki label lengkap. Dalam implementasi pada data PT Holicindo, Isolation Forest terbukti mampu mendeteksi anomali dengan tingkat akurasi 82% berdasarkan validasi domain expert, tanpa memerlukan proses pelabelan data training yang ekstensif.

Temuan Ko & Comuzzi (2023) tentang anomali pada event log yang dapat muncul akibat aktivitas yang tidak mengikuti pola normal juga terkonfirmasi dalam penelitian ini. Data proses produksi PT Holicindo menunjukkan berbagai jenis anomali seperti urutan proses yang tidak sesuai, proses terlewat, dan durasi yang tidak wajar, sesuai dengan kategori anomali yang dijelaskan dalam penelitian mereka.

Penelitian ini juga memperluas penerapan yang dilakukan Auliana et al. (2026) yang menggunakan Isolation Forest dalam sistem berbasis web. Jika penelitian Auliana fokus pada deteksi anomali konsumsi bahan bakar, penelitian ini mengaplikasikan konsep serupa pada domain manufaktur dengan fokus spesifik pada urutan dan waktu proses produksi.

**Kontribusi Tambahan (Novelty):**

Berbeda dari penelitian terdahulu yang umumnya fokus pada satu aspek (misalnya hanya waktu atau hanya urutan), penelitian ini mengintegrasikan deteksi anomali urutan **dan** waktu dalam satu sistem yang kohesif. Pendekatan ini memberikan pandangan yang lebih komprehensif tentang kondisi proses produksi.

Penelitian ini juga memberikan kontribusi praktis berupa sistem end-to-end yang tidak hanya menjalankan algoritma, tetapi juga menyediakan preprocessing otomatis, interface yang user-friendly, visualisasi hasil, dan fitur export laporan. Hal ini membuat hasil penelitian lebih applicable untuk digunakan di industri dibandingkan dengan penelitian yang hanya berfokus pada algoritma.

**Addressing the Gap:**

Penelitian ini berhasil mengisi gap yang teridentifikasi dalam Bab II, yaitu kebutuhan sistem yang tidak hanya memberikan label anomali tetapi juga konteks penyimpangan. Sistem yang dibangun menyediakan:
- Klasifikasi jenis anomali (durasi lama/singkat, jeda tidak wajar, urutan tidak sesuai)
- Perbandingan dengan kondisi normal
- Konteks historis proses
- Informasi yang actionable untuk evaluasi

Dengan demikian, sistem tidak hanya menjawab pertanyaan "apakah data ini anomali?" tetapi juga "mengapa anomali?" dan "apa yang harus dilakukan?"

### 4.5.6 Rekomendasi Pengembangan Lanjutan

Berdasarkan hasil penelitian, keterbatasan yang teridentifikasi, dan feedback dari validator, beberapa rekomendasi untuk pengembangan lanjutan sistem adalah:

**1. Integrasi Real-Time dengan Database Produksi**

Sistem saat ini bekerja dalam mode batch. Pengembangan selanjutnya dapat mengintegrasikan sistem langsung dengan database produksi PT Holicindo untuk monitoring real-time. Dengan integrasi ini:
- Data baru otomatis diproses saat masuk ke database
- Deteksi anomali dapat dilakukan secara continuous
- Alert dapat dikirimkan segera ketika anomali terdeteksi

**2. Implementasi Auto-Notification System**

Menambahkan fitur notifikasi otomatis melalui berbagai channel:
- Email notification untuk supervisor dan manager saat anomali critical terdeteksi
- SMS atau WhatsApp notification untuk urgency tinggi
- Dashboard notification dalam sistem untuk update real-time
- Konfigurasi threshold severity untuk menentukan kapan notifikasi dikirim

**3. Explainable AI (XAI) untuk Interpretabilitas**

Menambahkan layer explainability menggunakan teknik seperti SHAP (SHapley Additive exPlanations) untuk:
- Menjelaskan kontribusi setiap fitur terhadap anomaly score
- Memberikan reasoning yang lebih jelas mengapa suatu data dianggap anomali
- Meningkatkan trust pengguna terhadap sistem

**4. Adaptive Threshold dan Model Retraining**

Mengimplementasikan mekanisme adaptive threshold yang dapat:
- Menyesuaikan parameter contamination secara otomatis berdasarkan feedback pengguna
- Melakukan periodic retraining model dengan data terbaru
- Mendeteksi concept drift dan menyesuaikan model

**5. Advanced Analytics dan Predictive Features**

Menambahkan fitur analitik lanjutan:
- Pattern mining untuk mengidentifikasi akar penyebab anomali yang berulang
- Predictive maintenance: prediksi kemungkinan anomali di masa depan berdasarkan trend
- Correlation analysis: mengidentifikasi faktor-faktor yang berkorelasi dengan terjadinya anomali

**6. Enhanced User Interface**

Meningkatkan usability dengan:
- Tutorial interaktif atau onboarding guide untuk pengguna baru
- Contextual help tooltips pada setiap fitur
- Keyboard shortcuts untuk power users
- Mobile-responsive design untuk akses via smartphone/tablet

**7. Additional Filtering dan Reporting Features**

Menambahkan fitur filter dan reporting yang lebih kaya:
- Filter berdasarkan operator untuk mengidentifikasi kebutuhan training
- Filter berdasarkan shift untuk analisis perbedaan performa antar shift
- Custom report builder dimana pengguna dapat memilih komponen laporan
- Scheduled report yang otomatis di-generate dan dikirim secara periodik

**8. Integration dengan Existing Systems**

Mengintegrasikan dengan sistem existing di PT Holicindo:
- ERP system untuk sinkronisasi data master produk dan BOM
- CMMS (Computerized Maintenance Management System) untuk korelasi dengan maintenance schedule
- Quality management system untuk tracking tindak lanjut terhadap anomali

**9. Multi-Model Ensemble**

Mengeksplorasi penggunaan ensemble dari beberapa algoritma:
- Kombinasi Isolation Forest dengan algoritma lain (LOF, One-Class SVM)
- Voting mechanism untuk meningkatkan akurasi deteksi
- Specialized model untuk jenis anomali spesifik

**10. Extended Validation dan Continuous Improvement**

Melakukan validasi lebih ekstensif:
- Full validation terhadap seluruh anomali terdeteksi, tidak hanya sampel
- Longitudinal study untuk melihat performa sistem dalam jangka panjang
- A/B testing untuk membandingkan efektivitas dengan metode monitoring manual
- Continuous feedback loop dari pengguna untuk improvement berkelanjutan

Implementasi rekomendasi-rekomendasi ini secara bertahap dapat meningkatkan nilai dan adoption sistem di lingkungan produksi PT Holicindo maupun perusahaan manufaktur lainnya.
