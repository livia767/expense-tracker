import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Check,
  Download,
  Pencil,
  PieChart,
  Plus,
  ReceiptText,
  Search,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'expense-tracker.expenses.v1';
const BUDGET_STORAGE_KEY = 'expense-tracker.budgets.v1';
const CATEGORIES_STORAGE_KEY = 'expense-tracker.categories.v1';
const CATEGORY_COLORS_STORAGE_KEY = 'expense-tracker.category-colors.v1';

const defaultCategories = [
  'Umum',
  'Makanan',
  'Transportasi',
  'Belanja',
  'Tagihan',
  'Kesehatan',
  'Pendidikan',
  'Perjalanan',
  'Lainnya',
];

const categoryColorMap = {
  Umum: '#a78bfa',
  Makanan: '#f43f5e',
  Transportasi: '#3b82f6',
  Belanja: '#fb7185',
  Tagihan: '#22c55e',
  Kesehatan: '#14b8a6',
  Pendidikan: '#f59e0b',
  Perjalanan: '#f97316',
  Lainnya: '#9ca3af',
};

const emptyExpenseForm = () => ({
  title: '',
  amount: '',
  category: 'Umum',
  date: new Date().toISOString().slice(0, 10),
  note: '',
});

const emptyBudgetCategoryForm = () => ({
  name: '',
  color: '#a78bfa',
});

const legacyCategoryMap = {
  General: 'Umum',
  Food: 'Makanan',
  Transport: 'Transportasi',
  Shopping: 'Belanja',
  Bills: 'Tagihan',
  Health: 'Kesehatan',
  Education: 'Pendidikan',
  Travel: 'Perjalanan',
  Other: 'Lainnya',
};

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatCurrency(amount) {
  return currencyFormatter.format(amount || 0);
}

function monthKey(dateValue) {
  return dateValue ? dateValue.slice(0, 7) : '';
}

function monthLabel(key) {
  if (!key) return 'Semua bulan';

  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

function isExpense(value) {
  return (
    value &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    typeof value.category === 'string' &&
    typeof value.date === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isExpense).map((expense) => ({
      ...expense,
      category: legacyCategoryMap[expense.category] || expense.category,
    }));
  } catch {
    return [];
  }
}

function loadBudgets() {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([month, monthBudgets]) => [
        month,
        Object.fromEntries(
          Object.entries(monthBudgets || {}).map(([category, amount]) => [
            legacyCategoryMap[category] || category,
            amount,
          ]),
        ),
      ]),
    );
  } catch {
    return {};
  }
}

function loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === 'string');
  } catch {
    return [];
  }
}

function loadCategoryColors() {
  try {
    const raw = localStorage.getItem(CATEGORY_COLORS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function saveBudgets(budgets) {
  localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
}

function saveCategories(value) {
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(value));
}

function saveCategoryColors(value) {
  localStorage.setItem(CATEGORY_COLORS_STORAGE_KEY, JSON.stringify(value));
}

function validateExpenseFields(fields) {
  const nextErrors = {};
  const amount = Number(fields.amount);

  if (!fields.title.trim()) nextErrors.title = 'Masukkan judul pengeluaran.';
  if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = 'Jumlah harus lebih besar dari 0.';
  if (!fields.date) nextErrors.date = 'Pilih tanggal.';

  return nextErrors;
}

function createDemoExpenses() {
  const base = new Date();
  const toIsoDate = (date) => date.toISOString().slice(0, 10);

  return [
    { title: 'Makan siang', amount: 55000, category: 'Makanan', dateOffset: 1, note: 'Warung dekat kantor' },
    { title: 'Bensin', amount: 140000, category: 'Transportasi', dateOffset: 2, note: 'Isi bensin mingguan' },
    { title: 'Tagihan internet', amount: 325000, category: 'Tagihan', dateOffset: 6, note: '' },
    { title: 'Apotek', amount: 78000, category: 'Kesehatan', dateOffset: 8, note: 'Vitamin' },
    { title: 'Sepatu', amount: 450000, category: 'Belanja', dateOffset: 12, note: '' },
    { title: 'Kursus online', amount: 290000, category: 'Pendidikan', dateOffset: 16, note: '' },
    { title: 'Kopi', amount: 30000, category: 'Makanan', dateOffset: 18, note: 'Rapat' },
    { title: 'Tiket kereta', amount: 90000, category: 'Transportasi', dateOffset: 22, note: '' },
    { title: 'Liburan akhir pekan', amount: 700000, category: 'Perjalanan', dateOffset: 28, note: '' },
  ].map((item, index) => {
    const day = new Date(base);
    day.setDate(base.getDate() - item.dateOffset);
    return {
      id: crypto.randomUUID(),
      title: item.title,
      amount: item.amount,
      category: item.category,
      date: toIsoDate(day),
      note: item.note,
      source: 'demo',
      createdAt: new Date(day.getTime() + index).toISOString(),
    };
  });
}

function createDemoBudgetsFromExpenses(expenses) {
  return expenses.reduce((result, expense) => {
    const month = monthKey(expense.date);
    if (!month) return result;

    const currentMonth = result[month] || {};
    const currentSpent = currentMonth[expense.category] || 0;
    const nextSpent = currentSpent + expense.amount;
    const bufferedBudget = Math.ceil((nextSpent * 1.25) / 10000) * 10000;

    result[month] = {
      ...currentMonth,
      [expense.category]: bufferedBudget,
    };
    return result;
  }, {});
}

function App() {
  const [expenses, setExpenses] = useState(loadExpenses);
  const [budgets, setBudgets] = useState(loadBudgets);
  const [categories, setCategories] = useState(() => {
    const stored = loadCategories();
    if (stored.length) return stored;

    const expenseCategories = loadExpenses().map((expense) => expense.category);
    const budgetCategories = Object.values(loadBudgets())
      .flatMap((monthBudget) => Object.keys(monthBudget || {}));
    return [...new Set([...defaultCategories, ...expenseCategories, ...budgetCategories])];
  });
  const [categoryColors, setCategoryColors] = useState(loadCategoryColors);
  const [form, setForm] = useState(emptyExpenseForm);
  const [budgetCategoryForm, setBudgetCategoryForm] = useState(emptyBudgetCategoryForm);
  const [budgetDrafts, setBudgetDrafts] = useState({});
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyExpenseForm);
  const [editErrors, setEditErrors] = useState({});
  const [budgetEditingCategory, setBudgetEditingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [filters, setFilters] = useState({
    query: '',
    category: 'All',
  });

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    saveBudgets(budgets);
  }, [budgets]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveCategoryColors(categoryColors);
  }, [categoryColors]);

  useEffect(() => {
    if (selectedMonth === 'All') {
      setBudgetDrafts({});
      setBudgetEditingCategory(null);
      return;
    }

    const monthBudgets = budgets[selectedMonth] || {};
    setBudgetDrafts(
      categories.reduce((drafts, category) => {
        drafts[category] = monthBudgets[category] ? String(monthBudgets[category]) : '';
        return drafts;
      }, {}),
    );
    setBudgetEditingCategory(null);
  }, [selectedMonth, budgets, categories]);

  useEffect(() => {
    if (selectedMonth === 'All') {
      setBudgetCategoryForm(emptyBudgetCategoryForm());
    }
  }, [selectedMonth]);

  const months = useMemo(() => {
    const uniqueMonths = [...new Set(expenses.map((expense) => monthKey(expense.date)))];
    return uniqueMonths.filter(Boolean).sort().reverse();
  }, [expenses]);

  const visibleExpenses = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return expenses
      .filter((expense) => {
        const matchesQuery =
          !query ||
          expense.title.toLowerCase().includes(query) ||
          expense.note?.toLowerCase().includes(query);
        const matchesCategory = filters.category === 'All' || expense.category === filters.category;
        const matchesMonth = selectedMonth === 'All' || monthKey(expense.date) === selectedMonth;

        return matchesQuery && matchesCategory && matchesMonth;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
  }, [expenses, filters, selectedMonth]);

  const total = useMemo(
    () => visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [visibleExpenses],
  );

  const categorySummary = useMemo(() => {
    return visibleExpenses
      .reduce((summary, expense) => {
        const current = summary.find((item) => item.category === expense.category);
        if (current) {
          current.total += expense.amount;
          current.count += 1;
        } else {
          summary.push({ category: expense.category, total: expense.amount, count: 1 });
        }
        return summary;
      }, [])
      .sort((a, b) => b.total - a.total);
  }, [visibleExpenses]);

  const topCategory = categorySummary[0];
  const hasDemoExpenses = useMemo(
    () => expenses.some((expense) => expense.source === 'demo'),
    [expenses],
  );

  const monthlyBudgets = selectedMonth === 'All' ? {} : budgets[selectedMonth] || {};

  const budgetRows = useMemo(() => {
    const scopedExpenses =
      selectedMonth === 'All'
        ? expenses
        : expenses.filter((expense) => monthKey(expense.date) === selectedMonth);

    const sourceCategories = [
      ...new Set([
        ...categories,
        ...scopedExpenses.map((expense) => expense.category),
        ...Object.keys(monthlyBudgets),
      ]),
    ];

    return sourceCategories
      .map((category) => {
        const budget =
          selectedMonth === 'All'
            ? Object.values(budgets).reduce((sum, monthBudget) => sum + Number(monthBudget?.[category] || 0), 0)
            : Number(monthlyBudgets[category] || 0);
        const spent = scopedExpenses
          .filter((expense) => expense.category === category)
          .reduce((sum, expense) => sum + expense.amount, 0);
        const remaining = budget - spent;
        const ratio = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
        const isOverBudget = budget > 0 && spent > budget;
        return { category, budget, spent, remaining, ratio, isOverBudget };
      })
      .sort((a, b) => b.spent - a.spent || b.budget - a.budget);
  }, [monthlyBudgets, expenses, selectedMonth, budgets, categories]);

  const pieSegments = useMemo(() => {
    if (!categorySummary.length || total <= 0) return [];

    let start = 0;
    return categorySummary.map((item) => {
      const percentage = (item.total / total) * 100;
      const end = start + percentage;
      const segment = {
        category: item.category,
        start,
        end,
        color: categoryColors[item.category] || categoryColorMap[item.category] || '#c4b5fd',
        percentage,
      };
      start = end;
      return segment;
    });
  }, [categorySummary, total, categoryColors]);

  const pieBackground = useMemo(() => {
    if (!pieSegments.length) return 'transparent';
    return `conic-gradient(${pieSegments
      .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
      .join(', ')})`;
  }, [pieSegments]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  function updateEditForm(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
    setEditErrors((current) => ({ ...current, [field]: '' }));
  }

  function resetForm() {
    setForm(emptyExpenseForm());
    setErrors({});
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyExpenseForm());
    setEditErrors({});
  }

  function submitExpense(event) {
    event.preventDefault();
    const nextErrors = validateExpenseFields(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const expenseFields = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category || 'Umum',
      date: form.date,
      note: form.note.trim(),
    };

    setExpenses((current) => [
      {
        id: crypto.randomUUID(),
        ...expenseFields,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    resetForm();
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setEditForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category || 'Umum',
      date: expense.date,
      note: expense.note || '',
    });
    setEditErrors({});
  }

  function saveEditedExpense(event) {
    event.preventDefault();
    const nextErrors = validateExpenseFields(editForm);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const expenseFields = {
      title: editForm.title.trim(),
      amount: Number(editForm.amount),
      category: editForm.category || 'Umum',
      date: editForm.date,
      note: editForm.note.trim(),
    };

    setExpenses((current) =>
      current.map((expense) =>
        expense.id === editingId ? { ...expense, ...expenseFields } : expense,
      ),
    );
    cancelEdit();
  }

  function deleteExpense(id) {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
    if (editingId === id) {
      cancelEdit();
    }
  }

  function loadSampleData() {
    const sample = createDemoExpenses();
    const sampleBudgets = createDemoBudgetsFromExpenses(sample);
    const latestSampleMonth = [...new Set(sample.map((item) => monthKey(item.date)))]
      .filter(Boolean)
      .sort()
      .reverse()[0];
    setExpenses((current) => {
      if (current.some((expense) => expense.source === 'demo')) return current;
      if (current.length) return [...sample, ...current];
      return sample;
    });
    setBudgets((current) => {
      const next = { ...current };
      for (const [month, monthBudgets] of Object.entries(sampleBudgets)) {
        next[month] = { ...(next[month] || {}) };
        for (const [category, amount] of Object.entries(monthBudgets)) {
          if (!next[month][category]) {
            next[month][category] = amount;
          }
        }
      }
      return next;
    });
    setCategories((current) => [...new Set([...current, ...sample.map((item) => item.category)])]);
    if (latestSampleMonth) {
      setSelectedMonth(latestSampleMonth);
    }
  }

  function exitDemoMode() {
    setExpenses((current) => current.filter((expense) => expense.source !== 'demo'));
  }

  function updateBudgetDraft(category, value) {
    const sanitized = value.replace(/[^\d]/g, '');
    setBudgetDrafts((current) => ({ ...current, [category]: sanitized }));
  }

  function applyBudgetDraft(category) {
    if (selectedMonth === 'All') return;
    const raw = budgetDrafts[category] || '';
    const amount = Number(raw);

    setBudgets((current) => {
      const nextMonth = { ...(current[selectedMonth] || {}) };

      if (!raw || !Number.isFinite(amount) || amount <= 0) {
        delete nextMonth[category];
      } else {
        nextMonth[category] = amount;
      }

      return { ...current, [selectedMonth]: nextMonth };
    });
  }

  function startBudgetEdit(category) {
    if (selectedMonth === 'All') return;
    setBudgetEditingCategory(category);
  }

  function cancelBudgetEdit(category) {
    if (selectedMonth === 'All') return;
    const currentValue = budgets[selectedMonth]?.[category];
    setBudgetDrafts((current) => ({
      ...current,
      [category]: currentValue ? String(currentValue) : '',
    }));
    setBudgetEditingCategory(null);
  }

  function saveBudgetEdit(category) {
    applyBudgetDraft(category);
    setBudgetEditingCategory(null);
  }

  function addCategory(event) {
    event.preventDefault();

    const name = budgetCategoryForm.name.trim();
    if (!name) return;
    const exists = categories.some((category) => category.toLowerCase() === name.toLowerCase());
    const finalName = exists ? categories.find((category) => category.toLowerCase() === name.toLowerCase()) : name;

    const color = budgetCategoryForm.color || '#a78bfa';

    setCategories((current) => [...new Set([...current, finalName])]);

    setCategoryColors((current) => ({
      ...current,
      [finalName]: color,
    }));

    setBudgetCategoryForm(emptyBudgetCategoryForm());
  }

  function deleteBudget(category) {
    if (selectedMonth === 'All') return;
    setBudgets((current) => {
      const nextMonth = { ...(current[selectedMonth] || {}) };
      delete nextMonth[category];
      return { ...current, [selectedMonth]: nextMonth };
    });
    if (budgetEditingCategory === category) {
      setBudgetEditingCategory(null);
    }
  }

  function exportCsv() {
    const headers = ['Judul', 'Jumlah', 'Kategori', 'Tanggal', 'Catatan', 'Dibuat Pada'];
    const rows = visibleExpenses.map((expense) => [
      expense.title,
      expense.amount,
      expense.category,
      expense.date,
      expense.note || '',
      expense.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pengeluaran-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function categoryStyle(category) {
    const color = categoryColors[category] || categoryColorMap[category] || '#c4b5fd';
    return {
      '--category-color': color,
      '--category-bg': `${color}40`,
    };
  }

  return (
    <main className="app-shell">
      <section className="topbar" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Pelacak demo bersama</p>
          <h1 id="page-title">Pencatat Pengeluaran</h1>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" type="button" onClick={loadSampleData}>
            <Plus size={18} aria-hidden="true" />
            <span>{hasDemoExpenses ? 'Mode Demo Aktif' : 'Masuk Demo'}</span>
          </button>
          {hasDemoExpenses ? (
            <button className="icon-button" type="button" onClick={exitDemoMode}>
              <X size={18} aria-hidden="true" />
              <span>Keluar Demo</span>
            </button>
          ) : null}
          <button className="icon-button export-button" type="button" onClick={exportCsv} disabled={!visibleExpenses.length}>
            <Download size={18} aria-hidden="true" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </section>

      <section className="month-tabs" aria-label="Bulan dan tampilan">
        <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} aria-label="Bulan dipilih">
          <option value="All">Semua bulan</option>
          {[...new Set(months)].sort().reverse().map((month) => (
            <option key={month} value={month}>
              {monthLabel(month)}
            </option>
          ))}
        </select>
        <div className="tab-buttons">
          <button type="button" className={activeTab === 'summary' ? 'is-active' : ''} onClick={() => setActiveTab('summary')}>
            Ringkasan
          </button>
          <button type="button" className={activeTab === 'expenses' ? 'is-active' : ''} onClick={() => setActiveTab('expenses')}>
            Pengeluaran
          </button>
          <button type="button" className={activeTab === 'budget' ? 'is-active' : ''} onClick={() => setActiveTab('budget')}>
            Anggaran
          </button>
        </div>
      </section>

      <section className="summary-grid" aria-label="Ringkasan pengeluaran">
        <article className="metric-card primary">
          <WalletCards size={22} aria-hidden="true" />
          <div>
            <span>Total Pengeluaran</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </article>
        <article className="metric-card">
          <PieChart size={22} aria-hidden="true" />
          <div>
            <span>Kategori Terbesar</span>
            <strong>{topCategory ? topCategory.category : '-'}</strong>
          </div>
        </article>
        <article className="metric-card">
          <ReceiptText size={22} aria-hidden="true" />
          <div>
            <span>Jumlah Transaksi</span>
            <strong>{visibleExpenses.length}</strong>
          </div>
        </article>
      </section>

      {activeTab === 'expenses' ? (
        <div className="content-grid">
          <section className="panel" aria-labelledby="form-title">
          <h2 id="form-title">Tambah pengeluaran</h2>
          <form onSubmit={submitExpense} noValidate>
            <label>
              Judul
              <input
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="Makan siang, bensin, listrik"
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title ? <span className="field-error">{errors.title}</span> : null}
            </label>

            <label>
              Jumlah
              <input
                type="number"
                min="1"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => updateForm('amount', event.target.value)}
                placeholder="75000"
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount ? <span className="field-error">{errors.amount}</span> : null}
            </label>

            <div className="form-row">
              <label>
                Kategori
                <select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tanggal
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => updateForm('date', event.target.value)}
                  aria-invalid={Boolean(errors.date)}
                />
                {errors.date ? <span className="field-error">{errors.date}</span> : null}
              </label>
            </div>

            <label>
              Catatan
              <textarea
                rows="3"
                value={form.note}
                onChange={(event) => updateForm('note', event.target.value)}
                placeholder="Detail opsional"
              />
            </label>

            <button className="primary-button" type="submit">
              <Plus size={18} aria-hidden="true" />
              <span>Tambah pengeluaran</span>
            </button>
          </form>
          </section>

          <section className="panel list-panel" aria-labelledby="list-title">
          <div className="section-heading">
            <div>
              <h2 id="list-title">Pengeluaran</h2>
              <p>{visibleExpenses.length} terlihat</p>
            </div>
          </div>

          <div className="filters" aria-label="Filter pengeluaran">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <input
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Cari pengeluaran"
              />
            </label>
            <select
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              aria-label="Filter berdasarkan kategori"
            >
              <option value="All">Semua kategori</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {visibleExpenses.length ? (
            <div className="expense-list">
              {visibleExpenses.map((expense) => (
                <article className={`expense-item ${editingId === expense.id ? 'is-editing' : ''}`} key={expense.id}>
                  {editingId === expense.id ? (
                    <form className="card-edit-form" onSubmit={saveEditedExpense} noValidate>
                      <label>
                        Judul
                        <input
                          value={editForm.title}
                          onChange={(event) => updateEditForm('title', event.target.value)}
                          aria-invalid={Boolean(editErrors.title)}
                        />
                        {editErrors.title ? <span className="field-error">{editErrors.title}</span> : null}
                      </label>

                      <label>
                        Jumlah
                        <input
                          type="number"
                          min="1"
                          inputMode="decimal"
                          value={editForm.amount}
                          onChange={(event) => updateEditForm('amount', event.target.value)}
                          aria-invalid={Boolean(editErrors.amount)}
                        />
                        {editErrors.amount ? <span className="field-error">{editErrors.amount}</span> : null}
                      </label>

                      <div className="form-row">
                        <label>
                          Kategori
                          <select
                            value={editForm.category}
                            onChange={(event) => updateEditForm('category', event.target.value)}
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Tanggal
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={(event) => updateEditForm('date', event.target.value)}
                            aria-invalid={Boolean(editErrors.date)}
                          />
                          {editErrors.date ? <span className="field-error">{editErrors.date}</span> : null}
                        </label>
                      </div>

                      <label>
                        Catatan
                        <textarea
                          rows="2"
                          value={editForm.note}
                          onChange={(event) => updateEditForm('note', event.target.value)}
                        />
                      </label>

                      <div className="card-edit-actions">
                        <button className="primary-button compact-button" type="submit">
                          <Check size={17} aria-hidden="true" />
                          <span>Simpan</span>
                        </button>
                        <button className="ghost-button compact-button" type="button" onClick={cancelEdit}>
                          <X size={17} aria-hidden="true" />
                          <span>Batal</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <div className="expense-title-row">
                          <h3>{expense.title}</h3>
                          <span style={categoryStyle(expense.category)}>{expense.category}</span>
                        </div>
                        <p>{dateFormatter.format(new Date(`${expense.date}T00:00:00`))}</p>
                        {expense.note ? <p className="note">{expense.note}</p> : null}
                      </div>
                      <div className="expense-actions">
                        <strong>{formatCurrency(expense.amount)}</strong>
                        <div className="expense-buttons">
                          <button
                            className="edit-button"
                            type="button"
                            onClick={() => startEdit(expense)}
                            aria-label={`Ubah ${expense.title}`}
                          >
                            <Pencil size={17} aria-hidden="true" />
                          </button>
                          <button
                            className="delete-button"
                            type="button"
                            onClick={() => deleteExpense(expense.id)}
                            aria-label={`Hapus ${expense.title}`}
                          >
                            <Trash2 size={17} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <WalletCards size={34} aria-hidden="true" />
              <h3>Pengeluaran tidak ditemukan</h3>
              <p>Tambahkan pengeluaran atau sesuaikan filter untuk melihat data di sini.</p>
            </div>
          )}
          </section>
        </div>
      ) : null}

      {activeTab === 'summary' ? (
        <section className="panel summary-panel" aria-labelledby="category-title">
        <div className="section-heading">
          <div>
            <h2 id="category-title">Ringkasan kategori</h2>
            <p>Berdasarkan pengeluaran yang terlihat</p>
          </div>
        </div>

        {categorySummary.length ? (
          <div className="category-summary-layout">
            <div className="category-chart-card" aria-label="Grafik porsi kategori">
              <div className="category-donut" style={{ background: pieBackground }}>
                <div className="category-donut-inner">
                  <strong>{categorySummary.length}</strong>
                  <span>kategori</span>
                </div>
              </div>
            </div>
            <div className="category-list">
              {categorySummary.map((item) => (
                <article className="category-row" key={item.category} style={categoryStyle(item.category)}>
                  <span className="category-pill">
                    <i aria-hidden="true" />
                    {item.category}
                  </span>
                  <strong>{formatCurrency(item.total)}</strong>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="muted">Belum ada total kategori.</p>
        )}
        </section>
      ) : null}

      {activeTab === 'budget' ? (
        <div className="content-grid">
          <section className="panel" aria-labelledby="budget-create-title">
            <h2 id="budget-create-title">Tambah kategori</h2>
            <form onSubmit={addCategory} noValidate>
              <label>
                Nama kategori
                <input
                  value={budgetCategoryForm.name}
                  onChange={(event) => setBudgetCategoryForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Contoh: Hiburan"
                />
              </label>
              <label>
                Warna kategori
                <input
                  type="color"
                  value={budgetCategoryForm.color}
                  onChange={(event) => setBudgetCategoryForm((current) => ({ ...current, color: event.target.value }))}
                />
              </label>
              <button className="primary-button" type="submit">
                <Plus size={18} aria-hidden="true" />
                <span>Tambah kategori</span>
              </button>
            </form>
          </section>

          <section className="panel list-panel" aria-labelledby="budget-title">
            <div className="section-heading">
              <div>
                <h2 id="budget-title">Anggaran {selectedMonth === 'All' ? 'Semua Bulan' : monthLabel(selectedMonth)}</h2>
                <p>
                  {selectedMonth === 'All'
                    ? 'Ringkasan semua bulan.'
                    : 'Tetapkan batas per kategori dan pantau realisasi.'}
                </p>
              </div>
            </div>

            {budgetRows.length ? (
              <div className="budget-list">
                {budgetRows.map((row) => (
                  <article className="budget-item" key={row.category} style={categoryStyle(row.category)}>
                    <div className="budget-heading">
                      <div>
                        <h3>{row.category}</h3>
                        <p>
                          {formatCurrency(row.spent)} / {formatCurrency(row.budget)}
                        </p>
                      </div>
                      <div className="budget-actions">
                        {budgetEditingCategory === row.category ? (
                          <>
                            <button className="ghost-button compact-button" type="button" onClick={() => cancelBudgetEdit(row.category)}>
                              <X size={17} aria-hidden="true" />
                              <span>Batal</span>
                            </button>
                            <button className="edit-button" type="button" onClick={() => saveBudgetEdit(row.category)} aria-label={`Simpan anggaran ${row.category}`}>
                              <Check size={17} aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <button className="edit-button" type="button" onClick={() => startBudgetEdit(row.category)} aria-label={`Ubah anggaran ${row.category}`} disabled={selectedMonth === 'All'}>
                            <Pencil size={17} aria-hidden="true" />
                          </button>
                        )}
                        <button className="delete-button" type="button" onClick={() => deleteBudget(row.category)} aria-label={`Hapus anggaran ${row.category}`}>
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {budgetEditingCategory === row.category ? (
                      <label className="budget-input-label">
                        Anggaran
                        <input
                          className="budget-input"
                          type="text"
                          inputMode="numeric"
                          placeholder="Masukkan anggaran"
                          value={budgetDrafts[row.category] || ''}
                          onChange={(event) => updateBudgetDraft(row.category, event.target.value)}
                        />
                      </label>
                    ) : null}
                    <div className="budget-track">
                      <span className={row.isOverBudget ? 'is-over' : ''} style={{ width: `${row.ratio}%` }} />
                    </div>
                    <p className={row.remaining < 0 ? 'field-error' : 'muted'}>
                      {row.budget <= 0
                        ? 'Belum ada anggaran'
                        : `${row.remaining < 0 ? 'Melebihi' : 'Sisa'}: ${formatCurrency(Math.abs(row.remaining))}`}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Belum ada data anggaran.</p>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
