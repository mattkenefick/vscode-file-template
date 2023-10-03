import * as vscode from 'vscode';
import { generateTemplate } from './functions/generate-template';
import { newTemplate } from './functions/new-template';
import { showFolder } from './functions/show-folder';

/**
 * @param ExtensionContract context
 * @return void
 */
export function activate(context: vscode.ExtensionContext) {
	let disposable;

	disposable = vscode.commands.registerCommand('new-from-template.generateTemplate', async (search) => generateTemplate(search));
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('new-from-template.showFolder', async () => showFolder());
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('new-from-template.newTemplate', async () => newTemplate());
	context.subscriptions.push(disposable);
}

/**
 * @return void
 */
export function deactivate() {}
