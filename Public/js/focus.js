(function () {
    const el = (id) => document.getElementById(id);

    const SETTINGS_KEY = 'njeflowFocusSettings';
    const LOG_KEY = 'njeflowFocus';
    const RING_LENGTH = 2 * Math.PI * 54; // circle r=54 in the SVG

    const settings = Object.assign(
        { focus: 25, short: 5, long: 15 },
        JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    );

    let mode = 'focus';
    let totalMs = settings.focus * 60000;
    let remainingMs = totalMs;
    let endTime = null;       // timestamp when the running timer ends
    let tick = null;
    let focusCount = 0;       // focus sessions finished in this visit (for long breaks)
    const baseTitle = document.title;

    const ring = el('focus-ring-fill');
    ring.style.strokeDasharray = RING_LENGTH;

    // ---------- helpers ----------
    const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
    const readLog = () => JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    const readTasks = () => JSON.parse(localStorage.getItem('njeflowTasks') || '[]');
    const notify = () => window.dispatchEvent(new Event('njeflow:data'));

    function format(ms) {
        const s = Math.max(0, Math.ceil(ms / 1000));
        return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }

    function render() {
        const text = format(remainingMs);
        el('focus-time').textContent = text;
        ring.style.strokeDashoffset = RING_LENGTH * (1 - remainingMs / totalMs);
        ring.classList.toggle('break', mode !== 'focus');
        el('focus-start').textContent = endTime ? 'Pause' : (remainingMs < totalMs ? 'Resume' : 'Start');
        document.title = endTime ? `${text} · ${mode === 'focus' ? 'Focus' : 'Break'} | NjeFlow` : baseTitle;

        const task = selectedTask();
        el('focus-current').textContent = mode !== 'focus'
            ? 'Break time. Stretch, breathe, drink some water.'
            : task ? 'Working on: ' + task.name : 'No task selected. Just focus.';
    }

    function selectedTask() {
        const id = el('focus-task').value;
        return id ? readTasks().find((t) => String(t.id) === id) : null;
    }

    function setMode(next) {
        pause();
        mode = next;
        totalMs = settings[next] * 60000;
        remainingMs = totalMs;
        document.querySelectorAll('.focus-mode').forEach((b) =>
            b.classList.toggle('active', b.dataset.mode === next));
        render();
    }

    // ---------- timer ----------
    function start() {
        endTime = Date.now() + remainingMs;
        tick = setInterval(() => {
            remainingMs = endTime - Date.now();
            if (remainingMs <= 0) finish();
            else render();
        }, 250);
        render();
    }

    function pause() {
        if (endTime) remainingMs = Math.max(0, endTime - Date.now());
        clearInterval(tick);
        endTime = null;
        render();
    }

    function chime() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [0, 0.25, 0.5].forEach((t) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
                osc.connect(gain).connect(ctx.destination);
                osc.start(ctx.currentTime + t);
                osc.stop(ctx.currentTime + t + 0.2);
            });
        } catch { /* audio not available */ }
    }

    function finish() {
        clearInterval(tick);
        endTime = null;
        remainingMs = 0;
        chime();

        if (mode === 'focus') {
            const task = selectedTask();
            const log = readLog();
            log.push({
                id: Date.now(),
                date: today(),
                minutes: settings.focus,
                label: task ? task.name : 'Free focus',
                endedAt: new Date().toISOString(),
            });
            localStorage.setItem(LOG_KEY, JSON.stringify(log));

            if (task && el('focus-complete-task').checked) {
                const tasks = readTasks().map((t) => t.id === task.id ? { ...t, completed: true } : t);
                localStorage.setItem('njeflowTasks', JSON.stringify(tasks));
                el('focus-complete-task').checked = false;
            }

            focusCount++;
            notify();
            setMode(focusCount % 4 === 0 ? 'long' : 'short');
        } else {
            setMode('focus');
        }
    }

    // ---------- task picker & log ----------
    function fillTasks() {
        const select = el('focus-task');
        const current = select.value;
        const open = readTasks().filter((t) => !t.completed);
        select.innerHTML = '<option value="">No specific task</option>';
        open.forEach((t) => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            select.appendChild(opt);
        });
        if (open.some((t) => String(t.id) === current)) select.value = current;
    }

    function renderLog() {
        const list = el('focus-log');
        const entries = readLog().filter((e) => e.date === today()).reverse();
        list.innerHTML = '';
        if (!entries.length) {
            list.innerHTML = '<li class="ov-empty">No sessions yet today.</li>';
            return;
        }
        entries.forEach((e) => {
            const li = document.createElement('li');
            const time = new Date(e.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            li.innerHTML = '<span></span><small></small>';
            li.firstChild.textContent = e.label;
            li.lastChild.textContent = `${e.minutes} min · ${time}`;
            list.appendChild(li);
        });
    }

    // ---------- events ----------
    el('focus-start').addEventListener('click', () => (endTime ? pause() : start()));
    el('focus-reset').addEventListener('click', () => setMode(mode));
    el('focus-skip').addEventListener('click', () => setMode(mode === 'focus' ? 'short' : 'focus'));
    el('focus-task').addEventListener('change', render);
    document.querySelectorAll('.focus-mode').forEach((b) =>
        b.addEventListener('click', () => setMode(b.dataset.mode)));

    [['focus-len', 'focus'], ['short-len', 'short'], ['long-len', 'long']].forEach(([id, key]) => {
        const input = el(id);
        input.value = settings[key];
        input.addEventListener('change', () => {
            const v = Math.min(Number(input.max), Math.max(1, parseInt(input.value, 10) || settings[key]));
            input.value = v;
            settings[key] = v;
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            if (mode === key && !endTime) setMode(key);
        });
    });

    el('focus-clear').addEventListener('click', () => {
        if (!confirm("Clear today's focus sessions?")) return;
        localStorage.setItem(LOG_KEY, JSON.stringify(readLog().filter((e) => e.date !== today())));
        notify();
    });

    window.addEventListener('njeflow:data', () => { fillTasks(); renderLog(); render(); });

    fillTasks();
    renderLog();
    setMode('focus');
})();
