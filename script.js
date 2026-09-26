const STORAGE_KEY = 'sakuku-data-v1';

const incomeOptions = [
  'bulanan',
  'lainnya'
];

const expenseOptions = [
  'investasi',
  'makanan dan minuman',
  'kebutuhan',
  'bensin',
  'kos',
  'lain lain'
];

const defaultTransactions = [
  { id: crypto.randomUUID(), type: 'income', category: 'bulanan', description: 'Gaji bulan September', amount: 3500000, date: '2026-09-01T08:00:00.000Z' },
  { id: crypto.randomUUID(), type: 'expense', category: 'kos', description: 'Sewa kos', amount: 900000, date: '2026-09-02T08:00:00.000Z' },
  { id: crypto.randomUUID(), type: 'expense', category: 'makanan dan minuman', description: 'Makan siang', amount: 35000, date: '2026-09-03T12:30:00.000Z' },
  { id: crypto.randomUUID(), type: 'expense', category: 'bensin', description: 'Isi bensin', amount: 50000, date: '2026-09-04T07:00:00.000Z' },
  { id: crypto.randomUUID(), type: 'expense', category: 'investasi', description: 'Investasi reksa dana', amount: 500000, date: '2026-09-08T09:00:00.000Z' },
  { id: crypto.randomUUID(), type: 'income', category: 'lainnya', description: 'Uang tambahan dari freelance', amount: 700000, date: '2026-09-12T11:30:00.000Z' },
  { id: crypto.randomUUID(), type: 'expense', category: 'kebutuhan', description: 'Belanja bulanan', amount: 230000, date: '2026-09-18T15:00:00.000Z' },
  { id: crypto.randomUUID(), type: 'expense', category: 'lain lain', description: 'Kebutuhan tak terduga', amount: 120000, date: '2026-09-21T19:00:00.000Z' },
  { id: crypto.randomUUID(), type: 'income', category: 'bulanan', description: 'Bonus', amount: 250000, date: '2026-08-28T10:00:00.000Z' },
  { id: crypto.randomUUID(), type: 'expense', category: 'makanan dan minuman', description: 'Kopi dan makan malam', amount: 95000, date: '2026-08-14T20:00:00.000Z' },
  { id: crypto.randomUUID(), type: 'expense', category: 'kos', description: 'Sewa kos', amount: 900000, date: '2026-08-02T08:00:00.000Z' }
];

const state = {
  selectedType: 'income',
  selectedMonth: getCurrentMonthKey(),
  transactions: loadTransactions(),
  editingId: null
};

const transactionForm = document.getElementById('transaction-form');
const categorySelect = document.getElementById('category');
const typeButtons = document.querySelectorAll('.segment-button');
const monthSelect = document.getElementById('month-select');
const reportStart = document.getElementById('report-start');
const reportEnd = document.getElementById('report-end');
const cancelEditButton = document.getElementById('cancel-edit');
const navButtons = document.querySelectorAll('.nav-button');
const views = {
  'home-view': document.getElementById('home-view'),
  'report-view': document.getElementById('report-view')
};

init();

function init() {
  setFormByType(state.selectedType);
  populateMonthSelector();
  setupNavigation();
  bindEvents();
  renderAll();
}

function bindEvents() {
  typeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.type;
      state.selectedType = type;
      setFormByType(type);
      typeButtons.forEach((item) => item.classList.toggle('active', item === button));
    });
  });

  monthSelect.addEventListener('change', (event) => {
    state.selectedMonth = event.target.value;
    renderChart();
    renderOverview();
  });

  transactionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(transactionForm);
    const amount = Number(formData.get('amount'));
    const category = String(formData.get('category') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const transactionDate = String(formData.get('transaction-date') || '').trim();

    if (!amount || amount <= 0) {
      alert('Nominal harus lebih dari 0.');
      return;
    }

    if (!category) {
      alert('Pilih kategori terlebih dahulu.');
      return;
    }

    if (!transactionDate) {
      alert('Pilih tanggal transaksi terlebih dahulu.');
      return;
    }

    if (state.selectedType === 'income' && category === 'lainnya' && !description) {
      alert('Untuk kategori lainnya, mohon tambahkan deskripsi.');
      return;
    }

    if (state.selectedType === 'expense' && category === 'investasi' && !description) {
      if (!window.confirm('Investasi tidak memiliki deskripsi. Simpan transaksi ini?')) {
        return;
      }
    }

    const payload = {
      type: state.selectedType,
      category,
      description: description || (state.selectedType === 'income' ? 'Pemasukan' : 'Pengeluaran'),
      amount,
      date: new Date(`${transactionDate}T12:00:00`).toISOString()
    };

    if (state.editingId) {
      const index = state.transactions.findIndex((transaction) => transaction.id === state.editingId);
      if (index >= 0) {
        state.transactions[index] = { ...state.transactions[index], ...payload };
      }
    } else {
      state.transactions.push({ id: crypto.randomUUID(), ...payload });
    }

    saveTransactions();
    transactionForm.reset();
    resetEditMode();
    setFormByType(state.selectedType);
    syncReportRange();
    renderAll();
  });

  cancelEditButton.addEventListener('click', () => {
    resetEditMode();
    transactionForm.reset();
    setFormByType(state.selectedType);
  });

  reportStart.addEventListener('change', renderReport);
  reportEnd.addEventListener('change', renderReport);
}

function setupNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      navButtons.forEach((item) => item.classList.toggle('active', item === button));
      Object.entries(views).forEach(([key, section]) => {
        section.classList.toggle('active', key === target);
      });
    });
  });
}

function renderAll() {
  renderOverview();
  renderChart();
  renderRecentTransactions();
  renderReport();
}

function renderOverview() {
  const currentMonthTransactions = getMonthlyTransactions(state.selectedMonth);
  const totalSaldo = getTotalSaldo();
  const nilaiInvestasi = getInvestmentValue();
  const totalKepemilikan = totalSaldo + nilaiInvestasi;
  const monthlyExpense = getMonthlyTotal('expense', state.selectedMonth);

  document.getElementById('total-saldo').textContent = formatCurrency(totalSaldo);
  document.getElementById('total-kepemilikan').textContent = formatCurrency(totalKepemilikan);
  document.getElementById('nilai-investasi').textContent = formatCurrency(nilaiInvestasi);
  document.getElementById('pengeluaran-bulan').textContent = formatCurrency(monthlyExpense);
}

function renderChart() {
  const ctx = document.getElementById('expense-chart');
  const daysInMonth = getDaysInMonth(state.selectedMonth);
  const labels = Array.from({ length: daysInMonth }, (_, index) => String(index + 1));
  const values = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const monthKey = state.selectedMonth;
    return getDailyExpense(monthKey, day);
  });

  if (window.expenseChartInstance) {
    window.expenseChartInstance.destroy();
  }

  window.expenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pengeluaran',
        data: values,
        borderRadius: 10,
        borderSkipped: false,
        backgroundColor: 'rgba(114, 183, 255, 0.7)',
        borderColor: 'rgba(74, 144, 217, 0.9)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => formatCurrency(context.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            color: '#5d7b97',
            font: {
              size: 10
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#5d7b97',
            callback: (value) => {
              if (value >= 1000000) return `Rp ${Math.round(value / 1000000)}jt`;
              if (value >= 1000) return `Rp ${Math.round(value / 1000)}rb`;
              return `Rp ${value}`;
            }
          },
          grid: { color: 'rgba(151, 176, 214, 0.12)' }
        }
      }
    }
  });
}

function renderRecentTransactions() {
  const list = document.getElementById('recent-transactions');
  const transactions = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (!transactions.length) {
    list.innerHTML = '<div class="empty-state">Belum ada transaksi.</div>';
    return;
  }

  list.innerHTML = transactions.map((transaction) => {
    const typeLabel = transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    const amountClass = transaction.type === 'income' ? 'income' : 'expense';
    const dateString = formatDate(transaction.date);

    return `
      <div class="transaction-item ${amountClass}" data-id="${transaction.id}">
        <div class="icon-bubble">${transaction.type === 'income' ? '+' : '-'}</div>
        <div class="transaction-meta">
          <strong>${formatCategoryLabel(transaction.category)}</strong>
          <span>${transaction.description || typeLabel} • ${typeLabel} • ${dateString}</span>
        </div>
        <div class="amount">${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}</div>
        <div class="transaction-actions">
          <button class="icon-button edit" type="button" data-action="edit" data-id="${transaction.id}" aria-label="Edit transaksi">✎</button>
          <button class="icon-button delete" type="button" data-action="delete" data-id="${transaction.id}" aria-label="Hapus transaksi">🗑</button>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => handleEditTransaction(button.dataset.id));
  });

  list.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => handleDeleteTransaction(button.dataset.id));
  });
}

function renderReport() {
  const start = reportStart.value || getEarliestDate();
  const end = reportEnd.value || getLatestDate();

  if (!start || !end) {
    return;
  }

  const filtered = state.transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    const value = date.toISOString().slice(0, 10);
    return value >= start && value <= end;
  });

  const incomeTotal = filtered
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseTotal = filtered
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const net = incomeTotal - expenseTotal;

  document.getElementById('report-income').textContent = formatCurrency(incomeTotal);
  document.getElementById('report-expense').textContent = formatCurrency(expenseTotal);
  document.getElementById('report-balance').textContent = formatCurrency(net);

  const list = document.getElementById('report-list');

  if (!filtered.length) {
    list.innerHTML = '<div class="empty-state">Belum ada transaksi pada rentang waktu ini.</div>';
    return;
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  list.innerHTML = sorted.map((transaction) => {
    return `
      <div class="transaction-item ${transaction.type === 'income' ? 'income' : 'expense'}" data-id="${transaction.id}">
        <div class="icon-bubble">${transaction.type === 'income' ? '+' : '-'}</div>
        <div class="transaction-meta">
          <strong>${formatCategoryLabel(transaction.category)}</strong>
          <span>${transaction.description || (transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran')} • ${formatDate(transaction.date)}</span>
        </div>
        <div class="amount">${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}</div>
        <div class="transaction-actions">
          <button class="icon-button edit" type="button" data-action="edit" data-id="${transaction.id}" aria-label="Edit transaksi">✎</button>
          <button class="icon-button delete" type="button" data-action="delete" data-id="${transaction.id}" aria-label="Hapus transaksi">🗑</button>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => handleEditTransaction(button.dataset.id));
  });

  list.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => handleDeleteTransaction(button.dataset.id));
  });
}

function handleEditTransaction(transactionId) {
  const transaction = state.transactions.find((item) => item.id === transactionId);
  if (!transaction) return;

  state.editingId = transactionId;
  state.selectedType = transaction.type;
  setFormByType(transaction.type);

  document.getElementById('amount').value = transaction.amount;
  categorySelect.value = transaction.category;
  document.getElementById('description').value = transaction.description || '';
  document.getElementById('transaction-date').value = formatDateInput(new Date(transaction.date));

  typeButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.type === transaction.type);
  });

  cancelEditButton.classList.remove('hidden');
  const submitButton = transactionForm.querySelector('button[type="submit"]');
  submitButton.textContent = 'Update';
  document.getElementById('home-view').classList.add('active');
  document.getElementById('report-view').classList.remove('active');
  document.querySelector('[data-target="home-view"]').classList.add('active');
  document.querySelector('[data-target="report-view"]').classList.remove('active');
  document.getElementById('amount').focus();
}

function handleDeleteTransaction(transactionId) {
  const transaction = state.transactions.find((item) => item.id === transactionId);
  if (!transaction) return;

  const confirmed = window.confirm(`Hapus transaksi ${formatCategoryLabel(transaction.category)}?`);
  if (!confirmed) return;

  state.transactions = state.transactions.filter((item) => item.id !== transactionId);
  if (state.editingId === transactionId) {
    resetEditMode();
  }
  saveTransactions();
  transactionForm.reset();
  setFormByType(state.selectedType);
  syncReportRange();
  renderAll();
}

function resetEditMode() {
  state.editingId = null;
  cancelEditButton.classList.add('hidden');
  const submitButton = transactionForm.querySelector('button[type="submit"]');
  submitButton.textContent = 'Simpan';
}

function setFormByType(type) {
  const categoryOptions = type === 'income' ? incomeOptions : expenseOptions;
  categorySelect.innerHTML = categoryOptions.map((option) => {
    const label = type === 'income' ? formatCategoryLabel(option) : formatCategoryLabel(option);
    return `<option value="${option}">${label}</option>`;
  }).join('');

  const label = document.getElementById('category-label');
  label.textContent = type === 'income' ? 'Kategori pemasukan' : 'Kategori pengeluaran';

  if (type === 'income') {
    categorySelect.value = 'bulanan';
  } else {
    categorySelect.value = 'investasi';
  }

  const descriptionField = document.getElementById('description');
  descriptionField.placeholder = type === 'income'
    ? 'Cth: bonus, gaji, pendapatan tambahan'
    : 'Cth: beli kebutuhan rumah, makan siang';

  const dateField = document.getElementById('transaction-date');
  if (!dateField.value) {
    dateField.value = formatDateInput(new Date());
  }
}

function populateMonthSelector() {
  const months = getAllMonthsBetween();
  monthSelect.innerHTML = months.map((monthKey) => {
    return `<option value="${monthKey}">${formatMonthLabel(monthKey)}</option>`;
  }).join('');
  monthSelect.value = state.selectedMonth;

  const [lastMonth] = months.slice(-1);
  const monthToUse = state.selectedMonth || lastMonth;
  state.selectedMonth = monthToUse;
  monthSelect.value = monthToUse;

  syncReportRange();
}

function syncReportRange() {
  const allDates = state.transactions.map((item) => item.date);
  const earliest = allDates.length ? new Date(Math.min(...allDates.map((value) => new Date(value).getTime()))) : new Date();
  const latest = allDates.length ? new Date(Math.max(...allDates.map((value) => new Date(value).getTime()))) : new Date();

  const earliestDateString = formatDateInput(earliest);
  const latestDateString = formatDateInput(latest);

  if (!reportStart.value) {
    reportStart.value = earliestDateString;
  }

  if (!reportEnd.value) {
    reportEnd.value = latestDateString;
  }

  reportStart.min = earliestDateString;
  reportStart.max = latestDateString;
  reportEnd.min = earliestDateString;
  reportEnd.max = latestDateString;
}

function getMonthlyTransactions(monthKey) {
  return state.transactions.filter((transaction) => {
    const month = new Date(transaction.date).toISOString().slice(0, 7);
    return month === monthKey;
  });
}

function getTotalSaldo() {
  return state.transactions.reduce((sum, transaction) => {
    return transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount;
  }, 0);
}

function getInvestmentValue() {
  return state.transactions.filter((transaction) => {
    return transaction.type === 'expense' && transaction.category === 'investasi';
  }).reduce((sum, transaction) => sum + transaction.amount, 0);
}

function getMonthlyTotal(type, monthKey) {
  return getMonthlyTransactions(monthKey)
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function getDailyExpense(monthKey, day) {
  const safeDay = String(day).padStart(2, '0');
  const targetDate = `${monthKey}-${safeDay}`;

  return state.transactions
    .filter((transaction) => transaction.type === 'expense')
    .filter((transaction) => new Date(transaction.date).toISOString().slice(0, 10).startsWith(targetDate))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function getDaysInMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function getAllMonthsBetween() {
  const allDates = state.transactions.map((transaction) => transaction.date);
  if (!allDates.length) {
    return [getCurrentMonthKey()];
  }

  const earliest = new Date(Math.min(...allDates.map((date) => new Date(date).getTime())));
  const latest = new Date(Math.max(...allDates.map((date) => new Date(date).getTime())));

  const months = [];
  const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const end = new Date(latest.getFullYear(), latest.getMonth(), 1);

  while (cursor <= end) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (!months.length) {
    months.push(getCurrentMonthKey());
  }

  return months;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function loadTransactions() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(stored) && stored.length) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to parse stored transactions', error);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTransactions));
  return defaultTransactions;
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.transactions));
}

function formatCurrency(amount) {
  const safeValue = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(safeValue);
}

function formatCategoryLabel(category) {
  const lookup = {
    bulanan: 'Bulanan',
    lainnya: 'Lainnya',
    investasi: 'Investasi',
    'makanan dan minuman': 'Makanan & Minuman',
    kebutuhan: 'Kebutuhan',
    bensin: 'Bensin',
    kos: 'Kos',
    'lain lain': 'Lain lain'
  };

  return lookup[category] || category;
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, month - 1, 1));
}

function formatDateInput(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

function getEarliestDate() {
  return formatDateInput(new Date(Math.min(...state.transactions.map((item) => new Date(item.date).getTime()))));
}

function getLatestDate() {
  return formatDateInput(new Date(Math.max(...state.transactions.map((item) => new Date(item.date).getTime()))));
}
