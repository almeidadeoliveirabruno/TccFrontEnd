import { useState, useEffect, useCallback } from "react";
import "../Atendimentos/Atendimentos.css";
import "./Financeiro.css";
import { API_URL, authHeaders } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { formatCurrency } from "../../utils/masks";
import {
  expenseCategoryLabel,
  financeStatusLabel,
  STATUS_COLORS,
} from "./constants";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import ExpenseModal from "./Componentes/ExpenseModal";
import AppointmentQuickDetailModal from "./Componentes/AppointmentQuickDetailModal";

const DESPESA_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "cancelado", label: "Cancelado" },
];

const RECEITA_STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "parcial", label: "Parcial" },
  { value: "pago", label: "Pago" },
  { value: "cancelado", label: "Cancelado" },
];

const TABLE_PAGE_SIZE = 6;

export default function Financeiro() {
  const { token } = useAuth();

  // ---- período compartilhado pelas duas tabelas ----
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ---- despesas ----
  const [despesas, setDespesas] = useState([]);
  const [despesasLoading, setDespesasLoading] = useState(true);
  const [despesasPage, setDespesasPage] = useState(1);
  const [despesasTotalPages, setDespesasTotalPages] = useState(1);
  const [despesaStatus, setDespesaStatus] = useState("");
  const [despesaCategory, setDespesaCategory] = useState("");
  const [expenseStats, setExpenseStats] = useState(null);
  const [categories, setCategories] = useState([]);

  // ---- receitas (entradas) ----
  const [receitas, setReceitas] = useState([]);
  const [receitasLoading, setReceitasLoading] = useState(true);
  const [receitasPage, setReceitasPage] = useState(1);
  const [receitasTotalPages, setReceitasTotalPages] = useState(1);
  const [receitaStatus, setReceitaStatus] = useState("");
  const [receivableStats, setReceivableStats] = useState(null);

  // ---- modais ----
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [payTarget, setPayTarget] = useState(null); // expense id
  const [payLoading, setPayLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null); // expense id
  const [cancelLoading, setCancelLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAppointmentId, setDetailAppointmentId] = useState(null);

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  function showToast(message, type = "success") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  // categorias pro <select> de filtro -- vem do enum do backend, não de
  // um mapa local, pra nunca desincronizar
  useEffect(() => {
    fetch(`${API_URL}/expenses/categories`, { headers: authHeaders(token) })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(data ?? []))
      .catch(() => setCategories([]));
  }, [token]);

  const loadDespesas = useCallback(async () => {
    setDespesasLoading(true);
    try {
      const params = new URLSearchParams({
        page: despesasPage,
        page_size: TABLE_PAGE_SIZE,
        ...(despesaStatus && { status: despesaStatus }),
        ...(despesaCategory && { category: despesaCategory }),
        ...(dateFrom && { due_date_from: dateFrom }),
        ...(dateTo && { due_date_to: dateTo }),
      });
      const r = await fetch(`${API_URL}/expenses?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setDespesas(data.items ?? []);
      setDespesasTotalPages(data.total_pages || 1);
      // statistics sempre vem sobre o total da clínica, independente dos
      // filtros aplicados na listagem -- por isso é seguro alimentar os
      // cards a partir dessa mesma chamada
      setExpenseStats(data.statistics?.expense_statistics ?? null);
    } catch {
      showToast("Erro ao carregar despesas.", "error");
    } finally {
      setDespesasLoading(false);
    }
  }, [token, despesasPage, despesaStatus, despesaCategory, dateFrom, dateTo]);

  const loadReceitas = useCallback(async () => {
    setReceitasLoading(true);
    try {
      const params = new URLSearchParams({
        page: receitasPage,
        page_size: TABLE_PAGE_SIZE,
        ...(receitaStatus && { status: receitaStatus }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      });
      const r = await fetch(`${API_URL}/receivables?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setReceitas(data.items ?? []);
      setReceitasTotalPages(data.total_pages || 1);
      setReceivableStats(data.statistics?.receivable_statistics ?? null);
    } catch {
      showToast("Erro ao carregar entradas.", "error");
    } finally {
      setReceitasLoading(false);
    }
  }, [token, receitasPage, receitaStatus, dateFrom, dateTo]);

  useEffect(() => {
    loadDespesas();
  }, [loadDespesas]);

  useEffect(() => {
    loadReceitas();
  }, [loadReceitas]);

  // período compartilhado reseta a paginação das duas tabelas
  useEffect(() => {
    setDespesasPage(1);
    setReceitasPage(1);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    setDespesasPage(1);
  }, [despesaStatus, despesaCategory]);

  useEffect(() => {
    setReceitasPage(1);
  }, [receitaStatus]);

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
    await loadDespesas();
  }

  async function handlePay() {
    if (!payTarget) return;
    setPayLoading(true);
    try {
      const r = await fetch(`${API_URL}/expenses/${payTarget}/pay`, {
        method: "POST",
        headers: authHeaders(token),
      });
      if (!r.ok) {
        const errorBody = await r.json().catch(() => null);
        throw new Error(
          typeof errorBody?.detail === "string" ? errorBody.detail : "Erro ao marcar como pago."
        );
      }
      showToast("Despesa marcada como paga!");
      setPayTarget(null);
      await loadDespesas();
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
      const r = await fetch(`${API_URL}/expenses/${cancelTarget}/cancel`, {
        method: "POST",
        headers: authHeaders(token),
      });
      if (!r.ok) {
        const errorBody = await r.json().catch(() => null);
        throw new Error(
          typeof errorBody?.detail === "string" ? errorBody.detail : "Erro ao cancelar."
        );
      }
      showToast("Despesa cancelada.");
      setCancelTarget(null);
      await loadDespesas();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCancelLoading(false);
    }
  }

  function openDetail(appointmentId) {
    setDetailAppointmentId(appointmentId);
    setDetailOpen(true);
  }

  const totalReceitas = Number(receivableStats?.total_pago ?? 0);
  const totalDespesas = Number(expenseStats?.total_pago ?? 0);
  const saldo = totalReceitas - totalDespesas;
  const aReceber =
    Number(receivableStats?.total_pendente ?? 0) +
    Number(receivableStats?.total_parcial ?? 0);

  const donutTotal = totalReceitas + totalDespesas;
  const receitaPercent = donutTotal > 0 ? (totalReceitas / donutTotal) * 100 : 0;

  return (
    <div className="finance-page">
      <div className="finance-header">
        <div>
          <h1 className="finance-title">Financeiro</h1>
          <p className="finance-subtitle">
            Visão geral das receitas e despesas da clínica
          </p>
        </div>
        <button className="btn-primary" onClick={openCreateExpense}>
          + Nova despesa
        </button>
      </div>

      <div className="finance-stats-grid">
        <div className="finance-stat-card">
          <div className="finance-stat-header">
            <div className="stat-icon" style={{ background: "#DCFCE7" }}>
              <i className="ti ti-trending-up" style={{ color: "#15803D" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Receitas</span>
          </div>
          <div className="finance-stat-value">{formatCurrency(totalReceitas)}</div>
          <div className="stat-sub">total recebido</div>
        </div>

        <div className="finance-stat-card">
          <div className="finance-stat-header">
            <div className="stat-icon" style={{ background: "#FEE2E2" }}>
              <i className="ti ti-trending-down" style={{ color: "#B91C1C" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Despesas</span>
          </div>
          <div className="finance-stat-value">{formatCurrency(totalDespesas)}</div>
          <div className="stat-sub">total pago</div>
        </div>

        <div className="finance-stat-card">
          <div className="finance-stat-header">
            <div className="stat-icon" style={{ background: "#E4F6F8" }}>
              <i className="ti ti-scale" style={{ color: "#0a9db2" }} aria-hidden="true" />
            </div>
            <span className="stat-label">Saldo</span>
          </div>
          <div
            className="finance-stat-value"
            style={{ color: saldo >= 0 ? "#15803D" : "#B91C1C" }}
          >
            {formatCurrency(saldo)}
          </div>
          <div className="stat-sub">receitas - despesas</div>
        </div>

        <div className="finance-stat-card">
          <div className="finance-stat-header">
            <div className="stat-icon" style={{ background: "#FEF3C7" }}>
              <i className="ti ti-clock" style={{ color: "#92400E" }} aria-hidden="true" />
            </div>
            <span className="stat-label">A receber</span>
          </div>
          <div className="finance-stat-value">{formatCurrency(aReceber)}</div>
          <div className="stat-sub">pendente de recebimento</div>
        </div>
      </div>

      <div className="finance-panel finance-donut-wide">
        <div className="finance-panel-header">
          <h2>Distribuição</h2>
        </div>

        {donutTotal === 0 ? (
          <div className="empty-state">
            <p>Sem dados suficientes ainda</p>
          </div>
        ) : (
          <div className="donut-wide-content">
            <div
              className="donut-chart donut-chart-lg"
              style={{
                background: `conic-gradient(#0CB0C7 0% ${receitaPercent}%, #F87171 ${receitaPercent}% 100%)`,
              }}
            >
              <div className="donut-hole donut-hole-lg">
                <span className="donut-value">{receitaPercent.toFixed(0)}%</span>
                <span className="donut-label">Receita</span>
              </div>
            </div>
            <div className="donut-legend donut-legend-wide">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "#0CB0C7" }} />
                Receitas — {formatCurrency(totalReceitas)}
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "#F87171" }} />
                Despesas — {formatCurrency(totalDespesas)}
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: "#FBBF24" }} />
                A receber — {formatCurrency(aReceber)}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="finance-period-toolbar">
        <div className="filter-group">
          <span className="filter-label">Período de</span>
          <input
            type="date"
            className="filter-select"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <span className="filter-label">até</span>
          <input
            type="date"
            className="filter-select"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="finance-tables-grid">
        {/* ---------- DESPESAS ---------- */}
        <div className="finance-panel">
          <div className="finance-panel-header">
            <h2>Despesas</h2>
          </div>

          <div className="finance-table-toolbar">
            <select
              className="filter-select"
              value={despesaStatus}
              onChange={(e) => setDespesaStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              {DESPESA_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              className="filter-select"
              value={despesaCategory}
              onChange={(e) => setDespesaCategory(e.target.value)}
            >
              <option value="">Todas categorias</option>
              {categories.map((c) => (
                <option key={c.value ?? c} value={c.value ?? c}>
                  {c.label ?? expenseCategoryLabel(c)}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            {despesasLoading ? (
              <div className="table-loading">Carregando...</div>
            ) : despesas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💸</div>
                <p>Nenhuma despesa encontrada</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Vencimento</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {despesas.map((item) => {
                    const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.pendente;
                    const isPending = item.status === "pendente";
                    const isCancelable = item.status !== "pago" && item.status !== "cancelado";
                    return (
                      <tr key={item.id}>
                        <td>
                          {item.due_date
                            ? new Date(item.due_date).toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td>
                          <div className="proc-name">{item.description}</div>
                          <div className="proc-desc">{expenseCategoryLabel(item.category)}</div>
                        </td>
                        <td className="proc-price">{formatCurrency(item.amount)}</td>
                        <td>
                          <span
                            className="badge"
                            style={{ background: statusStyle.bg, color: statusStyle.color }}
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
                                onClick={() => setPayTarget(item.id)}
                              >
                                ✅
                              </button>
                            )}
                            {item.status !== "cancelado" && (
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
                                className="btn-icon"
                                title="Cancelar"
                                onClick={() => setCancelTarget(item.id)}
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
              disabled={despesasPage === 1}
              onClick={() => setDespesasPage((p) => p - 1)}
            >
              <i className="ti ti-chevron-left"></i>
            </button>
            <span className="page-counter">
              Página <strong>{despesasPage}</strong> de <strong>{despesasTotalPages}</strong>
            </span>
            <button
              className="page-btn"
              disabled={despesasPage === despesasTotalPages}
              onClick={() => setDespesasPage((p) => p + 1)}
            >
              <i className="ti ti-chevron-right"></i>
            </button>
          </div>
        </div>

        {/* ---------- ENTRADAS ---------- */}
        <div className="finance-panel">
          <div className="finance-panel-header">
            <h2>Entradas</h2>
          </div>

          <div className="finance-table-toolbar">
            <select
              className="filter-select"
              value={receitaStatus}
              onChange={(e) => setReceitaStatus(e.target.value)}
            >
              <option value="">Todos os status</option>
              {RECEITA_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            {receitasLoading ? (
              <div className="table-loading">Carregando...</div>
            ) : receitas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💰</div>
                <p>Nenhuma entrada encontrada</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Dentista</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {receitas.map((item) => {
                    const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.pendente;
                    return (
                      <tr key={item.id}>
                        <td>
                          {item.appointment_date
                            ? new Date(item.appointment_date).toLocaleDateString("pt-BR")
                            : "—"}
                        </td>
                        <td>{item.dentist_name ?? "—"}</td>
                        <td className="proc-price">{formatCurrency(item.total_amount)}</td>
                        <td>
                          <span
                            className="badge"
                            style={{ background: statusStyle.bg, color: statusStyle.color }}
                          >
                            {financeStatusLabel(item.status)}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="btn-icon"
                              title="Ver detalhes da consulta"
                              onClick={() => openDetail(item.appointment_id)}
                            >
                              🔍
                            </button>
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
              disabled={receitasPage === 1}
              onClick={() => setReceitasPage((p) => p - 1)}
            >
              <i className="ti ti-chevron-left"></i>
            </button>
            <span className="page-counter">
              Página <strong>{receitasPage}</strong> de <strong>{receitasTotalPages}</strong>
            </span>
            <button
              className="page-btn"
              disabled={receitasPage === receitasTotalPages}
              onClick={() => setReceitasPage((p) => p + 1)}
            >
              <i className="ti ti-chevron-right"></i>
            </button>
          </div>
        </div>
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
        title="Marcar despesa como paga"
        loading={payLoading}
        confirmLabel="Confirmar"
        loadingLabel="Salvando..."
        onConfirm={handlePay}
        onCancel={() => setPayTarget(null)}
      />

      <ConfirmModal
        open={!!cancelTarget}
        title="Cancelar despesa"
        loading={cancelLoading}
        confirmLabel="Cancelar despesa"
        loadingLabel="Cancelando..."
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      <AppointmentQuickDetailModal
        open={detailOpen}
        appointmentId={detailAppointmentId}
        onClose={() => setDetailOpen(false)}
        token={token}
      />

      <Toast {...toast} />
    </div>
  );
}