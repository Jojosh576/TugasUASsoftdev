const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');

const router = express.Router();

// Konfigurasi multer untuk upload foto
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
        }
        cb(null, true);
    }
});

router.get('/kamar', (req, res) => {
    const query = `
        SELECT k.*, p.nama_lengkap as penghuni_nama 
        FROM kamar k 
        LEFT JOIN penghuni p ON k.id = p.kamar_id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/kamar', upload.single('foto_kamar'), (req, res) => {
    const { nomor_kamar, tarif_per_bulan, fasilitas, status_kamar, keterangan } = req.body;
    const foto_kamar = req.file ? req.file.filename : null;

    const query = `
        INSERT INTO kamar (nomor_kamar, tarif_per_bulan, fasilitas, status_kamar, keterangan, foto_kamar)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [nomor_kamar, tarif_per_bulan, fasilitas, status_kamar, keterangan, foto_kamar], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Kamar berhasil ditambahkan' });
    });
});

router.put('/kamar/:id', upload.single('foto_kamar'), (req, res) => {
    const { id } = req.params;
    const { nomor_kamar, tarif_per_bulan, fasilitas, status_kamar, keterangan } = req.body;
    const foto_kamar = req.file ? req.file.filename : null;

    let query = `
        UPDATE kamar 
        SET nomor_kamar = ?, 
            tarif_per_bulan = ?, 
            fasilitas = ?, 
            status_kamar = ?, 
            keterangan = ?
    `;
    
    let params = [nomor_kamar, tarif_per_bulan, fasilitas, status_kamar, keterangan];

    if (foto_kamar) {
        query += `, foto_kamar = ?`;
        params.push(foto_kamar);
    }

    query += ` WHERE id = ?`;
    params.push(id);

    db.query(query, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Kamar berhasil diupdate' });
    });
});

router.delete('/kamar/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM kamar WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Room deleted successfully' });
    });
});

router.get('/penghuni', (req, res) => {
    const query = `
        SELECT p.*, k.nomor_kamar, DATE_FORMAT(p.created_at, '%Y-%m-%dT%H:%i:%sZ') as created_at
        FROM penghuni p 
        LEFT JOIN kamar k ON p.kamar_id = k.id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/pembayaran', (req, res) => {
    const query = `
        SELECT p.*, pen.nama_lengkap, k.nomor_kamar 
        FROM pembayaran p 
        JOIN penghuni pen ON p.penghuni_id = pen.id 
        JOIN kamar k ON p.kamar_id = k.id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/ajuan', (req, res) => {
    const query = `
        SELECT a.*, p.nama_lengkap 
        FROM ajuan a 
        JOIN penghuni p ON a.penghuni_id = p.id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.put('/penghuni/:id', (req, res) => {
    const { id } = req.params;
    const { nama_lengkap, username, email, nomor_telepon, kamar_id } = req.body;
    db.query(
        'UPDATE penghuni SET nama_lengkap = ?, username = ?, email = ?, nomor_telepon = ?, kamar_id = ? WHERE id = ?',
        [nama_lengkap, username, email, nomor_telepon, kamar_id, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Penghuni updated successfully' });
        }
    );
});

router.delete('/penghuni/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM penghuni WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Penghuni deleted successfully' });
    });
});

router.put('/pembayaran/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    db.query(
        'UPDATE pembayaran SET status = ? WHERE id = ?',
        [status, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Payment status updated successfully' });
        }
    );
});

router.put('/ajuan/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    db.query(
        'UPDATE ajuan SET status = ? WHERE id = ?',
        [status, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Ajuan status updated successfully' });
        }
    );
});

router.get('/kamar/available', (req, res) => {
    db.query('SELECT id, nomor_kamar FROM kamar WHERE status_kamar = "available"', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


module.exports = router;