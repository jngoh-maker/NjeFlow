const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const app = express();
// Folder is "Public" (capital P): Linux paths are case-sensitive
app.use(express.static(path.join(__dirname, 'Public')));

// Used by the load balancer to check this server is alive
app.get('/health', (req, res) => res.json({ status: 'ok', server: require('os').hostname() }));

const cache = new Map();
const TTL = 10 * 60 * 1000;

async function cachedFetch(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.time < TTL) return hit.data;
  const r = await fetch(url);
  if (!r.ok) {
    const err = new Error('Upstream error');
    err.status = r.status;
    throw err;
  }
  const data = await r.json();
  cache.set(url, { data, time: Date.now() });
  return data;
}

app.get('/api/weather', async (req, res) => {
  const city = (req.query.city || '').trim();
  if (!city) return res.status(400).json({ error: 'City is required' });
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${process.env.WEATHER_KEY}`;
    res.json(await cachedFetch(url));
  } catch (e) {
    console.error('Weather error:', e.status, e.message);
    res.status(e.status || 502).json({
      error: e.status === 404 ? 'City not found' : 'Weather service unavailable'
    });
  }
});

app.get('/api/holidays', async (req, res) => {
  const year = parseInt(req.query.year, 10);
  const country = (req.query.country || '').toUpperCase();
  if (!year || !/^[A-Z]{2}$/.test(country)) {
    return res.status(400).json({ error: 'Valid year and country code required' });
  }
  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`;
    res.json(await cachedFetch(url));
  } catch (e) {
    console.error('Holiday error:', e.status, e.message);
    res.status(e.status || 502).json({ error: 'Holiday service unavailable' });
  }
});

app.get('/api/countries', async (req, res) => {
  try {
    res.json(await cachedFetch('https://date.nager.at/api/v3/AvailableCountries'));
  } catch (e) {
    console.error('Countries error:', e.status, e.message);
    res.status(502).json({ error: 'Country list unavailable' });
  }
});

app.get('/api/meals', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q || q.length > 50) {
        return res.status(400).json({ error: 'Enter a meal to search (max 50 characters)' });
        }
        try {
            const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}` ;
            const data = await cachedFetch(url);
            res.json({ meals: data.meals || [] });
        }catch (e) {
            console.error('Meals error:', e.status, e.message);
            res.status(e.status || 502).json({ error: 'Meal service unavailable' });
        }
    });


const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`NjeFlow running on http://${HOST}:${PORT}`));
