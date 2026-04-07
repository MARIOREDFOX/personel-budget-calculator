from flask import Flask, render_template, request, jsonify, session
import json

app = Flask(__name__)
app.secret_key = 'budget_calculator_secret_key_2024'

# Budget structure matching the Excel sheet
BUDGET_STRUCTURE = {
    "revenue": {
        "label": "REVENUE",
        "categories": {
            "income": {
                "label": "INCOME",
                "items": ["Wages", "Interest/dividends", "Miscellaneous"]
            }
        }
    },
    "expenses": {
        "label": "EXPENSES",
        "categories": {
            "home": {
                "label": "HOME",
                "items": ["Mortgage", "Insurance", "Repairs", "Services", "Utilities"]
            },
            "daily_living": {
                "label": "DAILY LIVING",
                "items": ["Groceries", "Child care", "Dry cleaning", "Dining out",
                          "Housecleaning service", "Dog walker"]
            },
            "transportation": {
                "label": "TRANSPORTATION",
                "items": ["Gas/fuel", "Insurance", "Repairs",
                          "Car wash/detailing services", "Parking", "Public transportation"]
            },
            "entertainment": {
                "label": "ENTERTAINMENT",
                "items": ["Cable TV", "Video/DVD rentals", "Movies/plays", "Concerts/clubs"]
            },
            "health": {
                "label": "HEALTH",
                "items": ["Health club dues", "Insurance", "Prescriptions",
                          "Over-the-counter drugs", "Co-payments/out-of-pocket",
                          "Veterinarians/pet medicines", "Life insurance"]
            },
            "vacations": {
                "label": "VACATIONS",
                "items": ["Plane fare", "Accommodations", "Food", "Souvenirs",
                          "Pet boarding", "Rental car"]
            },
            "recreation": {
                "label": "RECREATION",
                "items": ["Gym fees", "Sports equipment", "Team dues", "Toys/child gear"]
            },
            "dues_subscription": {
                "label": "DUES/SUBSCRIPTION",
                "items": ["Magazines", "Newspapers", "Internet connection", "Public radio",
                          "Public television", "Religious organizations", "Charity"]
            },
            "personal": {
                "label": "PERSONAL",
                "items": ["Clothing", "Gifts", "Salon/barber", "Books"]
            },
            "financial_obligations": {
                "label": "FINANCIAL OBLIGATIONS",
                "items": ["Long-term savings", "Retirement", "Credit card payments",
                          "Income tax (additional)", "Other obligations"]
            },
            "misc_payments": {
                "label": "MISC PAYMENTS",
                "items": ["Other 1", "Other 2", "Other 3", "Other 4", "Other 5"]
            }
        }
    }
}

MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
          "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]


@app.route('/')
def index():
    return render_template('index.html',
                           structure=BUDGET_STRUCTURE,
                           months=MONTHS)


@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    budget_data = data.get('budget_data', {})
    result = compute_totals(budget_data)
    return jsonify(result)


def compute_totals(budget_data):
    """
    budget_data format:
    {
      "section_key": {
        "category_key": {
          "item_name": {
            "JAN": 100, "FEB": 200, ...
          }
        }
      }
    }
    """
    totals = {}

    # Category totals per month + year
    for section_key, section in BUDGET_STRUCTURE.items():
        totals[section_key] = {}
        for cat_key, cat in section['categories'].items():
            cat_monthly = {m: 0.0 for m in MONTHS}
            for item in cat['items']:
                item_data = budget_data.get(section_key, {}).get(cat_key, {}).get(item, {})
                for month in MONTHS:
                    val = float(item_data.get(month, 0) or 0)
                    cat_monthly[month] += val
            cat_year = sum(cat_monthly.values())
            cat_monthly['YEAR'] = cat_year
            totals[section_key][cat_key] = cat_monthly

    # Total expenses per month
    expense_monthly = {m: 0.0 for m in MONTHS}
    for cat_key in BUDGET_STRUCTURE['expenses']['categories']:
        for month in MONTHS:
            expense_monthly[month] += totals['expenses'][cat_key][month]
    expense_monthly['YEAR'] = sum(expense_monthly[m] for m in MONTHS)

    # Total income per month
    income_monthly = {m: 0.0 for m in MONTHS}
    for cat_key in BUDGET_STRUCTURE['revenue']['categories']:
        for month in MONTHS:
            income_monthly[month] += totals['revenue'][cat_key][month]
    income_monthly['YEAR'] = sum(income_monthly[m] for m in MONTHS)

    # Cash short/extra
    cash_monthly = {}
    for month in MONTHS:
        cash_monthly[month] = income_monthly[month] - expense_monthly[month]
    cash_monthly['YEAR'] = income_monthly['YEAR'] - expense_monthly['YEAR']

    return {
        'category_totals': totals,
        'total_income': income_monthly,
        'total_expenses': expense_monthly,
        'cash_short_extra': cash_monthly
    }


if __name__ == '__main__':
    app.run(debug=True)
