document.addEventListener
("DOMContentLoaded", function () {

    

    // Store tasks
    let tasks = JSON.parse(localStorage.getItem("njeflowTasks")) || [];
    let activities = JSON.parse(localStorage.getItem("njeFlowActivities")) || [];
    // Find the main content area
    const mainContent = document.querySelector(".main-content");

    // Create the plan section
    const planSection = document.createElement("section");

    planSection.className = "plan-workspace";

   planSection.innerHTML = `
   <div class="section-heading">
   <p class="section-label">Your plan</p>
   <h2>Make today count.</h2>
   <p>One task at a time. One step at a time.</p>
   </div>

   <div class="task-form">
   <input type="text" id="taskInput"
   placeholder="what do you need to do?">

   <button id="addTaskButton">Add task +</button>
   </div>

   <div class="task-list" id="taskList"></div>
   `;

  // Put the task list on the Plan page
  (document.getElementById("plan") || mainContent).appendChild(planSection);

  // ---- Page switching: show only the page named in the URL hash ----
  const pages = document.querySelectorAll(".page");
  const navLinks = document.querySelectorAll("nav .nav-link");

  function showPage() {
    const id = location.hash.slice(1);
    const target = document.querySelector(".page#" + CSS.escape(id)) || document.getElementById("overview");
    pages.forEach(page => { page.hidden = page !== target; });
    navLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === "#" + target.id);
    });
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", showPage);
  showPage();
  
   // Get the input, button and task list
   const taskInput = document.getElementById("taskInput");
   const addTaskButton = document.getElementById("addTaskButton");
   const taskList = document.getElementById("taskList");

function saveTasks() {
    localStorage.setItem("njeflowTasks", JSON.stringify(tasks));
    window.dispatchEvent(new Event("njeflow:data"));
}

// Other pages (Overview, Focus) can change tasks too: reload when they do
window.addEventListener("njeflow:data", function () {
    tasks = JSON.parse(localStorage.getItem("njeflowTasks")) || [];
    activities = JSON.parse(localStorage.getItem("njeFlowActivities")) || [];
    displayTasks();
    if (typeof displayActivities === "function") displayActivities();
});

function displayTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        taskList.textContent = "No tasks yet. Add your first task!";
        return;
    }

    tasks.forEach(function (task) {

        const taskItem = document.createElement("div");
        taskItem.className = "task-item";

        if (task.completed) { 
            taskItem.classList.add("completed");
        }

        const taskName = document.createElement("span");
        taskName.textContent = task.name;

        if (task.when) {
            const when = document.createElement("small");
            when.className = "task-when";
            when.textContent = task.when;
            taskName.appendChild(when);
        }

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const completeButton = document.createElement("button");

            completeButton.textContent = task.completed
            ? "Undo"
            : "Complete";

            completeButton.addEventListener("click", function () {

                task.completed = !task.completed;

                saveTasks();
                displayTasks();
            });

            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";

            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", function () {

                tasks = tasks.filter(function (item) {
                    return item.id !== task.id;
                });

                saveTasks();
                displayTasks();
            });

            actions.appendChild(completeButton);
            actions.appendChild(deleteButton);

            taskItem.appendChild(taskName);
            taskItem.appendChild(actions);

            taskList.appendChild(taskItem);

    });

    }

    function addTask() {

        const taskName = taskInput.value.trim();

        if (taskName === "") {
            alert("Please enter a task first.");
            return;
        }

        const newTask = {
            id: Date.now(),
            name: taskName,
            completed: false
        };

        tasks.push(newTask);

        saveTasks();
        displayTasks();

        taskInput.value = "";
        taskInput.focus();


    }

    addTaskButton.addEventListener("click", addTask);

    taskInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {
            addTask();
        }

    });

    // ---------- Weekly calendar: click a slot to schedule ----------
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dialog = document.getElementById("schedule-dialog");
    const scheduleForm = document.getElementById("schedule-form");
    const nameInput = document.getElementById("schedule-name");
    const addTaskBox = document.getElementById("schedule-add-task");
    const deleteBtn = document.getElementById("schedule-delete");
    let slot = null;        // { day, time } being edited
    let editing = null;     // activity being edited, or null for a new one

    function saveActivities() {
        // Saved first; saveTasks() then notifies everyone once both are stored
        localStorage.setItem("njeFlowActivities", JSON.stringify(activities));
    }

    function linkedTask(activity) {
        return activity.taskId ? tasks.find(t => t.id === activity.taskId) : null;
    }

    // Tag every day cell with its day/time so clicks know where they are
    document.querySelectorAll(".calendar-row").forEach(row => {
        const time = row.children[0].textContent.trim();
        DAYS.forEach((day, i) => {
            const cell = row.children[i + 1];
            if (!cell) return;
            cell.classList.add("slot");
            cell.dataset.day = day;
            cell.dataset.time = time;
            cell.title = `Schedule something on ${day} at ${time}`;
        });
    });

    function displayActivities() {
        document.querySelectorAll(".calendar .slot .event").forEach(e => e.remove());
        activities.forEach(activity => {
            const cell = document.querySelector(
                `.calendar .slot[data-day="${activity.day}"][data-time="${activity.time}"]`);
            if (!cell) return;

            const event = document.createElement("div");
            const task = linkedTask(activity);
            event.className = "event " + activity.category + (task && task.completed ? " done" : "");
            event.textContent = activity.name;
            event.title = "Click to edit";
            event.addEventListener("click", e => {
                e.stopPropagation();
                openSchedule(activity.day, activity.time, activity);
            });
            cell.appendChild(event);
        });
    }

    function openSchedule(day, time, activity = null) {
        slot = { day, time };
        editing = activity;
        document.getElementById("schedule-when").textContent = `${day} · ${time}`.toUpperCase();
        document.getElementById("schedule-title").textContent =
            activity ? "Edit this activity" : "What would you like to schedule?";
        document.getElementById("schedule-save").textContent = activity ? "Save" : "Schedule";
        nameInput.value = activity ? activity.name : "";
        const category = activity ? activity.category : "study";
        scheduleForm.querySelector(`input[value="${category}"]`).checked = true;
        addTaskBox.checked = activity ? Boolean(linkedTask(activity)) : true;
        deleteBtn.hidden = !activity;
        dialog.showModal();
        nameInput.focus();
    }

    document.querySelector(".calendar").addEventListener("click", e => {
        const cell = e.target.closest(".slot");
        if (cell) openSchedule(cell.dataset.day, cell.dataset.time);
    });

    scheduleForm.addEventListener("submit", e => {
        e.preventDefault();
        const name = nameInput.value.trim();
        if (!name) return nameInput.focus();
        const category = scheduleForm.querySelector('input[name="schedule-category"]:checked').value;
        const when = `${slot.day} · ${slot.time}`;

        const activity = editing || { id: Date.now(), day: slot.day, time: slot.time };
        activity.name = name;
        activity.category = category;

        // Keep the matching task in "Your plan" in sync
        let task = linkedTask(activity);
        if (addTaskBox.checked) {
            if (task) {
                task.name = name;
                task.when = when;
            } else {
                task = { id: Date.now() + 1, name, completed: false, when, activityId: activity.id };
                tasks.push(task);
                activity.taskId = task.id;
            }
        } else if (task) {
            tasks = tasks.filter(t => t.id !== task.id);
            delete activity.taskId;
        }

        if (!editing) activities.push(activity);
        dialog.close();
        saveActivities();
        saveTasks();         // also notifies the other pages
    });

    deleteBtn.addEventListener("click", () => {
        if (!editing) return;
        tasks = tasks.filter(t => t.id !== editing.taskId);
        activities = activities.filter(a => a.id !== editing.id);
        dialog.close();
        saveActivities();
        saveTasks();
    });

    document.getElementById("schedule-cancel").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });

displayActivities();

    displayTasks();


});


