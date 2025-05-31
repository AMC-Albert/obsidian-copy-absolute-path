# Copy Absolute Path

A simple Obsidian plugin that allows you to copy the absolute system path of files or folders in your vault to the clipboard.

## Features

Adds a new context menu item to files; `Copy absolute path` that copies the full system path to the file or folder.

- **Right-click context menu**: Right-click on any file or folder in the file explorer to copy its absolute path.
    - Integrates with the [File Explorer Note Count](https://github.com/ozntel/file-explorer-note-count) plugin to add a context menu to the 'Root folder' (enabled in the File Explorer Note Count settings).
- **Command palette**:
    - **`Copy absolute path of active file`**: Copies the absolute path of the currently open and active file.
    - **`Copy path of focused item (File Explorer)`**: Copies the absolute path of the file or folder currently focused (highlighted) in the File Explorer pane. This command is designed to be safely assigned to a shortcut like `Ctrl+C` (or `Cmd+C` on macOS). It will only activate if your mouse is hovering over the File Explorer and an item is focused. This prevents it from interfering with the normal `Ctrl+C` behavior for copying text in the editor or other panes.