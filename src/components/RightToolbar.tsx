import React from "react";

interface RightToolbarProps {
  showTimelinePanel: boolean;
  onSave: () => void;
  onToggleTimeline: () => void;
  onExportPage: () => void;
  onExportAll: () => void;
  onImportPage: () => void;
  onImportMultiple: () => void;
  onExportZip: () => void;
  onImportZip: () => void;
}

const RightToolbar: React.FC<RightToolbarProps> = ({
  showTimelinePanel,
  onSave,
  onToggleTimeline,
  onExportPage,
  onExportAll,
  onImportPage,
  onImportMultiple,
  onExportZip,
  onImportZip,
}) => {
  return (
    <div className="right-toolbar">
      <button 
        onClick={onSave} 
        className="toolbar-btn-icon primary"
        title="Save"
      >
        💾
      </button>
      
      <button 
        onClick={onToggleTimeline} 
        className={`toolbar-btn-icon ${showTimelinePanel ? "active" : ""}`}
        title="History"
      >
        📋
      </button>

      <div className="toolbar-divider" />

      <button 
        onClick={onExportPage} 
        className="toolbar-btn-icon"
        title="Export Current Page"
      >
        📄
      </button>
      
      <button 
        onClick={onExportAll} 
        className="toolbar-btn-icon"
        title="Export All Pages"
      >
        📦
      </button>
      
      <button 
        onClick={onExportZip} 
        className="toolbar-btn-icon primary"
        title="Export All as ZIP"
      >
        🗜️
      </button>

      <div className="toolbar-divider" />

      <button 
        onClick={onImportPage} 
        className="toolbar-btn-icon"
        title="Import Page"
      >
        📁
      </button>
      
      <button 
        onClick={onImportMultiple} 
        className="toolbar-btn-icon"
        title="Import Multiple Pages"
      >
        📂
      </button>
      
      <button 
        onClick={onImportZip} 
        className="toolbar-btn-icon primary"
        title="Import from ZIP"
      >
        📥
      </button>
    </div>
  );
};

export default RightToolbar;