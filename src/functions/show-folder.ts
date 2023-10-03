import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { assignVariables, expandDirectory } from './helper';
import { exec } from 'child_process';

/**
 * @param vscode.Uri search
 * @return Promise<void>
 */
export async function showFolder(): Promise<void> {
	const directories: string[] = Settings.templateDirectories;

	// Ask user which template to use
	const directoryName: string = (await vscode.window.showQuickPick(directories, { placeHolder: 'Select a folder...' })) as string;

	// Find template based off selection
	const directory: string = expandDirectory(directoryName);

	// Check if we have a template
	if (!directory) {
		vscode.window.showErrorMessage('No directory was selected. Please try again.');
		return;
	}

	// Open new editor at directory
	exec(`code ${directory}`);
}
