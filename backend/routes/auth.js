const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();
const JWT_SECRET = 'your-secret-key';

router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM admin WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const admin = results[0];
        const isValidPassword = await bcrypt.compare(password, admin.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET);
        res.json({ token, role: 'admin' });
    });
});

router.post('/penghuni/login', (req, res) => {
    const { username, password } = req.body;
    
    db.query('SELECT * FROM penghuni WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const penghuni = results[0];
        const isValidPassword = await bcrypt.compare(password, penghuni.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last_login timestamp
        const updateQuery = 'UPDATE penghuni SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
        db.query(updateQuery, [penghuni.id], (err) => {
            if (err) console.error('Error updating last_login:', err);
        });
        
        const token = jwt.sign({ id: penghuni.id, role: 'penghuni' }, JWT_SECRET);
        res.json({ token, role: 'penghuni', userId: penghuni.id });
    });
});

router.post('/penghuni/register', async (req, res) => {
    const { nama_lengkap, username, email, nomor_telepon, password, kamar_id } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query(
            'INSERT INTO penghuni (nama_lengkap, username, email, nomor_telepon, password, kamar_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nama_lengkap, username, email, nomor_telepon, hashedPassword, kamar_id],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Registration successful' });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/kamar', (req, res) => {
    db.query('SELECT id, nomor_kamar FROM kamar WHERE status_kamar = "available"', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

module.exports = router;