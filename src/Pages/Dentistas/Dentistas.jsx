import { useState, useEffect, useCallback } from "react";
import "./Dentistas.css";
import {
  SPECIALTIES,
  SPECIALTY_COLORS,
  STATUS_OPTIONS,
  STATUS_COLORS,
  statusLabel,
} from "./constants";
import { API_URL, authHeaders } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import DentistModal from "./Componentes/DentistModal";
import DentistDetailsPanel from "./Componentes/DentistDetailsPanel";

const AVATAR_PALETTE = [
  "#0CB0C7",
  "#818CF8",
  "#34D399",
  "#FB923C",
  "#F472B6",
  "#60A5FA",
];

function avatarColor(name) {
  let hash = 0;
  for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function Dentistas() {
  const { token } = useAuth();
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
    specialties: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editDentist, setEditDentist] = useState(null);
  const [selectedDentist, setSelectedDentist] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  function showToast(message, type = "success") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
  }

  const loadDentists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        page_size: pageSize,
        ...(search && { search }),
        ...(specFilter && { specialty: specFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const r = await fetch(`${API_URL}/dentists?${params}`, {
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setDentists(data.items);
      setTotalPages(data.total_pages);
      setStats({
        total: data.statistics.total_dentists,
        ativos: data.statistics.by_status?.ativo ?? 0,
        inativos: data.statistics.by_status?.inativo ?? 0,
        specialties: data.statistics.unique_specialties,
      });
    } catch {
      showToast("Erro ao carregar dentistas.", "error");
    } finally {
      setLoading(false);
    }
  }, [token, page, search, specFilter, statusFilter]);

  useEffect(() => {
    loadDentists();
  }, [loadDentists]);

  useEffect(() => {
    if (!dentists.length) {
      setSelectedDentist(null);
      return;
    }

    setSelectedDentist((current) => {
      if (current && dentists.some((dentist) => dentist.id === current.id)) {
        return current;
      }
      return dentists[0];
    });
  }, [dentists]);

  // reseta pra página 1 sempre que algum filtro mudar
  useEffect(() => {
    setPage(1);
  }, [search, specFilter, statusFilter]);

  function openCreate() {
    setEditDentist(null);
    setModalOpen(true);
  }

  function openEdit(dentist) {
    setEditDentist(dentist);
    setModalOpen(true);
  }

  function openDelete(id) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  function selectDentist(dentist) {
    setSelectedDentist((current) =>
      current?.id === dentist.id ? null : dentist,
    );
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const r = await fetch(`${API_URL}/dentists/${deleteId}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      showToast("Dentista excluído.");
      setDeleteOpen(false);
      await loadDentists();
    } catch {
      showToast("Erro ao excluir.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSaved(message) {
    if (!message) {
      showToast("Erro ao salvar dentista.", "error");
      return;
    }
    showToast(message);
    setModalOpen(false);
    await loadDentists();
  }

  return (
    <div className="dentist-page">
      <div className="dentist-header">
        <div>
          <h1 className="dentist-title">Dentistas</h1>
          <p className="dentist-subtitle">
            Gerencie os profissionais da clínica
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Novo dentista
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#E4F6F8" }}>
              <i
                className="ti ti-users"
                style={{ color: "#0a9db2" }}
                aria-hidden="true"
              />
            </div>
            <span className="stat-label">Total de dentistas</span>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">profissionais cadastrados</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#DCFCE7" }}>
              <i
                className="ti ti-user-check"
                style={{ color: "#15803D" }}
                aria-hidden="true"
              />
            </div>
            <span className="stat-label">Ativos</span>
          </div>
          <div className="stat-value">{stats.ativos}</div>
          <div className="stat-sub">profissionais ativos</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#FEE2E2" }}>
              <i
                className="ti ti-user-off"
                style={{ color: "#B91C1C" }}
                aria-hidden="true"
              />
            </div>
            <span className="stat-label">Inativos</span>
          </div>
          <div className="stat-value">{stats.inativos}</div>
          <div className="stat-sub">profissional(is) inativo(s)</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#EEEDFE" }}>
              <i
                className="ti ti-star"
                style={{ color: "#534AB7" }}
                aria-hidden="true"
              />
            </div>
            <span className="stat-label">Especialidades</span>
          </div>
          <div className="stat-value">{stats.specialties}</div>
          <div className="stat-sub">especialidades diferentes</div>
        </div>
      </div>

      <div className="dentist-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar dentista..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <span className="filter-label">Especialidade</span>
          <select
            className="filter-select"
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {SPECIALTIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <span className="filter-label">Status</span>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dentist-content">
        <div className="table-wrap">
          {loading ? (
            <div className="table-loading">Carregando dentistas...</div>
          ) : stats.total === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🦷</div>
              <p>Nenhum dentista encontrado</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Dentista</th>
                  <th>Especialidade</th>
                  <th>CRO</th>
                  <th>Contato</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dentists.map((d) => {
                  const statusStyle =
                    STATUS_COLORS[d.status] ?? STATUS_COLORS.ativo;
                  const isSelected = selectedDentist?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      className={`dentist-row ${isSelected ? "selected" : ""}`}
                      onClick={() => selectDentist(d)}
                    >
                      <td>
                        <div className="dentist-cell">
                          <div
                            className="dentist-avatar"
                            style={{ background: avatarColor(d.name) }}
                          >
                            {initials(d.name)}
                          </div>
                          <div>
                            <div className="dentist-name">{d.name}</div>
                            <div className="dentist-email-sub">{d.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {d.specialties && d.specialties.length > 0 ? (
                          <div className="spec-cell-multi">
                            {d.specialties.map((spec) => {
                              const specStyle = SPECIALTY_COLORS[spec] ?? {
                                dot: "#9CA3AF",
                              };
                              return (
                                <span key={spec} className="spec-cell">
                                  <span
                                    className="spec-dot"
                                    style={{ background: specStyle.dot }}
                                  />
                                  {spec}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{d.cro}</td>
                      <td>
                        <div className="contact-cell">
                          <span className="contact-line">
                            <i className="ti ti-phone" aria-hidden="true" />{" "}
                            {d.phone}
                          </span>
                          <span className="contact-line">
                            <i className="ti ti-mail" aria-hidden="true" />{" "}
                            {d.email}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {statusLabel(d.status)}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="row-actions">
                          <button
                            className="btn-icon"
                            onClick={() => openEdit(d)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon del"
                            onClick={() => openDelete(d.id)}
                            title="Excluir"
                          >
                            🗑️
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

        <div className="dentist-details-panel">
          <DentistDetailsPanel dentist={selectedDentist} token={token} />
        </div>
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

      <DentistModal
        open={modalOpen}
        editDentist={editDentist}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        token={token}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Excluir dentista"
        loading={deleteLoading}
        confirmLabel="Excluir"
        loadingLabel="Excluindo..."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <Toast {...toast} />
    </div>
  );
}
