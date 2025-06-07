import React, { useState, useEffect } from "react";
import { InputDialogState } from "../types";

interface InputDialogProps {
  dialog: InputDialogState;
}

const InputDialog: React.FC<InputDialogProps> = ({ dialog }) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (dialog.isOpen) {
      setInputValue(dialog.defaultValue || "");
    }
  }, [dialog.isOpen, dialog.defaultValue]);

  if (!dialog.isOpen) return null;

  const handleConfirm = () => {
    if (inputValue.trim()) {
      dialog.onConfirm(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      dialog.onCancel();
    }
  };

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
          <input
            type="text"
            className="modal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dialog.placeholder}
            autoFocus
          />
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={dialog.onCancel}>
            Cancel
          </button>
          <button 
            className="modal-btn modal-btn-primary" 
            onClick={handleConfirm}
            disabled={!inputValue.trim()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputDialog;