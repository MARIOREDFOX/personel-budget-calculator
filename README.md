# Personal Budget Calculator

A Flask-based web application that mirrors the Personal Budget Calculator Excel sheet — with full month-by-month tracking, automatic calculations, and a clean dark-themed UI.

## Features

- **All categories from the Excel sheet**: Revenue (Income), and Expenses (Home, Daily Living, Transportation, Entertainment, Health, Vacations, Recreation, Dues/Subscriptions, Personal, Financial Obligations, Misc Payments)
- **12-month columns** (JAN–DEC) + automatic YEAR totals
- **Live calculations** — values recalculate on every change
- **Per-row year totals**, per-category monthly/year totals, and grand totals
- **Cash short/extra** row = Total Income − Total Expenses
- **Summary bar** showing annual income, expenses, and balance at a glance
- **Save/Load** — data persists in browser localStorage
- **Indian Rupee (₹)** currency formatting

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the app

```bash
python app.py
```

### 3. Open in browser

```
http://127.0.0.1:5000
```

## Project Structure

```
budget_calculator/
├── app.py                  # Flask backend + calculation logic
├── requirements.txt
├── templates/
│   └── index.html          # Jinja2 template
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── budget.js       # Frontend logic, save/load, API calls
```

## How it works

1. Enter amounts in any monthly cell
2. Calculations run automatically on every change (or click **⚡ Calculate**)
3. Row year totals, category totals, and grand totals update instantly
4. Click **💾 Save** to persist data in your browser
5. Data reloads automatically on next visit
