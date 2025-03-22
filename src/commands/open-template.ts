import * as vscode from 'vscode';
import VsCodeHelper from '../utility/vscode-helper';
import { ITemplate } from '../interface';

/**
 * Opens a template in a new window
 *
 * @param template The template to open
 * @return Promise<void>
 */
export default async function openTemplate(template: ITemplate): Promise<void> {
	try {
		if (!template.path) {
			throw new Error('Template has no path');
		}

		// Open the template folder in a new window
		await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(template.path), {
			forceNewWindow: true,
		});
	} catch (error) {
		VsCodeHelper.log(`Error opening template: ${(error as Error).message}`);
		vscode.window.showErrorMessage(`Failed to open template: ${(error as Error).message}`);
	}
}
