import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { assignVariables, ensureDirectoryExistence, expandDirectory } from './helper';
import { exec } from 'child_process';

/**
 * @param vscode.Uri search
 * @return Promise<void>
 */
export async function newTemplate(): Promise<void> {
	const directories: string[] = Settings.templateDirectories;

	// Ask user which template to use
	const directoryName: string = (await vscode.window.showQuickPick(directories, { placeHolder: 'Which folder to store template...' })) as string;

	// Check if we have a template
	if (!directoryName) {
		vscode.window.showErrorMessage('No directory was selected. Please try again.');
		return;
	}

	// Find template based off selection
	const directory: string = expandDirectory(directoryName);

	// Ensure exists
	ensureDirectoryExistence(directory);

	// Ask user for the template name
	const templateName: string = (await vscode.window.showInputBox({ prompt: 'What is the template name?' })) as string;

	// Check if we have a template
	if (!templateName) {
		vscode.window.showErrorMessage('No template name was entered. Please try again.');
		return;
	}

	// Folder slug
	const templateSlug: string = templateName.toLowerCase().replace(/ /g, '-').replace(/"/g, '');

	// Check if folder exists already
	if (fs.existsSync(`${directory}/${templateSlug}`)) {
		vscode.window.showErrorMessage(`Template already exists. Please try again.`);
		return;
	}

	VsCodeHelper.log(`Creating: ${directory}/${templateSlug}`);

	// Create folder
	ensureDirectoryExistence(`${directory}/${templateSlug}/manifest.json`);
	ensureDirectoryExistence(`${directory}/${templateSlug}/src/example.txt`);

	// Create files
	fs.writeFileSync(`${directory}/${templateSlug}/manifest.json`, `{ "name": "${templateName}", "rootDir": "src" }`);
	fs.writeFileSync(`${directory}/${templateSlug}/src/example.txt`, `Hello World\n@see https://marketplace.visualstudio.com/items?itemName=PolymerMallard.new-from-template`);

	// Open new editor at directory
	exec(`code ${directory}/${templateSlug}`);
}
