// Interface language: Indonesian (default) or English.
// The page and the scripts write their text in either language; this module swaps every text node and
// label attribute that matches a pair below into the chosen language, including text added later.
// Pairs are [English, Indonesian]; {name} is a blank that matches any text and is carried across.
// Mark an element translate="no" to leave its text alone.

const KEY = 'calora-lang';

function readLang() {
  try {
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

export const lang = readLang();

/** Locale for numbers and dates in the chosen language. */
export function locale() {
  return lang === 'id' ? 'id-ID' : 'en-GB';
}

/** "Sen, 23 Nov 2026" / "Mon, 23 Nov 2026" */
export function shortDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

const PAIRS = [
  // Navigation and shared
  ['Home', 'Beranda'],
  ['Catering', 'Katering'],
  ['Food', 'Makanan'],
  ['Workout', 'Latihan'],
  ['Trends', 'Tren'],
  ['Profile', 'Profil'],
  ['Activity', 'Aktivitas'],
  ['Other', 'Lainnya'],
  ['Primary', 'Navigasi utama'],
  ['Food photo', 'Foto makanan'],
  ['Sign in', 'Masuk'],
  ['Signing in…', 'Masuk…'],
  ['Sign out', 'Keluar'],
  ['Logged out', 'Berhasil keluar'],
  ['Guest', 'Tamu'],
  ['Sample', 'Contoh'],
  ['Save', 'Simpan'],
  ['Saving…', 'Menyimpan…'],
  ['Cancel', 'Batal'],
  ['Delete', 'Hapus'],
  ['Close', 'Tutup'],
  ['Confirm', 'Konfirmasi'],
  ['Confirm Action', 'Konfirmasi tindakan'],
  ['Are you sure you want to proceed?', 'Yakin ingin melanjutkan?'],
  ['Dark mode', 'Mode gelap'],
  ['Light mode', 'Mode terang'],
  ['Appearance', 'Tampilan'],
  ['System', 'Sistem'],
  ['Light theme', 'Terang'],
  ['Dark', 'Gelap'],
  ['Language', 'Bahasa'],
  ['Drag to rotate 360°', 'Geser untuk memutar 360°'],

  // Landing and guest home
  ['Know what', 'Ketahui'],
  ['comes next.', 'langkah berikutnya.'],
  ["Track what you eat. Understand the trend. Plan tomorrow's catering.", 'Catat yang kamu makan. Pahami trennya. Rencanakan katering besok.'],
  ["Calora plans one kitchen lunch. You log the rest of the day, and it tells you what to eat tonight and tomorrow's calorie target.", 'Calora merencanakan satu makan siang dari dapur. Kamu mencatat sisa harimu, lalu Calora memberi tahu apa yang sebaiknya dimakan malam ini dan target kalori besok.'],
  ['Log a meal or a workout.', 'Catat makanan atau latihan.'],
  ["Read tonight and tomorrow's catering.", 'Lihat menu malam ini dan katering besok.'],
  ['Follow weight and calories on Trends.', 'Pantau berat badan dan kalori di Tren.'],
  ['Download for Android', 'Unduh untuk Android'],
  ['Scan to open Calora on your phone', 'Pindai untuk membuka Calora di ponselmu'],
  ['QR code for {url}', 'Kode QR untuk {url}'],
  ['Android app (APK). Your phone may ask you to allow installs from this browser.', 'Aplikasi Android (APK). Ponselmu mungkin meminta izin untuk memasang dari browser ini.'],
  ['Android app', 'Aplikasi Android'],
  ["Tomorrow's catering", 'Katering besok'],
  ["This is a sample day. After you sign in, tonight and tomorrow's catering come from your own meals.", 'Ini contoh satu hari. Setelah masuk, menu malam ini dan katering besok dihitung dari makananmu sendiri.'],
  ['Daily target', 'Target harian'],
  ['Catering allocation', 'Alokasi katering'],
  ['Tomorrow lunch', 'Makan siang besok'],
  ['Tonight eat', 'Makan malam ini'],
  ['Sample: chicken rice', 'Contoh: nasi ayam'],
  ['Sample: vegetable soup', 'Contoh: sup sayur'],
  ['Log a meal', 'Catat makanan'],

  // Signed-in home
  ['Hello 👋', 'Halo 👋'],
  ['Hello, {name} 👋', 'Halo, {name} 👋'],
  ['Hello, {name}', 'Halo, {name}'],
  ['Keep your nutrition on track today!', 'Semangat menjaga nutrisimu hari ini!'],
  ['Catering tokens', 'Token catering'],
  ['Notifications', 'Notifikasi'],
  ['No notifications yet', 'Belum ada notifikasi'],
  ["Today's calories", 'Kalori hari ini'],
  ['Calories left', 'Sisa kalori'],
  ['kcal left', 'kcal tersisa'],
  ['Carbs', 'Karbohidrat'],
  ['Fat', 'Lemak'],
  ['Carbs {n}g', 'Karbo {n}g'],
  ['Fat {n}g', 'Lemak {n}g'],
  ["Tomorrow's catering status", 'Status katering besok'],
  ["Tomorrow's menu", 'Menu besok'],
  ['No menu yet', 'Belum ada menu'],
  ['Menu not available yet', 'Menu belum tersedia'],
  ["Tomorrow's menu appears once a catering package is active.", 'Menu besok muncul setelah paket catering aktif.'],
  ['Lunch ·', 'Makan siang ·'],
  ["Today's Meals", 'Makanan hari ini'],
  ['Full log', 'Semua catatan'],
  ['Recent Workouts', 'Latihan terakhir'],
  ['All sessions', 'Semua sesi'],
  ['Why this changed', 'Kenapa ini berubah'],
  ["More logging is needed before Calora changes tomorrow's catering.", 'Calora butuh lebih banyak catatan sebelum mengubah katering besok.'],
  ['More about today', 'Selengkapnya tentang hari ini'],
  ['Training This Week', 'Latihan minggu ini'],
  ['sessions', 'sesi'],
  ['sets', 'set'],
  ['duration', 'durasi'],
  ['exercises', 'gerakan'],
  ['No sessions this week', 'Belum ada sesi minggu ini'],
  ['Last Session', 'Sesi terakhir'],
  ['No session logged', 'Belum ada sesi tercatat'],
  ['Last: {name}', 'Terakhir: {name}'],
  ['Recent', 'Terbaru'],
  ['Session', 'Sesi'],
  ['Sets Logged', 'Set tercatat'],
  ['this week', 'minggu ini'],
  ['entry logged', 'entri tercatat'],
  ['entries logged', 'entri dicatat'],
  ['No adjustment is required.', 'Tidak perlu penyesuaian.'],
  ['No meals logged today.', 'Belum ada makanan hari ini.'],
  ['No workouts logged yet.', 'Belum ada latihan tercatat.'],
  ['Exercise', 'Gerakan'],
  ['{n} sets', '{n} set'],
  ['{n} reps', '{n} repetisi'],
  ['{n} mins', '{n} menit'],

  // Catering explanations (codes come from the server with underscores replaced by spaces)
  ['INSUFFICIENT LOGGING', 'CATATAN BELUM CUKUP'],
  ['PROTEIN BELOW TARGET', 'PROTEIN DI BAWAH TARGET'],
  ['WEIGHT TRAJECTORY ON TARGET', 'ARAH BERAT SESUAI TARGET'],
  ['WEIGHT TRAJECTORY OFF TARGET', 'ARAH BERAT TIDAK SESUAI TARGET'],
  ['CALORIE TREND ABOVE TARGET', 'TREN KALORI DI ATAS TARGET'],
  ['CALORIE TREND BELOW TARGET', 'TREN KALORI DI BAWAH TARGET'],
  ['NO ADJUSTMENT REQUIRED', 'TIDAK PERLU PENYESUAIAN'],
  ['Only {a} of the last {b} days contain food logs. The base energy target remains stable.', 'Hanya {a} dari {b} hari terakhir yang punya catatan makanan. Target energi dasar tetap.'],
  ['Recent sufficiently logged days are below the configured protein target, so higher-protein catering was prioritized.', 'Hari-hari yang tercatat cukup lengkap masih di bawah target protein, jadi katering tinggi protein diprioritaskan.'],
  ['Weight trajectory is consistent with the current goal, so no energy correction was applied.', 'Arah berat badan sudah sesuai target, jadi tidak ada koreksi energi.'],
  ['Weight trajectory is not currently aligned with the configured goal.', 'Arah berat badan saat ini belum sesuai target.'],
  ['A persistent intake trend above target supported a bounded 100 kcal adjustment.', 'Asupan yang terus di atas target membuat penyesuaian terbatas 100 kcal.'],
  ['A persistent intake trend below target supported a bounded 100 kcal adjustment.', 'Asupan yang terus di bawah target membuat penyesuaian terbatas 100 kcal.'],
  ['Recent evidence does not justify changing the base energy target.', 'Data terbaru belum cukup untuk mengubah target energi dasar.'],

  // Trends
  ['Weight, calories, and workouts over time. The numbers below are examples.', 'Berat badan, kalori, dan latihan dari waktu ke waktu. Angka di bawah hanya contoh.'],
  ['Average calories', 'Rata-rata kalori'],
  ['Average protein', 'Rata-rata protein'],
  ['Logging completeness', 'Kelengkapan catatan'],
  ['Weight trajectory', 'Arah berat badan'],
  ['{a} of {b} days', '{a} dari {b} hari'],
  ['{n} kg/week', '{n} kg/minggu'],
  ['{n} kcal/day', '{n} kcal/hari'],
  ['{n} g/day', '{n} g/hari'],
  ['{p}% · {a}/{b} days', '{p}% · {a}/{b} hari'],
  ['Save weight', 'Simpan berat'],
  ['Rolling state', 'Kondisi berjalan'],
  ['7-day Trends', 'Tren 7 hari'],
  ['Activity energy', 'Energi aktivitas'],
  ['Estimated; not added 1:1 to food allowance', 'Perkiraan; tidak ditambahkan 1:1 ke jatah makan'],
  ['Not enough measurements', 'Data pengukuran belum cukup'],
  ['Decision confidence', 'Keyakinan keputusan'],
  ['Low', 'Rendah'],
  ['LOW', 'RENDAH'],
  ['MEDIUM', 'SEDANG'],
  ['HIGH', 'TINGGI'],
  ['Weight check-in', 'Cek berat badan'],
  ['Add measurement', 'Tambah pengukuran'],
  ['Weight (kg)', 'Berat (kg)'],
  ['Weight could not be saved', 'Berat badan gagal disimpan'],
  ['Weight measurement saved', 'Berat badan disimpan'],

  // Workout
  ['Start a session and add exercises here. The sessions below are examples.', 'Mulai sesi dan tambahkan gerakan di sini. Sesi di bawah hanya contoh.'],
  ['Sample: squat session', 'Contoh: sesi squat'],
  ['3 sessions this week · 12 sets · 40 minutes', '3 sesi minggu ini · 12 set · 40 menit'],
  ['Start session', 'Mulai sesi'],
  ['Add exercise', 'Tambah gerakan'],
  ['Workout Volume & Sets', 'Volume & set latihan'],
  ['7 Days', '7 Hari'],
  ['30 Days', '30 Hari'],
  ['Active Session', 'Sesi aktif'],
  ['End session', 'Akhiri sesi'],
  ['Pause', 'Jeda'],
  ['Resume', 'Lanjutkan'],
  ['Workout Log', 'Catatan latihan'],
  ['All', 'Semua'],
  ['Today', 'Hari ini'],
  ['Summary', 'Ringkasan'],
  ['Total Exercises', 'Total gerakan'],
  ['Total Sets Completed', 'Total set selesai'],
  ['Total Volume Lifted', 'Total volume angkatan'],
  ['Set', 'Set'],
  ['Reps', 'Repetisi'],
  ['Session timer started', 'Timer sesi dimulai'],
  ['Session timer paused', 'Timer sesi dijeda'],
  ['No active timer to end', 'Tidak ada timer yang berjalan'],
  ['End Workout Session', 'Akhiri sesi latihan'],
  ['Save active session duration ({t}) and finish?', 'Simpan durasi sesi ({t}) dan selesai?'],
  ['End & Save', 'Akhiri & simpan'],
  ['Workout session could not be saved', 'Sesi latihan gagal disimpan'],
  ['Session completed ({n} mins logged)', 'Sesi selesai ({n} menit tercatat)'],
  ['New workout synced from Health Connect', 'Latihan baru disinkronkan dari Health Connect'],
  ['No workout entries found. Click "+ Add Exercise" to log a set.', 'Belum ada latihan. Klik "Tambah gerakan" untuk mencatat set.'],
  ['Delete Exercise Entry', 'Hapus latihan'],
  ['Are you sure you want to delete this workout log? This cannot be undone.', 'Yakin ingin menghapus catatan latihan ini? Tindakan ini tidak bisa dibatalkan.'],
  ['Delete Entry', 'Hapus catatan'],
  ['Workout could not be deleted', 'Latihan gagal dihapus'],
  ['Exercise entry deleted', 'Latihan dihapus'],
  ['Exercise entry could not be saved', 'Latihan gagal disimpan'],
  ['Exercise entry logged', 'Latihan dicatat'],
  ['Log Exercise', 'Catat latihan'],
  ['Close exercise form', 'Tutup form latihan'],
  ['Exercise Name', 'Nama gerakan'],
  ['e.g. Barbell Bench Press', 'mis. Barbell Bench Press'],
  ['Save Record', 'Simpan catatan'],

  // Food
  ['Log what you eat here. The meals below are examples.', 'Catat yang kamu makan di sini. Makanan di bawah hanya contoh.'],
  ['Lunch · 650 kcal · 35g protein', 'Makan siang · 650 kcal · 35g protein'],
  ['Dinner · 320 kcal · 12g protein', 'Makan malam · 320 kcal · 12g protein'],
  ['Nutrition Trends', 'Tren nutrisi'],
  ['1D', '1H'],
  ['7D', '7H'],
  ['30D', '30H'],
  ['1Y', '1T'],
  ['Food Log', 'Catatan makanan'],
  ['{n} entries', '{n} entri'],
  ['{n} entry', '{n} catatan'],
  ['No meals yet. Log a meal.', 'Belum ada makanan. Catat makanan.'],
  ['Grade {g}', 'Nilai {g}'],
  ['Calories Today', 'Kalori Hari Ini'],
  ['Daily Nutrients', 'Nutrisi harian'],
  ['Sugar', 'Gula'],
  ['Sodium', 'Natrium'],
  ['Max: 2,000mg', 'Maks: 2.000mg'],
  ['Max: {n}', 'Maks: {n}'],
  ['Weight / height', 'Berat / tinggi'],
  ['BMR (Basal Rate)', 'BMR (laju basal)'],
  ['AKG Target (TDEE)', 'Target AKG (TDEE)'],
  ['Edit profile', 'Ubah profil'],
  ['Meal', 'Waktu makan'],
  ['AI estimate; reviewed before saving.', 'Perkiraan AI; diperiksa sebelum disimpan.'],
  ['AI estimate · {p}% confidence; reviewed before saving.', 'Perkiraan AI · keyakinan {p}%; diperiksa sebelum disimpan.'],
  ['Delete Food Entry', 'Hapus catatan makanan'],
  ['Remove this food entry permanently?', 'Hapus catatan makanan ini secara permanen?'],
  ['Food entry could not be deleted', 'Catatan makanan gagal dihapus'],
  ['Food entry deleted', 'Catatan makanan dihapus'],
  ['Enter a meal name and valid non-negative nutrition values', 'Isi nama makanan dan nilai nutrisi yang valid (tidak negatif)'],
  ['Food entry could not be saved', 'Catatan makanan gagal disimpan'],
  ['Food entry logged', 'Makanan dicatat'],
  ['Food entry updated', 'Catatan makanan diperbarui'],
  ['Edit', 'Ubah'],
  ['Edit meal', 'Ubah makanan'],
  ['Sugar {n}g', 'Gula {n}g'],
  ['Menu not found', 'Menu tidak ditemukan'],
  ['Menu loaded. Check it and tap Save', 'Menu dimuat. Periksa lalu tekan Simpan'],
  ['Photo could not be analyzed', 'Foto gagal dianalisis'],
  ['Review the estimate before saving', 'Periksa perkiraan sebelum menyimpan'],
  ['Photograph a meal or enter values. Review AI estimates before saving.', 'Foto makananmu atau isi nilainya. Periksa perkiraan AI sebelum menyimpan.'],
  ['Close food form', 'Tutup form makanan'],
  ['Analyze photo', 'Analisis foto'],
  ['Analyzing…', 'Menganalisis…'],
  ['Food or meal name', 'Nama makanan'],
  ['e.g. Chicken rice bowl', 'mis. Nasi ayam'],
  ['Breakfast', 'Sarapan'],
  ['Lunch', 'Makan siang'],
  ['Dinner', 'Makan malam'],
  ['Snack', 'Camilan'],
  ['breakfast', 'sarapan'],
  ['lunch', 'makan siang'],
  ['dinner', 'makan malam'],
  ['snack', 'camilan'],
  ['meal', 'makanan'],
  ['Calories', 'Kalori'],
  ['Carbs (g)', 'Karbohidrat (g)'],
  ['Fat (g)', 'Lemak (g)'],
  ['Sugar (g)', 'Gula (g)'],
  ['Sodium (mg)', 'Natrium (mg)'],

  // Catering
  ['Catering with tokens', 'Catering pakai token'],
  ['Swap tokens for weekly menu packages', 'Tukar token dengan paket menu mingguan'],
  ['You need tokens to subscribe to catering. Tokens are a balance you exchange for a 7-day menu package, delivered every day to match your calorie target.', 'Kamu butuh token untuk berlangganan catering. Token adalah saldo yang ditukar dengan paket menu 7 hari, diantar setiap hari sesuai target kalorimu.'],
  ['What are tokens for?', 'Untuk apa token?'],
  ['Why tokens?', 'Kenapa pakai token?'],
  ["You don't pick a portion size. Calora picks S, M or L for each meal, every day, based on what you need.", 'Kamu tidak memilih ukuran porsi. Setiap hari Calora memilih S, M, atau L untuk tiap makan sesuai kebutuhanmu.'],
  ['Per meal. Every day is lunch + dinner.', 'Per porsi. Setiap hari ada makan siang + makan malam.'],
  ['Example: bulking', 'Contoh: bulking'],
  ['Normal day', 'Hari biasa'],
  ['Already ate out', 'Sudah jajan di luar'],
  ['2 tokens stay in your balance for another day', '2 token tetap tersimpan untuk hari lain'],
  ['Tokens only pay for what is delivered, so a smaller portion never costs you anything.', 'Token hanya terpakai sesuai porsi yang dikirim, jadi porsi lebih kecil tidak membuatmu rugi.'],
  ['Deposit up front, for example 40 tokens a week. Leftovers (say 10 tokens) roll over to the next week.', 'Deposit di awal, misalnya 40 token per minggu. Sisanya (misal 10 token) dipakai lagi minggu berikutnya.'],
  ['Lunch & dinner', 'Makan siang & malam'],
  ['{size} · {n} tokens', '{size} · {n} token'],
  ['Tomorrow: {n} tokens', 'Total besok: {n} token'],
  ['Tokens are valid for one year.', 'Token berlaku selama 1 tahun.'],
  ['Package {n} · Healthy Weight Loss', 'Paket {n} · Turun Berat Badan Sehat'],
  ['Package {n} · High Protein Muscle Building', 'Paket {n} · Tinggi Protein Bentuk Otot'],
  ['Package {n}', 'Paket {n}'],
  ['Healthy Weight Loss', 'Turun Berat Badan Sehat'],
  ['High Protein Muscle Building', 'Tinggi Protein Bentuk Otot'],
  ['{n} Tokens / 7 days', '{n} Token / 7 hari'],
  ['Token price', 'Harga token'],
  ['From Rp {n}', 'Mulai Rp {n}'],
  ['Payment', 'Pembayaran'],
  ['Sign in to buy tokens and redeem them for a package.', 'Masuk untuk membeli token dan menukarkannya dengan paket.'],
  ['Loading menus…', 'Memuat menu…'],
  ['No active menus yet.', 'Belum ada menu aktif.'],
  ['My token balance', 'Sisa token saya'],
  ['7-day packages from 40 Tokens', 'Paket 7 hari mulai 40 Token'],
  ['+ Top up tokens', '+ Top Up Token'],
  ['Active subscription', 'Langganan aktif'],
  ['Subscription ended', 'Langganan berakhir'],
  ['Ends on', 'Berakhir pada'],
  ['{n} days left', 'Sisa {n} hari'],
  ['Redeem {n} Tokens', 'Tukarkan {n} Token'],
  ['7-day package catalog', 'Katalog paket 7 hari'],
  ['Available menus', 'Menu yang tersedia'],
  ['Top up tokens', 'Top up token'],
  ['Tokens are redeemed for weekly menu packages. Bigger packs cost less per token.', 'Token dipakai untuk menukar paket menu mingguan. Paket lebih besar lebih hemat per token.'],
  ['BEST VALUE', 'PALING HEMAT'],
  ['Save 4%', 'Hemat 4%'],
  ['Best value! 8% off', 'Paling Hemat! Diskon 8%'],
  ['Save Rp {x}', 'Hemat Rp {x}'],
  ['Balance after top up: {n} Tokens. Payment method: QRIS.', 'Saldo setelah top up: {n} Token. Metode bayar: QRIS.'],
  ['Pay Rp {x}', 'Bayar Rp {x}'],
  ['Redeem tokens', 'Tukarkan token'],
  ['Currently active until {d}.', 'Masa aktif saat ini sampai {d}.'],
  ['PACKAGE', 'PAKET'],
  ['DURATION', 'DURASI'],
  ['{n} kcal average per meal', '{n} kcal rata-rata per meal'],
  ['{n} Tokens/wk', '{n} Token/mgg'],
  ['1 week', '1 minggu'],
  ['{n} weeks', '{n} minggu'],
  ['Current token balance', 'Sisa Token Saat Ini'],
  ['Tokens needed', 'Token yang Dibutuhkan'],
  ['Balance after transaction', 'Sisa Setelah Transaksi'],
  ['{n} Tokens short', 'Kurang {n} Token'],
  ['Delivered to · Home', 'Dikirim ke · Rumah'],
  ['The new subscription ends on {d}. Change the address under Other. Not enough tokens; you will be taken to Top Up.', 'Langganan baru berakhir pada {d}. Alamat diubah di Other. Token belum cukup, Anda akan diarahkan ke Top Up.'],
  ['The new subscription ends on {d}. Change the address under Other. You have enough tokens for this.', 'Langganan baru berakhir pada {d}. Alamat diubah di Other. Token cukup untuk penukaran ini.'],

  // Profile
  ['Body stats and goals live here. The fields below are examples.', 'Data tubuh dan target ada di sini. Isian di bawah hanya contoh.'],
  ['Weight', 'Berat'],
  ['Height', 'Tinggi'],
  ['Goal', 'Tujuan'],
  ['Maintain', 'Pertahankan'],
  ['Sample weight', 'Contoh berat'],
  ['Sample height', 'Contoh tinggi'],
  ['Sample goal', 'Contoh tujuan'],
  ['Account', 'Akun'],
  ['Food log', 'Catatan Makanan'],
  ['Body and target', 'Tubuh dan target'],
  ['Height (cm)', 'Tinggi (cm)'],
  ['Age (years)', 'Usia (tahun)'],
  ['Biological sex', 'Jenis kelamin'],
  ['Male', 'Laki-laki'],
  ['Female', 'Perempuan'],
  ['Activity level', 'Tingkat aktivitas'],
  ['Sedentary', 'Jarang bergerak'],
  ['Light', 'Ringan'],
  ['Moderate', 'Sedang'],
  ['Active', 'Aktif'],
  ['Lose weight', 'Turunkan berat'],
  ['Gain weight', 'Naikkan berat'],
  ['Target weight (kg)', 'Berat target (kg)'],
  ['Weekly rate (kg)', 'Laju per minggu (kg)'],
  ['Diet preference', 'Preferensi diet'],
  ['No preference', 'Tanpa preferensi'],
  ['Pescatarian', 'Pesketarian'],
  ['Allergies', 'Alergi'],
  ['Disliked foods', 'Makanan yang tidak disukai'],
  ['e.g. dairy, soy', 'mis. susu, kedelai'],
  ['e.g. tuna, mushrooms', 'mis. tuna, jamur'],
  ['BMR (Basal Metabolic Rate):', 'BMR (laju metabolisme basal):'],
  ['Daily calorie target:', 'Target kalori harian:'],
  ['Carbs:', 'Karbohidrat:'],
  ['Fat:', 'Lemak:'],
  ['Profile could not be saved', 'Profil gagal disimpan'],
  ['Nutrition profile updated', 'Profil nutrisi diperbarui'],

  // Sign-in
  ['Email or username', 'Email atau username'],
  ['Show password', 'Tampilkan password'],
  ['Hide password', 'Sembunyikan password'],
  ['Forgot password?', 'Lupa Password?'],
  ['Reset password', 'Atur ulang password'],
  ['{feature} is not available yet', '{feature} belum tersedia'],
  ['Could not sign in', 'Tidak bisa masuk'],
  ['Server is not running', 'Server tidak berjalan'],
  ['Wrong username or password', 'Username atau password salah'],
  ['Continue as guest', 'Lanjut sebagai tamu'],
  ['Login with Google coming soon', 'Masuk dengan Google segera hadir'],

  // Server messages
  ['Authentication required', 'Silakan masuk terlebih dahulu'],
  ['Invalid credentials', 'Username atau password tidak valid'],
  ['Duplicate entry', 'Data sudah ada'],
  ['Meal name is required', 'Nama makanan wajib diisi'],
  ['Food entry not found', 'Catatan makanan tidak ditemukan'],
  ['Activity not found', 'Aktivitas tidak ditemukan'],
  ['Weight entry not found', 'Catatan berat tidak ditemukan'],
  ['Provide an image or a food description', 'Kirim foto atau deskripsi makanan'],
  ['Invalid {field}', '{field} tidak valid'],
  ['Too many requests', 'Terlalu banyak permintaan'],
  ['The vision model did not return a valid meal analysis.', 'Vision model tidak mengembalikan analisis makanan yang valid.'],
  ['VISION_BASE_URL and VISION_API_KEY are not configured.', 'VISION_BASE_URL dan VISION_API_KEY belum dikonfigurasi.'],
  ['Claude took too long to read the photo', 'Claude terlalu lama membaca foto'],
  ['Photo reader is busy; try again shortly', 'Pembaca foto sedang sibuk; coba lagi sebentar'],

  // Chart labels
  ['Protein (g)', 'Protein (g)'],
  ['Calories (kcal)', 'Kalori (kcal)'],

  // Catch-all token amounts go last so the specific token sentences above match first.
  ['{n} Tokens', '{n} Token'],
  ['{n} tokens', '{n} token']
];

const from = lang === 'id' ? 0 : 1;
const to = 1 - from;
const exact = new Map();
const templates = [];

for (const pair of PAIRS) {
  const source = pair[from];
  const target = pair[to];
  if (source === target) continue;
  if (!source.includes('{')) {
    exact.set(source, target);
    continue;
  }
  const names = [];
  const pattern = source.split(/(\{\w+\})/).map(part => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    if (name) { names.push(name); return '(.+?)'; }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  templates.push({ regex: new RegExp(`^${pattern}$`), names, target });
}

function lookup(text) {
  const hit = exact.get(text);
  if (hit !== undefined) return hit;
  for (const { regex, names, target } of templates) {
    const match = regex.exec(text);
    if (match) return target.replace(/\{(\w+)\}/g, (_, name) => match[names.indexOf(name) + 1] ?? '');
  }
  return null;
}

/** Translates one string into the chosen language; unknown text comes back unchanged. */
export function t(text) {
  const value = String(text ?? '');
  const trimmed = value.trim();
  if (!trimmed) return value;
  const out = lookup(trimmed);
  if (out === null) return value;
  const start = value.indexOf(trimmed);
  return value.slice(0, start) + out + value.slice(start + trimmed.length);
}

const ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE']);

function skipped(element) {
  return !element || SKIP.has(element.tagName) || element.closest('[translate="no"]');
}

function translateText(node) {
  if (skipped(node.parentElement)) return;
  const next = t(node.nodeValue);
  if (next !== node.nodeValue) node.nodeValue = next;
}

function translateAttributes(element) {
  if (skipped(element)) return;
  for (const name of ATTRIBUTES) {
    const value = element.getAttribute(name);
    if (value) {
      const next = t(value);
      if (next !== value) element.setAttribute(name, next);
    }
  }
  if (element.tagName === 'INPUT' && element.readOnly && element.value) element.value = t(element.value);
}

function translateTree(root) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  translateAttributes(root);
  root.querySelectorAll('*').forEach(translateAttributes);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) translateText(node);
}

export function setLang(next) {
  try { localStorage.setItem(KEY, next === 'en' ? 'en' : 'id'); } catch {}
  location.reload();
}

function syncControls() {
  document.querySelectorAll('[data-lang-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.langChoice === lang));
  });
  document.querySelectorAll('[data-lang-toggle]').forEach(button => {
    // Shows the current language; clicking switches to the other one.
    button.textContent = lang.toUpperCase();
    button.setAttribute('aria-label', lang === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia');
  });
}

document.documentElement.lang = lang;
document.title = t(document.title);
translateTree(document.body);
syncControls();
document.documentElement.classList.remove('i18n-pending');

new MutationObserver(records => {
  for (const record of records) {
    if (record.type === 'characterData') translateText(record.target);
    else if (record.type === 'attributes') translateAttributes(record.target);
    else record.addedNodes.forEach(translateTree);
  }
}).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });

document.addEventListener('click', event => {
  const choice = event.target.closest('[data-lang-choice]');
  if (choice && choice.dataset.langChoice !== lang) setLang(choice.dataset.langChoice);
  if (event.target.closest('[data-lang-toggle]')) setLang(lang === 'id' ? 'en' : 'id');
});
