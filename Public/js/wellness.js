(function () {
    const el = (id) => document.getElementById(id);
    const load = (key, fallback) => JSON.parse(localStorage.getItem(key) || 'null') || fallback;
    const save = (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new Event('njeflow:data'));
    };
    const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA');
    const MOODS = ['', '😞', '😕', '😐', '🙂', '😄'];

    // ---------- water ----------
    function renderWater() {
        const water = load('njeflowWater', {});
        const goal = water.goal || 8;
        const count = water[dayKey()] || 0;
        el('water-goal').value = goal;
        el('water-goal-label').textContent = goal;
        el('water-count').textContent = count;

        const glasses = el('water-glasses');
        glasses.innerHTML = '';
        for (let i = 0; i < Math.max(goal, count); i++) {
            const g = document.createElement('button');
            g.type = 'button';
            g.className = 'water-glass' + (i < count ? ' full' : '');
            g.title = `Set to ${i + 1} glass${i ? 'es' : ''}`;
            g.addEventListener('click', () => setWater(i + 1 === count ? i : i + 1));
            glasses.appendChild(g);
        }
    }

    function setWater(n) {
        const water = load('njeflowWater', {});
        water[dayKey()] = Math.max(0, Math.min(30, n));
        save('njeflowWater', water);
    }

    el('water-add').addEventListener('click', () => setWater((load('njeflowWater', {})[dayKey()] || 0) + 1));
    el('water-remove').addEventListener('click', () => setWater((load('njeflowWater', {})[dayKey()] || 0) - 1));
    el('water-goal').addEventListener('change', () => {
        const water = load('njeflowWater', {});
        water.goal = Math.max(1, Math.min(20, parseInt(el('water-goal').value, 10) || 8));
        save('njeflowWater', water);
    });

    // ---------- mood ----------
    function renderMood() {
        const moods = load('njeflowMood', {});
        const today = moods[dayKey()];
        document.querySelectorAll('#mood-options button').forEach((b) =>
            b.classList.toggle('active', today && String(today.mood) === b.dataset.mood));
        if (document.activeElement !== el('mood-note')) el('mood-note').value = today ? today.note || '' : '';
        el('mood-status').textContent = today ? 'Checked in for today. You can change it any time.' : 'Tap a face to check in.';

        const week = el('mood-week');
        week.innerHTML = '';
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const entry = moods[dayKey(d)];
            const cell = document.createElement('div');
            cell.className = 'mood-day' + (entry ? '' : ' empty');
            cell.title = entry && entry.note ? entry.note : '';
            cell.innerHTML = `<span>${entry ? MOODS[entry.mood] : '·'}</span><small>${d.toLocaleDateString('en-GB', { weekday: 'short' })}</small>`;
            week.appendChild(cell);
        }
    }

    function saveMood(mood) {
        const moods = load('njeflowMood', {});
        const current = moods[dayKey()] || {};
        moods[dayKey()] = { mood: mood ?? current.mood, note: el('mood-note').value.trim() };
        if (!moods[dayKey()].mood) return; // need a face before saving a note
        save('njeflowMood', moods);
    }

    document.querySelectorAll('#mood-options button').forEach((b) =>
        b.addEventListener('click', () => saveMood(Number(b.dataset.mood))));
    el('mood-note').addEventListener('change', () => saveMood());

    // ---------- habits ----------
    function streak(days) {
        const set = new Set(days);
        const d = new Date();
        if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
        let n = 0;
        while (set.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
        return n;
    }

    function renderHabits() {
        const habits = load('njeflowHabits', []);
        const today = dayKey();
        const list = el('habit-list');
        list.innerHTML = '';

        const done = habits.filter((h) => h.days.includes(today)).length;
        el('habit-progress').textContent = habits.length ? `${done}/${habits.length} today` : '';

        if (!habits.length) {
            list.innerHTML = '<li class="ov-empty">No habits yet. Try "Drink water first thing" or "Stretch for 5 minutes".</li>';
            return;
        }

        habits.forEach((habit) => {
            const isDone = habit.days.includes(today);
            const s = streak(habit.days);
            const li = document.createElement('li');
            li.className = isDone ? 'done' : '';
            li.innerHTML = '<label><input type="checkbox"> <span></span></label><small></small><button type="button" aria-label="Remove habit">×</button>';
            li.querySelector('input').checked = isDone;
            li.querySelector('span').textContent = habit.name;
            li.querySelector('small').textContent = s ? `🔥 ${s} day${s === 1 ? '' : 's'}` : '';
            li.querySelector('input').addEventListener('change', (e) => {
                const all = load('njeflowHabits', []).map((h) => {
                    if (h.id !== habit.id) return h;
                    const days = h.days.filter((d) => d !== today);
                    if (e.target.checked) days.push(today);
                    return { ...h, days };
                });
                save('njeflowHabits', all);
            });
            li.querySelector('button').addEventListener('click', () => {
                if (confirm(`Remove "${habit.name}"?`)) save('njeflowHabits', load('njeflowHabits', []).filter((h) => h.id !== habit.id));
            });
            list.appendChild(li);
        });
    }

    el('habit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = el('habit-input').value.trim();
        if (!name) return;
        save('njeflowHabits', [...load('njeflowHabits', []), { id: Date.now(), name, days: [] }]);
        el('habit-input').value = '';
    });

    function renderAll() { renderWater(); renderMood(); renderHabits(); }
    window.addEventListener('njeflow:data', renderAll);
    renderAll();
})();
