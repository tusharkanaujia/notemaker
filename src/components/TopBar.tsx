import React, { useState } from "react";
import { Element, ContentElement } from "../types";

interface TopBarProps {
  // App name props
  appName: string;
  onAppNameChange: (name: string) => void;

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

  // Search props
  isSearchOpen: boolean;
  onToggleSearch: () => void;

  // Center section props (formatting)
  showFormatting: boolean;
  onUpdateFormatting?: (property: keyof ContentElement, value: any) => void;
  onChangeContentType?: (elementId: string, newType: "text" | "list" | "table") => void;
  onAddTableRow?: () => void;
  onAddTableColumn?: () => void;
  onToggleTableHeader?: () => void;
  onToggleAlternateRows?: () => void;

  // Theme props
  theme: "light" | "dark" | "colorful";
  onThemeChange: (theme: "light" | "dark" | "colorful") => void;
}

const TopBar: React.FC<TopBarProps> = ({
  // App name
  appName,
  onAppNameChange,
  
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
  
  // Search
  isSearchOpen,
  onToggleSearch,
  
  // Center section
  showFormatting,
  onUpdateFormatting,
  onChangeContentType,
  onAddTableRow,
  onAddTableColumn,
  onToggleTableHeader,
  onToggleAlternateRows,
  
  // Theme
  theme,
  onThemeChange,
}) => {
  const [isEditingAppName, setIsEditingAppName] = useState(false);
  const [tempAppName, setTempAppName] = useState(appName);
  const contentElement = selectedElement as ContentElement;

  const handleAppNameSave = () => {
    onAppNameChange(tempAppName.trim() || "NoteMaker");
    setIsEditingAppName(false);
  };

  const handleAppNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAppNameSave();
    } else if (e.key === "Escape") {
      setTempAppName(appName);
      setIsEditingAppName(false);
    }
  };

  return (
    <div className={`top-bar theme-${theme}`}>
      {/* App Name - Far Left */}
      <div className="app-name-section">
        {isEditingAppName ? (
          <input
            type="text"
            value={tempAppName}
            onChange={(e) => setTempAppName(e.target.value)}
            onBlur={handleAppNameSave}
            onKeyDown={handleAppNameKeyDown}
            className="app-name-input"
            autoFocus
          />
        ) : (
          <div 
            className="app-name-display"
            onClick={() => {
              setTempAppName(appName);
              setIsEditingAppName(true);
            }}
            title="Click to edit application name"
          >
            {appName}
          </div>
        )}
      </div>

      {/* Left Section - Create */}
      <div className="top-bar-section left">
        <button onClick={onAddContent} className="top-btn primary" title="Add Content">
          📝
        </button>
        <button onClick={onAddImage} className="top-btn primary" title="Add Image">
          🖼️
        </button>
        
        <div className="separator" />
        
        <button 
          onClick={onToggleSearch} 
          className={`search-trigger-btn ${isSearchOpen ? "active" : ""}`}
          title="Search (Ctrl+F)"
        >
          🔍
        </button>
      </div>

      {/* Center Section - Formatting */}
      <div className="top-bar-section center">
        {showFormatting && selectedElement && selectedElement.type === "content" && onUpdateFormatting && onChangeContentType && (
          <>
            {/* Content Type Buttons */}
            <button
              className={`top-btn ${contentElement.contentType === "text" ? "active" : ""}`}
              onClick={() => onChangeContentType(selectedElement.id, "text")}
              title="Text"
            >
              T
            </button>
            <button
              className={`top-btn ${contentElement.contentType === "list" ? "active" : ""}`}
              onClick={() => onChangeContentType(selectedElement.id, "list")}
              title="List"
            >
              ☰
            </button>
            <button
              className={`top-btn ${contentElement.contentType === "table" ? "active" : ""}`}
              onClick={() => onChangeContentType(selectedElement.id, "table")}
              title="Table"
            >
              ⊞
            </button>

            {contentElement.contentType === "table" && onAddTableRow && onAddTableColumn && (
              <>
                <div className="separator" />
                <button
                  className="top-btn"
                  onClick={onAddTableRow}
                  title="Add Row"
                >
                  ➕↔
                </button>
                <button
                  className="top-btn"
                  onClick={onAddTableColumn}
                  title="Add Column"
                >
                  ➕↕
                </button>
                {onToggleTableHeader && (
                  <button
                    className={`top-btn ${contentElement.tableStyles?.headerRow ? "active" : ""}`}
                    onClick={onToggleTableHeader}
                    title="Toggle Header Row"
                  >
                    H
                  </button>
                )}
                {onToggleAlternateRows && (
                  <button
                    className={`top-btn ${contentElement.tableStyles?.alternateRows ? "active" : ""}`}
                    onClick={onToggleAlternateRows}
                    title="Toggle Alternate Row Colors"
                  >
                    ≡
                  </button>
                )}
              </>
            )}

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

                {/* Formatting Buttons */}
                <button
                  className={`top-btn ${contentElement.fontWeight === "bold" ? "active" : ""}`}
                  onClick={() =>
                    onUpdateFormatting("fontWeight", contentElement.fontWeight === "bold" ? "normal" : "bold")
                  }
                  title="Bold"
                >
                  <strong>B</strong>
                </button>
                <button
                  className={`top-btn ${contentElement.fontStyle === "italic" ? "active" : ""}`}
                  onClick={() =>
                    onUpdateFormatting("fontStyle", contentElement.fontStyle === "italic" ? "normal" : "italic")
                  }
                  title="Italic"
                >
                  <em>I</em>
                </button>
                <button
                  className={`top-btn ${contentElement.textDecoration === "underline" ? "active" : ""}`}
                  onClick={() =>
                    onUpdateFormatting("textDecoration", contentElement.textDecoration === "underline" ? "none" : "underline")
                  }
                  title="Underline"
                >
                  <u>U</u>
                </button>

                <div className="separator" />

                {/* Color Pickers */}
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={contentElement.color || "#000000"}
                    onChange={(e) => onUpdateFormatting("color", e.target.value)}
                    title="Text Color"
                    className="color-picker"
                  />
                  <span className="color-icon">A</span>
                </div>
                <div className="color-picker-wrapper">
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
                  <span className="color-icon">▢</span>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Right Section - Edit & Theme */}
      <div className="top-bar-section right">
        {/* Edit controls */}
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
        
        {/* Zoom controls */}
        <div className="zoom-controls">
          <button onClick={() => onZoom("out")} className="top-btn small">−</button>
          <span className="zoom-display">{Math.round(zoom * 100)}%</span>
          <button onClick={() => onZoom("in")} className="top-btn small">+</button>
        </div>
        
        <div className="separator" />
        
        {/* Theme selector */}
        <select
          value={theme}
          onChange={(e) => onThemeChange(e.target.value as "light" | "dark" | "colorful")}
          className="theme-select"
          title="Choose Theme"
        >
          <option value="light">☀️ Light</option>
          <option value="dark">🌙 Dark</option>
          <option value="colorful">🎨 Colorful</option>
        </select>
      </div>
    </div>
  );
};

export default TopBar;