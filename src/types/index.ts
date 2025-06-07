// ========================
// TYPE DEFINITIONS - UPDATED
// ========================

export interface BaseElement {
  id: string;
  type: "content" | "image";
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface ContentElement extends BaseElement {
  type: "content";
  contentType: "text" | "list" | "table";
  content: string | string[][];
  fontSize?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  color?: string;
  backgroundColor?: string;
  columnWidths?: number[];
  cellStyles?: { [key: string]: CellStyle };
  tableStyles?: TableStyle;
}

export interface ImageElement extends BaseElement {
  type: "image";
  content: string;
}

export interface CellStyle {
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  textDecoration?: "none" | "underline";
  borderColor?: string;
  borderWidth?: number;
}

export interface TableStyle {
  headerRow?: boolean;
  alternateRows?: boolean;
  borderStyle?: "solid" | "dashed" | "none";
  borderColor?: string;
}

export type Element = ContentElement | ImageElement;

// Updated Page interface with new properties
export interface Page {
  id: string;
  title: string;
  content: Element[];
  color?: string; // Page tab color
  group?: string; // Page group name
  history?: PageHistoryState[]; // Page-specific history
  currentHistoryIndex?: number; // Current position in page history
}

// Page-specific history state
export interface PageHistoryState {
  content: Element[];
  timestamp: number;
  action: string;
}

// Global history for page management (add/delete/reorder pages)
export interface GlobalHistoryState {
  pages: Page[];
  activePage: number;
  timestamp: number;
  action: string;
}

export interface PageGroup {
  id: string;
  name: string;
  color?: string;
  collapsed?: boolean;
}

export interface SavedVersion {
  id: string;
  name: string;
  timestamp: number;
  pages: Page[];
  activePage: number;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface InputDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export interface ColorPickerDialogState {
  isOpen: boolean;
  title: string;
  currentColor: string;
  onConfirm: (color: string) => void;
  onCancel: () => void;
}

export type NotificationType = "success" | "info" | "warning";
export type ContentType = "text" | "list" | "table";

// ========================
// SEARCH TYPE DEFINITIONS
// ========================

export interface SearchResult {
  id: string;
  pageId: string;
  pageTitle: string;
  elementId: string;
  elementType: "content" | "image";
  contentType?: "text" | "list" | "table";
  match: string;
  context: string;
  position: {
    start: number;
    end: number;
  };
  x: number;
  y: number;
}

export interface SearchState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  currentResultIndex: number;
  isSearching: boolean;
  searchInImages: boolean;
  searchInText: boolean;
  caseSensitive: boolean;
  wholeWords: boolean;
  filters: {
    pageIds?: string[];
    elementTypes?: ("content" | "image")[];
    contentTypes?: ("text" | "list" | "table")[];
  };
}

export interface OCRResult {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface ImageSearchData {
  elementId: string;
  ocrText?: string;
  ocrResults?: OCRResult[];
  lastOCRUpdate?: number;
  isProcessing?: boolean;
}