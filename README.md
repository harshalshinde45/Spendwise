# SpendWise 🪙

> An intelligent, full-stack personal finance and expense management web application built with **React**, **Vite**, **Node.js**, **Express.js**, and **MongoDB / Mongoose**.

---

## 🌟 Overview & Key Features

SpendWise is a production-minded personal finance web application combining a **Money Command Center** and an **Activity-First Dashboard** with a warm editorial design system:

1. **Full-Stack REST Architecture**: Powered by a decoupled Node.js + Express backend and MongoDB database with Mongoose schemas.
2. **Accurate Monetary Calculations**: All amounts are strictly manipulated and stored in integer minor units (**paise**: ₹1 = 100 paise) on both backend and frontend to prevent floating-point inaccuracies.
3. **Money Command Center (Dashboard)**:
   - Real-time 3-metric financial summary: **Total Spent**, **Remaining Budget / Over Budget**, and **Budget Utilization**.
   - Spending progress bar and dynamic Smart Budget Alerts (Healthy, Caution, Low Budget, Budget Exhausted, Over Budget).
   - Spending activity trends over time (Daily / Weekly toggles).
   - Top Outflow Category, Spending Speedometer (burn rate pace vs. days elapsed), and Financial Weather status.
   - Recent transactions with inline edit, delete with confirmation, and instant totals updates.
4. **Activity-First Transactions Management**:
   - Fast, searchable transactions by description or category.
   - Filter by date range/month, category, and minimum/maximum amount.
   - Interactive active filter chips with one-click removal and Clear All.
   - Multi-field sorting (Newest, Oldest, Highest Amount, Lowest Amount).
   - Responsive desktop table and mobile-optimized card rows.
5. **Budgets & Planning Sandbox**:
   - Monthly target configuration and category spending distributions.
   - **Financial Time Machine**: Simulate hypothetical purchase decisions and evaluate budget impact before spending.
   - **Survival Budget Planner**: Plan discretionary allowances after reserving essentials.
6. **Savings Goals & Milestones**: Track user-defined financial ambitions with progress bars and future-self reminders.
7. **Accessibility & Responsive Design**: Semantic HTML, visible focus states, modal ESC-key handling, ARIA attributes, and responsive layouts across mobile, tablet, and desktop viewports.
8. **Theme Persistence**: Light and Dark mode using a distinctive warm editorial palette saved in localStorage.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, JavaScript (ES Modules), Plain CSS & CSS Custom Properties |
| **Backend** | Node.js (v18+), Express.js 4, Mongoose 8, CORS, Dotenv |
| **Database** | MongoDB Atlas / Local MongoDB instance |
| **Visualizations** | Recharts (Responsive Area, Donut, and Bar Charts) |
| **Icons** | Lucide React |
| **Testing** | Vitest (Frontend), Node.js Test Runner & Supertest (Backend) |

---

## 📁 Repository Structure

```text
Spendwise/
├── Frontend/                 # React + Vite Client Application
│   ├── src/
│   │   ├── components/       # Reusable UI components & modals
│   │   ├── pages/            # Overview, Transactions, Budgets, Analytics, Goals, Settings
│   │   ├── context/          # React Context (ExpenseContext)
│   │   ├── styles/           # Global design tokens and styles (variables.css, global.css)
│   │   ├── utils/            # Calculations, currency, dates, validation, intelligence
│   │   └── tests/            # Vitest unit test suites
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Node.js + Express + MongoDB REST API
│   ├── src/
│   │   ├── config/           # Database connection & connection state guards
│   │   ├── controllers/      # Expense, Budget, Goal, Analytics, Migration controllers
│   │   ├── models/           # Expense, MonthlyBudget, Goal Mongoose schemas
│   │   ├── routes/           # REST endpoints
│   │   ├── middleware/       # Centralized error handler & status handlers
│   │   ├── utils/            # Server validation
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # Server bootstrap
│   ├── test/                 # Backend automated tests
│   ├── .env.example          # Environment variables template
│   └── package.json
│
├── .gitignore                # Root gitignore protecting secrets and node_modules
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB Atlas** connection string or local MongoDB instance

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env

# Configure your environment variables in .env:
# PORT=5001
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/spendwise?retryWrites=true&w=majority
# CORS_ORIGIN=http://localhost:5173

# Start backend server in development mode
npm run dev
```

The backend server will run at `http://localhost:5001`.

---

### 3. Frontend Setup

In a new terminal window:

```bash
cd Frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## 🧪 Running Tests

### Frontend Tests (Vitest)
```bash
cd Frontend
npm test
```

### Backend Tests (Node.js Test Runner)
```bash
cd backend
npm test
```

---

## 📄 License

This project is licensed under the MIT License.
