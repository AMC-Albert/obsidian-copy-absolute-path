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
							.onClick(async () => {
								await this.copyAbsolutePath(file);
							});
					});
				}
			})
		);

		// Add a command for copying the absolute path of the current file
		this.addCommand({
			id: 'copy-absolute-path-current',
			name: 'Copy absolute path of current file',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					this.copyAbsolutePath(activeFile);
				} else {
					new Notice('No active file to copy path from');
				}
			}
		});
	}

	async copyAbsolutePath(file: TFile) {
		const vaultPath = this.app.vault.adapter.getBasePath();
		try {
			let adapter = this.app.vault.adapter;
			if (adapter instanceof FileSystemAdapter) {
				const vaultPath = adapter.getBasePath();
			} else {
				return null;
			}
		
			// Copy to clipboard
			await navigator.clipboard.writeText(absolutePath);
			new Notice(`Copied absolute path: ${absolutePath}`);
		} catch (error) {
			console.error('Failed to copy absolute path:', error);
			new Notice('Failed to copy absolute path to clipboard');
		}
	}

	onunload() {
		// Plugin cleanup is handled automatically by Obsidian
	}
}
