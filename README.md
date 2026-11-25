# NjeFlow – Personal Life Management Platform

**Plan your days. Stay focused. Eat better. Manage your money. Take care of yourself.**

## 1. Project Overview

NjeFlow is an all-in-one personal life-management web application designed to help individuals organise their daily activities and manage different aspects of their lives from one central workspace.

The platform brings together five essential areas of everyday life: planning, productivity, meal management, personal finance and wellness.

Instead of switching between multiple applications, users can use NjeFlow to organise their schedules, manage responsibilities, make informed decisions and develop healthier routines.

NjeFlow is built around the idea that meaningful progress comes from taking small, consistent steps.

## 2. Project Objectives

The main objectives of NjeFlow are to:

- Simplify daily planning and task management.
- Improve productivity through structured focus tools.
- Encourage balanced eating and organised meal preparation.
- Support responsible spending and financial planning.
- Promote healthy habits and personal well-being.
- Provide a responsive and accessible user experience across devices.

## 3. Key Features

### 3.1 Overview Dashboard
- Centralised dashboard providing an overview of daily activities.
- Quick access to the five main application modules.
- At-a-glance information to help users stay organised.

### 3.2 Plan – Daily Planning and Organisation
- Create, edit and delete personal tasks.
- Assign due dates and priority levels.
- Mark tasks as completed or pending.
- Filter tasks by completion status.
- Organise tasks according to due dates.
- View public holidays by selecting a country and year.

### 3.3 Focus – Productivity and Time Management
- Tools to organise tasks and improve concentration.
- Focus sessions to encourage productive work.
- Support for breaking down responsibilities into manageable activities.

### 3.4 Eat – Meal Planning and Food Organisation
- Organise meals for different times of the day.
- Explore meal ideas and recipes.
- Manage food ingredients and kitchen supplies.
- Create grocery shopping lists.
- Support healthier food choices and meal preparation.

### 3.5 Money – Personal Finance Management
- Record income and expenses.
- Organise spending and monitor financial activity.
- Set and manage budgets.
- Track savings goals.
- Develop better financial management habits.

### 3.6 Wellness – Personal Well-being
- Track daily water intake.
- Monitor personal habits.
- Set wellness goals.
- Encourage consistent self-care routines.

## 4. Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and responsive layouts |
| JavaScript | Frontend functionality and interactivity |
| Node.js | Backend runtime environment |
| Express.js | Server and API development |
| REST APIs | Communication with external services |
| Local Storage | Browser-side data persistence |
| Git and GitHub | Version control and source code management |

## 5. External API Integration

NjeFlow integrates external services to provide additional functionality.

- **Public Holidays API:** Retrieves public holiday information according to the selected country and year.
- **Weather API:** Retrieves weather information to help users consider weather conditions when organising their activities.

API requests are handled through the backend where applicable, keeping sensitive configuration values out of the frontend.

## 6. Responsive Design

NjeFlow is designed to provide a consistent experience across different screen sizes.

The interface supports:

- Desktop computers.
- Tablets.
- Mobile phones.

Responsive CSS layouts, flexible grids and mobile-specific styling ensure that application components adapt to different screen dimensions.

## 7. Application Architecture

NjeFlow follows a client-server architecture.

- **Frontend:** HTML, CSS and JavaScript provide the user interface and application interactions.
- **Backend:** Node.js and Express.js handle server operations and API requests.
- **External services:** REST APIs provide additional information and functionality.
- **Browser storage:** Local Storage supports persistence of relevant user data.

## 8. Project Structure

```text
NjeFlow/
│
├── public/
│   ├── css/
│   │   └── styles.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   └── plan.js
│   │
│   ├── index.html
│   ├── plan.html
│   ├── focus.html
│   ├── eat.html
│   ├── save.html
│   └── wellness.html
│
├── server.js
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

## 9. Installation and Setup

### Prerequisites

Ensure the following tools are installed:

- Node.js
- npm
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/jngoh-maker/NjeFlow.git
```

### Step 2: Navigate to the Project

```bash
cd NjeFlow
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root and configure the required environment variables using `.env.example` as a reference.

Never expose private API keys or credentials in public repositories.

### Step 5: Start the Application

```bash
npm start
```

### Step 6: Open NjeFlow

Visit the following address in your browser:

```text
http://localhost:3000
```

## 10. Testing and Quality Assurance

The application is tested through functional and usability checks to ensure that:

- Users can interact with application features.
- Forms accept valid input and handle invalid input appropriately.
- Tasks can be created, updated, completed and deleted.
- External API requests return the expected information.
- Application layouts adapt to different screen sizes.
- Backend routes respond appropriately.
- Navigation between application modules works correctly.

## 11. Deployment

NjeFlow uses a web deployment architecture designed to support application availability and traffic distribution.

The deployment setup includes:

- **Web01:** First application web server.
- **Web02:** Second application web server.
- **Lb01:** Load balancer responsible for distributing incoming requests between the web servers.

**Live Application:** [Insert deployed URL]

## 12. Future Development

Although NjeFlow provides an integrated foundation for personal life management, potential improvements include:

- Secure user authentication and individual accounts.
- Cloud-based data synchronisation.
- Cross-device access to personal information.
- Automated reminders and notifications.
- More advanced analytics and personalised recommendations.
- Expanded integrations with external services.

## 13. Author

**Juliana Ngoh**  
Software Engineering Student  
African Leadership University

**GitHub:** [jngoh-maker](https://github.com/jngoh-maker)

## 14. Conclusion

NjeFlow demonstrates how web technologies can be combined to create a practical solution to everyday organisation challenges.

By bringing planning, productivity, nutrition, financial management and wellness into one platform, NjeFlow encourages users to take control of their routines and make progress towards their personal goals.

**NjeFlow – Small steps count.**
