import { useState, useEffect, useCallback } from "react";
import "../Dentistas/Dentistas.css";
import "./Financeiro.css";
import { API_URL, authHeaders } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/masks";
import {
  EXPENSE_CATEGORY_LABELS,
  expenseCategoryLabel,
  financeStatusLabel,
  STATUS_COLORS,
} from "./Constants";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import ExpenseModal from "./Componentes/ExpenseModal";

const RECEIVABLE_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "parcial", label: "Parcial" },
  { value: "pago", label: "Pago" },
  { value: "cancelado", label: "Cancelado" },
];

const EXPENSE_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "cancelado", label: "Cancelado" },
];

export default function Lancamentos() {
  const { token } = useAuth();
  const [tab, setTab] = useState("receivables"); // "receivables" | "expenses"

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);

  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);

  const [payTarget, setPayTarget] = useState(null); // { id, kind }
  const [payLoading, setPayLoading] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null); // { id, kind }
  const [cancelLoading, setCancelLoading] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  function showToast(message, type = "success") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tab === "receivables" ? "receivables" : "expenses";
      const params = new URLSearchParams({
        page,
        page_size: pageSize,
        ...(statusFilter && { status: statusFilter }),
        ...(tab === "expenses" && categoryFilter && { category: categoryFilter }),
        ...(dateFrom && { due_date_from: dateFrom }),
        ...(dateTo && { due_date_to: dateTo }),
      });

      const r = await fetch(`${API_URL}/${endpoint}?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setItems(data.items);
      setTotalPages(data.total_pages || 1);
    } catch {
      showToast("Erro ao carregar lançamentos.", "error");
    } finally {
      setLoading(false);
    }
  }, [token, tab, page, statusFilter, categoryFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reseta filtros e página ao trocar de aba
  function switchTab(newTab) {
    setTab(newTab);
    setPage(1);
    setStatusFilter("");
    setCategoryFilter("");
  }

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoryFilter, dateFrom, dateTo]);

  function openCreateExpense() {
    setEditExpense(null);
    setExpenseModalOpen(true);
  }

  function openEditExpense(expense) {
    setEditExpense(expense);
    setExpenseModalOpen(true);
  }

  async function handleExpenseSaved(message, errorMessage) {
    if (!message) {
      showToast(errorMessage || "Erro ao salvar despesa.", "error");
      return;
    }
    showToast(message);
    setExpenseModalOpen(false);
    await loadItems();
  }

  async function handlePay() {
    if (!payTarget) return;
    setPayLoading(true);
    try {
      const endpoint = payTarget.kind === "receivables" ? "receivables" : "expenses";
      const r = await fetch(`${API_URL}/${endpoint}/${payTarget.id}/pay`, {
        method: "POST",
        headers: authHeaders(token),
      });
      if (!r.ok) {
        const errorBody = await r.json().catch(() => null);
        throw new Error(
          typeof errorBody?.detail === "string"
            ? errorBody.detail
            : "Erro ao marcar como pago."
        );
      }
      showToast("Marcado como pago!");
      setPayTarget(null);
      await loadItems();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPayLoading(false);
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const endpoint = cancelTarget.kind === "receivables" ? "receivables" : "expenses";
      const r = await fetch(`${API_URL}/${endpoint}/${cancelTarget.id}/cancel`, {
        method: "POST",
        headers: authHeaders(token),
      });
      if (!r.ok) {
        const errorBody = await r.json().catch(() => null);
        throw new Error(
          typeof errorBody?.detail === "string"
            ? errorBody.detail
            : "Erro ao cancelar."
        );
      }
      showToast("Lançamento cancelado.");
      setCancelTarget(null);
      await loadItems();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCancelLoading(false);
    }
  }

  return (
    <div className="dentist-page">
      <div className="dentist-header">
        <div>
          <h1 className="dentist-title">Lançamentos</h1>
          <p className="dentist-subtitle">
            Todas as receitas e despesas da clínica
          </p>
        </div>
        {tab === "expenses" && (
          <button className="btn-primary" onClick={openCreateExpense}>
            + Nova despesa
          </button>
        )}
      </div>

      <div className="finance-tabs">
        <button
          className={`finance-tab ${tab === "receivables" ? "active" : ""}`}
          onClick={() => switchTab("receivables")}
        >
          Receitas
        </button>
        <button
          className={`finance-tab ${tab === "expenses" ? "active" : ""}`}
          onClick={() => switchTab("expenses")}
        >
          Despesas
        </button>
      </div>

      <div className="dentist-toolbar">
        <div className="filter-group">
          <span className="filter-label">Status</span>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {(tab === "receivables"
              ? RECEIVABLE_STATUS_OPTIONS
              : EXPENSE_STATUS_OPTIONS
            ).map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {tab === "expenses" && (
          <div className="filter-group">
            <span className="filter-label">Categoria</span>
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-group">
          <span className="filter-label">De</span>
          <input
            type="date"
            className="form-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Até</span>
          <input
            type="date"
            className="form-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="table-loading">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <p>Nenhum lançamento encontrado</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Vencimento</th>
                {tab === "receivables" ? (
                  <th>Consulta</th>
                ) : (
                  <>
                    <th>Descrição</th>
                    <th>Categoria</th>
                  </>
                )}
                <th>Valor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const statusStyle =
                  STATUS_COLORS[item.status] ?? STATUS_COLORS.pendente;
                const isPending = item.status === "pendente" || item.status === "parcial";
                const isCancelable = item.status !== "pago" && item.status !== "cancelado";

                return (
                  <tr key={item.id}>
                    <td>
                      {item.due_date
                        ? new Date(item.due_date).toLocaleDateString("pt-BR")
                        : "—"}
                    </td>
                    {tab === "receivables" ? (
                      <td>Consulta #{item.appointment_id}</td>
                    ) : (
                      <>
                        <td>{item.description}</td>
                        <td>{expenseCategoryLabel(item.category)}</td>
                      </>
                    )}
                    <td>
                      {formatCurrency(
                        tab === "receivables" ? item.total_amount : item.amount
                      )}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {financeStatusLabel(item.status)}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        {isPending && (
                          <button
                            className="btn-icon"
                            title="Marcar como pago"
                            onClick={() => setPayTarget({ id: item.id, kind: tab })}
                          >
                            ✅
                          </button>
                        )}
                        {tab === "expenses" && item.status !== "cancelado" && (
                          <button
                            className="btn-icon"
                            title="Editar"
                            onClick={() => openEditExpense(item)}
                          >
                            ✏️
                          </button>
                        )}
                        {isCancelable && (
                          <button
                            className="btn-icon del"
                            title="Cancelar"
                            onClick={() => setCancelTarget({ id: item.id, kind: tab })}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <button
          className="page-btn"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          <i className="ti ti-chevron-left"></i>
        </button>
        <span className="page-counter">
          Página <strong>{page}</strong> de <strong>{totalPages}</strong>
        </span>
        <button
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          <i className="ti ti-chevron-right"></i>
        </button>
      </div>

      <ExpenseModal
        open={expenseModalOpen}
        editExpense={editExpense}
        onClose={() => setExpenseModalOpen(false)}
        onSaved={handleExpenseSaved}
        token={token}
      />

      <ConfirmModal
        open={!!payTarget}
        title="Marcar como pago"
        loading={payLoading}
        confirmLabel="Confirmar"
        loadingLabel="Salvando..."
        onConfirm={handlePay}
        onCancel={() => setPayTarget(null)}
      />

      <ConfirmModal
        open={!!cancelTarget}
        title="Cancelar lançamento"
        loading={cancelLoading}
        confirmLabel="Cancelar lançamento"
        loadingLabel="Cancelando..."
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <Toast {...toast} />
    </div>
  );
}