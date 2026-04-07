/* ===== Budget Calculator JS ===== */

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const STORAGE_KEY = 'personal_budget_data';

// ---- Build data object ----
function collectBudgetData() {
  const data = {};
  document.querySelectorAll('.cell-input').forEach(inp => {
    const { section, category, item, month } = inp.dataset;
    const val = parseFloat(inp.value) || 0;
    if (!data[section]) data[section] = {};
    if (!data[section][category]) data[section][category] = {};
    if (!data[section][category][item]) data[section][category][item] = {};
    data[section][category][item][month] = val;
  });
  return data;
}

// ---- Format currency ----
function fmt(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---- Apply totals from server response ----
function applyTotals(result) {
  const catTotals = result.category_totals;

  // Category totals
  Object.entries(catTotals).forEach(([section, cats]) => {
    Object.entries(cats).forEach(([catKey, months]) => {
      MONTHS.forEach(m => {
        const cell = document.querySelector(`[data-total-month="${m}"][data-total-cat="${section}_${catKey}"]`);
        if (cell) cell.textContent = fmt(months[m] || 0);
      });
      const yearCell = document.querySelector(`[data-total-cat="${section}_${catKey}_year"]`);
      if (yearCell) yearCell.textContent = fmt(months['YEAR'] || 0);
    });
  });

  // Per-row year totals
  document.querySelectorAll('.cell-input').forEach(inp => {
    const { section, category, item } = inp.dataset;
    // sum all months for this row
    let rowYear = 0;
    MONTHS.forEach(m => {
      const cell = document.querySelector(
        `.cell-input[data-section="${section}"][data-category="${category}"][data-item="${item}"][data-month="${m}"]`
      );
      rowYear += parseFloat(cell?.value) || 0;
    });
    const yearCell = document.querySelector(`[data-total-row="${section}_${category}_${item}"]`);
    if (yearCell) yearCell.textContent = fmt(rowYear);
  });

  // Grand totals - expenses
  const exp = result.total_expenses;
  MONTHS.forEach(m => {
    const cell = document.getElementById(`grand_exp_${m}`);
    if (cell) cell.textContent = fmt(exp[m] || 0);
  });
  const expYear = document.getElementById('grand_exp_YEAR');
  if (expYear) expYear.textContent = fmt(exp['YEAR'] || 0);

  // Cash short/extra
  const cash = result.cash_short_extra;
  MONTHS.forEach(m => {
    const cell = document.getElementById(`cash_${m}`);
    if (cell) {
      const v = cash[m] || 0;
      cell.textContent = (v >= 0 ? '' : '-') + fmt(v);
      cell.classList.toggle('negative', v < 0);
    }
  });
  const cashYear = document.getElementById('cash_YEAR');
  if (cashYear) {
    const v = cash['YEAR'] || 0;
    cashYear.textContent = (v >= 0 ? '' : '-') + fmt(v);
    cashYear.classList.toggle('negative', v < 0);
  }

  // Summary bar
  const totalIncome = result.total_income['YEAR'] || 0;
  const totalExp = exp['YEAR'] || 0;
  const balance = cash['YEAR'] || 0;

  document.getElementById('summaryIncome').textContent = fmt(totalIncome);
  document.getElementById('summaryExpenses').textContent = fmt(totalExp);
  document.getElementById('summaryBalance').textContent = (balance >= 0 ? '' : '-') + fmt(balance);

  const balanceCard = document.querySelector('.summary-card.balance');
  balanceCard.classList.toggle('positive', balance >= 0);
  balanceCard.classList.toggle('negative', balance < 0);
}

// ---- Calculate (send to server) ----
async function calculate() {
  const budgetData = collectBudgetData();
  try {
    const res = await fetch('/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget_data: budgetData })
    });
    const result = await res.json();
    applyTotals(result);
    showToast('Calculated!', 'success');
  } catch (err) {
    showToast('Calculation failed', 'error');
    console.error(err);
  }
}

// ---- Save to localStorage ----
function saveData() {
  const data = collectBudgetData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  showToast('Saved locally!', 'success');
}

// ---- Load from localStorage ----
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.entries(data).forEach(([section, cats]) => {
      Object.entries(cats).forEach(([category, items]) => {
        Object.entries(items).forEach(([item, months]) => {
          Object.entries(months).forEach(([month, val]) => {
            if (!val) return;
            const inp = document.querySelector(
              `.cell-input[data-section="${section}"][data-category="${category}"][data-item="${item}"][data-month="${month}"]`
            );
            if (inp) {
              inp.value = val;
              inp.classList.toggle('has-value', val > 0);
            }
          });
        });
      });
    });
    calculate();
  } catch(e) { console.error('Load error', e); }
}

// ---- Clear all ----
function clearAll() {
  if (!confirm('Clear all budget data?')) return;
  document.querySelectorAll('.cell-input').forEach(inp => {
    inp.value = '';
    inp.classList.remove('has-value');
  });
  // Reset all total cells
  document.querySelectorAll('.total-cell, .year-total-cell, .grand-cell').forEach(c => {
    c.textContent = '₹0.00';
    c.classList.remove('negative');
  });
  document.getElementById('summaryIncome').textContent = '₹0.00';
  document.getElementById('summaryExpenses').textContent = '₹0.00';
  document.getElementById('summaryBalance').textContent = '₹0.00';
  localStorage.removeItem(STORAGE_KEY);
  showToast('Cleared!', 'success');
}

// ---- Toast ----
let toastTimer = null;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2200);
}

// ---- Live input handling ----
document.addEventListener('DOMContentLoaded', () => {
  // Mark inputs with values
  document.querySelectorAll('.cell-input').forEach(inp => {
    inp.addEventListener('input', () => {
      inp.classList.toggle('has-value', parseFloat(inp.value) > 0);
    });
    // Calculate on blur
    inp.addEventListener('change', () => {
      calculate();
    });
    // Tab through cells nicely
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const inputs = Array.from(document.querySelectorAll('.cell-input'));
        const idx = inputs.indexOf(inp);
        const next = inputs[idx + 1];
        if (next) next.focus();
      }
    });
  });

  // Buttons
  document.getElementById('calcBtn').addEventListener('click', calculate);
  document.getElementById('saveBtn').addEventListener('click', saveData);
  document.getElementById('clearBtn').addEventListener('click', clearAll);

  // Load saved data on start
  loadData();
});
