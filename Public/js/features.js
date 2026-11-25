// --------- Shared helpers ----------
const $ = (id) => document.getElementById(id);

//Calls our own server and turns every failure into a friendly message.
async function getJSON(url) {
    let res;
    try {
        res = await fetch(url);
    } catch {
        throw new Error('Network proble. Check your internet connection and try again. ');
    }
    let data = null;
    try { data = await res.json(); } catch { /* not JSON */ }
    if (!res.ok) throw new Error((data && data.error) || 'Something went wrong. Please try again.');
    return data;
}

function setStatus(el, message, type = '') {
    el.textContent = message;
    el.className = 'status ' + type;
}

// Stops text from the api being treated as html (xss protection).
function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
}

// ---------- weather -----------
let forecastDays = [];
let cityLabel = '';


// The api returns one entry every 3 hours; we group them into one card per day.
function summarizeForecast(list) {
    const byDate = {};
    list.forEach((item) => {
        const date = item.dt_txt.split(' ')[0];
        (byDate[date] = byDate[date] || []).push(item);
    });

    return Object.entries(byDate).map(([date, items]) => {
        const temps = items.map((i) => i.main.temp);
        const mains = items.map((i) => i.weather[0].main);

        const rainy = mains.some((m) => ['Rain', 'Drizzle', 'Thunderstorm'].includes(m));
        let category = 'other';
        if (rainy) {
            category = 'rain';
        } else {
            const counts = {};
            mains.forEach((m) => (counts[m] = (counts[m] || 0) + 1));
            const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
            if (top === 'Clear') category = 'clear';
            else if (top === 'Clouds') category = 'clouds';
        }

        const midday = items.find((i) => i.dt_txt.includes('12:00:00')) || items[Math.floor(items.length / 2)];

        return {
            date,
            min: Math.round(Math.min(...temps)),
            max: Math.round(Math.max(...temps)),
            category,
            description: midday.weather[0].description,
            icon: midday.weather[0].icon,
            rainChance: Math.round(Math.max(...items.map((i) => i.pop || 0)) * 100),
            };
        });
}


function renderWeather() {
    const status = $('weather-status');
    const results = $('weather-results');
    const filter = $('weather-filter').value;
    const sort = $('weather-sort').value;

    let days = forecastDays.filter((d) => filter === 'all' || d.category === filter);

    if (sort === 'hot') days.sort((a, b) => b.max - a.max);
    else if (sort === 'cold') days.sort((a, b) => a.max - b.max);
    else days.sort((a, b) => a.date.localeCompare(b.date));

    if (!days.length) {
        results.innerHTML = '';
        if (forecastDays.length) setStatus(status, 'No days match this filter.');
        return;
    }

    setStatus(status, `Forecast for ${cityLabel}`);

    results.innerHTML = days.map((d) => {
        const label = new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', {
            weekday: 'short', day: 'numeric', month: 'short',
            });
            const badge = d.rainChance >= 50
            ? `<span class="badge warn">Rain likely (${d.rainChance}%). Move outdoor plans.</span>`
            : `<span class="badge ok">Rain chance ${d.rainChance}%</span>`;

            return `
            <div class="weather-card">
                <div class="weather-date">${label}</div>
                <img class="weather-icon" src="https://openweathermap.org/img/wn/${d.icon}@2x.png" alt="">
                <div class="weather-temp">${d.max}° <span>/ ${d.min}°</span></div>
                <div class="weather-desc">${escapeHtml(d.description)}</div>
                ${badge}
            </div>`;
        }).join('');
}

async function loadWeather(city) {
    if (!city) return;
    const status = $('weather-status');
    $('weather-results').innerHTML = '';
    setStatus(status, 'Loading forecast...', 'loading');

    try {
        const data = await getJSON('/api/weather?city=' + encodeURIComponent(city));
        forecastDays = summarizeForecast(data.list);
        cityLabel = `${data.city.name}, ${data.city.country}`;
        localStorage.setItem('njeflowCity', city); // Overview shows this city too
        window.dispatchEvent(new Event('njeflow:data'));
        renderWeather();
    } catch (err) {
        forecastDays = [];
        const msg = err.message === 'City not found'
        ? "We coundln't find that city. Check the spelling and try again."
        : err.message;
    setStatus(status, msg, 'error'); 
    }
}

$('weather-form').addEventListener('submit', (e) => {
    e.preventDefault();
    loadWeather($('weather-city').value.trim())
});
$('weather-filter').addEventListener('change', renderWeather);
$('weather-sort').addEventListener('change', renderWeather);

const savedCity = localStorage.getItem('njeflowCity') || 'Kigali';
$('weather-city').value = savedCity;
loadWeather(savedCity); // last searched city (Kigali the first time)
