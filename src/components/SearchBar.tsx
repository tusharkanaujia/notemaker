import React, { useState, useEffect, useRef } from "react";
import { SearchState, SearchResult } from "../types";

interface SearchBarProps {
  searchState: SearchState;
  onSearchChange: (query: string) => void;
  onToggleSearch: () => void;
  onNavigateResult: (direction: "next" | "prev") => void;
  onJumpToResult: (index: number) => void;
  onToggleSearchOptions: () => void;
  onUpdateSearchOptions: (options: Partial<SearchState>) => void;
  onClearSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchState,
  onSearchChange,
  onToggleSearch,
  onNavigateResult,
  onJumpToResult,
  onToggleSearchOptions,
  onUpdateSearchOptions,
  onClearSearch,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchState.isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchState.isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        onNavigateResult("prev");
      } else {
        onNavigateResult("next");
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onToggleSearch();
    }
  };

  if (!searchState.isOpen) {
    return null;
  }

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        {/* Main Search Input */}
        <div className="search-input-section">
          <div className="search-input-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              value={searchState.query}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search content and images..."
              className="search-input"
            />
            <div className="search-icons">
              {searchState.isSearching && (
                <span className="search-loading">🔍</span>
              )}
              {searchState.query && (
                <button
                  onClick={onClearSearch}
                  className="search-clear"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Search Results Counter */}
          {searchState.results.length > 0 && (
            <div className="search-results-info">
              <span className="results-count">
                {searchState.currentResultIndex + 1} of {searchState.results.length}
              </span>
              <div className="search-navigation">
                <button
                  onClick={() => onNavigateResult("prev")}
                  disabled={searchState.results.length === 0}
                  className="nav-btn"
                  title="Previous result (Shift+Enter)"
                >
                  ↑
                </button>
                <button
                  onClick={() => onNavigateResult("next")}
                  disabled={searchState.results.length === 0}
                  className="nav-btn"
                  title="Next result (Enter)"
                >
                  ↓
                </button>
              </div>
            </div>
          )}

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`advanced-toggle ${showAdvanced ? "active" : ""}`}
            title="Advanced search options"
          >
            ⚙️
          </button>

          {/* Close Button */}
          <button
            onClick={onToggleSearch}
            className="search-close"
            title="Close search (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="search-advanced-options">
            <div className="search-option-group">
              <label className="search-option">
                <input
                  type="checkbox"
                  checked={searchState.searchInText}
                  onChange={(e) => onUpdateSearchOptions({ searchInText: e.target.checked })}
                />
                <span>Search in text</span>
              </label>
              <label className="search-option">
                <input
                  type="checkbox"
                  checked={searchState.searchInImages}
                  onChange={(e) => onUpdateSearchOptions({ searchInImages: e.target.checked })}
                />
                <span>Search in images (OCR)</span>
              </label>
            </div>

            <div className="search-option-group">
              <label className="search-option">
                <input
                  type="checkbox"
                  checked={searchState.caseSensitive}
                  onChange={(e) => onUpdateSearchOptions({ caseSensitive: e.target.checked })}
                />
                <span>Case sensitive</span>
              </label>
              <label className="search-option">
                <input
                  type="checkbox"
                  checked={searchState.wholeWords}
                  onChange={(e) => onUpdateSearchOptions({ wholeWords: e.target.checked })}
                />
                <span>Whole words only</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Search Results List */}
      {searchState.results.length > 0 && (
        <div className="search-results-list">
          <div className="search-results-header">
            <h4>Search Results ({searchState.results.length})</h4>
          </div>
          <div className="search-results-scroll">
            {searchState.results.map((result, index) => (
              <div
                key={result.id}
                className={`search-result-item ${
                  index === searchState.currentResultIndex ? "active" : ""
                }`}
                onClick={() => onJumpToResult(index)}
              >
                <div className="result-header">
                  <span className="result-page">{result.pageTitle}</span>
                  <span className="result-type">
                    {result.elementType === "image" ? "🖼️" : 
                     result.contentType === "table" ? "📊" :
                     result.contentType === "list" ? "📋" : "📝"}
                  </span>
                </div>
                <div className="result-content">
                  <span className="result-context">
                    {result.context.substring(0, result.position.start)}
                    <mark className="result-highlight">
                      {result.match}
                    </mark>
                    {result.context.substring(result.position.end)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchState.query && searchState.results.length === 0 && !searchState.isSearching && (
        <div className="search-no-results">
          <p>No results found for "{searchState.query}"</p>
          <p>Try different keywords or enable image search for more results.</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;