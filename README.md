# NjeFlow

**A calm, all-in-one workspace for planning, focus, meals, and daily wellness.**

## Overview

NjeFlow brings the important parts of everyday life into one focused workspace. Create your schedule, manage tasks, run a focus timer, discover meals, track groceries, monitor water intake, and build habits without switching between multiple apps.

The goal is simple: make progress feel achievable through structure, consistency, and small steps.

## Live Demo

**Live app:** [https://www.julianangoh.tech](https://www.julianangoh.tech/)

**YouTube demo:** [https://youtu.be/758Y9rij7ng](https://youtu.be/758Y9rij7ng)

## Features

### Plan
- Create and organise tasks
- Set priorities and due dates
- Schedule activities across a weekly calendar
- Filter tasks by completion status
- Quickly add tasks from the dashboard

### Focus
- Use an adjustable Pomodoro timer
- Work in focus, short-break, or long-break modes
- Select a task and optionally mark it complete
- Track focus sessions, minutes, and streaks
- Monitor daily progress at a glance

### Eat
- Search for recipes by meal name
- Browse results by category
- Save favourite meals
- View ingredients and cooking instructions
- Build and manage a grocery list

### Wellness
- Track daily water intake
- Set a personalised water goal
- Record daily mood and optional notes
- Review the previous seven days
- Create habits and monitor completion streaks

### Weather
- Search forecasts by city
- Filter by weather conditions
- Sort forecasts by date or temperature
- Use weather details to plan your day

### Dashboard
- View upcoming tasks
- Review today's schedule
- Check live weather
- Monitor focus and wellness progress
- Access every workspace module from one place

## Tech Stack

| Technology | Purpose |
| --- | --- |
| HTML5 | Application structure |
| CSS3 | Responsive layouts and visual styling |
| JavaScript | Client-side functionality |
| Node.js | Server runtime |
| Express.js | Routing and API endpoints |
| OpenWeather API | Weather forecasts |
| Nager.Date API | Public holiday and country data |
| TheMealDB API | Recipe and meal information |
| Local Storage | Browser-side data persistence |
| Git and GitHub | Version control and collaboration |

## Architecture

NjeFlow uses a lightweight client-server architecture:

- The browser delivers the HTML, CSS, and JavaScript interface.
- Express serves the application and exposes backend API routes.
- Server-side routes communicate with external APIs.
- API responses are cached in memory to reduce repeated requests.
- Local Storage keeps personal planning and wellness data in the browser.

```text
NjeFlow
├── Public
│   ├── css
│   │   └── styles.css
│   ├── js
│   │   ├── app.js
│   │   ├── features.js
│   │   ├── focus.js
│   │   ├── eat.js
│   │   ├── wellness.js
│   │   └── overview.js
│   ├── index.html
│   ├── plan.html
│   ├── focus.html
│   ├── eat.html
│   └── wellness.html
├── server.js
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Clone the Repository

```bash
git clone https://github.com/jngoh-maker/NjeFlow.git
cd NjeFlow
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000
HOST=0.0.0.0
WEATHER_KEY=your_openweather_api_key
```

An example configuration is available in `.env.example`.

Keep API keys and credentials outside public code.

### Run the Application

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Server health check |
| GET | `/api/weather?city=Kigali` | Weather forecast |
| GET | `/api/holidays?year=2026&country=RW` | Public holidays |
| GET | `/api/countries` | Available countries |
| GET | `/api/meals?q=chicken` | Meal search |

## Data Persistence

NjeFlow stores app data in the browser using Local Storage. Available data includes:

- Tasks and schedule entries
- Focus sessions and timer settings
- Favourite recipes
- Grocery items
- Water and habit progress
- Mood records

Data remains local to the browser and is not connected to a cloud database.

## Responsive Design

The interface adapts to:

- Desktop computers
- Tablets
- Mobile phones
- Different browser widths and screen sizes

## Testing

The application can be tested by verifying:

- Task creation, editing, and completion
- Schedule entry creation and deletion
- Focus timer controls and session tracking
- Recipe search, favourites, and grocery management
- Water, mood, and habit updates
- Weather and holiday API responses
- Navigation between all app modules
- Layout behaviour across screen sizes

## Deployment

The repository includes deployment configuration under `deploy/`. The application is designed to run on a Node.js web server behind a load balancer, with environment variables supplied through the hosting platform.

Set at least the following environment variable in production:

```env
WEATHER_KEY=your_openweather_api_key
```

## Roadmap

- Add secure account authentication
- Introduce cloud-based data synchronisation
- Support account access across devices
- Add automated reminders and notifications
- Expand financial planning tools
- Add charts and long-term personal analytics
- Introduce personalised recommendations
- Expand integrations with third-party services
- Improve accessibility and internationalisation
- Add an automated test suite

## Author

**Juliana Ngoh**

Software Engineering Student  
African Leadership University

## Closing

NjeFlow brings planning, productivity, food, finance, and wellness into one place. It is designed to help users build better routines through small, consistent steps.

**Your life. Your pace. Your flow.**
