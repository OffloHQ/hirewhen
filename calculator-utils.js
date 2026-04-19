export function parseNumber(value) {
  if (value === null || value === undefined) return null;
  var raw = String(value).trim();
  if (raw === '') return null;
  var num = parseFloat(raw);
  return isNaN(num) ? null : num;
}

export function formatCurrency(num) {
  var abs = Math.abs(num);
  var formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return (num < 0 ? '-' : '') + '$' + formatted;
}

export function classifyHireDecision(remaining) {
  if (remaining >= 200) return 'safe';
  if (remaining >= -500) return 'close';
  return 'risky';
}

export function calculateHireDecision(inputs) {
  var revenue = inputs.revenue;
  var expenses = inputs.expenses;
  var salary = inputs.salary;
  var addedRevenue = inputs.addedRevenue || 0;
  var cashSaved = inputs.cashSaved;
  var remaining = revenue - expenses - salary + addedRevenue;

  return {
    revenue: revenue,
    expenses: expenses,
    salary: salary,
    addedRevenue: addedRevenue,
    cashSaved: cashSaved,
    remaining: remaining,
    state: classifyHireDecision(remaining)
  };
}

export function buildHireInsights(result) {
  var items = [];
  var revenue = result.revenue;
  var expenses = result.expenses;
  var salary = result.salary;
  var addedRevenue = result.addedRevenue;
  var remaining = result.remaining;

  if (addedRevenue === 0 || addedRevenue === null) {
    var neededAdded = -(remaining - 200);
    if (neededAdded > 0) {
      items.push('If this hire brings in ' + formatCurrency(neededAdded) + '/month or more, hiring becomes sustainable.');
    }
  }

  if (remaining < 200) {
    var currentExpenses = expenses;
    var targetExpenses = revenue - salary - 200 + (addedRevenue || 0);
    var reduction = currentExpenses - targetExpenses;
    if (reduction > 0) {
      items.push('Reducing expenses by ' + formatCurrency(reduction) + '/month would make hiring viable.');
    }
  }

  if (remaining >= 200 && addedRevenue > 0) {
    items.push('With the added revenue from this hire, your margin looks healthy. Keep monitoring monthly cash flow as you scale.');
  }

  if (remaining >= 200 && (addedRevenue === 0 || addedRevenue === null)) {
    items.push('Your current cash flow can support this hire. Consider setting aside a 2-3 month salary buffer before onboarding.');
  }

  return items;
}

export function buildHireSummary(result) {
  var lines = [
    'HireWhen result: ' + result.state.toUpperCase(),
    'Revenue: ' + formatCurrency(result.revenue),
    'Expenses: ' + formatCurrency(result.expenses),
    'Salary: ' + formatCurrency(result.salary),
    'Remaining: ' + formatCurrency(result.remaining)
  ];

  if (result.cashSaved !== null && result.cashSaved !== undefined && result.remaining < 0) {
    var runway = result.cashSaved / Math.abs(result.remaining);
    lines.push('Estimated runway: ' + runway.toFixed(1) + ' months');
  }

  return lines.join('\n');
}

export function buildHireEmailBody(result, shareURL) {
  var body = [
    'I ran my numbers through HireWhen.',
    '',
    'Result: ' + result.state.toUpperCase(),
    'Revenue: ' + formatCurrency(result.revenue),
    'Expenses: ' + formatCurrency(result.expenses),
    'Salary: ' + formatCurrency(result.salary),
    'Remaining: ' + formatCurrency(result.remaining)
  ];

  if (result.cashSaved !== null && result.cashSaved !== undefined && result.remaining < 0) {
    var runway = result.cashSaved / Math.abs(result.remaining);
    body.push('Estimated runway: ' + runway.toFixed(1) + ' months');
  }

  body.push('', 'Review it here:', shareURL);
  return body.join('\n');
}

export function calculateRequiredRevenue(inputs) {
  var expenses = inputs.expenses;
  var salary = inputs.salary;
  var buffer = inputs.buffer;
  var cashSaved = inputs.cashSaved;
  var requiredRevenue = (expenses + salary) / (1 - buffer);
  var bufferAmount = requiredRevenue - expenses - salary;
  var remaining = requiredRevenue - expenses - salary;
  var bufferPct = Math.round(buffer * 100);

  return {
    expenses: expenses,
    salary: salary,
    buffer: buffer,
    bufferPct: bufferPct,
    cashSaved: cashSaved,
    requiredRevenue: requiredRevenue,
    bufferAmount: bufferAmount,
    remaining: remaining
  };
}

export function buildRequiredRevenueInsights(result) {
  var revenueGap = result.requiredRevenue * 0.2;
  var expenseReduction = result.requiredRevenue * 0.1;

  return [
    'If you increase revenue by ' + formatCurrency(revenueGap) + ', you\'d have a stronger buffer for hiring.',
    'Reducing expenses by ' + formatCurrency(expenseReduction) + ' would lower your required revenue to ' + formatCurrency(result.requiredRevenue - expenseReduction) + '.'
  ];
}
