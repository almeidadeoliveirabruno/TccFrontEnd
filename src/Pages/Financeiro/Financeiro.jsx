import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import ExpenseModal from "./Componentes/ExpenseModal";

export default function Financeiro() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [expenseStats, setExpenseStats] = useState(null);
  const [receivableStats, setReceivableStats] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  function showToast(message, type = "success") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesRes, receivablesRes] = await Promise.all([
        fetch(`${API_URL}/expenses?page=1&page_size=5`, {
          headers: authHeaders(token),
        }),
        fetch(`${API_URL}/receivables?page=1&page_size=5`, {
          headers: authHeaders(token),
        }),
      ]);
      if (!expensesRes.ok || !receivablesRes.ok) throw new Error();

      const expensesData = await expensesRes.json();
      const receivablesData = await receivablesRes.json();

      setExpenseStats(expensesData.statistics.expense_statistics);
      setReceivableStats(receivablesData.statistics.receivable_statistics);

      // Prévia: mescla os itens mais recentes das duas listas (só
      // exibição -- a listagem completa com abas fica na outra tela)
      const expenseItems = expensesData.items.map((e) => ({
        id: `expense-${e.id}`,
        date: e.due_date,
        description: e.description,
        category: expenseCategoryLabel(e.category),
        type: "despesa",
        amount: e.amount,
        status: e.status,
      }));

      const receivableItems = receivablesData.items.map((r) => ({
        id: `receivable-${r.id}`,
        date: r.due_date,
        description: `Consulta #${r.appointment_id}`,
        category: "Atendimento",
        type: "receita",
        amount: r.total_amount,
        status: r.status,
      }));

      const merged = [...expenseItems, ...receivableItems]
        .filter((item) => item.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      setRecentItems(merged);
    } catch {
      showToast("Erro ao carregar dados financeiros.", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleExpenseSaved(message) {
    if (!message) {
      showToast("Erro ao salvar despesa.", "error");
      return;
    }
    showToast(message);
    setModalOpen(false);
    await loadData();
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
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          + Novo lançamento
        </button>
      </div>

      {loading ? (
        <div className="table-loading">Carregando dados financeiros...</div>
      ) : (
        <>
          <div className="finance-stats-grid">
            <div className="finance-stat-card">
              <div className="finance-stat-header">
                <div
                  className="stat-icon"
                  style={{ background: "#DCFCE7" }}
                >
                  <i
                    className="ti ti-trending-up"
                    style={{ color: "#15803D" }}
                    aria-hidden="true"
                  />
                </div>
                <span className="stat-label">Receitas</span>
              </div>
              <div className="finance-stat-value">
                {formatCurrency(totalReceitas)}
              </div>
              <div className="stat-sub">total recebido</div>
            </div>

            <div className="finance-stat-card">
              <div className="finance-stat-header">
                <div
                  className="stat-icon"
                  style={{ background: "#FEE2E2" }}
                >
                  <i
                    className="ti ti-trending-down"
                    style={{ color: "#B91C1C" }}
                    aria-hidden="true"
                  />
                </div>
                <span className="stat-label">Despesas</span>
              </div>
              <div className="finance-stat-value">
                {formatCurrency(totalDespesas)}
              </div>
              <div className="stat-sub">total pago</div>
            </div>

            <div className="finance-stat-card">
              <div className="finance-stat-header">
                <div
                  className="stat-icon"
                  style={{ background: "#E4F6F8" }}
                >
                  <i
                    className="ti ti-scale"
                    style={{ color: "#0a9db2" }}
                    aria-hidden="true"
                  />
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
                <div
                  className="stat-icon"
                  style={{ background: "#FEF3C7" }}
                >
                  <i
                    className="ti ti-clock"
                    style={{ color: "#92400E" }}
                    aria-hidden="true"
                  />
                </div>
                <span className="stat-label">A receber</span>
              </div>
              <div className="finance-stat-value">
                {formatCurrency(aReceber)}
              </div>
              <div className="stat-sub">pendente de recebimento</div>
            </div>
          </div>

          <div className="finance-content-grid">
            <div className="finance-panel">
              <div className="finance-panel-header">
                <h2>Últimos lançamentos</h2>
                <button
                  className="btn-link"
                  onClick={() => navigate("/financeiro/lancamentos")}
                >
                  Ver todos
                </button>
              </div>

              {recentItems.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💰</div>
                  <p>Nenhum lançamento registrado ainda</p>
                </div>
              ) : (
                <table className="finance-mini-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrição</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentItems.map((item) => {
                      const statusStyle =
                        STATUS_COLORS[item.status] ?? STATUS_COLORS.pendente;
                      return (
                        <tr key={item.id}>
                          <td>
                            {new Date(item.date).toLocaleDateString("pt-BR")}
                          </td>
                          <td>{item.description}</td>
                          <td>{item.category}</td>
                          <td>
                            <span
                              className={`type-badge type-${item.type}`}
                            >
                              {item.type === "receita" ? "Receita" : "Despesa"}
                            </span>
                          </td>
                          <td>{formatCurrency(item.amount)}</td>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="finance-panel finance-donut-panel">
              <div className="finance-panel-header">
                <h2>Distribuição</h2>
              </div>

              {donutTotal === 0 ? (
                <div className="empty-state">
                  <p>Sem dados suficientes ainda</p>
                </div>
              ) : (
                <>
                  <div
                    className="donut-chart"
                    style={{
                      background: `conic-gradient(#0CB0C7 0% ${receitaPercent}%, #F87171 ${receitaPercent}% 100%)`,
                    }}
                  >
                    <div className="donut-hole">
                      <span className="donut-value">
                        {receitaPercent.toFixed(0)}%
                      </span>
                      <span className="donut-label">Receita</span>
                    </div>
                  </div>
                  <div className="donut-legend">
                    <div className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: "#0CB0C7" }}
                      />
                      Receitas — {formatCurrency(totalReceitas)}
                    </div>
                    <div className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: "#F87171" }}
                      />
                      Despesas — {formatCurrency(totalDespesas)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <ExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleExpenseSaved}
        token={token}
      />

      <Toast {...toast} />
    </div>
  );
}