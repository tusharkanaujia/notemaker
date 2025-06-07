import React from "react";
import { ContentElement } from "../types";

interface FormattingToolbarProps {
  selectedElement: ContentElement;
  onUpdateFormatting: (property: keyof ContentElement, value: any) => void;
  onChangeContentType: (elementId: string, newType: "text" | "list" | "table") => void;
  onAddTableRow?: (tableId: string) => void;
  onAddTableColumn?: (tableId: string) => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  selectedElement,
  onUpdateFormatting,
  onChangeContentType,
  onAddTableRow,
  onAddTableColumn,
}) => {
  return (
    <div className="formatting-toolbar">
      <div className="format-group">
        <label>Type:</label>
        <div className="content-type-selector">
          <button
            className={`content-type-btn ${selectedElement.contentType === "text" ? "active" : ""}`}
            onClick={() => onChangeContentType(selectedElement.id, "text")}
            title="Convert to Text"
          >
            📝 Text
          </button>
          <button
            className={`content-type-btn ${selectedElement.contentType === "list" ? "active" : ""}`}
            onClick={() => onChangeContentType(selectedElement.id, "list")}
            title="Convert to List"
          >
            📋 List
          </button>
          <button
            className={`content-type-btn ${selectedElement.contentType === "table" ? "active" : ""}`}
            onClick={() => onChangeContentType(selectedElement.id, "table")}
            title="Convert to Table"
          >
            📊 Table
          </button>
        </div>
      </div>

      {selectedElement.contentType !== "table" && (
        <>
          <div className="format-group">
            <label>Size:</label>
            <select
              value={selectedElement.fontSize || 14}
              onChange={(e) => onUpdateFormatting("fontSize", parseInt(e.target.value))}
            >
              <option value={10}>10px</option>
              <option value={12}>12px</option>
              <option value={14}>14px</option>
              <option value={16}>16px</option>
              <option value={18}>18px</option>
              <option value={20}>20px</option>
              <option value={24}>24px</option>
              <option value={32}>32px</option>
            </select>
          </div>

          <div className="format-group">
            <button
              className={`format-btn ${selectedElement.fontWeight === "bold" ? "active" : ""}`}
              onClick={() =>
                onUpdateFormatting(
                  "fontWeight",
                  selectedElement.fontWeight === "bold" ? "normal" : "bold"
                )
              }
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              className={`format-btn ${selectedElement.fontStyle === "italic" ? "active" : ""}`}
              onClick={() =>
                onUpdateFormatting(
                  "fontStyle",
                  selectedElement.fontStyle === "italic" ? "normal" : "italic"
                )
              }
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              className={`format-btn ${selectedElement.textDecoration === "underline" ? "active" : ""}`}
              onClick={() =>
                onUpdateFormatting(
                  "textDecoration",
                  selectedElement.textDecoration === "underline" ? "none" : "underline"
                )
              }
              title="Underline"
            >
              <u>U</u>
            </button>
          </div>

          <div className="format-group">
            <label>Color:</label>
            <input
              type="color"
              value={selectedElement.color || "#000000"}
              onChange={(e) => onUpdateFormatting("color", e.target.value)}
              title="Text Color"
            />
          </div>

          <div className="format-group">
            <label>Background:</label>
            <input
              type="color"
              value={
                selectedElement.backgroundColor === "transparent"
                  ? "#ffffff"
                  : selectedElement.backgroundColor || "#ffffff"
              }
              onChange={(e) => onUpdateFormatting("backgroundColor", e.target.value)}
              title="Background Color"
            />
            <button
              onClick={() => onUpdateFormatting("backgroundColor", "transparent")}
              title="Clear Background"
              className="clear-bg-btn"
            >
              Clear
            </button>
          </div>
        </>
      )}

      {selectedElement.contentType === "table" && onAddTableRow && onAddTableColumn && (
        <div className="format-group">
          <label>Table:</label>
          <button onClick={() => onAddTableRow(selectedElement.id)} title="Add Row" className="table-btn">
            + Row
          </button>
          <button onClick={() => onAddTableColumn(selectedElement.id)} title="Add Column" className="table-btn">
            + Column
          </button>
        </div>
      )}
    </div>
  );
};

export default FormattingToolbar;