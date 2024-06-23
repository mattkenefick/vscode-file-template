import * as fs from 'fs';
import * as vscode from 'vscode';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import fetch from 'node-fetch';
import { assignVariables, getVariables, ensureDirectoryExistence, expandDirectory } from '../common/helper';
import { exec } from 'child_process';

/**
 * @param vscode.Uri search
 * @return Promise<void>
 */
export default async function importTemplate(): Promise<void> {
	const directories: string[] = Settings.templateDirectories;

	const directoryName = (await vscode.window.showQuickPick(directories, {
		placeHolder: 'Where would you like to save this boilerplate?',
	})) as string;

	// Check if we have a template
	if (!directoryName) {
		vscode.window.showErrorMessage('No directory was selected. Please try again.');
		return;
	}

	// Determine fully qualified path for directory based off name
	const directory = expandDirectory(directoryName);

	// Ensure the directory exists
	ensureDirectoryExistence(directory);

	// Ask user for the template name
	const templateName = (await vscode.window.showInputBox({
		prompt: 'What would you like to call it? (e.g. My Angular Boilerplate)',
	})) as string;

	// Exit if we don't have a template input from user
	if (!templateName) {
		vscode.window.showErrorMessage('No template name was entered. Please try again.');
		return;
	}

	// Folder slug
	const templateSlug = templateName.toLowerCase().replace(/ /g, '-').replace(/"/g, '');

	// Exit if there's a template with the same name
	if (fs.existsSync(`${directory}/${templateSlug}`)) {
		vscode.window.showErrorMessage(`Boilerplate '${templateSlug}' already exists at ${directory}.`);
		return;
	}

	// Ask user for the template name
	const importUrl = (await vscode.window.showInputBox({
		prompt: 'Paste the URL to your gist. (e.g. github.com/username/abcdefgh...)',
	})) as string;

	// Exit if we don't have a template input from user
	if (!importUrl) {
		vscode.window.showErrorMessage('No gist URL entered. Please try again.');
		return;
	}

	// Get gist
	const regexMatch = importUrl.match(/([a-z0-9]{25,})/);

	// Exit if we don't have a good URL
	if (!regexMatch) {
		vscode.window.showErrorMessage('Invalid gist URL. Please try again.');
		return;
	}

	// Create folders
	ensureDirectoryExistence(`${directory}/${templateSlug}/manifest.json`);
	fs.writeFileSync(`${directory}/${templateSlug}/manifest.json`, `{ "name": "${templateName}", "rootDir": "src" }`);

	// Iterate through files
	try {
		const importId = regexMatch[0];
		const apiUrl = `https://api.github.com/gists/${importId}`;
		const response = await fetch(apiUrl);

		if (!response.ok) {
			vscode.window.showErrorMessage('Faild to fetch gist.');
			return;
		}

		const gistData = (await response.json()) as any;

		if (!gistData.files) {
			vscode.window.showErrorMessage('Gist does not contain any files.');
			return;
		}

		const files = gistData.files;
		let filename: string, fileInfo: any;

		// Iterate over the files and log their content
		for ([filename, fileInfo] of Object.entries(files)) {
			ensureDirectoryExistence(`${directory}/${templateSlug}/src/${filename}`);
			fs.writeFileSync(`${directory}/${templateSlug}/src/${filename}`, fileInfo.content);
		}
	} catch (error) {
		console.error('Error fetching Gist files:', error);
	}

	// Open new editor at directory
	exec(`code ${directory}/${templateSlug}`);
}
