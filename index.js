import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

const RAWG_API_KEY = 'd86a6b8df9b2437dbf5bd0eb787906cf';
const IGDB_CLIENT_ID = '7uke06i0g47lc7h8708uie619x8tbt';
const IGDB_ACCESS_TOKEN = 'ycpr0x9td8dcswewlctx2x7jsgzsbx';

app.get('/games', async (req, res) => {
  const { search } = req.query;
  if (!search) {
    return res.status(400).json({ error: 'Missing search parameter' });
  }

  // 1. Prova RAWG
  const rawgUrl = `https://api.rawg.io/api/games?search=${encodeURIComponent(search)}&key=${RAWG_API_KEY}`;
  try {
    const rawgRes = await fetch(rawgUrl);
    const rawgData = await rawgRes.json();
    let game = null;
    if (rawgData.results && rawgData.results.length > 0) {
      // Cerca match esatto
      const normalize = str => str.toLowerCase().replace(/[^a-z0-9]/gi, '');
      const searchNorm = normalize(search);
      game = rawgData.results.find(r => normalize(r.name) === searchNorm) || rawgData.results[0];
    }
    // Se RAWG ha un voto valido, restituisci subito
    if (game && typeof game.metacritic === 'number') {
      res.set('Access-Control-Allow-Origin', '*');
      return res.json({ source: 'rawg', ...game });
    }

    // 2. Fallback: Prova IGDB
    const igdbRes = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID,
        'Authorization': `Bearer ${IGDB_ACCESS_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'text/plain'
      },
      body: `search "${search}"; fields name,aggregated_rating,rating,first_release_date; limit 5;`
    });
    const igdbData = await igdbRes.json();
    let igdbGame = null;
    if (igdbData && igdbData.length > 0) {
      igdbGame = igdbData[0];
    }
    if (igdbGame && (typeof igdbGame.aggregated_rating === 'number' || typeof igdbGame.rating === 'number')) {
      res.set('Access-Control-Allow-Origin', '*');
      return res.json({ source: 'igdb', ...igdbGame });
    }

    // Nessun voto trovato
    res.set('Access-Control-Allow-Origin', '*');
    return res.json({ error: 'No rating found', rawg: game, igdb: igdbGame });

  } catch (err) {
    res.status(500).json({ error: 'Errore nel proxy giochi', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`RAWG/IGDB proxy server listening on port ${PORT}`);
});