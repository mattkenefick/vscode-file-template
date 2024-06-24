import * as fs from 'fs';
import * as vscode from 'vscode';
import Settings from '../config/settings';
import VsCodeHelper from '../utility/vscode-helper';
import { assignVariables, getVariables, ensureDirectoryExistence, expandDirectory } from '../common/helper';
import { exec } from 'child_process';

/**
 * @param vscode.Uri search
 * @return Promise<void>
 */
export default async function newTemplate(): Promise<void> {
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
	const templateName = (await vscode.window.showInputBox({ prompt: 'What would you like to call it? (e.g. My Angular Boilerplate)' })) as string;

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

	VsCodeHelper.log(`Creating: ${directory}/${templateSlug}`);

	// Create folders
	ensureDirectoryExistence(`${directory}/${templateSlug}/manifest.json`);
	ensureDirectoryExistence(`${directory}/${templateSlug}/src/example.txt`);

	// Create files
	const variables = getVariables();
	fs.writeFileSync(`${directory}/${templateSlug}/manifest.json`, `{ "name": "${templateName}", "rootDir": "src" }`);
	fs.writeFileSync(
		`${directory}/${templateSlug}/src/example.txt`,
		`
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
`,
	);

	// Open new editor at directory
	exec(`code ${directory}/${templateSlug}`);
}
