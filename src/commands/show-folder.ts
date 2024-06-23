import * as vscode from 'vscode';
import Settings from '../config/settings';
import { exec } from 'child_process';
import { expandDirectory } from '../common/helper';

/**
 * Opens a new VSCode editor at the selected directory
 *
 * @param string placeholder
 * @return Promise<void>
 */
export default async function showFolder(placeholder: string = 'Select a folder...'): Promise<void> {
	const directories = Settings.templateDirectories;
	const directoryName = (await vscode.window.showQuickPick(directories, { placeHolder: placeholder })) as string;
	const directory = expandDirectory(directoryName);

	if (!directory) {
		vscode.window.showErrorMessage('No directory was selected. Please try again.');
		return;
	}

	// Open in Finder
	// const directoryUri = vscode.Uri.file(directory);
	// await vscode.env.openExternal(directoryUri);

	// Open in Code
	exec(`code ${directory}`, (error, stdout, stderr) => {
		if (error) {
			vscode.window.showErrorMessage(`Failed to open workspace: ${stderr}`);
			return;
		}

		vscode.window.showInformationMessage(`Opened new workspace at ${directory}`);
	});
}
