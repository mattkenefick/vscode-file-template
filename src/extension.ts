import * as vscode from 'vscode';
import { createTemplate } from './functions/create-template';

/**
 * @param ExtensionContract context
 * @return void
 */
export function activate(context: vscode.ExtensionContext) {
	let disposable;

	disposable = vscode.commands.registerCommand('file-template.createTemplate', async (search) => createTemplate(search));
	context.subscriptions.push(disposable);
}

/**
 * @return void
 */
export function deactivate() {}
