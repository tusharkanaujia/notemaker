import React, { useState } from "react";
import { Page, PageGroup } from "../types";

interface SidebarProps {
  pages: Page[];
  activePage: number;
  editingPageId: string | null;
  tempPageTitle: string;
  draggedPageIndex: number | null;
  width: number;
  groups: PageGroup[];
  onAddPage: () => void;
  onSelectPage: (index: number) => void;
  onStartEditingTitle: (page: Page) => void;
  onSaveTitle: () => void;
  onCancelEdit: () => void;
  onTempTitleChange: (title: string) => void;
  onPageDragStart: (e: React.DragEvent, index: number) => void;
  onPageDragOver: (e: React.DragEvent) => void;
  onPageDrop: (e: React.DragEvent, index: number) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onDeletePage: (pageId: string) => void;
  onChangePageColor: (pageId: string) => void;
  onChangePageGroup: (pageId: string, groupName: string) => void;
  onCreateGroup: () => void;
  onDeleteGroup: (groupId: string) => void;
  onToggleGroup: (groupId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  pages,
  activePage,
  editingPageId,
  tempPageTitle,
  draggedPageIndex,
  width,
  groups,
  onAddPage,
  onSelectPage,
  onStartEditingTitle,
  onSaveTitle,
  onCancelEdit,
  onTempTitleChange,
  onPageDragStart,
  onPageDragOver,
  onPageDrop,
  onResizeStart,
  onDeletePage,
  onChangePageColor,
  onChangePageGroup,
  onCreateGroup,
  onDeleteGroup,
  onToggleGroup,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    pageId: string;
    x: number;
    y: number;
  } | null>(null);
  const [groupContextMenu, setGroupContextMenu] = useState<{
    groupId: string;
    x: number;
    y: number;
  } | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSaveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit();
    }
  };

  const handlePageRightClick = (e: React.MouseEvent, page: Page, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      pageId: page.id,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleGroupRightClick = (e: React.MouseEvent, group: PageGroup) => {
    e.preventDefault();
    e.stopPropagation();
    setGroupContextMenu({
      groupId: group.id,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const closeContextMenus = () => {
    setContextMenu(null);
    setGroupContextMenu(null);
  };

  const isNarrow = width < 120;

  // Group pages
  const groupedPages = (groups || []).reduce((acc, group) => {
    acc[group.name] = pages.filter(page => page.group === group.name);
    return acc;
  }, {} as { [key: string]: Page[] });

  // Pages without group
  const ungroupedPages = pages.filter(page => !page.group);

  // Get the global index of a page
  const getPageIndex = (page: Page) => pages.findIndex(p => p.id === page.id);

  return (
    <>
      <div className="sidebar" style={{ width: `${width}px` }} onClick={closeContextMenus}>
        <div className="sidebar-header">
          <button onClick={onAddPage} className="add-page-btn" title="Add New Page">
            ➕
          </button>
          {!isNarrow && (
            <button onClick={onCreateGroup} className="add-group-btn" title="Create Group">
              📁
            </button>
          )}
        </div>

        <div className="page-list">
          {/* Render ungrouped pages */}
          {ungroupedPages.map((page) => {
            const index = getPageIndex(page);
            return (
              <div
                key={page.id}
                className={`page-item ${index === activePage ? "active" : ""} ${
                  draggedPageIndex === index ? "dragging" : ""
                }`}
                draggable
                onDragStart={(e) => onPageDragStart(e, index)}
                onDragOver={onPageDragOver}
                onDrop={(e) => onPageDrop(e, index)}
                onContextMenu={(e) => handlePageRightClick(e, page, index)}
                style={{ 
                  borderLeft: page.color ? `4px solid ${page.color}` : undefined 
                }}
              >
                {editingPageId === page.id ? (
                  <div className="page-title-edit">
                    <input
                      type="text"
                      value={tempPageTitle}
                      onChange={(e) => onTempTitleChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={onSaveTitle}
                      autoFocus
                      className="page-title-input"
                      style={{ fontSize: isNarrow ? "10px" : "12px" }}
                    />
                  </div>
                ) : (
                  <div
                    className={`page-title-display ${isNarrow ? "narrow" : "wide"}`}
                    onClick={() => onSelectPage(index)}
                    onDoubleClick={() => onStartEditingTitle(page)}
                    title={page.title}
                  >
                    {isNarrow && (
                      <span className="page-number">{index + 1}</span>
                    )}
                    <span className={`page-title-text ${isNarrow ? "vertical" : "horizontal"}`}>
                      {page.title}
                    </span>
                    {!isNarrow && (
                      <button
                        className="edit-page-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartEditingTitle(page);
                        }}
                        title="Edit page name"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Render grouped pages */}
          {(groups || []).map((group) => {
            const groupPages = groupedPages[group.name] || [];
            if (groupPages.length === 0) return null;

            return (
              <div key={group.id} className="page-group">
                <div 
                  className="group-header"
                  onClick={() => onToggleGroup(group.id)}
                  onContextMenu={(e) => handleGroupRightClick(e, group)}
                  style={{ 
                    borderLeft: group.color ? `4px solid ${group.color}` : undefined 
                  }}
                >
                  <span className="group-toggle">
                    {group.collapsed ? "▶" : "▼"}
                  </span>
                  <span className="group-name">{group.name}</span>
                  <span className="group-count">({groupPages.length})</span>
                </div>
                
                {!group.collapsed && (
                  <div className="group-pages">
                    {groupPages.map((page) => {
                      const index = getPageIndex(page);
                      return (
                        <div
                          key={page.id}
                          className={`page-item grouped ${index === activePage ? "active" : ""} ${
                            draggedPageIndex === index ? "dragging" : ""
                          }`}
                          draggable
                          onDragStart={(e) => onPageDragStart(e, index)}
                          onDragOver={onPageDragOver}
                          onDrop={(e) => onPageDrop(e, index)}
                          onContextMenu={(e) => handlePageRightClick(e, page, index)}
                          style={{ 
                            borderLeft: page.color ? `4px solid ${page.color}` : undefined 
                          }}
                        >
                          {editingPageId === page.id ? (
                            <div className="page-title-edit">
                              <input
                                type="text"
                                value={tempPageTitle}
                                onChange={(e) => onTempTitleChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={onSaveTitle}
                                autoFocus
                                className="page-title-input"
                                style={{ fontSize: isNarrow ? "10px" : "12px" }}
                              />
                            </div>
                          ) : (
                            <div
                              className={`page-title-display ${isNarrow ? "narrow" : "wide"}`}
                              onClick={() => onSelectPage(index)}
                              onDoubleClick={() => onStartEditingTitle(page)}
                              title={page.title}
                            >
                              {isNarrow && (
                                <span className="page-number">{index + 1}</span>
                              )}
                              <span className={`page-title-text ${isNarrow ? "vertical" : "horizontal"}`}>
                                {page.title}
                              </span>
                              {!isNarrow && (
                                <button
                                  className="edit-page-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onStartEditingTitle(page);
                                  }}
                                  title="Edit page name"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div 
          className="sidebar-resize-handle"
          onMouseDown={onResizeStart}
        />
      </div>

      {/* Page Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ 
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 2000 
          }}
          onClick={closeContextMenus}
        >
          <button 
            className="context-menu-item"
            onClick={() => {
              onChangePageColor(contextMenu.pageId);
              closeContextMenus();
            }}
          >
            🎨 Change Color
          </button>
          <button 
            className="context-menu-item"
            onClick={() => {
              // This would open a group selection dialog
              // For now, let's create a default group
              onChangePageGroup(contextMenu.pageId, "Default Group");
              closeContextMenus();
            }}
          >
            📁 Move to Group
          </button>
          <hr className="context-menu-divider" />
          <button 
            className="context-menu-item danger"
            onClick={() => {
              onDeletePage(contextMenu.pageId);
              closeContextMenus();
            }}
          >
            🗑️ Delete Page
          </button>
        </div>
      )}

      {/* Group Context Menu */}
      {groupContextMenu && (
        <div 
          className="context-menu"
          style={{ 
            position: 'fixed',
            left: groupContextMenu.x,
            top: groupContextMenu.y,
            zIndex: 2000 
          }}
          onClick={closeContextMenus}
        >
          <button 
            className="context-menu-item danger"
            onClick={() => {
              onDeleteGroup(groupContextMenu.groupId);
              closeContextMenus();
            }}
          >
            🗑️ Delete Group
          </button>
        </div>
      )}
    </>
  );
};

export default Sidebar;