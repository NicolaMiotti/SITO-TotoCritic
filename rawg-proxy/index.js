import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;
const RAWG_API_KEY = 'd86a6b8df9b2437dbf5bd0eb787906cf';

app.get('/games', async (req, res) => {
  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: 'Missing search parameter' });
  }
  const url = `https://api.rawg.io/api/games?search=${encodeURIComponent(search)}&key=${RAWG_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.set('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel proxy RAWG', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`RAWG proxy server listening on port ${PORT}`);
});