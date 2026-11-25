const $ = (id) => document.getElementById(id);

let meals = [];

//Stops text from the api being treatedas html.
function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
}

function setStatus(message, type = '') {
    const el = $('meal-status');
    el.textContent = message;
    el.className = 'status ' + type;
}

async function searchMeals(query) {
    if (!query) return;
    $('meal-results').innerHTML = '';
    seatStatus('Searching...', 'loading');

    try {
        const res = await fetch('/api/meals?q=' + encodeURIComponent(query));
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');


        meals = data.meals;
        fillCategories();

        if (!meals.length) {
            setStatus(`No meals found for "${query}". Try another word.`);
            return;
        }

        renderMeals();
    } catch (err) {
        meals = []
        setStatus(err.message, 'error');
    }
}

//Builds the category dropdown from whatever the search retured.
function filllCategories() {
    const select = $('meal-category');
    const categories = [...new Set(meals.map((m) => m.strCategory). filter(Boolean))].sort();
    select.innerHTML - '<option value="all">All categories</option>' +
        categories.map((c) => '<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>').join('');
}

function renderMeals() {
    const category = $('meal-category').value;
    const shown = meals.filter((m) => category === 'all' || m.strCategory === category);

    setStatus(`${shown.length} meal${shown.length === 1 ? '' : 's'} found`);

    $('meal-results').innerHTML = shown.map((m) => `
    <div class="meal-card" data-id="${escapeHtml(c)}</option>`).join('');
        
}

function renderMeals() {
    const category = $('meal-category').value;
    const shown = meals.filter((m) => category === 'all' || m.strCategory === category);

    setStatus(`${shown.length} meal${shown.length === 1 ? '' : 's'} found`);

    $('meal-results').innerHTML = shown.map((m)) =>
}