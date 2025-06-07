import React, { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import "./App.css";

// Import types
import {
  Page,
  Element,
  ContentElement,
  GlobalHistoryState,
  SavedVersion,
  ConfirmDialogState,
  InputDialogState,
  ColorPickerDialogState,
  PageGroup,
  SearchState,
  SearchResult,
} from "./types";

// Import hooks
import { usePageHistory, useGlobalHistory, useNotifications, useLocalStorage } from "./hooks";

// Import search functionality
import { useSearch } from "./utils/search";

// Import utilities
import { ElementFactory, ExportUtils, ContentUtils } from "./utils";

// Import components
import ConfirmDialog from "./components/ConfirmDialog";
import InputDialog from "./components/InputDialog";
import ColorPickerDialog from "./components/ColorPickerDialog";
import SearchBar from "./components/SearchBar";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import TimelinePanel from "./components/TimelinePanel";
import TopBar from "./components/TopBar";
import RightToolbar from "./components/RightToolbar";

// ========================
// MAIN APP COMPONENT
// ========================

const App: React.FC = () => {
  // Core state
  const [pages, setPages] = useState<Page[]>([
    { 
      id: uuidv4(), 
      title: "Untitled Page", 
      content: [],
      history: [],
      currentHistoryIndex: -1,
    },
  ]);
  const [activePage, setActivePage] = useState(0);
  const [pageZooms, setPageZooms] = useState<{ [pageId: string]: number }>({});
  const [appName, setAppName] = useState("NoteMaker");
  const [theme, setTheme] = useState<"light" | "dark" | "colorful">("light");
  const [sidebarWidth, setSidebarWidth] = useState(60);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // Page groups
  const [pageGroups, setPageGroups] = useState<PageGroup[]>([]);

  // Search state
  const [searchState, setSearchState] = useState<SearchState>({
    isOpen: false,
    query: "",
    results: [],
    currentResultIndex: 0,
    isSearching: false,
    searchInImages: true,
    searchInText: true,
    caseSensitive: false,
    wholeWords: false,
    filters: {},
  });

  // Get current zoom for active page
  const currentZoom = pageZooms[pages[activePage]?.id] || 1;

  // Element interaction state
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // UI state
  const [showFormatting, setShowFormatting] = useState(false);
  const [showTimelinePanel, setShowTimelinePanel] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveHistory, setSaveHistory] = useState<Array<{
    id: string;
    timestamp: number;
    action: string;
    pageCount: number;
    elementCount: number;
    pages: Page[];
    activePage: number;
  }>>([]);

  // Page editing state
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [tempPageTitle, setTempPageTitle] = useState("");
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [inputDialog, setInputDialog] = useState<InputDialogState>({
    isOpen: false,
    title: "",
    message: "",
    placeholder: "",
    defaultValue: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [colorPickerDialog, setColorPickerDialog] = useState<ColorPickerDialogState>({
    isOpen: false,
    title: "",
    currentColor: "#3b82f6",
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Custom hooks
  const { 
    addToPageHistory, 
    undoPageContent, 
    redoPageContent, 
    canUndoPage, 
    canRedoPage 
  } = usePageHistory();
  
  const { 
    addToGlobalHistory, 
    undoGlobal, 
    redoGlobal, 
    canUndoGlobal, 
    canRedoGlobal, 
    setGlobalHistory, 
    setGlobalCurrentHistoryIndex 
  } = useGlobalHistory(pages, activePage);
  
  const { showNotification } = useNotifications();
  const { saveToStorage, loadFromStorage, saveVersions, loadVersions } = useLocalStorage();
  const { search: performSearch, getOCRStatus, clearOCRCache } = useSearch();

  // ========================
  // PAGE-LEVEL UNDO/REDO
  // ========================

  const handleUndo = useCallback(() => {
    const currentPage = pages[activePage];
    const updatedPage = undoPageContent(currentPage);
    
    if (updatedPage) {
      const newPages = pages.map((page, index) => 
        index === activePage ? updatedPage : page
      );
      setPages(newPages);
      setSelectedElement(null);
      setIsEditing(null);
      showNotification("↶ Undone", "info");
    }
  }, [pages, activePage, undoPageContent, showNotification]);

  const handleRedo = useCallback(() => {
    const currentPage = pages[activePage];
    const updatedPage = redoPageContent(currentPage);
    
    if (updatedPage) {
      const newPages = pages.map((page, index) => 
        index === activePage ? updatedPage : page
      );
      setPages(newPages);
      setSelectedElement(null);
      setIsEditing(null);
      showNotification("↷ Redone", "info");
    }
  }, [pages, activePage, redoPageContent, showNotification]);

  const canUndo = canUndoPage(pages[activePage]);
  const canRedo = canRedoPage(pages[activePage]);

  // ========================
  // CORE FUNCTIONS
  // ========================

  const updatePageContent = useCallback((newContent: Element[], action: string = "Update Content") => {
    const currentPage = pages[activePage];
    const updatedPage = addToPageHistory(currentPage, newContent, action);
    
    const newPages = pages.map((page, index) => 
      index === activePage ? updatedPage : page
    );
    
    setPages(newPages);
  }, [pages, activePage, addToPageHistory]);

  const showConfirmDialog = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  // ========================
  // SEARCH FUNCTIONS
  // ========================

  const handleToggleSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
    }));
    
    if (!searchState.isOpen) {
      // Clear selection when opening search
      setSelectedElement(null);
      setIsEditing(null);
      setShowFormatting(false);
    }
  }, [searchState.isOpen]);

  const handleSearchChange = useCallback(async (query: string) => {
    setSearchState(prev => ({
      ...prev,
      query,
      isSearching: true,
    }));

    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        results: [],
        currentResultIndex: 0,
        isSearching: false,
      }));
      return;
    }

    try {
      const results = await performSearch(pages, query, searchState);
      
      setSearchState(prev => ({
        ...prev,
        results,
        currentResultIndex: 0,
        isSearching: false,
      }));

      if (results.length > 0) {
        // Navigate to first result
        handleJumpToSearchResult(0, results);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({
        ...prev,
        results: [],
        currentResultIndex: 0,
        isSearching: false,
      }));
      showNotification("❌ Search error occurred", "warning");
    }
  }, [pages, searchState, performSearch, showNotification]);

  const handleNavigateSearchResult = useCallback((direction: "next" | "prev") => {
    if (searchState.results.length === 0) return;

    let newIndex: number;
    if (direction === "next") {
      newIndex = (searchState.currentResultIndex + 1) % searchState.results.length;
    } else {
      newIndex = searchState.currentResultIndex === 0 
        ? searchState.results.length - 1 
        : searchState.currentResultIndex - 1;
    }

    setSearchState(prev => ({
      ...prev,
      currentResultIndex: newIndex,
    }));

    handleJumpToSearchResult(newIndex, searchState.results);
  }, [searchState]);

  const handleJumpToSearchResult = useCallback((index: number, results?: SearchResult[]) => {
    const resultsToUse = results || searchState.results;
    if (index < 0 || index >= resultsToUse.length) return;

    const result = resultsToUse[index];
    
    // Navigate to the correct page
    const pageIndex = pages.findIndex(p => p.id === result.pageId);
    if (pageIndex !== -1 && pageIndex !== activePage) {
      setActivePage(pageIndex);
    }

    // Find and select the element
    const element = pages[pageIndex]?.content.find(el => el.id === result.elementId);
    if (element) {
      setSelectedElement(element);
      setShowFormatting(element.type === "content");
      
      // Scroll to element (you might need to implement this based on your canvas setup)
      // This is a placeholder - you'd need to implement smooth scrolling to the element
      setTimeout(() => {
        const elementDiv = document.querySelector(`[data-element-id="${element.id}"]`);
        if (elementDiv) {
          elementDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }

    if (!results) {
      setSearchState(prev => ({
        ...prev,
        currentResultIndex: index,
      }));
    }
  }, [searchState.results, pages, activePage]);

  const handleUpdateSearchOptions = useCallback((options: Partial<SearchState>) => {
    setSearchState(prev => ({
      ...prev,
      ...options,
    }));

    // Re-run search if query exists
    if (searchState.query.trim()) {
      setTimeout(() => {
        handleSearchChange(searchState.query);
      }, 100);
    }
  }, [searchState.query, handleSearchChange]);

  const handleClearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: "",
      results: [],
      currentResultIndex: 0,
      isSearching: false,
    }));
    
    setSelectedElement(null);
    setShowFormatting(false);
  }, []);

  const handleToggleSearchOptions = useCallback(() => {
    // This could be used for additional search options if needed
  }, []);

  const showInputDialog = useCallback((
    title: string, 
    message: string, 
    onConfirm: (value: string) => void,
    placeholder = "",
    defaultValue = ""
  ) => {
    setInputDialog({
      isOpen: true,
      title,
      message,
      placeholder,
      defaultValue,
      onConfirm: (value: string) => {
        onConfirm(value);
        setInputDialog(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setInputDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  const showColorPickerDialog = useCallback((
    title: string,
    currentColor: string,
    onConfirm: (color: string) => void
  ) => {
    setColorPickerDialog({
      isOpen: true,
      title,
      currentColor,
      onConfirm: (color: string) => {
        onConfirm(color);
        setColorPickerDialog(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setColorPickerDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  // ========================
  // PAGE MANAGEMENT
  // ========================

  const handleAddPage = useCallback(() => {
    const newPage: Page = {
      id: uuidv4(),
      title: `Page ${pages.length + 1}`,
      content: [],
      history: [],
      currentHistoryIndex: -1,
    };
    const newPages = [...pages, newPage];
    setPages(newPages);
    setActivePage(pages.length);
    addToGlobalHistory(newPages, pages.length, "Add Page");
  }, [pages, addToGlobalHistory]);

  const handleDeletePage = useCallback((pageId: string) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1 || pages.length <= 1) {
      showNotification("❌ Cannot delete the last page!", "warning");
      return;
    }

    const pageTitle = pages[pageIndex].title;
    
    showConfirmDialog(
      "Delete Page",
      `Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`,
      () => {
        const newPages = pages.filter(p => p.id !== pageId);
        setPages(newPages);
        
        // Adjust active page if necessary
        if (pageIndex <= activePage && activePage > 0) {
          setActivePage(activePage - 1);
        } else if (pageIndex === activePage && activePage >= newPages.length) {
          setActivePage(newPages.length - 1);
        }
        
        addToGlobalHistory(newPages, Math.min(activePage, newPages.length - 1), "Delete Page");
        showNotification(`🗑️ Deleted page "${pageTitle}"`, "success");
      }
    );
  }, [pages, activePage, addToGlobalHistory, showConfirmDialog, showNotification]);

  const handleChangePageColor = useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    showColorPickerDialog(
      "Choose Page Color",
      page.color || "#3b82f6",
      (color: string) => {
        const newPages = pages.map(p => 
          p.id === pageId ? { ...p, color } : p
        );
        setPages(newPages);
        showNotification("🎨 Page color updated!", "success");
      }
    );
  }, [pages, showColorPickerDialog, showNotification]);

  const handleChangePageGroup = useCallback((pageId: string, groupName: string) => {
    const newPages = pages.map(p => 
      p.id === pageId ? { ...p, group: groupName } : p
    );
    setPages(newPages);
    
    // Create group if it doesn't exist
    if (!pageGroups.find(g => g.name === groupName)) {
      const newGroup: PageGroup = {
        id: uuidv4(),
        name: groupName,
        collapsed: false,
      };
      setPageGroups(prev => [...prev, newGroup]);
    }
    
    showNotification(`📁 Page moved to "${groupName}"`, "success");
  }, [pages, pageGroups, showNotification]);

  const handleCreateGroup = useCallback(() => {
    showInputDialog(
      "Create Group",
      "Enter the name for the new group:",
      (groupName: string) => {
        if (pageGroups.find(g => g.name === groupName)) {
          showNotification("❌ Group name already exists!", "warning");
          return;
        }
        
        const newGroup: PageGroup = {
          id: uuidv4(),
          name: groupName,
          collapsed: false,
        };
        setPageGroups(prev => [...prev, newGroup]);
        showNotification(`📁 Created group "${groupName}"`, "success");
      },
      "Group name",
      ""
    );
  }, [pageGroups, showInputDialog, showNotification]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    const group = pageGroups.find(g => g.id === groupId);
    if (!group) return;

    showConfirmDialog(
      "Delete Group",
      `Are you sure you want to delete the group "${group.name}"? Pages in this group will be ungrouped.`,
      () => {
        // Remove group from pages
        const newPages = pages.map(p => 
          p.group === group.name ? { ...p, group: undefined } : p
        );
        setPages(newPages);
        
        // Remove the group
        setPageGroups(prev => prev.filter(g => g.id !== groupId));
        showNotification(`🗑️ Deleted group "${group.name}"`, "success");
      }
    );
  }, [pageGroups, pages, showConfirmDialog, showNotification]);

  const handleToggleGroup = useCallback((groupId: string) => {
    setPageGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
    ));
  }, []);

  // ========================
  // ZOOM HANDLING
  // ========================

  const handleZoom = useCallback((direction: "in" | "out") => {
    const pageId = pages[activePage].id;
    setPageZooms(prev => {
      const currentZoom = prev[pageId] || 1;
      const newZoom = direction === "in" ? currentZoom * 1.1 : currentZoom / 1.1;
      return {
        ...prev,
        [pageId]: Math.min(Math.max(newZoom, 0.25), 5)
      };
    });
  }, [pages, activePage]);

  // ========================
  // TABLE FUNCTIONS
  // ========================

  const handleAddTableRow = useCallback(() => {
    if (!selectedElement || selectedElement.type !== "content") return;
    
    const contentEl = selectedElement as ContentElement;
    if (contentEl.contentType !== "table") return;

    const tableContent = contentEl.content as string[][];
    const newRow = new Array(tableContent[0].length).fill("");
    const newContent = [...tableContent, newRow];

    const updatedContent = pages[activePage].content.map((el) => {
      if (el.id === selectedElement.id) {
        return {
          ...el,
          content: newContent,
          height: el.height + 35
        } as ContentElement;
      }
      return el;
    });

    updatePageContent(updatedContent, "Add Table Row");
    showNotification("➕ Row added!", "success");
  }, [selectedElement, pages, activePage, updatePageContent, showNotification]);

  const handleAddTableColumn = useCallback(() => {
    if (!selectedElement || selectedElement.type !== "content") return;
    
    const contentEl = selectedElement as ContentElement;
    if (contentEl.contentType !== "table") return;

    const tableContent = contentEl.content as string[][];
    const newContent = tableContent.map(row => [...row, ""]);
    
    const updatedContent = pages[activePage].content.map((el) => {
      if (el.id === selectedElement.id) {
        const newColumnWidths = [...(contentEl.columnWidths || []), 100];
        return {
          ...el,
          content: newContent,
          width: el.width + 100,
          columnWidths: newColumnWidths
        } as ContentElement;
      }
      return el;
    });

    updatePageContent(updatedContent, "Add Table Column");
    showNotification("➕ Column added!", "success");
  }, [selectedElement, pages, activePage, updatePageContent, showNotification]);

  const handleToggleTableHeader = useCallback(() => {
    if (!selectedElement || selectedElement.type !== "content") return;
    
    const contentEl = selectedElement as ContentElement;
    if (contentEl.contentType !== "table") return;

    const updatedContent = pages[activePage].content.map((el) => {
      if (el.id === selectedElement.id) {
        return {
          ...el,
          tableStyles: {
            ...contentEl.tableStyles,
            headerRow: !contentEl.tableStyles?.headerRow
          }
        } as ContentElement;
      }
      return el;
    });

    updatePageContent(updatedContent, "Toggle Table Header");
  }, [selectedElement, pages, activePage, updatePageContent]);

  const handleToggleAlternateRows = useCallback(() => {
    if (!selectedElement || selectedElement.type !== "content") return;
    
    const contentEl = selectedElement as ContentElement;
    if (contentEl.contentType !== "table") return;

    const updatedContent = pages[activePage].content.map((el) => {
      if (el.id === selectedElement.id) {
        return {
          ...el,
          tableStyles: {
            ...contentEl.tableStyles,
            alternateRows: !contentEl.tableStyles?.alternateRows
          }
        } as ContentElement;
      }
      return el;
    });

    updatePageContent(updatedContent, "Toggle Alternate Rows");
  }, [selectedElement, pages, activePage, updatePageContent]);

  // ========================
  // SIDEBAR RESIZE
  // ========================

  const handleSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    setIsResizingSidebar(true);
    e.preventDefault();
  }, []);

  const handleSidebarResize = useCallback((e: MouseEvent) => {
    if (!isResizingSidebar) return;
    
    const newWidth = Math.min(Math.max(60, e.clientX), 300);
    setSidebarWidth(newWidth);
  }, [isResizingSidebar]);

  const handleSidebarResizeEnd = useCallback(() => {
    setIsResizingSidebar(false);
  }, []);

  useEffect(() => {
    if (isResizingSidebar) {
      document.addEventListener("mousemove", handleSidebarResize);
      document.addEventListener("mouseup", handleSidebarResizeEnd);
      return () => {
        document.removeEventListener("mousemove", handleSidebarResize);
        document.removeEventListener("mouseup", handleSidebarResizeEnd);
      };
    }
  }, [isResizingSidebar, handleSidebarResize, handleSidebarResizeEnd]);

  // ========================
  // REST OF THE FUNCTIONS (Same as before but using new hooks)
  // ========================

  const handleSave = useCallback(() => {
    const dataToSave = {
      pages,
      activePage,
      appName,
      theme,
      sidebarWidth,
      pageZooms,
      pageGroups,
    };
    
    const success = saveToStorage(dataToSave);
    if (success) {
      const saveEntry = {
        id: uuidv4(),
        timestamp: Date.now(),
        action: "Manual Save",
        pageCount: pages.length,
        elementCount: pages.reduce((total, page) => total + page.content.length, 0),
        pages: JSON.parse(JSON.stringify(pages)),
        activePage
      };
      
      setSaveHistory(prev => [saveEntry, ...prev].slice(0, 50));
      showNotification("💾 Saved successfully!", "success");
    } else {
      showNotification("❌ Save failed!", "warning");
    }
  }, [pages, activePage, appName, theme, sidebarWidth, pageZooms, pageGroups, saveToStorage, showNotification]);

  const handleAutoSave = useCallback(() => {
    const dataToSave = {
      pages,
      activePage,
      appName,
      theme,
      sidebarWidth,
      pageZooms,
      pageGroups,
    };
    saveToStorage(dataToSave);
  }, [pages, activePage, appName, theme, sidebarWidth, pageZooms, pageGroups, saveToStorage]);

  const handleAddContent = useCallback(() => {
    const newElement = ElementFactory.createDefaultContentElement();
    updatePageContent([...pages[activePage].content, newElement], "Add Content");
  }, [pages, activePage, updatePageContent]);

  const handleDeleteElement = useCallback(() => {
    if (selectedElement) {
      const updatedContent = pages[activePage].content.filter(
        (el) => el.id !== selectedElement.id
      );
      updatePageContent(updatedContent, "Delete Element");
      setSelectedElement(null);
      setShowFormatting(false);
    }
  }, [selectedElement, pages, activePage, updatePageContent]);

  // ========================
  // ELEMENT INTERACTION HANDLERS
  // ========================

  const handleElementClick = useCallback((e: React.MouseEvent, element: Element) => {
    e.stopPropagation();
    setSelectedElement(element);
    setShowFormatting(element.type === "content");
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedElement(null);
    setIsEditing(null);
    setShowFormatting(false);
    setEditingPageId(null);
  }, []);

  const handleElementDoubleClick = useCallback((e: React.MouseEvent, element: Element) => {
    e.stopPropagation();
    if (element.type === "content") {
      setIsEditing(element.id);
    }
  }, []);

  const handleTextEdit = useCallback((elementId: string, newContent: string) => {
    const updatedContent = pages[activePage].content.map((el) => {
      if (el.id === elementId && el.type === "content") {
        return { ...el, content: newContent } as ContentElement;
      }
      return el;
    });
    updatePageContent(updatedContent, "Edit Text");
  }, [pages, activePage, updatePageContent]);

  const handleTableCellEdit = useCallback((tableId: string, rowIndex: number, colIndex: number, value: string) => {
    const updatedContent = pages[activePage].content.map((el) => {
      if (el.id === tableId && el.type === "content" && (el as ContentElement).contentType === "table") {
        const tableEl = el as ContentElement;
        const tableContent = tableEl.content as string[][];
        const newContent = tableContent.map((row, rIndex) =>
          rIndex === rowIndex
            ? row.map((cell, cIndex) => (cIndex === colIndex ? value : cell))
            : row
        );
        return { ...tableEl, content: newContent } as ContentElement;
      }
      return el;
    });
    updatePageContent(updatedContent, "Edit Table Cell");
  }, [pages, activePage, updatePageContent]);

  const handleMouseDown = useCallback((e: React.MouseEvent, element: Element) => {
    if (isEditing === element.id) return;

    const target = e.target as HTMLElement;

    if (target.classList.contains("resize-handle")) {
      setIsResizing(element.id);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: element.width,
        height: element.height,
      });
      return;
    }

    setIsDragging(true);
    setIsDraggingElement(true);
    setSelectedElement(element);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const scaledX = (e.clientX - rect.left) / currentZoom;
      const scaledY = (e.clientY - rect.top) / currentZoom;

      setDragOffset({
        x: scaledX - element.x,
        y: scaledY - element.y,
      });
    }
  }, [isEditing, currentZoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isResizing && resizeStart && selectedElement) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      const newWidth = Math.max(100, resizeStart.width + deltaX);
      const newHeight = Math.max(30, resizeStart.height + deltaY);

      const updatedContent = pages[activePage].content.map((el) =>
        el.id === selectedElement.id ? { ...el, width: newWidth, height: newHeight } : el
      );
      updatePageContent(updatedContent, "Resize Element");
    } else if (isDragging && selectedElement && !isEditing) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const scaledX = (e.clientX - rect.left) / currentZoom;
        const scaledY = (e.clientY - rect.top) / currentZoom;
        const scaledOffsetX = dragOffset.x / currentZoom;
        const scaledOffsetY = dragOffset.y / currentZoom;

        const newX = scaledX - scaledOffsetX;
        const newY = scaledY - scaledOffsetY;

        const updatedContent = pages[activePage].content.map((el) =>
          el.id === selectedElement.id ? { ...el, x: newX, y: newY } : el
        );
        updatePageContent(updatedContent, "Move Element");
      }
    }
  }, [isResizing, resizeStart, selectedElement, isDragging, isEditing, currentZoom, dragOffset, pages, activePage, updatePageContent]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsDraggingElement(false);
    setIsResizing(null);
    setResizeStart(null);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent, element: Element) => {
    e.stopPropagation();
    setIsResizing(element.id);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height,
    });
  }, []);

  // ========================
  // PAGE DRAG AND DROP
  // ========================

  const handlePageDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handlePageDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handlePageDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedPageIndex === null || draggedPageIndex === dropIndex) {
      setDraggedPageIndex(null);
      return;
    }

    const newPages = [...pages];
    const draggedPage = newPages[draggedPageIndex];

    newPages.splice(draggedPageIndex, 1);
    const adjustedDropIndex = draggedPageIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newPages.splice(adjustedDropIndex, 0, draggedPage);

    setPages(newPages);
    setActivePage(adjustedDropIndex);
    setDraggedPageIndex(null);
    addToGlobalHistory(newPages, adjustedDropIndex, "Reorder Pages");
  }, [draggedPageIndex, pages, addToGlobalHistory]);

  // ========================
  // CONTENT TYPE CONVERSION
  // ========================

  const changeContentType = useCallback((elementId: string, newType: "text" | "list" | "table") => {
    const updatedContent = pages[activePage].content.map((el) => {
      if (el.id === elementId && el.type === "content") {
        const contentEl = el as ContentElement;
        let newContent: string | string[][];
        let newWidth = contentEl.width;
        let newHeight = contentEl.height;

        if (newType === "table") {
          if (contentEl.contentType === "table") {
            newContent = contentEl.content;
          } else {
            const textContent = contentEl.content as string;
            const lines = textContent.split("\n").filter((line) => line.trim() !== "");

            if (lines.length === 0) {
              newContent = [
                ["Header 1", "Header 2", "Header 3"],
                ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
                ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"],
              ];
            } else if (lines.length === 1) {
              newContent = [["Header"], [lines[0]]];
            } else {
              newContent = [
                [lines[0]],
                ...lines.slice(1).map((line) => [line]),
              ];
            }
          }

          const tableData = newContent as string[][];
          const cols = Math.max(...tableData.map((row) => row.length));
          newWidth = Math.max(300, cols * 120);
          newHeight = Math.max(120, tableData.length * 35 + 40);
        } else if (newType === "list") {
          if (contentEl.contentType === "table") {
            const tableContent = contentEl.content as string[][];
            newContent = tableContent.map((row) => row.join(" | ")).join("\n");
          } else {
            newContent = contentEl.content as string;
          }

          const lines = (newContent as string).split("\n");
          newHeight = Math.max(80, lines.length * 25 + 40);
        } else {
          if (contentEl.contentType === "table") {
            const tableContent = contentEl.content as string[][];
            newContent = tableContent.map((row) => row.join(" | ")).join("\n");
          } else {
            newContent = contentEl.content as string;
          }

          const lines = (newContent as string).split("\n");
          newHeight = Math.max(60, lines.length * 20 + 40);
        }

        return {
          ...contentEl,
          contentType: newType,
          content: newContent,
          width: newWidth,
          height: newHeight,
          columnWidths:
            newType === "table"
              ? (newContent as string[][])[0]?.map(() =>
                  Math.floor(newWidth / (newContent as string[][])[0].length)
                )
              : undefined,
          cellStyles:
            newType === "table"
              ? {
                  ...(newContent as string[][])[0]?.reduce(
                    (acc, _, colIndex) => {
                      acc[`0-${colIndex}`] = {
                        fontWeight: "bold",
                        backgroundColor: "#f8f9fa",
                        textAlign: "center",
                      };
                      return acc;
                    },
                    {} as { [key: string]: any }
                  ),
                }
              : undefined,
          tableStyles:
            newType === "table"
              ? {
                  headerRow: true,
                  alternateRows: false,
                  borderStyle: "solid",
                  borderColor: "#d1d5db",
                }
              : undefined,
        } as ContentElement;
      }
      return el;
    });
    updatePageContent(updatedContent, `Change to ${newType}`);
  }, [pages, activePage, updatePageContent]);

  const updateContentFormatting = useCallback((property: keyof ContentElement, value: any) => {
    if (!selectedElement || selectedElement.type !== "content") return;

    const updatedContent = pages[activePage].content.map((el) => {
      if (el.id === selectedElement.id && el.type === "content") {
        return { ...el, [property]: value } as ContentElement;
      }
      return el;
    });
    updatePageContent(updatedContent, "Update Formatting");

    setSelectedElement((prev) =>
      prev && prev.type === "content"
        ? ({ ...prev, [property]: value } as ContentElement)
        : prev
    );
  }, [selectedElement, pages, activePage, updatePageContent]);

  // ========================
  // FILE HANDLERS (Placeholder implementations)
  // ========================

  const handleAddImage = useCallback(() => {
    showNotification("📷 Image upload feature coming soon!", "info");
  }, [showNotification]);

  const handleExportPage = useCallback(() => {
    showNotification("📄 Export page feature coming soon!", "info");
  }, [showNotification]);

  const handleExportAll = useCallback(() => {
    showNotification("📦 Export all feature coming soon!", "info");
  }, [showNotification]);

  const handleImportPage = useCallback(() => {
    showNotification("📁 Import page feature coming soon!", "info");
  }, [showNotification]);

  const handleImportMultiple = useCallback(() => {
    showNotification("📂 Import multiple feature coming soon!", "info");
  }, [showNotification]);

  const handleExportZip = useCallback(() => {
    showNotification("🗜️ Export ZIP feature coming soon!", "info");
  }, [showNotification]);

  const handleImportZip = useCallback(() => {
    showNotification("📥 Import ZIP feature coming soon!", "info");
  }, [showNotification]);

  const handleLoadHistoryItem = useCallback(() => {
    showNotification("📂 Load history feature coming soon!", "info");
  }, [showNotification]);

  // ========================
  // DRAG AND DROP HANDLERS
  // ========================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showNotification("📁 File drop feature coming soon!", "info");
  }, [showNotification]);

  // ========================
  // INITIALIZATION AND EFFECTS
  // ========================

  useEffect(() => {
    const data = loadFromStorage();
    if (data) {
      const lastSave = localStorage.getItem("notemaker-last-save");
      const timeSinceLastSave = Date.now() - parseInt(lastSave || "0");

      if (timeSinceLastSave < 24 * 60 * 60 * 1000) {
        showConfirmDialog(
          "Restore Data",
          "Found auto-saved data. Would you like to restore it?",
          () => {
            setPages(data.pages || pages);
            setActivePage(data.activePage || 0);
            setAppName(data.appName || "NoteMaker");
            setTheme(data.theme || "light");
            setSidebarWidth(data.sidebarWidth || 60);
            setPageZooms(data.pageZooms || {});
            setPageGroups(data.pageGroups || []);
            showNotification("📁 Auto-saved data restored!", "success");
          }
        );
      }
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (pages.length > 0 && pages[activePage].content.length > 0) {
        handleAutoSave();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [pages, activePage, handleAutoSave]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        handleToggleSearch();
      }

      if (e.ctrlKey && e.key === "z" && !e.shiftKey && !isEditing) {
        e.preventDefault();
        handleUndo();
      }

      if (((e.ctrlKey && e.shiftKey && e.key === "Z") || (e.ctrlKey && e.key === "y")) && !isEditing) {
        e.preventDefault();
        handleRedo();
      }

      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
      }

      if (e.key === "Delete" && selectedElement && !isEditing) {
        e.preventDefault();
        handleDeleteElement();
      }

      if (e.key === "Escape") {
        setEditingPageId(null);
        setShowTimelinePanel(false);
        setSelectedElement(null);
        setIsEditing(null);
        setShowFormatting(false);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isEditing, handleUndo, handleRedo, handleSave, selectedElement, handleDeleteElement, handleToggleSearch]);

  // ========================
  // RENDER
  // ========================

  return (
    <div className={`app theme-${theme}`}>
      <ConfirmDialog dialog={confirmDialog} />
      <InputDialog dialog={inputDialog} />
      <ColorPickerDialog dialog={colorPickerDialog} />

      <SearchBar
        searchState={searchState}
        onSearchChange={handleSearchChange}
        onToggleSearch={handleToggleSearch}
        onNavigateResult={handleNavigateSearchResult}
        onJumpToResult={handleJumpToSearchResult}
        onToggleSearchOptions={handleToggleSearchOptions}
        onUpdateSearchOptions={handleUpdateSearchOptions}
        onClearSearch={handleClearSearch}
      />

      <TopBar
        appName={appName}
        onAppNameChange={setAppName}
        canUndo={canUndo}
        canRedo={canRedo}
        selectedElement={selectedElement}
        zoom={currentZoom}
        onAddContent={handleAddContent}
        onAddImage={handleAddImage}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDeleteElement}
        onZoom={handleZoom}
        isSearchOpen={searchState.isOpen}
        onToggleSearch={handleToggleSearch}
        showFormatting={showFormatting}
        onUpdateFormatting={updateContentFormatting}
        onChangeContentType={changeContentType}
        onAddTableRow={handleAddTableRow}
        onAddTableColumn={handleAddTableColumn}
        onToggleTableHeader={handleToggleTableHeader}
        onToggleAlternateRows={handleToggleAlternateRows}
        theme={theme}
        onThemeChange={setTheme}
      />

      <div className="main-area">
        <Sidebar
          pages={pages}
          activePage={activePage}
          editingPageId={editingPageId}
          tempPageTitle={tempPageTitle}
          draggedPageIndex={draggedPageIndex}
          width={sidebarWidth}
          groups={pageGroups}
          onAddPage={handleAddPage}
          onSelectPage={setActivePage}
          onStartEditingTitle={(page) => {
            setEditingPageId(page.id);
            setTempPageTitle(page.title);
          }}
          onSaveTitle={() => {
            if (editingPageId && tempPageTitle.trim()) {
              const newPages = pages.map((page) =>
                page.id === editingPageId ? { ...page, title: tempPageTitle.trim() } : page
              );
              setPages(newPages);
            }
            setEditingPageId(null);
            setTempPageTitle("");
          }}
          onCancelEdit={() => {
            setEditingPageId(null);
            setTempPageTitle("");
          }}
          onTempTitleChange={setTempPageTitle}
          onPageDragStart={handlePageDragStart}
          onPageDragOver={handlePageDragOver}
          onPageDrop={handlePageDrop}
          onResizeStart={handleSidebarResizeStart}
          onDeletePage={handleDeletePage}
          onChangePageColor={handleChangePageColor}
          onChangePageGroup={handleChangePageGroup}
          onCreateGroup={handleCreateGroup}
          onDeleteGroup={handleDeleteGroup}
          onToggleGroup={handleToggleGroup}
        />

        <div className="canvas-area">
          <Canvas
            ref={canvasRef}
            elements={pages[activePage].content}
            selectedElement={selectedElement}
            isEditing={isEditing}
            zoom={currentZoom}
            onCanvasClick={handleCanvasClick}
            onElementClick={handleElementClick}
            onElementDoubleClick={handleElementDoubleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onResizeStart={handleResizeStart}
            onTextEdit={handleTextEdit}
            onTableCellEdit={handleTableCellEdit}
          />
        </div>

        <RightToolbar
          showTimelinePanel={showTimelinePanel}
          onSave={handleSave}
          onToggleTimeline={() => setShowTimelinePanel(!showTimelinePanel)}
          onExportPage={handleExportPage}
          onExportAll={handleExportAll}
          onImportPage={handleImportPage}
          onImportMultiple={handleImportMultiple}
          onExportZip={handleExportZip}
          onImportZip={handleImportZip}
        />
      </div>

      <TimelinePanel
        isVisible={showTimelinePanel}
        saveHistory={saveHistory}
        onClose={() => setShowTimelinePanel(false)}
        onLoadHistoryItem={handleLoadHistoryItem}
      />
    </div>
  );
};

export default App;