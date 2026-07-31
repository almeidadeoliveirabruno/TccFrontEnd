import {
  X,
  MessageCircleOff,
  Pencil,
  Ban,
  CheckCircle2,
  UserX,
  RotateCcw,
} from "lucide-react";
import {
  APPOINTMENT_STATUS,
  getConfirmationUi,
} from "../constants";
import { formatLongDate, formatTimeShort } from "../utils";
import { ConfirmationBadge } from "./AgendaBoard";
import {formatPhone} from "../../../utils/masks";

// Para cada status atual, quais transições fazem sentido oferecer e com
// qual rótulo/ícone. O primeiro item de cada lista vira o chip "primary".
const STATUS_ACTIONS = {
  agendado: [
    { status: "confirmado", label: "Confirmar", icon: CheckCircle2 },
    { status: "realizado", label: "Realizado", icon: CheckCircle2 },
    { status: "faltou", label: "Faltou", icon: UserX },
  ],
  confirmado: [
    { status: "realizado", label: "Realizado", icon: CheckCircle2 },
    { status: "faltou", label: "Faltou", icon: UserX },
    { status: "agendado", label: "Voltar p/ agendado", icon: RotateCcw },
  ],
  realizado: [
    { status: "agendado", label: "Voltar p/ agendado", icon: RotateCcw },
  ],
  faltou: [
    { status: "agendado", label: "Voltar p/ agendado", icon: RotateCcw },
  ],
  cancelado: [
    { status: "agendado", label: "Reabrir agendamento", icon: RotateCcw },
  ],
};

export default function AppointmentDetailPanel({
  detail,
  patient,
  dentist,
  loading,
  onClose,
  onEdit,
  onCancel,
  onStatusChange,
  statusUpdateLoading,
  cancelLoading,
}) {
  const statusStyle =
    APPOINTMENT_STATUS[detail?.status] ?? APPOINTMENT_STATUS.agendado;
  const confirmation = getConfirmationUi(detail ?? {});
  const procedures =
    detail?.procedures?.map((p) => {
      const name = p.procedure?.name ?? "Procedimento";
      return p.tooth ? `${name} (dente ${p.tooth})` : name;
    }) ?? [];

  const nextActions = detail ? STATUS_ACTIONS[detail.status] ?? [] : [];

  return (
    <aside className="agenda-detail-panel open">
      <div className="agenda-detail-header">
        <div>
          <h3>Detalhes do agendamento</h3>
          <p>Informações completas e ações rápidas</p>
        </div>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      {loading && !detail ? (
        <p className="agenda-detail-loading">Carregando...</p>
      ) : !detail ? (
        <p className="agenda-detail-loading">Selecione um agendamento na grade.</p>
      ) : (
        <>
          <div className="agenda-detail-section">
            <dl className="agenda-detail-list">
              <div>
                <dt>Paciente</dt>
                <dd>{patient?.name ?? "—"}</dd>
              </div>
              <div>
                <dt>Telefone</dt>
                <dd>{patient?.phone ? formatPhone(patient.phone) : "—"}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{formatLongDate(detail.appointment_date)}</dd>
              </div>
              <div>
                <dt>Horário</dt>
                <dd>
                  {formatTimeShort(detail.time_begin)} – {formatTimeShort(detail.time_end)}
                </dd>
              </div>
              <div>
                <dt>Dentista</dt>
                <dd>{dentist?.name ?? "—"}</dd>
              </div>
              <div>
                <dt>Procedimento(s)</dt>
                <dd>{procedures.join(", ") || "—"}</dd>
              </div>
              <div className="full">
                <dt>Status da consulta</dt>
                <dd>
                  <span
                    className="agenda-status-pill"
                    style={{
                      background: statusStyle.badgeBg,
                      color: statusStyle.badgeColor,
                    }}
                  >
                    {statusStyle.label}
                  </span>
                </dd>
                {nextActions.length > 0 && (
                  <div className="agenda-status-actions">
                    {nextActions.map((action, i) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.status}
                          type="button"
                          className={`agenda-status-chip ${i === 0 ? "primary" : ""}`}
                          onClick={() => onStatusChange(action.status)}
                          disabled={statusUpdateLoading}
                          title={action.label}
                        >
                          <Icon size={13} />
                          {statusUpdateLoading ? "Salvando..." : action.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {detail.notes ? (
                <div className="full">
                  <dt>Observações</dt>
                  <dd>{detail.notes}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="agenda-detail-whatsapp">
            <div className="agenda-detail-whatsapp-head">
              <MessageCircleOff size={18} />
              <div>
                <strong>Confirmação com o paciente</strong>
                <p>{confirmation.label}</p>
              </div>
              <button
                type="button"
                className="agenda-whatsapp-resend-btn"
                disabled
                title="Integração WhatsApp em desenvolvimento"
              >
                Reenviar
              </button>
            </div>
            <ConfirmationBadge appointment={detail} />
            <p className="agenda-detail-whatsapp-note">
              O envio automático via WhatsApp será integrado em breve. Por enquanto,
              use o status da consulta para registrar a resposta do paciente.
            </p>
          </div>

          <div className="agenda-detail-actions">
            <button
              type="button"
              className="agenda-action-btn"
              onClick={onEdit}
              disabled={detail.status === "cancelado"}
            >
              <Pencil size={16} />
              Editar agendamento
            </button>

            {detail.status !== "cancelado" ? (
              <button
                type="button"
                className="agenda-action-btn danger"
                onClick={onCancel}
                disabled={cancelLoading}
              >
                <Ban size={16} />
                {cancelLoading ? "Cancelando..." : "Cancelar agendamento"}
              </button>
            ) : null}
          </div>
        </>
      )}
    </aside>
  );
}