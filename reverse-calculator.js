import {
  buildRequiredRevenueInsights,
  calculateRequiredRevenue,
  formatCurrency,
  parseNumber
} from './calculator-utils.js';

const form = document.getElementById('reverse-form');
const resultSection = document.getElementById('r-result-section');
const adBlock = document.getElementById('r-ad-block');
const formError = document.getElementById('r-form-error');

form.addEventListener('submit', function(e) {
  e.preventDefault();

  const expensesInput = document.getElementById('r-expenses');
  const salaryInput = document.getElementById('r-salary');
  const expensesValue = parseNumber(expensesInput.value);
  const salaryValue = parseNumber(salaryInput.value);
  const buffer = parseFloat(document.getElementById('r-buffer').value);
  const cash = parseNumber(document.getElementById('r-cash').value) || 0;
  const expenses = expensesValue || 0;
  const salary = salaryValue || 0;

  var hasError = false;

  if (expensesValue === null) {
    expensesInput.classList.add('has-error');
    hasError = true;
  } else {
    expensesInput.classList.remove('has-error');
  }

  if (salaryValue === null) {
    salaryInput.classList.add('has-error');
    hasError = true;
  } else {
    salaryInput.classList.remove('has-error');
  }

  if (hasError) {
    formError.hidden = false;
    return;
  }

  formError.hidden = true;

  const result = calculateRequiredRevenue({
    expenses: expenses,
    salary: salary,
    buffer: buffer,
    cashSaved: cash
  });

  document.getElementById('r-result-headline').textContent =
    'You should be making at least ' + formatCurrency(result.requiredRevenue) + '/month to hire safely.';

  document.getElementById('r-result-subtext').textContent =
    'This includes a ' + result.bufferPct + '% safety buffer. At this revenue level, you\'ll have ~' + formatCurrency(result.remaining) + ' remaining each month after all costs.';

  document.getElementById('r-bd-expenses').textContent = formatCurrency(result.expenses);
  document.getElementById('r-bd-salary').textContent = formatCurrency(result.salary);
  document.getElementById('r-bd-buffer-pct').textContent = result.bufferPct;
  document.getElementById('r-bd-buffer').textContent = formatCurrency(result.bufferAmount);
  document.getElementById('r-bd-required').textContent = formatCurrency(result.requiredRevenue);
  document.getElementById('r-bd-remaining').textContent = formatCurrency(result.remaining);

  const runwayRow = document.getElementById('r-bd-runway-row');
  if (cash > 0) {
    const monthlyShortfall = expenses + salary;
    const runway = Math.floor(cash / monthlyShortfall);
    document.getElementById('r-bd-runway').textContent = runway + ' month' + (runway !== 1 ? 's' : '') + ' of cash runway';
    runwayRow.hidden = false;
  } else {
    runwayRow.hidden = true;
  }

  const insights = document.getElementById('r-insights');
  insights.innerHTML = '';

  buildRequiredRevenueInsights(result).forEach(function(text) {
    const div = document.createElement('div');
    div.className = 'insight-item';
    div.textContent = text;
    insights.appendChild(div);
  });

  form.closest('.calculator-section').hidden = true;
  resultSection.hidden = false;
  adBlock.hidden = false;
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('r-reset-btn').addEventListener('click', function() {
  form.closest('.calculator-section').hidden = false;
  resultSection.hidden = true;
  adBlock.hidden = true;
  form.reset();
  form.closest('.calculator-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
