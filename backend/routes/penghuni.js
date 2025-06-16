const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/pembayaran/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT p.*, k.nomor_kamar 
        FROM pembayaran p 
        JOIN kamar k ON p.kamar_id = k.id 
        WHERE p.penghuni_id = ?
    `;
    
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.post('/ajuan', (req, res) => {
    const { penghuni_id, jenis_ajuan, deskripsi, tanggal_ajuan } = req.body;
    
    db.query(
        'INSERT INTO ajuan (penghuni_id, jenis_ajuan, deskripsi, tanggal_ajuan) VALUES (?, ?, ?, ?)',
        [penghuni_id, jenis_ajuan, deskripsi, tanggal_ajuan],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Ajuan submitted successfully' });
        }
    );
});

router.get('/ajuan/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('SELECT * FROM ajuan WHERE penghuni_id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

router.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT p.id, p.nama_lengkap, p.kamar_id, k.tarif_per_bulan
        FROM penghuni p
        LEFT JOIN kamar k ON p.kamar_id = k.id
        WHERE p.id = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(404).json({ error: 'Penghuni not found' });
        }
        res.json(results[0]);
    });
});

router.post('/pembayaran', upload.single('bukti_transfer'), (req, res) => {
    const { penghuni_id, kamar_id, tarif, tanggal_pembayaran } = req.body;
    const bukti_transfer = req.file ? req.file.filename : null;

    const kode_sewa = `INV-${penghuni_id}-${Date.now()}`;

    if (!bukti_transfer) {
        return res.status(400).json({ error: 'Bukti transfer wajib diupload.' });
    }

    const query = `
        INSERT INTO pembayaran (kode_sewa, penghuni_id, kamar_id, tarif, status, bukti_transfer, tanggal_pembayaran)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `;

    db.query(query, [kode_sewa, penghuni_id, kamar_id, tarif, bukti_transfer, tanggal_pembayaran], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Pembayaran berhasil dikirim dan sedang menunggu verifikasi.' });
    });
});


module.exports = router;