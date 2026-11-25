(function () {
    const el = (id) => document.getElementById(id);
    const read = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const todayKey = (d = new Date()) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const TIME_ORDER = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM'];

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = String(value ?? '');
        return div.innerHTML;
    }

    // ---------- header ----------
    function renderHeader(tasks) {
        const now = new Date();
        const h = now.getHours();
        const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
        el('ov-date').textContent = now.toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long',
        }).toUpperCase();
        el('ov-greeting').textContent = `Good ${part}.`;

        const open = tasks.filter((t) => !t.completed).length;
        el('ov-subtitle').textContent = open
            ? `You have ${open} open task${open === 1 ? '' : 's'}. Let's take them one at a time.`
            : tasks.length ? 'Everything on your list is done. Nice work!' : 'A little structure can make your day feel lighter.';
    }

    // ---------- progress hero ----------
    function renderProgress(tasks, focusToday) {
        const done = tasks.filter((t) => t.completed).length;
        const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
        el('ov-progress-value').textContent = pct + '%';
        el('ov-progress-fill').style.width = pct + '%';
        el('ov-progress-note').textContent = tasks.length
            ? `${done} of ${tasks.length} task${tasks.length === 1 ? '' : 's'} done`
            : 'No tasks yet';

        const next = tasks.find((t) => !t.completed);
        const title = el('ov-hero-title');
        const text = el('ov-hero-text');
        const button = el('ov-hero-button');

        if (!tasks.length) {
            title.textContent = 'Your life, one step at a time.';
            text.textContent = 'Start by adding one thing you want to get done today.';
            button.textContent = 'Plan my day ->';
            button.href = '#plan';
        } else if (next) {
            title.textContent = 'Next up: ' + next.name;
            text.textContent = focusToday.length
                ? `You've focused for ${focusToday.reduce((s, e) => s + e.minutes, 0)} minutes today. Keep your flow going.`
                : 'A 25-minute focus session is a great way to start.';
            button.textContent = 'Focus on it ->';
            button.href = '#focus';
        } else {
            title.textContent = 'All done for now.';
            text.textContent = 'Take a break, plan a meal, or add something new.';
            button.textContent = 'Find a meal ->';
            button.href = '#eat';
        }
    }

    // ---------- tasks ----------
    function renderTasks(tasks) {
        const list = el('ov-tasks');
        const open = tasks.filter((t) => !t.completed).slice(0, 5);
        list.innerHTML = '';
        if (!open.length) {
            list.innerHTML = `<li class="ov-empty">${tasks.length ? 'All caught up!' : 'Nothing here yet.'}</li>`;
            return;
        }
        open.forEach((task) => {
            const li = document.createElement('li');
            li.innerHTML = '<label><input type="checkbox"> <span></span></label>';
            li.querySelector('span').textContent = task.name;
            li.querySelector('input').addEventListener('change', () => {
                const all = read('njeflowTasks').map((t) => t.id === task.id ? { ...t, completed: true } : t);
                localStorage.setItem('njeflowTasks', JSON.stringify(all));
                window.dispatchEvent(new Event('njeflow:data'));
            });
            list.appendChild(li);
        });
    }

    el('ov-task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = el('ov-task-input');
        const name = input.value.trim();
        if (!name) return;
        const all = read('njeflowTasks');
        all.push({ id: Date.now(), name, completed: false });
        localStorage.setItem('njeflowTasks', JSON.stringify(all));
        input.value = '';
        window.dispatchEvent(new Event('njeflow:data'));
    });

    // ---------- schedule ----------
    function renderSchedule() {
        const list = el('ov-schedule');
        const day = DAYS[new Date().getDay()];
        const items = read('njeFlowActivities')
            .filter((a) => a.day === day)
            .sort((a, b) => TIME_ORDER.indexOf(a.time) - TIME_ORDER.indexOf(b.time));

        list.innerHTML = items.length
            ? items.map((a) => `
                <li><span><span class="ov-dot ${escapeHtml(a.category)}"></span>${escapeHtml(a.name)}</span>
                <small>${escapeHtml(a.time)}</small></li>`).join('')
            : '<li class="ov-empty">Nothing scheduled today. <a href="#plan">Add an activity</a></li>';
    }

    // ---------- focus ----------
    function renderFocus(log) {
        const todayEntries = log.filter((e) => e.date === todayKey());
        el('ov-focus-sessions').textContent = todayEntries.length;
        el('ov-focus-minutes').textContent = todayEntries.reduce((s, e) => s + e.minutes, 0);

        // streak: consecutive days with at least one session, ending today (or yesterday)
        const days = new Set(log.map((e) => e.date));
        const d = new Date();
        if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1);
        let streak = 0;
        while (days.has(todayKey(d))) {
            streak++;
            d.setDate(d.getDate() - 1);
        }
        el('ov-streak').textContent = streak;

        el('ov-focus-note').textContent = todayEntries.length
            ? 'Last: ' + todayEntries[todayEntries.length - 1].label
            : 'No sessions yet. Even 10 minutes counts.';
        return todayEntries;
    }

    // ---------- weather ----------
    let weatherFor = null;

    async function renderWeather() {
        const city = localStorage.getItem('njeflowCity') || 'Kigali';
        if (city === weatherFor) return; // already showing it
        weatherFor = city;
        const box = el('ov-weather');

        try {
            const res = await fetch('/api/weather?city=' + encodeURIComponent(city));
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const now = data.list[0];
            const next24 = data.list.slice(0, 8);
            const rain = Math.round(Math.max(...next24.map((i) => i.pop || 0)) * 100);
            const temps = next24.map((i) => i.main.temp);
            const tip = rain >= 50
                ? 'Rain likely. Keep outdoor plans flexible and bring an umbrella.'
                : now.main.temp >= 28 ? 'Hot one today. Stay hydrated.'
                : 'Looks like a good day to get outside.';

            box.innerHTML = `
                <div class="ov-weather-now">
                    <img src="https://openweathermap.org/img/wn/${escapeHtml(now.weather[0].icon)}@2x.png" alt="">
                    <div>
                        <strong>${Math.round(now.main.temp)}°C</strong>
                        <span>${escapeHtml(now.weather[0].description)}</span>
                    </div>
                </div>
                <p>${escapeHtml(data.city.name)} · High ${Math.round(Math.max(...temps))}° / Low ${Math.round(Math.min(...temps))}° · Rain ${rain}%</p>
                <p class="ov-tip">${tip}</p>`;
        } catch {
            weatherFor = null; // retry next time
            box.innerHTML = '<p class="ov-empty">Weather is unavailable right now.</p>';
        }
    }

    // ---------- refresh ----------
    function refresh() {
        const tasks = read('njeflowTasks');
        const focusToday = renderFocus(read('njeflowFocus'));
        renderHeader(tasks);
        renderProgress(tasks, focusToday);
        renderTasks(tasks);
        renderSchedule();
        renderWeather();
    }

    window.addEventListener('njeflow:data', refresh);
    window.addEventListener('hashchange', () => {
        if (!location.hash || location.hash === '#overview') refresh();
    });
    refresh();
})();
