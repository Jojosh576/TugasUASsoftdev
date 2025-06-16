const API_BASE = 'http://localhost:5000/api';
let editingKamarId = null;
let editingPenghuniId = null;

function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeBtn = document.getElementById('closeBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            sidebar.classList.add('show');
            overlay.classList.add('show');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'register.html') {
        loadAvailableRooms();
    }
    
    if (currentPage === 'admin-dashboard.html' || currentPage === 'penghuni-dashboard.html') {
        setupHamburgerMenu();
    }
    
    if (currentPage === 'admin-dashboard.html') {
        checkAuth('admin');
        loadKamarData();
        setupKamarForm();
        setupPenghuniForm();
    }
    
    if (currentPage === 'penghuni-dashboard.html') {
        checkAuth('penghuni');
        loadPembayaranData();
        loadAjuanPenghuniData();
        setupAjuanForm();
        setupPembayaranForm();
        loadPenghuniProfileForPaymentForm();
        
        const today = new Date().toISOString().split('T')[0];
        const tanggalAjuanInput = document.getElementById('tanggal_ajuan');
        if (tanggalAjuanInput) {
            tanggalAjuanInput.value = today;
        }
    }
});

function checkAuth(requiredRole) {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== requiredRole) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function setupKamarForm() {
    const form = document.getElementById('kamarForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveKamar();
        });
    }
}

function setupPenghuniForm() {
    const form = document.getElementById('penghuniForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updatePenghuni();
        });
    }
}

function setupAjuanForm() {
    const form = document.getElementById('ajuanForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await saveAjuan();
        });
    }
}

function setupPembayaranForm() {
    const form = document.getElementById('pembayaranForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await savePembayaran();
        });
    }
}

function showAddKamarModal() {
    editingKamarId = null;
    document.getElementById('kamarModalTitle').textContent = 'Tambah Data Kamar';
    document.getElementById('kamarForm').reset();
    document.getElementById('kamarId').value = '';
    document.getElementById('kamarModal').style.display = 'flex';
}

function showEditKamarModal(id) {
    editingKamarId = id;
    document.getElementById('kamarModalTitle').textContent = 'Edit Data Kamar';
    loadKamarById(id);
    document.getElementById('kamarModal').style.display = 'flex';
}

function showEditPenghuniModal(id) {
    editingPenghuniId = id;
    loadPenghuniById(id);
    loadAvailableKamarForPenghuni();
    document.getElementById('penghuniModal').style.display = 'flex';
}

function showAddAjuanModal() {
    document.getElementById('ajuanForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggal_ajuan').value = today;
    document.getElementById('ajuanModal').style.display = 'flex';
}

async function loadPenghuniProfileForPaymentForm() {
    const userId = localStorage.getItem('userId');
    try {
        const response = await fetch(`${API_BASE}/penghuni/profile/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        if (!response.ok) {
            throw new Error('Gagal memuat data profil Anda. Pastikan Anda sudah login dengan benar.');
        }
        
        const profile = await response.json();

        // Baris kode baru ditambahkan di sini
        document.getElementById('userName').textContent = profile.nama_lengkap;

        if (!profile.kamar_id || !profile.tarif_per_bulan) {
            document.querySelector('#riwayatSection .form-box').innerHTML = '<p>Anda belum terdaftar di kamar manapun atau tarif belum diatur. Silakan hubungi admin.</p>';
            return;
        }

        // Cek status pembayaran terakhir
        const pembayaranResponse = await fetch(`${API_BASE}/penghuni/pembayaran/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const pembayaranData = await pembayaranResponse.json();
        
        // Format tanggal login terakhir
        const lastLogin = profile.last_login ? new Date(profile.last_login).toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'Belum pernah login';
        
        // Tampilkan informasi kamar dan kode sewa
        const formBox = document.querySelector('#riwayatSection .form-box');
        formBox.innerHTML = `
            <h3>Form Pembayaran Kost</h3>
            <div class="info-box" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p><strong>Nomor Kamar:</strong> ${profile.nomor_kamar}</p>
                ${pembayaranData.length > 0 ? `<p><strong>Kode Sewa Terakhir:</strong> ${pembayaranData[0].kode_sewa}</p>` : ''}
                <p><strong>Login Terakhir:</strong> ${lastLogin}</p>
            </div>
            <form id="pembayaranForm">
                <input type="hidden" id="pembayaran_penghuni_id" value="${profile.id}">
                <input type="hidden" id="pembayaran_kamar_id" value="${profile.kamar_id}">
                <div class="form-group">
                    <label>Tarif per Bulan</label>
                    <input type="text" id="pembayaran_tarif" value="Rp ${parseInt(profile.tarif_per_bulan).toLocaleString()}" readonly>
                </div>
                <div class="form-group">
                    <label>Tanggal Pembayaran</label>
                    <input type="date" id="pembayaran_tanggal" required>
                </div>
                <div class="form-group">
                    <label>Upload Bukti Transfer</label>
                    <input type="file" id="pembayaran_bukti" required accept="image/*">
                </div>
                <button type="submit" class="btn-submit penghuni-btn">Kirim Pembayaran</button>
            </form>
        `;
        
        document.getElementById('pembayaran_tarif').dataset.raw = profile.tarif_per_bulan;
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('pembayaran_tanggal').value = today;

    } catch (error) {
        alert(error.message);
        console.error('Error fetching profile:', error);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

async function loadAvailableRooms() {
    try {
        const response = await fetch(`${API_BASE}/auth/kamar`);
        const rooms = await response.json();
        const select = document.getElementById('kamar_id');
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.nomor_kamar;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

async function loadAvailableKamarForPenghuni() {
    try {
        const response = await fetch(`${API_BASE}/admin/kamar/available`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const rooms = await response.json();
        const select = document.getElementById('penghuni_kamar');
        select.innerHTML = '<option value="">Pilih Kamar</option>';
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.nomor_kamar;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading available rooms:', error);
    }
}

if (document.getElementById('adminLoginForm')) {
    document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        try {
            const response = await fetch(`${API_BASE}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                window.location.href = 'admin-dashboard.html';
            } else {
                alert('Login gagal: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}

if (document.getElementById('penghuniLoginForm')) {
    document.getElementById('penghuniLoginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        try {
            const response = await fetch(`${API_BASE}/auth/penghuni/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('userId', data.userId);
                window.location.href = 'penghuni-dashboard.html';
            } else {
                alert('Login gagal: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}

if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = {
            nama_lengkap: document.getElementById('nama_lengkap').value,
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            nomor_telepon: document.getElementById('nomor_telepon').value,
            password: document.getElementById('password').value,
            kamar_id: document.getElementById('kamar_id').value
        };
        try {
            const response = await fetch(`${API_BASE}/auth/penghuni/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                alert('Registrasi berhasil! Silakan login.');
                window.location.href = 'penghuni-login.html';
            } else {
                alert('Registrasi gagal: ' + data.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById(sectionName + 'Section').classList.add('active');
    event.target.classList.add('active');
    
    const titles = {
        'kamar': 'Data Kamar',
        'penghuni': 'Data Penghuni', 
        'pembayaran': 'Pembayaran',
        'ajuan': 'Ajuan',
        'riwayat': 'Pembayaran'
    };
    
    document.getElementById('pageTitle').textContent = titles[sectionName];
    
    if (sectionName === 'kamar') loadKamarData();
    if (sectionName === 'penghuni') loadPenghuniData();
    if (sectionName === 'pembayaran') loadPembayaranAdminData();
    
    if (sectionName === 'ajuan') {
        if (document.body.classList.contains('admin-theme')) {
            loadAjuanData(); 
        } else {
            loadAjuanPenghuniData(); 
        }
    }
    
    if (sectionName === 'riwayat') loadPembayaranData();
}

// Tambahkan modal untuk preview foto
document.body.insertAdjacentHTML('beforeend', `
    <div id="photoModal" class="photo-modal">
        <span class="close" onclick="closePhotoModal()">&times;</span>
        <img id="modalPhoto" src="" alt="Preview Foto">
    </div>
`);

// Fungsi untuk preview foto saat dipilih
document.getElementById('kamar_foto').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('fotoPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
});

// Fungsi untuk menutup modal foto
function closePhotoModal() {
    document.getElementById('photoModal').style.display = 'none';
}

// Fungsi untuk menampilkan foto dalam modal
function showPhotoModal(photoUrl) {
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalPhoto');
    modal.style.display = 'block';
    modalImg.src = photoUrl;
}

// Update fungsi loadKamarData untuk menampilkan foto
async function loadKamarData() {
    try {
        const response = await fetch(`${API_BASE}/admin/kamar`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await response.json();
        const tbody = document.querySelector('#kamarTable tbody');
        tbody.innerHTML = '';
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            const fotoKamar = item.foto_kamar ? 
                `<img src="${API_BASE}/uploads/${item.foto_kamar}" class="room-photo" onclick="showPhotoModal('${API_BASE}/uploads/${item.foto_kamar}')" alt="Foto Kamar">` : 
                'Tidak ada foto';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.nomor_kamar}</td>
                <td>Rp ${parseInt(item.tarif_per_bulan).toLocaleString()}</td>
                <td>${item.fasilitas}</td>
                <td><span class="status-badge ${item.status_kamar === 'available' ? 'status-available' : 'status-occupied'}">${item.status_kamar}</span></td>
                <td>${item.keterangan || '-'}</td>
                <td>${item.penghuni_nama || '-'}</td>
                <td>${fotoKamar}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="showEditKamarModal(${item.id})">✏️</button>
                    <button class="action-btn delete-btn" onclick="deleteKamar(${item.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading kamar data:', error);
    }
}

async function loadKamarById(id) {
    try {
        const response = await fetch(`${API_BASE}/admin/kamar`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await response.json();
        const kamar = data.find(k => k.id == id);
        if (kamar) {
            document.getElementById('kamarId').value = kamar.id;
            document.getElementById('nomor_kamar').value = kamar.nomor_kamar;
            document.getElementById('tarif_per_bulan').value = kamar.tarif_per_bulan;
            document.getElementById('status_kamar').value = kamar.status_kamar;
            document.getElementById('keterangan').value = kamar.keterangan || '';
            
            document.querySelectorAll('#kamarFacilities input').forEach(checkbox => checkbox.checked = false);
            if (kamar.fasilitas) {
                const facilities = kamar.fasilitas.split(', ');
                facilities.forEach(facility => {
                    const checkbox = document.querySelector(`#kamarFacilities input[value="${facility}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
        }
    } catch (error) {
        console.error('Error loading kamar by id:', error);
    }
}

// Update fungsi saveKamar untuk menangani upload foto
async function saveKamar() {
    const formData = new FormData();
    formData.append('nomor_kamar', document.getElementById('nomor_kamar').value);
    formData.append('tarif_per_bulan', document.getElementById('tarif_per_bulan').value);
    formData.append('fasilitas', document.getElementById('fasilitas').value);
    formData.append('status_kamar', document.getElementById('status_kamar').value);
    formData.append('keterangan', document.getElementById('keterangan').value);
    
    const fotoFile = document.getElementById('kamar_foto').files[0];
    if (fotoFile) {
        formData.append('foto_kamar', fotoFile);
    }

    try {
        const response = await fetch(`${API_BASE}/admin/kamar`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: formData
        });
        
        if (response.ok) {
            alert('Data kamar berhasil disimpan');
            closeModal('kamarModal');
            loadKamarData();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteKamar(id) {
    if (confirm('Yakin ingin menghapus kamar ini?')) {
        try {
            const response = await fetch(`${API_BASE}/admin/kamar/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (response.ok) {
                alert('Kamar berhasil dihapus');
                loadKamarData();
            } else {
                alert('Gagal menghapus kamar');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

async function loadPenghuniData() {
    try {
        const response = await fetch(`${API_BASE}/admin/penghuni`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await response.json();
        console.log('Data penghuni:', data); // Debug log
        
        const tbody = document.querySelector('#penghuniTable tbody');
        tbody.innerHTML = '';
        data.forEach((item, index) => {
            console.log('Item created_at:', item.created_at); // Debug log
            const tanggalMasuk = new Date(item.created_at).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            console.log('Formatted date:', tanggalMasuk); // Debug log
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.nama_lengkap}</td>
                <td>${item.username}</td>
                <td>${item.email}</td>
                <td>${item.nomor_telepon}</td>
                <td>${item.nomor_kamar || '-'}</td>
                <td>${tanggalMasuk}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="showEditPenghuniModal(${item.id})">✏️</button>
                    <button class="action-btn delete-btn" onclick="deletePenghuni(${item.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading penghuni data:', error);
    }
}

async function loadPenghuniById(id) {
    try {
        const response = await fetch(`${API_BASE}/admin/penghuni`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await response.json();
        const penghuni = data.find(p => p.id == id);
        if (penghuni) {
            document.getElementById('penghuniId').value = penghuni.id;
            document.getElementById('penghuni_nama').value = penghuni.nama_lengkap;
            document.getElementById('penghuni_username').value = penghuni.username;
            document.getElementById('penghuni_email').value = penghuni.email;
            document.getElementById('penghuni_telepon').value = penghuni.nomor_telepon;
            document.getElementById('penghuni_kamar').value = penghuni.kamar_id || '';
        }
    } catch (error) {
        console.error('Error loading penghuni by id:', error);
    }
}

async function updatePenghuni() {
    const formData = {
        nama_lengkap: document.getElementById('penghuni_nama').value,
        username: document.getElementById('penghuni_username').value,
        email: document.getElementById('penghuni_email').value,
        nomor_telepon: document.getElementById('penghuni_telepon').value,
        kamar_id: document.getElementById('penghuni_kamar').value || null
    };
    try {
        const response = await fetch(`${API_BASE}/admin/penghuni/${editingPenghuniId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(formData)
        });
        if (response.ok) {
            alert('Data penghuni berhasil diupdate');
            closeModal('penghuniModal');
            loadPenghuniData();
            loadKamarData();
        } else {
            const error = await response.json();
            alert('Gagal mengupdate penghuni: ' + error.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deletePenghuni(id) {
    if (confirm('Yakin ingin menghapus penghuni ini?')) {
        try {
            const response = await fetch(`${API_BASE}/admin/penghuni/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
            });
            if (response.ok) {
                alert('Penghuni berhasil dihapus');
                loadPenghuniData();
                loadKamarData();
            } else {
                alert('Gagal menghapus penghuni');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

async function loadPembayaranAdminData() {
    try {
        const response = await fetch(`${API_BASE}/admin/pembayaran`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await response.json();
        const tbody = document.querySelector('#pembayaranTable tbody');
        tbody.innerHTML = '';
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            
            const buktiLink = item.bukti_transfer ? `<a href="http://localhost:5000/uploads/${item.bukti_transfer}" target="_blank" class="action-btn edit-btn" style="text-decoration: none;">Lihat</a>` : 'Tidak Ada';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.kode_sewa}</td>
                <td>${item.nama_lengkap}</td>
                <td>${item.nomor_kamar}</td>
                <td>Rp ${parseInt(item.tarif).toLocaleString()}</td>
                <td><span class="status-badge ${item.status === 'sudah_bayar' ? 'status-paid' : 'status-pending'}">${item.status.replace('_', ' ')}</span></td>
                <td>${buktiLink}</td>
                <td>${new Date(item.tanggal_pembayaran).toLocaleDateString('id-ID')}</td>
                <td>
                    ${item.status === 'pending' ? `<button class="action-btn edit-btn" onclick="updatePaymentStatus(${item.id}, 'sudah_bayar')">✅ Konfirmasi</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading pembayaran data:', error);
    }
}

async function updatePaymentStatus(id, newStatus) {
    if (!confirm('Yakin ingin mengubah status pembayaran ini?')) return;
    try {
        const response = await fetch(`${API_BASE}/admin/pembayaran/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            alert('Status pembayaran berhasil diupdate');
            loadPembayaranAdminData();
        } else {
            alert('Gagal mengupdate status pembayaran');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadAjuanData() {
    try {
        const response = await fetch(`${API_BASE}/admin/ajuan`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await response.json();
        const tbody = document.querySelector('#ajuanTable tbody');
        tbody.innerHTML = '';
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.nama_lengkap}</td>
                <td>${item.jenis_ajuan}</td>
                <td>${item.deskripsi}</td>
                <td>${item.status}</td>
                <td>${new Date(item.tanggal_ajuan).toLocaleDateString('id-ID')}</td>
                <td>
                    <select onchange="updateAjuanStatus(${item.id}, this.value)" ${item.status !== 'pending' ? 'disabled' : ''}>
                        <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="approved" ${item.status === 'approved' ? 'selected' : ''}>Approved</option>
                        <option value="rejected" ${item.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading ajuan data:', error);
    }
}

async function updateAjuanStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/admin/ajuan/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            alert('Status ajuan berhasil diupdate');
            loadAjuanData();
        } else {
            alert('Gagal mengupdate status ajuan');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadPembayaranData() {
    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`${API_BASE}/penghuni/pembayaran/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await response.json();
        const tbody = document.querySelector('#riwayatTable tbody');
        tbody.innerHTML = '';
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            const statusClass = item.status === 'sudah_bayar' ? 'status-paid' : 'status-pending';
            const buktiLink = item.bukti_transfer ? `<a href="http://localhost:5000/uploads/${item.bukti_transfer}" target="_blank" class="action-btn edit-btn">Lihat</a>` : 'N/A';
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.kode_sewa}</td>
                <td>${item.nomor_kamar}</td>
                <td>Rp ${parseInt(item.tarif).toLocaleString()}</td>
                <td><span class="status-badge ${statusClass}">${item.status.replace('_', ' ')}</span></td>
                <td>${buktiLink}</td>
                <td>${new Date(item.tanggal_pembayaran).toLocaleDateString('id-ID')}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading pembayaran data:', error);
    }
}

async function saveAjuan() {
    const formData = {
        penghuni_id: localStorage.getItem('userId'),
        jenis_ajuan: document.getElementById('jenis_ajuan').value,
        deskripsi: document.getElementById('deskripsi').value,
        tanggal_ajuan: document.getElementById('tanggal_ajuan').value
    };
    try {
        const response = await fetch(`${API_BASE}/penghuni/ajuan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(formData)
        });
        if (response.ok) {
            alert('Ajuan berhasil dikirim');
            closeModal('ajuanModal');
            loadAjuanPenghuniData();
        } else {
            const error = await response.json();
            alert('Gagal mengirim ajuan: ' + error.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function savePembayaran() {
    const fileInput = document.getElementById('pembayaran_bukti');
    if (fileInput.files.length === 0) {
        alert('Mohon upload bukti transfer.');
        return;
    }

    const formData = new FormData();
    formData.append('penghuni_id', document.getElementById('pembayaran_penghuni_id').value);
    formData.append('kamar_id', document.getElementById('pembayaran_kamar_id').value);
    formData.append('tarif', document.getElementById('pembayaran_tarif').dataset.raw);
    formData.append('tanggal_pembayaran', document.getElementById('pembayaran_tanggal').value);
    formData.append('bukti_transfer', fileInput.files[0]);
    try {
        const response = await fetch(`${API_BASE}/penghuni/pembayaran`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            fileInput.value = '';
            loadPembayaranData();
        } else {
            alert('Gagal mengirim pembayaran: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadAjuanPenghuniData() {
    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`${API_BASE}/penghuni/ajuan/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        const data = await response.json();
        const tbody = document.querySelector('#ajuanTable tbody');
        tbody.innerHTML = '';
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.jenis_ajuan}</td>
                <td>${item.deskripsi}</td>
                <td>${item.status}</td>
                <td>${new Date(item.tanggal_ajuan).toLocaleDateString('id-ID')}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading ajuan data:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}