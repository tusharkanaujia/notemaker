import { v4 as uuidv4 } from "uuid";
import { ContentElement, ImageElement, CellStyle, ContentType } from "../types";

// ========================
// UTILITY FUNCTIONS
// ========================

export const ContentUtils = {
  detectContentType: (htmlData: string, textData: string): "excel" | "word" | "richtext" | "plain" => {
    const lines = textData.split("\n").filter((line) => line.trim() !== "");
    const hasMultipleTabColumns = lines.some((line) => line.split("\t").length > 1);
    const hasMultipleRows = lines.length > 1;

    if (textData.includes("\t") && hasMultipleTabColumns && hasMultipleRows) {
      return "excel";
    }

    if (
      htmlData &&
      (htmlData.includes("mso-") ||
        htmlData.includes("urn:schemas-microsoft-com") ||
        htmlData.includes("<p") ||
        htmlData.includes("<div") ||
        htmlData.includes("<span"))
    ) {
      return "richtext";
    }

    if (
      htmlData &&
      (htmlData.includes("<b>") ||
        htmlData.includes("<strong>") ||
        htmlData.includes("<i>") ||
        htmlData.includes("<em>") ||
        htmlData.includes("<u>") ||
        htmlData.includes("style="))
    ) {
      return "richtext";
    }

    return "plain";
  },

  parseExcelData: (clipboardData: string) => {
    const lines = clipboardData.split(/\r?\n/).filter((line) => line.trim() !== "");
    const data: string[][] = [];
    const styles: { [key: string]: CellStyle } = {};

    for (let rowIndex = 0; rowIndex < lines.length; rowIndex++) {
      const cells = lines[rowIndex].split("\t").map((cell) => cell.trim());
      
      if (rowIndex === 0) {
        cells.forEach((_, colIndex) => {
          styles[`${rowIndex}-${colIndex}`] = {
            fontWeight: "bold",
            backgroundColor: "#f8f9fa",
            textAlign: "center",
            borderColor: "#d1d5db",
          };
        });
      }

      if (cells.length > 0) {
        data.push(cells);
      }
    }

    return { data, styles };
  },

  parseRichTextData: (htmlData: string, textData: string) => {
    if (!htmlData || !htmlData.includes("<")) {
      return { content: textData, styles: {} };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlData, "text/html");
    const body = doc.body;
    const content = body.textContent || textData;
    const styles: Partial<ContentElement> = {};

    const firstElement = body.querySelector("*");
    if (firstElement) {
      if (
        firstElement.tagName === "B" ||
        firstElement.tagName === "STRONG" ||
        body.querySelector("b, strong")
      ) {
        styles.fontWeight = "bold";
      }

      if (
        firstElement.tagName === "I" ||
        firstElement.tagName === "EM" ||
        body.querySelector("i, em")
      ) {
        styles.fontStyle = "italic";
      }

      if (firstElement.tagName === "U" || body.querySelector("u")) {
        styles.textDecoration = "underline";
      }

      const colorMatch = htmlData.match(/color:\s*([^;'"]+)/i);
      if (colorMatch) styles.color = colorMatch[1].trim();

      const bgColorMatch = htmlData.match(/background-color:\s*([^;'"]+)/i);
      if (bgColorMatch) styles.backgroundColor = bgColorMatch[1].trim();

      const fontSizeMatch = htmlData.match(/font-size:\s*(\d+)px/i);
      if (fontSizeMatch) styles.fontSize = parseInt(fontSizeMatch[1]);
    }

    return { content, styles };
  },
};

export const ElementFactory = {
  createContentElement: (
    data: string | string[][],
    styles: any,
    contentType: ContentType,
    x: number = 100,
    y: number = 100
  ): ContentElement => {
    let content: string | string[][];
    let width = 300;
    let height = 80;
    let columnWidths: number[] | undefined;
    let cellStyles: { [key: string]: CellStyle } | undefined;

    if (contentType === "table" && Array.isArray(data)) {
      content = data;
      const maxCols = Math.max(...data.map((row) => row.length));
      columnWidths = new Array(maxCols).fill(0).map((_, colIndex) => {
        const maxLength = Math.max(...data.map((row) => (row[colIndex] || "").length));
        return Math.max(80, Math.min(200, maxLength * 8 + 20));
      });
      width = Math.max(300, columnWidths.reduce((sum, w) => sum + w, 0));
      height = Math.max(120, data.length * 35 + 40);
      cellStyles = styles;
    } else {
      content = typeof data === "string" ? data : data.join("\n");
      const lines = content.split("\n");
      height = Math.max(60, lines.length * (contentType === "list" ? 25 : 20) + 40);
    }

    return {
      id: uuidv4(),
      type: "content",
      contentType,
      content,
      x,
      y,
      width,
      height,
      createdAt: new Date().toISOString(),
      fontSize: styles.fontSize || 14,
      fontWeight: styles.fontWeight || "normal",
      fontStyle: styles.fontStyle || "normal",
      textDecoration: styles.textDecoration || "none",
      color: styles.color || "#000000",
      backgroundColor: styles.backgroundColor || "transparent",
      columnWidths,
      cellStyles,
      tableStyles:
        contentType === "table"
          ? {
              headerRow: true,
              alternateRows: false,
              borderStyle: "solid",
              borderColor: "#d1d5db",
            }
          : undefined,
    };
  },

  createImageElement: (imageUrl: string, x: number, y: number, width: number, height: number): ImageElement => {
    return {
      id: uuidv4(),
      type: "image",
      content: imageUrl,
      x,
      y,
      width,
      height,
      createdAt: new Date().toISOString(),
    };
  },

  createDefaultContentElement: (): ContentElement => {
    return {
      id: uuidv4(),
      type: "content",
      contentType: "text",
      content: "Click to edit content...\nYou can switch between text, list, and table modes using the toolbar.",
      x: 100,
      y: 100,
      width: 300,
      height: 80,
      createdAt: new Date().toISOString(),
      fontSize: 14,
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      color: "#000000",
      backgroundColor: "transparent",
    };
  },
};

export const ExportUtils = {
  exportPageAsJSON: (page: any) => {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      page,
      metadata: {
        totalElements: page.content.length,
        elementTypes: page.content.reduce((acc: any, el: any) => {
          acc[el.type] = (acc[el.type] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${page.title.replace(/[^a-z0-9]/gi, "_")}.note`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportAllPages: async (pages: any[]) => {
    const exportPromises = pages.map((page) => {
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        page,
        metadata: {
          totalElements: page.content.length,
          elementTypes: page.content.reduce((acc: any, el: any) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
          }, {}),
        },
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${page.title.replace(/[^a-z0-9]/gi, "_")}.note`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return Promise.resolve();
    });

    await Promise.all(exportPromises);
  },
};