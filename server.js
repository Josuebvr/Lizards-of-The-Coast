const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do site (frontend) e uploads
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Garante que a pasta de uploads exista
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// Banco de dados SQLite
const dbFile = path.join(__dirname, 'reviews.db');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId TEXT,
    name TEXT,
    text TEXT,
    rating INTEGER,
    imagePath TEXT,
    created_at TEXT
  )`);
});

// Configuração do multer para uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
        cb(null, name);
    }
});
const upload = multer({ storage });

// Endpoints
app.get('/api/reviews', (req, res) => {
    const productId = req.query.productId;
    let q = 'SELECT * FROM reviews';
    const params = [];
    if (productId) {
        q += ' WHERE productId = ?';
        params.push(productId);
    }
    q += ' ORDER BY created_at DESC';
    db.all(q, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const out = rows.map(r => {
            if (r.imagePath) r.imagePath = '/uploads/' + path.basename(r.imagePath);
            return r;
        });
        res.json(out);
    });
});

app.post('/api/reviews', upload.single('image'), (req, res) => {
    const { productId, name, text, rating } = req.body;
    let imagePath = null;
    if (req.file) imagePath = req.file.filename;
    const created_at = new Date().toISOString();
    db.run(
        'INSERT INTO reviews (productId,name,text,rating,imagePath,created_at) VALUES (?,?,?,?,?,?)',
        [productId, name, text, rating ? parseInt(rating, 10) : null, imagePath, created_at],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const id = this.lastID;
            db.get('SELECT * FROM reviews WHERE id = ?', [id], (err2, row) => {
                if (err2) return res.status(500).json({ error: err2.message });
                if (row.imagePath) row.imagePath = '/uploads/' + path.basename(row.imagePath);
                res.status(201).json(row);
            });
        }
    );
});

app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
