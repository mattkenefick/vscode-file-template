import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { ITemplate } from '../interface';
import { expandDirectory, getTemplates } from '../common/helper';

/**
 * Template item for the tree view
 */
class TemplateItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly template: ITemplate,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);

		// Set the template path as the identifier
		this.id = template.path;

		// Set tooltip to show the full path
		this.tooltip = template.path;

		// Set a description showing the template source (workspace or home)
		if (template.path) {
			if (template.path.includes(process.env.HOME || '')) {
				this.description = '($HOME)';
				this.contextValue = 'homeTemplate';
			} else if (vscode.workspace.rootPath && template.path.includes(vscode.workspace.rootPath)) {
				this.description = '($WORKSPACE)';
				this.contextValue = 'workspaceTemplate';
			} else {
				this.description = '(custom)';
				this.contextValue = 'customTemplate';
			}
		}

		// Set an icon for the template
		this.iconPath = new vscode.ThemeIcon('template');

		// Add command to open the template when clicked
		this.command = {
			command: 'global-boilerplate.openTemplate',
			title: 'Open Template',
			arguments: [template],
		};
	}
}

/**
 * Template source group item for the tree view
 */
class TemplateSourceItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly templateDirPath: string,
		public readonly templates: ITemplate[],
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);

		// Set the source path as the identifier
		this.id = templateDirPath;

		// Set tooltip to show the full path
		this.tooltip = templateDirPath;

		// Set the context value for right-click menu
		this.contextValue = 'templateSource';

		// Set number of templates as description
		this.description = `(${templates.length} templates)`;

		// Set a folder icon
		this.iconPath = new vscode.ThemeIcon('folder');
	}
}

/**
 * Tree data provider for template explorer
 */
export class TemplateExplorerProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<
		vscode.TreeItem | undefined | null | void
	>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	constructor() {
		// Listen for configuration changes
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('global-boilerplate.templateDirectories')) {
				this.refresh();
			}
		});
	}

	/**
	 * Refresh the tree view
	 *
	 * @return void
	 */
	public refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	/**
	 * Get the tree item for a given element
	 *
	 * @return vscode.TreeItem
	 */
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	/**
	 * Get the children of a given element
	 *
	 * @param vscode.TreeItem | undefined element
	 * @return Promise<vscode.TreeItem[]>
	 */
	async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
		// Root level - show template sources
		if (!element) {
			return this.getTemplateSources();
		}

		// Template source level - show templates in source
		if (element instanceof TemplateSourceItem) {
			return this.getTemplatesForSource(element);
		}

		return [];
	}

	/**
	 * Get template sources (workspace, home, etc.)
	 *
	 * @return Promise<vscode.TreeItem[]>
	 */
	private async getTemplateSources(): Promise<vscode.TreeItem[]> {
		try {
			const directories: string[] = Settings.templateDirectories;
			const sources: TemplateSourceItem[] = [];
			const templates = getTemplates();

			// Group templates by source directory
			const templatesBySource = new Map<string, ITemplate[]>();

			for (const directory of directories) {
				const expandedDir = expandDirectory(directory);
				templatesBySource.set(expandedDir, []);
			}

			// Populate templates for each source
			for (const template of templates) {
				if (!template.path) continue;

				// Find which source directory this template belongs to
				for (const [sourceDir, sourceTemplates] of templatesBySource.entries()) {
					if (template.path.startsWith(sourceDir)) {
						sourceTemplates.push(template);
						break;
					}
				}
			}

			// Create tree items for each source
			for (const [sourceDir, sourceTemplates] of templatesBySource.entries()) {
				// Skip empty sources for cleaner UI
				if (sourceTemplates.length === 0) continue;

				// Determine display name
				let displayName = sourceDir;

				if (sourceDir.includes(process.env.HOME || '')) {
					displayName = 'Home Templates';
				} else if (vscode.workspace.rootPath && sourceDir.includes(vscode.workspace.rootPath)) {
					displayName = 'Workspace Templates';
				} else {
					displayName = path.basename(sourceDir);
				}

				sources.push(new TemplateSourceItem(displayName, sourceDir, sourceTemplates, vscode.TreeItemCollapsibleState.Expanded));
			}

			return sources;
		} catch (error) {
			VsCodeHelper.log(`Error getting template sources: ${(error as Error).message}`);
			return [];
		}
	}

	/**
	 * Get templates for a given source
	 *
	 * @param sourceItem TemplateSourceItem
	 * @return vscode.TreeItem[]
	 */
	private getTemplatesForSource(sourceItem: TemplateSourceItem): vscode.TreeItem[] {
		return sourceItem.templates.map((template) => new TemplateItem(template.name, template, vscode.TreeItemCollapsibleState.None));
	}
}

/**
 * Registers the template explorer view with VS Code
 *
 * @param context vscode.ExtensionContext
 * @return void
 */
export function registerTemplateExplorer(context: vscode.ExtensionContext): void {
	const templateExplorerProvider = new TemplateExplorerProvider();

	// Register tree data provider
	const view = vscode.window.createTreeView('templateExplorer', {
		treeDataProvider: templateExplorerProvider,
		showCollapseAll: true,
	});

	// Register command to refresh the tree view
	context.subscriptions.push(
		vscode.commands.registerCommand('global-boilerplate.refreshTemplates', () => {
			templateExplorerProvider.refresh();
		}),
	);

	// Register command to open template folder
	context.subscriptions.push(
		vscode.commands.registerCommand('global-boilerplate.openTemplate', (template: ITemplate) => {
			if (template.path) {
				vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(template.path), {
					forceNewWindow: true,
				});
			}
		}),
	);

	// Keep track of the view in extension context
	context.subscriptions.push(view);
}
