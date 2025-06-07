import React from "react";
import { v4 as uuidv4 } from "uuid";
import { Page, Element, ContentElement, ImageElement } from "../types";
import { SearchResult, SearchState, OCRResult, ImageSearchData } from "../types";

// ========================
// SEARCH UTILITIES
// ========================

export class SearchEngine {
  private ocrCache: Map<string, ImageSearchData> = new Map();
  private ocrWorker: any = null;

  constructor() {
    this.initializeOCR();
  }

  private async initializeOCR() {
    try {
      // Dynamically import Tesseract.js
      const Tesseract = await import('tesseract.js');
      this.ocrWorker = await Tesseract.createWorker('eng');
      console.log('OCR initialized successfully');
    } catch (error) {
      console.warn('OCR initialization failed:', error);
      console.log('Image search will be limited to metadata only');
    }
  }

  /**
   * Perform OCR on an image element
   */
  async processImageOCR(imageElement: ImageElement): Promise<ImageSearchData> {
    const cached = this.ocrCache.get(imageElement.id);
    
    // Return cached result if recent (within 1 hour)
    if (cached && cached.lastOCRUpdate && 
        Date.now() - cached.lastOCRUpdate < 60 * 60 * 1000) {
      return cached;
    }

    const imageData: ImageSearchData = {
      elementId: imageElement.id,
      isProcessing: true,
      lastOCRUpdate: Date.now(),
    };

    this.ocrCache.set(imageElement.id, imageData);

    if (!this.ocrWorker) {
      console.warn('OCR worker not available');
      return { ...imageData, isProcessing: false };
    }

    try {
      const result = await this.ocrWorker.recognize(imageElement.content);
      
      const ocrResults: OCRResult[] = result.data.words.map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1,
        },
      }));

      const finalData: ImageSearchData = {
        elementId: imageElement.id,
        ocrText: result.data.text,
        ocrResults,
        lastOCRUpdate: Date.now(),
        isProcessing: false,
      };

      this.ocrCache.set(imageElement.id, finalData);
      return finalData;
    } catch (error) {
      console.error('OCR processing failed:', error);
      const errorData: ImageSearchData = {
        elementId: imageElement.id,
        isProcessing: false,
        lastOCRUpdate: Date.now(),
      };
      this.ocrCache.set(imageElement.id, errorData);
      return errorData;
    }
  }

  /**
   * Search through text content
   */
  searchTextContent(
    pages: Page[],
    query: string,
    options: SearchState
  ): SearchResult[] {
    if (!options.searchInText || !query.trim()) {
      return [];
    }

    const results: SearchResult[] = [];
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    
    const createRegex = () => {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = options.wholeWords ? `\\b${escapedQuery}\\b` : escapedQuery;
      const flags = options.caseSensitive ? 'g' : 'gi';
      return new RegExp(pattern, flags);
    };

    pages.forEach((page) => {
      page.content.forEach((element) => {
        if (element.type !== "content") return;

        const contentEl = element as ContentElement;
        let searchableText = "";

        // Extract searchable text based on content type
        if (contentEl.contentType === "table") {
          const tableContent = contentEl.content as string[][];
          searchableText = tableContent
            .map((row) => row.join(" "))
            .join(" ");
        } else {
          searchableText = contentEl.content as string;
        }

        if (!searchableText) return;

        const textToSearch = options.caseSensitive ? searchableText : searchableText.toLowerCase();
        const regex = createRegex();
        let match;

        while ((match = regex.exec(textToSearch)) !== null) {
          const matchStart = match.index;
          const matchEnd = matchStart + match[0].length;
          
          // Create context (50 characters before and after)
          const contextStart = Math.max(0, matchStart - 50);
          const contextEnd = Math.min(searchableText.length, matchEnd + 50);
          const context = searchableText.substring(contextStart, contextEnd);
          
          results.push({
            id: uuidv4(),
            pageId: page.id,
            pageTitle: page.title,
            elementId: element.id,
            elementType: "content",
            contentType: contentEl.contentType,
            match: match[0],
            context,
            position: {
              start: matchStart - contextStart,
              end: matchEnd - contextStart,
            },
            x: element.x,
            y: element.y,
          });

          // Prevent infinite loop on zero-width matches
          if (match[0].length === 0) {
            regex.lastIndex++;
          }
        }
      });
    });

    return results;
  }

  /**
   * Search through image content using OCR
   */
  async searchImageContent(
    pages: Page[],
    query: string,
    options: SearchState
  ): Promise<SearchResult[]> {
    if (!options.searchInImages || !query.trim()) {
      return [];
    }

    const results: SearchResult[] = [];
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();

    const createRegex = () => {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = options.wholeWords ? `\\b${escapedQuery}\\b` : escapedQuery;
      const flags = options.caseSensitive ? 'g' : 'gi';
      return new RegExp(pattern, flags);
    };

    // Process all images in parallel
    const imageProcessingPromises: Promise<void>[] = [];

    pages.forEach((page) => {
      page.content.forEach((element) => {
        if (element.type !== "image") return;

        const imageEl = element as ImageElement;
        
        const promise = this.processImageOCR(imageEl).then((ocrData) => {
          if (!ocrData.ocrText) return;

          const textToSearch = options.caseSensitive ? ocrData.ocrText : ocrData.ocrText.toLowerCase();
          const regex = createRegex();
          let match;

          while ((match = regex.exec(textToSearch)) !== null) {
            const matchStart = match.index;
            const matchEnd = matchStart + match[0].length;
            
            // Create context
            const contextStart = Math.max(0, matchStart - 50);
            const contextEnd = Math.min(ocrData.ocrText.length, matchEnd + 50);
            const context = ocrData.ocrText.substring(contextStart, contextEnd);
            
            results.push({
              id: uuidv4(),
              pageId: page.id,
              pageTitle: page.title,
              elementId: element.id,
              elementType: "image",
              match: match[0],
              context,
              position: {
                start: matchStart - contextStart,
                end: matchEnd - contextStart,
              },
              x: element.x,
              y: element.y,
            });

            // Prevent infinite loop
            if (match[0].length === 0) {
              regex.lastIndex++;
            }
          }
        });

        imageProcessingPromises.push(promise);
      });
    });

    // Wait for all OCR processing to complete
    await Promise.all(imageProcessingPromises);

    return results;
  }

  /**
   * Main search function
   */
  async search(
    pages: Page[],
    query: string,
    options: SearchState
  ): Promise<SearchResult[]> {
    if (!query.trim()) {
      return [];
    }

    const [textResults, imageResults] = await Promise.all([
      Promise.resolve(this.searchTextContent(pages, query, options)),
      this.searchImageContent(pages, query, options),
    ]);

    // Combine and sort results by page order and position
    const allResults = [...textResults, ...imageResults];
    
    return allResults.sort((a, b) => {
      // First sort by page order
      const pageAIndex = pages.findIndex(p => p.id === a.pageId);
      const pageBIndex = pages.findIndex(p => p.id === b.pageId);
      
      if (pageAIndex !== pageBIndex) {
        return pageAIndex - pageBIndex;
      }
      
      // Then by Y position (top to bottom)
      if (a.y !== b.y) {
        return a.y - b.y;
      }
      
      // Finally by X position (left to right)
      return a.x - b.x;
    });
  }

  /**
   * Get OCR cache info for debugging
   */
  getOCRCacheInfo(): { total: number; processed: number; processing: number } {
    const total = this.ocrCache.size;
    let processed = 0;
    let processing = 0;

    this.ocrCache.forEach((data) => {
      if (data.isProcessing) {
        processing++;
      } else if (data.ocrText) {
        processed++;
      }
    });

    return { total, processed, processing };
  }

  /**
   * Clear OCR cache
   */
  clearOCRCache(): void {
    this.ocrCache.clear();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
    this.ocrCache.clear();
  }
}

// ========================
// SEARCH HOOKS
// ========================

export const useSearch = () => {
  const searchEngineRef = React.useRef<SearchEngine | null>(null);

  React.useEffect(() => {
    searchEngineRef.current = new SearchEngine();
    
    return () => {
      if (searchEngineRef.current) {
        searchEngineRef.current.cleanup();
      }
    };
  }, []);

  const search = React.useCallback(async (
    pages: Page[],
    query: string,
    options: SearchState
  ): Promise<SearchResult[]> => {
    if (!searchEngineRef.current) {
      return [];
    }
    
    return searchEngineRef.current.search(pages, query, options);
  }, []);

  const getOCRStatus = React.useCallback(() => {
    if (!searchEngineRef.current) {
      return { total: 0, processed: 0, processing: 0 };
    }
    
    return searchEngineRef.current.getOCRCacheInfo();
  }, []);

  const clearOCRCache = React.useCallback(() => {
    if (searchEngineRef.current) {
      searchEngineRef.current.clearOCRCache();
    }
  }, []);

  return {
    search,
    getOCRStatus,
    clearOCRCache,
  };
};

// Note: You'll need to install tesseract.js:
// npm install tesseract.js
// or
// yarn add tesseract.js