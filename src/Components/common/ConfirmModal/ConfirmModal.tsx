import React, { ReactNode } from "react";
import "./ConfirmModal.css";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message?: ReactNode;
  loading?: boolean;
  confirmLabel?: string;
  loadingLabel?: string;
  danger?: boolean;
  icon?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title = "Confirmar ação",
  message = "Tem certeza? Esta ação não pode ser desfeita.",
  loading = false,
  confirmLabel = "Confirmar",
  loadingLabel = "Processando...",
  danger = true,
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const displayIcon = icon !== undefined ? icon : (danger ? "⚠️" : "ℹ️");

  return (
    <div
      className={`modal-overlay confirm-modal-overlay ${open ? "open" : ""}`}
      onClick={() => {
        if (!loading && onCancel) onCancel();
      }}
    >
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          {displayIcon && (
            <div className={`confirm-icon-badge ${danger ? "danger" : "primary"}`}>
              {displayIcon}
            </div>
          )}
          <div className="confirm-title-area">
            <h3>{title}</h3>
          </div>
        </div>

        <div className="confirm-message">
          {typeof message === "string" ? <p style={{ margin: 0 }}>{message}</p> : message}
        </div>

        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            className={danger ? "btn-danger" : "btn-primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
