import { Menu, Notice, Plugin, TAbstractFile, TFile, TFolder, Vault, FileSystemAdapter } from 'obsidian';
import { join } from 'path';

export default class CopyAbsolutePathPlugin extends Plugin {
	async onload() {
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
				if (file instanceof TFile || file instanceof TFolder) {
					menu.addItem((item) => {
						item
							.setTitle('Copy absolute path')
							.setIcon('copy')
							.setSection('system')
							.onClick(async () => {
								await this.copyAbsolutePath(file);
							});
					});
				}
			})
		);

		this.addCommand({
			id: 'copy-absolute-path-active',
			name: 'Copy path of active file',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) this.copyAbsolutePath(activeFile);
				else new Notice('No active file to copy path from');
			}
		});
		this.addCommand({
			id: 'copy-absolute-path-focused',
			name: 'Copy path of focused item (File Explorer)',
			checkCallback: (checking: boolean) => {
				const isExplorerHovered = !!document.querySelector('.nav-files-container:hover');
				const isRenaming = !!document.querySelector('.is-being-renamed');

				if (!isExplorerHovered || isRenaming) {
					return false;
				}

				let itemToCopy: TAbstractFile | null = this.getFocusedItem();

				if (!itemToCopy) {
					// Fallback to active file if no item is focused in the explorer
					itemToCopy = this.app.workspace.getActiveFile();
				}

				if (itemToCopy) {
					if (!checking) {
						this.copyAbsolutePath(itemToCopy);
					}
					return true;
				}

				return false;
			}
		});
	}
	async copyAbsolutePath(file: TAbstractFile) {
		try {
			let adapter = this.app.vault.adapter;
			if (adapter instanceof FileSystemAdapter) {
				const vaultPath = adapter.getBasePath();
				const absolutePath = join(vaultPath, file.path);
				await navigator.clipboard.writeText(absolutePath);
				new Notice(`Copied path: ${absolutePath}`);
			} else new Notice('Cannot get path: vault is not using file system adapter');
		} catch (error) {
			console.error('Failed to copy path:', error);
			new Notice('Failed to copy path to clipboard');
		}
	}

	onunload() {
		// Plugin cleanup is handled automatically by Obsidian
	}

	getFocusedItem(): TAbstractFile | null { 
		// Get the focused element in the file explorer (files or folders)
		const focusedElement = document.querySelector('.tree-item-self.has-focus .nav-file-title, .nav-file-title.has-focus, .tree-item-self.has-focus .nav-folder-title, .nav-folder-title.has-focus');
		
		if (!focusedElement) return null;
		
		// Get the file path from the focused element
		const filePath = this.getFilePathFromElement(focusedElement as HTMLElement);
		
		if (filePath) {
			const fileOrFolder = this.app.vault.getAbstractFileByPath(filePath);
			if (fileOrFolder) return fileOrFolder;
		}
		return null;
	}
	
	getFilePathFromElement(element: HTMLElement): string | null {
		// Try to get the file path from various possible data attributes
		let filePath = element.getAttribute('data-path');
		
		if (!filePath) {
			// Look for parent elements that might have the path
			let parent = element.closest('[data-path]') as HTMLElement;
			if (parent) filePath = parent.getAttribute('data-path');
		}
		return filePath;
	}
}
