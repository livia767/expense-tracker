import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CalendarDays,
  Check,
  Download,
  ListFilter,
  Pencil,
  Plus,
  Search,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'expense-tracker.expenses.v1';

const categories = [
  'General',
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Education',
  'Travel',
  'Other',
];

const emptyExpenseForm = () => ({
  title: '',
  amount: '',
  category: 'General',
  date: new Date().toISOString().slice(0, 10),
  note: '',
});

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
  if (!key) return 'All months';

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

    return parsed.filter(isExpense);
  } catch {
    return [];
  }
}

function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function validateExpenseFields(fields) {
  const nextErrors = {};
  const amount = Number(fields.amount);

  if (!fields.title.trim()) nextErrors.title = 'Enter an expense title.';
  if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = 'Amount must be greater than 0.';
  if (!fields.date) nextErrors.date = 'Choose a date.';

  return nextErrors;
}

function App() {
  const [expenses, setExpenses] = useState(loadExpenses);
  const [form, setForm] = useState(emptyExpenseForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyExpenseForm);
  const [editErrors, setEditErrors] = useState({});
  const [filters, setFilters] = useState({
    query: '',
    category: 'All',
    month: 'All',
  });

  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

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
        const matchesMonth = filters.month === 'All' || monthKey(expense.date) === filters.month;

        return matchesQuery && matchesCategory && matchesMonth;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
  }, [expenses, filters]);

  const total = useMemo(
    () => visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [visibleExpenses],
  );

  const allTimeTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );

  const currentMonthTotal = useMemo(() => {
    const activeMonth = filters.month === 'All' ? new Date().toISOString().slice(0, 7) : filters.month;
    return expenses
      .filter((expense) => monthKey(expense.date) === activeMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, filters.month]);

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
      category: form.category || 'General',
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
      category: expense.category || 'General',
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
      category: editForm.category || 'General',
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

  function exportCsv() {
    const headers = ['Title', 'Amount', 'Category', 'Date', 'Note', 'Created At'];
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
    link.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="topbar" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Shared demo tracker</p>
          <h1 id="page-title">Expense Tracker</h1>
        </div>
        <button className="icon-button export-button" type="button" onClick={exportCsv} disabled={!visibleExpenses.length}>
          <Download size={18} aria-hidden="true" />
          <span>Export CSV</span>
        </button>
      </section>

      <section className="summary-grid" aria-label="Expense totals">
        <article className="metric-card primary">
          <WalletCards size={22} aria-hidden="true" />
          <div>
            <span>Visible total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </article>
        <article className="metric-card">
          <CalendarDays size={22} aria-hidden="true" />
          <div>
            <span>{filters.month === 'All' ? 'This month' : monthLabel(filters.month)}</span>
            <strong>{formatCurrency(currentMonthTotal)}</strong>
          </div>
        </article>
        <article className="metric-card">
          <ListFilter size={22} aria-hidden="true" />
          <div>
            <span>All expenses</span>
            <strong>{formatCurrency(allTimeTotal)}</strong>
          </div>
        </article>
      </section>

      <div className="content-grid">
        <section className="panel" aria-labelledby="form-title">
          <h2 id="form-title">Add expense</h2>
          <form onSubmit={submitExpense} noValidate>
            <label>
              Title
              <input
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="Lunch, fuel, electricity"
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title ? <span className="field-error">{errors.title}</span> : null}
            </label>

            <label>
              Amount
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
                Category
                <select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
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
              Note
              <textarea
                rows="3"
                value={form.note}
                onChange={(event) => updateForm('note', event.target.value)}
                placeholder="Optional detail"
              />
            </label>

            <button className="primary-button" type="submit">
              <Plus size={18} aria-hidden="true" />
              <span>Add expense</span>
            </button>
          </form>
        </section>

        <section className="panel list-panel" aria-labelledby="list-title">
          <div className="section-heading">
            <div>
              <h2 id="list-title">Expenses</h2>
              <p>{visibleExpenses.length} visible</p>
            </div>
          </div>

          <div className="filters" aria-label="Expense filters">
            <label className="search-field">
              <Search size={17} aria-hidden="true" />
              <input
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Search expenses"
              />
            </label>
            <select
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              aria-label="Filter by category"
            >
              <option value="All">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={filters.month}
              onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))}
              aria-label="Filter by month"
            >
              <option value="All">All months</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {monthLabel(month)}
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
                        Title
                        <input
                          value={editForm.title}
                          onChange={(event) => updateEditForm('title', event.target.value)}
                          aria-invalid={Boolean(editErrors.title)}
                        />
                        {editErrors.title ? <span className="field-error">{editErrors.title}</span> : null}
                      </label>

                      <label>
                        Amount
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
                          Category
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
                          Date
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
                        Note
                        <textarea
                          rows="2"
                          value={editForm.note}
                          onChange={(event) => updateEditForm('note', event.target.value)}
                        />
                      </label>

                      <div className="card-edit-actions">
                        <button className="primary-button compact-button" type="submit">
                          <Check size={17} aria-hidden="true" />
                          <span>Save</span>
                        </button>
                        <button className="ghost-button compact-button" type="button" onClick={cancelEdit}>
                          <X size={17} aria-hidden="true" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <div className="expense-title-row">
                          <h3>{expense.title}</h3>
                          <span>{expense.category}</span>
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
                            aria-label={`Edit ${expense.title}`}
                          >
                            <Pencil size={17} aria-hidden="true" />
                          </button>
                          <button
                            className="delete-button"
                            type="button"
                            onClick={() => deleteExpense(expense.id)}
                            aria-label={`Delete ${expense.title}`}
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
              <h3>No expenses found</h3>
              <p>Add an expense or adjust the filters to see entries here.</p>
            </div>
          )}
        </section>
      </div>

      <section className="panel summary-panel" aria-labelledby="category-title">
        <div className="section-heading">
          <div>
            <h2 id="category-title">Category summary</h2>
            <p>Based on visible expenses</p>
          </div>
        </div>

        {categorySummary.length ? (
          <div className="category-grid">
            {categorySummary.map((item) => (
              <article className="category-item" key={item.category}>
                <div>
                  <h3>{item.category}</h3>
                  <p>{item.count} expense{item.count === 1 ? '' : 's'}</p>
                </div>
                <strong>{formatCurrency(item.total)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No category totals yet.</p>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
