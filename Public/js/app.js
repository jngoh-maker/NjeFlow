// ==============================
// NJEFLOW - MAIN JAVASCRIPT
// ==============================


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

  const closingSection = document.querySelector(".closing-section")
  if (closingSection && closingSection.parentNode) {
    closingSection.parentNode.insertBefore(planSection, closingSection);
  } else {
    mainContent.appendChild(planSection);
  }

  
   // Get the input, button and task list
   const taskInput = document.getElementById("taskInput");
   const addTaskButton = document.getElementById("addTaskButton");
   const taskList = document.getElementById("taskList");

function saveTasks() {
    localStorage.setItem("njeflowTasks", JSON.stringify(tasks));
}

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

    const calendarForm = document.getElementById("calendar-form");
    const activityName = document.getElementById("activity-name");
    const activityDay = document.getElementById("activity-day");
    const activityTime = document.getElementById("activity-time");
    const activityCategory = document.getElementById("activity-category");

    function displayActivities() {
        document.querySelectorAll(".calendar .event").forEach(event => event.remove());
        const rows = document.querySelectorAll(".calendar-row");
        activities.forEach(activity => {
        rows.forEach(row => {
            if (row.children[0].textContent.trim() === activity.time) {
                const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                const dayIndex = days.indexOf(activity.day);
                const cell = row.children[dayIndex + 1];

                if (cell) {
                    const event = document.createElement("div");
                    event.className = "event " + activity.category;
                    event.textContent = activity.name;

                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "x";
                    deleteButton.type ="button";
                    deleteButton.addEventListener("click", function () {
                        activities = activities.filter(item => item.id !== activity.id);
                        localStorage.setItem("njeFlowActivities", JSON.stringify(activities));
                        displayActivities();
                    });

                    event.appendChild(deleteButton);
                    cell.appendChild(event);
                }
            }
        });
    });
    }

calendarForm.addEventListener("submit", function (event) {
    event.preventDefault();

    activities.push({
        id: Date.now(),
        name: activityName.value.trim(),
        day: activityDay.value,
        time: activityTime.value,
        category: activityCategory.value
    });

    localStorage.setItem("njeFlowActivities", JSON.stringify(activities));

    calendarForm.reset();
    displayActivities();
});

displayActivities();

    displayTasks();


});


