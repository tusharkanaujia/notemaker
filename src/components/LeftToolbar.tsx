import React from "react";
import { Element } from "../types";

interface LeftToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  selectedElement: Element | null;
  zoom: number;
  onAddContent: () => void;
  onAddImage: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onZoom: (direction: "in" | "out") => void;
}

const LeftToolbar: React.FC<LeftToolbarProps> = ({
  canUndo,
  canRedo,
  selectedElement,
  zoom,
  onAddContent,
  onAddImage,
  onUndo,
  onRedo,
  onDelete,
  onZoom,
}) => {
  return (
    <div className="left-toolbar">
      <div className="toolbar-section">
        <h3>Create</h3>
        <button onClick={onAddContent} className="toolbar-btn primary" title="Add Content (Text/List/Table)">
          📝 Content
        </button>
        <button onClick={onAddImage} className="toolbar-btn primary" title="Add Image">
          🖼️ Image
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Edit</h3>
        <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)" className="toolbar-btn">
          ↶ Undo
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" className="toolbar-btn">
          ↷ Redo
        </button>
        <button onClick={onDelete} disabled={!selectedElement} className="toolbar-btn danger" title="Delete (Del)">
          🗑️ Delete
        </button>
      </div>

      <div className="toolbar-section">
        <h3>View</h3>
        <div className="zoom-controls">
          <button onClick={() => onZoom("out")} className="toolbar-btn small">−</button>
          <span className="zoom-display">{Math.round(zoom * 100)}%</span>
          <button onClick={() => onZoom("in")} className="toolbar-btn small">+</button>
        </div>
      </div>
    </div>
  );
};

export default LeftToolbar;