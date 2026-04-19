import {
  buildHireEmailBody,
  buildHireInsights,
  buildHireSummary,
  calculateHireDecision,
  formatCurrency,
  parseNumber
} from './calculator-utils.js';

const form = document.getElementById('hire-form');
const addsRevenueRadios = document.querySelectorAll('input[name="adds-revenue"]');
const addedRevenueGroup = document.getElementById('added-revenue-group');
const addedRevenueInput = document.getElementById('added-revenue');
const formError = document.getElementById('form-error');

const resultSection = document.getElementById('result-section');
const resultCard = document.getElementById('result-card');
const resultBadge = document.getElementById('result-badge');
const resultHeadline = document.getElementById('result-headline');
const resultSubtext = document.getElementById('result-subtext');

const bdRevenue = document.getElementById('bd-revenue');
const bdExpenses = document.getElementById('bd-expenses');
const bdSalary = document.getElementById('bd-salary');
const bdAddedRow = document.getElementById('bd-added-row');
const bdAdded = document.getElementById('bd-added');
const bdRemaining = document.getElementById('bd-remaining');
const bdRunwayRow = document.getElementById('bd-runway-row');
const bdRunway = document.getElementById('bd-runway');

const insightsEl = document.getElementById('insights');
const resetBtn = document.getElementById('reset-btn');

const shareActions = document.getElementById('share-actions');
const copyLinkBtn = document.getElementById('copy-link-btn');
const copySummaryBtn = document.getElementById('copy-summary-btn');
const emailBtn = document.getElementById('email-btn');
const shareFeedback = document.getElementById('share-feedback');

var lastResult = null;

document.querySelectorAll('.hint-trigger').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    var targetId = btn.getAttribute('data-hint');
    var panel = document.getElementById(targetId);
    var isOpen = !panel.hidden;

    document.querySelectorAll('.hint-panel').forEach(function(p) { p.hidden = true; });
    document.querySelectorAll('.hint-trigger').forEach(function(b) { b.classList.remove('hint-trigger--active'); });

    if (!isOpen) {
      panel.hidden = false;
      btn.classList.add('hint-trigger--active');
    }
  });
});

function syncAddedRevenueVisibility() {
  var checked = document.querySelector('input[name="adds-revenue"]:checked');
  if (checked && checked.value === 'yes') {
    addedRevenueGroup.hidden = false;
  } else {
    addedRevenueGroup.hidden = true;
    addedRevenueInput.value = '';
  }
}

addsRevenueRadios.forEach(function(radio) {
  radio.addEventListener('change', syncAddedRevenueVisibility);
});

syncAddedRevenueVisibility();

function getVal(id) {
  return parseNumber(document.getElementById(id).value);
}

form.addEventListener('submit', function(e) {
  e.preventDefault();

  var revenue = getVal('revenue');
  var expenses = getVal('expenses');
  var salary = getVal('salary');
  var cashSaved = getVal('cash-saved');
  var addsRevenue = document.querySelector('input[name="adds-revenue"]:checked').value;
  var addedRevenue = addsRevenue === 'yes' ? (getVal('added-revenue') || 0) : 0;

  var hasError = false;

  ['revenue', 'expenses', 'salary'].forEach(function(id) {
    var el = document.getElementById(id);
    if (getVal(id) === null) {
      el.classList.add('has-error');
      hasError = true;
    } else {
      el.classList.remove('has-error');
    }
  });

  if (hasError) {
    formError.hidden = false;
    return;
  }

  formError.hidden = true;

  var result = calculateHireDecision({
    revenue: revenue,
    expenses: expenses,
    salary: salary,
    addedRevenue: addedRevenue,
    cashSaved: cashSaved
  });
  var remaining = result.remaining;
  var state = result.state;

  var headlines = {
    safe: 'You can afford to hire right now',
    close: "You're close to being able to hire",
    risky: 'Hiring right now could put your business at risk'
  };

  var subtexts = {
    safe: 'Your current revenue and expenses leave enough room to comfortably cover this salary.',
    close: "Your numbers are tight. A small improvement in revenue or expenses could make hiring a clear yes.",
    risky: "Your monthly cash flow doesn't yet support this salary. Consider growing revenue or reducing costs first."
  };

  resultCard.className = 'result-card ' + state;
  resultBadge.className = 'result-badge ' + state;
  resultBadge.textContent = state.toUpperCase();
  resultHeadline.className = 'result-headline ' + state;
  resultHeadline.textContent = headlines[state];
  resultSubtext.textContent = subtexts[state];

  bdRevenue.textContent = formatCurrency(revenue);
  bdExpenses.textContent = formatCurrency(expenses);
  bdSalary.textContent = formatCurrency(salary);

  if (addedRevenue > 0) {
    bdAddedRow.hidden = false;
    bdAdded.textContent = '+' + formatCurrency(addedRevenue);
  } else {
    bdAddedRow.hidden = true;
  }

  bdRemaining.textContent = formatCurrency(remaining);
  bdRemaining.className = 'breakdown-value ' + (remaining >= 0 ? 'positive' : 'negative');

  if (cashSaved !== null && remaining < 0) {
    var runwayMonths = cashSaved / Math.abs(remaining);
    bdRunwayRow.hidden = false;
    bdRunway.textContent = runwayMonths.toFixed(1) + ' months';
  } else {
    bdRunwayRow.hidden = true;
  }

  var insights = buildHireInsights(result);
  insightsEl.innerHTML = '';
  insights.forEach(function(text) {
    var div = document.createElement('div');
    div.className = 'insight-item';
    div.textContent = text;
    insightsEl.appendChild(div);
  });

  lastResult = {
    state: state,
    revenue: revenue,
    expenses: expenses,
    salary: salary,
    addedRevenue: addedRevenue,
    remaining: remaining,
    cashSaved: cashSaved,
    addsRevenue: addsRevenue
  };

  updateShareURL(revenue, expenses, salary, cashSaved, addsRevenue, addedRevenue);
  updateEmailLink(state, revenue, expenses, salary, remaining, cashSaved);

  shareActions.hidden = false;
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

resetBtn.addEventListener('click', function() {
  resultSection.hidden = true;
  shareActions.hidden = true;
  document.getElementById('calculator').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function updateShareURL(revenue, expenses, salary, cashSaved, addsRevenue, addedRevenue) {
  var params = new URLSearchParams();
  params.set('revenue', revenue);
  params.set('expenses', expenses);
  params.set('salary', salary);
  if (cashSaved !== null) params.set('cash', cashSaved);
  params.set('adds', addsRevenue);
  if (addsRevenue === 'yes' && addedRevenue > 0) params.set('added', addedRevenue);
  var url = window.location.origin + window.location.pathname + '?' + params.toString();
  history.replaceState(null, '', url);
}

function buildShareURL() {
  return window.location.href;
}

function buildSummaryText(state, revenue, expenses, salary, remaining, cashSaved) {
  return buildHireSummary({
    state: state,
    revenue: revenue,
    expenses: expenses,
    salary: salary,
    remaining: remaining,
    cashSaved: cashSaved
  });
}

function updateEmailLink(state, revenue, expenses, salary, remaining, cashSaved) {
  var shareURL = buildShareURL();
  var body = buildHireEmailBody({
    state: state,
    revenue: revenue,
    expenses: expenses,
    salary: salary,
    remaining: remaining,
    cashSaved: cashSaved
  }, shareURL);
  emailBtn.href = 'mailto:?subject=' + encodeURIComponent('HireWhen Result') + '&body=' + encodeURIComponent(body);
}

function showFeedback(msg) {
  shareFeedback.textContent = msg;
  shareFeedback.hidden = false;
  clearTimeout(shareFeedback._timer);
  shareFeedback._timer = setTimeout(function() {
    shareFeedback.hidden = true;
  }, 2500);
}

copyLinkBtn.addEventListener('click', function() {
  navigator.clipboard.writeText(buildShareURL()).then(function() {
    showFeedback('Share link copied');
  });
});

copySummaryBtn.addEventListener('click', function() {
  if (!lastResult) return;
  var text = buildSummaryText(lastResult.state, lastResult.revenue, lastResult.expenses, lastResult.salary, lastResult.remaining, lastResult.cashSaved);
  navigator.clipboard.writeText(text).then(function() {
    showFeedback('Summary copied');
  });
});

function prefillFromParams() {
  var params = new URLSearchParams(window.location.search);
  if (!params.has('revenue') || !params.has('expenses') || !params.has('salary')) return;

  var revenue = params.get('revenue');
  var expenses = params.get('expenses');
  var salary = params.get('salary');
  var cash = params.get('cash');
  var adds = params.get('adds');
  var added = params.get('added');
  var yesRadio = document.querySelector('input[name="adds-revenue"][value="yes"]');
  var noRadio = document.querySelector('input[name="adds-revenue"][value="no"]');

  document.getElementById('revenue').value = revenue;
  document.getElementById('expenses').value = expenses;
  document.getElementById('salary').value = salary;
  if (cash !== null) document.getElementById('cash-saved').value = cash;

  if (adds === 'yes') {
    if (yesRadio) yesRadio.checked = true;
    syncAddedRevenueVisibility();
    if (added !== null) addedRevenueInput.value = added;
  } else {
    if (noRadio) noRadio.checked = true;
    syncAddedRevenueVisibility();
  }

  form.dispatchEvent(new Event('submit'));
}

prefillFromParams();
