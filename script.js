let db_alat = JSON.parse(localStorage.getItem('cmms_db')) || [];
const MASTER_SOP = { "Suction Pump": 5.0, "Infusion Pump": 5.0, "Syringe Pump": 2.0 };
let html5QrCode; 
let tabInventarisAktif = 'berfungsi';

window.onload = function() {
    cekPeringatanPM();
    document.getElementById('m_tanggal').value = new Date().toISOString().split('T')[0];
};

// ================= FITUR KAMERA QR CODE =================
function bukaKamera() {
    document.getElementById('scannerBtnWrap').style.display = 'none';
    document.getElementById('cameraArea').style.display = 'flex';
    html5QrCode = new Html5Qrcode("reader");

    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            let cameraId = devices[devices.length - 1].id;
            html5QrCode.start( cameraId, { fps: 10, qrbox: { width: 220, height: 220 } },
                (decodedText) => { tutupKamera(); bukaModal('searchModal'); document.getElementById('searchInput').value = decodedText; cariAlat(); },
                (err) => {} 
            ).catch((err) => { tutupKamera(); alert("⚠️ Gagal menyalakan lensa. Error: " + err); });
        } else { tutupKamera(); alert("⚠️ Tidak ada kamera terdeteksi di perangkat ini."); }
    }).catch(err => { tutupKamera(); alert("⚠️ Izin kamera ditolak. Pastikan Anda menekan 'Allow/Izinkan'."); });
}
function tutupKamera() {
    if (html5QrCode) { html5QrCode.stop().then(() => html5QrCode.clear()).catch(e => console.log(e)); }
    document.getElementById('cameraArea').style.display = 'none'; document.getElementById('scannerBtnWrap').style.display = 'flex';
}

// ================= NAVIGASI =================
function bukaHalaman(idHalaman) {
    document.getElementById('dashboardView').style.display = 'none';
    document.querySelectorAll('.page-content').forEach(page => { page.style.display = 'none'; });
    document.getElementById(idHalaman).style.display = 'block';

    if (idHalaman === 'page-kalibrasi') { muatDropdownKalibrasi(); resetTabelKalibrasi(); }
    if (idHalaman === 'page-perbaikan') { muatDropdownPerbaikan(); } 
    if (idHalaman === 'page-inventaris') { renderTabelInventaris(); } 
}
function kembaliKeHome() {
    document.querySelectorAll('.page-content').forEach(page => { page.style.display = 'none'; });
    document.getElementById('dashboardView').style.display = 'block';
    cekPeringatanPM();
}
function bukaModal(idModal) { document.getElementById(idModal).style.display = "flex"; if(idModal === 'searchModal') { document.getElementById('searchInput').value = ""; document.getElementById('searchResults').innerHTML = ""; } }
function tutupModal(idModal) { document.getElementById(idModal).style.display = "none"; }

// ================= PERINGATAN PM (SCROLLABLE) =================
function cekPeringatanPM() {
    const wadahPeringatan = document.getElementById('peringatanPM');
    let daftarAlatWarning = [];
    const hariIni = new Date();

    db_alat.forEach(alat => {
        if(!alat.tanggal || alat.jadwal_pm.includes("Visual")) return; 
        const tglPM = new Date(alat.tanggal); let bulanInterval = alat.jadwal_pm.includes("6 Bulan") ? 6 : 12;
        const jatuhTempo = new Date(tglPM.setMonth(tglPM.getMonth() + bulanInterval));
        const sisaHari = Math.ceil((jatuhTempo - hariIni) / (1000 * 60 * 60 * 24));

        // Jika mendekati atau terlewat, masukkan ke daftar peringatan
        if (sisaHari <= 30 && sisaHari >= 0) { daftarAlatWarning.push(`<b>${alat.id}</b> (Sisa ${sisaHari} hari)`); } 
        else if (sisaHari < 0) { daftarAlatWarning.push(`<b>${alat.id}</b> (<span style="color:var(--med-red)">Lewat ${Math.abs(sisaHari)} hr</span>)`); }
    });

    if(daftarAlatWarning.length > 0) { 
        // Mengubah daftar string menjadi list item (dibungkus div bergaris bawah)
        let listHTML = daftarAlatWarning.map(item => `<div style="padding: 4px 0; border-bottom: 1px solid #CBD5E1;">${item}</div>`).join('');
        
        // Membungkus listHTML ke dalam div scrollable (max-height: 80px hanya muat ±3 baris, sisanya digulir)
        wadahPeringatan.innerHTML = `
            <div class="warning-box" style="align-items: center;">
                <div style="font-size: 24px; padding-right: 5px;">💡</div>
                <div style="flex: 1; overflow: hidden;">
                    <b>Jadwal PM Mendekati / Lewat Waktu:</b>
                    <div style="max-height: 80px; overflow-y: auto; padding-right: 5px; margin-top: 5px; font-size: 11px;">
                        ${listHTML}
                    </div>
                </div>
            </div>
        `; 
    } else { wadahPeringatan.innerHTML = ""; }
}

// ================= FITUR SEARCH & JUMP TO INVENTARIS =================
function cariAlat() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const resultDiv = document.getElementById('searchResults');
    resultDiv.innerHTML = "";
    
    if(keyword.length < 1) return;
    const hasil = db_alat.filter(a => a.id.toLowerCase().includes(keyword) || a.kategori.toLowerCase().includes(keyword));
    
    if(hasil.length === 0) { resultDiv.innerHTML = "<p style='font-size:12px; color:gray; text-align:center;'>Alat tidak ditemukan.</p>"; return; }
    
    hasil.forEach(alat => { 
        // Membuat kotak pencarian secara dinamis dan menempelkan fungsi loncatKeInventaris saat diklik
        const divBox = document.createElement('div');
        divBox.className = 'search-result-item';
        divBox.innerHTML = `<b>${alat.id}</b> - ${alat.kategori}<br><span style="font-size:11px; color:gray;">Status: ${alat.status}</span>`;
        divBox.onclick = () => loncatKeInventaris(alat.id);
        resultDiv.appendChild(divBox);
    });
}

function loncatKeInventaris(idAlat) {
    tutupModal('searchModal'); // Tutup pop-up pencarian
    
    const alat = db_alat.find(a => a.id === idAlat);
    if(!alat) return;
    
    // Tentukan apakah alat ini ada di tab "Berfungsi" atau "Perbaikan"
    const butuhPerbaikan = alat.status.includes("TIDAK LAIK") || alat.status.includes("PERBAIKAN") || alat.status.includes("RUSAK");
    tabInventarisAktif = butuhPerbaikan ? 'perbaikan' : 'berfungsi';
    
    // Pindah ke Halaman Inventaris (fungsi ini akan me-render tabel ulang sesuai tab)
    bukaHalaman('page-inventaris');
    
    // Beri jeda sangat singkat agar browser merender tabel HTML-nya terlebih dahulu
    setTimeout(() => {
        // Cari ID Baris di tabel (menghindari error spasi dengan regex pembersih)
        const rowId = `row-${idAlat.replace(/\s+/g, '-')}`;
        const targetRow = document.getElementById(rowId);
        
        if(targetRow) {
            // Gulir layar (scroll) tepat ke baris tersebut
            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Nyalakan efek warna kuning stabilo berkedip
            targetRow.classList.add('row-highlight');
            // Matikan efek highlight setelah 3 detik
            setTimeout(() => { targetRow.classList.remove('row-highlight'); }, 3000);
        }
    }, 300);
}

function exportDatabase() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db_alat, null, 2));
    const dlAnchorElem = document.createElement('a'); dlAnchorElem.setAttribute("href", dataStr); dlAnchorElem.setAttribute("download", "Backup_CMMS.json"); dlAnchorElem.click();
}

// ================= MAINTENANCE (REGISTRASI) =================
function simpanAlat() {
    const id = document.getElementById('m_id').value; const kat = document.getElementById('m_kategori').value;
    const f = parseInt(document.getElementById('m_f').value); const r = parseInt(document.getElementById('m_r').value);
    const m = parseInt(document.getElementById('m_m').value); const h = parseInt(document.getElementById('m_h').value);
    const tgl = document.getElementById('m_tanggal').value; const alertBox = document.getElementById('m_alert');
    if(id === "" || tgl === "") { tampilAlert(alertBox, "ID Alat dan Tanggal wajib diisi!", "var(--med-red)"); return; }
    const em_score = f + r + m + h; let jadwal_pm = "🟢 Visual";
    if (em_score >= 12) jadwal_pm = "🔴 6 Bulan (Ekstensif)"; else if (em_score >= 9) jadwal_pm = "🟡 12 Bulan (Menengah)";

    const indeksAda = db_alat.findIndex(alat => alat.id === id);
    if(indeksAda >= 0) {
        db_alat[indeksAda] = { ...db_alat[indeksAda], kategori: kat, f: f, r: r, m: m, h: h, tanggal: tgl, em_score: em_score, jadwal_pm: jadwal_pm };
        tampilAlert(alertBox, `Data Diperbarui! EM Score: ${em_score}`, "var(--med-blue)");
    } else {
        db_alat.push({ id: id, kategori: kat, f: f, r: r, m: m, h: h, tanggal: tgl, em_score: em_score, jadwal_pm: jadwal_pm, status: "Belum Diuji", catatan: "" });
        tampilAlert(alertBox, `Alat Baru Disimpan! EM Score: ${em_score}`, "var(--med-green)");
    }
    simpanDatabase();
}

// ================= KALIBRASI =================
function muatDropdownKalibrasi() {
    const selectBox = document.getElementById('k_id_alat'); selectBox.innerHTML = "";
    if(db_alat.length === 0) { selectBox.innerHTML = "<option>Belum ada alat terdaftar</option>"; } 
    else { db_alat.forEach(alat => { const opt = document.createElement('option'); opt.value = alat.id; opt.innerText = `${alat.id} - ${alat.kategori}`; selectBox.appendChild(opt); }); }
}
function resetTabelKalibrasi() { document.getElementById('tbody_uji_kalibrasi').innerHTML = ""; tambahBarisKalibrasi(); }
function tambahBarisKalibrasi() {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="number" class="k-input k-input-titik" placeholder="T" value="0"></td><td><input type="number" class="k-input p-val"></td><td><input type="number" class="k-input p-val"></td><td><input type="number" class="k-input p-val"></td><td><input type="number" class="k-input p-val"></td><td><input type="number" class="k-input p-val"></td><td><input type="number" class="k-input p-val"></td><td><button style="background:var(--med-red); color:white; border:none; padding:4px; border-radius:4px; cursor:pointer;" onclick="this.parentElement.parentElement.remove()">X</button></td>`;
    document.getElementById('tbody_uji_kalibrasi').appendChild(tr);
}
function hitungKalibrasi() {
    const id_alat = document.getElementById('k_id_alat').value; const alertBox = document.getElementById('k_alert');
    if(!id_alat || id_alat === "Belum ada alat terdaftar") { tampilAlert(alertBox, "Pilih alat!", "var(--med-red)"); return; }
    const barisTabel = document.querySelectorAll('#tbody_uji_kalibrasi tr');
    if(barisTabel.length === 0) { tampilAlert(alertBox, "Minimal 1 titik ukur!", "var(--med-red)"); return; }

    const dataAlat = db_alat.find(a => a.id === id_alat); const toleransi_maks = MASTER_SOP[dataAlat.kategori]; let jumlahGagal = 0;
    barisTabel.forEach(tr => {
        const titik = parseFloat(tr.querySelector('.k-input-titik').value) || 0; let sum = 0; 
        tr.querySelectorAll('.p-val').forEach(inp => sum += (parseFloat(inp.value) || 0));
        let errorPersen = 0; if(titik !== 0) { errorPersen = (((sum/6) - titik) / titik) * 100; }
        if(Math.abs(errorPersen) > toleransi_maks) { jumlahGagal++; }
    });

    let statusAkhir = (jumlahGagal === 0) ? "🟢 LAIK PAKAI" : (jumlahGagal < barisTabel.length) ? "🟡 LAIK BERSYARAT" : "🔴 TIDAK LAIK";
    dataAlat.status = statusAkhir; simpanDatabase();
    tampilAlert(alertBox, `Terdapat ${jumlahGagal} gagal. Status: ${statusAkhir}`, (jumlahGagal===0)?"var(--med-green)": (jumlahGagal < barisTabel.length)?"var(--med-blue)":"var(--med-red)");
}

// ================= TINDAK LANJUT & PERBAIKAN =================
function muatDropdownPerbaikan() {
    const selectBox = document.getElementById('p_id_alat'); selectBox.innerHTML = "";
    if(db_alat.length === 0) { selectBox.innerHTML = "<option>Belum ada alat terdaftar</option>"; } 
    else { db_alat.forEach(alat => { const opt = document.createElement('option'); opt.value = alat.id; opt.innerText = `${alat.id} - ${alat.kategori} (${alat.status})`; selectBox.appendChild(opt); }); }
}
function simpanPerbaikan() {
    const id_alat = document.getElementById('p_id_alat').value; const status_baru = document.getElementById('p_status_baru').value; const alertBox = document.getElementById('p_alert');
    if(!id_alat || id_alat === "Belum ada alat terdaftar") { tampilAlert(alertBox, "Pilih alat!", "var(--med-red)"); return; }
    const dataAlat = db_alat.find(a => a.id === id_alat); dataAlat.status = status_baru; dataAlat.catatan = document.getElementById('p_catatan').value;
    simpanDatabase(); tampilAlert(alertBox, `Status diubah: ${status_baru}`, "var(--med-orange)"); muatDropdownPerbaikan(); 
}

// ================= INVENTARIS & GENERATOR QR =================
function gantiTabInventaris(tab) {
    tabInventarisAktif = tab;
    document.getElementById('tab_berfungsi').className = (tab === 'berfungsi') ? 'tab-btn active' : 'tab-btn';
    document.getElementById('tab_perbaikan').className = (tab === 'perbaikan') ? 'tab-btn active' : 'tab-btn';
    renderTabelInventaris(); 
}

function renderTabelInventaris() {
    const tbody = document.getElementById('tbody_inventaris'); tbody.innerHTML = "";
    
    const totalAlat = db_alat.length;
    const totalPerbaikan = db_alat.filter(a => a.status.includes("TIDAK LAIK") || a.status.includes("PERBAIKAN") || a.status.includes("RUSAK")).length;
    const totalBerfungsi = totalAlat - totalPerbaikan;

    document.getElementById('summary_inventaris').innerHTML = `
        <div class="summary-box biru"><h4>Total Alat</h4><span>${totalAlat}</span></div>
        <div class="summary-box hijau"><h4>Berfungsi</h4><span>${totalBerfungsi}</span></div>
        <div class="summary-box merah"><h4>Perbaikan</h4><span>${totalPerbaikan}</span></div>
    `;
    
    const dataTerfilter = db_alat.filter(alat => {
        const butuhPerbaikan = alat.status.includes("TIDAK LAIK") || alat.status.includes("PERBAIKAN") || alat.status.includes("RUSAK");
        if(tabInventarisAktif === 'berfungsi') return !butuhPerbaikan; if(tabInventarisAktif === 'perbaikan') return butuhPerbaikan;
    });

    if(dataTerfilter.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="color:gray; padding:15px;">Tidak ada alat di kategori ini.</td></tr>`; return; }

    dataTerfilter.forEach(alat => {
        let tglTampil = "-";
        if(alat.tanggal) {
            let tglObj = new Date(alat.tanggal); let bln = alat.jadwal_pm.includes("6 Bulan") ? 6 : (alat.jadwal_pm.includes("12 Bulan") ? 12 : 0);
            if(bln > 0) { tglObj.setMonth(tglObj.getMonth() + bln); tglTampil = tglObj.toISOString().split('T')[0]; } else { tglTampil = "Sesuai Kebutuhan"; }
        }
        
        const tr = document.createElement('tr');
        // MEMBERIKAN ID PADA SETIAP BARIS TABEL AGAR BISA DILACAK OLEH SEARCH
        tr.id = `row-${alat.id.replace(/\s+/g, '-')}`;
        
        tr.innerHTML = `
            <td><b>${alat.id}</b></td><td>${alat.kategori}</td>
            <td style="text-align:center"><b>${tglTampil}</b><br><span style="font-size:10px; color:gray">${alat.jadwal_pm}</span></td>
            <td><b>${alat.status}</b></td>
            <td>
                <div style="display:flex; gap:5px; justify-content:center;">
                    <button class="btn-aksi btn-qr" onclick="lihatQR('${alat.id}', '${alat.kategori}')">QR</button>
                    <button class="btn-aksi" style="background:var(--med-red); color:white;" onclick="hapusAlat('${alat.id}')">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function lihatQR(id, kategori) {
    bukaModal('qrModal'); document.getElementById('qrLabel').innerText = id; document.getElementById('qrKategori').innerText = kategori;
    const qrBox = document.getElementById('qrcodeBox'); qrBox.innerHTML = ""; 
    new QRCode(qrBox, { text: id, width: 150, height: 150, colorDark : "#0F172A", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H });
}
function cetakAreaQR() { window.print(); }

// ================= EKSPOR PDF (LAPORAN ANALISIS CERDAS) =================
function cetakPDF() {
    alert("⏳ Sedang memproses dokumen PDF... Mohon tunggu sebentar.");
    try {
        if (!window.jspdf) { alert("❌ GAGAL: Mesin pembuat PDF belum selesai diunduh oleh browser."); return; }
        if (db_alat.length === 0) { alert("⚠️ GAGAL: Database masih kosong!"); return; }

        const { jsPDF } = window.jspdf; const doc = new jsPDF('l', 'pt', 'a4'); 
        doc.setFontSize(16); doc.text("Laporan Inventaris & Status Kelayakan Alat Medis", 40, 40);
        doc.setFontSize(10); doc.text("Dicetak pada: " + new Date().toLocaleString("id-ID"), 40, 60);

        const tableColumn = ["ID Alat", "Kategori", "Status Terkini", "Analisis & Kesimpulan Kelayakan"]; const tableRows = [];

        db_alat.forEach(alat => {
            let kesimpulan = ""; const toleransi = MASTER_SOP[alat.kategori] || "-";
            const statusPDF = (alat.status || "").replace(/🟢|🟡|🔴|🔧/g, '').trim();
            const jadwalPDF = (alat.jadwal_pm || "").replace(/🟢|🟡|🔴|🔧/g, '').trim();

            if (alat.status.includes("LAIK PAKAI")) { kesimpulan = `Alat berfungsi sangat baik. Lolos uji kalibrasi dengan error dalam batas aman SOP Pabrik (± ${toleransi}). EM Score: ${alat.em_score}. Sepenuhnya aman dioperasikan.`; } 
            else if (alat.status.includes("LAIK BERSYARAT")) { kesimpulan = `Berfungsi namun perlu pengawasan. Ada titik uji melenceng dari toleransi standar (± ${toleransi}), tetapi belum fatal. Disarankan kalibrasi ulang dalam waktu dekat.`; } 
            else if (alat.status.includes("TIDAK LAIK") || alat.status.includes("RUSAK")) { kesimpulan = `STATUS BERBAHAYA. Gagal memenuhi standar kalibrasi (melampaui toleransi ± ${toleransi}) atau ada kerusakan fisik. Tarik alat dari layanan klinis segera.`; } 
            else if (alat.status.includes("PERBAIKAN")) { kesimpulan = `Sedang dalam masa servis teknisi. Catatan: "${alat.catatan || 'Tidak ada catatan khusus'}". Alat tidak boleh digunakan sampai selesai diservis dan dikalibrasi ulang.`; } 
            else { kesimpulan = `Data registrasi awal. Belum ada rekam uji kalibrasi. Membutuhkan jadwal inspeksi (Jadwal PM: ${jadwalPDF}).`; }
            tableRows.push([alat.id, alat.kategori, statusPDF, kesimpulan]);
        });

        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 80, styles: { fontSize: 9, cellPadding: 6 }, columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 100 }, 2: { cellWidth: 110 }, 3: { cellWidth: 'auto' } }, headStyles: { fillColor: [56, 189, 248], textColor: 15 } });
        doc.save("Laporan_Analisis_CMMS.pdf");
    } catch (error) { alert("❌ Terjadi kesalahan: " + error.message); }
}

function hapusAlat(id) { if(confirm(`Memutihkan (menghapus) alat ${id}?`)) { db_alat = db_alat.filter(alat => alat.id !== id); simpanDatabase(); renderTabelInventaris(); cekPeringatanPM(); } }
function simpanDatabase() { localStorage.setItem('cmms_db', JSON.stringify(db_alat)); }
function tampilAlert(elemen, pesan, warnaBg) { elemen.innerText = pesan; elemen.style.backgroundColor = warnaBg; elemen.style.color = (warnaBg === "var(--med-red)" || warnaBg === "var(--black)") ? "white" : "black"; elemen.style.display = "block"; setTimeout(() => { elemen.style.display = "none"; }, 4000); }