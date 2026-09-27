import "./AppointmentDetailPanel.css";
import {
  X,
  MessageCircle,
  Pencil,
  Ban,
  CheckCircle2,
  UserX,
  RotateCcw,
} from "lucide-react";
import {
  APPOINTMENT_STATUS,
  getConfirmationUi,
} from "../../Pages/Agenda/constants";
import { formatLongDate, formatTimeShort } from "../../Pages/Agenda/utils";
import { ConfirmationBadge, WhatsAppIcon } from "./AgendaBoard";
import { formatPhone } from "../../utils/masks";

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
  onMarkMessageSent,
  confirmMsgLoading,
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
              <div>
                <dt>Financeiro</dt>
                <dd>
                  {detail.receivable ? (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: detail.receivable.status === "pago" ? "#DCFCE7" : "#FEF3C7",
                      color: detail.receivable.status === "pago" ? "#16A34A" : "#D97706",
                    }}>
                      💰 {detail.receivable.status === "pago" ? "Pago" : detail.receivable.status === "cancelado" ? "Cancelado" : "Cobrança gerada"}
                    </span>
                  ) : (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 500,
                      backgroundColor: "#F3F4F6",
                      color: "#6B7280",
                    }}>
                      Sem cobrança (Retorno)
                    </span>
                  )}
                </dd>
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
                      const targetStyle =
                        APPOINTMENT_STATUS[action.status] ?? APPOINTMENT_STATUS.agendado;
                      const isPrimary = i === 0;
                      const isLight = targetStyle.accent === "#FEF3C7";
                      const buttonColor = isPrimary
                        ? (targetStyle.accentText || (isLight ? "#78350f" : "#fff"))
                        : targetStyle.badgeColor;
                      const buttonBorder = isPrimary
                        ? (isLight ? "#f59e0b" : targetStyle.accent)
                        : (targetStyle.accent + "55");

                      return (
                        <button
                          key={action.status}
                          type="button"
                          className="agenda-status-chip"
                          style={{
                            background: isPrimary ? targetStyle.accent : targetStyle.badgeBg,
                            color: buttonColor,
                            borderColor: buttonBorder,
                            boxShadow: isPrimary ? `0 4px 12px ${targetStyle.accent}55` : undefined,
                            fontWeight: 700,
                          }}
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
              <WhatsAppIcon size={18} color="#25d366" />
              <div>
                <strong>Confirmação com o paciente</strong>
                <p>Envie uma mensagem de confirmação via WhatsApp</p>
              </div>
            </div>
            <ConfirmationBadge appointment={detail} />
            <button
              type="button"
              className="agenda-whatsapp-send-btn"
              disabled={!patient?.phone}
              title={patient?.phone ? "Abrir WhatsApp Web com mensagem pronta" : "Paciente sem telefone cadastrado"}
              onClick={() => {
                const rawPhone = (patient.phone ?? "").replace(/\D/g, "");
                const phone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
                const date = formatLongDate(detail.appointment_date);
                const time = formatTimeShort(detail.time_begin);

                const lines = [
                  "Olá, " + patient.name + "!",
                  "Passando para confirmar sua consulta na nossa clínica.",
                  "",
                  "Data: " + date,
                  "Horário: " + time,
                  "Dentista: " + (dentist?.name ?? "-"),
                  "Contato: " + formatPhone(patient.phone),
                  "",
                  "Por favor, confirme sua presença respondendo esta mensagem.",
                ];
                const msg = lines.join("\n");

                window.open(
                  `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
                  "_blank",
                );

                if (!detail.confirmation_message_sent && onMarkMessageSent) {
                  onMarkMessageSent(true);
                }
              }}
            >
              <WhatsAppIcon size={16} color="currentColor" />
              {detail.confirmation_message_sent
                ? "Reenviar mensagem no WhatsApp"
                : "Enviar mensagem de confirmação"}
            </button>

            {detail.confirmation_message_sent ? (
              <button
                type="button"
                className="agenda-action-btn"
                style={{ marginTop: 8 }}
                onClick={() => onMarkMessageSent(false)}
                disabled={confirmMsgLoading}
                title="Desmarcar envio caso tenha sido confirmado por engano"
              >
                <RotateCcw size={15} />
                {confirmMsgLoading ? "Atualizando..." : "Desmarcar envio de mensagem"}
              </button>
            ) : (
              <button
                type="button"
                className="agenda-action-btn primary"
                style={{ marginTop: 8 }}
                onClick={() => onMarkMessageSent(true)}
                disabled={confirmMsgLoading}
              >
                <CheckCircle2 size={16} />
                {confirmMsgLoading ? "Registrando..." : "Confirmar envio da mensagem"}
              </button>
            )}
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