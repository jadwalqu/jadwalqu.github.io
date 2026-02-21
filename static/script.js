// Konfigurasi pesan utama (pengganti pesan_utama di Python)
const PESAN_UTAMA = "Mari senantiasa menjaga sholat dan meningkatkan kualitas ibadah.";

async function initApp() {
    try {
        // Tambahkan 'static/' di depan nama file
        const responseImsak = await fetch('static/jadwal_imsakiyah.json');
        const jadwalImsakiyah = await responseImsak.json();
        
        const responsePesan = await fetch('static/jadwal_pesan.json');
        const jadwalPesan = await responsePesan.json();

        // Jalankan fungsi update secara rutin
        setInterval(() => {
            updateClock();
            updatePemberitahuan(jadwalImsakiyah);
            updateRunningText(jadwalPesan, jadwalImsakiyah);
        }, 1000);

        // Render tabel sekali saja untuk 7 hari ke depan
        renderTable(jadwalImsakiyah);

    } catch (error) {
        console.error("Gagal memuat data:", error);
    }
}

function updateClock() {
    const now = new Date();
    document.getElementById("hours").textContent = String(now.getHours()).padStart(2, '0');
    document.getElementById("minutes").textContent = String(now.getMinutes()).padStart(2, '0');
    document.getElementById("seconds").textContent = String(now.getSeconds()).padStart(2, '0');
}

function renderTable(data) {
    const tbody = document.getElementById("jadwal-body");
    const today = new Date();
    
    // Ambil data untuk 7 hari ke depan
    for (let i = 0; i < 7; i++) {
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + i);
        const formattedDate = formatDate(targetDate);

        const jadwalHariIni = data.find(j => j.tanggal === formattedDate);
        if (jadwalHariIni) {
            const row = `<tr>
                <td>${jadwalHariIni.tanggal}</td>
                <td>${jadwalHariIni.hari}</td>
                <td>${jadwalHariIni.imsak}</td>
                <td>${jadwalHariIni.subuh}</td>
                <td>${jadwalHariIni.dzuhur}</td>
                <td>${jadwalHariIni.ashar}</td>
                <td>${jadwalHariIni.maghrib}</td>
                <td>${jadwalHariIni.isya}</td>
            </tr>`;
            tbody.innerHTML += row;
        }
    }
}

function updatePemberitahuan(jadwalImsakiyah) {
    const now = new Date();
    const todayStr = formatDate(now);
    const jadwalHariIni = jadwalImsakiyah.find(j => j.tanggal === todayStr);

    if (!jadwalHariIni) {
        document.getElementById("pemberitahuan-text").textContent = "Jadwal tidak tersedia.";
        return;
    }

    // Cari waktu terdekat
    const listWaktu = ["imsak", "subuh", "dzuhur", "ashar", "maghrib", "isya"];
    let terdekat = null;
    let minSelisih = Infinity;

    listWaktu.forEach(nama => {
        const [jam, menit] = jadwalHariIni[nama].split(':');
        const waktuSholat = new Date();
        waktuSholat.setHours(jam, menit, 0);

        const selisih = (waktuSholat - now) / 1000;
        
        // Logika: Cari yang selisihnya paling kecil (bisa positif atau negatif sedikit)
        if (Math.abs(selisih) < Math.abs(minSelisih)) {
            minSelisih = selisih;
            terdekat = { nama, selisih };
        }
    });

    let pesan = "";
    if (terdekat.selisih > 0) {
        pesan = `${formatDurasi(terdekat.selisih)} lagi memasuki waktu ${terdekat.nama}.`;
    } else if (terdekat.selisih > -600) {
        pesan = `Telah memasuki waktu ${terdekat.nama}.`;
    } else {
        pesan = `Waktu ${terdekat.nama} sudah lewat.`;
    }
    document.getElementById("pemberitahuan-text").textContent = pesan;
}

function updateRunningText(jadwalPesan, jadwalImsakiyah) {
    const now = new Date();
    const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let pesanAktif = [];

    // 1. Cek dari jadwal_pesan.json
    jadwalPesan.forEach(p => {
        const start = timeToSeconds(p.mulai);
        const end = timeToSeconds(p.selesai);
        // Catatan: Di GitHub Pages (statis), pengecekan tahun pada JSON harus disesuaikan 
        // jika ingin ketat. Di sini kita asumsikan dalam rentang waktu yang benar.
        if (currentTime >= start && currentTime <= end) {
            pesanAktif.push(p.pesan);
        }
    });

    // 2. Cek waktu sholat (Pesan Selamat Menunaikan...)
    const todayStr = formatDate(now);
    const jadwalHariIni = jadwalImsakiyah.find(j => j.tanggal === todayStr);
    if (jadwalHariIni) {
        ["subuh", "dzuhur", "ashar", "maghrib", "isya"].forEach(w => {
            if (timeToSeconds(jadwalHariIni[w]) === (now.getHours() * 3600 + now.getMinutes() * 60)) {
                pesanAktif.push(`Selamat menunaikan ibadah sholat ${w.toUpperCase()}`);
            }
        });
    }

    const element = document.getElementById("running-text");
    const finalPesan = pesanAktif.length > 0 ? pesanAktif[Math.floor(Date.now() / 1000) % pesanAktif.length] : PESAN_UTAMA;
    
    if (element.textContent !== finalPesan) {
        element.textContent = finalPesan;
    }
}

// Helper Functions
function formatDate(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
}

function timeToSeconds(timeStr) {
    const [h, m] = timeStr.split(':');
    return parseInt(h) * 3600 + parseInt(m) * 60;
}

function formatDurasi(detik) {
    const h = Math.floor(Math.abs(detik) / 3600);
    const m = Math.floor((Math.abs(detik) % 3600) / 60);
    return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
}

initApp()
