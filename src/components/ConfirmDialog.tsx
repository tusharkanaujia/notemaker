import React from "react";
import { ConfirmDialogState } from "../types";

interface ConfirmDialogProps {
  dialog: ConfirmDialogState;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ dialog }) => {
  if (!dialog.isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{dialog.title}</h3>
          <button className="modal-close" onClick={dialog.onCancel}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>{dialog.message}</p>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={dialog.onCancel}>
            Cancel
          </button>
          <button className="modal-btn modal-btn-primary" onClick={dialog.onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;