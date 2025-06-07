# NoteMaker App 📝

A modern, feature-rich note-taking application built with React and TypeScript. Create, organize, and manage your notes with support for text, lists, tables, and images.

## ✨ Features

### 📄 Multi-Page Support
- Create unlimited pages
- Drag and drop page reordering
- Editable page titles
- Quick page navigation

### 🎨 Rich Content Types
- **Text**: Rich text formatting with bold, italic, underline
- **Lists**: Bullet point lists with auto-formatting
- **Tables**: Dynamic tables with resizable columns
- **Images**: Upload and embed images with auto-resizing

### 🔄 Advanced Functionality
- **Undo/Redo**: Full history management (50 actions)
- **Auto-save**: Automatic saving every 30 seconds
- **Version Control**: Create named snapshots of your work
- **Import/Export**: JSON-based file format (.note)
- **Drag & Drop**: Support for files and images

### 🎯 User Interface
- **Zoom Controls**: Scale canvas from 50% to 300%
- **Element Selection**: Click to select, double-click to edit
- **Resize Handles**: Drag corners to resize elements
- **Keyboard Shortcuts**: Ctrl+Z/Y, Ctrl+S, Ctrl+L, etc.

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Canvas.tsx      # Main canvas area
│   ├── ConfirmDialog.tsx # Modal dialogs
│   ├── Sidebar.tsx     # Page navigation
│   ├── Toolbar.tsx     # Action buttons
│   └── VersionPanel.tsx # Version management
├── hooks/              # Custom React hooks
│   └── index.ts        # useHistory, useNotifications, useLocalStorage
├── types/              # TypeScript definitions
│   └── index.ts        # All interfaces and types
├── utils/              # Utility functions
│   └── index.ts        # ContentUtils, ElementFactory, ExportUtils
├── App.tsx             # Main application component
├── App.css             # Complete styling
└── index.tsx           # Application entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd notemaker-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

4. **Open your browser**
Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## 🎮 Usage Guide

### Creating Content
1. Click **"Content"** button to add text/list/table
2. Click **"Image"** button to upload images
3. Double-click any element to edit
4. Use formatting toolbar when element is selected

### Managing Pages
- Click **"+"** in sidebar to add new page
- Drag pages to reorder them
- Double-click page title to rename
- Click page to switch between them

### Keyboard Shortcuts
- `Ctrl + Z` - Undo
- `Ctrl + Shift + Z` - Redo  
- `Ctrl + S` - Save
- `Ctrl + L` - Load
- `Escape` - Cancel editing/close panels

### File Operations
- **Export**: Save individual pages or all pages as .note files
- **Import**: Load .note files by clicking import or drag & drop
- **Images**: Drag image files onto canvas or use Image button

## 🔧 Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Check TypeScript types

### Code Quality
- **ESLint**: Configured with React and TypeScript rules
- **TypeScript**: Full type safety throughout the application
- **No global restrictions**: Custom confirm dialogs instead of browser alerts

### Architecture Decisions

1. **Component Separation**: Each major UI section is its own component
2. **Custom Hooks**: Reusable logic for history, notifications, and storage
3. **Utility Functions**: Pure functions for content processing and element creation
4. **Type Safety**: Comprehensive TypeScript interfaces for all data structures

## 📦 File Format

The app uses a custom `.note` format (JSON-based):

```json
{
  "version": "1.0",
  "exportDate": "2024-01-01T00:00:00.000Z",
  "page": {
    "id": "uuid",
    "title": "Page Title",
    "content": [
      {
        "id": "element-uuid",
        "type": "content|image",
        "x": 100,
        "y": 100,
        "width": 300,
        "height": 80,
        "content": "...",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

## 🔄 Version History

### v2.0.0 - Refactored Architecture
- ✅ Complete code refactoring into multiple files
- ✅ Custom hooks for better state management
- ✅ Separated components for maintainability
- ✅ Utility functions for reusable logic
- ✅ Improved TypeScript coverage
- ✅ Better error handling and user feedback

### v1.0.0 - Initial Release
- ✅ Basic note-taking functionality
- ✅ Multi-page support
- ✅ Image upload and management
- ✅ Import/export capabilities
- ✅ Version management system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- TypeScript for type safety
- All contributors and users of this application