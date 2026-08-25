import { useState, useEffect, useCallback } from "react";
import "./Pacientes.css";
import { avatarColor, initials } from "./constants";
import { API_URL, authHeaders } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import Toast from "../../components/Toast/Toast";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import PatientModal from "./Componentes/PatientModal";
import PatientDetailsPanel from "./Componentes/PatientDetailsPanel";
import {formatPhone } from "../../utils/masks";

const PAGE_SIZE = 6;

export default function Pacientes() {
  const { token } = useAuth();

  const [patients, setPatients] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  
  const [stats, setStats] = useState({
    total: 0,
    novos30d: 0,
    atendidos30d: 0,
    ativos: 0,
  });

  const [selectedId, setSelectedId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [patientSummary, setPatientSummary] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState(null);

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

  // O debounce impede que varias requests sejam disparados a cada tecla pressionada. Pode ser interessante o uso em outros lugares do projeto.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadPatients = useCallback(
    async (targetPage, append) => {
      setLoadingList(true);
      try  {
        const params = new URLSearchParams({
          page: targetPage,
          page_size: PAGE_SIZE,
          ...(debouncedSearch && { search: debouncedSearch }),
        });
        const r = await fetch(`${API_URL}/patients?${params}`, {
          headers: authHeaders(token),
        });
        if (!r.ok) throw new Error();
        const data = await r.json();

        setPatients((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotalPages(data.total_pages);
        setPage(targetPage);

        if (data.statistics) {
          setStats({
            total: data.statistics.total_patients ?? 0,
            novos30d: data.statistics.new_patients_last_30_days ?? 0,
            atendidos30d: data.statistics.patients_attended_last_30_days ?? 0,
            ativos: data.statistics.active_patients ?? 0,
          });
        }

        if (!append && data.items.length > 0) {
          setSelectedId((current) =>
            current && data.items.some((p) => p.id === current)
              ? current
              : data.items[0].id,
          );
        }
        if (data.items.length === 0 && !append) {
          setSelectedId(null);
        }
      } catch {
        showToast("Erro ao carregar pacientes.", "error");
      } finally {
        setLoadingList(false);
      }
    },
    [token, debouncedSearch],
  );

  useEffect(() => {
    loadPatients(1, false);

  }, [token, debouncedSearch]);

  const loadDetail = useCallback(
    async (id) => {
      if (!id) {
        setSelectedPatient(null);
        return;
      }
      setLoadingDetail(true);
      try {
        const r = await fetch(`${API_URL}/patients/${id}`, {
          headers: authHeaders(token),
        });
        if (!r.ok) throw new Error();
        const data = await r.json();
        setSelectedPatient(data);
      } catch {
        showToast("Erro ao carregar dados do paciente.", "error");
        setSelectedPatient(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    [token],
  );

  const loadSummary = useCallback(
    async (id) => {
      if (!id) {
        setPatientSummary(null);
        return;
      }
      try {
        const r = await fetch(`${API_URL}/patients/${id}/summary`, {
          headers: authHeaders(token),
        });
        if (!r.ok) throw new Error();
        const data = await r.json();
        setPatientSummary(data);
      } catch {
        showToast("Erro ao carregar resumo do paciente.", "error");
        setPatientSummary(null);
      }
    },
    [token],
  );

  const loadHistory = useCallback(
    async (id) => {
      if (!id) {
        setPatientHistory(null);
        return;
      }
      setLoadingHistory(true);
      try {
        const r = await fetch(`${API_URL}/patients/${id}/history`, {
          headers: authHeaders(token),
        });
        if (!r.ok) throw new Error();
        const data = await r.json();
        setPatientHistory(data);
      } catch {
        showToast("Erro ao carregar histórico do paciente.", "error");
        setPatientHistory(null);
      } finally {
        setLoadingHistory(false);
      }
    },
    [token],
  );

  useEffect(() => {
  loadDetail(selectedId);
  loadSummary(selectedId);
  setPatientHistory(null);

  if (selectedId) {
    loadHistory(selectedId);
  }
}, [selectedId, loadDetail, loadSummary, loadHistory]);
  const updateProcedureTooth = useCallback(
    async (procedureItemId, tooth) => {
      try {
        const r = await fetch(`${API_URL}/appointments/procedures/${procedureItemId}/tooth`, {
          method: "PATCH",
          headers: {
            ...authHeaders(token),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tooth }),
        });
        if (!r.ok) throw new Error();
        const updated = await r.json();

        setPatientHistory((prev) =>
          prev
            ? prev.map((appt) => ({
                ...appt,
                procedures: appt.procedures.map((proc) =>
                  proc.id === procedureItemId
                    ? { ...proc, tooth: updated.tooth, display: updated.display }
                    : proc,
                ),
              }))
            : prev,
        );
        return true;
      } catch {
        showToast("Erro ao atualizar o dente do procedimento.", "error");
        return false;
      }
    },
    [token],
  );

  // evita disparar a request de histórico mais de uma vez para o
  // mesmo paciente (ex: clicar várias vezes na aba)
  function handleLoadHistory() {
    if (!selectedId || loadingHistory || patientHistory !== null) return;
    loadHistory(selectedId);
  }

  function openCreate() {
    setEditPatient(null);
    setModalOpen(true);
  }

  function openEdit(patient) {
    setEditPatient(patient);
    setModalOpen(true);
  }

  function openDelete(id) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const r = await fetch(`${API_URL}/patients/${deleteId}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!r.ok) throw new Error();
      showToast("Paciente excluído.");
      setDeleteOpen(false);
      if (selectedId === deleteId) setSelectedId(null);
      await loadPatients(1, false);
    } catch {
      showToast("Erro ao excluir.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleSaved(message) {
    if (!message) {
      showToast("Erro ao salvar paciente.", "error");
      return;
    }
    showToast(message);
    setModalOpen(false);
    const wasEditing = editPatient;
    await loadPatients(1, false);
    if (wasEditing) loadDetail(wasEditing.id);
  }

  function handleLoadMore() {
    if (page < totalPages) loadPatients(page + 1, true);
  }

  return (
    <div className="patient-page">
      <div className="patient-header">
        <div>
          <h1 className="patient-title">Pacientes</h1>
          <p className="patient-subtitle">
            Gerencie e acompanhe os pacientes da clínica
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          + Novo paciente
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
            <span className="stat-label">Total de pacientes</span>
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">pacientes cadastrados</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#DCFCE7" }}>
              <i
                className="ti ti-user-plus"
                style={{ color: "#15803D" }}
                aria-hidden="true"
              />
            </div>
            <span className="stat-label">Novos pacientes</span>
          </div>
          <div className="stat-value">{stats.novos30d}</div>
          <div className="stat-sub">nos últimos 30 dias</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#EEEDFE" }}>
              <i
                className="ti ti-calendar-check"
                style={{ color: "#534AB7" }}
                aria-hidden="true"
              />
            </div>
            <span className="stat-label">Atendidos</span>
          </div>
          <div className="stat-value">{stats.atendidos30d}</div>
          <div className="stat-sub">nos últimos 30 dias</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon" style={{ background: "#FFF7ED" }}>
              <i
                className="ti ti-activity"
                style={{ color: "#C2410C" }}
                aria-hidden="true"
              />
            </div>
            <span className="stat-label">Pacientes ativos</span>
          </div>
          <div className="stat-value">{stats.ativos}</div>
          <div className="stat-sub">atendidos nos últimos 180 dias</div>
        </div>
      </div>

      <div className="patient-layout">
        <div className="patient-list-panel">
          <div className="patient-search-row">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loadingList && patients.length === 0 ? (
            <div className="table-loading">Carregando pacientes...</div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🦷</div>
              <p>Nenhum paciente encontrado</p>
            </div>
          ) : (
            <>
              <ul className="patient-list">
                {patients.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`patient-list-item ${selectedId === p.id ? "selected" : ""}`}
                      onClick={() => setSelectedId(p.id)}
                    >
                      <div
                        className="patient-avatar"
                        style={{ background: avatarColor(p.name) }}
                      >
                        {initials(p.name)}
                      </div>
                      <div className="patient-list-info">
                        <div className="patient-name">{p.name}</div>
                        <div className="patient-phone-sub">{formatPhone(p.phone)}</div>
                      </div>
                      <i
                        className="ti ti-chevron-right patient-list-chevron"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>

              {page < totalPages && (
                <button
                  type="button"
                  className="patient-load-more"
                  onClick={handleLoadMore}
                  disabled={loadingList}
                >
                  {loadingList ? "Carregando..." : "Ver mais pacientes"}
                  <i className="ti ti-chevron-down" aria-hidden="true" />
                </button>
              )}
            </>
          )}
        </div>

        <PatientDetailsPanel
          patient={selectedPatient}
          summary={patientSummary}
          history={patientHistory}
          loading={loadingDetail}
          loadingHistory={loadingHistory}
          onLoadHistory={handleLoadHistory}
          onUpdateProcedureTooth={updateProcedureTooth}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      </div>

      <PatientModal
        open={modalOpen}
        editPatient={editPatient}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        token={token}
      />

      <ConfirmModal
        open={deleteOpen}
        title="Excluir paciente"
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