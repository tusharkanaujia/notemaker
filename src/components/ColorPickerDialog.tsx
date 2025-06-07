import React, { useState, useEffect } from "react";
import { ColorPickerDialogState } from "../types";

interface ColorPickerDialogProps {
  dialog: ColorPickerDialogState;
}

const ColorPickerDialog: React.FC<ColorPickerDialogProps> = ({ dialog }) => {
  const [selectedColor, setSelectedColor] = useState(dialog.currentColor);

  const predefinedColors = [
    "#3b82f6", // Blue
    "#ef4444", // Red  
    "#10b981", // Green
    "#f59e0b", // Yellow
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#f97316", // Orange
    "#6b7280", // Gray
    "#1f2937", // Dark Gray
    "#ffffff", // White
  ];

  useEffect(() => {
    if (dialog.isOpen) {
      setSelectedColor(dialog.currentColor);
    }
  }, [dialog.isOpen, dialog.currentColor]);

  if (!dialog.isOpen) return null;

  const handleConfirm = () => {
    dialog.onConfirm(selectedColor);
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
          <div className="color-picker-grid">
            {predefinedColors.map((color) => (
              <button
                key={color}
                className={`color-option ${selectedColor === color ? "selected" : ""}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                title={color}
              />
            ))}
          </div>
          <div className="custom-color-section">
            <label htmlFor="custom-color">Custom Color:</label>
            <input
              id="custom-color"
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="custom-color-input"
            />
          </div>
          <div className="color-preview">
            <span>Preview: </span>
            <div 
              className="color-preview-box"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="color-code">{selectedColor}</span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={dialog.onCancel}>
            Cancel
          </button>
          <button className="modal-btn modal-btn-primary" onClick={handleConfirm}>
            Apply Color
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerDialog;