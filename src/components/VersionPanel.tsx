import React from "react";
import { SavedVersion } from "../types";

interface VersionPanelProps {
  isVisible: boolean;
  savedVersions: SavedVersion[];
  onClose: () => void;
  onCreateVersion: () => void;
  onLoadVersion: (version: SavedVersion) => void;
  onDeleteVersion: (versionId: string) => void;
}

const VersionPanel: React.FC<VersionPanelProps> = ({
  isVisible,
  savedVersions,
  onClose,
  onCreateVersion,
  onLoadVersion,
  onDeleteVersion,
}) => {
  if (!isVisible) return null;

  return (
    <div className="version-panel">
      <div className="version-header">
        <h3>📚 Version History</h3>
        <div className="version-controls">
          <button onClick={onCreateVersion} className="create-version-btn">
            📸 Create Version
          </button>
          <button onClick={onClose} className="close-panel-btn">
            ✕
          </button>
        </div>
      </div>
      <div className="version-list">
        {savedVersions.length === 0 ? (
          <div className="no-versions">
            <p>No saved versions yet.</p>
            <p>Create a version to save your current progress!</p>
          </div>
        ) : (
          savedVersions.map((version) => (
            <div key={version.id} className="version-item">
              <div className="version-info">
                <div className="version-name">{version.name}</div>
                <div className="version-date">
                  {new Date(version.timestamp).toLocaleString()}
                </div>
                <div className="version-stats">
                  {version.pages.length} pages •{" "}
                  {version.pages.reduce((total, page) => total + page.content.length, 0)} elements
                </div>
              </div>
              <div className="version-actions">
                <button
                  onClick={() => onLoadVersion(version)}
                  className="load-version-btn"
                  title="Load this version"
                >
                  📂
                </button>
                <button
                  onClick={() => onDeleteVersion(version.id)}
                  className="delete-version-btn"
                  title="Delete this version"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="version-footer">
        <small>Versions are saved in your browser's local storage</small>
      </div>
    </div>
  );
};

export default VersionPanel;