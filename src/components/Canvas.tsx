import React, { forwardRef } from "react";
import { Element, ContentElement } from "../types";

interface CanvasProps {
  elements: Element[];
  selectedElement: Element | null;
  isEditing: string | null;
  zoom: number;
  onCanvasClick: () => void;
  onElementClick: (e: React.MouseEvent, element: Element) => void;
  onElementDoubleClick: (e: React.MouseEvent, element: Element) => void;
  onMouseDown: (e: React.MouseEvent, element: Element) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onResizeStart: (e: React.MouseEvent, element: Element) => void;
  onTextEdit?: (elementId: string, newContent: string) => void;
  onTableCellEdit?: (tableId: string, rowIndex: number, colIndex: number, value: string) => void;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  elements,
  selectedElement,
  isEditing,
  zoom,
  onCanvasClick,
  onElementClick,
  onElementDoubleClick,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onDragOver,
  onDrop,
  onResizeStart,
  onTextEdit,
  onTableCellEdit,
}, ref) => {

  // Calculate dynamic grid size based on zoom
  const gridSize = Math.max(1, Math.round(20 * zoom));

  const renderElementContent = (element: Element) => {
    if (element.type === "image") {
      return (
        <div className="image-content">
          <img src={element.content} alt="User uploaded" />
        </div>
      );
    }

    const contentElement = element as ContentElement;

    // Render editing interface
    if (isEditing === element.id) {
      if (contentElement.contentType === "table") {
        // Table editing mode
        const tableContent = contentElement.content as string[][];
        return (
          <div className="table-container editing-mode">
            <table style={{ tableLayout: "fixed", width: "100%", height: "100%" }}>
              <tbody>
                {tableContent.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ border: "1px solid #ddd", padding: 0 }}>
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => onTableCellEdit?.(element.id, rowIndex, cellIndex, e.target.value)}
                          style={{
                            border: "none",
                            outline: "none",
                            width: "100%",
                            height: "100%",
                            padding: "8px",
                            fontSize: "14px",
                            backgroundColor: "transparent",
                            boxSizing: "border-box",
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && e.ctrlKey) {
                              // Exit editing mode
                            }
                            if (e.key === "Escape") {
                              // Exit editing mode
                            }
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else {
        // Text/List editing mode
        return (
          <div className="text-editing-container">
            <textarea
              value={contentElement.content as string}
              onChange={(e) => onTextEdit?.(element.id, e.target.value)}
              onBlur={() => {
                // Exit editing mode when focus is lost
              }}
              autoFocus
              placeholder={
                contentElement.contentType === "list"
                  ? "Enter list items (one per line)"
                  : "Enter your text here..."
              }
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                outline: "none",
                resize: "none",
                fontSize: `${contentElement.fontSize || 14}px`,
                fontWeight: contentElement.fontWeight || "normal",
                fontStyle: contentElement.fontStyle || "normal",
                textDecoration: contentElement.textDecoration || "none",
                color: contentElement.color || "#000000",
                backgroundColor: contentElement.backgroundColor || "transparent",
                fontFamily: "inherit",
                lineHeight: "1.4",
                padding: "8px",
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  // Exit editing mode
                }
                if (e.key === "Escape") {
                  // Exit editing mode
                }
              }}
            />
          </div>
        );
      }
    }

    // Render display mode
    if (contentElement.contentType === "table") {
      const tableContent = contentElement.content as string[][];
      return (
        <div className="table-container display-mode">
          <table style={{
            tableLayout: "fixed",
            width: "100%",
            height: "100%",
            borderCollapse: "collapse",
          }}>
            <tbody>
              {tableContent.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => {
                    const cellKey = `${rowIndex}-${cellIndex}`;
                    const cellStyle = contentElement.cellStyles?.[cellKey] || {};
                    const columnWidth = contentElement.columnWidths?.[cellIndex];

                    return (
                      <td
                        key={cellIndex}
                        style={{
                          width: columnWidth ? `${columnWidth}px` : "auto",
                          backgroundColor: cellStyle.backgroundColor ||
                            (contentElement.tableStyles?.alternateRows && rowIndex % 2 === 1
                              ? "#f8f9fa" : "transparent"),
                          borderColor: cellStyle.borderColor ||
                            contentElement.tableStyles?.borderColor || "#d1d5db",
                          borderWidth: cellStyle.borderWidth || 1,
                          borderStyle: contentElement.tableStyles?.borderStyle || "solid",
                          padding: "8px",
                          fontWeight: cellStyle.fontWeight || (rowIndex === 0 ? "bold" : "normal"),
                          fontStyle: cellStyle.fontStyle || "normal",
                          textAlign: cellStyle.textAlign || (rowIndex === 0 ? "center" : "left"),
                          color: cellStyle.color || "#000000",
                          fontSize: `${cellStyle.fontSize || 14}px`,
                          verticalAlign: "top",
                        }}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      // Text or List display
      const textContent = contentElement.content as string;
      const lines = textContent.split("\n").filter((line) => line.trim() !== "");

      return (
        <div
          className="content-display"
          style={{
            fontSize: `${contentElement.fontSize || 14}px`,
            fontWeight: contentElement.fontWeight || "normal",
            fontStyle: contentElement.fontStyle || "normal",
            textDecoration: contentElement.textDecoration || "none",
            color: contentElement.color || "#000000",
            backgroundColor: contentElement.backgroundColor || "transparent",
            cursor: "text",
            lineHeight: "1.4",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            height: "100%",
            overflow: "hidden",
            padding: "8px",
            boxSizing: "border-box",
          }}
        >
          {contentElement.contentType === "list" ? (
            <div className="list-content">
              {lines.map((line, index) => (
                <div key={index} style={{ marginBottom: "4px" }}>
                  • {line}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-content">{textContent}</div>
          )}
        </div>
      );
    }
  };

  return (
    <div
      className="canvas-container"
      ref={ref}
      onClick={onCanvasClick}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onDragOver={onDragOver}
      onDrop={onDrop}
      tabIndex={0}
      style={{
        // Dynamic grid background that scales with zoom
        backgroundImage: `
          linear-gradient(var(--grid-color) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-color) 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    >
      <div
        className="canvas"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {elements.map((element) => {
          const contentElement = element as ContentElement;
          const isEmpty = element.type === "content" &&
            (!contentElement.content ||
              (typeof contentElement.content === "string" && contentElement.content.trim() === "") ||
              (Array.isArray(contentElement.content) && contentElement.content.every((row) =>
                row.every((cell) => cell.trim() === ""))));

          return (
            <div
              key={element.id}
              className={`element ${element.type} ${
                selectedElement?.id === element.id ? "selected" : ""
              } ${isEditing === element.id ? "editing" : ""} ${
                element.type === "content" ? (isEmpty ? "empty-content" : "has-content") : ""
              }`}
              data-content-type={
                element.type === "content" ? contentElement.contentType : undefined
              }
              style={{
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height}px`,
              }}
              onClick={(e) => onElementClick(e, element)}
              onDoubleClick={(e) => onElementDoubleClick(e, element)}
              onMouseDown={(e) => onMouseDown(e, element)}
            >
              <div className="timestamp">
                {new Date(element.createdAt).toLocaleString()}
              </div>

              {renderElementContent(element)}

              {selectedElement?.id === element.id && (
                <div
                  className="resize-handle"
                  onMouseDown={(e) => onResizeStart(e, element)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;