import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const initialExpenses = [
  {
    id: 1,
    title: "Groceries",
    amount: 1250,
    category: "Food",
    date: "2026-09-12",
    note: "Weekly groceries"
  },
  {
    id: 2,
    title: "Metro Pass",
    amount: 500,
    category: "Transport",
    date: "2026-09-10",
    note: "Monthly travel"
  },
  {
    id: 3,
    title: "Internet Bill",
    amount: 899,
    category: "Bills",
    date: "2026-09-08",
    note: "Home internet"
  }
];

const categories = ["Food", "Transport", "Bills", "Shopping", "Health", "Entertainment", "Education", "Other"];

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  // useRef: focus the title field when the form opens or editing starts.
  const titleInputRef = useRef(null);

  // useEffect: mock API call to load expenses.
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem("expense-tracker-expenses");
      setExpenses(saved ? JSON.parse(saved) : initialExpenses);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // useEffect: save expense data like a small mock API/database.
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("expense-tracker-expenses", JSON.stringify(expenses));
    }
  }, [expenses, loading]);

  // useEffect + useRef: focus the form title field.
  useEffect(() => {
    if (!loading) {
      titleInputRef.current?.focus();
    }
  }, [editingId, loading]);

  const resetForm = useCallback(() => {
    setTitle("");
    setAmount("");
    setCategory("Food");
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
    setErrors({});
    setEditingId(null);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Expense title is required.";
    } else if (title.trim().length < 2) {
      newErrors.title = "Title must contain at least 2 characters.";
    }

    if (amount === "" || Number(amount) <= 0) {
      newErrors.amount = "Enter an amount greater than 0.";
    }

    if (!date) {
      newErrors.date = "Please select a date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, amount, date]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (!validateForm()) return;

      const expenseData = {
        title: title.trim(),
        amount: Number(amount),
        category,
        date,
        note: note.trim()
      };

      if (editingId !== null) {
        setExpenses((current) =>
          current.map((expense) =>
            expense.id === editingId ? { ...expense, ...expenseData } : expense
          )
        );
      } else {
        setExpenses((current) => [
          {
            id: Date.now(),
            ...expenseData
          },
          ...current
        ]);
      }

      resetForm();
    },
    [amount, category, date, editingId, note, resetForm, title, validateForm]
  );

  const handleEdit = useCallback((expense) => {
    setEditingId(expense.id);
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDate(expense.date);
    setNote(expense.note || "");
    setErrors({});
  }, []);

  const handleDelete = useCallback((id) => {
    const confirmed = window.confirm("Delete this expense?");
    if (!confirmed) return;

    setExpenses((current) => current.filter((expense) => expense.id !== id));
  }, []);

  // useMemo: filtering and sorting are recalculated only when dependencies change.
  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = expenses.filter((expense) => {
      const matchesSearch =
        expense.title.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query) ||
        (expense.note || "").toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "All" || expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "amount-high") return b.amount - a.amount;
      if (sortBy === "amount-low") return a.amount - b.amount;
      if (sortBy === "title") return a.title.localeCompare(b.title);
      return new Date(b.date) - new Date(a.date);
    });
  }, [expenses, search, categoryFilter, sortBy]);

  const totals = useMemo(() => {
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const average = filteredExpenses.length ? total / filteredExpenses.length : 0;

    const categoryTotals = filteredExpenses.reduce((result, expense) => {
      result[expense.category] = (result[expense.category] || 0) + expense.amount;
      return result;
    }, {});

    return {
      total,
      count: filteredExpenses.length,
      average,
      categoryTotals
    };
  }, [filteredExpenses]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(value);

  const formatDate = (value) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(value + "T00:00:00"));

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Expense Tracker</h1>
          <p className="subtitle">Track, search, edit and manage your daily expenses.</p>
        </div>
        <div className="react-badge">React.js</div>
      </header>

      <main className="container">
        <section className="stats-grid" aria-label="Expense summary">
          <div className="stat-card">
            <span>Total Expenses</span>
            <strong>{formatCurrency(totals.total)}</strong>
          </div>
          <div className="stat-card">
            <span>Transactions</span>
            <strong>{totals.count}</strong>
          </div>
          <div className="stat-card">
            <span>Average Expense</span>
            <strong>{formatCurrency(totals.average)}</strong>
          </div>
          <div className="stat-card">
            <span>Categories</span>
            <strong>{Object.keys(totals.categoryTotals).length}</strong>
          </div>
        </section>

        <section className="layout">
          <div className="card form-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">EXPENSE FORM</p>
                <h2>{editingId !== null ? "Edit Expense" : "Add Expense"}</h2>
              </div>
              {editingId !== null && (
                <button className="secondary-button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label>
                Expense Title
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Grocery shopping"
                />
                {errors.title && <small className="error">{errors.title}</small>}
              </label>

              <label>
                Amount (₹)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="e.g. 500"
                />
                {errors.amount && <small className="error">{errors.amount}</small>}
              </label>

              <div className="two-columns">
                <label>
                  Category
                  <select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                  {errors.date && <small className="error">{errors.date}</small>}
                </label>
              </div>

              <label>
                Note <span className="optional">(optional)</span>
                <textarea
                  rows="3"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a short note..."
                />
              </label>

              <button className="primary-button" type="submit">
                {editingId !== null ? "Update Expense" : "Add Expense"}
              </button>
            </form>
          </div>

          <div className="card list-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">TRANSACTIONS</p>
                <h2>Your Expenses</h2>
              </div>
              <span className="count-pill">{filteredExpenses.length}</span>
            </div>

            <div className="filters">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search expenses..."
                aria-label="Search expenses"
              />

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter by category"
              >
                <option value="All">All categories</option>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort expenses"
              >
                <option value="date">Newest first</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
                <option value="title">Title: A to Z</option>
              </select>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="loader"></div>
                <p>Loading expenses...</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">₹</div>
                <h3>No expenses found</h3>
                <p>Try another search/filter or add a new expense.</p>
              </div>
            ) : (
              <div className="expense-list">
                {filteredExpenses.map((expense) => (
                  <article className="expense-item" key={expense.id}>
                    <div className="expense-icon">{expense.category.charAt(0)}</div>

                    <div className="expense-main">
                      <div className="expense-title-row">
                        <h3>{expense.title}</h3>
                        <strong>{formatCurrency(expense.amount)}</strong>
                      </div>

                      <div className="expense-meta">
                        <span className="category-tag">{expense.category}</span>
                        <span>{formatDate(expense.date)}</span>
                      </div>

                      {expense.note && <p className="expense-note">{expense.note}</p>}
                    </div>

                    <div className="actions">
                      <button className="edit-button" onClick={() => handleEdit(expense)}>
                        Edit
                      </button>
                      <button className="delete-button" onClick={() => handleDelete(expense.id)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card category-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BREAKDOWN</p>
              <h2>Category Summary</h2>
            </div>
          </div>

          {Object.keys(totals.categoryTotals).length === 0 ? (
            <p className="muted">No category data available.</p>
          ) : (
            <div className="category-grid">
              {Object.entries(totals.categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([name, value]) => (
                  <div className="category-summary" key={name}>
                    <div>
                      <span>{name}</span>
                      <strong>{formatCurrency(value)}</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${totals.total ? (value / totals.total) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        Built with React hooks: useState · useEffect · useRef · useMemo · useCallback
      </footer>
    </div>
  );
}

export default App;