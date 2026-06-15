# Windows XP — Web Recreation

A Windows XP desktop **recreated in the browser** with React 19, Vite, and Tailwind CSS.

> It's a *recreation / simulation*, not an emulator — there's no x86 or a real Windows
> image. It's a hand-built XP-style desktop environment that runs entirely client-side.

## Features

- 🪟 Classic XP desktop, taskbar, and Start menu — with the "Welcome" boot screen
- 🗂️ A working **file system** (folders + text files, nesting, drag-to-move) persisted in `localStorage`
- 🗒️ **Notepad** that reads/writes those files
- ⬛ A **Command Prompt** that actually traverses the file system (`dir`, `cd`, `type`, `mkdir`, `del`, `tree`, …)
- 🗑️ A **recoverable Recycle Bin** (restore / empty)
- 🎨 Paint, a coprime/π Monte-Carlo toy, a faux Internet Explorer, Control Panel, and more
- 🖱️ Draggable icons & windows, right-click context menus
- 📱 **Touch-friendly**: single-tap to open, long-press for right-click, fullscreen windows on phones

## Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

## How the file system works

A flat array of nodes (`{ id, type, name, parentId, content, position }`) in `localStorage`
under the key `xp-filesystem`; the tree is implicit via `parentId` (`null` = desktop). See
[`src/utils/filesystem.js`](src/utils/filesystem.js). Notepad and the Command Prompt read the
live list and mutate it through the same helpers, so the desktop and every open window stay in
sync. Data is per-browser and best-effort — clearing site data wipes it.

## Project Structure

```
src/
├── components/   # Desktop, Window, Taskbar, StartMenu, FolderWindow, RecycleBinWindow, ...
├── pages/        # The "apps": Notepad, Paint, CommandPrompt, MyComputer, ControlPanel, ...
├── hooks/        # useIsMobile, useLongPress
├── utils/        # filesystem.js (the localStorage file system)
├── App.jsx
└── index.css
```

## Technologies

- **React 19**, **Vite**, **Tailwind CSS**

## License

MIT
