import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { ensureDirectoryExistence, expandDirectory, getVariables } from '../common/helper';
import { exec } from 'child_process';
import { promisify } from 'util';

/**
 * Creates a new template boilerplate
 *
 * @return Promise<void>
 */
export default async function newTemplate(): Promise<void> {
	try {
		// Get template directories from settings
		const directories: string[] = Settings.templateDirectories;

		if (!directories.length) {
			vscode.window.showErrorMessage('No template directories configured. Please update your settings.');
			return;
		}

		// Ask user where to save the template
		const directoryName = await vscode.window.showQuickPick(directories, {
			placeHolder: 'Where would you like to save this boilerplate?',
		});

		// Check if user cancelled or no directory was selected
		if (!directoryName) {
			return; // User cancelled, just exit silently
		}

		// Determine fully qualified path for directory based off name
		const directory = expandDirectory(directoryName);

		// Ensure the parent directory exists
		if (!fs.existsSync(directory)) {
			try {
				fs.mkdirSync(directory, { recursive: true });
				VsCodeHelper.log(`Created parent directory: ${directory}`);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to create directory: ${directory}. ${(error as Error).message}`);
				return;
			}
		}

		// Ask user for the template name
		const templateName = await vscode.window.showInputBox({
			prompt: 'What would you like to call it? (e.g. My Angular Boilerplate)',
			validateInput: (input) => {
				return input.trim() ? null : 'Template name cannot be empty';
			},
		});

		// Exit if user cancelled
		if (templateName === undefined) {
			return;
		}

		// Ensure we have a non-empty template name
		if (!templateName.trim()) {
			vscode.window.showErrorMessage('Template name cannot be empty. Please try again.');
			return;
		}

		// Create safe folder slug
		const templateSlug = createSafeSlug(templateName);
		const templatePath = path.join(directory, templateSlug);

		// Check if template with the same name already exists
		if (fs.existsSync(templatePath)) {
			const overwrite = await vscode.window.showWarningMessage(
				`Boilerplate '${templateSlug}' already exists at ${directory}. Overwrite?`,
				{ modal: true },
				'Yes',
				'No',
			);

			if (overwrite !== 'Yes') {
				return;
			}

			// Delete existing directory
			try {
				deleteFolderRecursive(templatePath);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to remove existing template: ${(error as Error).message}`);
				return;
			}
		}

		VsCodeHelper.log(`Creating template: ${templatePath}`);

		// Create template structure
		try {
			// Create folders
			ensureDirectoryExistence(path.join(templatePath, 'manifest.json'));
			ensureDirectoryExistence(path.join(templatePath, 'src', 'example.txt'));

			// Get variables
			const variables = getVariables();

			// Create manifest.json
			const manifestContent = JSON.stringify(
				{
					author: 'Your Name',
					created: new Date().toISOString(),
					description: 'Created ' + new Date().toISOString(),
					name: templateName,
					rootDir: 'src',
					tags: ['example', 'boilerplate'],
					version: '0.1.0',
				},
				null,
				4,
			);

			fs.writeFileSync(path.join(templatePath, 'manifest.json'), manifestContent);
			fs.writeFileSync(path.join(templatePath, 'src', 'example.txt'), generateExampleContent(variables));

			// Success message
			vscode.window.showInformationMessage(`Template '${templateName}' created successfully`);

			// Open new editor at directory
			try {
				await promisify(exec)(`code "${templatePath}"`);
			} catch (error) {
				// If opening fails, just show where it was created
				vscode.window.showInformationMessage(`Template created at: ${templatePath}`);
			}
		} catch (error) {
			VsCodeHelper.log(`Error creating template: ${(error as Error).message}`);
			vscode.window.showErrorMessage(`Failed to create template: ${(error as Error).message}`);
		}
	} catch (error) {
		VsCodeHelper.log(`Error in newTemplate: ${(error as Error).message}`);
		vscode.window.showErrorMessage(`An error occurred: ${(error as Error).message}`);
	}
}

/**
 * Creates a safe slug from a string
 *
 * @param input The string to convert to a slug
 * @return A safe slug
 */
function createSafeSlug(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
		.replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Recursively deletes a folder and its contents
 *
 * @param folderPath The path to delete
 */
function deleteFolderRecursive(folderPath: string): void {
	if (fs.existsSync(folderPath)) {
		fs.readdirSync(folderPath).forEach((file) => {
			const curPath = path.join(folderPath, file);

			if (fs.lstatSync(curPath).isDirectory()) {
				// Recursive call
				deleteFolderRecursive(curPath);
			} else {
				// Delete file
				fs.unlinkSync(curPath);
			}
		});

		// Delete the empty directory
		fs.rmdirSync(folderPath);
	}
}

/**
 * Generates the content for the example template file
 *
 * @param variables The variables to display in the example
 * @return The example file content
 */
function generateExampleContent(variables: Record<string, string>): string {
	return `
Hello World
@see https://marketplace.visualstudio.com/items?itemName=PolymerMallard.boilerplate

-------------------------------------------------------------------------------

Evaluation Context:     (within {{{ /* Your code */ }}})

{{{ variables.testVariable = 'Hello World' }}}
{{{ variables.currentTime = Date.now() }}}

variables.testVariable: "\${{ variables.testVariable }}"
variables.currentTime: "\${{ variables.currentTime }}"

-------------------------------------------------------------------------------

Evaluation Context Variables:      (within \${{ /* ... */ }})

${Object.entries(variables)
	.map(([key, value]) => `variables.${key.replace(/[\$\{\}]/gi, '').replace(/[\.\_]/gi, '_')}: "${value}"`)
	.join('\n')}

Appears in a generated template.

-------------------------------------------------------------------------------

Global Variable Reference:

${Object.entries(variables)
	.map(([key, value]) => `\$${key.replace(/[\$\{\}]/, '')}: "${value}"`)
	.join('\n')}

-------------------------------------------------------------------------------

This variable reference only appears correctly when viewing the template itself,
otherwise it will render as the actual value of the variable.

You can use {filename} in your template files to create variables that will
be prompted when generating a new file from this template.
`;
}
