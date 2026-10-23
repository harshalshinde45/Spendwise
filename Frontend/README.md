# SpendWise 🪙

> A full-stack personal expense tracker and budget management web application built with **React**, **Vite**, **Node.js**, **Express.js**, and **MongoDB / Mongoose**.

---

## 🌟 Overview & Key Principles

SpendWise is a production-quality personal finance application designed for students and individuals to record expenses, organize spending by category, set monthly target budgets, and visualize personal finance patterns.

### Core Architecture & Principles
1. **Full-Stack REST Architecture**: Powered by a decoupled Node.js + Express backend and MongoDB Atlas database with Mongoose ODM schemas.
2. **Accurate Money Calculations**: All monetary values are strictly stored and manipulated as integer minor units (**paise**: ₹1 = 100 paise) on both backend and frontend to eliminate binary floating-point rounding errors.
3. **Graceful Database Handling**: Honest connection management. If the database is disconnected, the application alerts the user, protects against silent data loss, and provides clean retry mechanisms.
4. **Safe Local Storage Migration**: Detects any existing client-side Local Storage data and provides a one-click migration path into MongoDB without duplicates. Harmless user preferences (such as Light / Dark theme) remain safely stored in Local Storage.
5. **Calm, Accessible Design**: Built with warm-neutral surfaces, sage-green accents, full keyboard accessibility, semantic HTML, and responsive layouts across desktop, tablet, and mobile.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, JavaScript (ES Modules), Plain CSS & CSS Custom Properties |
| **Backend** | Node.js (v18+), Express.js 4, Mongoose 8, CORS, Dotenv |
| **Database** | MongoDB Atlas (Cloud) / Local MongoDB instance |
| **Data Visualization** | Recharts (Responsive Donut & Bar Charts) |
| **Icons & Design** | Lucide React |
| **Testing** | Vitest (Frontend), Node.js Test Runner & Supertest (Backend) |

---

## 📁 Project Structure

```text
spendwise/
├── backend/                       # Node.js + Express + MongoDB Service
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # Mongoose connection management & 503 guard
│   │   ├── models/
│   │   │   ├── Expense.js         # Expense Mongoose model (integer paise)
│   │   │   └── MonthlyBudget.js   # MonthlyBudget model (unique per month)
│   │   ├── controllers/
│   │   │   ├── expenseController.js
│   │   │   ├── budgetController.js
│   │   │   ├── analyticsController.js
│   │   │   └── migrationController.js
│   │   ├── routes/
│   │   │   ├── expenseRoutes.js
│   │   │   ├── budgetRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── migrationRoutes.js
│   │   │   └── healthRoutes.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js    # Central error handler & sanitized responses
│   │   ├── utils/
│   │   │   └── validation.js      # Server-side validation rules
│   │   ├── app.js                 # Express app initialization & CORS
│   │   └── server.js              # Entry point & connection bootstrapper
│   ├── test/
│   │   └── backend.test.js        # Backend endpoint & validation test suite
│   ├── .env.example               # Backend environment template
│   ├── package.json
│   └── README.md
├── src/                           # Frontend React Application
│   ├── components/                # Reusable UI components
│   │   ├── AppLayout.jsx          # Shell with sidebar & mobile navigation
│   │   ├── DatabaseStatusBanner.jsx # Live connection status & migration prompt
│   │   ├── PageHeader.jsx         # Month navigation & "+ Add Expense" action
│   │   ├── SummaryCard.jsx        # Metric summary cards
│   │   ├── BudgetCard.jsx         # Visual budget progress bar & alerts
│   │   ├── ExpenseModal.jsx       # Add & Edit modal with field validation
│   │   ├── BudgetModal.jsx        # Monthly target budget modal
│   │   ├── TransactionList.jsx    # Transaction list with empty & no-results states
│   │   ├── TransactionItem.jsx    # Individual transaction row with actions
│   │   ├── SearchAndFilters.jsx   # Search input, category filter & sorting
│   │   ├── CategoryChart.jsx      # Recharts Donut/Bar charts & accessible legend
│   │   ├── ConfirmDialog.jsx      # Confirmation modal for destructive actions
│   │   └── Toast.jsx              # Accessible toast notifications (aria-live)
│   ├── context/
│   │   └── ExpenseContext.jsx     # Central state & REST API service coordinator
│   ├── services/                  # Reusable API service layer
│   │   ├── api.js                 # Central HTTP client & ApiError handler
│   │   ├── expenseService.js      # Expense CRUD API calls
│   │   ├── budgetService.js       # Budget API calls
│   │   └── analyticsService.js    # Health, Analytics & Migration API calls
│   ├── pages/
│   │   ├── DashboardPage.jsx      # Main financial overview
│   │   ├── TransactionsPage.jsx   # Searchable & filterable ledger
│   │   ├── AnalyticsPage.jsx      # Deep-dive category charts & table
│   │   └── SettingsPage.jsx       # Theme, Budget preferences & database controls
│   ├── styles/                    # Global CSS variables & Light/Dark tokens
│   ├── tests/
│   │   └── utils.test.js          # Pure calculation, validation & date tests
│   ├── App.jsx
│   └── main.jsx
├── vite.config.js                 # Vite config with /api proxy to port 5001
├── package.json                   # Root orchestrator scripts
└── README.md
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status & MongoDB connectivity indicator |
| `GET` | `/api/expenses` | Retrieve expenses (optional `?month=YYYY-MM&category=...&sort=...`) |
| `GET` | `/api/expenses/:id` | Retrieve single expense by MongoDB ID |
| `POST` | `/api/expenses` | Create new expense document after validation |
| `PUT` | `/api/expenses/:id` | Update existing expense document |
| `DELETE` | `/api/expenses/:id` | Remove expense document |
| `GET` | `/api/budgets` | Retrieve all configured monthly budgets map |
| `GET` | `/api/budgets/:month` | Retrieve budget for target month (`YYYY-MM`) |
| `PUT` | `/api/budgets/:month` | Create or update budget for target month (0 unsets) |
| `GET` | `/api/analytics/monthly/:month` | Real aggregated statistics, category breakdown & budget status |
| `POST` | `/api/migrate` | Import client Local Storage records without duplicates |
| `DELETE` | `/api/data` | Permanently clear all expenses and budgets from MongoDB |

---

## 🗄️ MongoDB Atlas Setup Guide

To connect SpendWise to a live MongoDB Atlas cluster, follow these steps:

### 1. Create a Free MongoDB Atlas Cluster
1. Sign in or create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a new project and select **Create a Deployment** (choose the free **M0 Shared** tier).
3. Select your preferred cloud provider and region.

### 2. Set Up Database Access (User Credentials)
1. In the Atlas dashboard, navigate to **Security** -> **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** authentication.
4. Enter a username (e.g. `spendwise_user`) and a secure password.
5. In **Database User Privileges**, select **Read and write to any database**.
6. Save the user.

### 3. Configure Network Access (IP Whitelist)
1. Navigate to **Security** -> **Network Access**.
2. Click **Add IP Address**.
3. For local development, choose **Allow Access From Anywhere** (`0.0.0.0/0`) or add your current IP address.
4. Confirm and wait for the status to become active.

### 4. Copy Your Connection String
1. Under **Deployments**, click **Connect** on your cluster.
2. Select **Drivers** (Node.js).
3. Copy the connection URI string. It looks like:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/spendwise?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your database user credentials.

---

## ⚙️ Installation & Running

### 1. Configure the Backend
Navigate to the `backend/` directory and configure the environment:
```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and paste your MongoDB Atlas connection string:
```env
PORT=5001
MONGODB_URI=mongodb+srv://spendwise_user:YOUR_PASSWORD@cluster0.abcde.mongodb.net/spendwise?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
```

Install backend dependencies:
```bash
npm install
```

Start the backend server:
```bash
npm start
# or for live reloading during development:
npm run dev
```
The server will start on `http://localhost:5001`. Test connectivity at `http://localhost:5001/api/health`.

### 2. Run the Frontend
In another terminal, from the project root:
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser. The Vite dev server proxies `/api` calls directly to `http://localhost:5001`.

---

## 🧪 Testing

### Run All Tests (Frontend + Backend)
```bash
npm run test:all
```

### Run Frontend Vitest Suite
```bash
npm test
```
Tests pure utility functions (currency formatting, calendar date validation, category calculations, budget utilization, and storage keys).

### Run Backend API Suite
```bash
npm run test:backend
```
Tests Mongoose validation schemas, calendar date boundary checking, input validation, and database guard middleware responses.

### Run Production Build Check
```bash
npm run build
```

---

## 🔄 Local Storage Migration Workflow

If you previously used SpendWise as a frontend-only app with stored expenses in your browser:
1. Open the application with the backend running and MongoDB connected.
2. SpendWise automatically detects your unmigrated records.
3. A banner appears: *"Local Storage Records Detected: Found X expenses and Y budgets. [Migrate to MongoDB]"*.
4. Clicking **Migrate to MongoDB** sends the payload to `/api/migrate`.
5. The backend validates every record and prevents duplicate imports.
6. Once the database confirms receipt, the frontend refreshes state from MongoDB and clears the old expense keys from `localStorage`.
7. Your theme preference remains untouched.

---

## 🔒 Limitations & Security Considerations

- **Single-User Mode**: This version is built for single-user personal development. The Mongoose models include a `userId` field to facilitate a clean migration to multi-user authentication (JWT / OAuth).
- **Environment Isolation**: Database credentials are kept strictly on the backend in `backend/.env` and are never exposed to the frontend bundle or client network responses.
