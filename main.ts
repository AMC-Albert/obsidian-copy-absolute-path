import { App, Menu, Notice, Plugin, TAbstractFile, TFile, Vault, FileSystemAdapter } from 'obsidian';
import { join } from 'path';

export default class CopyAbsolutePathPlugin extends Plugin {
	async onload() {
		// Register the file menu event to add context menu item
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: Menu, file: TAbstractFile) => {
				// Only add the menu item for files (not folders)
				if (file instanceof TFile) {
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

		// Add a command for copying the absolute path of the current file
		this.addCommand({
			id: 'copy-absolute-path-active',
			name: 'Copy path of active file',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					this.copyAbsolutePath(activeFile);
				} else {
					new Notice('No active file to copy path from');
				}
			}
		});		// Add a command for copying the absolute path of the focused file
		this.addCommand({
			id: 'copy-absolute-path-focused',
			name: 'Copy path of focused file (File Explorer)',
			callback: () => {
				const focusedFile = this.getFocusedFile();
				if (focusedFile) {
					this.copyAbsolutePath(focusedFile);
				} else {
					new Notice('No focused file in explorer');
				}
			}
		});
	}
	async copyAbsolutePath(file: TFile) {
		try {
			let adapter = this.app.vault.adapter;
			if (adapter instanceof FileSystemAdapter) {
				const vaultPath = adapter.getBasePath();
				const absolutePath = join(vaultPath, file.path);
				
				// Copy to clipboard
				await navigator.clipboard.writeText(absolutePath);
				new Notice(`Copied path: ${absolutePath}`);
			} else {
				new Notice('Cannot get path: vault is not using file system adapter');
				return null;
			}
		} catch (error) {
			console.error('Failed to copy path:', error);
			new Notice('Failed to copy path to clipboard');
		}
	}

	onunload() {
		// Plugin cleanup is handled automatically by Obsidian
	}
	getFocusedFile(): TFile | null {
		// Get the focused element in the file explorer
		const focusedElement = document.querySelector('.tree-item-self.has-focus .nav-file-title, .nav-file-title.has-focus');
		
		if (!focusedElement) {
			return null;
		}
		
		// Get the file path from the focused element
		const filePath = this.getFilePathFromElement(focusedElement as HTMLElement);
		
		if (filePath) {
			// Get the file from the vault
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file instanceof TFile) {
				return file;
			}
		}
		
		return null;
	}
	
	getFilePathFromElement(element: HTMLElement): string | null {
		// Try to get the file path from various possible data attributes
		let filePath = element.getAttribute('data-path');
		
		if (!filePath) {
			// Look for parent elements that might have the path
			let parent = element.closest('[data-path]') as HTMLElement;
			if (parent) {
				filePath = parent.getAttribute('data-path');
			}
		}
		
		if (!filePath) {
			// As a fallback, try to construct the path from the DOM structure
			// This is less reliable but might work in some cases
			const titleElement = element.closest('.nav-file-title') || element;
			if (titleElement) {
				// Get all parent folder elements to build the full path
				const pathParts: string[] = [];
				let currentElement = titleElement.closest('.tree-item') as HTMLElement;
				
				while (currentElement) {
					const titleEl = currentElement.querySelector('.nav-file-title, .nav-folder-title');
					if (titleEl) {
						const name = titleEl.textContent?.trim();
						if (name) {
							pathParts.unshift(name);
						}
					}
					
					// Move up to parent folder
					currentElement = currentElement.parentElement?.closest('.tree-item') as HTMLElement;
					
					// Prevent infinite loops
					if (pathParts.length > 20) break;
				}
				
				if (pathParts.length > 0) {
					filePath = pathParts.join('/');
				}
			}
		}
		
		return filePath;
	}
}
