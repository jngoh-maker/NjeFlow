(function () {
    const el = (id) => document.getElementById(id);

    const FAV_KEY = 'njeflowFavMeals';
    const GROCERY_KEY = 'njeflowGroceries';

    let meals = [];          // what is currently listed
    let showingFavs = false;

    const readFavs = () => JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    const readGroceries = () => JSON.parse(localStorage.getItem(GROCERY_KEY) || '[]');
    const saveGroceries = (list) => {
        localStorage.setItem(GROCERY_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event('njeflow:data'));
    };

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = String(value ?? '');
        return div.innerHTML;
    }

    function setStatus(message, type = '') {
        const s = el('meal-status');
        s.textContent = message;
        s.className = 'status ' + type;
    }

    function ingredientsOf(meal) {
        const list = [];
        for (let i = 1; i <= 20; i++) {
            const name = (meal['strIngredient' + i] || '').trim();
            if (name) list.push({ name, measure: (meal['strMeasure' + i] || '').trim() });
        }
        return list;
    }

    const isFav = (id) => readFavs().some((m) => m.idMeal === id);

    // ---------- search & list ----------
    async function searchMeals(query) {
        if (!query) return;
        showingFavs = false;
        el('meal-show-favs').textContent = 'Show favourites';
        el('meal-results').innerHTML = '';
        setStatus('Searching...', 'loading');

        try {
            let res;
            try {
                res = await fetch('/api/meals?q=' + encodeURIComponent(query));
            } catch {
                throw new Error('Network problem. Check your internet connection and try again.');
            }
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

            meals = data.meals || [];
            fillCategories();
            if (!meals.length) {
                setStatus(`No meals found for "${query}". Try another word.`);
                return;
            }
            renderMeals();
        } catch (err) {
            meals = [];
            fillCategories();
            setStatus(err.message, 'error');
        }
    }

    function fillCategories() {
        const select = el('meal-category');
        const categories = [...new Set(meals.map((m) => m.strCategory).filter(Boolean))].sort();
        select.innerHTML = '<option value="all">All categories</option>' +
            categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }

    function renderMeals() {
        const category = el('meal-category').value;
        const shown = meals.filter((m) => category === 'all' || m.strCategory === category);

        if (!shown.length) {
            el('meal-results').innerHTML = '';
            setStatus(showingFavs ? 'No favourites yet. Tap ♡ on a meal to save it.' : 'No meals in this category.');
            return;
        }

        setStatus(`${shown.length} ${showingFavs ? 'favourite' : 'meal'}${shown.length === 1 ? '' : 's'}`);
        el('meal-results').innerHTML = shown.map((m) => `
            <div class="meal-card" data-id="${escapeHtml(m.idMeal)}">
                <img src="${escapeHtml(m.strMealThumb)}/preview" alt="" loading="lazy">
                <button type="button" class="meal-fav ${isFav(m.idMeal) ? 'on' : ''}" data-fav="${escapeHtml(m.idMeal)}"
                    aria-label="Save to favourites">${isFav(m.idMeal) ? '♥' : '♡'}</button>
                <div class="meal-card-body">
                    <h4>${escapeHtml(m.strMeal)}</h4>
                    <span class="badge ok">${escapeHtml(m.strCategory || 'Meal')}</span>
                    ${m.strArea ? `<span class="badge">${escapeHtml(m.strArea)}</span>` : ''}
                </div>
            </div>`).join('');
    }

    function toggleFav(id) {
        let favs = readFavs();
        if (favs.some((m) => m.idMeal === id)) {
            favs = favs.filter((m) => m.idMeal !== id);
        } else {
            const meal = meals.find((m) => m.idMeal === id);
            if (meal) favs.push(meal);
        }
        localStorage.setItem(FAV_KEY, JSON.stringify(favs));
        if (showingFavs) meals = favs;
        renderMeals();
    }

    // ---------- recipe details ----------
    function openMeal(id) {
        const meal = meals.find((m) => m.idMeal === id);
        if (!meal) return;
        const ingredients = ingredientsOf(meal);
        const steps = (meal.strInstructions || '')
            .split(/\r?\n+/).map((s) => s.trim()).filter((s) => s && !/^step\s*\d+$/i.test(s));

        el('meal-detail').innerHTML = `
            <img class="meal-detail-img" src="${escapeHtml(meal.strMealThumb)}" alt="">
            <h3>${escapeHtml(meal.strMeal)}</h3>
            <p class="section-text">${escapeHtml([meal.strCategory, meal.strArea].filter(Boolean).join(' · '))}</p>

            <div class="ov-card-head">
                <h4>Ingredients</h4>
                <button type="button" class="primary-button" id="meal-add-groceries">Add all to grocery list</button>
            </div>
            <ul class="meal-ingredients">
                ${ingredients.map((i) => `<li><strong>${escapeHtml(i.measure)}</strong> ${escapeHtml(i.name)}</li>`).join('')}
            </ul>

            <h4>Method</h4>
            <ol class="meal-steps">${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ol>
            ${meal.strYoutube ? `<p><a href="${escapeHtml(meal.strYoutube)}" target="_blank" rel="noopener">Watch the video -></a></p>` : ''}
        `;

        el('meal-add-groceries').addEventListener('click', (e) => {
            const list = readGroceries();
            const have = new Set(list.map((g) => g.name.toLowerCase()));
            let added = 0;
            ingredients.forEach((i, n) => {
                const name = (i.measure ? i.measure + ' ' : '') + i.name;
                if (!have.has(name.toLowerCase())) {
                    list.push({ id: Date.now() + n, name, done: false });
                    added++;
                }
            });
            saveGroceries(list);
            e.target.textContent = added ? `Added ${added} item${added === 1 ? '' : 's'} ✓` : 'Already on your list ✓';
            e.target.disabled = true;
        });

        el('meal-dialog').showModal();
    }

    // ---------- grocery list ----------
    function renderGroceries() {
        const listEl = el('grocery-list');
        const list = readGroceries();
        listEl.innerHTML = '';
        if (!list.length) {
            listEl.innerHTML = '<li class="ov-empty">Your list is empty.</li>';
            return;
        }
        list.forEach((item) => {
            const li = document.createElement('li');
            li.className = item.done ? 'done' : '';
            li.innerHTML = '<label><input type="checkbox"> <span></span></label><button type="button" aria-label="Remove">×</button>';
            const box = li.querySelector('input');
            box.checked = item.done;
            li.querySelector('span').textContent = item.name;
            box.addEventListener('change', () =>
                saveGroceries(readGroceries().map((g) => g.id === item.id ? { ...g, done: box.checked } : g)));
            li.querySelector('button').addEventListener('click', () =>
                saveGroceries(readGroceries().filter((g) => g.id !== item.id)));
            listEl.appendChild(li);
        });
    }

    // ---------- events ----------
    el('meal-form').addEventListener('submit', (e) => {
        e.preventDefault();
        searchMeals(el('meal-query').value.trim());
    });
    el('meal-category').addEventListener('change', renderMeals);

    el('meal-show-favs').addEventListener('click', () => {
        showingFavs = !showingFavs;
        el('meal-show-favs').textContent = showingFavs ? 'Back to search' : 'Show favourites';
        meals = showingFavs ? readFavs() : [];
        fillCategories();
        if (showingFavs) renderMeals();
        else { el('meal-results').innerHTML = ''; setStatus('Search for a meal to get started.'); }
    });

    el('meal-results').addEventListener('click', (e) => {
        const fav = e.target.closest('[data-fav]');
        if (fav) return toggleFav(fav.dataset.fav);
        const card = e.target.closest('.meal-card');
        if (card) openMeal(card.dataset.id);
    });

    el('meal-dialog-close').addEventListener('click', () => el('meal-dialog').close());
    el('meal-dialog').addEventListener('click', (e) => {
        if (e.target === el('meal-dialog')) el('meal-dialog').close(); // click on backdrop
    });

    el('grocery-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = el('grocery-input').value.trim();
        if (!name) return;
        saveGroceries([...readGroceries(), { id: Date.now(), name, done: false }]);
        el('grocery-input').value = '';
    });
    el('grocery-clear').addEventListener('click', () =>
        saveGroceries(readGroceries().filter((g) => !g.done)));

    window.addEventListener('njeflow:data', renderGroceries);

    renderGroceries();
    searchMeals('chicken'); // something to look at on first visit
})();
