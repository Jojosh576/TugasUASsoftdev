function loadKamarData() {
    fetch('http://localhost:3000/api/kamar')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#kamarTable tbody');
            tbody.innerHTML = '';
            data.forEach((kamar, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${kamar.nomor_kamar}</td>
                    <td>Rp ${kamar.tarif_per_bulan.toLocaleString()}</td>
                    <td>${kamar.fasilitas}</td>
                    <td>${kamar.status_kamar}</td>
                    <td>${kamar.keterangan || '-'}</td>
                    <td>${kamar.penghuni || '-'}</td>
                    <td>${kamar.foto_kamar ? `<img src="http://localhost:3000/uploads/${kamar.foto_kamar}" alt="Foto Kamar" style="max-width: 100px;">` : '-'}</td>
                    <td>
                        <button onclick="editKamar(${kamar.id})" class="btn btn-warning btn-sm">Edit</button>
                        <button onclick="deleteKamar(${kamar.id})" class="btn btn-danger btn-sm">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Gagal memuat data kamar');
        });
}

function editKamar(id) {
    fetch(`http://localhost:3000/api/kamar/${id}`)
        .then(response => response.json())
        .then(kamar => {
            document.getElementById('kamarId').value = kamar.id;
            document.getElementById('nomorKamar').value = kamar.nomor_kamar;
            document.getElementById('tarifPerBulan').value = kamar.tarif_per_bulan;
            document.getElementById('fasilitas').value = kamar.fasilitas;
            document.getElementById('statusKamar').value = kamar.status_kamar;
            document.getElementById('keterangan').value = kamar.keterangan || '';
            document.getElementById('penghuni').value = kamar.penghuni || '';
            
            // Tampilkan foto yang ada jika ada
            const fotoPreview = document.getElementById('fotoPreview');
            if (kamar.foto_kamar) {
                fotoPreview.innerHTML = `<img src="${kamar.foto_kamar}" alt="Preview" style="max-width: 200px;">`;
            } else {
                fotoPreview.innerHTML = '';
            }
            
            $('#kamarModal').modal('show');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Gagal memuat data kamar');
        });
}

function saveKamar() {
    const id = document.getElementById('kamarId').value;
    const formData = new FormData();
    
    formData.append('nomor_kamar', document.getElementById('nomorKamar').value);
    formData.append('tarif_per_bulan', document.getElementById('tarifPerBulan').value);
    formData.append('fasilitas', document.getElementById('fasilitas').value);
    formData.append('status_kamar', document.getElementById('statusKamar').value);
    formData.append('keterangan', document.getElementById('keterangan').value);
    formData.append('penghuni', document.getElementById('penghuni').value);
    
    const fotoInput = document.getElementById('fotoKamar');
    if (fotoInput.files.length > 0) {
        formData.append('foto_kamar', fotoInput.files[0]);
    }
    
    const url = id ? `http://localhost:3000/api/kamar/${id}` : 'http://localhost:3000/api/kamar';
    const method = id ? 'PUT' : 'POST';
    
    fetch(url, {
        method: method,
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        $('#kamarModal').modal('hide');
        loadKamarData();
        alert(id ? 'Kamar berhasil diperbarui' : 'Kamar berhasil ditambahkan');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Gagal menyimpan data kamar');
    });
} 