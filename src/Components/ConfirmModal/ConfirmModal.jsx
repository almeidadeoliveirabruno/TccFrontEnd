export default function ConfirmModal({
  open,
  title = "Confirmar ação",
  message = "Tem certeza? Esta ação não pode ser desfeita.",
  loading,
  confirmLabel = "Confirmar",
  loadingLabel = "Processando...",
  danger = true,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className={`modal-overlay ${open ? "open" : ""}`}
      onClick={(e) => e.target.classList.contains("modal-overlay") && onCancel()}
    >
      <div className="confirm-box">
        <h3>{title}</h3>
        <p>{message}</p>
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