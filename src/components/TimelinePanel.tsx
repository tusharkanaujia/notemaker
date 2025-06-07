import React from "react";

interface SaveHistoryEntry {
  id: string;
  timestamp: number;
  action: string;
  pageCount: number;
  elementCount: number;
  pages?: any[];
  activePage?: number;
}

interface TimelinePanelProps {
  isVisible: boolean;
  saveHistory: SaveHistoryEntry[];
  onClose: () => void;
  onLoadHistoryItem: (entry: SaveHistoryEntry) => void;
}

const TimelinePanel: React.FC<TimelinePanelProps> = ({
  isVisible,
  saveHistory,
  onClose,
  onLoadHistoryItem,
}) => {
  if (!isVisible) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="timeline-panel">
      <div className="timeline-header">
        <h3>📋 Save History</h3>
        <button onClick={onClose} className="close-panel-btn">
          ✕
        </button>
      </div>
      <div className="timeline-list">
        {saveHistory.length === 0 ? (
          <div className="no-history">
            <p>No saves yet.</p>
            <p>Click save to create your first entry!</p>
          </div>
        ) : (
          saveHistory.map((entry, index) => (
            <div 
              key={entry.id} 
              className={`timeline-item ${index === 0 ? 'latest' : ''} ${entry.pages ? 'clickable' : ''}`}
              onClick={() => entry.pages && onLoadHistoryItem(entry)}
              title={entry.pages ? "Click to load this save state" : "No state data available"}
            >
              <div className="timeline-marker">
                {index === 0 ? '🟢' : '⚪'}
              </div>
              <div className="timeline-content">
                <div className="timeline-action">{entry.action}</div>
                <div className="timeline-time">{formatTime(entry.timestamp)}</div>
                <div className="timeline-stats">
                  {entry.pageCount} page{entry.pageCount !== 1 ? 's' : ''} • {entry.elementCount} element{entry.elementCount !== 1 ? 's' : ''}
                </div>
                {entry.pages && (
                  <div className="timeline-load-hint">
                    Click to restore this state
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="timeline-footer">
        <small>Click any save entry to restore that state</small>
      </div>
    </div>
  );
};

export default TimelinePanel;