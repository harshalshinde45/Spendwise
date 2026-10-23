# SpendWise Backend API

> Production-ready Node.js, Express, and MongoDB / Mongoose REST API service for SpendWise Personal Expense Tracker.

---

## 🛠️ Tech Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **ODM**: Mongoose
- **CORS & Utilities**: cors, dotenv

---

## 📋 API Reference

### Health Check
- `GET /api/health`
  - Returns server status and database connectivity (`connected` or `disconnected`).
  - Returns `200 OK`.

### Expenses
- `GET /api/expenses`
  - Query parameters:
    - `month`: Optional `YYYY-MM` filter
    - `category`: Optional category filter
    - `sort`: `date-desc` (default), `date-asc`, `amount-desc`, `amount-asc`
  - Returns `200 OK` with array of expense documents.
- `GET /api/expenses/:id`
  - Returns single expense document by ID.
  - Returns `200 OK` or `404 Not Found`.
- `POST /api/expenses`
  - Request body:
    ```json
    {
      "amountPaise": 4500,
      "category": "Food",
      "date": "2026-10-23",
      "description": "Lunch with team"
    }
    ```
  - Returns `201 Created` with created document.
- `PUT /api/expenses/:id`
  - Updates existing expense by ID.
  - Returns `200 OK` with updated document or `404 Not Found`.
- `DELETE /api/expenses/:id`
  - Deletes expense by ID.
  - Returns `200 OK` with `{ "message": "Expense deleted successfully.", "id": "..." }`.

### Monthly Budgets
- `GET /api/budgets`
  - Returns all budgets as a key-value dictionary: `{ "2026-10": 750000, ... }`.
- `GET /api/budgets/:month`
  - Returns budget for target month (`YYYY-MM`).
  - Returns `200 OK` with `{ "month": "2026-10", "amountPaise": 750000, "isSet": true }`.
- `PUT /api/budgets/:month`
  - Request body: `{ "amountPaise": 750000 }`
  - Upserts budget. If `amountPaise === 0`, removes the limit.
  - Returns `200 OK`.

### Analytics
- `GET /api/analytics/monthly/:month`
  - Returns real aggregated financial statistics for target month:
    - `totalSpentPaise`
    - `transactionCount`
    - `averageExpensePaise`
    - `budget` (`isSet`, `budgetPaise`, `remainingPaise`, `utilizationPercent`, `isOverBudget`, `statusLevel`)
    - `categoryBreakdown` (array of category aggregates with total spend, percentage share, count)
  - Returns `200 OK`.

### Migration & Maintenance
- `POST /api/migrate`
  - Body: `{ "expenses": [...], "budgets": { ... } }`
  - Imports client Local Storage records, preventing duplicate entries.
  - Returns `200 OK` with migration summary.
- `DELETE /api/data`
  - Permanently clears all expenses and budgets from MongoDB collections.
  - Returns `200 OK`.

---

## ⚙️ Configuration & Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your MongoDB Atlas connection string in `.env`:
   ```env
   PORT=5001
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/spendwise?retryWrites=true&w=majority
   CLIENT_ORIGIN=http://localhost:5173
   ```
3. Start the server:
   ```bash
   npm start
   # or with live reloading:
   npm run dev
   ```
   The server will start on `http://localhost:5001`. Test connectivity at `http://localhost:5001/api/health`.
4. Run tests:
   ```bash
   npm test
   ```
