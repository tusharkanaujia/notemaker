import React from "react";
import { Element, ContentElement } from "../types";

interface TopBarProps {
  // Left section props
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

  // Center section props (formatting)
  showFormatting: boolean;
  onUpdateFormatting?: (property: keyof ContentElement, value: any) => void;
  onChangeContentType?: (elementId: string, newType: "text" | "list" | "table") => void;

  // Right section props
  showTimelinePanel: boolean;
  onSave: () => void;
  onToggleTimeline: () => void;
  onExportPage: () => void;
  onExportAll: () => void;
  onImportPage: () => void;
  onImportMultiple: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  // Left section
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
  
  // Center section
  showFormatting,
  onUpdateFormatting,
  onChangeContentType,
  
  // Right section
  showTimelinePanel,
  onSave,
  onToggleTimeline,
  onExportPage,
  onExportAll,
  onImportPage,
  onImportMultiple,
}) => {
  const contentElement = selectedElement as ContentElement;

  return (
    <div className="top-bar">
      {/* Left Section - Create & Edit */}
      <div className="top-bar-section left">
        <button onClick={onAddContent} className="top-btn primary" title="Add Content">
          📝
        </button>
        <button onClick={onAddImage} className="top-btn primary" title="Add Image">
          🖼️
        </button>
        
        <div className="separator" />
        
        <button onClick={onUndo} disabled={!canUndo} title="Undo" className="top-btn">
          ↶
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo" className="top-btn">
          ↷
        </button>
        <button onClick={onDelete} disabled={!selectedElement} className="top-btn danger" title="Delete">
          🗑️
        </button>
        
        <div className="separator" />
        
        <div className="zoom-controls">
          <button onClick={() => onZoom("out")} className="top-btn small">−</button>
          <span className="zoom-display">{Math.round(zoom * 100)}%</span>
          <button onClick={() => onZoom("in")} className="top-btn small">+</button>
        </div>
      </div>

      {/* Center Section - Formatting */}
      <div className="top-bar-section center">
        {showFormatting && selectedElement && selectedElement.type === "content" && onUpdateFormatting && onChangeContentType && (
          <>
            {/* Content Type Buttons */}
            <button
              className={`top-btn content-type ${contentElement.contentType === "text" ? "active" : ""}`}
              onClick={() => onChangeContentType(selectedElement.id, "text")}
              title="Text"
            >
              📝
            </button>
            <button
              className={`top-btn content-type ${contentElement.contentType === "list" ? "active" : ""}`}
              onClick={() => onChangeContentType(selectedElement.id, "list")}
              title="List"
            >
              📋
            </button>
            <button
              className={`top-btn content-type ${contentElement.contentType === "table" ? "active" : ""}`}
              onClick={() => onChangeContentType(selectedElement.id, "table")}
              title="Table"
            >
              📊
            </button>

            {contentElement.contentType !== "table" && (
              <>
                <div className="separator" />
                
                {/* Font Size */}
                <select
                  value={contentElement.fontSize || 14}
                  onChange={(e) => onUpdateFormatting("fontSize", parseInt(e.target.value))}
                  className="font-size-select"
                  title="Font Size"
                >
                  <option value={10}>10</option>
                  <option value={12}>12</option>
                  <option value={14}>14</option>
                  <option value={16}>16</option>
                  <option value={18}>18</option>
                  <option value={20}>20</option>
                  <option value={24}>24</option>
                  <option value={32}>32</option>
                </select>

                <div className="separator" />

                {/* Formatting Buttons */}
                <button
                  className={`top-btn format ${contentElement.fontWeight === "bold" ? "active" : ""}`}
                  onClick={() =>
                    onUpdateFormatting("fontWeight", contentElement.fontWeight === "bold" ? "normal" : "bold")
                  }
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  className={`top-btn format ${contentElement.fontStyle === "italic" ? "active" : ""}`}
                  onClick={() =>
                    onUpdateFormatting("fontStyle", contentElement.fontStyle === "italic" ? "normal" : "italic")
                  }
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  className={`top-btn format ${contentElement.textDecoration === "underline" ? "active" : ""}`}
                  onClick={() =>
                    onUpdateFormatting("textDecoration", contentElement.textDecoration === "underline" ? "none" : "underline")
                  }
                  title="Underline"
                >
                  <u>U</u>
                </button>

                <div className="separator" />

                {/* Color Pickers */}
                <input
                  type="color"
                  value={contentElement.color || "#000000"}
                  onChange={(e) => onUpdateFormatting("color", e.target.value)}
                  title="Text Color"
                  className="color-picker"
                />
                <input
                  type="color"
                  value={
                    contentElement.backgroundColor === "transparent"
                      ? "#ffffff"
                      : contentElement.backgroundColor || "#ffffff"
                  }
                  onChange={(e) => onUpdateFormatting("backgroundColor", e.target.value)}
                  title="Background Color"
                  className="color-picker"
                />
                <button
                  onClick={() => onUpdateFormatting("backgroundColor", "transparent")}
                  title="Clear Background"
                  className="top-btn small"
                >
                  🚫
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Right Section - Save & Export */}
      <div className="top-bar-section right">
        <button onClick={onSave} className="top-btn primary" title="Save">
          💾
        </button>
        <button 
          onClick={onToggleTimeline} 
          className={`top-btn ${showTimelinePanel ? "active" : ""}`}
          title="History"
        >
          📋
        </button>
        
        <div className="separator" />
        
        <button onClick={onExportPage} className="top-btn" title="Export Page">
          📄
        </button>
        <button onClick={onExportAll} className="top-btn" title="Export All">
          📦
        </button>
        
        <div className="separator" />
        
        <button onClick={onImportPage} className="top-btn" title="Import Page">
          📁
        </button>
        <button onClick={onImportMultiple} className="top-btn" title="Import Multiple">
          📂
        </button>
      </div>
    </div>
  );
};

export default TopBar;