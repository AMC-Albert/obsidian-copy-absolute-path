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
					// If not hovering explorer or renaming, try to perform default text copy
					if (!checking) { // Only if the command is actually being executed
						const selection = document.getSelection();
						if (selection && selection.toString().length > 0) {
							navigator.clipboard.writeText(selection.toString()).catch(err => {
								console.error('Fallback text copy failed:', err);
							});
						}
					}
					return false; // Prevent this command from proceeding
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

		// Add context menu to the root folder in the file explorer
		this.app.workspace.onLayoutReady(() => {
			setTimeout(() => {
				const rootFolderElement = document.querySelector('.tree-item.nav-folder.oz-explorer-root-folder');
				if (rootFolderElement) {
					this.registerDomEvent(rootFolderElement as HTMLElement, 'contextmenu', (evt: MouseEvent) => {
						evt.preventDefault();
						const menu = new Menu();
						menu.addItem((item) => {
							item
								.setTitle('Copy absolute path')
								.setIcon('copy')
								.setSection('action')
								.onClick(async () => {
									const adapter = this.app.vault.adapter;
									if (adapter instanceof FileSystemAdapter) {
										const vaultPath = adapter.getBasePath();
										try {
											await navigator.clipboard.writeText(vaultPath);
											new Notice(`Copied path: ${vaultPath}`);
										} catch (err) {
											console.error('Failed to copy path:', err);
											new Notice('Failed to copy path to clipboard.');
										}
									} else {
										new Notice('Cannot get path: vault is not using file system adapter');
									}
								});
						});
						menu.showAtMouseEvent(evt);
					});
				} else {
					console.warn('Copy Absolute Path Plugin: .tree-item.nav-folder.oz-explorer-root-folder element not found.');
				}
			}, 500); // 500ms delay before registering the context menu event
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
		const fileSelectors = [
			'.tree-item-self.has-focus .nav-file-title',
			'.nav-file-title.has-focus'
		];
		const folderSelectors = [
			'.tree-item-self.has-focus .nav-folder-title',
			'.nav-folder-title.has-focus'
		];

		const focusedFileElements = Array.from(document.querySelectorAll(fileSelectors.join(', '))) as HTMLElement[];
		const focusedFolderElements = Array.from(document.querySelectorAll(folderSelectors.join(', '))) as HTMLElement[];

		let targetElement: HTMLElement | null = null;

		// 1. Prioritize hovered focused file
		for (const el of focusedFileElements) {
			if (el.matches(':hover')) {
				targetElement = el;
				break;
			}
		}

		// 2. If no hovered file, prioritize hovered focused folder
		if (!targetElement) {
			for (const el of focusedFolderElements) {
				if (el.matches(':hover')) {
					targetElement = el;
					break;
				}
			}
		}

		// 3. If no hovered item, fallback to the first focused file (maintaining file-over-folder priority)
		if (!targetElement && focusedFileElements.length > 0) {
			targetElement = focusedFileElements[0];
		}

		// 4. If still no target (no hovered item, no focused file), fallback to the first focused folder
		if (!targetElement && focusedFolderElements.length > 0) {
			targetElement = focusedFolderElements[0];
		}

		if (targetElement) {
			const filePath = this.getFilePathFromElement(targetElement);
			if (filePath) {
				const fileOrFolder = this.app.vault.getAbstractFileByPath(filePath);
				if (fileOrFolder) return fileOrFolder;
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
			if (parent) filePath = parent.getAttribute('data-path');
		}
		return filePath;
	}
}
