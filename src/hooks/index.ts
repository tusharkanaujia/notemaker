import { useState, useCallback } from "react";
import { Page, GlobalHistoryState, PageHistoryState, SavedVersion, NotificationType, Element } from "../types";

// ========================
// CUSTOM HOOKS - UPDATED
// ========================

export const usePageHistory = () => {
  const addToPageHistory = useCallback((page: Page, newContent: Element[], action: string): Page => {
    const newHistoryState: PageHistoryState = {
      content: JSON.parse(JSON.stringify(newContent)),
      timestamp: Date.now(),
      action,
    };

    const currentHistory = page.history || [];
    const currentIndex = page.currentHistoryIndex ?? -1;
    
    // Remove any future history if we're not at the end
    const newHistory = currentHistory.slice(0, currentIndex + 1);
    newHistory.push(newHistoryState);

    // Limit history to 50 entries per page
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    return {
      ...page,
      content: newContent,
      history: newHistory,
      currentHistoryIndex: newHistory.length - 1,
    };
  }, []);

  const undoPageContent = useCallback((page: Page): Page | null => {
    const currentIndex = page.currentHistoryIndex ?? -1;
    if (currentIndex > 0 && page.history) {
      const previousState = page.history[currentIndex - 1];
      return {
        ...page,
        content: JSON.parse(JSON.stringify(previousState.content)),
        currentHistoryIndex: currentIndex - 1,
      };
    }
    return null;
  }, []);

  const redoPageContent = useCallback((page: Page): Page | null => {
    const currentIndex = page.currentHistoryIndex ?? -1;
    const historyLength = page.history?.length ?? 0;
    
    if (currentIndex < historyLength - 1 && page.history) {
      const nextState = page.history[currentIndex + 1];
      return {
        ...page,
        content: JSON.parse(JSON.stringify(nextState.content)),
        currentHistoryIndex: currentIndex + 1,
      };
    }
    return null;
  }, []);

  const canUndoPage = useCallback((page: Page): boolean => {
    const currentIndex = page.currentHistoryIndex ?? -1;
    return currentIndex > 0;
  }, []);

  const canRedoPage = useCallback((page: Page): boolean => {
    const currentIndex = page.currentHistoryIndex ?? -1;
    const historyLength = page.history?.length ?? 0;
    return currentIndex < historyLength - 1;
  }, []);

  return { 
    addToPageHistory, 
    undoPageContent, 
    redoPageContent, 
    canUndoPage, 
    canRedoPage 
  };
};

export const useGlobalHistory = (initialPages: Page[], initialActivePage: number) => {
  const [history, setHistory] = useState<GlobalHistoryState[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  const addToGlobalHistory = useCallback((pages: Page[], activePage: number, action: string) => {
    const newState: GlobalHistoryState = {
      pages: JSON.parse(JSON.stringify(pages)),
      activePage,
      timestamp: Date.now(),
      action,
    };

    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push(newState);

    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
    }

    setHistory(newHistory);
  }, [history, currentHistoryIndex]);

  const undoGlobal = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const previousState = history[currentHistoryIndex - 1];
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      return previousState;
    }
    return null;
  }, [history, currentHistoryIndex]);

  const redoGlobal = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      const nextState = history[currentHistoryIndex + 1];
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      return nextState;
    }
    return null;
  }, [history, currentHistoryIndex]);

  const canUndoGlobal = currentHistoryIndex > 0;
  const canRedoGlobal = currentHistoryIndex < history.length - 1;

  return { 
    addToGlobalHistory, 
    undoGlobal, 
    redoGlobal, 
    canUndoGlobal, 
    canRedoGlobal, 
    setGlobalHistory: setHistory, 
    setGlobalCurrentHistoryIndex: setCurrentHistoryIndex 
  };
};

export const useNotifications = () => {
  const showNotification = useCallback((message: string, type: NotificationType = "info") => {
    const notification = document.createElement("div");
    notification.className = `paste-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${
        type === "success" ? "#28a745" : type === "warning" ? "#ffc107" : "#17a2b8"
      };
      color: ${type === "warning" ? "#212529" : "white"};
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1001;
      font-weight: bold;
      animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }, []);

  return { showNotification };
};

export const useLocalStorage = () => {
  const saveToStorage = useCallback((dataOrPages: any, activePage?: number) => {
    try {
      let dataToSave: any;
      
      // Check if it's the new format (object with pages property)
      if (dataOrPages && typeof dataOrPages === 'object' && 'pages' in dataOrPages) {
        // New format with all settings
        dataToSave = {
          ...dataOrPages,
          timestamp: Date.now()
        };
      } else if (Array.isArray(dataOrPages)) {
        // Legacy format - array of pages
        dataToSave = { 
          pages: dataOrPages, 
          activePage: activePage || 0,
          timestamp: Date.now() 
        };
      } else {
        // Fallback for any other format
        dataToSave = {
          pages: dataOrPages,
          activePage: activePage || 0,
          timestamp: Date.now()
        };
      }
      
      localStorage.setItem("notemaker-data", JSON.stringify(dataToSave));
      localStorage.setItem("notemaker-last-save", Date.now().toString());
      return true;
    } catch (error) {
      console.error("Error saving to storage:", error);
      return false;
    }
  }, []);

  const loadFromStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem("notemaker-data");
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error("Error loading from storage:", error);
      return null;
    }
  }, []);

  const saveVersions = useCallback((versions: SavedVersion[]) => {
    try {
      localStorage.setItem("notemaker-versions", JSON.stringify(versions));
    } catch (error) {
      console.error("Error saving versions:", error);
    }
  }, []);

  const loadVersions = useCallback((): SavedVersion[] => {
    try {
      const savedVersions = localStorage.getItem("notemaker-versions");
      return savedVersions ? JSON.parse(savedVersions) : [];
    } catch (error) {
      console.error("Error loading versions:", error);
      return [];
    }
  }, []);

  return { saveToStorage, loadFromStorage, saveVersions, loadVersions };
};