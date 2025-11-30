'use strict';

const express = require('express');
const app = express();
app.use(express.json());
// Simple CORS middleware (allows all origins)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    return res.sendStatus(200);
  }
  next();
});

// Serve frontend files from `public` directory
app.use(express.static('public'));
// In-memory seed data (used only to initialize DB on first run)
let categories = ['funnyJoke', 'lameJoke'];

let funnyJoke = [
  {
    'joke': 'Dlaczego komputer poszedł do lekarza?',
    'response': 'Bo złapał wirusa!'
  },
  {
    'joke': 'Dlaczego komputer nie może być głodny?',
    'response': 'Bo ma pełen dysk!'
  },
  {
    'joke': 'Co mówi jeden bit do drugiego?',
    'response': '„Trzymaj się, zaraz się przestawiamy!"'
  }
];

let lameJoke = [
  {
    'joke': 'Dlaczego programiści preferują noc?',
    'response': 'Bo w nocy jest mniej bugów do łapania!'
  },
  {
    'joke': 'Jak nazywa się bardzo szybki programista?',
    'response': 'Błyskawiczny kompilator!'
  }
];

// --- SQLite persistence setup ---
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'jokebook.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT UNIQUE)');
  db.run('CREATE TABLE IF NOT EXISTS jokes (id INTEGER PRIMARY KEY, category TEXT, joke TEXT, response TEXT)');

  // Ensure categories exist
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories(name) VALUES (?)');
  categories.forEach(c => insertCategory.run(c));
  insertCategory.finalize();

  // Seed jokes only if jokes table is empty
  db.get('SELECT COUNT(*) AS cnt FROM jokes', (err, row) => {
    if (err) {
      console.error('DB count error', err);
      return;
    }
    if (row && row.cnt === 0) {
      const insertJoke = db.prepare('INSERT INTO jokes(category, joke, response) VALUES (?, ?, ?)');
      funnyJoke.forEach(j => insertJoke.run('funnyJoke', j.joke, j.response));
      lameJoke.forEach(j => insertJoke.run('lameJoke', j.joke, j.response));
      insertJoke.finalize();
      console.log('Seeded jokes into database');
    }
  });
});

app.get('/jokebook/categories', (req, res) => {
  db.all('SELECT name FROM categories', (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    res.json(rows.map(r => r.name));
  });
});

app.get('/jokebook/joke/:category', (req, res) => {
  const category = req.params.category;
  db.all('SELECT id,joke,response FROM jokes WHERE category = ?', [category], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    if (!rows || rows.length === 0) return res.json({ error: `no jokes for category ${category}` });
    const random = rows[Math.floor(Math.random() * rows.length)];
    res.json({ joke: random.joke, response: random.response });
  });
});

app.post('/jokebook/joke/:category', (req, res) => {
  const category = req.params.category;
  const { joke, response: resp } = req.body;
  if (!joke || !resp) return res.status(400).json({ error: 'request must include joke and response' });

  // Check category exists
  db.get('SELECT id FROM categories WHERE name = ?', [category], (err, row) => {
    if (err) return res.status(500).json({ error: 'db error' });
    if (!row) return res.json({ error: `no jokes for category ${category}` });
    db.run('INSERT INTO jokes(category, joke, response) VALUES (?, ?, ?)', [category, joke, resp], function(insertErr) {
      if (insertErr) return res.status(500).json({ error: 'db insert error' });
      res.json({ success: `joke added to ${category}`, joke: { id: this.lastID, joke, response: resp } });
    });
  });
});

app.get('/jokebook/stats', (req, res) => {
  db.all('SELECT category, COUNT(*) AS cnt FROM jokes GROUP BY category', (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    const stats = {};
    rows.forEach(r => { stats[r.category] = r.cnt; });
    // ensure categories with zero are shown
    categories.forEach(c => { if (!stats[c]) stats[c] = 0; });
    res.json(stats);
  });
});

app.get('/jokebook/search', (req, res) => {
  const word = req.query.word;
  if (!word || typeof word !== 'string' || word.trim() === '') return res.json([]);
  const q = `%${word.trim()}%`;
  db.all('SELECT category,joke,response FROM jokes WHERE joke LIKE ? OR response LIKE ?', [q, q], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    res.json(rows.map(r => ({ category: r.category, joke: r.joke, response: r.response })));
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});